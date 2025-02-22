/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
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
}

module.exports = nextConfig 