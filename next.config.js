/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "mkbeonizkvrzjqihhcmg.supabase.co",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
      {
        protocol: "https",
        hostname: "via.placeholder.com",
      },
      {
        protocol: "https",
        hostname: "yunshsmpcwtbkggujsem.supabase.co",
      },
      {
        protocol: "https",
        hostname: "cddnlaekxujeuujifcgy.supabase.co",
      },
    ],
  },
  // Server Action 바디 크기 제한 증가 (기본 1MB → 15MB)
  experimental: {
    serverActions: {
      bodySizeLimit: "15mb",
    },
  },
};

module.exports = nextConfig;
