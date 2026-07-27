import type { Metadata } from "next";
import { UserProvider } from "@/context/UserContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "Duolingo - Learn Spanish",
  description: "Learn Spanish in a playful, gamified way with bite-sized lessons, interactive exercises, streak tracking, and leaderboards!",
  icons: {
    icon: "/favicon.ico",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <UserProvider>
          {children}
        </UserProvider>
      </body>
    </html>
  );
}
