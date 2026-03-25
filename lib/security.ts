import { AppUser } from "@/lib/types";

export const MAX_EVIDENCE_UPLOAD_BYTES = 5 * 1024 * 1024;

export function isDevAuthEnabled() {
  return process.env.ENABLE_DEV_AUTH === "true" || process.env.NODE_ENV !== "production";
}

export function sanitizeRedirectPath(input: string | null | undefined) {
  const value = input?.trim();

  if (!value) {
    return "/";
  }

  if (!value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }

  return value;
}

export function canManageWorkspace(user: Pick<AppUser, "role">) {
  return user.role === "admin";
}
