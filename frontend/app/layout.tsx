import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Flappy Flight",
  description: "Static Next.js mini-game inspired by Flappy Bird, optimised for offline play.",
  applicationName: "Flappy Flight",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/icon-192.png" }],
  },
};

type RootLayoutProps = {
  children: React.ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body className="min-h-dvh bg-slate-950 text-slate-50 antialiased">
        <main className="flex min-h-dvh w-full flex-col items-center justify-center px-4 py-6">
          {children}
        </main>
      </body>
    </html>
  );
}
