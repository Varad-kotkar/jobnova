import "./globals.css";
import type { Metadata } from "next";
import { AuthProvider } from "@/context/auth-context";
import SiteHeader from "@/components/site-header";
import SiteFooter from "@/components/site-footer";

export const metadata: Metadata = {
  title: "JobNova — AI-Powered Candidate & Job Discovery Platform",
  description:
    "Discover verified engineering, product, and tech roles scraped directly from Greenhouse, Lever, and Ashby. Track applications, save jobs, and land your next dream role.",
  keywords: ["tech jobs", "engineering roles", "remote software engineer jobs", "jobnova", "greenhouse scraper", "lever scraper"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full scroll-smooth">
      <body className="flex min-h-screen flex-col bg-slate-50 text-slate-950 font-sans antialiased">
        <AuthProvider>
          <SiteHeader />
          <div className="flex-1">{children}</div>
          <SiteFooter />
        </AuthProvider>
      </body>
    </html>
  );
}
