# BoltCanvas codebase guide

This project is a Next.js app for VEX robotics teams. The browser renders the
workspace, server actions save changes, and Prisma stores the shared team data.

## Start here

- `src/app/page.tsx` is the first page. It decides whether the visitor should
  see login, onboarding, or the workspace.
- `src/app/layout.tsx` is the global page wrapper. It loads the global CSS and
  metadata.
- `src/proxy.ts` protects signed-in routes before a page is rendered.
- `src/app/(workspace)/layout.tsx` loads the signed-in user and active team,
  then renders `src/components/app/workspace-shell.tsx` around each workspace
  page.

## Where pages live

Pages are grouped by their URL under `src/app`:

- `src/app/(auth)/` contains login, registration, and password reset.
- `src/app/(workspace)/` contains the signed-in robotics tools.
- `src/app/api/` contains small HTTP endpoints, including health checks and
  official VEX Events requests.
- `src/app/onboarding/` and `src/app/team/` contain setup and team management.

The parentheses in folder names are Next.js route groups. They organize files
without adding those folder names to the URL.

## Where visible UI lives

Reusable UI is in `src/components`:

- `src/components/app/` contains workspace screens and controls.
- `src/components/auth/` contains account forms and the login layout.
- `src/components/team/` contains team setup, member, and invite controls.
- `src/components/ui/` contains small shared controls such as pending buttons.

Most page files load data and pass it into a component. The component then
renders the page and links to the next action.

## How data changes are saved

Files in `src/lib/actions/` are server actions. A form submits to one of these
functions, the function validates `FormData` with Zod, checks the signed-in
user's permissions, writes to Prisma, and revalidates the affected pages.

- `src/lib/actions/auth.ts` handles account and onboarding changes.
- `src/lib/actions/team.ts` handles teams, invites, members, and permissions.
- `src/lib/actions/workspace.ts` handles robots, hardware, tests, tasks, logs,
  notebook entries, and autonomous work.
- `src/lib/actions/forum.ts` handles forum posts and replies.

When adding a form, follow this order:

1. Add or update a Zod schema near the action.
2. Read values from `FormData`.
3. Check the current user and team permission.
4. Write through `prisma`.
5. Call `revalidatePath` so the UI shows the saved result.
6. Return a small `{ success, error, entityId }` result for the form.

## Database and permissions

- `prisma/schema.prisma` is the source of truth for database models and enums.
- `src/lib/db.ts` creates the shared Prisma client and translates common
  database failures into useful messages.
- `src/lib/authz.ts` identifies the current user and enforces account access.
- `src/lib/workspace/data.ts` resolves the active team and checks team roles.
- `src/lib/teams/service.ts` contains team creation and invitation rules.

Keep authorization close to the server action. A page hiding a button is not a
permission check; the action must check access again before writing.

## Robotics logic

The VEX-specific code is kept separate from React and database code:

- `src/lib/robot-engine.ts` validates device ports, controller mappings, motor
  setup, drivetrain settings, and gear ratios.
- `src/lib/vex-hardware.ts` contains supported VEX V5 hardware options.
- `src/lib/vex-codegen.ts` turns a validated robot configuration into code.
- `src/lib/autonomous.ts` handles autonomous route calculations and checks.

These modules are mostly pure functions. They are the safest place to add or
test a calculation because they do not need a browser, database, or session.

## Shared workspace data

`src/lib/workspace/data.ts` loads team-owned records for dashboard and tools.
`src/lib/workspace/dashboard-summary.ts` converts those records into the
readiness checks and next-action panel shown by
`src/components/app/dashboard.tsx`.
`src/lib/workspace/task-queue.ts` contains task filtering and sorting rules.
`src/lib/workspace/state.ts` stores smaller shared workspace payloads that do
not need their own relational table yet.

## External VEX Events data

`src/lib/services/vex-events/` is a server-only client for the official VEX
Events API. It validates the base URL, keeps the API token on the server,
limits request time, caches responses, and returns safe error states.
The route handlers under `src/app/api/vex-events/` expose only the data the UI
needs.

## Styling

- `src/app/globals.css` contains the broad application styles.
- `src/app/productivity.css` contains workspace layout and responsive styles.
- Component-specific CSS modules live beside their components.

Use the existing class names and spacing tokens before adding new styling.

## Verification

Run these checks after behavior changes:

```sh
npm run lint
npx tsc --noEmit
npm test
```

The current test suite focuses on robot calculations, code-generation safety,
dashboard decisions, task filtering, redirect safety, and team synchronization.
