import type { Metadata } from "next";
import { ReactNode } from "react";

import { AppProvider } from "@/components/app-provider";
import { Shell } from "@/components/shell";
import { getCurrentUser } from "@/lib/auth";
import { getWorkspaceStore } from "@/lib/workspace";

import "./globals.css";

export const metadata: Metadata = {
  title: "Trust Console",
  description: "A compliance workspace with shared operational state and seeded dev auth."
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return (
      <html lang="en">
        <body>{children}</body>
      </html>
    );
  }

  const store = await getWorkspaceStore(currentUser.workspaceId);

  return (
    <html lang="en">
      <body>
        <AppProvider currentUser={currentUser} initialStore={store}>
          <Shell currentUser={currentUser}>{children}</Shell>
        </AppProvider>
      </body>
    </html>
  );
}
