/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ['mongoose'],
  },
  output: 'standalone',
  images: {
    domains: ['localhost'],
  },
};

export default nextConfig;
