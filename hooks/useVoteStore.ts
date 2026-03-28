"use client";

import { useState, useCallback, useEffect } from "react";

const VOTE_KEY = "xpay-insider-votes";

type VoteType = "like" | "dislike";
// Stored as { "walletAddress:postId": "like" | "dislike" }
type VoteMap = Record<string, VoteType>;

function loadVotes(): VoteMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(VOTE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function voteKey(wallet: string, postId: string) {
  return `${wallet}:${postId}`;
}

export function useVoteStore(walletAddress: string | null) {
  const [votes, setVotes] = useState<VoteMap>({});

  useEffect(() => {
    setVotes(loadVotes());
  }, []);

  const vote = useCallback(
    (postId: string, type: VoteType) => {
      if (!walletAddress) return;
      setVotes((prev) => {
        const updated = { ...prev };
        const key = voteKey(walletAddress, postId);
        if (updated[key] === type) {
          delete updated[key];
        } else {
          updated[key] = type;
        }
        localStorage.setItem(VOTE_KEY, JSON.stringify(updated));
        return updated;
      });
    },
    [walletAddress]
  );

  const getVote = useCallback(
    (postId: string): VoteType | null => {
      if (!walletAddress) return null;
      return votes[voteKey(walletAddress, postId)] || null;
    },
    [votes, walletAddress]
  );

  const getLikes = useCallback(
    (postId: string, baseLikes: number): number => {
      if (!walletAddress) return baseLikes;
      return baseLikes + (votes[voteKey(walletAddress, postId)] === "like" ? 1 : 0);
    },
    [votes, walletAddress]
  );

  const getDislikes = useCallback(
    (postId: string, baseDislikes: number): number => {
      if (!walletAddress) return baseDislikes;
      return baseDislikes + (votes[voteKey(walletAddress, postId)] === "dislike" ? 1 : 0);
    },
    [votes, walletAddress]
  );

  return { vote, getVote, getLikes, getDislikes };
}
