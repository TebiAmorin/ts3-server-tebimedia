import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["ts3-nodejs-library"],
};

export default nextConfig;
