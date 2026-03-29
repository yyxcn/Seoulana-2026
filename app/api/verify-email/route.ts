import { NextRequest, NextResponse } from "next/server";

// In-memory store for demo (resets on server restart)
const verificationCodes = new Map<
  string,
  { code: string; expiresAt: number; verified: boolean }
>();

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// POST /api/verify-email — send verification code
export async function POST(req: NextRequest) {
  const { email, companyId } = await req.json();

  if (!email || !companyId) {
    return NextResponse.json({ error: "Missing email or companyId" }, { status: 400 });
  }

  const code = generateCode();
  const key = `${email}:${companyId}`;

  verificationCodes.set(key, {
    code,
    expiresAt: Date.now() + 5 * 60 * 1000, // 5 min
    verified: false,
  });

  // Demo mode: log code to server console and return it in response
  console.log(`[DEMO] Verification code for ${email}: ${code}`);

  return NextResponse.json({
    success: true,
    message: "Verification code sent",
    // Include code in response for demo purposes only
    _demo_code: code,
  });
}

// PUT /api/verify-email — verify the code
export async function PUT(req: NextRequest) {
  const { email, companyId, code } = await req.json();

  if (!email || !companyId || !code) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const key = `${email}:${companyId}`;
  const entry = verificationCodes.get(key);

  if (!entry) {
    return NextResponse.json({ error: "No verification requested" }, { status: 404 });
  }

  if (Date.now() > entry.expiresAt) {
    verificationCodes.delete(key);
    return NextResponse.json({ error: "Code expired" }, { status: 410 });
  }

  if (entry.code !== code) {
    return NextResponse.json({ error: "Invalid code" }, { status: 400 });
  }

  entry.verified = true;
  verificationCodes.set(key, entry);

  return NextResponse.json({ success: true, verified: true });
}
