import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'xlagwtsrjbylhxfozoem.supabase.co' },
    ],
  },
};

export default nextConfig;
