"use client";

import type { UsageStats } from "@/types";
import { Lock, Coins, TrendingUp, Zap } from "lucide-react";

interface Props {
  stats: UsageStats;
}

export function UsageDashboard({ stats }: Props) {
  const items = [
    {
      label: "Today",
      value: stats.todayUnlocks,
      suffix: " unlocks",
      icon: Zap,
      color: "text-violet-600",
      bg: "bg-violet-50",
    },
    {
      label: "Today Spent",
      value: stats.todaySpent.toFixed(4),
      suffix: " SOL",
      icon: Coins,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      label: "Total",
      value: stats.totalUnlocks,
      suffix: " unlocks",
      icon: Lock,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Total Spent",
      value: stats.totalSpent.toFixed(4),
      suffix: " SOL",
      icon: TrendingUp,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-2xl border border-gray-100 bg-white p-4 transition-all hover:shadow-sm"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className={`p-1.5 rounded-lg ${item.bg}`}>
              <item.icon className={`w-3.5 h-3.5 ${item.color}`} />
            </div>
            <span className="text-xs text-gray-400 font-medium">{item.label}</span>
          </div>
          <div className="text-xl font-bold text-gray-900">
            {item.value}
            <span className="text-sm font-normal text-gray-400">{item.suffix}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
