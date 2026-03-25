import { notFound, redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import { isDevAuthEnabled, sanitizeRedirectPath } from "@/lib/security";
import { listDevUsers } from "@/lib/workspace";

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ next?: string; switch?: string }>;
}) {
  if (!isDevAuthEnabled()) {
    notFound();
  }

  const resolvedSearchParams = await searchParams;
  const currentUser = await getCurrentUser();
  const isSwitching = resolvedSearchParams.switch === "1";

  if (currentUser && !isSwitching) {
    redirect("/");
  }

  const users = await listDevUsers();
  const redirectTo = sanitizeRedirectPath(resolvedSearchParams.next);

  return (
    <main className="content-panel" style={{ margin: "0 auto", maxWidth: "960px", minHeight: "100vh" }}>
      <section className="stack" style={{ padding: "48px 0" }}>
        <header className="hero-card">
          <p className="eyebrow">Seeded dev auth</p>
          <h1>Choose a user and enter the workspace</h1>
          <p className="muted">
            This local mode is intentionally simple so we can test auth, permissions, and browser flows before wiring a
            real identity provider.
          </p>
          {currentUser ? (
            <p className="caption section-gap">Currently signed in as {currentUser.name}. Choosing another user will switch the session.</p>
          ) : null}
        </header>

        <section className="grid-3">
          {users.map((user) => (
            <article key={user.id} className="panel">
              <p className="eyebrow">{user.role}</p>
              <h3>{user.name}</h3>
              <p className="muted">{user.email}</p>
              <form action="/api/auth/dev-login" method="post" className="section-gap">
                <input type="hidden" name="userId" value={user.id} />
                <input type="hidden" name="redirectTo" value={redirectTo} />
                <button type="submit" className="button">
                  Continue as {user.name}
                </button>
              </form>
            </article>
          ))}
        </section>
      </section>
    </main>
  );
}
