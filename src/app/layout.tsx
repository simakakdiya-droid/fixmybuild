import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "FixMyBuild AI",
  description: "Failed GitHub Actions runs with AI analysis",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <header className="header">
          <Link  href="/" className="logo">FixMyBuild AI</Link >
        </header>
        <main className="main">{children}</main>
      </body>
    </html>
  );
}
