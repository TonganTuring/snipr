import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.googleusercontent.com',
        pathname: '/**',
      }
    ],
  },
  webpack: (config, { isServer }) => {
    // Add a fallback for the ffmpeg module
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      'fs-extra': false,
    };

    return config;
  },
  serverExternalPackages: ['fs-extra']
};

export default nextConfig;
