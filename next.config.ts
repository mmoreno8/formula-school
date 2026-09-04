import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Static export. The app has no server-side anything: no route handlers,
  // no server actions, no middleware, no database. See BRIEF.md section 4.
  output: "export",
  images: { unoptimized: true },
  // Pin the workspace root, otherwise Turbopack walks up and finds a stray
  // package-lock.json in the home directory.
  turbopack: { root: path.resolve(process.cwd()) },
};

export default nextConfig;
