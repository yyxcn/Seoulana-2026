"use client";

import { useState } from "react";
import { Search, Hash } from "lucide-react";
import { companies } from "@/lib/data/companies";
import type { Company } from "@/types";
import { cn } from "@/lib/utils";

interface Props {
  selectedId: string | null;
  onSelect: (id: string) => void;
  postCounts: Record<string, number>;
}

export function Sidebar({ selectedId, onSelect, postCounts }: Props) {
  const [query, setQuery] = useState("");

  const filtered = companies.filter(
    (c) =>
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      c.industry.toLowerCase().includes(query.toLowerCase())
  );

  const postCount = (companyId: string) => postCounts[companyId] ?? 0;

  return (
    <aside className="w-72 shrink-0 border-r border-gray-100 bg-white flex flex-col h-full">
      {/* Search */}
      <div className="p-4 border-b border-gray-50">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
          <input
            type="text"
            placeholder="Search companies…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm text-gray-700 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-300 transition-all"
          />
        </div>
      </div>

      {/* Company list */}
      <nav className="flex-1 overflow-y-auto py-2">
        {filtered.map((company) => (
          <CompanyRow
            key={company.id}
            company={company}
            postCount={postCount(company.id)}
            isSelected={selectedId === company.id}
            onSelect={() => onSelect(company.id)}
          />
        ))}
        {filtered.length === 0 && (
          <p className="text-sm text-gray-300 text-center py-8">No results</p>
        )}
      </nav>
    </aside>
  );
}

function CompanyRow({
  company,
  postCount,
  isSelected,
  onSelect,
}: {
  company: Company;
  postCount: number;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 text-left transition-all duration-150",
        isSelected
          ? "bg-violet-50/80 border-l-2 border-violet-500"
          : "border-l-2 border-transparent hover:bg-gray-50"
      )}
    >
      <span className="text-2xl">{company.logo}</span>
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-sm font-semibold truncate",
            isSelected ? "text-violet-700" : "text-gray-800"
          )}
        >
          {company.name}
        </p>
        <p className="text-xs text-gray-400 truncate">{company.industry}</p>
      </div>
      {postCount > 0 && (
        <span
          className={cn(
            "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold",
            isSelected
              ? "bg-violet-100 text-violet-600"
              : "bg-gray-100 text-gray-500"
          )}
        >
          <Hash className="w-2.5 h-2.5" />
          {postCount}
        </span>
      )}
    </button>
  );
}
