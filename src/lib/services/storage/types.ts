/**
 * File storage is intentionally independent of a cloud vendor. Application
 * services validate ownership and content policy before calling an adapter.
 */

export type StorageProviderId = "local" | "s3" | "r2" | "gcs" | (string & {});

export type UploadSubjectType =
  | "robot"
  | "mechanism"
  | "ai_message"
  | "diagnostic"
  | "calculation"
  | "build_log"
  | "notebook_entry"
  | "task"
  | "task_comment"
  | "forum_thread"
  | "forum_post"
  | "part"
  | "guide"
  | "scouting_report";

export interface StorageObjectMetadata {
  contentType: string;
  contentLength: number;
  cacheControl?: string;
  checksum?: string;
  custom?: Readonly<Record<string, string>>;
}

export interface StorageObject {
  key: string;
  fileName: string;
  metadata: StorageObjectMetadata;
  createdAt: Date;
  updatedAt?: Date;
  etag?: string;
}

export interface StorageUploadPolicy {
  maxBytes: number;
  allowedContentTypes: readonly string[];
  allowedExtensions?: readonly string[];
  requireChecksum?: boolean;
}

export interface StorageUploadRequest {
  key: string;
  fileName: string;
  content: Uint8Array | AsyncIterable<Uint8Array>;
  metadata: StorageObjectMetadata;
  subject: {
    type: UploadSubjectType;
    id: string;
    actorUserId: string;
    teamId?: string;
    robotId?: string;
  };
}

export interface PresignedUploadRequest {
  key: string;
  fileName: string;
  metadata: StorageObjectMetadata;
  expiresInSeconds: number;
  subject: StorageUploadRequest["subject"];
}

export interface PresignedUpload {
  url: string;
  method: "PUT" | "POST";
  headers: Readonly<Record<string, string>>;
  fields?: Readonly<Record<string, string>>;
  expiresAt: Date;
}

export interface SignedReadUrl {
  url: string;
  expiresAt: Date;
}

export type StorageValidationResult =
  | { ok: true }
  | {
      ok: false;
      code: "file_too_large" | "unsupported_content_type" | "unsupported_extension" | "checksum_required";
      message: string;
    };

export interface StorageListRequest {
  prefix?: string;
  cursor?: string;
  limit?: number;
}

export interface StorageListResult {
  objects: readonly StorageObject[];
  nextCursor?: string;
}

export interface StorageProvider {
  readonly id: StorageProviderId;

  validateUpload(
    request: Pick<StorageUploadRequest, "fileName" | "metadata">,
    policy: StorageUploadPolicy,
  ): StorageValidationResult;
  put(request: StorageUploadRequest): Promise<StorageObject>;
  createPresignedUpload(request: PresignedUploadRequest): Promise<PresignedUpload>;
  createSignedReadUrl(key: string, expiresInSeconds: number): Promise<SignedReadUrl>;
  getMetadata(key: string): Promise<StorageObject | null>;
  list(request?: StorageListRequest): Promise<StorageListResult>;
  delete(key: string): Promise<void>;
}

export interface StorageProviderRegistry {
  get(providerId?: StorageProviderId): StorageProvider;
  list(): readonly StorageProviderId[];
}
