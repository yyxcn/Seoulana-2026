# xPay Insider

> **Unlock insider reviews from Big Tech employees with Solana micropayments — 70% goes directly to the insider's wallet.**

A Blind-style professional community where verified insiders at NVIDIA, Google, Meta, Apple, and more share salary data, interview experiences, and honest reviews. Readers unlock content via the x402 protocol + Solana micropayments, and **70% of every payment is automatically routed to the insider** in a single atomic transaction.

## Why Solana?

**"This UX is only possible on Solana."**

On Ethereum, a $0.04 micropayment costs $2-5 in gas. On Visa/Stripe, the minimum fee is $0.30. On Solana: **0.0003 SOL (~$0.04), confirmed in ~400ms, with split payment to two wallets in one transaction.**

| | Traditional (Stripe) | x402 + Solana |
|---|---|---|
| Minimum payment | $0.50+ | No limit |
| Fee per tx | 2.9% + $0.30 | ~$0.00025 (fixed) |
| Confirmation | 2-5s | ~400ms |
| Creator payout | T+30 days settlement | Instant, same transaction |
| Setup | Account, KYC, API integration | Connect wallet |

## Key Features

### x402 Split Payment (70/30 Insider Reward)
Each unlock creates **one Solana transaction with two transfers**:
- **70% → Insider's wallet** (content creator, direct transfer)
- **30% → Platform wallet** (fee)

No escrow, no settlement delay. The insider receives their share the instant a reader pays.

### Wallet = Identity
- Connect Wallet = Login, Disconnect = Logout
- Unlock history is scoped per wallet address
- Switch wallets → see that wallet's purchases only
- Reconnect → previous purchases restored

### Free + Paid Content
- **Free**: Company overview, hiring bar, salary tables (by level)
- **Paid (x402)**: Detailed insider reviews, interview experiences, WLB, culture, salary ranges, pros/cons, advice

### Like / Dislike
- Vote counts visible to everyone (including non-purchasers) with clear styling
- Only users who unlocked a review can vote — non-purchasers see disabled buttons with "Unlock to vote"
- Votes scoped per wallet

### Post Review (Insider Registration)
- "Post Review" button → requires wallet connection
- Connected wallet becomes the insider's reward address
- When someone unlocks the review → 70% flows to that wallet
- Sidebar post count (#N badge) updates dynamically when new reviews are added

## x402 Protocol Flow

```
Client                              Server
  │                                    │
  │  GET /api/posts/{id}               │
  │───────────────────────────────────>│
  │                                    │
  │  402 Payment Required              │
  │  { amount, payTo, insiderWallet,   │
  │    splitRatio: 70/30 }             │
  │<───────────────────────────────────│
  │                                    │
  │  Create Split Payment Tx:          │
  │    Transfer 70% → insider wallet   │
  │    Transfer 30% → platform wallet  │
  │  Sign with Phantom → Send to       │
  │  Solana Devnet → Confirm           │
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

- **Next.js 16** (App Router + Turbopack)
- **TypeScript**
- **Tailwind CSS v4** + **Framer Motion**
- **@solana/wallet-adapter-react** (Phantom, Solflare)
- **@solana/web3.js v1** (Split Payment via SystemProgram.transfer)
- **x402 Protocol** (HTTP 402 Payment Required)
- **Solana Devnet**

## Getting Started

```bash
npm install

# Set your Phantom wallet PUBLIC KEY (not private key)
cp .env.example .env.local
# Edit .env.local: NEXT_PUBLIC_PAYMENT_RECEIVER=YourPhantomPublicKey

npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

**Prerequisites:**
- Phantom wallet set to **Devnet**
- Devnet SOL from [faucet.solana.com](https://faucet.solana.com/)

## Project Structure

```
xpay-insider/
├── app/
│   ├── api/
│   │   ├── insider/route.ts            # POST: register insider review
│   │   └── posts/[id]/route.ts         # GET: x402 protected endpoint
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                        # Main app shell
├── components/
│   ├── company/CompanyProfile.tsx       # Company panel (3 tabs)
│   ├── insider/
│   │   ├── InsiderEditor.tsx           # Review submission modal
│   │   ├── InsiderPostCard.tsx         # x402 payment + like/dislike
│   │   └── InsiderPostList.tsx         # Post list wrapper
│   ├── layout/Sidebar.tsx              # Company sidebar
│   ├── Header.tsx                      # Logo + wallet + balance
│   ├── UsageDashboard.tsx              # Usage stats (per wallet)
│   └── WalletProvider.tsx              # Solana wallet context
├── hooks/
│   ├── useUnlockStore.ts              # Unlock state (per wallet)
│   └── useVoteStore.ts                # Like/dislike (per wallet)
├── lib/
│   ├── data/
│   │   ├── companies.ts               # 10 companies (free data)
│   │   └── insiderPosts.ts            # 30 insider reviews (3/company)
│   ├── store.ts                        # Server-side insider post store
│   ├── utils.ts
│   └── x402.ts                         # x402 + split payment logic
├── types/index.ts
└── Explanation.md                      # Detailed explanation (Korean)
```

## Demo Script

**Opening (10s)**
> "xPay Insider is a Blind-style community where you unlock insider reviews — salary data, interview tips, honest experiences — with Solana micropayments. 70% of every payment goes directly to the insider."

**Wallet Connect (10s)**
- Connect Phantom → balance shown in header
- "Your wallet is your identity. No email, no password."

**Unlock Demo (25s)**
- Go to NVIDIA → Insider Posts tab
- Click "Unlock · 0.0003 SOL" → Phantom approval
- Content expands: salary range, review, interview, WLB, pros/cons
- Click 👍 (only purchasers can vote)
- Show Solana Explorer link → two System Program transfers (70/30 split)

**Key Message (10s)**
> "0.0003 SOL — about 4 cents — unlocks in under 400ms, and 70% goes straight to the insider's wallet. No escrow, no settlement. This is only possible on Solana."

**Close (5s)**
- Show usage dashboard
- Disconnect wallet → unlocked content disappears → "Wallet = access"

## License

MIT — Built for Solana Hackathon
