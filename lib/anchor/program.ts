import { Program, AnchorProvider } from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import type { AnchorWallet } from "@solana/wallet-adapter-react";
import idl from "./idl.json";

export const PROGRAM_ID = new PublicKey("4mq4iCgb1wh8t2AXEd2qP8Gw2qrNgy5Avinte9yNLQCc");

export function getProgram(connection: Connection, wallet: AnchorWallet) {
  const provider = new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new Program(idl as any, provider);
}

export function getReviewPDA(author: PublicKey, companyId: string): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("review"), author.toBuffer(), Buffer.from(companyId)],
    PROGRAM_ID
  );
  return pda;
}
