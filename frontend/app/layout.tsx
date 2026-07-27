import "./globals.css";
import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { AuthProvider } from "@/context/auth-context";
import SiteHeader from "@/components/site-header";
import SiteFooter from "@/components/site-footer";
import AICopilot from "@/components/ai-copilot";

export const viewport: Viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://jobnova.vercel.app"),
  title: {
    default: "JobNova — AI-Powered Job Platform",
    template: "%s | JobNova",
  },
  description:
    "AI-powered job platform with resume parsing, ATS scoring, career roadmaps, cover letter generation, and intelligent job matching for tech professionals.",
  keywords: [
    "tech jobs",
    "software engineer jobs",
    "ai resume parser",
    "ats analyzer",
    "career roadmap",
    "job matching",
    "cover letter generator",
    "recruiter portal",
    "jobnova",
    "remote jobs",
    "india jobs",
    "data analyst jobs",
  ],
  authors: [{ name: "JobNova Team" }],
  creator: "JobNova Platform",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/logo/icon only/icon only.png", sizes: "any" },
    ],
    apple: [
      { url: "/logo/app icon/app icon.png", sizes: "180x180" },
    ],
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://jobnova.vercel.app",
    title: "JobNova — AI-Powered Job Platform",
    description:
      "AI-powered job platform with resume parsing, ATS scoring, career roadmaps, and intelligent job matching for tech professionals.",
    siteName: "JobNova",
  },
  twitter: {
    card: "summary_large_image",
    title: "JobNova — AI-Powered Job Platform",
    description:
      "AI-powered job platform with resume parsing, ATS scoring, career roadmaps, and intelligent job matching.",
    creator: "@jobnova",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full scroll-smooth">
      <head>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-2BEQQKSB0Q"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-2BEQQKSB0Q');
          `}
        </Script>
      </head>
      <body className="flex min-h-screen flex-col bg-white text-gray-900 font-sans antialiased">
        <AuthProvider>
          <SiteHeader />
          <div className="flex-1">{children}</div>
          <SiteFooter />
          <AICopilot />
        </AuthProvider>
      </body>
    </html>
  );
}

