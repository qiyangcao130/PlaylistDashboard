import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Playlist Dashboard",
  description: "Edge-first audio playlist manager built with Next.js and Supabase."
};

export const viewport: Viewport = {
  themeColor: "#09090b"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-background text-foreground antialiased`}> 
        {children}
        <Toaster richColors theme="dark" position="top-center" />
      </body>
    </html>
  );
}
