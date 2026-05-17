import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  distDir: ".next-build",
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
