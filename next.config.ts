import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // The learning UI remains a static export. Optional Google progress sync is
  // handled separately by Cloudflare Pages Functions and D1.
  output: "export",
  images: { unoptimized: true },
  // Pin the workspace root, otherwise Turbopack walks up and finds a stray
  // package-lock.json in the home directory.
  turbopack: { root: path.resolve(process.cwd()) },
};

export default nextConfig;
