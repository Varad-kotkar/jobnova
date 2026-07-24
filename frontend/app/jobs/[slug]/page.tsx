import { notFound } from "next/navigation";
import JobDetail from "@/components/job-detail";

interface JobPageProps {
  params: Promise<{ slug: string }>;
}

async function fetchJob(slug: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000"}/api/jobs/${slug}`);
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
      <JobDetail job={job} />
    </main>
  );
}
