import { AppUserRole } from "@/lib/types";

export const DEV_USERS: Array<{
  id: string;
  email: string;
  name: string;
  role: AppUserRole;
}> = [
  {
    id: "user_admin",
    email: "admin@sampleco.local",
    name: "Alex Admin",
    role: "admin"
  },
  {
    id: "user_auditor",
    email: "auditor@sampleco.local",
    name: "Ari Auditor",
    role: "auditor"
  },
  {
    id: "user_viewer",
    email: "viewer@sampleco.local",
    name: "Vera Viewer",
    role: "viewer"
  }
];
