import { NextResponse } from "next/server";
import { z } from "zod";
import { checkAccountIdentityAvailability } from "@/lib/auth/accounts";
import { ensureDatabaseReady } from "@/lib/db";

const querySchema = z.object({
  username: z.string().trim().min(3).max(24),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({
    username: searchParams.get("username"),
  });

  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "Check the email or username and try again." }, { status: 400 });
  }

  try {
    await ensureDatabaseReady();
    const availability = await checkAccountIdentityAvailability(parsed.data);
    return NextResponse.json({ ok: true, normalizedUsername: availability.normalizedUsername, usernameAvailable: availability.usernameAvailable });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        message: "Account availability could not be checked right now.",
      },
      { status: 503 },
    );
  }
}
