import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    proxyClientMaxBodySize: "12mb",
  },
  serverExternalPackages: ["better-sqlite3", "mammoth", "pdf-parse"],
};

export default nextConfig;
