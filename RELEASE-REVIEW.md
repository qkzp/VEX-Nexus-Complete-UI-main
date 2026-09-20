# Release review — September 20, 2026

## Implemented

- Autonomous Studio exports VEXcode Python and C++ motor movement commands using saved ports, reversals, wheel diameter, track width, and transmission ratio. It includes timed motor actions, pneumatic changes, waits, competition callbacks, braking, and a shared 15/60-second routine deadline.
- Field coordinates now cover the field interior, excluding the original image's legend. Routes support geometric playback, mirroring, keyboard-accessible coordinate editing, and downloads.
- Code Lab combines a saved robot's autonomous routine with its driver controls. Opposing hold buttons produce a combined motor command; invalid mappings, ambiguous drive sides, missing geometry, and port conflicts block generation.
- Draft reload recovery, ordered browser saves, authenticated JSON responses, and transaction-locked server merges prevent several sources of lost or falsely acknowledged saves. Different workspace sections are merged under a per-team database lock.
- Fixed homepage redirect handling and constrained account return URLs. Added Team Tasks to navigation, simplified account copy, and removed destructive database initialization from `local:prepare`.
- Updated the rules reference to Override 2.0 using the [VEX manual page](https://www.vexrobotics.com/override-manual). Version information is a checked snapshot, not a live update feed.

## Student workflow

1. Save a tank/arcade robot profile. Label each drive motor Left or Right, choose supported cartridges, and record wheel size, track width, and gearing (including direct drive).
2. Open Autonomous Studio, select that robot, place the start, set its heading, and add waypoints. Coordinates are nominal inches from the upper-left; 0 degrees faces right and positive turns are clockwise.
3. Preview the geometry, set the speed/time budget, add mechanism actions and setup notes, and save the named routine.
4. For custom driver controls, open Code Lab, select that robot, configure controls, and select the saved routine before generating. Autonomous Studio's standalone export uses Axis3/Axis2 tank controls.
5. Copy/download into a **new VEXcode text project with no auto-configured devices**. Replace `main.py` or `src/main.cpp`. Compile using VEXcode; test direction with wheels raised, then measure straight driving and turns on the field. Record results in Testing and the Notebook.

## Verification and limits

- 17 automated tests cover route geometry, generation, validation, controller mappings, pending-save recovery, and safe return URLs.
- TypeScript, ESLint, and a production Next.js build were checked. The build uses a temporary process-only authentication secret; it does not configure production.
- Edge browser checks exercised playback, mirroring, saving a routine, numeric edits, C++ download, combined driver/autonomous generation, and a 390px mobile layout. No page errors or horizontal overflow were observed. The temporary browser fixture route was removed.
- Generated Python was parsed and executed against a motor/timer test double, including a stalled-motor timeout. This is **not** VEXcode compilation or physical robot verification. C++ still needs compilation with the VEX SDK.
- Motion is encoder-based differential drive. There is no inertial correction, odometry, collision detection, parallel mechanism scheduling, or physical simulation. The geometric preview is not a duration or scoring prediction. Supported generation currently requires 11W motors with standard cartridges.
- No PostgreSQL service or account credentials were available in this checkout. Live signup/invite flows, database persistence, and the new transaction lock still require a staging smoke test. Concurrent edits to the same section remain last-write-wins; this is not a realtime collaborative editor.

## Publish blockers

Copy `.env.example` for local configuration; put actual production values in the hosting platform. Configure `POSTGRES_PRISMA_URL`, `POSTGRES_URL_NON_POOLING`, a strong `AUTH_SECRET`, and matching HTTPS app/auth URLs. Configure SMTP for password recovery and `VEX_EVENTS_API_TOKEN` for event tools.

Then run:

```sh
npm ci
npm run db:deploy
npm run test
npm run lint
npm run build
npm run publish:check
```

Before public launch, use two staging accounts to create/join a team, configure a robot, save/reload a routine, change a task, and confirm that another team cannot read or modify that workspace. Verify real password-reset email delivery and compile/test both exported languages.

API references: [Python motors](https://api.vex.com/v5/home/python/Motion/motor_and_motor_group.html), [C++ motors](https://api.vex.com/v5/home/cpp/Motors_and_MotorControllers/motor_and_motor_group.html).
