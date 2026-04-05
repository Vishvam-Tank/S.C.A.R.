// ── Backend API response types ──────────────────────────────────────────────

export interface HealthResponse {
  status: string;
  llm: boolean;
  github: boolean;
  model: string;
  default_target: string;
}

// ── SSE event payload types (derived from backend pipelines) ────────────────

/** Base shape shared by every SSE event */
interface BaseEvent {
  type: string;
  message: string;
}

/** Red Team: status update */
export interface StatusEvent extends BaseEvent {
  type: "status";
}

/** Red Team: tool starting */
export interface ToolStartEvent extends BaseEvent {
  type: "tool_start";
  tool: string;
}

/** Red Team: tool finished with findings */
export interface ToolCompleteEvent extends BaseEvent {
  type: "tool_complete";
  tool: string;
  findings: Record<string, unknown>[];
}

/** Red Team: tool used fallback cache */
export interface ToolFallbackEvent extends BaseEvent {
  type: "tool_fallback";
  tool: string;
  findings: Record<string, unknown>[];
}

/** Red Team: all tools done */
export interface RedTeamCompleteEvent extends BaseEvent {
  type: "red_team_complete";
  all_findings: Record<string, unknown>[];
}

/** Blue Team: LLM analysis failed */
export interface AnalysisFailedEvent extends BaseEvent {
  type: "analysis_failed";
  patches: Record<string, unknown>[];
}

/** Blue Team: LLM analysis succeeded */
export interface AnalysisCompleteEvent extends BaseEvent {
  type: "analysis_complete";
  patches: Record<string, unknown>[];
}

/** Blue Team: GitHub PR created */
export interface PrCreatedEvent extends BaseEvent {
  type: "pr_created";
  pr_url: string;
  pr_number: number;
  branch: string;
}

/** Blue Team: GitHub PR failed */
export interface PrFailedEvent extends BaseEvent {
  type: "pr_failed";
  pr_url: null;
}

/** Pipeline complete */
export interface CompleteEvent extends BaseEvent {
  type: "complete";
}

/** Pipeline error */
export interface ErrorEvent extends BaseEvent {
  type: "error";
}

/** Union of all SSE event types */
export type SseEvent =
  | StatusEvent
  | ToolStartEvent
  | ToolCompleteEvent
  | ToolFallbackEvent
  | RedTeamCompleteEvent
  | AnalysisFailedEvent
  | AnalysisCompleteEvent
  | PrCreatedEvent
  | PrFailedEvent
  | CompleteEvent
  | ErrorEvent;

/** Scan phase lifecycle */
export type ScanPhase = "idle" | "red" | "blue" | "done" | "error";
