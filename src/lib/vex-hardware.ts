export const VEX_V5_SMART_PORTS = Array.from({ length: 21 }, (_, index) => index + 1);
export const VEX_V5_THREE_WIRE_PORTS = ["A", "B", "C", "D", "E", "F", "G", "H"] as const;

// Official VEX V5 spur / high-strength gear tooth counts currently listed by VEX.
export const VEX_V5_SPUR_GEAR_TEETH = [12, 24, 36, 48, 60, 72, 84] as const;

// Official VEX sprocket families. Do not mix chain pitch families.
export const VEX_V5_3P_SPROCKET_TEETH = [10, 15, 24, 40, 48] as const;
export const VEX_V5_6P_SPROCKET_TEETH = [8, 16, 24, 32, 40] as const;
export const VEX_V5_9P_SPROCKET_TEETH = [6, 12, 18, 24, 30] as const;

export const VEX_V5_TRANSMISSION_OPTIONS = [
  { value: "DIRECT", label: "Direct drive · 1:1", teeth: [] as readonly number[] },
  { value: "SPUR", label: "Spur / high-strength gears", teeth: VEX_V5_SPUR_GEAR_TEETH },
  { value: "CHAIN_3P", label: "3P chain & sprockets", teeth: VEX_V5_3P_SPROCKET_TEETH },
  { value: "CHAIN_6P", label: "6P chain & sprockets", teeth: VEX_V5_6P_SPROCKET_TEETH },
  { value: "CHAIN_9P", label: "9P high-strength chain & sprockets", teeth: VEX_V5_9P_SPROCKET_TEETH },
] as const;

// Current VEX V5 drivetrain wheel diameters listed by VEX Robotics.
export const VEX_V5_WHEEL_DIAMETERS = [2, 2.75, 3.25, 4] as const;
export const VEX_V5_WHEEL_OPTIONS = [
  { diameter: 2, label: "2.00 in", types: ["Omni", "Mecanum"] },
  { diameter: 2.75, label: "2.75 in", types: ["Omni", "Traction"] },
  { diameter: 3.25, label: "3.25 in", types: ["Omni", "Traction"] },
  { diameter: 4, label: "4.00 in", types: ["Omni", "Traction", "Mecanum"] },
] as const;

export const VEX_V5_MOTOR_CARTRIDGES = [
  { value: "RPM_100", rpm: 100, label: "100 RPM · 36:1", color: "red" },
  { value: "RPM_200", rpm: 200, label: "200 RPM · 18:1", color: "green" },
  { value: "RPM_600", rpm: 600, label: "600 RPM · 6:1", color: "blue" },
] as const;

export const VEX_V5_SMART_DEVICE_OPTIONS = [
  { value: "", label: "Unused" },
  { value: "motor_11w", label: "V5 Smart Motor (11W)" },
  { value: "motor_5_5w", label: "V5 Smart Motor (5.5W · fixed 200 RPM)" },
  { value: "ai_vision", label: "AI Vision Sensor" },
  { value: "inertial", label: "V5 Inertial Sensor" },
  { value: "rotation", label: "V5 Rotation Sensor" },
  { value: "optical", label: "V5 Optical Sensor" },
  { value: "distance", label: "V5 Distance Sensor" },
  { value: "gps", label: "VEX GPS Sensor" },
  { value: "vision", label: "V5 Vision Sensor" },
  { value: "three_wire_expander", label: "V5 3-Wire Expander" },
  { value: "radio", label: "V5 Robot Radio" },
] as const;

export const VEX_V5_THREE_WIRE_DEVICE_OPTIONS = [
  { value: "", label: "Unused" },
  { value: "bumper", label: "Bumper Switch v2" },
  { value: "limit", label: "Limit Switch" },
  { value: "potentiometer", label: "Potentiometer" },
  { value: "optical_encoder", label: "Optical Shaft Encoder" },
  { value: "ultrasonic", label: "Ultrasonic Range Finder" },
  { value: "line_tracker", label: "Line Tracker" },
  { value: "light_sensor", label: "Light Sensor" },
  { value: "led_indicator", label: "LED Indicator" },
  { value: "yaw_gyro", label: "Yaw Rate Gyroscope" },
  { value: "analog_accelerometer", label: "Analog Accelerometer" },
  { value: "jumper", label: "Jumper" },
  { value: "pneumatic_solenoid", label: "V5 Pneumatic Solenoid" },
] as const;

export const VEX_V5_CONTROLLER_BUTTONS = ["L1", "L2", "R1", "R2", "A", "B", "X", "Y", "UP", "DOWN", "LEFT", "RIGHT"] as const;
export const VEX_V5_CONTROLLER_AXES = ["Axis1", "Axis2", "Axis3", "Axis4"] as const;
