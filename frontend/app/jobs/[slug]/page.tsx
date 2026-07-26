import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import JobDetail from "@/components/job-detail";
import { getApiUrl } from "@/lib/api";

interface JobPageProps {
  params: Promise<{ slug: string }>;
}

async function fetchJob(slug: string) {
  try {
    const res = await fetch(`${getApiUrl()}/api/jobs/${slug}`, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata(props: JobPageProps): Promise<Metadata> {
  const { slug } = await props.params;
  const job = await fetchJob(slug);
  if (!job) {
    return { title: "Job Not Found | JobNova" };
  }
  const companyName = typeof job.company === "string" ? job.company : job.company?.name || "Company";
  const title = `${job.title} at ${companyName}`;
  const description = (job.description || "").replace(/<[^>]*>?/gm, "").slice(0, 160);

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      siteName: "JobNova",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function JobPage(props: JobPageProps) {
  const { slug } = await props.params;
  const job = await fetchJob(slug);
  if (!job) {
    notFound();
  }

  const companyName = typeof job.company === "string" ? job.company : job.company?.name || "Company";
  
  // JSON-LD JobPosting schema for Google Search indexing
  const jsonLd = {
    "@context": "https://schema.org/",
    "@type": "JobPosting",
    title: job.title,
    description: job.description || "",
    identifier: {
      "@type": "PropertyValue",
      name: companyName,
      value: job.id,
    },
    datePosted: job.published_at,
    hiringOrganization: {
      "@type": "Organization",
      name: companyName,
    },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: job.location || "Remote",
      },
    },
    applicantLocationRequirements: job.remote
      ? {
          "@type": "Country",
          name: "Worldwide",
        }
      : undefined,
    jobLocationType: job.remote ? "TELECOMMUTE" : undefined,
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Link
        href="/jobs"
        className="mb-6 inline-flex items-center gap-1 text-sm font-semibold text-slate-500 transition hover:text-slate-900"
      >
        ← Back to jobs
      </Link>
      <JobDetail job={job} />
    </main>
  );
}
