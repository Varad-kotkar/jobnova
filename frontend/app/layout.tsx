import "./globals.css";
import type { Metadata } from "next";
import { AuthProvider } from "@/context/auth-context";
import SiteHeader from "@/components/site-header";
import SiteFooter from "@/components/site-footer";

export const metadata: Metadata = {
  metadataBase: new URL("https://jobnova.vercel.app"),
  title: {
    default: "JobNova — Candidate Intelligence & Recruiter Platform",
    template: "%s | JobNova",
  },
  description:
    "Intelligent tech hiring platform with AI resume parsing, ATS fit scoring, cover letter generation, technical interview prep, 30-60-90 day career coaching, and recruiter pipelines.",
  keywords: [
    "tech jobs",
    "software engineer jobs",
    "ai resume parser",
    "ats analyzer",
    "recruiter portal",
    "jobnova",
    "greenhouse jobs",
    "lever jobs",
    "ashby jobs",
  ],
  authors: [{ name: "JobNova Team" }],
  creator: "JobNova Platform",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://jobnova.vercel.app",
    title: "JobNova — Candidate Intelligence & Recruiter Platform",
    description:
      "Intelligent tech hiring platform with AI resume parsing, ATS fit scoring, cover letter generation, technical interview prep, and career coaching.",
    siteName: "JobNova",
  },
  twitter: {
    card: "summary_large_image",
    title: "JobNova — Candidate Intelligence & Recruiter Platform",
    description:
      "Intelligent tech hiring platform with AI resume parsing, ATS fit scoring, cover letter generation, and career coaching.",
    creator: "@jobnova",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full scroll-smooth">
      <body className="flex min-h-screen flex-col bg-white text-gray-900 font-sans antialiased">
        <AuthProvider>
          <SiteHeader />
          <div className="flex-1">{children}</div>
          <SiteFooter />
        </AuthProvider>
      </body>
    </html>
  );
}
