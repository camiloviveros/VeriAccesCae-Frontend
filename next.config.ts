import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/media/**',
      },
    ],
    // Como alternativa, puedes usar domains si prefieres una configuración más simple
    domains: ['localhost'],
  },
};

export default nextConfig;