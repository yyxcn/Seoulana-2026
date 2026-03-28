import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";

export const SOLANA_NETWORK = "devnet";
export const SOLANA_RPC = "https://api.devnet.solana.com";
export const X402_VERSION = 1;
export const INSIDER_SHARE_BPS = 7000; // 70% to insider, 30% to platform

export const PLATFORM_WALLET = process.env.NEXT_PUBLIC_PAYMENT_RECEIVER || "";

export interface PaymentRequirements {
  x402Version: number;
  scheme: "exact";
  network: string;
  asset: "SOL";
  amount: number;
  payTo: string;
  insiderWallet: string;
  splitRatio: { insiderBps: number; platformBps: number };
  resource: string;
  description: string;
  postId: string;
}

export function createPaymentRequirements(
  postId: string,
  description: string,
  priceSOL: number,
  insiderWallet: string,
  resource: string
): PaymentRequirements {
  return {
    x402Version: X402_VERSION,
    scheme: "exact",
    network: "solana:8E3JLCu3fedFPcMkWQwVbnkwNcknPias",
    asset: "SOL",
    amount: Math.round(priceSOL * LAMPORTS_PER_SOL),
    payTo: PLATFORM_WALLET,
    insiderWallet,
    splitRatio: { insiderBps: INSIDER_SHARE_BPS, platformBps: 10000 - INSIDER_SHARE_BPS },
    resource,
    description,
    postId,
  };
}

/**
 * Creates a split payment transaction:
 * - 70% goes to the insider (content creator reward)
 * - 30% goes to the platform
 */
export async function createSplitPaymentTransaction(
  payerPublicKey: PublicKey,
  platformWallet: string,
  insiderWallet: string,
  totalLamports: number
): Promise<Transaction> {
  const connection = new Connection(SOLANA_RPC, "confirmed");

  const insiderAmount = Math.floor((totalLamports * INSIDER_SHARE_BPS) / 10000);
  const platformAmount = totalLamports - insiderAmount;

  const transaction = new Transaction();

  // Transfer 70% to insider
  transaction.add(
    SystemProgram.transfer({
      fromPubkey: payerPublicKey,
      toPubkey: new PublicKey(insiderWallet),
      lamports: insiderAmount,
    })
  );

  // Transfer 30% to platform
  transaction.add(
    SystemProgram.transfer({
      fromPubkey: payerPublicKey,
      toPubkey: new PublicKey(platformWallet),
      lamports: platformAmount,
    })
  );

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
  transaction.recentBlockhash = blockhash;
  transaction.lastValidBlockHeight = lastValidBlockHeight;
  transaction.feePayer = payerPublicKey;

  return transaction;
}

export async function verifyPayment(signature: string): Promise<boolean> {
  try {
    const connection = new Connection(SOLANA_RPC, "confirmed");
    const tx = await connection.getTransaction(signature, {
      commitment: "confirmed",
      maxSupportedTransactionVersion: 0,
    });
    if (!tx || tx.meta?.err) return false;
    return true;
  } catch {
    return false;
  }
}
