/**
 * DrishtiGuard contract surface v1.
 *
 * Wire-facing shapes in this file mirror
 * `contracts/v1/drishtiguard.schema.json`. JSON Schema remains the runtime
 * authority; the brands below prevent accidental mixing at compile time only.
 */

export const SCHEMA_VERSION = "1.0" as const;

export type SchemaVersion = typeof SCHEMA_VERSION;

declare const opaqueIdBrand: unique symbol;
declare const opaqueIdKindBrand: unique symbol;
declare const sha256Brand: unique symbol;
declare const timestampBrand: unique symbol;
declare const localOnlyHandleBrand: unique symbol;
declare const verifiedCapabilityBrand: unique symbol;

/** Runtime validation enforces the schema's opaque-ID pattern and length. */
export type OpaqueId = string & {
  readonly [opaqueIdBrand]: "OpaqueId";
};

type OpaqueIdOf<Kind extends string> = OpaqueId & {
  readonly [opaqueIdKindBrand]: Kind;
};

export type TaskId = OpaqueIdOf<"TaskId">;
export type RequestId = OpaqueIdOf<"RequestId">;
export type SnapshotId = OpaqueIdOf<"SnapshotId">;
export type NavigationId = OpaqueIdOf<"NavigationId">;
export type DocumentId = OpaqueIdOf<"DocumentId">;
export type DocumentFrameId = OpaqueIdOf<"DocumentFrameId">;
export type ElementId = OpaqueIdOf<"ElementId">;
export type FindingId = OpaqueIdOf<"FindingId">;
export type RedactionRegionId = OpaqueIdOf<"RedactionRegionId">;
export type TokenId = OpaqueIdOf<"TokenId">;
export type ActionId = OpaqueIdOf<"ActionId">;
export type CorrelationId = OpaqueIdOf<"CorrelationId">;

/** Lowercase hexadecimal SHA-256 digest. */
export type Sha256 = string & {
  readonly [sha256Brand]: "Sha256";
};

/** RFC 3339 date-time string. */
export type Timestamp = string & {
  readonly [timestampBrand]: "Timestamp";
};

type LocalOnlyHandle<Name extends string> = {
  readonly [localOnlyHandleBrand]: Name;
  readonly toJSON?: never;
};

/**
 * Compile-time local-only capabilities. Trusted modules must create these and
 * runtime serializers must reject the local-only brand; TypeScript brands do
 * not by themselves change JSON.stringify behaviour.
 */
export type RawBitmapHandle = `local:bitmap:${string}` &
  LocalOnlyHandle<"RawBitmapHandle">;
export type RawDomHandle = `local:dom:${string}` &
  LocalOnlyHandle<"RawDomHandle">;
export type SensitiveValueHandle = `local:value:${string}` &
  LocalOnlyHandle<"SensitiveValueHandle">;
export type SanitizedImageHandle = `local:sanitized-image:${string}` &
  LocalOnlyHandle<"SanitizedImageHandle">;
export type OriginHandle = `local:origin:${string}` &
  LocalOnlyHandle<"OriginHandle">;

export type Confidence = number;

export type CoordinateSpace =
  | "ROOT_VISUAL_VIEWPORT_CSS"
  | "ENCODED_IMAGE_PIXELS";

export interface BoundingBox {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly coordinate_space: CoordinateSpace;
}

export interface NormalizedBoundingBox {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly coordinate_space: "ROOT_VISUAL_VIEWPORT_CSS";
}

export interface PixelBoundingBox {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly coordinate_space: "ENCODED_IMAGE_PIXELS";
}

export interface Viewport {
  readonly css_width: number;
  readonly css_height: number;
  readonly scroll_x: number;
  readonly scroll_y: number;
  readonly image_width: number;
  readonly image_height: number;
  readonly observed_scale_x: number;
  readonly observed_scale_y: number;
  readonly device_pixel_ratio: number;
  readonly browser_zoom: number;
}

/** Local-only even though its handle syntax is described by JSON Schema. */
export interface FrameSnapshotLocal {
  readonly schema_version: SchemaVersion;
  readonly task_id: TaskId;
  readonly tab_id: number;
  readonly snapshot_id: SnapshotId;
  readonly navigation_id: NavigationId;
  readonly document_id: DocumentId;
  readonly mutation_epoch: number;
  readonly captured_at: Timestamp;
  readonly viewport: Viewport;
  readonly origin_handle: OriginHandle;
  readonly raw_bitmap_handle: RawBitmapHandle;
  readonly raw_dom_handle: RawDomHandle;
}

