/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    forceSwcTransforms: true,
    // Otimizações para Vercel - removido @supabase/supabase-js para evitar conflito
    serverComponentsExternalPackages: [],
  },
  // Configurações para resolver problemas de RSC
  transpilePackages: [],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
      };
    }
    
    // Otimizações para Vercel
    config.externals = config.externals || [];
    if (isServer) {
      config.externals.push('@supabase/supabase-js');
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
  // Configurações para Vercel
  output: 'standalone',
  // Configurações de cache
  generateEtags: false,
  // Configurações de headers
  async headers() {
    return [
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
        ],
      },
    ];
  },
  // Configurações de redirecionamento
  async redirects() {
    return [];
  },
  // Configurações de rewrites
  async rewrites() {
    return [];
  },
};

module.exports = nextConfig;