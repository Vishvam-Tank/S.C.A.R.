import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "S.C.A.R. — Security Continuous Assessment & Remediation",
  description: "Agent-driven application security scanning platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-zinc-950 text-zinc-100 min-h-screen antialiased font-mono">
        {children}
      </body>
    </html>
  );
}