export type ElementRole =
  | "BUTTON"
  | "LINK"
  | "INPUT"
  | "TEXTAREA"
  | "SELECT"
  | "OPTION"
  | "CHECKBOX"
  | "RADIO"
  | "MENU"
  | "MENU_ITEM"
  | "TAB"
  | "DIALOG"
  | "STATUS"
  | "TEXT"
  | "ICON"
  | "IMAGE"
  | "DOCUMENT"
  | "FACE"
  | "CONTAINER"
  | "UNKNOWN";

export type ElementSource = "DOM" | "VISION" | "FUSED";

export interface VisualElement {
  readonly schema_version: SchemaVersion;
  readonly element_id: ElementId;
  readonly role: ElementRole;
  readonly sanitized_label: string;
  readonly bounding_box: NormalizedBoundingBox;
  readonly document_frame_id: DocumentFrameId;
  readonly source: ElementSource;
  readonly confidence: Confidence;
  readonly snapshot_id: SnapshotId;
  readonly executable: boolean;
}

export type SafeInputCategory =
  | "NONE"
  | "GENERAL_TEXT"
  | "NUMBER"
  | "DATE"
  | "CHOICE"
  | "SENSITIVE_TOKEN_ONLY"
  | "FORBIDDEN_SECRET";

export interface DomElement {
  readonly element_id: ElementId;
  readonly parent_element_id?: ElementId;
  readonly document_frame_id: DocumentFrameId;
  readonly role: ElementRole;
  readonly sanitized_label: string;
  readonly bounding_box: NormalizedBoundingBox;
  readonly visible: boolean;
  readonly enabled: boolean;
  readonly editable: boolean;
  readonly checked?: boolean;
  readonly selected?: boolean;
  readonly safe_input_category?: SafeInputCategory;
  readonly source: ElementSource;
  readonly confidence: Confidence;
  readonly executable: boolean;
}

export interface DomElementGraph {
  readonly schema_version: SchemaVersion;
  readonly snapshot_id: SnapshotId;
  readonly navigation_id: NavigationId;
  readonly mutation_epoch: number;
  readonly elements: readonly DomElement[];
  readonly truncated: boolean;
}

export type PrivacyClass =
  | "PERSON"
  | "FACE"
  | "EMAIL"
  | "PHONE"
  | "ADDRESS"
  | "EMPLOYEE_ID"
  | "PAN"
  | "AADHAAR"
  | "BANK_ACCOUNT"
  | "IFSC"
  | "PAYMENT_CARD"
  | "FINANCIAL_AMOUNT"
  | "MEDICAL"
  | "DOCUMENT"
  | "SIGNATURE"
  | "QR_BARCODE"
  | "PASSWORD"
  | "OTP"
  | "AUTH_TOKEN"
  | "PRIVATE_KEY"
  | "ORG_CONFIDENTIAL"
  | "OTHER_SENSITIVE";

export type FindingSource =
  | "DOM"
  | "OCR"
  | "VISION"
  | "PATTERN"
  | "NER"
  | "USER"
  | "SITE_POLICY";

export type CoverageStatus =
  | "SCANNED"
  | "MASKED"
  | "SAFE_BY_POLICY"
  | "UNKNOWN";

export type FindingSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type RedactionPolicy =
  | "TOKENIZE"
  | "SOLID_MASK"
  | "GENERALIZE"
  | "DROP"
  | "BLOCK";

export interface SensitiveFinding {
  readonly schema_version: SchemaVersion;
  readonly finding_id: FindingId;
  readonly privacy_class: PrivacyClass;
  readonly sources: readonly FindingSource[];
  readonly bounding_box?: NormalizedBoundingBox;
  readonly document_frame_id?: DocumentFrameId;
  readonly confidence: Confidence;
  readonly severity: FindingSeverity;
  readonly redaction_policy: RedactionPolicy;
  readonly coverage_status: CoverageStatus;
}

/** TypeScript-only local refinement; never pass it to a generic serializer. */
export interface SensitiveFindingLocal extends SensitiveFinding {
  readonly value_handle: SensitiveValueHandle;
}

export type MaskMode =
  | "SOLID_OPAQUE"
  | "TYPED_REPLACEMENT"
  | "DROP_REGION";

interface RedactionRegionBase {
  readonly schema_version: SchemaVersion;
  readonly region_id: RedactionRegionId;
  readonly snapshot_id: SnapshotId;
  readonly finding_ids: readonly FindingId[];
  readonly normalized_box: NormalizedBoundingBox;
  readonly pixel_box: PixelBoundingBox;
  readonly padding_css_px: number;
  readonly compositor_version: string;
}

export type RedactionRegion = RedactionRegionBase &
  (
    | {
        readonly mask_mode: "TYPED_REPLACEMENT";
        readonly replacement_class: PrivacyClass;
      }
    | {
        readonly mask_mode: "SOLID_OPAQUE" | "DROP_REGION";
        readonly replacement_class?: never;
      }
  );

