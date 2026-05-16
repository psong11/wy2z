import type { NextConfig } from "next";
import createMDX from "@next/mdx";

const SUPABASE_HOST = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://invalid.local").host;
  } catch {
    return "invalid.local";
  }
})();

const nextConfig: NextConfig = {
  pageExtensions: ["ts", "tsx", "md", "mdx"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: SUPABASE_HOST,
        pathname: "/storage/v1/object/public/plant-photos/**",
      },
    ],
  },
  // @ffmpeg-installer ships a native binary per platform. Mark the package
  // external so Next doesn't try to bundle its require(), and force the
  // linux-x64 binary into the function trace for build-timelapse — without
  // this, ffmpegInstaller.path resolves to a file Vercel didn't ship.
  serverExternalPackages: ["@ffmpeg-installer/ffmpeg"],
  outputFileTracingIncludes: {
    "/api/build-timelapse": [
      "./node_modules/@ffmpeg-installer/linux-x64/**",
    ],
  },
};

const withMDX = createMDX({
  options: {
    remarkPlugins: [["remark-gfm"]],
  },
});

export default withMDX(nextConfig);
