import type { Metadata } from "next";
import Link from "next/link";
import type { Route } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — JobNova",
  description: "JobNova's terms of service governing use of the platform.",
};

export default function TermsPage() {
  const updated = new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" });
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 space-y-10">
      <div className="border-b border-gray-100 pb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Terms of Service</h1>
        <p className="mt-3 text-sm text-gray-500">Last updated: {updated}</p>
      </div>

      {[
        {
          title: "1. Acceptance",
          body: "By accessing or using JobNova, you agree to these Terms of Service. If you do not agree, do not use the platform.",
        },
        {
          title: "2. Platform Purpose",
          body: "JobNova is a job discovery and aggregation platform. We index publicly available job listings to help job seekers discover opportunities. We are not an employer, staffing agency, or recruiter.",
        },
        {
          title: "3. User Accounts",
          body: "You are responsible for maintaining the security of your account credentials. You must not share your account or use the platform for unauthorized commercial purposes.",
        },
        {
          title: "4. Acceptable Use",
          body: "You may not use JobNova to: scrape or crawl the platform in an automated fashion; post spam, fake applications, or fraudulent content; attempt to gain unauthorized access to our systems; use the platform for any illegal purpose.",
        },
        {
          title: "5. Intellectual Property",
          body: "JobNova's brand, design, code, and original content are owned by JobNova. Job listings and company content remain the property of their respective owners. See our Copyright & Attribution page for details.",
        },
        {
          title: "6. Disclaimer of Warranties",
          body: 'JobNova is provided "as is" without warranties of any kind. We do not guarantee the accuracy, completeness, or availability of job listings. We are not responsible for hiring decisions made by employers.',
        },
        {
          title: "7. Limitation of Liability",
          body: "To the maximum extent permitted by law, JobNova shall not be liable for any indirect, incidental, or consequential damages arising from your use of the platform.",
        },
        {
          title: "8. Modifications",
          body: "We may update these terms at any time. Continued use of JobNova after changes constitutes acceptance of the updated terms.",
        },
        {
          title: "9. Governing Law",
          body: "These terms are governed by the laws of India. Disputes shall be subject to the exclusive jurisdiction of the courts of Pune, Maharashtra.",
        },
        {
          title: "10. Contact",
          body: "For legal inquiries: legal@jobnova.app",
        },
      ].map((section) => (
        <section key={section.title} className="space-y-2">
          <h2 className="text-lg font-bold text-gray-900">{section.title}</h2>
          <p className="text-sm text-gray-600 leading-relaxed">{section.body}</p>
        </section>
      ))}

      <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-100">
        {[{ href: "/privacy", label: "Privacy Policy" }, { href: "/copyright", label: "Copyright" }, { href: "/contact", label: "Contact" }].map((l) => (
          <Link key={l.href} href={l.href as Route} className="text-xs font-semibold text-blue-600 hover:underline">{l.label}</Link>
        ))}
      </div>
    </main>
  );
}
