import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,  
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/media/**',
      },
    ],
    domains: ['localhost'],
    unoptimized: true,  // ✅ Necesario para imágenes exportadas
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
 
};

export default nextConfig;
