"use client";

import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useEffect, useState } from "react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { shortenAddress } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

export function Header() {
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();
  const { isAuthenticated, isSigning, authError } = useAuth();
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    if (!publicKey || !connected) {
      setBalance(null);
      return;
    }

    let cancelled = false;

    const fetchBalance = async () => {
      try {
        const bal = await connection.getBalance(publicKey);
        if (!cancelled) setBalance(bal / LAMPORTS_PER_SOL);
      } catch {
        if (!cancelled) setBalance(null);
      }
    };

    fetchBalance();
    const id = setInterval(fetchBalance, 10000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [publicKey, connected, connection]);

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-gray-100">
      <div className="w-full px-5 sm:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
            <span className="text-white text-sm font-bold">x</span>
          </div>
          <span className="text-lg font-bold tracking-tight text-gray-900">
            xPay <span className="text-violet-600">Insider</span>
          </span>
          <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-violet-50 text-violet-600 border border-violet-100">
            Devnet
          </span>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {isSigning && (
            <span className="text-xs font-medium text-amber-600 animate-pulse">
              서명 대기중...
            </span>
          )}
          {authError && (
            <span className="text-xs font-medium text-red-500">
              {authError}
            </span>
          )}
          {isAuthenticated && balance !== null && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-50 border border-gray-100">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-sm font-medium text-gray-700">
                {balance.toFixed(4)} SOL
              </span>
            </div>
          )}
          {isAuthenticated && publicKey && (
            <span className="hidden md:inline text-xs text-gray-400 font-mono">
              {shortenAddress(publicKey.toBase58())}
            </span>
          )}
          <WalletMultiButton
            style={{
              backgroundColor: isAuthenticated ? "#f3f4f6" : "#7c3aed",
              color: isAuthenticated ? "#374151" : "#fff",
              borderRadius: "9999px",
              fontSize: "14px",
              fontWeight: "600",
              height: "38px",
              padding: "0 18px",
              border: isAuthenticated ? "1px solid #e5e7eb" : "none",
              transition: "all 0.2s",
            }}
          />
        </div>
      </div>
    </header>
  );
}
