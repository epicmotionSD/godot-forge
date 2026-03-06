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
  title: "GodotForge — Ship Your Godot Game. Not YAML.",
  description:
    "The managed CI/CD platform built exclusively for Godot Engine. Connect your repo, pick platforms, deploy to Steam and itch.io.",
  openGraph: {
    title: "GodotForge — Managed CI/CD for Godot Engine",
    description:
      "W4 Build is gone. GodotForge is the replacement. Automated builds and one-click deploy to Steam & itch.io.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
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
