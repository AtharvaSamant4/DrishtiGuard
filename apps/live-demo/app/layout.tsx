import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

const deploymentOrigin =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.RENDER_EXTERNAL_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(deploymentOrigin),
  title: "DrishtiGuard — Privacy Guardrail & Extension Demo",
  description: "See how DrishtiGuard protects browser-agent context on device, run the interactive safety walkthrough, and download the working Chromium extension MVP.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
  openGraph: {
    title: "DrishtiGuard — Let the agent work. Keep private data local.",
    description: "Run the privacy-boundary walkthrough and download the working Chromium extension MVP.",
    type: "website",
    images: [{ url: "/og-extension.png", width: 1731, height: 909, alt: "DrishtiGuard keeps private browser data local before an AI receives safe context" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "DrishtiGuard — Let the agent work. Keep private data local.",
    description: "Interactive privacy walkthrough plus a downloadable Chromium extension MVP.",
    images: ["/og-extension.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>{children}</body>
    </html>
  );
}
