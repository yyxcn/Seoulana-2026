"use client";

import { useState } from "react";
import { MapPin, Users, Star, BarChart3, Briefcase, DollarSign, FileText } from "lucide-react";
import type { Company } from "@/types";
import type { InsiderPost } from "@/types";
import { cn } from "@/lib/utils";
import { InsiderPostList } from "@/components/insider/InsiderPostList";
import type { UnlockRecord } from "@/types";

type Tab = "overview" | "compensation" | "insiders";

interface Props {
  company: Company;
  insiderPosts: InsiderPost[];
  isUnlocked: (postId: string) => boolean;
  onUnlock: (record: UnlockRecord) => void;
  getLikes: (postId: string, baseLikes: number) => number;
  getDislikes: (postId: string, baseDislikes: number) => number;
  getVote: (postId: string) => "like" | "dislike" | null;
  onVote: (postId: string, type: "like" | "dislike") => void;
}

export function CompanyProfile({ company, insiderPosts, isUnlocked, onUnlock, getLikes, getDislikes, getVote, onVote }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const tabs: { id: Tab; label: string; icon: typeof Briefcase; count?: number }[] = [
    { id: "overview", label: "Overview", icon: Briefcase },
    { id: "compensation", label: "Compensation", icon: DollarSign },
    { id: "insiders", label: "Insider Posts", icon: FileText, count: insiderPosts.length },
  ];

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Company Header */}
      <div className="px-8 pt-8 pb-6 border-b border-gray-100 bg-white">
        <div className="flex items-start gap-4">
          <img src={company.logo} alt={company.name} className="w-14 h-14 object-contain" />
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{company.name}</h1>
            <p className="text-sm text-gray-500 mt-1">{company.industry}</p>
            <div className="flex items-center gap-4 mt-3">
              <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                <MapPin className="w-3 h-3" />
                {company.headquarters}
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                <Users className="w-3 h-3" />
                {company.employeeCount}
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                {company.glassdoorRating}
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                <BarChart3 className="w-3 h-3" />
                Interview: {company.interviewDifficulty}
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                activeTab === tab.id
                  ? "bg-violet-50 text-violet-700"
                  : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
              )}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
              {tab.count !== undefined && (
                <span
                  className={cn(
                    "px-1.5 py-0.5 rounded-full text-[10px] font-semibold",
                    activeTab === tab.id
                      ? "bg-violet-100 text-violet-600"
                      : "bg-gray-100 text-gray-400"
                  )}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-8">
        {activeTab === "overview" && <OverviewTab company={company} />}
        {activeTab === "compensation" && <CompensationTab company={company} />}
        {activeTab === "insiders" && (
          <InsiderPostList
            posts={insiderPosts}
            isUnlocked={isUnlocked}
            onUnlock={onUnlock}
            getLikes={getLikes}
            getDislikes={getDislikes}
            getVote={getVote}
            onVote={onVote}
          />
        )}
      </div>
    </div>
  );
}

function OverviewTab({ company }: { company: Company }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-2">About</h3>
        <p className="text-sm text-gray-600 leading-relaxed">{company.overview}</p>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Hiring Bar</h3>
        <div className="space-y-2">
          {company.freeContent.hiringSpecs.map((spec, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-violet-400 mt-0.5 text-sm">•</span>
              <p className="text-sm text-gray-600">{spec}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CompensationTab({ company }: { company: Company }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Compensation Table</h3>
        <div className="overflow-x-auto rounded-xl border border-gray-100">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/80">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Level</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">Base</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">Bonus</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">Stock</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-violet-600">Total TC</th>
              </tr>
            </thead>
            <tbody>
              {company.freeContent.salaryTable.map((row, i) => (
                <tr key={i} className="border-t border-gray-50 hover:bg-violet-50/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-700">{row.level}</td>
                  <td className="text-right px-4 py-3 text-gray-600">{row.base}</td>
                  <td className="text-right px-4 py-3 text-gray-600">{row.bonus}</td>
                  <td className="text-right px-4 py-3 text-gray-600">{row.stock}</td>
                  <td className="text-right px-4 py-3 font-bold text-violet-600">{row.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-xl bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-100 p-4">
        <p className="text-xs text-violet-600 font-medium">
          Want detailed salary breakdowns from real employees? Check the Insider Posts tab for verified, first-hand compensation data with context.
        </p>
      </div>
    </div>
  );
}
