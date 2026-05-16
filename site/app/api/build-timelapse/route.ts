// Rebuild the plant timelapse MP4 from every photo in the `observations`
// table and upload it to the `plant-photos` Supabase bucket as a single
// object. Designed to run from Vercel Cron — but also invokable via curl
// with the same bearer token for first-run backfill or manual rebuilds.
//
// Why a route and not a Pi-side script: Paul is out of town and can't
// touch the Pi for the duration of the unattended run. This keeps the
// timelapse fresh without any device-side change.

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import { spawn } from "node:child_process";
import { mkdir, writeFile, rm, readFile, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";

const BUCKET = "plant-photos";
const VIDEO_OBJECT = "timelapse.mp4";
const FRAME_RATE = 10; // 10 fps — ~20s clip at 200 frames

function unauthorized(reason: string) {
  return NextResponse.json({ error: "unauthorized", reason }, { status: 401 });
}

async function downloadFrame(url: string, dest: string): Promise<void> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`fetch ${url} → ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(dest, buf);
}

function runFfmpeg(args: string[]): Promise<{ stderr: string }> {
  return new Promise((resolve, reject) => {
    const proc = spawn(ffmpegInstaller.path, args, { stdio: ["ignore", "ignore", "pipe"] });
    let stderr = "";
    proc.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    proc.on("error", reject);
    proc.on("close", (code) => {
      if (code === 0) resolve({ stderr });
      else reject(new Error(`ffmpeg exited ${code}\n${stderr.slice(-2000)}`));
    });
  });
}

export async function GET(req: Request) {
  // Vercel Cron sends `Authorization: Bearer <CRON_SECRET>` automatically.
  const expected = process.env.CRON_SECRET;
  if (!expected) return unauthorized("CRON_SECRET not configured");
  if (req.headers.get("authorization") !== `Bearer ${expected}`) {
    return unauthorized("bad token");
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json(
      { error: "supabase env missing" },
      { status: 500 },
    );
  }

  const startedAt = Date.now();
  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

  const { data: rows, error: queryError } = await admin
    .from("observations")
    .select("id, captured_at, photo_url")
    .order("captured_at", { ascending: true });

  if (queryError) {
    return NextResponse.json({ error: queryError.message }, { status: 500 });
  }
  const frames = (rows ?? []).filter((r) => r.photo_url);
  if (frames.length === 0) {
    return NextResponse.json({ ok: false, reason: "no photos yet" });
  }

  const workDir = join(tmpdir(), `wy2z-timelapse-${process.pid}-${Date.now()}`);
  await mkdir(workDir, { recursive: true });

  try {
    // Download all frames in parallel, but bounded so we don't OOM the
    // function on a long history. Batches of 8 is a comfortable balance
    // between throughput and memory residency.
    const BATCH = 8;
    for (let i = 0; i < frames.length; i += BATCH) {
      const slice = frames.slice(i, i + BATCH);
      await Promise.all(
        slice.map((row, j) => {
          const idx = i + j;
          const dest = join(workDir, `frame-${String(idx).padStart(5, "0")}.jpg`);
          return downloadFrame(row.photo_url, dest);
        }),
      );
    }

    const outPath = join(workDir, "out.mp4");
    // Force every frame onto a uniform 1280x960 canvas with black bars so
    // portrait + landscape frames coexist without stretching. yuv420p +
    // even dims keep iOS/Safari happy.
    const vf = "scale=1280:960:force_original_aspect_ratio=decrease,pad=1280:960:(ow-iw)/2:(oh-ih)/2:color=black,setsar=1";
    const downloadedMs = Date.now() - startedAt;

    await runFfmpeg([
      "-y",
      "-framerate", String(FRAME_RATE),
      "-i", join(workDir, "frame-%05d.jpg"),
      "-vf", vf,
      "-c:v", "libx264",
      "-preset", "veryfast",
      "-crf", "23",
      "-pix_fmt", "yuv420p",
      "-movflags", "+faststart",
      outPath,
    ]);

    const mp4 = await readFile(outPath);
    const { size } = await stat(outPath);

    const { error: uploadError } = await admin.storage
      .from(BUCKET)
      .upload(VIDEO_OBJECT, mp4, {
        contentType: "video/mp4",
        upsert: true,
        cacheControl: "300", // 5 min — gives the daily rebuild fresh CDN turnover
      });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      frame_count: frames.length,
      video_bytes: size,
      first_captured_at: frames[0].captured_at,
      last_captured_at: frames[frames.length - 1].captured_at,
      downloaded_ms: downloadedMs,
      total_ms: Date.now() - startedAt,
    });
  } finally {
    await rm(workDir, { recursive: true, force: true }).catch(() => {});
  }
}