export interface CountByClass {
  readonly privacy_class: PrivacyClass;
  readonly count: number;
}

export interface ComponentVersion {
  readonly component: string;
  readonly version: string;
}

export type PrivacyVerificationStatus =
  | "UNVERIFIED"
  | "VERIFYING"
  | "SAFE_TO_SEND"
  | "REQUIRES_ADDITIONAL_MASKING"
  | "BLOCKED_LOW_COVERAGE"
  | "BLOCKED_RESIDUAL_PII"
  | "BLOCKED_POLICY";

export type MaskAreaBucket =
  | "NONE"
  | "LT_5_PERCENT"
  | "5_TO_15_PERCENT"
  | "15_TO_35_PERCENT"
  | "GT_35_PERCENT";

interface PrivacyManifestBase {
  readonly schema_version: SchemaVersion;
  readonly policy_version: string;
  readonly components: readonly ComponentVersion[];
  readonly finding_counts: readonly CountByClass[];
  readonly mask_counts: readonly CountByClass[];
  readonly token_counts: readonly CountByClass[];
  readonly coverage_total: number;
  readonly mask_area_bucket?: MaskAreaBucket;
  readonly sanitized_json_bytes: number;
  readonly attempt: number;
}

type NonSafePrivacyVerificationStatus = Exclude<
  PrivacyVerificationStatus,
  "SAFE_TO_SEND"
>;

export type PrivacyManifest = PrivacyManifestBase &
  (
    | {
        readonly verification_status: "SAFE_TO_SEND";
        readonly coverage_unknown: 0;
      }
    | {
        readonly verification_status: NonSafePrivacyVerificationStatus;
        readonly coverage_unknown: number;
      }
  ) &
  (
    | {
        readonly image_included: true;
        readonly sanitized_image_bytes: number;
      }
    | {
        readonly image_included: false;
        readonly sanitized_image_bytes?: never;
      }
  );

export type SafePrivacyManifest = PrivacyManifest & {
  readonly verification_status: "SAFE_TO_SEND";
  readonly coverage_unknown: 0;
};

interface SanitizedSceneBase {
  readonly schema_version: SchemaVersion;
  readonly snapshot_id: SnapshotId;
  readonly navigation_id: NavigationId;
  readonly mutation_epoch: number;
  readonly sanitized_elements: readonly VisualElement[];
  readonly verification_status: "SAFE_TO_SEND";
}

/** Wire-safe scene; image metadata and multipart identity move together. */
export type SanitizedScene = SanitizedSceneBase &
  (
    | {
        readonly sanitized_image_part_id: string;
        readonly privacy_manifest: SafePrivacyManifest & {
          readonly image_included: true;
          readonly sanitized_image_bytes: number;
        };
      }
    | {
        readonly sanitized_image_part_id?: never;
        readonly privacy_manifest: SafePrivacyManifest & {
          readonly image_included: false;
          readonly sanitized_image_bytes?: never;
        };
      }
  );

/**
 * TypeScript-only compiler/verifier form. The image handle points to a newly
 * encoded sanitized artifact, never to the captured bitmap.
 */
export interface SanitizedSceneLocal {
  readonly schema_version: SchemaVersion;
  readonly snapshot_id: SnapshotId;
  readonly navigation_id: NavigationId;
  readonly mutation_epoch: number;
  readonly sanitized_elements: readonly VisualElement[];
  readonly sanitized_image_handle?: SanitizedImageHandle;
  readonly privacy_manifest: PrivacyManifest;
  readonly verification_status: PrivacyVerificationStatus;
}

export interface VerifiedEnvelope {
  readonly schema_version: SchemaVersion;
  readonly task_id: TaskId;
  readonly request_id: RequestId;
  readonly snapshot_id: SnapshotId;
  readonly policy_version: string;
  readonly body_sha256: Sha256;
  readonly expires_at: Timestamp;
  readonly decision: "SAFE_TO_SEND";
}

/** Local capability form accepted by the gateway after runtime verification. */
export type VerifiedEnvelopeCapability = Readonly<VerifiedEnvelope> & {
  readonly [verifiedCapabilityBrand]: "VerifiedEnvelopeCapability";
};

/** Kept derivationally identical to the Action discriminator union below. */
export type AllowedActionType = Action["type"];

interface RemoteInferenceRequestBase {
  readonly schema_version: SchemaVersion;
  readonly request_id: RequestId;
  readonly task_id: TaskId;
  readonly snapshot_id: SnapshotId;
  readonly navigation_id: NavigationId;
  readonly mutation_epoch: number;
  readonly sanitized_task: string;
  readonly sanitized_scene: SanitizedScene;
  readonly allowed_actions: readonly AllowedActionType[];
  readonly policy_version: string;
  readonly expires_at: Timestamp;
}

