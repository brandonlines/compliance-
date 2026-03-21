import { ControlStatus, Severity, TaskStatus } from "@/lib/types";

type BadgeTone = ControlStatus | TaskStatus | Severity | "pass" | "fail";

const classes: Record<BadgeTone, string> = {
  ready: "badge badge-ready",
  monitoring: "badge badge-monitoring",
  attention: "badge badge-attention",
  open: "badge badge-attention",
  in_progress: "badge badge-monitoring",
  done: "badge badge-ready",
  low: "badge badge-neutral",
  medium: "badge badge-monitoring",
  high: "badge badge-attention",
  pass: "badge badge-ready",
  fail: "badge badge-attention"
};

export function StatusBadge({ tone, label }: { tone: BadgeTone; label?: string }) {
  return <span className={classes[tone]}>{label ?? tone.replaceAll("_", " ")}</span>;
}
