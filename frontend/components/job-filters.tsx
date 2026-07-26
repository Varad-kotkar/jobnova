"use client";

import React from "react";
import { X, Filter, RotateCcw, Check } from "lucide-react";

export interface FilterState {
  employmentTypes: string[];
  experienceLevels: string[];
  remoteOnly: boolean;
  visaSponsorship: boolean;
  location: string;
  sortBy: string;
}

interface JobFiltersProps {
  filters: FilterState;
  onFilterChange: (newFilters: FilterState) => void;
  onClearAll: () => void;
}

const EMPLOYMENT_TYPES = [
  { id: "full_time", label: "Full-time" },
  { id: "part_time", label: "Part-time" },
  { id: "contract", label: "Contract" },
  { id: "internship", label: "Internship" },
];

const EXPERIENCE_LEVELS = [
  { id: "entry", label: "Entry Level" },
  { id: "mid", label: "Mid Level" },
  { id: "senior", label: "Senior Level" },
  { id: "lead", label: "Lead / Executive" },
];

export function JobFilters({ filters, onFilterChange, onClearAll }: JobFiltersProps) {
  const toggleEmploymentType = (typeId: string) => {
    const exists = filters.employmentTypes.includes(typeId);
    const updated = exists
      ? filters.employmentTypes.filter((t) => t !== typeId)
      : [...filters.employmentTypes, typeId];
    onFilterChange({ ...filters, employmentTypes: updated });
  };

  const toggleExperienceLevel = (levelId: string) => {
    const exists = filters.experienceLevels.includes(levelId);
    const updated = exists
      ? filters.experienceLevels.filter((l) => l !== levelId)
      : [...filters.experienceLevels, levelId];
    onFilterChange({ ...filters, experienceLevels: updated });
  };

  const activeChipsCount =
    filters.employmentTypes.length +
    filters.experienceLevels.length +
    (filters.remoteOnly ? 1 : 0) +
    (filters.visaSponsorship ? 1 : 0) +
    (filters.location ? 1 : 0);

  return (
    <aside className="w-full bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-6">
      {/* Filter Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2 font-bold text-slate-900 text-base">
          <Filter className="w-4 h-4 text-blue-600" />
          <span>Filters</span>
          {activeChipsCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-bold bg-blue-100 text-blue-700 rounded-full">
              {activeChipsCount}
            </span>
          )}
        </div>

        {activeChipsCount > 0 && (
          <button
            onClick={onClearAll}
            className="text-xs font-semibold text-slate-500 hover:text-blue-600 flex items-center gap-1 transition-colors"
          >
            <RotateCcw className="w-3 h-3" /> Clear All
          </button>
        )}
      </div>

      {/* Active Filter Chips */}
      {activeChipsCount > 0 && (
        <div className="flex flex-wrap gap-1.5 pb-4 border-b border-slate-100">
          {filters.remoteOnly && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Remote Only
              <button onClick={() => onFilterChange({ ...filters, remoteOnly: false })}>
                <X className="w-3 h-3 hover:text-emerald-900" />
              </button>
            </span>
          )}
          {filters.visaSponsorship && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
              Visa Sponsorship
              <button onClick={() => onFilterChange({ ...filters, visaSponsorship: false })}>
                <X className="w-3 h-3 hover:text-purple-900" />
              </button>
            </span>
          )}
          {filters.employmentTypes.map((typeId) => (
            <span
              key={typeId}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200"
            >
              {EMPLOYMENT_TYPES.find((t) => t.id === typeId)?.label || typeId}
              <button onClick={() => toggleEmploymentType(typeId)}>
                <X className="w-3 h-3 hover:text-blue-900" />
              </button>
            </span>
          ))}
          {filters.experienceLevels.map((levelId) => (
            <span
              key={levelId}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200"
            >
              {EXPERIENCE_LEVELS.find((l) => l.id === levelId)?.label || levelId}
              <button onClick={() => toggleExperienceLevel(levelId)}>
                <X className="w-3 h-3 hover:text-slate-900" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Remote & Visa Toggle */}
      <div className="space-y-3">
        <label className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition-colors">
          <span className="text-sm font-semibold text-slate-800">Remote Jobs Only</span>
          <input
            type="checkbox"
            checked={filters.remoteOnly}
            onChange={(e) => onFilterChange({ ...filters, remoteOnly: e.target.checked })}
            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
          />
        </label>

        <label className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition-colors">
          <span className="text-sm font-semibold text-slate-800">Visa Sponsorship</span>
          <input
            type="checkbox"
            checked={filters.visaSponsorship}
            onChange={(e) => onFilterChange({ ...filters, visaSponsorship: e.target.checked })}
            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
          />
        </label>
      </div>

      {/* Employment Type */}
      <div>
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Employment Type</h4>
        <div className="space-y-2">
          {EMPLOYMENT_TYPES.map((type) => {
            const isChecked = filters.employmentTypes.includes(type.id);
            return (
              <label
                key={type.id}
                className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-colors text-sm font-medium ${
                  isChecked ? "bg-blue-50/60 text-blue-900" : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleEmploymentType(type.id)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <span>{type.label}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Experience Level */}
      <div>
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Experience Level</h4>
        <div className="space-y-2">
          {EXPERIENCE_LEVELS.map((level) => {
            const isChecked = filters.experienceLevels.includes(level.id);
            return (
              <label
                key={level.id}
                className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-colors text-sm font-medium ${
                  isChecked ? "bg-blue-50/60 text-blue-900" : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleExperienceLevel(level.id)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <span>{level.label}</span>
              </label>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
