import { notFound } from "next/navigation";
import Link from "next/link";
import JobDetail from "@/components/job-detail";

interface JobPageProps {
  params: Promise<{ slug: string }>;
}

async function fetchJob(slug: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000"}/api/jobs/${slug}`);
  if (!res.ok) {
    return null;
  }
  return res.json();
}

export default async function JobPage(props: JobPageProps) {
  const { slug } = await props.params;
  const job = await fetchJob(slug);
  if (!job) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1 text-sm text-slate-500 transition hover:text-slate-900"
      >
        ← Back to jobs
      </Link>
      <JobDetail job={job} />
    </main>
  );
}
