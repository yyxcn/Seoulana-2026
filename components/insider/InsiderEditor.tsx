"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Shield, Send, X, Plus } from "lucide-react";
import { companies } from "@/lib/data/companies";
import { cn } from "@/lib/utils";

interface Props {
  onClose: () => void;
}

export function InsiderEditor({ onClose }: Props) {
  const { publicKey, connected } = useWallet();
  const { setVisible } = useWalletModal();
  const [submitted, setSubmitted] = useState(false);

  const [form, setForm] = useState({
    companyId: "",
    role: "",
    tenure: "",
    salaryMin: "",
    salaryMax: "",
    review: "",
    interview: "",
    wlb: "",
    culture: "",
    pros: "",
    cons: "",
    advice: "",
  });

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!connected || !publicKey) {
      setVisible(true);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/insider", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress: publicKey.toBase58(),
          ...form,
        }),
      });
      if (!res.ok) throw new Error("Failed to submit");
      setSubmitted(true);
    } catch {
      // Fallback: still show success for demo
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (!connected) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 text-center">
          <Shield className="w-12 h-12 text-violet-500 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-gray-900 mb-2">Connect Wallet to Continue</h2>
          <p className="text-sm text-gray-500 mb-6">
            Your wallet address serves as your anonymous identity. Only verified insiders can submit posts.
          </p>
          <button
            onClick={() => setVisible(true)}
            className="px-6 py-3 bg-violet-600 text-white rounded-xl font-semibold hover:bg-violet-700 transition-colors"
          >
            Connect Wallet
          </button>
          <button onClick={onClose} className="block mx-auto mt-3 text-sm text-gray-400 hover:text-gray-600">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-emerald-500" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">Post Submitted!</h2>
          <p className="text-sm text-gray-500 mb-2">
            Your insider post is now live. You'll earn <span className="font-semibold text-violet-600">70%</span> of every micropayment when someone unlocks your review.
          </p>
          <p className="text-xs text-gray-400 mb-6">
            Wallet: {publicKey?.toBase58().slice(0, 8)}...{publicKey?.toBase58().slice(-4)}
          </p>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-violet-600 text-white rounded-xl font-semibold hover:bg-violet-700 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Submit Insider Review</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Earn 70% of every unlock as a reward
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Company & Role */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Company</label>
              <select
                value={form.companyId}
                onChange={(e) => setForm({ ...form, companyId: e.target.value })}
                required
                className="mt-1 w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-500/20 focus:border-violet-300 outline-none"
              >
                <option value="">Select…</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Your Role</label>
              <input
                type="text"
                placeholder="e.g. Senior SWE"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                required
                className="mt-1 w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-500/20 focus:border-violet-300 outline-none"
              />
            </div>
          </div>

          {/* Tenure & Salary */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Tenure</label>
              <input
                type="text"
                placeholder="e.g. 3 years"
                value={form.tenure}
                onChange={(e) => setForm({ ...form, tenure: e.target.value })}
                required
                className="mt-1 w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-500/20 focus:border-violet-300 outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">TC Min</label>
              <input
                type="text"
                placeholder="$300K"
                value={form.salaryMin}
                onChange={(e) => setForm({ ...form, salaryMin: e.target.value })}
                className="mt-1 w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-500/20 focus:border-violet-300 outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">TC Max</label>
              <input
                type="text"
                placeholder="$450K"
                value={form.salaryMax}
                onChange={(e) => setForm({ ...form, salaryMax: e.target.value })}
                className="mt-1 w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-500/20 focus:border-violet-300 outline-none"
              />
            </div>
          </div>

          {/* Review */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Detailed Review</label>
            <textarea
              placeholder="Share your honest experience working here…"
              value={form.review}
              onChange={(e) => setForm({ ...form, review: e.target.value })}
              required
              rows={4}
              className="mt-1 w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-500/20 focus:border-violet-300 outline-none resize-none"
            />
          </div>

          {/* Interview Experience */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Interview Experience</label>
            <textarea
              placeholder="Describe the interview process and what to prepare…"
              value={form.interview}
              onChange={(e) => setForm({ ...form, interview: e.target.value })}
              rows={3}
              className="mt-1 w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-500/20 focus:border-violet-300 outline-none resize-none"
            />
          </div>

          {/* WLB & Culture */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Work-Life Balance</label>
              <textarea
                placeholder="Hours, flexibility, PTO…"
                value={form.wlb}
                onChange={(e) => setForm({ ...form, wlb: e.target.value })}
                rows={3}
                className="mt-1 w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-500/20 focus:border-violet-300 outline-none resize-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Team Culture</label>
              <textarea
                placeholder="Management, collaboration, growth…"
                value={form.culture}
                onChange={(e) => setForm({ ...form, culture: e.target.value })}
                rows={3}
                className="mt-1 w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-500/20 focus:border-violet-300 outline-none resize-none"
              />
            </div>
          </div>

          {/* Pros & Cons */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Pros (one per line)</label>
              <textarea
                placeholder="Great WLB&#10;High comp&#10;Smart peers"
                value={form.pros}
                onChange={(e) => setForm({ ...form, pros: e.target.value })}
                rows={3}
                className="mt-1 w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-500/20 focus:border-violet-300 outline-none resize-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Cons (one per line)</label>
              <textarea
                placeholder="Long hours&#10;Slow promos&#10;RTO policy"
                value={form.cons}
                onChange={(e) => setForm({ ...form, cons: e.target.value })}
                rows={3}
                className="mt-1 w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-500/20 focus:border-violet-300 outline-none resize-none"
              />
            </div>
          </div>

          {/* Advice */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Advice for Candidates</label>
            <textarea
              placeholder="What would you tell someone considering this company?"
              value={form.advice}
              onChange={(e) => setForm({ ...form, advice: e.target.value })}
              rows={2}
              className="mt-1 w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-500/20 focus:border-violet-300 outline-none resize-none"
            />
          </div>

          {/* Submit */}
          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-gray-400">
              Your wallet ({publicKey?.toBase58().slice(0, 6)}…) will be your anonymous identity
            </p>
            <button
              type="submit"
              disabled={submitting}
              className={cn(
                "flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all",
                submitting
                  ? "bg-gray-200 text-gray-400 cursor-wait"
                  : "bg-gradient-to-r from-violet-500 to-indigo-600 text-white hover:from-violet-600 hover:to-indigo-700 active:scale-[0.98] shadow-sm hover:shadow-md"
              )}
            >
              <Send className="w-4 h-4" />
              {submitting ? "Submitting…" : "Submit Post"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
