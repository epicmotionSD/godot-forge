import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://godotforge.dev"),
  title: "GodotForge — Ship Your Godot Game. Not YAML.",
  description:
    "The managed CI/CD platform built exclusively for Godot Engine. Connect your repo, pick platforms, deploy to Steam and itch.io.",
  openGraph: {
    title: "GodotForge — Managed CI/CD for Godot Engine",
    description:
      "Automated Godot builds with one-click deploy to Steam and itch.io. Free to start.",
    type: "website",
    url: "https://godotforge.dev",
    siteName: "GodotForge",
  },
  twitter: {
    card: "summary_large_image",
    site: "@godotforge",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${jetbrainsMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
