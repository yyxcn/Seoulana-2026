"use client";

import { useState } from "react";
import { useWallet, useAnchorWallet } from "@solana/wallet-adapter-react";
import { useConnection } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { Shield, Send, X, Mail, CheckCircle, ArrowRight, Loader2 } from "lucide-react";
import { companies } from "@/lib/data/companies";
import { cn } from "@/lib/utils";
import { getProgram, getReviewPDA } from "@/lib/anchor/program";
import { BN } from "@coral-xyz/anchor";

type Step = "email" | "code" | "review";

interface Props {
  onClose: () => void;
}

export function InsiderEditor({ onClose }: Props) {
  const { publicKey, connected } = useWallet();
  const anchorWallet = useAnchorWallet();
  const { connection } = useConnection();
  const { visible: walletModalVisible, setVisible } = useWalletModal();
  const [submitted, setSubmitted] = useState(false);
  const [txSignature, setTxSignature] = useState<string | null>(null);

  // Email verification state
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [demoCode, setDemoCode] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [sendingCode, setSendingCode] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [emailCompanyId, setEmailCompanyId] = useState("");

  const [form, setForm] = useState({
    companyId: "",
    role: "",
    tenure: "",
    price: "0.003",
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
  const [submitError, setSubmitError] = useState<string | null>(null);

  const selectedCompanyDomain = companies.find((c) => c.id === emailCompanyId)?.emailDomain;

  const handleSendCode = async () => {
    if (!emailCompanyId) {
      setEmailError("Select a company first");
      return;
    }
    const domain = companies.find((c) => c.id === emailCompanyId)?.emailDomain;
    if (!domain || !email.endsWith(`@${domain}`)) {
      setEmailError(`Email must end with @${domain}`);
      return;
    }
    setEmailError(null);
    setSendingCode(true);
    try {
      const res = await fetch("/api/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, companyId: emailCompanyId }),
      });
      const data = await res.json();
      if (data.success) {
        setDemoCode(data._demo_code);
        setStep("code");
      } else {
        setEmailError(data.error || "Failed to send code");
      }
    } catch {
      setEmailError("Network error");
    } finally {
      setSendingCode(false);
    }
  };

  const handleVerifyCode = async () => {
    setCodeError(null);
    setVerifying(true);
    try {
      const res = await fetch("/api/verify-email", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, companyId: emailCompanyId, code: verifyCode }),
      });
      const data = await res.json();
      if (data.verified) {
        setForm((f) => ({ ...f, companyId: emailCompanyId }));
        setStep("review");
      } else {
        setCodeError(data.error || "Invalid code");
      }
    } catch {
      setCodeError("Network error");
    } finally {
      setVerifying(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!connected || !publicKey) {
      setVisible(true);
      return;
    }

    if (!anchorWallet) {
      setVisible(true);
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      // Step 1: Build review content string and compute SHA-256 hash
      const reviewContent = JSON.stringify({
        review: form.review,
        interview: form.interview,
        wlb: form.wlb,
        culture: form.culture,
        pros: form.pros,
        cons: form.cons,
        advice: form.advice,
        salaryMin: form.salaryMin,
        salaryMax: form.salaryMax,
      });
      const encoded = new TextEncoder().encode(reviewContent);
      const hashBuffer = await crypto.subtle.digest("SHA-256", encoded.buffer as ArrayBuffer);
      const reviewHash = Array.from(new Uint8Array(hashBuffer));

      // Step 2: Call on-chain register_review
      const program = getProgram(connection, anchorWallet);
      const priceLamports = Math.round(parseFloat(form.price) * LAMPORTS_PER_SOL);

      const reviewPDA = getReviewPDA(publicKey, form.companyId);

      const tx = await program.methods
        .registerReview(
          form.companyId,
          form.role,
          new BN(priceLamports),
          reviewHash,
          true // verified (email verified in previous step)
        )
        .accounts({
          review: reviewPDA,
          author: publicKey,
        })
        .rpc();

      setTxSignature(tx);

      // Step 3: Save full content off-chain via API
      await fetch("/api/insider", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress: publicKey.toBase58(),
          txSignature: tx,
          ...form,
        }),
      });

      setSubmitted(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Transaction failed";
      if (msg.includes("User rejected")) {
        setSubmitError("서명이 거부되었습니다. 다시 시도해주세요.");
      } else {
        console.error("On-chain registration error:", msg);
        setSubmitError(`트랜잭션 실패: ${msg}`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!connected) {
    return (
      <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm ${walletModalVisible ? "pointer-events-none" : ""}`}>
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
          <span className="inline-flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-medium mb-2">
            <CheckCircle className="w-3 h-3" />
            Email Verified Insider
          </span>
          <p className="text-sm text-gray-500 mb-2">
            Your insider post is now live. You'll earn <span className="font-semibold text-violet-600">70%</span> of every micropayment when someone unlocks your review.
          </p>
          <p className="text-xs text-gray-400 mb-2">
            Wallet: {publicKey?.toBase58().slice(0, 8)}...{publicKey?.toBase58().slice(-4)}
          </p>
          {txSignature && (
            <a
              href={`https://explorer.solana.com/tx/${txSignature}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-violet-500 hover:text-violet-700 mb-4"
            >
              View on-chain registration →
            </a>
          )}
          {!txSignature && <div className="mb-4" />}
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

  // ── Step 1: Email Verification ──
  if (step === "email") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <div className="bg-white rounded-2xl max-w-md w-full mx-4">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between rounded-t-2xl">
            <h2 className="text-lg font-bold text-gray-900">Verify Your Identity</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
          <div className="p-6 space-y-5">
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-violet-50 flex items-center justify-center mx-auto mb-3">
                <Mail className="w-7 h-7 text-violet-500" />
              </div>
              <p className="text-sm text-gray-500">
                Verify your company email to prove you&apos;re an insider.
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Company</label>
              <select
                value={emailCompanyId}
                onChange={(e) => {
                  setEmailCompanyId(e.target.value);
                  setEmailError(null);
                }}
                className="mt-1 w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-500/20 focus:border-violet-300 outline-none"
              >
                <option value="">Select…</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Work Email</label>
              <input
                type="email"
                placeholder={selectedCompanyDomain ? `you@${selectedCompanyDomain}` : "Select a company first"}
                value={email}
                onChange={(e) => { setEmail(e.target.value); setEmailError(null); }}
                disabled={!emailCompanyId}
                className="mt-1 w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-500/20 focus:border-violet-300 outline-none disabled:opacity-50"
              />
              {emailError && <p className="text-xs text-red-500 mt-1">{emailError}</p>}
            </div>

            <button
              onClick={handleSendCode}
              disabled={sendingCode || !email || !emailCompanyId}
              className={cn(
                "w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all",
                sendingCode || !email || !emailCompanyId
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-violet-500 to-indigo-600 text-white hover:from-violet-600 hover:to-indigo-700"
              )}
            >
              {sendingCode ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              {sendingCode ? "Sending…" : "Send Verification Code"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Step 2: Enter Code ──
  if (step === "code") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <div className="bg-white rounded-2xl max-w-md w-full mx-4">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between rounded-t-2xl">
            <h2 className="text-lg font-bold text-gray-900">Enter Code</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
          <div className="p-6 space-y-5">
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-3">
                <Shield className="w-7 h-7 text-emerald-500" />
              </div>
              <p className="text-sm text-gray-500">
                We sent a 6-digit code to <span className="font-semibold text-gray-700">{email}</span>
              </p>
            </div>

            {/* Demo banner — shows the code for demo purposes */}
            {demoCode && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-center">
                <p className="text-xs text-amber-600 font-semibold uppercase tracking-wide mb-1">Demo Mode</p>
                <p className="text-2xl font-mono font-bold text-amber-700 tracking-[0.3em]">{demoCode}</p>
              </div>
            )}

            <div>
              <input
                type="text"
                maxLength={6}
                placeholder="000000"
                value={verifyCode}
                onChange={(e) => { setVerifyCode(e.target.value.replace(/\D/g, "")); setCodeError(null); }}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-center text-2xl font-mono tracking-[0.3em] focus:ring-2 focus:ring-violet-500/20 focus:border-violet-300 outline-none"
              />
              {codeError && <p className="text-xs text-red-500 mt-1 text-center">{codeError}</p>}
            </div>

            <button
              onClick={handleVerifyCode}
              disabled={verifying || verifyCode.length !== 6}
              className={cn(
                "w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all",
                verifying || verifyCode.length !== 6
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700"
              )}
            >
              {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              {verifying ? "Verifying…" : "Verify & Continue"}
            </button>

            <button
              onClick={() => { setStep("email"); setVerifyCode(""); setDemoCode(null); }}
              className="w-full text-center text-xs text-gray-400 hover:text-gray-600"
            >
              ← Use a different email
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Step 3: Review Form (after email verified) ──
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Submit Insider Review</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="inline-flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-medium">
                <CheckCircle className="w-3 h-3" />
                {email} verified
              </span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Company (locked) & Role */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Company</label>
              <div className="mt-1 w-full px-3 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-sm text-gray-700 font-medium">
                {companies.find((c) => c.id === form.companyId)?.name || form.companyId}
              </div>
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

          {/* Tenure, Price & Salary */}
          <div className="grid grid-cols-4 gap-4">
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
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Unlock Price</label>
              <select
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="mt-1 w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-500/20 focus:border-violet-300 outline-none"
              >
                <option value="0.001">0.001 SOL</option>
                <option value="0.002">0.002 SOL</option>
                <option value="0.003">0.003 SOL</option>
                <option value="0.004">0.004 SOL</option>
                <option value="0.005">0.005 SOL</option>
                <option value="0.008">0.008 SOL</option>
                <option value="0.01">0.01 SOL</option>
              </select>
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
          {submitError && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
              {submitError}
            </div>
          )}
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
              {submitting ? "Signing & Registering…" : "Register On-Chain"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
