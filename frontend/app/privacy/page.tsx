import type { Metadata } from "next";
import Link from "next/link";
import type { Route } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — JobNova",
  description: "JobNova's privacy policy explaining how we collect, use, and protect your personal data.",
};

export default function PrivacyPage() {
  const updated = new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" });
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 space-y-10">
      <div className="border-b border-gray-100 pb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Privacy Policy</h1>
        <p className="mt-3 text-sm text-gray-500">Last updated: {updated}</p>
      </div>

      {[
        {
          title: "1. Information We Collect",
          body: [
            "Account information: email address, full name, and password (hashed, never stored in plain text) when you register.",
            "Profile data: skills, experience, location, and resume content you choose to upload.",
            "Usage data: pages visited, search queries, and job saves — used only to improve the platform.",
            "Technical data: IP address, browser type, and device identifiers for security and analytics.",
          ],
        },
        {
          title: "2. How We Use Your Data",
          body: [
            "To provide and improve the JobNova platform.",
            "To send you job alerts and platform notifications you have opted into.",
            "To generate AI-powered job match scores and resume suggestions.",
            "We do not sell your personal data to third parties.",
          ],
        },
        {
          title: "3. Data Sharing",
          body: [
            "We do not share your personal data with employers unless you explicitly apply through their external careers page.",
            "We may share aggregated, anonymized analytics with partners.",
            "We may disclose data if legally required by a court order or government authority.",
          ],
        },
        {
          title: "4. Cookies",
          body: [
            "We use essential cookies for authentication and session management.",
            "Analytics cookies (e.g. Google Analytics) help us understand platform usage.",
            "You can disable non-essential cookies in your browser settings.",
          ],
        },
        {
          title: "5. Data Retention",
          body: [
            "Account data is retained until you delete your account.",
            "Job listings are automatically deactivated after 30 days.",
            "Usage logs are retained for up to 90 days.",
          ],
        },
        {
          title: "6. Your Rights",
          body: [
            "Access: Request a copy of the personal data we hold about you.",
            "Correction: Update inaccurate or incomplete data.",
            "Deletion: Request deletion of your account and associated data.",
            "Portability: Export your data in machine-readable format.",
            "Contact us at privacy@jobnova.app to exercise any of these rights.",
          ],
        },
        {
          title: "7. Security",
          body: [
            "Passwords are hashed using bcrypt. All data is transmitted over HTTPS.",
            "We implement rate limiting, input validation, and RBAC to protect your account.",
            "Despite our best efforts, no system is 100% secure. Please use a strong, unique password.",
          ],
        },
      ].map((section) => (
        <section key={section.title} className="space-y-3">
          <h2 className="text-lg font-bold text-gray-900">{section.title}</h2>
          <ul className="space-y-2">
            {section.body.map((item, i) => (
              <li key={i} className="flex gap-2 text-sm text-gray-600 leading-relaxed">
                <span className="text-blue-500 font-bold shrink-0 mt-0.5">•</span>
                {item}
              </li>
            ))}
          </ul>
        </section>
      ))}

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-gray-900">8. Contact</h2>
        <p className="text-sm text-gray-600">
          For privacy-related inquiries:{" "}
          <a href="mailto:privacy@jobnova.app" className="text-blue-600 hover:underline font-semibold">
            privacy@jobnova.app
          </a>
        </p>
      </section>

      <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-100">
        {[{ href: "/terms", label: "Terms of Service" }, { href: "/copyright", label: "Copyright" }, { href: "/contact", label: "Contact" }].map((l) => (
          <Link key={l.href} href={l.href as Route} className="text-xs font-semibold text-blue-600 hover:underline">{l.label}</Link>
        ))}
      </div>
    </main>
  );
}
