import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  //output: 'export',  // Cambiado a 'export' para exportación estática
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
    unoptimized: true,  // Necesario para exportación estática
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  trailingSlash: true,  // Importante para rutas estáticas
  // Removido experimental.outputFileTracingIncludes ya que no existe en Next.js 15
};

export default nextConfig;