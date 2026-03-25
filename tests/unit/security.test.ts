import { canManageWorkspace, sanitizeRedirectPath } from "@/lib/security";

describe("security helpers", () => {
  test("sanitizeRedirectPath keeps internal paths and rejects external-style redirects", () => {
    expect(sanitizeRedirectPath("/tasks")).toBe("/tasks");
    expect(sanitizeRedirectPath(" /controls/control_access ")).toBe("/controls/control_access");
    expect(sanitizeRedirectPath("//evil.example")).toBe("/");
    expect(sanitizeRedirectPath("https://evil.example")).toBe("/");
    expect(sanitizeRedirectPath("")).toBe("/");
  });

  test("canManageWorkspace only allows admins to mutate state", () => {
    expect(canManageWorkspace({ role: "admin" })).toBe(true);
    expect(canManageWorkspace({ role: "auditor" })).toBe(false);
    expect(canManageWorkspace({ role: "viewer" })).toBe(false);
  });
});
