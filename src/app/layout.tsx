import type { Metadata } from "next";
import "./globals.css";
import AuthGuard from "@/components/AuthGuard";

export const metadata: Metadata = {
  title: "TechRadar — Conferences, Hackathons & Internships",
  description: "Track Core A*/A conferences with deadlines, Hack2skill hackathons, workshops, and internships on a Google Calendar-style interface.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full antialiased">
      <body className="min-h-full flex flex-col bg-gray-950 text-gray-100">
        <AuthGuard>{children}</AuthGuard>
      </body>
    </html>
  );
}
