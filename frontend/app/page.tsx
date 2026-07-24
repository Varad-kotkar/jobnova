import { Suspense } from "react";
import JobFeed from "@/components/job-feed";
import SearchControls from "@/components/search-controls";

interface HomePageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function HomePage(props: HomePageProps) {
  const searchParams = await props.searchParams;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <section className="mb-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-4xl font-semibold tracking-tight text-slate-950">
              Discover jobs with JobNova
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-slate-600">
              Search jobs by keyword, company, location, and remote status.
            </p>
          </div>
        </div>
        <div className="mt-6">
          <Suspense fallback={null}>
            <SearchControls />
          </Suspense>
        </div>
      </section>
      <JobFeed searchParams={searchParams} />
    </main>
  );
}
