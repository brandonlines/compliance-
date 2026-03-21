import type { Metadata } from "next";
import { ReactNode } from "react";

import { Shell } from "@/components/shell";

import "./globals.css";

export const metadata: Metadata = {
  title: "Mathville Trust Ops",
  description: "A lightweight homemade compliance workspace inspired by Vanta."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
