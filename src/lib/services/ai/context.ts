/**
 * Structured, retrieval-friendly context contracts for the Robot Intelligence
 * Profile. These types deliberately separate persisted facts from values that
 * have been calculated, estimated, assumed, or are still unknown.
 */

export type ContextEvidenceStatus =
  | "known"
  | "calculated"
  | "estimated"
  | "assumed"
  | "unknown";

export type ContextScope =
  | "user"
  | "team"
  | "robot"
  | "code"
  | "conversation"
  | "season_rules";

export interface ContextCitation {
  sourceType:
    | "robot_profile"
    | "calculation"
    | "code_version"
    | "conversation"
    | "season_rule"
    | "user_input"
    | "external_reference";
  sourceId?: string;
  label: string;
  url?: string;
}

export interface ContextFact<TValue = unknown> {
  key: string;
  label: string;
  value: TValue;
  evidenceStatus: ContextEvidenceStatus;
  explanation?: string;
  citations?: readonly ContextCitation[];
}

export interface RobotMotorContext {
  id: string;
  label: string;
  port: number;
  cartridgeRpm: number | null;
  reversed: boolean;
  purpose: string;
  mechanismName?: string;
}

export interface RobotSensorContext {
  id: string;
  label: string;
  type: string;
  smartPort?: number;
  threeWirePort?: string;
  purpose?: string;
}

export interface RobotPneumaticContext {
  id: string;
  label: string;
  threeWirePort: string;
  controlType: string;
  defaultState: boolean;
}

export interface GearTrainStageContext {
  sequence: number;
  kind: string;
  inputTeeth?: number;
  outputTeeth?: number;
  ratio?: number;
  reversed: boolean;
}

export interface GearTrainContext {
  id: string;
  name: string;
  kind: string;
  calculatedRatio?: number;
  inputRpm?: number;
  outputRpm?: number;
  stages: readonly GearTrainStageContext[];
}

export interface RobotMechanismContext {
  id: string;
  name: string;
  type: string;
  description?: string;
  motorIds: readonly string[];
  sensorIds: readonly string[];
  pneumaticIds: readonly string[];
  gearTrainIds: readonly string[];
}

export interface RobotConfigurationContext {
  drivetrainType?: string;
  driveMotorCount?: number;
  wheelDiameterIn?: number;
  trackWidthIn?: number;
  wheelbaseIn?: number;
  externalGearRatio?: number;
  theoreticalSpeedFtPerSec?: number;
  dimensionsIn?: {
    length?: number;
    width?: number;
    height?: number;
  };
  weightLb?: number;
  motors: readonly RobotMotorContext[];
  sensors: readonly RobotSensorContext[];
  pneumatics: readonly RobotPneumaticContext[];
  mechanisms: readonly RobotMechanismContext[];
  gearTrains: readonly GearTrainContext[];
}

export interface RobotContext {
  robot: {
    id: string;
    name: string;
    teamNumber?: string;
    seasonKey?: string;
    competitionType?: string;
  };
  configuration?: RobotConfigurationContext;
  facts: readonly ContextFact[];
}

export interface UserContext {
  userId: string;
  experienceLevel?: string;
  roles: readonly string[];
  preferredProgrammingLanguage?: string;
}

export interface TeamContext {
  teamId: string;
  name: string;
  teamNumber?: string;
  memberRole?: string;
}

export interface CodeContext {
  projectId: string;
  language: "vexcode_python" | "vexcode_cpp" | "pros_cpp" | "other";
  latestVersionLabel?: string;
  deviceDefinitions?: readonly ContextFact[];
  relevantFiles?: readonly {
    path: string;
    content: string;
    language?: string;
  }[];
}

export interface ConversationContext {
  conversationId: string;
  summary?: string;
  recentMessages: readonly {
    role: "system" | "user" | "assistant" | "tool";
    content: string;
  }[];
}

export interface SeasonRuleContext {
  seasonId: string;
  seasonKey: string;
  gameName?: string;
  rules: readonly ContextFact<string>[];
}

export interface AIContextBundle {
  user?: UserContext;
  team?: TeamContext;
  robot?: RobotContext;
  code?: CodeContext;
  conversation?: ConversationContext;
  seasonRules?: SeasonRuleContext;
  retrievedFacts: readonly ContextFact[];
  omissions: readonly {
    scope: ContextScope;
    reason: "not_requested" | "not_found" | "not_authorized" | "budget_limited";
  }[];
}

export interface ContextRetrievalRequest {
  actorUserId: string;
  query: string;
  scopes: readonly ContextScope[];
  robotId?: string;
  teamId?: string;
  codeProjectId?: string;
  conversationId?: string;
  seasonId?: string;
  maxFacts?: number;
  maxCharacters?: number;
}

export interface AIContextRetriever {
  retrieve(request: ContextRetrievalRequest): Promise<AIContextBundle>;
}

export interface AIContextSnapshotStore {
  save(input: {
    conversationId: string;
    purpose: string;
    context: AIContextBundle;
  }): Promise<{ id: string; createdAt: Date }>;
}
