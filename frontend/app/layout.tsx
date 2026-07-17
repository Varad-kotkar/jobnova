import "./globals.css";
import type { Metadata } from "next";
import SiteHeader from "@/components/site-header";

export const metadata: Metadata = {
  title: "JobNova",
  description: "JobNova job discovery platform"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-950">
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
