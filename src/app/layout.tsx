import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PitRelay | Robotics Team Hub",
  description: "Robot intelligence profiles, engineering tools, team work, and VEX V5 code workflows.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
