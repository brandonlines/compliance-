import type { Metadata } from "next";
import { ReactNode } from "react";

import { AppProvider } from "@/components/app-provider";
import { Shell } from "@/components/shell";

import "./globals.css";

export const metadata: Metadata = {
  title: "Trust Console",
  description: "A static compliance workspace demo with local browser persistence."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppProvider>
          <Shell>{children}</Shell>
        </AppProvider>
      </body>
    </html>
  );
}
