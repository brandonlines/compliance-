import { cookies } from "next/headers";

import { getUserById } from "@/lib/workspace";

export const DEV_AUTH_COOKIE = "trust_console_dev_user";

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const userId = cookieStore.get(DEV_AUTH_COOKIE)?.value;

  if (!userId) {
    return null;
  }

  return getUserById(userId);
}

export async function signInAsDevUser(userId: string) {
  const user = await getUserById(userId);

  if (!user) {
    return null;
  }

  const cookieStore = await cookies();
  cookieStore.set(DEV_AUTH_COOKIE, user.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/"
  });

  return user;
}

export async function signOut() {
  const cookieStore = await cookies();
  cookieStore.delete(DEV_AUTH_COOKIE);
}
