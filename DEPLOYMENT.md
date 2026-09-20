# PitRelay Deployment

## Production prerequisites

1. Set a real production database in `DATABASE_URL`.
2. Set `NEXT_PUBLIC_APP_URL`, `AUTH_URL`, and optionally `NEXTAUTH_URL` to the same HTTPS domain, or let Vercel provide `VERCEL_PROJECT_PRODUCTION_URL`.
3. Set a strong random `AUTH_SECRET`.
4. Keep `ALLOW_DEV_RESET="false"` in production.
5. Configure SMTP so password reset email can be delivered.
6. Configure `VEX_EVENTS_API_TOKEN` so official VEX Events data is enabled.

## Vercel environment setup

Add these variables in the Vercel project settings before the first production deploy:

```bash
POSTGRES_PRISMA_URL=postgresql://USER:PASSWORD@HOST:5432/vex_nexus?sslmode=require
POSTGRES_URL_NON_POOLING=postgresql://USER:PASSWORD@HOST:5432/vex_nexus?sslmode=require
NEXT_PUBLIC_APP_URL=https://your-project.vercel.app
AUTH_URL=https://your-project.vercel.app
NEXTAUTH_URL=https://your-project.vercel.app
AUTH_TRUST_HOST=true
AUTH_SECRET=replace-with-a-long-random-secret
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=resend
SMTP_PASSWORD=replace-with-your-smtp-password
EMAIL_FROM=PitRelay <no-reply@your-project.vercel.app>

# Keep local-only developer tooling disabled in production.
ENABLE_LOCAL_DEV_TOOLS=false
VEX_EVENTS_API_TOKEN=replace-with-your-vex-events-token
```

When you use the Vercel Neon integration, prefer:

- `POSTGRES_PRISMA_URL` for Prisma client queries
- `POSTGRES_URL_NON_POOLING` for Prisma direct connections and migrations

You can ignore `DATABASE_URL` in production if those Neon variables are present.

If you attach a custom domain, update `NEXT_PUBLIC_APP_URL`, `AUTH_URL`, and any `NEXTAUTH_URL` value to that exact HTTPS domain.

## Publish check

Run:

```bash
npm run publish:check
```

This script checks:

- required auth/database env vars
- production-safe URLs, including Vercel-provided deployment URLs
- dev reset being disabled
- optional SMTP setup
- optional VEX Events setup

## Build verification

Run:

```bash
npm run build:live
```

## Notes

- If SMTP is not configured, the app keeps password reset unavailable in production instead of fabricating delivery.
- If `VEX_EVENTS_API_TOKEN` is not configured, official VEX event features stay explicitly unavailable.
- Vercel can expose `VERCEL_PROJECT_PRODUCTION_URL` and `VERCEL_URL`; the app and readiness script now accept those as production URL fallbacks.
