"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type FC,
  type ReactNode,
} from "react";
import { useWallet } from "@solana/wallet-adapter-react";

interface AuthState {
  /** 서명 완료된 인증 상태 */
  isAuthenticated: boolean;
  /** 서명 요청 중 */
  isSigning: boolean;
  /** 서명 실패/거부 시 에러 메시지 */
  authError: string | null;
}

const AuthContext = createContext<AuthState>({
  isAuthenticated: false,
  isSigning: false,
  authError: null,
});

export const useAuth = () => useContext(AuthContext);

/** 서명 메시지를 생성 (nonce로 timestamp 사용) */
function buildSignMessage(address: string): string {
  const now = new Date().toISOString();
  return [
    "Welcome to xPay Insider!",
    "",
    "Please sign this message to verify wallet ownership.",
    "This does not trigger a blockchain transaction or cost any fees.",
    "",
    `Wallet: ${address}`,
    `Timestamp: ${now}`,
  ].join("\n");
}

export const AuthProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const { publicKey, connected, signMessage, disconnect } = useWallet();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const signingRef = useRef(false);

  const requestSignature = useCallback(async () => {
    if (!publicKey || !signMessage || signingRef.current) return;

    signingRef.current = true;
    setIsSigning(true);
    setAuthError(null);

    try {
      const message = buildSignMessage(publicKey.toBase58());
      const encoded = new TextEncoder().encode(message);
      const signature = await signMessage(encoded);

      // 서명이 반환되면 인증 성공
      if (signature && signature.length > 0) {
        setIsAuthenticated(true);
      }
    } catch (err: any) {
      // 사용자가 서명을 거부하거나 에러 발생 시 연결 해제
      const msg =
        err?.message?.includes("rejected") || err?.message?.includes("denied")
          ? "서명이 거부되었습니다. 지갑을 다시 연결해주세요."
          : "서명 중 오류가 발생했습니다. 다시 시도해주세요.";
      setAuthError(msg);
      setIsAuthenticated(false);
      // 서명 거부 시 disconnect
      disconnect();
    } finally {
      setIsSigning(false);
      signingRef.current = false;
    }
  }, [publicKey, signMessage, disconnect]);

  useEffect(() => {
    if (connected && publicKey && signMessage && !isAuthenticated) {
      requestSignature();
    }

    if (!connected) {
      setIsAuthenticated(false);
      setAuthError(null);
    }
  }, [connected, publicKey, signMessage, isAuthenticated, requestSignature]);

  return (
    <AuthContext.Provider value={{ isAuthenticated, isSigning, authError }}>
      {children}
    </AuthContext.Provider>
  );
};
