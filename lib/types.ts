export type Severity = "low" | "medium" | "high";
export type ControlStatus = "ready" | "monitoring" | "attention";
export type TaskStatus = "open" | "in_progress" | "done";
export type CheckStatus = "pass" | "fail";
export type AutomationEventType = "evidence.create" | "check.report" | "task.create";
export type AutomationEventStatus = "accepted" | "rejected";
export type AppUserRole = "admin" | "auditor" | "viewer";

export interface AppUser {
  id: string;
  email: string;
  name: string;
  role: AppUserRole;
  workspaceId: string;
}

export interface Organization {
  id: string;
  name: string;
  owner: string;
  industry: string;
  framework: string;
  auditWindow: string;
  workspaceMode: string;
}

export interface Control {
  id: string;
  code: string;
  title: string;
  description: string;
  family: string;
  owner: string;
  cadence: string;
  evidenceIds: string[];
  policyIds: string[];
  testIds: string[];
}

export interface Policy {
  id: string;
  title: string;
  owner: string;
  version: string;
  summary: string;
  lastReviewed: string;
  nextReviewDue: string;
}

export interface Evidence {
  id: string;
  title: string;
  description: string;
  owner: string;
  kind: "upload" | "snapshot";
  source: "manual" | "integration" | "generated" | "automation";
  controlId: string;
  policyId?: string;
  uploadedAt: string;
  fileName?: string;
  originalName?: string;
  mimeType?: string;
  fileDataUrl?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  owner: string;
  dueDate: string;
  status: TaskStatus;
  priority: Severity;
  sourceType: "check" | "manual" | "automation";
  sourceId?: string;
  createdAt: string;
  completedAt?: string;
}

export interface Integration {
  id: string;
  name: string;
  category: string;
  description: string;
  connected: boolean;
  owner: string;
  lastSync: string | null;
  settings: Record<string, boolean | string>;
}

export interface CheckDefinition {
  id: string;
  title: string;
  description: string;
  severity: Severity;
  controlIds: string[];
  integrationId?: string;
}

export interface CheckRun {
  id: string;
  checkId: string;
  title: string;
  description: string;
  status: CheckStatus;
  summary: string;
  severity: Severity;
  controlIds: string[];
  ranAt: string;
  source: "internal" | "automation";
  sourceName?: string;
}

export interface AutomationEvent {
  id: string;
  type: AutomationEventType;
  status: AutomationEventStatus;
  source: string;
  summary: string;
  receivedAt: string;
}

export interface AutomationConfig {
  enabled: boolean;
  secret: string;
  lastEventAt: string | null;
  events: AutomationEvent[];
}

export interface Store {
  organization: Organization;
  controls: Control[];
  policies: Policy[];
  evidence: Evidence[];
  tasks: Task[];
  integrations: Integration[];
  checkRuns: CheckRun[];
  automation: AutomationConfig;
}
