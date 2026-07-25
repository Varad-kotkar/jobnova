import { Suspense } from "react";
import JobFeed from "@/components/job-feed";
import SearchControls from "@/components/search-controls";

interface JobsPageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function JobsPage(props: JobsPageProps) {
  const searchParams = await props.searchParams;

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 space-y-8 bg-white">
      <div className="border-b border-gray-100 pb-6 space-y-4">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
          Browse Engineering Listings 💼
        </h1>
        <p className="max-w-2xl text-xs text-gray-500 leading-relaxed">
          Filter active roles scraped from verified corporate hiring portals (Greenhouse, Lever, Ashby).
        </p>

        <Suspense fallback={null}>
          <SearchControls />
        </Suspense>
      </div>

      <Suspense fallback={<div className="py-12 text-center text-xs font-semibold text-gray-500">Loading active listings...</div>}>
        <JobFeed searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
