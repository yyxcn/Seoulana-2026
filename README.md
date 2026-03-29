# xPay Insider

> **Unlock insider reviews from Big Tech employees with Solana micropayments — 70% goes directly to the insider's wallet.**

A Blind-style professional community where insiders at NVIDIA, Google, Meta, Apple, and more share salary data, interview experiences, and honest reviews. Readers unlock content via the x402 protocol + Solana micropayments, and **70% of every payment is automatically routed to the insider** in a single atomic transaction. Review registration is recorded **on-chain** via an Anchor smart contract.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.example .env.local
# Edit .env.local → set NEXT_PUBLIC_PAYMENT_RECEIVER to your Phantom public key

# 3. Run dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and connect your Phantom wallet (Devnet).

**Requirements:**
- Node.js 18+
- Phantom wallet set to **Devnet**
- Devnet SOL from [faucet.solana.com](https://faucet.solana.com/)

**Costs per action:**
| Action | Cost |
|---|---|
| Register a review (on-chain) | ~0.002 SOL (PDA rent) |
| Unlock a review (x402 payment) | 0.003–0.01 SOL (70/30 split) |

## Why Solana?

On Ethereum, a $0.40 micropayment costs $2–5 in gas. On Visa/Stripe, the minimum fee is $0.30. On Solana: **0.003 SOL (~$0.40), confirmed in ~400ms, with split payment to two wallets in one transaction.**

| | Traditional (Stripe) | x402 + Solana |
|---|---|---|
| Minimum payment | $0.50+ | No limit |
| Fee per tx | 2.9% + $0.30 | ~$0.00025 (fixed) |
| Confirmation | 2–5s | ~400ms |
| Creator payout | T+30 days settlement | Instant, same transaction |
| Setup | Account, KYC, API integration | Connect wallet |

## Key Features

### x402 Split Payment (70/30)
Each unlock creates **one Solana transaction with two transfers**:
- **70% → Insider's wallet** (direct transfer)
- **30% → Platform wallet** (fee)

No escrow, no settlement delay. The insider receives their share the instant a reader pays.

### On-Chain Review Registration
- Insider submits a review → **Phantom signs an on-chain transaction**
- Anchor program (`xpay_insider`) stores metadata in a PDA account:
  - Author pubkey, company ID, role, price, SHA-256 content hash, timestamp
- Full review text stored off-chain (server-side) — hash ensures integrity
- PDA seeds `["review", author, company_id]` prevent duplicate reviews
- Registration costs ~0.002 SOL (account rent)
- Success screen links to **Solana Explorer**

### Email Verification (Insider Identity)
Before submitting a review, insiders must verify their company email (e.g. `you@nvidia.com`).
1. Select a company → enter your work email
2. Receive a 6-digit verification code (demo mode shows the code on screen)
3. Enter the code → verified badge appears on your review

This proves the reviewer is an actual employee. In production, codes would be sent via email (SendGrid/Resend). For the demo, the code is displayed directly in the UI.

### Wallet = Identity
- Connect Wallet = Login, Disconnect = Logout
- All data (unlocks, votes) scoped per wallet address
- Reconnect → previous purchases restored

### Free + Paid Content
- **Free**: Company overview, hiring bar, salary tables by level
- **Paid (x402)**: Detailed reviews, interview experiences, WLB, culture, salary ranges, pros/cons, advice

### Like / Dislike
- Counts visible to everyone
- Only purchasers can vote — non-purchasers see "Unlock to vote"

### Insider Price Competition
- Insiders set their own unlock price (0.001–0.01 SOL)
- Higher quality → higher price, or lower price to attract readers
- Market-driven pricing for insider knowledge

## On-Chain vs Off-Chain

| Data | Storage | Reason |
|---|---|---|
| Review metadata + hash | **On-chain** (Anchor PDA) | Tamper-proof, verifiable |
| Full review text | **Off-chain** (server) | Cost efficiency |
| Payments (unlocks) | **On-chain** (SystemProgram.transfer) | Atomic 70/30 split |
| Likes / Dislikes | **Off-chain** (localStorage) | No gas per vote |

## x402 Protocol Flow

```
Client                              Server
  │                                    │
  │  GET /api/posts/{id}               │
  │───────────────────────────────────>│
  │                                    │
  │  402 Payment Required              │
  │  { amount, insiderWallet,          │
  │    splitRatio: 70/30 }             │
  │<───────────────────────────────────│
  │                                    │
  │  Split Payment Tx:                 │
  │    Transfer 70% → insider wallet   │
  │    Transfer 30% → platform wallet  │
  │  Phantom sign → Devnet confirm     │
  │                                    │
  │  GET /api/posts/{id}               │
  │  X-PAYMENT: { signature }          │
  │───────────────────────────────────>│
  │                                    │
  │  Verify on-chain → 200 OK          │
  │  { paidContent }                   │
  │<───────────────────────────────────│
```

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, TypeScript, Tailwind CSS v4, Framer Motion |
| Wallet | @solana/wallet-adapter-react (Phantom, Solflare) |
| Payments | @solana/web3.js v1, x402 Protocol (HTTP 402) |
| On-chain program | Anchor Framework, @coral-xyz/anchor |
| Network | Solana Devnet |

**Program ID**: `4mq4iCgb1wh8t2AXEd2qP8Gw2qrNgy5Avinte9yNLQCc`

## Project Structure

```
xpay-insider/
├── app/
│   ├── api/
│   │   ├── insider/route.ts              # Insider review registration API
│   │   ├── posts/[id]/route.ts           # x402 protected content endpoint
│   │   └── verify-email/route.ts         # Email verification (send/verify code)
│   └── page.tsx                          # Main app shell
├── components/
│   ├── company/CompanyProfile.tsx         # Company panel (3 tabs)
│   ├── insider/
│   │   ├── InsiderEditor.tsx             # Email verify → on-chain review submission
│   │   ├── InsiderPostCard.tsx           # x402 payment + like/dislike
│   │   └── InsiderPostList.tsx           # Post list wrapper
│   ├── layout/Sidebar.tsx                # Company sidebar with post counts
│   ├── Header.tsx                        # Logo + wallet + balance
│   ├── UsageDashboard.tsx                # Usage stats per wallet
│   └── WalletProvider.tsx                # Solana wallet context
├── hooks/
│   ├── useUnlockStore.ts                 # Unlock state per wallet
│   └── useVoteStore.ts                   # Vote state per wallet
├── lib/
│   ├── anchor/
│   │   ├── idl.json                      # Anchor program IDL
│   │   └── program.ts                    # Program init + PDA helper
│   ├── data/
│   │   ├── companies.ts                  # 10 companies (free data)
│   │   └── insiderPosts.ts              # 30 demo insider reviews
│   ├── store.ts                          # Server-side review store
│   └── x402.ts                           # x402 + split payment logic
├── anchor/                               # Anchor program source
│   ├── programs/xpay_insider/src/lib.rs  # On-chain register_review
│   └── Anchor.toml                       # Anchor config (devnet)
└── types/index.ts
```

## License

MIT — Built for Solana Hackathon
