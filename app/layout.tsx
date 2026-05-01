import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "DevCanvas - Collaborative Communication Tool",
  description: "A lightweight, canvas-first real-time collaboration tool for dev teams",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark bg-background">
      <body className="antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
