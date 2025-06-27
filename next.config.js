/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    forceSwcTransforms: true,
  },
  // Configurações para resolver problemas de RSC
  transpilePackages: ['@supabase/supabase-js'],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
  // Configurações para assets estáticos
  assetPrefix: process.env.NODE_ENV === 'production' ? undefined : '',
  // Configurações para roteamento
  trailingSlash: false,
  // Configurações para otimização
  poweredByHeader: false,
  compress: true,
};

module.exports = nextConfig;