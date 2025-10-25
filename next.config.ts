import type { NextConfig } from "next";
import CopyWebpackPlugin from "copy-webpack-plugin";
import path from "path";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ui-avatars.com',
        port: '',
        pathname: '/api/**',
        search: '',
      },
      {
        protocol: 'https',
        hostname: 'khzrfwyofxqrqvelydkn.supabase.co',
        port: '',
        pathname: '/storage/v1/**',
        search: '',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.plugins.push(
        new CopyWebpackPlugin({
          patterns: [
            {
              from: path.resolve(
                __dirname,
                "node_modules/@mediapipe/tasks-vision/wasm"
              ),
              to: path.resolve(__dirname, "public/wasm"),
            },
          ],
        })
      );
    }

    return config;
  },
  // Explicitly set an empty turbopack config to allow webpack to be used
  turbopack: {},
};

export default nextConfig;
