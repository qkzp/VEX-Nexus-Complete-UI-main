import type { Robot } from "../../src/lib/vex-codegen.ts";

export const robot: Robot = {
  id: "test-robot", name: "Competition robot",
  configuration: {
    drivetrainType: "TANK", wheelDiameterIn: 3.25, trackWidthIn: 12,
    customProperties: { transmission: { speedMultiplier: 0.6 } }, configurationVersion: 3,
    motors: [
      { id: "left", label: "Left drive", port: 1, cartridge: "RPM_600", reversed: false, purpose: "DRIVE", customRpm: null, mechanismId: null },
      { id: "right", label: "Right drive", port: 2, cartridge: "RPM_600", reversed: true, purpose: "DRIVE", customRpm: null, mechanismId: null },
      { id: "intake", label: "123 intake", port: 3, cartridge: "RPM_200", reversed: false, purpose: "INTAKE", customRpm: null, mechanismId: null },
    ],
    sensors: [], pneumatics: [{ id: "clamp", label: "Clamp", threeWirePort: "A" }], mechanisms: [],
  },
};

export const route = { name: 'Near side "A"', startHeading: 0, startPoint: { x: 10, y: 10 }, routePoints: [{ x: 30, y: 10 }, { x: 30, y: 30 }], speed: 35, timeLimit: 15 };
