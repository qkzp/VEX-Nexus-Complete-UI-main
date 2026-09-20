import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { z } from "zod";
import type { JWT } from "next-auth/jwt";
import { prisma } from "@/lib/db";
import { verifyUserCredentials } from "@/lib/auth/accounts";

const credentialsSchema = z.object({
  identifier: z.string().trim().min(3).max(120),
  password: z.string().min(8).max(200),
});

async function enrichToken(token: JWT) {
  if (!token.sub) return token;

  const accountUser = await prisma.user.findUnique({
    where: { id: token.sub },
    select: {
      email: true,
      name: true,
      username: true,
      displayName: true,
      profile: {
        select: {
          onboardingCompletedAt: true,
        },
      },
    },
  });

  if (!accountUser) return token;

  token.email = accountUser.email ?? token.email;
  token.name = accountUser.displayName ?? accountUser.name ?? token.name ?? accountUser.email;
  token.username = accountUser.username ?? null;
  token.onboardingComplete = Boolean(accountUser.profile?.onboardingCompletedAt);
  return token;
}

function resolveAuthSecret() {
  const configuredSecret = process.env.AUTH_SECRET?.trim() || process.env.NEXTAUTH_SECRET?.trim();
  if (configuredSecret) return configuredSecret;

  if (process.env.NEXT_PHASE === "phase-production-build") return "build-time-auth-secret-placeholder";

  console.error("AUTH_SECRET (or NEXTAUTH_SECRET) is not configured. Authentication will not be stable until it is set.");
  return "missing-auth-secret-placeholder-set-auth-secret-in-vercel";
}

function authLogMetadata(metadata: unknown) {
  return JSON.stringify(metadata, (_key, value) => {
    if (typeof value !== "string") return value;
    if (value.includes("@")) return "[redacted-email]";
    if (value.length > 180) return `${value.slice(0, 180)}...`;
    return value;
  });
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  secret: resolveAuthSecret(),
  session: { strategy: "jwt" },
  trustHost: true,
  pages: { signIn: "/login" },
  logger: {
    error(error) {
      console.error("[auth:error]", authLogMetadata(error));
    },
    warn(code) {
      console.warn("[auth:warn]", code);
    },
    debug(code, metadata) {
      if (process.env.NODE_ENV !== "development") return;
      console.debug("[auth:debug]", code, metadata ? authLogMetadata(metadata) : "");
    },
  },
  providers: [
    Credentials({
      name: "Email and password",
      credentials: {
        identifier: { label: "Email or username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(rawCredentials) {
        const parsed = credentialsSchema.safeParse(rawCredentials);
        if (!parsed.success) throw new CredentialsSignin("Invalid credential payload.");
        const user = await verifyUserCredentials(parsed.data.identifier, parsed.data.password);
        if (!user) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? user.email,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) token.sub = user.id;
      return enrichToken(token);
    },
    async session({ session, token }) {
      const enrichedToken = await enrichToken(token);

      session.user = {
        ...session.user,
        id: enrichedToken.sub ?? "",
        email: enrichedToken.email ?? session.user.email,
        name: typeof enrichedToken.name === "string" ? enrichedToken.name : session.user.name,
        username: typeof enrichedToken.username === "string" ? enrichedToken.username : null,
        onboardingComplete: Boolean(enrichedToken.onboardingComplete),
      };
      return session;
    },
  },
  events: {
    async signIn({ user, account }) {
      console.info(
        "[auth:signIn]",
        authLogMetadata({ userId: user.id, provider: account?.provider ?? "credentials", at: new Date().toISOString() }),
      );
    },
    async signOut(event) {
      console.info("[auth:signOut]", authLogMetadata({ session: "token" in event ? "jwt" : "database", at: new Date().toISOString() }));
    },
  },
});
