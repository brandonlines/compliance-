import Link from "next/link";
import { ReactNode } from "react";

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

export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <p className="kicker">Mathville Trust Ops</p>
          <h1>Homemade compliance command center</h1>
          <p className="muted">
            A lean internal system for SOC 2 tracking, evidence collection, and audit readiness.
          </p>
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
