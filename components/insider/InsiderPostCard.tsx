"use client";

import { useState } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Unlock, ExternalLink, Loader2, Check, Sparkles, Clock, Shield, ThumbsUp, ThumbsDown } from "lucide-react";
import type { InsiderPost, UnlockRecord } from "@/types";
import { createSplitPaymentTransaction, PLATFORM_WALLET } from "@/lib/x402";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { cn } from "@/lib/utils";

interface Props {
  post: InsiderPost;
  isUnlocked: boolean;
  onUnlock: (record: UnlockRecord) => void;
  likes: number;
  dislikes: number;
  userVote: "like" | "dislike" | null;
  onVote: (postId: string, type: "like" | "dislike") => void;
}

export function InsiderPostCard({ post, isUnlocked, onUnlock, likes, dislikes, userVote, onVote }: Props) {
  const { publicKey, signTransaction, connected } = useWallet();

  // Check if the connected wallet is the author of this post
  const isOwnPost = connected && publicKey && post.author.walletAddress === publicKey.toBase58();
  const effectiveUnlocked = isUnlocked || !!isOwnPost;
  const { connection } = useConnection();
  const { setVisible } = useWalletModal();
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [paidContent, setPaidContent] = useState<InsiderPost["paidContent"] | null>(null);
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUnlock = async () => {
    if (!connected || !publicKey) {
      setVisible(true);
      return;
    }
    if (!signTransaction) {
      setError("Wallet does not support transaction signing.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Step 1: Get payment requirements (402)
      const res = await fetch(`/api/posts/${post.id}`);
      if (res.status !== 402) throw new Error("Unexpected response");
      const requirements = await res.json();

      // Step 2: Create split payment transaction (70% insider, 30% platform)
      const totalLamports = requirements.amount || Math.round(post.price * LAMPORTS_PER_SOL);
      const insiderWallet = requirements.insiderWallet || PLATFORM_WALLET;

      const transaction = await createSplitPaymentTransaction(
        publicKey,
        PLATFORM_WALLET,
        insiderWallet,
        totalLamports
      );

      // Step 3: Sign & send
      const signedTx = await signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signedTx.serialize(), {
        skipPreflight: false,
        preflightCommitment: "confirmed",
      });
      await connection.confirmTransaction(signature, "confirmed");
      setTxSignature(signature);

      // Step 4: Verify and get content
      const paidRes = await fetch(`/api/posts/${post.id}`, {
        headers: { "X-PAYMENT": JSON.stringify({ signature }) },
      });
      if (!paidRes.ok) throw new Error("Payment verification failed");
      const data = await paidRes.json();

      setPaidContent(data.post.paidContent);
      setExpanded(true);
      onUnlock({
        postId: post.id,
        companyId: post.companyId,
        company: post.companyId,
        price: post.price,
        timestamp: Date.now(),
        txSignature: signature,
        walletAddress: publicKey.toBase58(),
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Payment error";
      setError(msg.includes("User rejected") ? "Payment cancelled." : msg);
    } finally {
      setLoading(false);
    }
  };

  const handleExpand = () => {
    if (effectiveUnlocked) {
      setExpanded(!expanded);
      if (!paidContent) setPaidContent(post.paidContent);
    }
  };

  return (
    <motion.div
      layout
      className={cn(
        "rounded-2xl border bg-white transition-all duration-300",
        isOwnPost
          ? "border-violet-200 shadow-sm ring-1 ring-violet-100"
          : effectiveUnlocked
            ? "border-violet-100 shadow-sm"
            : "border-gray-100 hover:border-gray-200 hover:shadow-sm"
      )}
    >
      {/* Author & Teaser */}
      <div className="p-5">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className={cn("w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0", post.author.avatarColor)}>
            {post.author.alias.split("#")[1]?.slice(0, 2) || "??"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-800">{post.author.alias}</span>
              <Shield className="w-3 h-3 text-violet-500" />
              {isOwnPost && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-violet-50 text-violet-600 border border-violet-200">
                  Your Post
                </span>
              )}
              {!isOwnPost && effectiveUnlocked && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-600">
                  <Check className="w-2.5 h-2.5" />
                  Unlocked
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              {post.author.role} · {post.author.tenure}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="inline-flex items-center gap-1 text-[10px] text-gray-300">
              <Clock className="w-3 h-3" />
              {post.createdAt}
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-50 border border-gray-100 text-xs font-semibold text-gray-600">
              <Sparkles className="w-3 h-3 text-violet-500" />
              {post.priceLabel}
            </span>
          </div>
        </div>

        {/* Teaser */}
        <p className="mt-3 text-sm text-gray-600 leading-relaxed">
          {post.teaser}
        </p>

        {/* Like / Dislike — visible to all, votable only by unlockers */}
        <div className="mt-3 flex items-center gap-3">
          <button
            onClick={() => effectiveUnlocked && onVote(post.id, "like")}
            disabled={!effectiveUnlocked}
            title={effectiveUnlocked ? "Like" : "Unlock to vote"}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
              userVote === "like"
                ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                : effectiveUnlocked
                  ? "bg-gray-50 text-gray-500 border border-gray-100 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200"
                  : "bg-gray-100 text-gray-500 border border-gray-200 cursor-default"
            )}
          >
            <ThumbsUp className={cn("w-3.5 h-3.5", userVote === "like" && "fill-emerald-500")} />
            {likes}
          </button>
          <button
            onClick={() => effectiveUnlocked && onVote(post.id, "dislike")}
            disabled={!effectiveUnlocked}
            title={effectiveUnlocked ? "Dislike" : "Unlock to vote"}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
              userVote === "dislike"
                ? "bg-red-50 text-red-500 border border-red-200"
                : effectiveUnlocked
                  ? "bg-gray-50 text-gray-500 border border-gray-100 hover:bg-red-50 hover:text-red-500 hover:border-red-200"
                  : "bg-gray-100 text-gray-500 border border-gray-200 cursor-default"
            )}
          >
            <ThumbsDown className={cn("w-3.5 h-3.5", userVote === "dislike" && "fill-red-400")} />
            {dislikes}
          </button>
          {!effectiveUnlocked && (
            <span className="text-[10px] text-gray-500 font-medium">Unlock to vote</span>
          )}
        </div>

        {/* Action Button */}
        {!effectiveUnlocked ? (
          <div className="mt-4">
            <button
              onClick={handleUnlock}
              disabled={loading}
              className={cn(
                "w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200",
                loading
                  ? "bg-gray-100 text-gray-400 cursor-wait"
                  : "bg-gradient-to-r from-violet-500 to-indigo-600 text-white hover:from-violet-600 hover:to-indigo-700 active:scale-[0.98] shadow-sm hover:shadow-md"
              )}
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Processing payment…</>
              ) : (
                <><Lock className="w-4 h-4" /> {connected ? `Unlock · ${post.priceLabel}` : "Connect Wallet to Unlock"}</>
              )}
            </button>
            {error && <p className="mt-2 text-xs text-red-500 text-center">{error}</p>}
          </div>
        ) : (
          <button
            onClick={handleExpand}
            className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-violet-50 text-violet-700 hover:bg-violet-100 transition-all"
          >
            <Unlock className="w-4 h-4" />
            {expanded ? "Collapse" : "View Full Review"}
          </button>
        )}
      </div>

      {/* Expanded Paid Content */}
      <AnimatePresence>
        {expanded && paidContent && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 border-t border-gray-50 space-y-5 pt-5">
              {/* Salary Range */}
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Salary Range (This Role)</h4>
                <div className="grid grid-cols-3 gap-3">
                  {(["min", "median", "max"] as const).map((key) => (
                    <div key={key} className="rounded-xl bg-gray-50 p-3 text-center">
                      <p className="text-[10px] text-gray-400 uppercase">{key}</p>
                      <p className={cn("text-lg font-bold", key === "median" ? "text-violet-600" : "text-gray-700")}>{paidContent.salaryRange[key]}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Detailed Review */}
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Detailed Review</h4>
                <div className="text-sm text-gray-600 leading-relaxed bg-gray-50 rounded-xl p-4 whitespace-pre-line">
                  {paidContent.detailedReview}
                </div>
              </div>

              {/* Interview Experience */}
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Interview Experience</h4>
                <p className="text-sm text-gray-600 leading-relaxed">{paidContent.interviewExperience}</p>
              </div>

              {/* Work-Life Balance */}
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Work-Life Balance</h4>
                <p className="text-sm text-gray-600 leading-relaxed">{paidContent.workLifeBalance}</p>
              </div>

              {/* Team Culture */}
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Team Culture</h4>
                <p className="text-sm text-gray-600 leading-relaxed">{paidContent.teamCulture}</p>
              </div>

              {/* Pros & Cons */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4">
                  <h4 className="text-xs font-semibold text-emerald-700 mb-2">Pros</h4>
                  <ul className="space-y-1">
                    {paidContent.pros.map((p, i) => (
                      <li key={i} className="text-xs text-emerald-700/80 flex items-start gap-1.5">
                        <span className="text-emerald-400">+</span>{p}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-xl border border-red-100 bg-red-50/50 p-4">
                  <h4 className="text-xs font-semibold text-red-700 mb-2">Cons</h4>
                  <ul className="space-y-1">
                    {paidContent.cons.map((c, i) => (
                      <li key={i} className="text-xs text-red-700/80 flex items-start gap-1.5">
                        <span className="text-red-400">−</span>{c}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Advice */}
              <div className="rounded-xl bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-100 p-4">
                <h4 className="text-xs font-semibold text-violet-700 mb-1">Advice for Candidates</h4>
                <p className="text-sm text-violet-600/80 leading-relaxed">{paidContent.advice}</p>
              </div>

              {/* Tx Link */}
              {txSignature && (
                <div className="flex items-center justify-center pt-2">
                  <a
                    href={`https://explorer.solana.com/tx/${txSignature}?cluster=devnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-violet-500 transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                    View transaction on Solana Explorer
                  </a>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
