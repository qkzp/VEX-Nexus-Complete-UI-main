-- CreateEnum
CREATE TYPE "SystemRole" AS ENUM ('MEMBER', 'MODERATOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'DEACTIVATED');

-- CreateEnum
CREATE TYPE "ExperienceLevel" AS ENUM ('JUST_STARTING', 'FIRST_SEASON', 'ONE_TO_TWO_SEASONS', 'THREE_PLUS_SEASONS', 'MENTOR_COACH');

-- CreateEnum
CREATE TYPE "ProgrammingLanguage" AS ENUM ('VEXCODE_PYTHON', 'VEXCODE_CPP', 'PROS_CPP', 'OTHER');

-- CreateEnum
CREATE TYPE "TeamPermissionRole" AS ENUM ('OWNER', 'ADMIN', 'TEAM_LEAD', 'MEMBER', 'VIEWER');

-- CreateEnum
CREATE TYPE "TeamRoboticsRole" AS ENUM ('BUILDER', 'PROGRAMMER', 'DRIVER', 'CAD', 'NOTEBOOK', 'SCOUT', 'TEAM_LEAD', 'MENTOR');

-- CreateEnum
CREATE TYPE "VexProgram" AS ENUM ('V5RC', 'VIQRC', 'VURC', 'VAIRC');

-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('INVITED', 'ACTIVE', 'REMOVED');

-- CreateEnum
CREATE TYPE "Visibility" AS ENUM ('PRIVATE', 'TEAM', 'PUBLIC', 'UNLISTED');

-- CreateEnum
CREATE TYPE "RobotStatus" AS ENUM ('ACTIVE', 'PROTOTYPE', 'ARCHIVED', 'RETIRED');

-- CreateEnum
CREATE TYPE "CompetitionType" AS ENUM ('VRC', 'VEXU', 'VIQRC', 'CUSTOM');

-- CreateEnum
CREATE TYPE "DrivetrainType" AS ENUM ('TANK', 'ARCADE', 'HOLONOMIC', 'X_DRIVE', 'MECANUM', 'CUSTOM');

-- CreateEnum
CREATE TYPE "MotorCartridge" AS ENUM ('RPM_100', 'RPM_200', 'RPM_600', 'CUSTOM');

-- CreateEnum
CREATE TYPE "MotorPurpose" AS ENUM ('DRIVE', 'INTAKE', 'LIFT', 'ARM', 'FLYWHEEL', 'CONVEYOR', 'CLIMBER', 'ROLLER', 'INDEXER', 'CUSTOM');

-- CreateEnum
CREATE TYPE "GearTrainKind" AS ENUM ('SPUR_GEAR', 'CHAIN', 'BELT', 'COMPOUND', 'MIXED', 'CUSTOM');

-- CreateEnum
CREATE TYPE "GearStageKind" AS ENUM ('GEAR', 'SPROCKET', 'PULLEY', 'PLANETARY', 'CUSTOM');

-- CreateEnum
CREATE TYPE "SensorKind" AS ENUM ('INERTIAL', 'ROTATION', 'OPTICAL', 'DISTANCE', 'GPS', 'VISION', 'SONAR', 'ENCODER', 'LIMIT_SWITCH', 'BUMPER', 'DIGITAL_IN', 'DIGITAL_OUT', 'ANALOG_IN', 'ADI_ENCODER', 'CUSTOM');

-- CreateEnum
CREATE TYPE "PneumaticControlType" AS ENUM ('DIGITAL_OUT', 'DIGITAL_IN', 'DOUBLE_ACTING', 'SINGLE_ACTING');

-- CreateEnum
CREATE TYPE "ControllerInput" AS ENUM ('LEFT_JOYSTICK_X', 'LEFT_JOYSTICK_Y', 'RIGHT_JOYSTICK_X', 'RIGHT_JOYSTICK_Y', 'L1', 'L2', 'R1', 'R2', 'A', 'B', 'X', 'Y', 'UP', 'DOWN', 'LEFT', 'RIGHT');

-- CreateEnum
CREATE TYPE "ControllerActionType" AS ENUM ('HOLD', 'TOGGLE', 'PRESS', 'TIMED', 'MACRO', 'CONDITIONAL');

-- CreateEnum
CREATE TYPE "CodeLanguage" AS ENUM ('VEXCODE_PYTHON', 'VEXCODE_CPP', 'PROS_CPP');

-- CreateEnum
CREATE TYPE "CodeProjectStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "CodeVersionSource" AS ENUM ('MANUAL', 'AI_GENERATED', 'IMPORTED', 'RESTORED');

-- CreateEnum
CREATE TYPE "AutonomousMode" AS ENUM ('SIMPLE', 'ADVANCED');

-- CreateEnum
CREATE TYPE "AutonomousStepKind" AS ENUM ('DRIVE_DISTANCE', 'TURN_ANGLE', 'SET_MOTOR', 'SET_PNEUMATIC', 'WAIT', 'FOLLOW_PATH', 'SET_POSE', 'CUSTOM');

-- CreateEnum
CREATE TYPE "AIAgentType" AS ENUM ('ROBOT_ENGINEER', 'DIAGNOSTICS', 'CODE', 'AUTONOMOUS', 'MECHANICAL_DESIGN', 'NOTEBOOK', 'STRATEGY', 'LEARNING', 'FORUM');

-- CreateEnum
CREATE TYPE "AIConversationMode" AS ENUM ('ASK', 'DIAGNOSE', 'DESIGN', 'CALCULATE', 'CODE', 'LEARN');

-- CreateEnum
CREATE TYPE "AIMessageRole" AS ENUM ('SYSTEM', 'USER', 'ASSISTANT', 'TOOL');

-- CreateEnum
CREATE TYPE "AIMessageStatus" AS ENUM ('PENDING', 'STREAMING', 'COMPLETE', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "EvidenceStatus" AS ENUM ('KNOWN', 'CALCULATED', 'ESTIMATED', 'ASSUMED', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "DiagnosticStatus" AS ENUM ('DRAFT', 'RUNNING', 'COMPLETE', 'FAILED');

-- CreateEnum
CREATE TYPE "CalculationType" AS ENUM ('GEAR_RATIO', 'COMPOUND_GEAR_RATIO', 'SPROCKET_RATIO', 'COMPOUND_CHAIN_RATIO', 'DRIVETRAIN_SPEED', 'WHEEL_RPM', 'LINEAR_SPEED', 'MOTOR_TORQUE', 'MULTI_MOTOR_TORQUE', 'LIFT_TORQUE', 'ARM_TORQUE', 'MECHANICAL_ADVANTAGE', 'FLYWHEEL_SURFACE_VELOCITY', 'CHAIN_LENGTH', 'WHEEL_TRAVEL', 'ENCODER_DISTANCE', 'UNIT_CONVERSION', 'CUSTOM');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('BACKLOG', 'DESIGNING', 'BUILDING', 'TESTING', 'READY', 'COMPLETE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "CompetitionStatus" AS ENUM ('PLANNED', 'ACTIVE', 'COMPLETE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "MatchPhase" AS ENUM ('PRACTICE', 'QUALIFICATION', 'ALLIANCE_SELECTION', 'ELIMINATION', 'SKILLS', 'FINALS', 'OTHER');

-- CreateEnum
CREATE TYPE "AllianceColor" AS ENUM ('RED', 'BLUE', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "ForumThreadType" AS ENUM ('QUESTION', 'DISCUSSION', 'GUIDE', 'BUILD_LOG', 'SHOWCASE', 'RESOURCE');

-- CreateEnum
CREATE TYPE "ForumThreadStatus" AS ENUM ('OPEN', 'LOCKED', 'ARCHIVED', 'HIDDEN');

-- CreateEnum
CREATE TYPE "ForumVoteValue" AS ENUM ('DOWN', 'UP');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('OPEN', 'IN_REVIEW', 'RESOLVED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('TEAM_INVITE', 'TEAM_UPDATE', 'TASK_ASSIGNED', 'TASK_COMMENT', 'FORUM_REPLY', 'FORUM_MENTION', 'FORUM_VOTE', 'AI_COMPLETE', 'SYSTEM');

-- CreateEnum
CREATE TYPE "PartCategory" AS ENUM ('MOTOR', 'GEAR', 'SPROCKET', 'CHAIN', 'WHEEL', 'BEARING', 'SHAFT', 'STRUCTURAL', 'FASTENER', 'SENSOR', 'ELECTRONICS', 'PNEUMATICS', 'OTHER');

-- CreateEnum
CREATE TYPE "GuideDifficulty" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');

-- CreateEnum
CREATE TYPE "RuleType" AS ENUM ('ROBOT', 'MATCH', 'SKILLS', 'SCORING', 'FIELD', 'UPDATE', 'OTHER');

-- CreateEnum
CREATE TYPE "MediaKind" AS ENUM ('IMAGE', 'VIDEO', 'DOCUMENT', 'CAD', 'CODE', 'OTHER');

-- CreateEnum
CREATE TYPE "MediaVisibility" AS ENUM ('PRIVATE', 'TEAM', 'PUBLIC');

-- CreateEnum
CREATE TYPE "AttachmentTargetType" AS ENUM ('ROBOT', 'MECHANISM', 'AI_MESSAGE', 'DIAGNOSTIC', 'CALCULATION', 'BUILD_LOG', 'NOTEBOOK_ENTRY', 'TASK', 'TASK_COMMENT', 'FORUM_THREAD', 'FORUM_POST', 'PART', 'GUIDE', 'SCOUTING_REPORT');

-- CreateEnum
CREATE TYPE "AIUsageStatus" AS ENUM ('STARTED', 'SUCCEEDED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ModerationActionType" AS ENUM ('WARN', 'REMOVE_CONTENT', 'LOCK_THREAD', 'SUSPEND_USER', 'RESTORE_CONTENT', 'OTHER');

-- CreateEnum
CREATE TYPE "SearchDocumentType" AS ENUM ('ROBOT', 'AI_CONVERSATION', 'CODE_PROJECT', 'FORUM_THREAD', 'FORUM_POST', 'GUIDE', 'CALCULATION', 'TASK', 'NOTEBOOK_ENTRY', 'BUILD_LOG', 'PART');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "name" TEXT,
    "image" TEXT,
    "username" TEXT,
    "displayName" TEXT,
    "imageUrl" TEXT,
    "passwordHash" TEXT,
    "systemRole" "SystemRole" NOT NULL DEFAULT 'MEMBER',
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Profile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "teamNumber" TEXT,
    "experienceLevel" "ExperienceLevel",
    "preferredLanguage" "ProgrammingLanguage",
    "roles" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "bio" TEXT,
    "timezone" TEXT,
    "onboardingCompletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usedAt" TIMESTAMP(3),

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "teamNumber" TEXT,
    "program" "VexProgram" NOT NULL DEFAULT 'V5RC',
    "vexTeamId" TEXT,
    "officialName" TEXT,
    "organization" TEXT,
    "location" TEXT,
    "eventRegion" TEXT,
    "grade" TEXT,
    "officialLinkedAt" TIMESTAMP(3),
    "description" TEXT,
    "ownerId" TEXT NOT NULL,
    "currentSeasonId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamMember" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "permission" "TeamPermissionRole" NOT NULL DEFAULT 'MEMBER',
    "roboticsRoles" "TeamRoboticsRole"[] DEFAULT ARRAY[]::"TeamRoboticsRole"[],
    "status" "MembershipStatus" NOT NULL DEFAULT 'INVITED',
    "joinedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamInvite" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "maxUses" INTEGER,
    "currentUses" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamInvite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "theme" TEXT NOT NULL DEFAULT 'system',
    "units" TEXT NOT NULL DEFAULT 'imperial',
    "preferredLanguage" "ProgrammingLanguage",
    "defaultTeamId" TEXT,
    "defaultRobotId" TEXT,
    "profilePublic" BOOLEAN NOT NULL DEFAULT false,
    "robotsPublic" BOOLEAN NOT NULL DEFAULT false,
    "activityPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FollowedVexTeam" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "vexTeamId" TEXT,
    "teamNumber" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FollowedVexTeam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VexTeamCache" (
    "id" TEXT NOT NULL,
    "vexTeamId" TEXT NOT NULL,
    "teamNumber" TEXT NOT NULL,
    "program" TEXT,
    "payload" JSONB NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VexTeamCache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VexEventCache" (
    "id" TEXT NOT NULL,
    "vexEventId" TEXT NOT NULL,
    "eventCode" TEXT,
    "payload" JSONB NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VexEventCache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RankingSnapshot" (
    "id" TEXT NOT NULL,
    "seasonKey" TEXT NOT NULL,
    "program" TEXT NOT NULL,
    "vexTeamId" TEXT,
    "teamNumber" TEXT NOT NULL,
    "worldRank" INTEGER,
    "score" DOUBLE PRECISION,
    "autonomousScore" DOUBLE PRECISION,
    "driverScore" DOUBLE PRECISION,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sourceUpdatedAt" TIMESTAMP(3),

    CONSTRAINT "RankingSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Robot" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "teamId" TEXT,
    "seasonId" TEXT,
    "name" TEXT NOT NULL,
    "teamNumber" TEXT,
    "status" "RobotStatus" NOT NULL DEFAULT 'ACTIVE',
    "visibility" "Visibility" NOT NULL DEFAULT 'PRIVATE',
    "description" TEXT,
    "coverImage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Robot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RobotConfiguration" (
    "id" TEXT NOT NULL,
    "robotId" TEXT NOT NULL,
    "drivetrainType" "DrivetrainType",
    "driveMotorCount" INTEGER,
    "wheelDiameterIn" DOUBLE PRECISION,
    "wheelType" TEXT,
    "trackWidthIn" DOUBLE PRECISION,
    "wheelbaseIn" DOUBLE PRECISION,
    "externalGearRatio" DOUBLE PRECISION,
    "theoreticalSpeedFtPerSec" DOUBLE PRECISION,
    "brainName" TEXT,
    "controllerName" TEXT,
    "lengthIn" DOUBLE PRECISION,
    "widthIn" DOUBLE PRECISION,
    "heightIn" DOUBLE PRECISION,
    "weightLb" DOUBLE PRECISION,
    "configurationVersion" INTEGER NOT NULL DEFAULT 1,
    "isComplete" BOOLEAN NOT NULL DEFAULT false,
    "customProperties" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RobotConfiguration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Motor" (
    "id" TEXT NOT NULL,
    "robotConfigurationId" TEXT NOT NULL,
    "mechanismId" TEXT,
    "port" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "cartridge" "MotorCartridge" NOT NULL,
    "customRpm" INTEGER,
    "reversed" BOOLEAN NOT NULL DEFAULT false,
    "purpose" "MotorPurpose" NOT NULL DEFAULT 'CUSTOM',
    "variableName" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Motor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GearTrain" (
    "id" TEXT NOT NULL,
    "robotConfigurationId" TEXT NOT NULL,
    "mechanismId" TEXT,
    "inputMotorId" TEXT,
    "name" TEXT NOT NULL,
    "kind" "GearTrainKind" NOT NULL DEFAULT 'SPUR_GEAR',
    "calculatedRatio" DOUBLE PRECISION,
    "inputRpm" DOUBLE PRECISION,
    "outputRpm" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GearTrain_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GearTrainStage" (
    "id" TEXT NOT NULL,
    "gearTrainId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "kind" "GearStageKind" NOT NULL,
    "inputTeeth" INTEGER,
    "outputTeeth" INTEGER,
    "inputDiameterIn" DOUBLE PRECISION,
    "outputDiameterIn" DOUBLE PRECISION,
    "ratio" DOUBLE PRECISION,
    "reversed" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GearTrainStage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mechanism" (
    "id" TEXT NOT NULL,
    "robotConfigurationId" TEXT NOT NULL,
    "parentMechanismId" TEXT,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "configuration" JSONB,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Mechanism_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sensor" (
    "id" TEXT NOT NULL,
    "robotConfigurationId" TEXT NOT NULL,
    "mechanismId" TEXT,
    "smartPort" INTEGER,
    "threeWirePort" TEXT,
    "label" TEXT NOT NULL,
    "type" "SensorKind" NOT NULL,
    "variableName" TEXT,
    "purpose" TEXT,
    "reversed" BOOLEAN NOT NULL DEFAULT false,
    "configuration" JSONB,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sensor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pneumatic" (
    "id" TEXT NOT NULL,
    "robotConfigurationId" TEXT NOT NULL,
    "mechanismId" TEXT,
    "threeWirePort" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "controlType" "PneumaticControlType" NOT NULL DEFAULT 'DIGITAL_OUT',
    "variableName" TEXT,
    "defaultState" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pneumatic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ControllerMapping" (
    "id" TEXT NOT NULL,
    "robotConfigurationId" TEXT NOT NULL,
    "mechanismId" TEXT,
    "motorId" TEXT,
    "pneumaticId" TEXT,
    "input" "ControllerInput" NOT NULL,
    "actionType" "ControllerActionType" NOT NULL,
    "actionLabel" TEXT NOT NULL,
    "behavior" JSONB,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ControllerMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CodeProject" (
    "id" TEXT NOT NULL,
    "robotId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "language" "CodeLanguage" NOT NULL,
    "status" "CodeProjectStatus" NOT NULL DEFAULT 'DRAFT',
    "repositoryUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CodeProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CodeFile" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "language" "CodeLanguage",
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CodeFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CodeVersion" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "parentVersionId" TEXT,
    "versionNumber" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "source" "CodeVersionSource" NOT NULL DEFAULT 'MANUAL',
    "summary" TEXT,
    "filesSnapshot" JSONB NOT NULL,
    "validation" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CodeVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutonomousRoutine" (
    "id" TEXT NOT NULL,
    "robotId" TEXT NOT NULL,
    "projectId" TEXT,
    "name" TEXT NOT NULL,
    "mode" "AutonomousMode" NOT NULL DEFAULT 'SIMPLE',
    "description" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AutonomousRoutine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutonomousStep" (
    "id" TEXT NOT NULL,
    "routineId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "kind" "AutonomousStepKind" NOT NULL,
    "label" TEXT,
    "parameters" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AutonomousStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIConversation" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "robotId" TEXT,
    "teamId" TEXT,
    "codeProjectId" TEXT,
    "title" TEXT,
    "mode" "AIConversationMode" NOT NULL DEFAULT 'ASK',
    "agent" "AIAgentType" NOT NULL DEFAULT 'ROBOT_ENGINEER',
    "contextSummary" JSONB,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "authorId" TEXT,
    "role" "AIMessageRole" NOT NULL,
    "status" "AIMessageStatus" NOT NULL DEFAULT 'PENDING',
    "content" TEXT NOT NULL,
    "structuredData" JSONB,
    "citations" JSONB,
    "model" TEXT,
    "provider" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "AIMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIContextSnapshot" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "context" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIContextSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiagnosticSession" (
    "id" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "robotId" TEXT,
    "conversationId" TEXT,
    "status" "DiagnosticStatus" NOT NULL DEFAULT 'DRAFT',
    "symptom" TEXT NOT NULL,
    "findings" JSONB,
    "confidence" DOUBLE PRECISION,
    "evidenceStatus" "EvidenceStatus" NOT NULL DEFAULT 'UNKNOWN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiagnosticSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Calculation" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "robotId" TEXT,
    "teamId" TEXT,
    "type" "CalculationType" NOT NULL,
    "name" TEXT,
    "visibility" "Visibility" NOT NULL DEFAULT 'PRIVATE',
    "input" JSONB NOT NULL,
    "output" JSONB NOT NULL,
    "formula" TEXT,
    "evidenceStatus" "EvidenceStatus" NOT NULL DEFAULT 'CALCULATED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Calculation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BuildLog" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "robotId" TEXT,
    "authorId" TEXT NOT NULL,
    "occurredOn" TIMESTAMP(3) NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "reason" TEXT,
    "testing" TEXT,
    "results" TEXT,
    "analysis" TEXT,
    "nextSteps" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BuildLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotebookEntry" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "robotId" TEXT,
    "authorId" TEXT NOT NULL,
    "occurredOn" TIMESTAMP(3) NOT NULL,
    "title" TEXT NOT NULL,
    "objective" TEXT,
    "problem" TEXT,
    "research" TEXT,
    "ideas" TEXT,
    "decision" TEXT,
    "design" TEXT,
    "prototype" TEXT,
    "testing" TEXT,
    "results" TEXT,
    "analysis" TEXT,
    "changes" TEXT,
    "nextSteps" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotebookEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "robotId" TEXT,
    "createdById" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "TaskStatus" NOT NULL DEFAULT 'BACKLOG',
    "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIUM',
    "dueAt" TIMESTAMP(3),
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskAssignee" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskAssignee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskComment" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaskComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Competition" (
    "id" TEXT NOT NULL,
    "teamId" TEXT,
    "seasonId" TEXT,
    "createdById" TEXT NOT NULL,
    "externalId" TEXT,
    "name" TEXT NOT NULL,
    "location" TEXT,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "status" "CompetitionStatus" NOT NULL DEFAULT 'PLANNED',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Competition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Match" (
    "id" TEXT NOT NULL,
    "competitionId" TEXT NOT NULL,
    "externalId" TEXT,
    "phase" "MatchPhase" NOT NULL DEFAULT 'QUALIFICATION',
    "matchNumber" INTEGER,
    "scheduledAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "result" JSONB,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchAlliance" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "color" "AllianceColor" NOT NULL,
    "position" INTEGER NOT NULL,
    "teamNumber" TEXT NOT NULL,
    "teamName" TEXT,
    "score" INTEGER,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MatchAlliance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScoutingTemplate" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "seasonId" TEXT,
    "name" TEXT NOT NULL,
    "definition" JSONB NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScoutingTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScoutingReport" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "competitionId" TEXT NOT NULL,
    "matchId" TEXT,
    "templateId" TEXT,
    "authorId" TEXT NOT NULL,
    "observedTeamNo" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScoutingReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ForumCategory" (
    "id" TEXT NOT NULL,
    "parentCategoryId" TEXT,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ForumCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ForumThread" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "teamId" TEXT,
    "robotId" TEXT,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "type" "ForumThreadType" NOT NULL DEFAULT 'DISCUSSION',
    "status" "ForumThreadStatus" NOT NULL DEFAULT 'OPEN',
    "visibility" "Visibility" NOT NULL DEFAULT 'PUBLIC',
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "lastReplyAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ForumThread_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ForumPost" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "parentPostId" TEXT,
    "body" TEXT NOT NULL,
    "editedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ForumPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ForumVote" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "value" "ForumVoteValue" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ForumVote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ForumSolution" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "selectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ForumSolution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ForumReport" (
    "id" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "resolvedById" TEXT,
    "threadId" TEXT,
    "postId" TEXT,
    "reason" TEXT NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'OPEN',
    "resolution" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "ForumReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserBlock" (
    "id" TEXT NOT NULL,
    "blockerId" TEXT NOT NULL,
    "blockedId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserBlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "payload" JSONB,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Part" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT,
    "createdById" TEXT,
    "sku" TEXT,
    "name" TEXT NOT NULL,
    "category" "PartCategory" NOT NULL,
    "manufacturer" TEXT,
    "description" TEXT,
    "dimensions" JSONB,
    "purpose" TEXT,
    "commonApplications" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "documentationUrl" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Part_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartCompatibility" (
    "id" TEXT NOT NULL,
    "partId" TEXT NOT NULL,
    "compatiblePartId" TEXT NOT NULL,
    "isCompatible" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "conditions" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PartCompatibility_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Guide" (
    "id" TEXT NOT NULL,
    "authorId" TEXT,
    "seasonId" TEXT,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "body" TEXT NOT NULL,
    "difficulty" "GuideDifficulty" NOT NULL DEFAULT 'BEGINNER',
    "visibility" "Visibility" NOT NULL DEFAULT 'PUBLIC',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Guide_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MechanismGuide" (
    "id" TEXT NOT NULL,
    "guideId" TEXT NOT NULL,
    "mechanismType" TEXT NOT NULL,
    "diagramData" JSONB,
    "advantages" JSONB,
    "disadvantages" JSONB,
    "commonFailures" JSONB,
    "typicalGearing" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MechanismGuide_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Season" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "gameName" TEXT,
    "competition" "CompetitionType" NOT NULL DEFAULT 'VRC',
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Season_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameRule" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "ruleNumber" TEXT,
    "type" "RuleType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "effectiveFrom" TIMESTAMP(3),
    "isCurrent" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GameRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaAsset" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "teamId" TEXT,
    "robotId" TEXT,
    "storageKey" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "byteSize" INTEGER NOT NULL,
    "checksum" TEXT,
    "kind" "MediaKind" NOT NULL,
    "visibility" "MediaVisibility" NOT NULL DEFAULT 'PRIVATE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentAttachment" (
    "id" TEXT NOT NULL,
    "mediaAssetId" TEXT NOT NULL,
    "targetType" "AttachmentTargetType" NOT NULL,
    "targetId" TEXT NOT NULL,
    "caption" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIUsageRecord" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "teamId" TEXT,
    "conversationId" TEXT,
    "agent" "AIAgentType" NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "status" "AIUsageStatus" NOT NULL DEFAULT 'STARTED',
    "promptTokens" INTEGER,
    "completionTokens" INTEGER,
    "totalTokens" INTEGER,
    "estimatedCost" DOUBLE PRECISION,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "AIUsageRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Announcement" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModerationAction" (
    "id" TEXT NOT NULL,
    "moderatorId" TEXT NOT NULL,
    "subjectUserId" TEXT,
    "action" "ModerationActionType" NOT NULL,
    "targetType" TEXT,
    "targetId" TEXT,
    "reason" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ModerationAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SearchDocument" (
    "id" TEXT NOT NULL,
    "type" "SearchDocumentType" NOT NULL,
    "sourceId" TEXT NOT NULL,
    "teamId" TEXT,
    "robotId" TEXT,
    "ownerId" TEXT,
    "visibility" "Visibility" NOT NULL DEFAULT 'PRIVATE',
    "title" TEXT NOT NULL,
    "body" TEXT,
    "metadata" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SearchDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "User_status_idx" ON "User"("status");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Profile_userId_key" ON "Profile"("userId");

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");

-- CreateIndex
CREATE INDEX "PasswordResetToken_userId_expiresAt_idx" ON "PasswordResetToken"("userId", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Team_slug_key" ON "Team"("slug");

-- CreateIndex
CREATE INDEX "Team_ownerId_idx" ON "Team"("ownerId");

-- CreateIndex
CREATE INDEX "Team_teamNumber_idx" ON "Team"("teamNumber");

-- CreateIndex
CREATE INDEX "Team_vexTeamId_idx" ON "Team"("vexTeamId");

-- CreateIndex
CREATE INDEX "TeamMember_userId_status_idx" ON "TeamMember"("userId", "status");

-- CreateIndex
CREATE INDEX "TeamMember_teamId_permission_idx" ON "TeamMember"("teamId", "permission");

-- CreateIndex
CREATE UNIQUE INDEX "TeamMember_teamId_userId_key" ON "TeamMember"("teamId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamInvite_codeHash_key" ON "TeamInvite"("codeHash");

-- CreateIndex
CREATE INDEX "TeamInvite_teamId_expiresAt_idx" ON "TeamInvite"("teamId", "expiresAt");

-- CreateIndex
CREATE INDEX "TeamInvite_createdById_idx" ON "TeamInvite"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "UserPreference_userId_key" ON "UserPreference"("userId");

-- CreateIndex
CREATE INDEX "FollowedVexTeam_vexTeamId_idx" ON "FollowedVexTeam"("vexTeamId");

-- CreateIndex
CREATE UNIQUE INDEX "FollowedVexTeam_userId_teamNumber_key" ON "FollowedVexTeam"("userId", "teamNumber");

-- CreateIndex
CREATE UNIQUE INDEX "VexTeamCache_vexTeamId_key" ON "VexTeamCache"("vexTeamId");

-- CreateIndex
CREATE INDEX "VexTeamCache_teamNumber_idx" ON "VexTeamCache"("teamNumber");

-- CreateIndex
CREATE INDEX "VexTeamCache_expiresAt_idx" ON "VexTeamCache"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "VexEventCache_vexEventId_key" ON "VexEventCache"("vexEventId");

-- CreateIndex
CREATE INDEX "VexEventCache_eventCode_idx" ON "VexEventCache"("eventCode");

-- CreateIndex
CREATE INDEX "VexEventCache_expiresAt_idx" ON "VexEventCache"("expiresAt");

-- CreateIndex
CREATE INDEX "RankingSnapshot_seasonKey_program_teamNumber_capturedAt_idx" ON "RankingSnapshot"("seasonKey", "program", "teamNumber", "capturedAt");

-- CreateIndex
CREATE INDEX "RankingSnapshot_capturedAt_idx" ON "RankingSnapshot"("capturedAt");

-- CreateIndex
CREATE INDEX "Robot_ownerId_status_idx" ON "Robot"("ownerId", "status");

-- CreateIndex
CREATE INDEX "Robot_teamId_status_idx" ON "Robot"("teamId", "status");

-- CreateIndex
CREATE INDEX "Robot_seasonId_idx" ON "Robot"("seasonId");

-- CreateIndex
CREATE INDEX "Robot_visibility_idx" ON "Robot"("visibility");

-- CreateIndex
CREATE UNIQUE INDEX "RobotConfiguration_robotId_key" ON "RobotConfiguration"("robotId");

-- CreateIndex
CREATE INDEX "Motor_mechanismId_idx" ON "Motor"("mechanismId");

-- CreateIndex
CREATE UNIQUE INDEX "Motor_robotConfigurationId_port_key" ON "Motor"("robotConfigurationId", "port");

-- CreateIndex
CREATE INDEX "GearTrain_robotConfigurationId_idx" ON "GearTrain"("robotConfigurationId");

-- CreateIndex
CREATE INDEX "GearTrain_mechanismId_idx" ON "GearTrain"("mechanismId");

-- CreateIndex
CREATE UNIQUE INDEX "GearTrainStage_gearTrainId_sequence_key" ON "GearTrainStage"("gearTrainId", "sequence");

-- CreateIndex
CREATE INDEX "Mechanism_robotConfigurationId_sortOrder_idx" ON "Mechanism"("robotConfigurationId", "sortOrder");

-- CreateIndex
CREATE INDEX "Sensor_mechanismId_idx" ON "Sensor"("mechanismId");

-- CreateIndex
CREATE UNIQUE INDEX "Sensor_robotConfigurationId_smartPort_key" ON "Sensor"("robotConfigurationId", "smartPort");

-- CreateIndex
CREATE UNIQUE INDEX "Sensor_robotConfigurationId_threeWirePort_key" ON "Sensor"("robotConfigurationId", "threeWirePort");

-- CreateIndex
CREATE INDEX "Pneumatic_mechanismId_idx" ON "Pneumatic"("mechanismId");

-- CreateIndex
CREATE UNIQUE INDEX "Pneumatic_robotConfigurationId_threeWirePort_key" ON "Pneumatic"("robotConfigurationId", "threeWirePort");

-- CreateIndex
CREATE INDEX "ControllerMapping_robotConfigurationId_input_idx" ON "ControllerMapping"("robotConfigurationId", "input");

-- CreateIndex
CREATE INDEX "CodeProject_robotId_status_idx" ON "CodeProject"("robotId", "status");

-- CreateIndex
CREATE INDEX "CodeProject_createdById_idx" ON "CodeProject"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "CodeFile_projectId_path_key" ON "CodeFile"("projectId", "path");

-- CreateIndex
CREATE INDEX "CodeVersion_projectId_createdAt_idx" ON "CodeVersion"("projectId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CodeVersion_projectId_versionNumber_key" ON "CodeVersion"("projectId", "versionNumber");

-- CreateIndex
CREATE INDEX "AutonomousRoutine_robotId_idx" ON "AutonomousRoutine"("robotId");

-- CreateIndex
CREATE INDEX "AutonomousRoutine_projectId_idx" ON "AutonomousRoutine"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "AutonomousStep_routineId_sequence_key" ON "AutonomousStep"("routineId", "sequence");

-- CreateIndex
CREATE INDEX "AIConversation_ownerId_updatedAt_idx" ON "AIConversation"("ownerId", "updatedAt");

-- CreateIndex
CREATE INDEX "AIConversation_robotId_updatedAt_idx" ON "AIConversation"("robotId", "updatedAt");

-- CreateIndex
CREATE INDEX "AIConversation_teamId_updatedAt_idx" ON "AIConversation"("teamId", "updatedAt");

-- CreateIndex
CREATE INDEX "AIMessage_conversationId_createdAt_idx" ON "AIMessage"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "AIContextSnapshot_conversationId_createdAt_idx" ON "AIContextSnapshot"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "DiagnosticSession_createdById_createdAt_idx" ON "DiagnosticSession"("createdById", "createdAt");

-- CreateIndex
CREATE INDEX "DiagnosticSession_robotId_createdAt_idx" ON "DiagnosticSession"("robotId", "createdAt");

-- CreateIndex
CREATE INDEX "Calculation_ownerId_createdAt_idx" ON "Calculation"("ownerId", "createdAt");

-- CreateIndex
CREATE INDEX "Calculation_robotId_type_idx" ON "Calculation"("robotId", "type");

-- CreateIndex
CREATE INDEX "Calculation_teamId_type_idx" ON "Calculation"("teamId", "type");

-- CreateIndex
CREATE INDEX "BuildLog_teamId_occurredOn_idx" ON "BuildLog"("teamId", "occurredOn");

-- CreateIndex
CREATE INDEX "BuildLog_robotId_occurredOn_idx" ON "BuildLog"("robotId", "occurredOn");

-- CreateIndex
CREATE INDEX "NotebookEntry_teamId_occurredOn_idx" ON "NotebookEntry"("teamId", "occurredOn");

-- CreateIndex
CREATE INDEX "NotebookEntry_robotId_occurredOn_idx" ON "NotebookEntry"("robotId", "occurredOn");

-- CreateIndex
CREATE INDEX "Task_teamId_status_position_idx" ON "Task"("teamId", "status", "position");

-- CreateIndex
CREATE INDEX "Task_robotId_status_idx" ON "Task"("robotId", "status");

-- CreateIndex
CREATE INDEX "Task_dueAt_idx" ON "Task"("dueAt");

-- CreateIndex
CREATE INDEX "TaskAssignee_userId_idx" ON "TaskAssignee"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TaskAssignee_taskId_userId_key" ON "TaskAssignee"("taskId", "userId");

-- CreateIndex
CREATE INDEX "TaskComment_taskId_createdAt_idx" ON "TaskComment"("taskId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Competition_externalId_key" ON "Competition"("externalId");

-- CreateIndex
CREATE INDEX "Competition_teamId_startsAt_idx" ON "Competition"("teamId", "startsAt");

-- CreateIndex
CREATE INDEX "Competition_seasonId_startsAt_idx" ON "Competition"("seasonId", "startsAt");

-- CreateIndex
CREATE INDEX "Match_competitionId_scheduledAt_idx" ON "Match"("competitionId", "scheduledAt");

-- CreateIndex
CREATE UNIQUE INDEX "Match_competitionId_phase_matchNumber_key" ON "Match"("competitionId", "phase", "matchNumber");

-- CreateIndex
CREATE INDEX "MatchAlliance_teamNumber_idx" ON "MatchAlliance"("teamNumber");

-- CreateIndex
CREATE UNIQUE INDEX "MatchAlliance_matchId_color_position_key" ON "MatchAlliance"("matchId", "color", "position");

-- CreateIndex
CREATE INDEX "ScoutingTemplate_teamId_seasonId_idx" ON "ScoutingTemplate"("teamId", "seasonId");

-- CreateIndex
CREATE INDEX "ScoutingReport_teamId_competitionId_idx" ON "ScoutingReport"("teamId", "competitionId");

-- CreateIndex
CREATE INDEX "ScoutingReport_observedTeamNo_competitionId_idx" ON "ScoutingReport"("observedTeamNo", "competitionId");

-- CreateIndex
CREATE UNIQUE INDEX "ForumCategory_slug_key" ON "ForumCategory"("slug");

-- CreateIndex
CREATE INDEX "ForumCategory_parentCategoryId_sortOrder_idx" ON "ForumCategory"("parentCategoryId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "ForumThread_slug_key" ON "ForumThread"("slug");

-- CreateIndex
CREATE INDEX "ForumThread_categoryId_status_lastReplyAt_idx" ON "ForumThread"("categoryId", "status", "lastReplyAt");

-- CreateIndex
CREATE INDEX "ForumThread_authorId_createdAt_idx" ON "ForumThread"("authorId", "createdAt");

-- CreateIndex
CREATE INDEX "ForumThread_teamId_idx" ON "ForumThread"("teamId");

-- CreateIndex
CREATE INDEX "ForumThread_robotId_idx" ON "ForumThread"("robotId");

-- CreateIndex
CREATE INDEX "ForumPost_threadId_createdAt_idx" ON "ForumPost"("threadId", "createdAt");

-- CreateIndex
CREATE INDEX "ForumPost_authorId_createdAt_idx" ON "ForumPost"("authorId", "createdAt");

-- CreateIndex
CREATE INDEX "ForumVote_userId_idx" ON "ForumVote"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ForumVote_postId_userId_key" ON "ForumVote"("postId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "ForumSolution_threadId_key" ON "ForumSolution"("threadId");

-- CreateIndex
CREATE UNIQUE INDEX "ForumSolution_postId_key" ON "ForumSolution"("postId");

-- CreateIndex
CREATE INDEX "ForumReport_status_createdAt_idx" ON "ForumReport"("status", "createdAt");

-- CreateIndex
CREATE INDEX "ForumReport_reporterId_idx" ON "ForumReport"("reporterId");

-- CreateIndex
CREATE INDEX "UserBlock_blockedId_idx" ON "UserBlock"("blockedId");

-- CreateIndex
CREATE UNIQUE INDEX "UserBlock_blockerId_blockedId_key" ON "UserBlock"("blockerId", "blockedId");

-- CreateIndex
CREATE INDEX "Notification_userId_readAt_createdAt_idx" ON "Notification"("userId", "readAt", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Part_sku_key" ON "Part"("sku");

-- CreateIndex
CREATE INDEX "Part_category_isPublished_idx" ON "Part"("category", "isPublished");

-- CreateIndex
CREATE INDEX "Part_seasonId_idx" ON "Part"("seasonId");

-- CreateIndex
CREATE INDEX "PartCompatibility_compatiblePartId_idx" ON "PartCompatibility"("compatiblePartId");

-- CreateIndex
CREATE UNIQUE INDEX "PartCompatibility_partId_compatiblePartId_key" ON "PartCompatibility"("partId", "compatiblePartId");

-- CreateIndex
CREATE UNIQUE INDEX "Guide_slug_key" ON "Guide"("slug");

-- CreateIndex
CREATE INDEX "Guide_seasonId_publishedAt_idx" ON "Guide"("seasonId", "publishedAt");

-- CreateIndex
CREATE INDEX "Guide_visibility_publishedAt_idx" ON "Guide"("visibility", "publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "MechanismGuide_guideId_key" ON "MechanismGuide"("guideId");

-- CreateIndex
CREATE INDEX "MechanismGuide_mechanismType_idx" ON "MechanismGuide"("mechanismType");

-- CreateIndex
CREATE UNIQUE INDEX "Season_key_key" ON "Season"("key");

-- CreateIndex
CREATE INDEX "Season_isCurrent_idx" ON "Season"("isCurrent");

-- CreateIndex
CREATE INDEX "GameRule_seasonId_type_isCurrent_idx" ON "GameRule"("seasonId", "type", "isCurrent");

-- CreateIndex
CREATE INDEX "GameRule_seasonId_ruleNumber_idx" ON "GameRule"("seasonId", "ruleNumber");

-- CreateIndex
CREATE UNIQUE INDEX "MediaAsset_storageKey_key" ON "MediaAsset"("storageKey");

-- CreateIndex
CREATE INDEX "MediaAsset_ownerId_createdAt_idx" ON "MediaAsset"("ownerId", "createdAt");

-- CreateIndex
CREATE INDEX "MediaAsset_teamId_createdAt_idx" ON "MediaAsset"("teamId", "createdAt");

-- CreateIndex
CREATE INDEX "MediaAsset_robotId_createdAt_idx" ON "MediaAsset"("robotId", "createdAt");

-- CreateIndex
CREATE INDEX "ContentAttachment_targetType_targetId_sortOrder_idx" ON "ContentAttachment"("targetType", "targetId", "sortOrder");

-- CreateIndex
CREATE INDEX "AIUsageRecord_createdAt_agent_idx" ON "AIUsageRecord"("createdAt", "agent");

-- CreateIndex
CREATE INDEX "AIUsageRecord_userId_createdAt_idx" ON "AIUsageRecord"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AIUsageRecord_teamId_createdAt_idx" ON "AIUsageRecord"("teamId", "createdAt");

-- CreateIndex
CREATE INDEX "Announcement_isPublished_publishedAt_idx" ON "Announcement"("isPublished", "publishedAt");

-- CreateIndex
CREATE INDEX "ModerationAction_subjectUserId_createdAt_idx" ON "ModerationAction"("subjectUserId", "createdAt");

-- CreateIndex
CREATE INDEX "ModerationAction_targetType_targetId_idx" ON "ModerationAction"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "AuditLog_targetType_targetId_createdAt_idx" ON "AuditLog"("targetType", "targetId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_createdAt_idx" ON "AuditLog"("actorId", "createdAt");

-- CreateIndex
CREATE INDEX "SearchDocument_teamId_visibility_idx" ON "SearchDocument"("teamId", "visibility");

-- CreateIndex
CREATE INDEX "SearchDocument_robotId_visibility_idx" ON "SearchDocument"("robotId", "visibility");

-- CreateIndex
CREATE INDEX "SearchDocument_ownerId_visibility_idx" ON "SearchDocument"("ownerId", "visibility");

-- CreateIndex
CREATE UNIQUE INDEX "SearchDocument_type_sourceId_key" ON "SearchDocument"("type", "sourceId");

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_currentSeasonId_fkey" FOREIGN KEY ("currentSeasonId") REFERENCES "Season"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamInvite" ADD CONSTRAINT "TeamInvite_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamInvite" ADD CONSTRAINT "TeamInvite_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPreference" ADD CONSTRAINT "UserPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FollowedVexTeam" ADD CONSTRAINT "FollowedVexTeam_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Robot" ADD CONSTRAINT "Robot_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Robot" ADD CONSTRAINT "Robot_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Robot" ADD CONSTRAINT "Robot_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RobotConfiguration" ADD CONSTRAINT "RobotConfiguration_robotId_fkey" FOREIGN KEY ("robotId") REFERENCES "Robot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Motor" ADD CONSTRAINT "Motor_robotConfigurationId_fkey" FOREIGN KEY ("robotConfigurationId") REFERENCES "RobotConfiguration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Motor" ADD CONSTRAINT "Motor_mechanismId_fkey" FOREIGN KEY ("mechanismId") REFERENCES "Mechanism"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GearTrain" ADD CONSTRAINT "GearTrain_robotConfigurationId_fkey" FOREIGN KEY ("robotConfigurationId") REFERENCES "RobotConfiguration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GearTrain" ADD CONSTRAINT "GearTrain_mechanismId_fkey" FOREIGN KEY ("mechanismId") REFERENCES "Mechanism"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GearTrain" ADD CONSTRAINT "GearTrain_inputMotorId_fkey" FOREIGN KEY ("inputMotorId") REFERENCES "Motor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GearTrainStage" ADD CONSTRAINT "GearTrainStage_gearTrainId_fkey" FOREIGN KEY ("gearTrainId") REFERENCES "GearTrain"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mechanism" ADD CONSTRAINT "Mechanism_robotConfigurationId_fkey" FOREIGN KEY ("robotConfigurationId") REFERENCES "RobotConfiguration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mechanism" ADD CONSTRAINT "Mechanism_parentMechanismId_fkey" FOREIGN KEY ("parentMechanismId") REFERENCES "Mechanism"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sensor" ADD CONSTRAINT "Sensor_robotConfigurationId_fkey" FOREIGN KEY ("robotConfigurationId") REFERENCES "RobotConfiguration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sensor" ADD CONSTRAINT "Sensor_mechanismId_fkey" FOREIGN KEY ("mechanismId") REFERENCES "Mechanism"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pneumatic" ADD CONSTRAINT "Pneumatic_robotConfigurationId_fkey" FOREIGN KEY ("robotConfigurationId") REFERENCES "RobotConfiguration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pneumatic" ADD CONSTRAINT "Pneumatic_mechanismId_fkey" FOREIGN KEY ("mechanismId") REFERENCES "Mechanism"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ControllerMapping" ADD CONSTRAINT "ControllerMapping_robotConfigurationId_fkey" FOREIGN KEY ("robotConfigurationId") REFERENCES "RobotConfiguration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ControllerMapping" ADD CONSTRAINT "ControllerMapping_mechanismId_fkey" FOREIGN KEY ("mechanismId") REFERENCES "Mechanism"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ControllerMapping" ADD CONSTRAINT "ControllerMapping_motorId_fkey" FOREIGN KEY ("motorId") REFERENCES "Motor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ControllerMapping" ADD CONSTRAINT "ControllerMapping_pneumaticId_fkey" FOREIGN KEY ("pneumaticId") REFERENCES "Pneumatic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CodeProject" ADD CONSTRAINT "CodeProject_robotId_fkey" FOREIGN KEY ("robotId") REFERENCES "Robot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CodeProject" ADD CONSTRAINT "CodeProject_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CodeFile" ADD CONSTRAINT "CodeFile_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "CodeProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CodeVersion" ADD CONSTRAINT "CodeVersion_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "CodeProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CodeVersion" ADD CONSTRAINT "CodeVersion_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CodeVersion" ADD CONSTRAINT "CodeVersion_parentVersionId_fkey" FOREIGN KEY ("parentVersionId") REFERENCES "CodeVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutonomousRoutine" ADD CONSTRAINT "AutonomousRoutine_robotId_fkey" FOREIGN KEY ("robotId") REFERENCES "Robot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutonomousRoutine" ADD CONSTRAINT "AutonomousRoutine_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "CodeProject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutonomousStep" ADD CONSTRAINT "AutonomousStep_routineId_fkey" FOREIGN KEY ("routineId") REFERENCES "AutonomousRoutine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIConversation" ADD CONSTRAINT "AIConversation_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIConversation" ADD CONSTRAINT "AIConversation_robotId_fkey" FOREIGN KEY ("robotId") REFERENCES "Robot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIConversation" ADD CONSTRAINT "AIConversation_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIConversation" ADD CONSTRAINT "AIConversation_codeProjectId_fkey" FOREIGN KEY ("codeProjectId") REFERENCES "CodeProject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIMessage" ADD CONSTRAINT "AIMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "AIConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIMessage" ADD CONSTRAINT "AIMessage_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIContextSnapshot" ADD CONSTRAINT "AIContextSnapshot_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "AIConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiagnosticSession" ADD CONSTRAINT "DiagnosticSession_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiagnosticSession" ADD CONSTRAINT "DiagnosticSession_robotId_fkey" FOREIGN KEY ("robotId") REFERENCES "Robot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiagnosticSession" ADD CONSTRAINT "DiagnosticSession_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "AIConversation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Calculation" ADD CONSTRAINT "Calculation_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Calculation" ADD CONSTRAINT "Calculation_robotId_fkey" FOREIGN KEY ("robotId") REFERENCES "Robot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Calculation" ADD CONSTRAINT "Calculation_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuildLog" ADD CONSTRAINT "BuildLog_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuildLog" ADD CONSTRAINT "BuildLog_robotId_fkey" FOREIGN KEY ("robotId") REFERENCES "Robot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuildLog" ADD CONSTRAINT "BuildLog_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotebookEntry" ADD CONSTRAINT "NotebookEntry_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotebookEntry" ADD CONSTRAINT "NotebookEntry_robotId_fkey" FOREIGN KEY ("robotId") REFERENCES "Robot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotebookEntry" ADD CONSTRAINT "NotebookEntry_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_robotId_fkey" FOREIGN KEY ("robotId") REFERENCES "Robot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskAssignee" ADD CONSTRAINT "TaskAssignee_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskAssignee" ADD CONSTRAINT "TaskAssignee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskComment" ADD CONSTRAINT "TaskComment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskComment" ADD CONSTRAINT "TaskComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Competition" ADD CONSTRAINT "Competition_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Competition" ADD CONSTRAINT "Competition_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Competition" ADD CONSTRAINT "Competition_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "Competition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchAlliance" ADD CONSTRAINT "MatchAlliance_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScoutingTemplate" ADD CONSTRAINT "ScoutingTemplate_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScoutingTemplate" ADD CONSTRAINT "ScoutingTemplate_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScoutingReport" ADD CONSTRAINT "ScoutingReport_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScoutingReport" ADD CONSTRAINT "ScoutingReport_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "Competition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScoutingReport" ADD CONSTRAINT "ScoutingReport_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScoutingReport" ADD CONSTRAINT "ScoutingReport_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ScoutingTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScoutingReport" ADD CONSTRAINT "ScoutingReport_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumCategory" ADD CONSTRAINT "ForumCategory_parentCategoryId_fkey" FOREIGN KEY ("parentCategoryId") REFERENCES "ForumCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumThread" ADD CONSTRAINT "ForumThread_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ForumCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumThread" ADD CONSTRAINT "ForumThread_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumThread" ADD CONSTRAINT "ForumThread_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumThread" ADD CONSTRAINT "ForumThread_robotId_fkey" FOREIGN KEY ("robotId") REFERENCES "Robot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumPost" ADD CONSTRAINT "ForumPost_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "ForumThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumPost" ADD CONSTRAINT "ForumPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumPost" ADD CONSTRAINT "ForumPost_parentPostId_fkey" FOREIGN KEY ("parentPostId") REFERENCES "ForumPost"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumVote" ADD CONSTRAINT "ForumVote_postId_fkey" FOREIGN KEY ("postId") REFERENCES "ForumPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumVote" ADD CONSTRAINT "ForumVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumSolution" ADD CONSTRAINT "ForumSolution_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "ForumThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumSolution" ADD CONSTRAINT "ForumSolution_postId_fkey" FOREIGN KEY ("postId") REFERENCES "ForumPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumReport" ADD CONSTRAINT "ForumReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumReport" ADD CONSTRAINT "ForumReport_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumReport" ADD CONSTRAINT "ForumReport_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "ForumThread"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumReport" ADD CONSTRAINT "ForumReport_postId_fkey" FOREIGN KEY ("postId") REFERENCES "ForumPost"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBlock" ADD CONSTRAINT "UserBlock_blockerId_fkey" FOREIGN KEY ("blockerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBlock" ADD CONSTRAINT "UserBlock_blockedId_fkey" FOREIGN KEY ("blockedId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Part" ADD CONSTRAINT "Part_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Part" ADD CONSTRAINT "Part_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartCompatibility" ADD CONSTRAINT "PartCompatibility_partId_fkey" FOREIGN KEY ("partId") REFERENCES "Part"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartCompatibility" ADD CONSTRAINT "PartCompatibility_compatiblePartId_fkey" FOREIGN KEY ("compatiblePartId") REFERENCES "Part"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Guide" ADD CONSTRAINT "Guide_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Guide" ADD CONSTRAINT "Guide_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MechanismGuide" ADD CONSTRAINT "MechanismGuide_guideId_fkey" FOREIGN KEY ("guideId") REFERENCES "Guide"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameRule" ADD CONSTRAINT "GameRule_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_robotId_fkey" FOREIGN KEY ("robotId") REFERENCES "Robot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentAttachment" ADD CONSTRAINT "ContentAttachment_mediaAssetId_fkey" FOREIGN KEY ("mediaAssetId") REFERENCES "MediaAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIUsageRecord" ADD CONSTRAINT "AIUsageRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIUsageRecord" ADD CONSTRAINT "AIUsageRecord_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIUsageRecord" ADD CONSTRAINT "AIUsageRecord_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "AIConversation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModerationAction" ADD CONSTRAINT "ModerationAction_moderatorId_fkey" FOREIGN KEY ("moderatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModerationAction" ADD CONSTRAINT "ModerationAction_subjectUserId_fkey" FOREIGN KEY ("subjectUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SearchDocument" ADD CONSTRAINT "SearchDocument_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SearchDocument" ADD CONSTRAINT "SearchDocument_robotId_fkey" FOREIGN KEY ("robotId") REFERENCES "Robot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

