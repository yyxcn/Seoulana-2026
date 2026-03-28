"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import { useWallet } from "@solana/wallet-adapter-react";
import { companies } from "@/lib/data/companies";
import { getInsiderPostsByCompany } from "@/lib/data/insiderPosts";
import { useUnlockStore } from "@/hooks/useUnlockStore";
import { useVoteStore } from "@/hooks/useVoteStore";
import { UsageDashboard } from "@/components/UsageDashboard";
import { Sidebar } from "@/components/layout/Sidebar";
import { CompanyProfile } from "@/components/company/CompanyProfile";
import { Zap, Shield, Plus, Menu, X } from "lucide-react";
import type { InsiderPost } from "@/types";

const WalletProvider = dynamic(
  () => import("@/components/WalletProvider").then((m) => m.WalletProvider),
  { ssr: false }
);
const Header = dynamic(
  () => import("@/components/Header").then((m) => m.Header),
  { ssr: false }
);
const InsiderEditor = dynamic(
  () => import("@/components/insider/InsiderEditor").then((m) => m.InsiderEditor),
  { ssr: false }
);

function AppShell() {
  const { publicKey, connected } = useWallet();
  const walletAddress = connected && publicKey ? publicKey.toBase58() : null;

  const [selectedId, setSelectedId] = useState<string | null>("nvidia");
  const [showEditor, setShowEditor] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { addUnlock, isUnlocked, stats } = useUnlockStore(walletAddress);
  const { vote, getVote, getLikes, getDislikes } = useVoteStore(walletAddress);
  const [userPosts, setUserPosts] = useState<InsiderPost[]>([]);

  // Fetch user-submitted insider posts from server
  const refreshUserPosts = useCallback(async () => {
    try {
      const res = await fetch("/api/insider");
      if (res.ok) {
        const data = await res.json();
        setUserPosts(data.posts || []);
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetching external data
    refreshUserPosts();
  }, [refreshUserPosts]);

  const selectedCompany = companies.find((c) => c.id === selectedId) || null;
  const hardcodedPosts = selectedId ? getInsiderPostsByCompany(selectedId) : [];
  const companyUserPosts = selectedId ? userPosts.filter((p) => p.companyId === selectedId) : [];
  const insiderPosts = [...hardcodedPosts, ...companyUserPosts];

  const postCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const c of companies) {
      counts[c.id] = getInsiderPostsByCompany(c.id).length
        + userPosts.filter((p) => p.companyId === c.id).length;
    }
    return counts;
  }, [userPosts]);

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Header />

      <div className="flex-1 flex overflow-hidden">
        {/* Mobile sidebar toggle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="md:hidden fixed bottom-6 left-6 z-40 w-12 h-12 rounded-full bg-violet-600 text-white shadow-lg flex items-center justify-center hover:bg-violet-700 transition-colors"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        {/* Sidebar */}
        <div
          className={`
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
            md:translate-x-0 transition-transform duration-200
            fixed md:static inset-y-16 left-0 z-30 md:z-auto
          `}
        >
          <Sidebar
            selectedId={selectedId}
            onSelect={(id) => {
              setSelectedId(id);
              setSidebarOpen(false);
            }}
            postCounts={postCounts}
          />
        </div>

        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-20 bg-black/20 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Panel */}
        <div className="flex-1 flex flex-col overflow-hidden bg-gray-50/50">
          {/* Stats Bar */}
          <div className="shrink-0 px-6 pt-5 pb-3">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-violet-500" />
                <span className="text-sm font-semibold text-gray-700">Dashboard</span>
              </div>
              <button
                onClick={() => setShowEditor(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-violet-50 text-violet-600 hover:bg-violet-100 transition-colors border border-violet-100"
              >
                <Plus className="w-3.5 h-3.5" />
                Post Review
              </button>
            </div>
            <UsageDashboard stats={stats} />
          </div>

          {/* Company Content */}
          {selectedCompany ? (
            <CompanyProfile
              company={selectedCompany}
              insiderPosts={insiderPosts}
              isUnlocked={isUnlocked}
              onUnlock={addUnlock}
              getLikes={getLikes}
              getDislikes={getDislikes}
              getVote={getVote}
              onVote={vote}
            />
          ) : (
            <EmptyState />
          )}
        </div>
      </div>

      {/* Insider Editor Modal */}
      {showEditor && (
        <InsiderEditor
          onClose={() => {
            setShowEditor(false);
            refreshUserPosts();
          }}
        />
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
          <Shield className="w-8 h-8 text-gray-300" />
        </div>
        <h3 className="text-lg font-semibold text-gray-400">Select a Company</h3>
        <p className="text-sm text-gray-300 mt-1">
          Choose a company from the sidebar to view insights
        </p>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <WalletProvider>
      <AppShell />
    </WalletProvider>
  );
}
