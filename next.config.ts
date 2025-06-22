import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        // 任意のホスト名を許可する（セキュリティに注意）
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
