import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://drishtiguard-sih2026-live.aus2004.chatgpt.site"),
  title: "DrishtiGuard — Interactive Privacy Boundary",
  description: "A runnable, on-device demonstration of privacy-preserving browser automation for SIH26171.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
  openGraph: {
    title: "DrishtiGuard — The guardrail you can see",
    description: "Watch an exact outbound payload get sanitized, verified and action-gated in your browser.",
    type: "website",
    images: [{ url: "/og.png", width: 1731, height: 909, alt: "DrishtiGuard privacy boundary" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "DrishtiGuard — The guardrail you can see",
    description: "A runnable privacy boundary for browser automation.",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>{children}</body>
    </html>
  );
}
