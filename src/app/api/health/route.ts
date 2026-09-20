import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

function configured(name: string) {
  return Boolean(process.env[name]?.trim());
}

export async function GET() {
  const checks = {
    authSecret: configured("AUTH_SECRET") || configured("NEXTAUTH_SECRET"),
    databaseUrl: configured("POSTGRES_PRISMA_URL") || configured("DATABASE_URL"),
    directDatabaseUrl: configured("POSTGRES_URL_NON_POOLING") || configured("DATABASE_URL_UNPOOLED"),
    authUrl: configured("AUTH_URL") || configured("NEXTAUTH_URL"),
    appUrl: configured("NEXT_PUBLIC_APP_URL"),
    databaseReachable: false,
    prismaTablesReady: false,
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.databaseReachable = true;
    await prisma.user.count();
    checks.prismaTablesReady = true;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown database error.";
    return Response.json(
      {
        ok: false,
        checks,
        error: message.replace(/postgresql:\/\/[^@\s]+@/gi, "postgresql://[redacted]@"),
      },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  return Response.json({ ok: Object.values(checks).every(Boolean), checks }, { headers: { "Cache-Control": "no-store" } });
}
