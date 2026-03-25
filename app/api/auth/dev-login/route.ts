import { NextResponse } from "next/server";

import { signInAsDevUser } from "@/lib/auth";
import { isDevAuthEnabled, sanitizeRedirectPath } from "@/lib/security";

export async function POST(request: Request) {
  if (!isDevAuthEnabled()) {
    return NextResponse.json(
      {
        error: "Dev auth is disabled."
      },
      {
        status: 404
      }
    );
  }

  const formData = await request.formData();
  const userId = String(formData.get("userId") ?? "").trim();
  const redirectTo = sanitizeRedirectPath(String(formData.get("redirectTo") ?? "/"));
  const user = await signInAsDevUser(userId);

  if (!user) {
    return NextResponse.json(
      {
        error: "Unknown user"
      },
      {
        status: 400
      }
    );
  }

  return NextResponse.redirect(new URL(redirectTo, request.url), {
    status: 303
  });
}
