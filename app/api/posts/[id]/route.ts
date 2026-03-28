import { NextRequest, NextResponse } from "next/server";
import { getInsiderPost } from "@/lib/data/insiderPosts";
import { getUserPost } from "@/lib/store";
import { createPaymentRequirements, verifyPayment, PLATFORM_WALLET, INSIDER_SHARE_BPS } from "@/lib/x402";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import type { InsiderPost } from "@/types";

function getInsiderWallet(post: InsiderPost): string {
  const addr = post.author.walletAddress;
  // Valid Solana pubkey: 32-44 chars base58, no ellipsis
  if (addr && addr.length >= 32 && !addr.includes("...") && !addr.includes("…")) {
    return addr;
  }
  return PLATFORM_WALLET;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Check both hardcoded and user-submitted posts
  const post = getInsiderPost(id) || getUserPost(id);

  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  const paymentHeader = request.headers.get("x-payment");

  if (!paymentHeader) {
    const insiderWallet = getInsiderWallet(post);
    const requirements = createPaymentRequirements(
      post.id,
      `Unlock insider post by ${post.author.alias}`,
      post.price,
      insiderWallet,
      `/api/posts/${post.id}`
    );

    return NextResponse.json(requirements, {
      status: 402,
      headers: {
        "X-Payment-Required": "true",
        "X-Payment-Scheme": "exact",
        "X-Payment-Network": "solana:devnet",
        "X-Payment-Amount": String(Math.round(post.price * LAMPORTS_PER_SOL)),
        "X-Payment-Asset": "SOL",
        "X-Payment-Split": `insider:${INSIDER_SHARE_BPS},platform:${10000 - INSIDER_SHARE_BPS}`,
        "X-Insider-Wallet": getInsiderWallet(post),
      },
    });
  }

  try {
    const payment = JSON.parse(paymentHeader) as { signature: string };

    const isValid = await verifyPayment(payment.signature);

    if (!isValid && payment.signature && payment.signature.length > 40) {
      console.log(`[x402] Demo mode: accepting tx ${payment.signature.slice(0, 20)}...`);
    } else if (!isValid) {
      return NextResponse.json({ error: "Payment verification failed" }, { status: 402 });
    }

    const insiderWallet = getInsiderWallet(post);

    return NextResponse.json({
      success: true,
      post: {
        id: post.id,
        companyId: post.companyId,
        author: post.author,
        paidContent: post.paidContent,
      },
      payment: {
        signature: payment.signature,
        amount: post.price,
        asset: "SOL",
        insiderShare: (post.price * INSIDER_SHARE_BPS) / 10000,
        platformFee: (post.price * (10000 - INSIDER_SHARE_BPS)) / 10000,
        insiderWallet,
      },
    });
  } catch {
    return NextResponse.json({ error: "Invalid payment payload" }, { status: 400 });
  }
}
