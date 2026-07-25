"use client";

import { useEffect, useState } from "react";
import { getApiUrl } from "@/lib/api";
import { sanitizeHtml } from "@/lib/sanitize";
import { isJobSaved, toggleSaveJob, recordJobApplication } from "@/lib/storage";

interface JobDetailProps {
  job: {
    id: string;
    slug: string;
    title: string;
    description: string;
    location: string;
    company: string;
    apply_url: string;
    skills: string[];
    remote: boolean;
    published_at: string;
  };
}

interface AIMatchData {
  match_score: number;
  recommendation: string;
  matched_skills: string[];
  missing_skills: string[];
  reasoning: string[];
}

interface ATSAnalysisData {
  ats_score: number;
  keyword_match_percentage: number;
  matched_keywords: string[];
  missing_keywords: string[];
  resume_strengths: string[];
  resume_improvements: string[];
  formatting_warnings: string[];
  sections_missing: string[];
  recommended_changes: string[];
  score_breakdown: {
    keyword_coverage: number;
    section_completeness: number;
    relevance: number;
    formatting_structure: number;
  };
}

interface CoverLetterData {
  cover_letter: string;
  personalization_score: number;
  highlighted_resume_strengths: string[];
  tone: string;
  estimated_read_time: string;
}

interface InterviewPrepData {
  company: string;
  role: string;
  difficulty: string;
  estimated_preparation_time: string;
  technical_questions: Array<{
    question: string;
    key_answer_points: string[];
  }>;
  coding_questions: Array<{
    title: string;
    difficulty: string;
    category: string;
  }>;
  system_design_questions: Array<{
    title: string;
    key_components: string[];
    tradeoffs: string;
  }>;
  behavioral_questions: Array<{
    question: string;
    star_framework: string;
  }>;
  topics_to_review: string[];
  company_interview_tips: string[];
}

