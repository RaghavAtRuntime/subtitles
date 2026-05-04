import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SubtitleAI — AI-Powered Transcription",
  description: "Upload a video or audio file and get accurate, synchronized subtitles powered by faster-whisper — fully local, no API key required.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
