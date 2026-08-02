import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { fetchRecentObservations } from "@/lib/observations";
import { buildHeroOneLiner } from "@/lib/one-liner";

export const runtime = "nodejs";

export const alt = "wy2z — three plants, one row of data";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  const obs = (await fetchRecentObservations(1))[0] ?? null;
  // photo_url is a local /plant-photos/... path now — ImageResponse can't
  // resolve relative URLs, so inline the file as a data URI. Rendered once
  // at build time (route is fully static), so the sync read is fine.
  const photoSrc = obs?.photo_url
    ? `data:image/jpeg;base64,${readFileSync(
        join(process.cwd(), "public", obs.photo_url),
      ).toString("base64")}`
    : null;
  const oneLiner = obs
    ? buildHeroOneLiner({
        verdict: obs.verdict,
        airTempC: obs.air_temp_c,
        airHumidityPct: obs.air_humidity_pct,
      })
    : "Three plants. Five weeks. One Pi.";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#0f172a", // slate-900
          color: "#f8fafc", // slate-50
          fontFamily: "Georgia, serif",
        }}
      >
        {/* Left: latest photo */}
        {photoSrc ? (
          <div
            style={{
              width: "55%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#020617", // slate-950
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photoSrc}
              alt=""
              width={660}
              height={630}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>
        ) : (
          <div
            style={{
              width: "55%",
              height: "100%",
              background: "#1e293b", // slate-800
            }}
          />
        )}

        {/* Right: title + one-liner */}
        <div
          style={{
            width: "45%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "60px 56px",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 18,
              letterSpacing: 4,
              textTransform: "uppercase",
              color: "#64748b", // slate-500
              fontFamily: "ui-monospace, monospace",
            }}
          >
            wy2z · archive
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 24,
            }}
          >
            <div
              style={{
                fontSize: 52,
                lineHeight: 1.1,
                letterSpacing: "-0.02em",
                fontWeight: 500,
                color: "#f8fafc",
              }}
            >
              {oneLiner}
            </div>
            <div
              style={{
                width: 60,
                height: 3,
                background: "#8aaf8a", // leaf accent
              }}
            />
          </div>

          <div
            style={{
              display: "flex",
              fontSize: 18,
              color: "#94a3b8", // slate-400
              fontStyle: "italic",
            }}
          >
            A four-device plant lab. Twice a day, forever.
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