export default function JobDetail({ job }: JobDetailProps) {
  const [saved, setSaved] = useState(false);
  const [applied, setApplied] = useState(false);
  const [copied, setCopied] = useState(false);
  const [matchData, setMatchData] = useState<AIMatchData | null>(null);

  // ATS Modal State
  const [atsData, setAtsData] = useState<ATSAnalysisData | null>(null);
  const [showAtsModal, setShowAtsModal] = useState(false);
  const [analyzingAts, setAnalyzingAts] = useState(false);

  // Cover Letter Modal State
  const [coverLetterData, setCoverLetterData] = useState<CoverLetterData | null>(null);
  const [showCoverLetterModal, setShowCoverLetterModal] = useState(false);
  const [generatingLetter, setGeneratingLetter] = useState(false);
  const [selectedTone, setSelectedTone] = useState("Professional");
  const [copiedLetter, setCopiedLetter] = useState(false);

  // Interview Coach Modal State
  const [interviewData, setInterviewData] = useState<InterviewPrepData | null>(null);
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [loadingInterview, setLoadingInterview] = useState(false);
  const [activePrepTab, setActivePrepTab] = useState<"tech" | "coding" | "design" | "behavioral" | "topics">("tech");

  useEffect(() => {
    setSaved(isJobSaved(job.id));

    // Fetch AI match score from API if token exists
    const token = localStorage.getItem("jobnova_token");
    if (token && token !== "demo-jwt-token") {
      const apiBase = getApiUrl();
      fetch(`${apiBase}/api/jobs/${job.id}/match-score`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && typeof data.match_score === "number") {
            setMatchData(data);
          }
        })
        .catch((err) => console.warn("AI match fetch warning:", err));
    }
  }, [job.id]);

  const handleRunAtsAnalysis = async () => {
    setShowAtsModal(true);
    if (atsData) return;

    setAnalyzingAts(true);
    const token = localStorage.getItem("jobnova_token");
    if (token && token !== "demo-jwt-token") {
      const apiBase = getApiUrl();
      try {
        const res = await fetch(`${apiBase}/api/users/resume/ats-score?job_id=${job.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setAtsData(data);
        }
      } catch (err) {
        console.warn("ATS analysis fetch error:", err);
      } finally {
        setAnalyzingAts(false);
      }
    } else {
      setAnalyzingAts(false);
    }
  };

  const handleGenerateCoverLetter = async (toneToUse = selectedTone) => {
    setShowCoverLetterModal(true);
    setGeneratingLetter(true);

    const token = localStorage.getItem("jobnova_token");
    if (token && token !== "demo-jwt-token") {
      const apiBase = getApiUrl();
      try {
        const res = await fetch(`${apiBase}/api/jobs/${job.id}/cover-letter`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ tone: toneToUse }),
        });
        if (res.ok) {
          const data = await res.json();
          setCoverLetterData(data);
        }
      } catch (err) {
        console.warn("Cover letter generation error:", err);
      } finally {
        setGeneratingLetter(false);
      }
    } else {
      setGeneratingLetter(false);
    }
  };

  const handleFetchInterviewPrep = async () => {
    setShowInterviewModal(true);
    if (interviewData) return;

    setLoadingInterview(true);
    const token = localStorage.getItem("jobnova_token");
    if (token && token !== "demo-jwt-token") {
      const apiBase = getApiUrl();
      try {
        const res = await fetch(`${apiBase}/api/jobs/${job.id}/interview-prep`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setInterviewData(data);
        }
      } catch (err) {
        console.warn("Interview prep fetch error:", err);
      } finally {
        setLoadingInterview(false);
      }
    } else {
      setLoadingInterview(false);
    }
  };

  const handleCopyLetter = async () => {
    if (!coverLetterData) return;
    try {
      await navigator.clipboard.writeText(coverLetterData.cover_letter);
      setCopiedLetter(true);
      setTimeout(() => setCopiedLetter(false), 2000);
    } catch {
      // Ignored
    }
  };

  const handleBookmark = () => {
    const next = toggleSaveJob({
      id: job.id,
      slug: job.slug,
      title: job.title,
      company: job.company,
      location: job.location,
      remote: job.remote,
    });
    setSaved(next);
  };

  const handleApplyClick = () => {
    recordJobApplication({
      id: job.id,
      slug: job.slug,
      title: job.title,
      company: job.company,
    });
    setApplied(true);
    window.open(job.apply_url, "_blank", "noopener,noreferrer");
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignored
    }
  };

  const isHtml = /<[a-z][\s\S]*>/i.test(job.description);
  const cleanDescription = isHtml ? sanitizeHtml(job.description) : null;
  const companyInitial = job.company ? job.company.charAt(0).toUpperCase() : "C";

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      {/* Left Main Column */}
      <div className="lg:col-span-2 space-y-6">
        {/* Main Job Card Header */}
        <article className="rounded-3xl border border-slate-200/90 bg-white p-8 shadow-card">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-slate-950 via-slate-900 to-indigo-900 font-extrabold text-white text-xl shadow-md">
                {companyInitial}
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                  {job.company}
                </p>
                <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-950">
                  {job.title}
                </h1>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-600">
                  <span className="flex items-center gap-1">
                    <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                    {job.location}
                  </span>
                  <span>•</span>
                  <span className="rounded-full bg-slate-100 px-3 py-0.5 text-xs font-semibold text-slate-700">
                    {job.remote ? "Remote" : "On-site"}
                  </span>
                  <span>•</span>
                  <span className="text-xs text-slate-400">
                    Posted {new Date(job.published_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 border-t border-slate-100 pt-8">
            <h2 className="text-xl font-bold text-slate-950 mb-4">Job Description</h2>
            {cleanDescription ? (
              <div
                className="prose max-w-none text-slate-700 leading-relaxed space-y-4 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:text-lg [&_h3]:font-medium [&_p]:mb-3"
                dangerouslySetInnerHTML={{ __html: cleanDescription }}
              />
            ) : (
              <p className="whitespace-pre-line text-base leading-relaxed text-slate-700">
                {job.description}
              </p>
            )}
          </div>

          {job.skills && job.skills.length > 0 && (
            <div className="mt-8 border-t border-slate-100 pt-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 mb-3">
                Skills & Technologies
              </h3>
              <div className="flex flex-wrap gap-2">
                {job.skills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-xl bg-slate-100 px-3.5 py-1.5 text-xs font-semibold text-slate-700 border border-slate-200"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </article>

        {/* Company Profile Box */}
        <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-card">
          <h3 className="text-lg font-bold text-slate-950">About {job.company}</h3>
          <p className="mt-2 text-xs text-slate-600 leading-relaxed">
            {job.company} is hiring verified talent through JobNova. Explore more roles from {job.company} or learn about their mission and values on their official career portal.
          </p>
        </div>
      </div>

      {/* Right Sticky Sidebar */}
      <div className="lg:col-span-1">
        <div className="sticky top-24 space-y-5">
          {/* AI Match & Tools Breakdown Card */}
          {matchData && (
            <div className="rounded-3xl border border-indigo-200 bg-gradient-to-b from-indigo-50/90 via-purple-50/40 to-white p-6 shadow-card space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">
                  ⚡ AI Candidate Fit Score
                </span>
                <span className="rounded-full bg-indigo-600 px-3 py-1 text-xs font-extrabold text-white shadow-sm">
                  {matchData.match_score}% {matchData.recommendation}
                </span>
              </div>

              <div className="h-2.5 w-full overflow-hidden rounded-full bg-indigo-100">
                <div
                  className="h-full bg-indigo-600 transition-all duration-500"
                  style={{ width: `${matchData.match_score}%` }}
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleRunAtsAnalysis}
                  className="rounded-xl bg-indigo-950 py-2.5 text-[11px] font-bold text-white shadow-md hover:bg-indigo-900 transition text-center"
                >
                  ATS Report →
                </button>
                <button
                  type="button"
                  onClick={() => handleGenerateCoverLetter()}
                  className="rounded-xl bg-purple-700 py-2.5 text-[11px] font-bold text-white shadow-md hover:bg-purple-800 transition text-center"
                >
                  Cover Letter ✍️
                </button>
              </div>

              <button
                type="button"
                onClick={handleFetchInterviewPrep}
                className="w-full rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 py-2.5 text-xs font-extrabold text-white shadow-md hover:from-emerald-700 hover:to-teal-800 transition text-center"
              >
                Interview Prep Coach 🎯
              </button>
            </div>
          )}

          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-card space-y-4">
            <button
              type="button"
              onClick={handleApplyClick}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 py-3.5 text-sm font-semibold text-white shadow-lg hover:bg-slate-800 transition"
            >
              {applied ? "Applied ✓ (Re-open Link)" : "Apply Now →"}
            </button>

            <button
              type="button"
              onClick={handleBookmark}
              className={`flex w-full items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                saved
                  ? "border-slate-950 bg-slate-950 text-white"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              <svg className="h-4 w-4" fill={saved ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              {saved ? "Saved to Bookmarks" : "Save Job"}
            </button>

            <div className="border-t border-slate-100 pt-4 space-y-3 text-xs text-slate-600">
              <div className="flex justify-between">
                <span className="text-slate-400">Workplace</span>
                <span className="font-semibold text-slate-900">{job.remote ? "Remote" : "On-site"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Location</span>
                <span className="font-semibold text-slate-900">{job.location}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Posted</span>
                <span className="font-semibold text-slate-900">
                  {new Date(job.published_at).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 flex gap-2">
              <button
                type="button"
                onClick={handleShare}
                className="flex-1 rounded-xl border border-slate-200 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                {copied ? "Link Copied! ✓" : "Share Job"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ATS Optimization Modal */}
      {showAtsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-xl font-extrabold text-slate-950">ATS Resume Optimizer Report</h3>
                <p className="text-xs text-slate-500">Evaluated against {job.title} at {job.company}</p>
              </div>
              <button
                onClick={() => setShowAtsModal(false)}
                className="rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-slate-200 transition font-bold"
              >
                ✕
              </button>
            </div>

            {analyzingAts ? (
              <div className="py-12 text-center text-sm font-semibold text-slate-600">
                Analyzing resume structure, keyword coverage, and ATS readability...
              </div>
            ) : atsData ? (
              <div className="space-y-6">
                <div className="rounded-2xl bg-slate-950 p-6 text-white text-center">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">ATS Pass Rate Score</p>
                  <p className="text-5xl font-black text-emerald-400 mt-2">{atsData.ats_score} / 100</p>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* AI Cover Letter Generator Modal */}
      {showCoverLetterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-xl font-extrabold text-slate-950">AI Cover Letter Generator ✍️</h3>
                <p className="text-xs text-slate-500">Tailored for {job.title} at {job.company}</p>
              </div>
              <button
                onClick={() => setShowCoverLetterModal(false)}
                className="rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-slate-200 transition font-bold"
              >
                ✕
              </button>
            </div>

            <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Select Tone:
              </label>
              <select
                value={selectedTone}
                onChange={(e) => {
                  setSelectedTone(e.target.value);
                  handleGenerateCoverLetter(e.target.value);
                }}
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 outline-none"
              >
                <option value="Professional">Professional</option>
                <option value="Enthusiastic">Enthusiastic</option>
                <option value="Startup">Startup</option>
                <option value="Executive">Executive</option>
                <option value="Concise">Concise</option>
              </select>
            </div>

            {generatingLetter ? (
              <div className="py-12 text-center text-sm font-semibold text-slate-600">
                Synthesizing custom cover letter matching your resume & job demands...
              </div>
            ) : coverLetterData ? (
              <div className="space-y-4">
                <textarea
                  rows={10}
                  readOnly
                  value={coverLetterData.cover_letter}
                  className="w-full rounded-2xl border border-slate-200 p-4 text-xs font-medium text-slate-800 leading-relaxed bg-slate-50/50 outline-none"
                />

                <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                  <span className="text-xs font-bold text-emerald-600">
                    Personalization Score: {coverLetterData.personalization_score}% ({coverLetterData.estimated_read_time})
                  </span>
                  <button
                    onClick={handleCopyLetter}
                    className="rounded-xl bg-slate-950 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-slate-800 transition"
                  >
                    {copiedLetter ? "Copied to Clipboard! ✓" : "Copy Cover Letter 📋"}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* AI Technical Interview Prep Coach Modal */}
      {showInterviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-xl font-extrabold text-slate-950">AI Interview Prep Coach 🎯</h3>
                <p className="text-xs text-slate-500">Role: {job.title} at {job.company}</p>
              </div>
              <button
                onClick={() => setShowInterviewModal(false)}
                className="rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-slate-200 transition font-bold"
              >
                ✕
              </button>
            </div>

            {loadingInterview ? (
              <div className="py-12 text-center text-sm font-semibold text-slate-600">
                Generating technical questions, coding scenarios, and system design prompts...
              </div>
            ) : interviewData ? (
              <div className="space-y-6">
                {/* Header Badge Row */}
                <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs font-semibold text-slate-700">
                  <span>Difficulty: <strong className="text-indigo-600">{interviewData.difficulty}</strong></span>
                  <span>Estimated Study Time: <strong className="text-emerald-600">{interviewData.estimated_preparation_time}</strong></span>
                </div>

                {/* Navigation Tabs */}
                <div className="flex gap-2 border-b border-slate-100 pb-2 overflow-x-auto">
                  <button
                    onClick={() => setActivePrepTab("tech")}
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${activePrepTab === "tech" ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                  >
                    Technical Q&A ({interviewData.technical_questions.length})
                  </button>
                  <button
                    onClick={() => setActivePrepTab("coding")}
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${activePrepTab === "coding" ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                  >
                    Coding Challenges ({interviewData.coding_questions.length})
                  </button>
                  <button
                    onClick={() => setActivePrepTab("design")}
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${activePrepTab === "design" ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                  >
                    System Design ({interviewData.system_design_questions.length})
                  </button>
                  <button
                    onClick={() => setActivePrepTab("behavioral")}
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${activePrepTab === "behavioral" ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                  >
                    Behavioral STAR ({interviewData.behavioral_questions.length})
                  </button>
                </div>

                {/* Tab Content: Technical Questions */}
                {activePrepTab === "tech" && (
                  <div className="space-y-4">
                    {interviewData.technical_questions.map((tq, i) => (
                      <div key={i} className="rounded-2xl border border-slate-200 p-4 space-y-2">
                        <h4 className="text-sm font-bold text-slate-950">Q{i + 1}: {tq.question}</h4>
                        <div className="text-xs text-slate-600 space-y-1">
                          <span className="font-semibold text-indigo-600 block">Key Answer Outlines:</span>
                          {tq.key_answer_points.map((pt, j) => (
                            <p key={j} className="flex items-start gap-1">
                              <span className="text-slate-400">•</span> {pt}
                            </p>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Tab Content: Coding Questions */}
                {activePrepTab === "coding" && (
                  <div className="space-y-3">
                    {interviewData.coding_questions.map((cq, i) => (
                      <div key={i} className="flex items-center justify-between rounded-2xl border border-slate-200 p-4">
                        <div>
                          <h4 className="text-sm font-bold text-slate-950">{cq.title}</h4>
                          <span className="text-xs text-slate-500">{cq.category}</span>
                        </div>
                        <span className={`px-2.5 py-1 text-xs font-extrabold rounded-full ${cq.difficulty === "Hard" ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-800"}`}>
                          {cq.difficulty}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Tab Content: System Design */}
                {activePrepTab === "design" && (
                  <div className="space-y-4">
                    {interviewData.system_design_questions.map((sd, i) => (
                      <div key={i} className="rounded-2xl border border-slate-200 p-4 space-y-2">
                        <h4 className="text-sm font-bold text-slate-950">{sd.title}</h4>
                        <p className="text-xs text-slate-600"><strong>Components:</strong> {sd.key_components.join(" → ")}</p>
                        <p className="text-xs text-slate-600"><strong>Key Trade-offs:</strong> {sd.tradeoffs}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Tab Content: Behavioral STAR */}
                {activePrepTab === "behavioral" && (
                  <div className="space-y-4">
                    {interviewData.behavioral_questions.map((bq, i) => (
                      <div key={i} className="rounded-2xl border border-slate-200 p-4 space-y-2">
                        <h4 className="text-sm font-bold text-slate-950">{bq.question}</h4>
                        <p className="text-xs text-slate-600"><strong>STAR Guide:</strong> {bq.star_framework}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
