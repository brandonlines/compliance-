import { Severity } from "@/lib/types";

const dateFormatter = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "short",
  day: "numeric"
});

function parseDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T12:00:00`) : new Date(value);
}

export function formatDate(value: string | null | undefined) {
  if (!value) {
    return "Not set";
  }

  return dateFormatter.format(parseDate(value));
}

export function daysUntil(value: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = parseDate(value);
  target.setHours(0, 0, 0, 0);

  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

export function pluralize(value: number, singular: string, plural = `${singular}s`) {
  return `${value} ${value === 1 ? singular : plural}`;
}

export function severityRank(value: Severity) {
  if (value === "high") {
    return 3;
  }

  if (value === "medium") {
    return 2;
  }

  return 1;
}
