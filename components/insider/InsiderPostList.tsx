"use client";

import type { InsiderPost, UnlockRecord } from "@/types";
import { InsiderPostCard } from "@/components/insider/InsiderPostCard";

interface Props {
  posts: InsiderPost[];
  isUnlocked: (postId: string) => boolean;
  onUnlock: (record: UnlockRecord) => void;
  getLikes: (postId: string, baseLikes: number) => number;
  getDislikes: (postId: string, baseDislikes: number) => number;
  getVote: (postId: string) => "like" | "dislike" | null;
  onVote: (postId: string, type: "like" | "dislike") => void;
}

export function InsiderPostList({ posts, isUnlocked, onUnlock, getLikes, getDislikes, getVote, onVote }: Props) {
  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-gray-400">No insider posts yet for this company.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400">
          {posts.length} insider {posts.length === 1 ? "post" : "posts"} · Unlock with Solana micropayment
        </p>
        <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-50 border border-emerald-100">
          <span className="text-[10px] font-semibold text-emerald-600">
            70% reward goes to insiders
          </span>
        </div>
      </div>
      {posts.map((post) => (
        <InsiderPostCard
          key={post.id}
          post={post}
          isUnlocked={isUnlocked(post.id)}
          onUnlock={onUnlock}
          likes={getLikes(post.id, post.likes)}
          dislikes={getDislikes(post.id, post.dislikes)}
          userVote={getVote(post.id)}
          onVote={onVote}
        />
      ))}
    </div>
  );
}
