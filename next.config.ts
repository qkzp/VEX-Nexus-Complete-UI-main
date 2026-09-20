import type { NextConfig } from "next";

// VEX Nexus now uses server routes for authenticated workspaces, database access,
// and server-only VEX Events credentials. Static export cannot support those
// guarantees. Set NEXT_STANDALONE=true only for a self-hosted production image.
const nextConfig: NextConfig = {
  ...(process.env.NEXT_STANDALONE === "true" ? { output: "standalone" } : {}),
  poweredByHeader: false,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "content.vexrobotics.com", pathname: "/docs/2026-2027/override/**" },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
