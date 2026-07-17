"use client";

import { useMemo, useState } from "react";

const companies = ["All companies", "JobNova", "Acme", "Startup"];
const locations = ["All locations", "Remote", "New York", "San Francisco"];

export default function SearchControls() {
  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState("All locations");
  const [remote, setRemote] = useState(false);

  const showClear = useMemo(
    () => keyword.length > 0 || location !== "All locations" || remote,
    [keyword, location, remote],
  );

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="flex min-w-[320px] flex-1 items-center gap-2 rounded-3xl border border-slate-200 bg-white px-4 py-3 shadow-card">
        <input
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          placeholder="Search jobs, titles, or skills"
          className="w-full border-none bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
        />
      </div>
      <div className="flex items-center gap-2">
        <select
          value={location}
          onChange={(event) => setLocation(event.target.value)}
          className="rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-card focus:outline-none"
        >
          {locations.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setRemote((current) => !current)}
          className={`rounded-3xl px-5 py-3 text-sm font-medium transition ${
            remote ? "bg-slate-950 text-white" : "bg-white text-slate-700 border border-slate-200"
          }`}
        >
          Remote
        </button>
      </div>
      {showClear ? (
        <button
          type="button"
          onClick={() => {
            setKeyword("");
            setLocation("All locations");
            setRemote(false);
          }}
          className="rounded-3xl bg-slate-950 px-5 py-3 text-sm font-medium text-white shadow-card"
        >
          Clear
        </button>
      ) : null}
    </div>
  );
}
