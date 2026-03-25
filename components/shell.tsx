import Link from "next/link";
import { ReactNode } from "react";

import { AppUser } from "@/lib/types";

const nav = [
  { href: "/", label: "Dashboard" },
  { href: "/controls", label: "Controls" },
  { href: "/evidence", label: "Evidence" },
  { href: "/policies", label: "Policies" },
  { href: "/tasks", label: "Tasks" },
  { href: "/integrations", label: "Integrations" },
  { href: "/automation", label: "Automation" },
  { href: "/checks", label: "Checks" },
  { href: "/auditor", label: "Auditor Packet" }
];

export function Shell({ children, currentUser }: { children: ReactNode; currentUser: AppUser }) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <p className="kicker">Trust Console</p>
          <h1>Operational compliance workspace</h1>
          <p className="muted">A server-backed workspace for controls, evidence, automation signals, and audit readiness.</p>
        </div>
        <div className="item-card">
          <p className="eyebrow">Dev auth</p>
          <h3>{currentUser.name}</h3>
          <p className="muted">
            {currentUser.role} · {currentUser.email}
          </p>
          <div className="inline-actions section-gap">
            <Link href="/login?switch=1" className="button-ghost">
              Switch user
            </Link>
            <form action="/api/auth/logout" method="post">
              <button type="submit" className="button-ghost">
                Sign out
              </button>
            </form>
          </div>
        </div>
        <nav className="nav-list" aria-label="Main navigation">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className="nav-link">
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="content-panel">{children}</main>
    </div>
  );
}
