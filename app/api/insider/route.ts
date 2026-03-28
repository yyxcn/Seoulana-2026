import { NextRequest, NextResponse } from "next/server";
import { addUserPost, getUserPosts } from "@/lib/store";
import type { InsiderPost } from "@/types";
import { companies } from "@/lib/data/companies";

const AVATAR_COLORS = [
  "bg-violet-500", "bg-indigo-500", "bg-blue-500", "bg-cyan-500",
  "bg-teal-500", "bg-emerald-500", "bg-green-500", "bg-amber-500",
  "bg-orange-500", "bg-rose-500", "bg-purple-500", "bg-fuchsia-500",
];

export async function POST(request: NextRequest) {
  const body = await request.json();

  if (!body.walletAddress || !body.companyId || !body.role || !body.review) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const company = companies.find((c) => c.id === body.companyId);
  if (!company) {
    return NextResponse.json({ error: "Invalid company" }, { status: 400 });
  }

  const aliasNum = Math.floor(Math.random() * 9000 + 1000);
  const color = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
  const postId = `user-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  const post: InsiderPost = {
    id: postId,
    companyId: body.companyId,
    author: {
      id: `insider-${body.walletAddress.slice(0, 8)}`,
      walletAddress: body.walletAddress,
      alias: `Verified Insider #${aliasNum}`,
      companyId: body.companyId,
      role: body.role,
      tenure: body.tenure || "N/A",
      avatarColor: color,
    },
    price: 0.0003,
    priceLabel: "0.0003 SOL",
    createdAt: new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" }),
    teaser: body.review.slice(0, 140) + (body.review.length > 140 ? "..." : ""),
    likes: 0,
    dislikes: 0,
    paidContent: {
      salaryRange: {
        min: body.salaryMin || "N/A",
        max: body.salaryMax || "N/A",
        median: "N/A",
      },
      detailedReview: body.review,
      interviewExperience: body.interview || "Not provided.",
      workLifeBalance: body.wlb || "Not provided.",
      teamCulture: body.culture || "Not provided.",
      pros: body.pros
        ? body.pros.split("\n").filter((s: string) => s.trim())
        : ["Not provided"],
      cons: body.cons
        ? body.cons.split("\n").filter((s: string) => s.trim())
        : ["Not provided"],
      advice: body.advice || "Not provided.",
    },
  };

  addUserPost(post);

  return NextResponse.json({
    success: true,
    post: { id: post.id, companyId: post.companyId, walletAddress: body.walletAddress },
  });
}

export async function GET() {
  return NextResponse.json({ posts: getUserPosts() });
}