type RemoteSiteLocator =
  | {
      readonly site_profile_id: string;
      readonly origin_alias?: string;
    }
  | {
      readonly site_profile_id?: string;
      readonly origin_alias: string;
    };

/** At least one of site_profile_id and origin_alias is required. */
export type RemoteInferenceRequest = RemoteInferenceRequestBase &
  RemoteSiteLocator;

export interface ClickAction {
  readonly type: "CLICK";
  readonly element_id: ElementId;
}

export interface FocusAction {
  readonly type: "FOCUS";
  readonly element_id: ElementId;
}

export type ScrollDirection = "UP" | "DOWN" | "LEFT" | "RIGHT";
export type ScrollAmount = "SMALL" | "MEDIUM" | "VIEWPORT";

export interface ScrollAction {
  readonly type: "SCROLL";
  readonly direction: ScrollDirection;
  readonly amount: ScrollAmount;
}

export interface LiteralSafeValue {
  readonly kind: "LITERAL_SAFE";
  readonly value: string;
}

export interface TokenReferenceValue {
  readonly kind: "TOKEN_REF";
  readonly value: TokenId;
}

export type SafeValue = LiteralSafeValue | TokenReferenceValue;

export interface TypeTextAction {
  readonly type: "TYPE_TEXT";
  readonly element_id: ElementId;
  readonly value: SafeValue;
}

export interface SelectOptionAction {
  readonly type: "SELECT_OPTION";
  readonly element_id: ElementId;
  readonly option_element_id: ElementId;
}

export interface NavigateOpaqueAction {
  readonly type: "NAVIGATE_OPAQUE";
  readonly element_id: ElementId;
}

export interface CompleteAction {
  readonly type: "COMPLETE";
  readonly outcome_code: string;
}

export interface AbortAction {
  readonly type: "ABORT";
  readonly safe_reason_code: string;
}

/** Closed, one-action discriminated union. */
export type Action =
  | ClickAction
  | FocusAction
  | ScrollAction
  | TypeTextAction
  | SelectOptionAction
  | NavigateOpaqueAction
  | CompleteAction
  | AbortAction;

export interface ActionPlan {
  readonly schema_version: SchemaVersion;
  readonly request_id: RequestId;
  readonly task_id: TaskId;
  readonly action_id: ActionId;
  readonly snapshot_id: SnapshotId;
  readonly navigation_id: NavigationId;
  readonly mutation_epoch: number;
  readonly action: Action;
  readonly confidence: Confidence;
}

export type ExecutionResult =
  | "SUCCEEDED"
  | "REJECTED"
  | "STALE"
  | "CANCELLED"
  | "FAILED";

export type ConfirmationStatus =
  | "NOT_REQUIRED"
  | "CONFIRMED"
  | "DECLINED"
  | "EXPIRED";

export type PolicyDecision =
  | "ALLOWED"
  | "DENIED"
  | "CONFIRMATION_REQUIRED";

export interface ExecutionReceipt {
  readonly schema_version: SchemaVersion;
  readonly task_id: TaskId;
  readonly action_id: ActionId;
  readonly snapshot_id_before: SnapshotId;
  readonly snapshot_id_after?: SnapshotId;
  readonly action_type: AllowedActionType;
  readonly result: ExecutionResult;
  readonly confirmation_status: ConfirmationStatus;
  readonly policy_decision: PolicyDecision;
  readonly safe_error_code?: string;
  readonly latency_ms: number;
  readonly recorded_at: Timestamp;
}

export type ElapsedBucket =
  | "LT_100MS"
  | "100_TO_500MS"
  | "500MS_TO_2S"
  | "2_TO_10S"
  | "GT_10S";

export interface ErrorEnvelope {
  readonly schema_version: SchemaVersion;
  readonly correlation_id: CorrelationId;
  readonly component: string;
  readonly code: string;
  readonly retryable: boolean;
  readonly attempt?: number;
  readonly elapsed_bucket?: ElapsedBucket;
  readonly occurred_at: Timestamp;
}

/** The top-level alternatives accepted by the bundled JSON Schema. */
export type DrishtiGuardContract =
  | FrameSnapshotLocal
  | DomElementGraph
  | VisualElement
  | SensitiveFinding
  | RedactionRegion
  | SanitizedScene
  | PrivacyManifest
  | VerifiedEnvelope
  | RemoteInferenceRequest
  | ActionPlan
  | ExecutionReceipt
  | ErrorEnvelope;
