import type { InsiderPost } from "@/types";

// In-memory store for user-submitted insider posts (demo — resets on server restart)
let userPosts: InsiderPost[] = [];

export function addUserPost(post: InsiderPost) {
  userPosts.push(post);
}

export function getUserPosts(): InsiderPost[] {
  return userPosts;
}

export function getUserPostsByCompany(companyId: string): InsiderPost[] {
  return userPosts.filter((p) => p.companyId === companyId);
}

export function getUserPost(postId: string): InsiderPost | undefined {
  return userPosts.find((p) => p.id === postId);
}
