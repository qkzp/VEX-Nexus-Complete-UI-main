"use client";

import { useMemo, useState } from "react";
import { Calculator, Gauge, MoveHorizontal, RotateCw, Scaling } from "lucide-react";
import { VEX_V5_MOTOR_CARTRIDGES, VEX_V5_SPUR_GEAR_TEETH, VEX_V5_WHEEL_OPTIONS } from "@/lib/vex-hardware";

function positive(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
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
    const motor = positive(rpm), driving = positive(driver), outputGear = positive(driven), wheelDiameter = positive(wheel), travel = positive(distance);
    const liftMotor = positive(liftRpm), liftDriving = positive(liftDriver), liftOutputGear = positive(liftDriven), arm = positive(liftArm);
    const outputRpm = motor && driving && outputGear ? motor * driving / outputGear : null;
    const circumference = wheelDiameter ? Math.PI * wheelDiameter : null;
    const fps = outputRpm && circumference ? outputRpm * circumference / 720 : null;
    const degrees = circumference && travel ? travel / circumference * 360 : null;
    const liftOutput = liftMotor && liftDriving && liftOutputGear ? liftMotor * liftDriving / liftOutputGear : null;
    const degPerSec = liftOutput ? liftOutput * 6 : null;
    const tipIps = degPerSec && arm ? (degPerSec * Math.PI / 180) * arm : null;
    return { outputRpm, circumference, fps, degrees, liftOutput, degPerSec, tipIps };
  }, [rpm, driver, driven, wheel, distance, liftArm, liftRpm, liftDriver, liftDriven]);

  const value = (number: number | null, suffix = "", decimals = 1) => number === null ? "—" : `${number.toFixed(decimals)}${suffix}`;

  return (
    <section className="workspace-page suite-page">
      <header className="suite-hero compact"><div><div className="suite-badges"><span className="analysis-badge"><Calculator size={13} /> ENGINEERING MATH</span></div><p className="page-kicker">Calculators</p><h1>Robot math using only the values you enter.</h1><p>No drivetrain or mechanism dimensions are preloaded. Outputs stay blank until the required measurements are provided.</p></div></header>
      <div className="calculator-grid">
        <section className="suite-panel calculator-card"><div className="suite-panel-heading"><div><span className="section-overline">Drivetrain</span><h2>Speed &amp; gearing</h2></div><Gauge size={18} /></div><div className="form-grid two-col"><label>Motor cartridge<select value={rpm} onChange={(e) => setRpm(e.target.value)}><option value="">Not recorded</option>{VEX_V5_MOTOR_CARTRIDGES.map((item) => <option key={item.rpm} value={item.rpm}>{item.label}</option>)}</select></label><label>Wheel diameter (in)<select value={wheel} onChange={(e) => setWheel(e.target.value)}><option value="">Not recorded</option>{VEX_V5_WHEEL_OPTIONS.map((item) => <option key={item.diameter} value={item.diameter}>{item.label}</option>)}</select></label><label>Driving gear<select value={driver} onChange={(e) => setDriver(e.target.value)}><option value="">Not recorded</option>{VEX_V5_SPUR_GEAR_TEETH.map((teeth) => <option key={teeth} value={teeth}>{teeth}T</option>)}</select></label><label>Driven gear<select value={driven} onChange={(e) => setDriven(e.target.value)}><option value="">Not recorded</option>{VEX_V5_SPUR_GEAR_TEETH.map((teeth) => <option key={teeth} value={teeth}>{teeth}T</option>)}</select></label></div><div className="calc-output"><div><span>Wheel RPM</span><strong>{value(calc.outputRpm)}</strong></div><div><span>Theoretical speed</span><strong>{value(calc.fps, " ft/s", 2)}</strong></div><div><span>Wheel circumference</span><strong>{value(calc.circumference, " in", 2)}</strong></div></div></section>
        <section className="suite-panel calculator-card"><div className="suite-panel-heading"><div><span className="section-overline">Autonomous</span><h2>Distance → motor degrees</h2></div><MoveHorizontal size={18} /></div><div className="form-grid"><label>Travel distance (in)<input type="number" min="0.01" value={distance} onChange={(e) => setDistance(e.target.value)} /></label><label>Wheel diameter (in)<select value={wheel} onChange={(e) => setWheel(e.target.value)}><option value="">Not recorded</option>{VEX_V5_WHEEL_OPTIONS.map((item) => <option key={item.diameter} value={item.diameter}>{item.label}</option>)}</select></label></div><div className="big-calc-result"><span>IDEAL MOTOR ROTATION</span><strong>{value(calc.degrees, "°")}</strong><small>Does not include wheel slip, scrub, or drivetrain calibration.</small></div></section>
        <section className="suite-panel calculator-card"><div className="suite-panel-heading"><div><span className="section-overline">Lift</span><h2>Arm endpoint speed</h2></div><Scaling size={18} /></div><div className="form-grid two-col"><label>Motor cartridge<select value={liftRpm} onChange={(e) => setLiftRpm(e.target.value)}><option value="">Not recorded</option>{VEX_V5_MOTOR_CARTRIDGES.map((item) => <option key={item.rpm} value={item.rpm}>{item.label}</option>)}</select></label><label>Arm length (in)<input type="number" min="0.01" value={liftArm} onChange={(e) => setLiftArm(e.target.value)} /></label><label>Driving gear<select value={liftDriver} onChange={(e) => setLiftDriver(e.target.value)}><option value="">Not recorded</option>{VEX_V5_SPUR_GEAR_TEETH.map((teeth) => <option key={teeth} value={teeth}>{teeth}T</option>)}</select></label><label>Driven gear<select value={liftDriven} onChange={(e) => setLiftDriven(e.target.value)}><option value="">Not recorded</option>{VEX_V5_SPUR_GEAR_TEETH.map((teeth) => <option key={teeth} value={teeth}>{teeth}T</option>)}</select></label></div><div className="calc-output"><div><span>Output RPM</span><strong>{value(calc.liftOutput)}</strong></div><div><span>Angular speed</span><strong>{value(calc.degPerSec, "°/s")}</strong></div><div><span>Tip speed</span><strong>{value(calc.tipIps, " in/s")}</strong></div></div></section>
        <section className="suite-panel calculator-card"><div className="suite-panel-heading"><div><span className="section-overline">Gear train</span><h2>Ratio explainer</h2></div><RotateCw size={18} /></div><div className="ratio-diagram"><span>{rpm || "—"} RPM</span><b>{driver ? `${driver}T` : "—"}</b><i>→</i><b>{driven ? `${driven}T` : "—"}</b><span>{calc.outputRpm === null ? "—" : `${calc.outputRpm.toFixed(1)} RPM`}</span></div><p className="calculator-note">For a simple gear or sprocket pair: output RPM = input RPM × driving teeth ÷ driven teeth. Compound trains multiply each stage ratio.</p></section>
      </div>
    </section>
  );
}
