"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import type { UnlockRecord, UsageStats } from "@/types";

const STORAGE_KEY = "xpay-insider-unlocks";

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

function loadRecords(): UnlockRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function useUnlockStore(walletAddress: string | null) {
  const [allRecords, setAllRecords] = useState<UnlockRecord[]>([]);

  useEffect(() => {
    setAllRecords(loadRecords());
  }, []);

  // Only show records for the currently connected wallet
  const records = useMemo(
    () => (walletAddress ? allRecords.filter((r) => r.walletAddress === walletAddress) : []),
    [allRecords, walletAddress]
  );

  const unlockedIds = useMemo(() => new Set(records.map((r) => r.postId)), [records]);

  const addUnlock = useCallback(
    (record: UnlockRecord) => {
      const updated = [...allRecords, record];
      setAllRecords(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    },
    [allRecords]
  );

  const isUnlocked = useCallback(
    (postId: string) => unlockedIds.has(postId),
    [unlockedIds]
  );

  const stats: UsageStats = useMemo(() => {
    const today = getToday();
    const todayRecords = records.filter(
      (r) => new Date(r.timestamp).toISOString().split("T")[0] === today
    );
    return {
      totalUnlocks: records.length,
      totalSpent: records.reduce((sum, r) => sum + r.price, 0),
      todayUnlocks: todayRecords.length,
      todaySpent: todayRecords.reduce((sum, r) => sum + r.price, 0),
    };
  }, [records]);

  return { records, addUnlock, isUnlocked, stats };
}
