import type { AIContextBundle, ContextCitation } from "./context";

/** A vendor-neutral contract; adapters own each provider SDK and secret. */
export type AIProviderCapability =
  | "text_generation"
  | "text_streaming"
  | "image_analysis"
  | "code_generation"
  | "structured_output";

export type AIMessageRole = "system" | "user" | "assistant" | "tool";

export interface AIMessageInput {
  role: AIMessageRole;
  content: string;
  name?: string;
}

export interface AIUsage {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  estimatedCostUsd?: number;
}

export interface AITextGenerationRequest {
  messages: readonly AIMessageInput[];
  systemInstructions?: string;
  context?: AIContextBundle;
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
  responseSchema?: Record<string, unknown>;
  metadata?: Record<string, string>;
}

export interface AITextGenerationResponse {
  id: string;
  provider: string;
  model: string;
  content: string;
  structuredOutput?: unknown;
  citations: readonly ContextCitation[];
  usage?: AIUsage;
  finishReason: "stop" | "length" | "tool_call" | "content_filter" | "error";
}

export type AITextStreamEvent =
  | { type: "text_delta"; delta: string }
  | { type: "citation"; citation: ContextCitation }
  | { type: "structured_output"; value: unknown }
  | { type: "usage"; usage: AIUsage }
  | {
      type: "complete";
      response: Omit<AITextGenerationResponse, "content"> & { content?: string };
    }
  | { type: "error"; message: string; retryable: boolean };

export interface AIImageInput {
  contentType: string;
  fileName?: string;
  bytes?: Uint8Array;
  url?: string;
}

export interface AIImageAnalysisRequest {
  image: AIImageInput;
  prompt: string;
  context?: AIContextBundle;
  model?: string;
}

export interface AIImageAnalysisResponse {
  provider: string;
  model: string;
  description: string;
  observations: readonly {
    label: string;
    confidence?: number;
    evidenceStatus: "known" | "estimated" | "unknown";
  }[];
  citations: readonly ContextCitation[];
  usage?: AIUsage;
}

export interface CodeGenerationRequest {
  prompt: string;
  language: "vexcode_python" | "vexcode_cpp" | "pros_cpp";
  context: AIContextBundle;
  existingFiles?: readonly {
    path: string;
    content: string;
  }[];
  requirements?: readonly string[];
}

export interface GeneratedCodeFile {
  path: string;
  content: string;
  language: string;
  purpose?: string;
}

export interface CodeGenerationResponse {
  provider: string;
  model: string;
  files: readonly GeneratedCodeFile[];
  explanation: string;
  assumptions: readonly string[];
  validationWarnings: readonly string[];
  citations: readonly ContextCitation[];
  usage?: AIUsage;
}

export interface AIProvider {
  readonly id: string;
  readonly capabilities: readonly AIProviderCapability[];

  generateText(request: AITextGenerationRequest): Promise<AITextGenerationResponse>;
  streamText(request: AITextGenerationRequest): AsyncIterable<AITextStreamEvent>;
  analyzeImage(request: AIImageAnalysisRequest): Promise<AIImageAnalysisResponse>;
  generateCode(request: CodeGenerationRequest): Promise<CodeGenerationResponse>;
}

export interface AIProviderRegistry {
  get(providerId?: string): AIProvider;
  list(): readonly Pick<AIProvider, "id" | "capabilities">[];
}

export interface AIAgentRequest {
  actorUserId: string;
  prompt: string;
  context: AIContextBundle;
  providerId?: string;
}

export interface AIAgent<TResult> {
  readonly id:
    | "robot_engineer"
    | "diagnostics"
    | "code"
    | "autonomous"
    | "mechanical_design"
    | "notebook"
    | "strategy"
    | "learning"
    | "forum";
  run(request: AIAgentRequest): Promise<TResult>;
}
