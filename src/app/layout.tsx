import type { Metadata } from "next";
import "./globals.css";

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
          <a href="/" className="logo">FixMyBuild AI</a>
        </header>
        <main className="main">{children}</main>
      </body>
    </html>
  );
}
