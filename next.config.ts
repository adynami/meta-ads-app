import type { NextConfig } from "next";
import path from "path";

const metaMcpServer = path.resolve(__dirname, '../meta-mcp-server');

const nextConfig: NextConfig = {
  transpilePackages: ['meta-mcp-server'],
  serverExternalPackages: ['@modelcontextprotocol/sdk', 'zod'],
  // Turbopack needs an empty config to not error when webpack is also present
  turbopack: {},
  webpack: (config) => {
    config.resolve = config.resolve ?? {};
    config.resolve.alias = {
      ...config.resolve.alias,
      'meta-mcp-server/tools': path.join(metaMcpServer, 'dist/exports.js'),
      'meta-mcp-server/tenant-context': path.join(metaMcpServer, 'dist/tenant-context.js'),
    };
    return config;
  },
};

export default nextConfig;
