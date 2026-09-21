"use client";

import { useMemo, useState } from "react";
import { Calculator, Gauge, MoveHorizontal, Scaling } from "lucide-react";
import {
  calculateDrivetrainSpeed,
  calculateGearRatio,
} from "@/lib/robot-engine";
import {
  VEX_V5_MOTOR_CARTRIDGES,
  VEX_V5_SPUR_GEAR_TEETH,
  VEX_V5_WHEEL_OPTIONS,
} from "@/lib/vex-hardware";

const GEAR_CENTER = 60;
const GEAR_ROOT_RADIUS = 44;
const GEAR_TIP_RADIUS = 55;
const FALLBACK_GEAR_TEETH = 24;

function positive(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function gearPoint(angle: number, radius: number) {
  return `${(GEAR_CENTER + Math.cos(angle) * radius).toFixed(2)} ${(GEAR_CENTER + Math.sin(angle) * radius).toFixed(2)}`;
}

function createGearPath(teeth: number) {
  const toothArc = (Math.PI * 2) / teeth;
  const points: string[] = [];

  for (let index = 0; index < teeth; index += 1) {
    const start = index * toothArc - Math.PI / 2;
    points.push(
      gearPoint(start, GEAR_ROOT_RADIUS),
      gearPoint(start + toothArc * 0.18, GEAR_TIP_RADIUS),
      gearPoint(start + toothArc * 0.52, GEAR_TIP_RADIUS),
      gearPoint(start + toothArc * 0.7, GEAR_ROOT_RADIUS),
    );
  }

  return `M ${points.join(" L ")} Z`;
}

function gearDiameter(teeth: number) {
  const smallestGear = VEX_V5_SPUR_GEAR_TEETH[0];
  const largestGear = VEX_V5_SPUR_GEAR_TEETH[VEX_V5_SPUR_GEAR_TEETH.length - 1];
  const scale = (teeth - smallestGear) / (largestGear - smallestGear);
  return Math.round(58 + Math.max(0, Math.min(1, scale)) * 66);
}

function formatValue(number: number | null, suffix = "", decimals = 1) {
  return number === null ? "--" : `${number.toFixed(decimals)}${suffix}`;
}

function speedSummary(speedMultiplier: number) {
  if (Math.abs(speedMultiplier - 1) < 0.001) {
    return "Direct drive at 1.00x output speed.";
  }

  return speedMultiplier < 1
    ? `Reduction at ${speedMultiplier.toFixed(2)}x output speed.`
    : `Speed increase at ${speedMultiplier.toFixed(2)}x output speed.`;
}

function GearGraphic({
  teeth,
  role,
}: {
  teeth: number | null;
  role: "Driving" | "Driven";
}) {
  const resolvedTeeth = teeth ?? FALLBACK_GEAR_TEETH;
  const isSelected = teeth !== null;
  const size = gearDiameter(resolvedTeeth);

  return (
    <div className={`gear-graphic ${role === "Driven" ? "is-driven" : ""} ${isSelected ? "" : "is-pending"}`}>
      <svg
        aria-hidden="true"
        className="gear-wheel"
        height={size}
        viewBox="0 0 120 120"
        width={size}
      >
        <path className="gear-teeth" d={createGearPath(resolvedTeeth)} />
        <circle className="gear-core" cx="60" cy="60" r="34" />
        <path className="gear-spokes" d="M60 30V90M30 60H90M38.8 38.8L81.2 81.2M81.2 38.8L38.8 81.2" />
        <circle className="gear-bore" cx="60" cy="60" r="8" />
      </svg>
      <span>{isSelected ? `${role} ${teeth}T` : `${role} not set`}</span>
    </div>
  );
}

function GearMesh({
  driverTeeth,
  drivenTeeth,
  speedMultiplier,
}: {
  driverTeeth: number | null;
  drivenTeeth: number | null;
  speedMultiplier: number | null;
}) {
  const complete = driverTeeth !== null && drivenTeeth !== null && speedMultiplier !== null;

  return (
    <section
      aria-label="External spur gear pair"
      className={`gear-mesh ${complete ? "is-complete" : ""}`}
    >
      <div className="gear-mesh-main">
        <div className="gear-mesh-wheels">
          <GearGraphic role="Driving" teeth={driverTeeth} />
          <span aria-hidden="true" className="gear-mesh-contact" />
          <GearGraphic role="Driven" teeth={drivenTeeth} />
        </div>
        <div className="gear-mesh-copy">
          <span>External spur pair</span>
          <strong>{complete ? `${driverTeeth}T to ${drivenTeeth}T` : "Choose both gear sizes"}</strong>
          <small>
            {complete
              ? `${speedSummary(speedMultiplier)} Spur gears reverse rotation.`
              : "The gear profiles update from the selected VEX tooth counts."}
          </small>
        </div>
      </div>
    </section>
  );
}

export function EngineeringToolbox() {
  const [rpm, setRpm] = useState("");
  const [driver, setDriver] = useState("");
  const [driven, setDriven] = useState("");
  const [wheel, setWheel] = useState("");
  const [distance, setDistance] = useState("");
  const [liftArm, setLiftArm] = useState("");
  const [liftRpm, setLiftRpm] = useState("");
  const [liftDriver, setLiftDriver] = useState("");
  const [liftDriven, setLiftDriven] = useState("");

  const calc = useMemo(() => {
    const motor = positive(rpm);
    const driving = positive(driver);
    const outputGear = positive(driven);
    const wheelDiameter = positive(wheel);
    const travel = positive(distance);
    const liftMotor = positive(liftRpm);
    const liftDriving = positive(liftDriver);
    const liftOutputGear = positive(liftDriven);
    const arm = positive(liftArm);

    const drivetrainStage =
      driving !== null && outputGear !== null
        ? { drivingTeeth: driving, drivenTeeth: outputGear }
        : null;
    const gearRatio = drivetrainStage ? calculateGearRatio(drivetrainStage) : null;
    const drivetrain =
      motor !== null && wheelDiameter !== null && drivetrainStage
        ? calculateDrivetrainSpeed({
            motorRpm: motor,
            wheelDiameterInches: wheelDiameter,
            gearStages: [drivetrainStage],
          })
        : null;
    const circumference = wheelDiameter !== null ? Math.PI * wheelDiameter : null;
    const outputRpm = motor !== null && gearRatio ? motor * gearRatio.speedMultiplier : null;
    const degrees =
      circumference !== null && travel !== null && gearRatio
        ? (travel / circumference) * 360 / gearRatio.speedMultiplier
        : null;

    const liftStage =
      liftDriving !== null && liftOutputGear !== null
        ? { drivingTeeth: liftDriving, drivenTeeth: liftOutputGear }
        : null;
    const liftRatio = liftStage ? calculateGearRatio(liftStage) : null;
    const liftOutput =
      liftMotor !== null && liftRatio ? liftMotor * liftRatio.speedMultiplier : null;
    const degPerSec = liftOutput !== null ? liftOutput * 6 : null;
    const tipIps =
      degPerSec !== null && arm !== null ? (degPerSec * Math.PI / 180) * arm : null;

    return {
      circumference,
      degrees,
      fps: drivetrain?.theoreticalSpeedFeetPerSecond ?? null,
      gearRatio,
      liftOutput,
      degPerSec,
      outputRpm,
      tipIps,
    };
  }, [distance, driven, driver, liftArm, liftDriven, liftDriver, liftRpm, rpm, wheel]);

  return (
    <section className="workspace-page suite-page">
      <header className="suite-hero compact">
        <div>
          <div className="suite-badges">
            <span className="analysis-badge">
              <Calculator size={13} /> ENGINEERING MATH
            </span>
          </div>
          <p className="page-kicker">Calculators</p>
          <h1>Robot math using only the values you enter.</h1>
          <p>
            No drivetrain or mechanism dimensions are preloaded. Outputs stay blank until the
            required measurements are provided.
          </p>
        </div>
      </header>

      <div className="calculator-grid">
        <section className="suite-panel calculator-card calculator-card--drivetrain">
          <div className="suite-panel-heading">
            <div>
              <span className="section-overline">Drivetrain</span>
              <h2>Drive math</h2>
            </div>
            <Gauge size={18} />
          </div>

          <div className="form-grid two-col calculator-inputs">
            <label>
              Motor
              <select value={rpm} onChange={(event) => setRpm(event.target.value)}>
                <option value="">Not recorded</option>
                {VEX_V5_MOTOR_CARTRIDGES.map((item) => (
                  <option key={item.rpm} value={item.rpm}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Wheel
              <select value={wheel} onChange={(event) => setWheel(event.target.value)}>
                <option value="">Not recorded</option>
                {VEX_V5_WHEEL_OPTIONS.map((item) => (
                  <option key={item.diameter} value={item.diameter}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Driving gear
              <select value={driver} onChange={(event) => setDriver(event.target.value)}>
                <option value="">Not recorded</option>
                {VEX_V5_SPUR_GEAR_TEETH.map((teeth) => (
                  <option key={teeth} value={teeth}>
                    {teeth}T
                  </option>
                ))}
              </select>
            </label>
            <label>
              Driven gear
              <select value={driven} onChange={(event) => setDriven(event.target.value)}>
                <option value="">Not recorded</option>
                {VEX_V5_SPUR_GEAR_TEETH.map((teeth) => (
                  <option key={teeth} value={teeth}>
                    {teeth}T
                  </option>
                ))}
              </select>
            </label>
          </div>

          <GearMesh
            drivenTeeth={positive(driven)}
            driverTeeth={positive(driver)}
            speedMultiplier={calc.gearRatio?.speedMultiplier ?? null}
          />

          <div className="calc-output">
            <div>
              <span>Wheel RPM</span>
              <strong>{formatValue(calc.outputRpm)}</strong>
            </div>
            <div>
              <span>Ideal speed</span>
              <strong>{formatValue(calc.fps, " ft/s", 2)}</strong>
            </div>
            <div>
              <span>Circumference</span>
              <strong>{formatValue(calc.circumference, " in", 2)}</strong>
            </div>
          </div>
        </section>

        <section className="suite-panel calculator-card calculator-card--autonomous">
          <div className="suite-panel-heading">
            <div>
              <span className="section-overline">Autonomous</span>
              <h2>Distance to motor degrees</h2>
            </div>
            <MoveHorizontal size={18} />
          </div>

          <div className="form-grid calculator-inputs">
            <label>
              Travel distance (in)
              <input
                min="0.01"
                type="number"
                value={distance}
                onChange={(event) => setDistance(event.target.value)}
              />
            </label>
            <label>
              Wheel
              <select value={wheel} onChange={(event) => setWheel(event.target.value)}>
                <option value="">Not recorded</option>
                {VEX_V5_WHEEL_OPTIONS.map((item) => (
                  <option key={item.diameter} value={item.diameter}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="big-calc-result">
            <span>IDEAL MOTOR ROTATION</span>
            <strong>{formatValue(calc.degrees, " deg")}</strong>
            <small>Uses the selected wheel and gear pair. It excludes slip, scrub, and calibration.</small>
          </div>
        </section>

        <section className="suite-panel calculator-card calculator-card--lift">
          <div className="suite-panel-heading">
            <div>
              <span className="section-overline">Lift</span>
              <h2>Arm endpoint speed</h2>
            </div>
            <Scaling size={18} />
          </div>

          <div className="lift-calculator-layout">
            <div className="form-grid two-col calculator-inputs">
              <label>
                Motor
                <select value={liftRpm} onChange={(event) => setLiftRpm(event.target.value)}>
                  <option value="">Not recorded</option>
                  {VEX_V5_MOTOR_CARTRIDGES.map((item) => (
                    <option key={item.rpm} value={item.rpm}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Arm length (in)
                <input
                  min="0.01"
                  type="number"
                  value={liftArm}
                  onChange={(event) => setLiftArm(event.target.value)}
                />
              </label>
              <label>
                Driving gear
                <select value={liftDriver} onChange={(event) => setLiftDriver(event.target.value)}>
                  <option value="">Not recorded</option>
                  {VEX_V5_SPUR_GEAR_TEETH.map((teeth) => (
                    <option key={teeth} value={teeth}>
                      {teeth}T
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Driven gear
                <select value={liftDriven} onChange={(event) => setLiftDriven(event.target.value)}>
                  <option value="">Not recorded</option>
                  {VEX_V5_SPUR_GEAR_TEETH.map((teeth) => (
                    <option key={teeth} value={teeth}>
                      {teeth}T
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="calc-output">
              <div>
                <span>Output RPM</span>
                <strong>{formatValue(calc.liftOutput)}</strong>
              </div>
              <div>
                <span>Angular speed</span>
                <strong>{formatValue(calc.degPerSec, " deg/s")}</strong>
              </div>
              <div>
                <span>Tip speed</span>
                <strong>{formatValue(calc.tipIps, " in/s")}</strong>
              </div>
            </div>
          </div>
        </section>
      </div>
    </section>
  );
}
