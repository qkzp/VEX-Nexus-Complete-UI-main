import type { NextConfig } from "next";

const configuredDevOrigins = process.env.NEXT_ALLOWED_DEV_ORIGINS
  ?.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

// BoltCanvas uses server routes for authenticated workspaces, database access,
// and server-only VEX Events credentials. Static export cannot support those
// guarantees. Set NEXT_STANDALONE=true only for a self-hosted production image.
const nextConfig: NextConfig = {
  ...(process.env.NEXT_STANDALONE === "true" ? { output: "standalone" } : {}),
  // This is read only by `next dev`; the override accommodates a changed LAN address.
  allowedDevOrigins: configuredDevOrigins?.length ? configuredDevOrigins : ["192.168.86.250"],
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
