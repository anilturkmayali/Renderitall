import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const checks: Record<string, string> = {};

  checks.GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID ? `set (${process.env.GITHUB_CLIENT_ID.substring(0, 8)}...)` : "MISSING";
  checks.GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET ? `set (length: ${process.env.GITHUB_CLIENT_SECRET.length})` : "MISSING";
  checks.NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET ? "set" : "MISSING";
  checks.AUTH_SECRET = process.env.AUTH_SECRET ? "set" : "MISSING";
  checks.AUTH_TRUST_HOST = process.env.AUTH_TRUST_HOST || "not set";
  checks.NEXTAUTH_URL = process.env.NEXTAUTH_URL || "not set";
  checks.AUTH_URL = process.env.AUTH_URL || "not set";
  checks.NODE_ENV = process.env.NODE_ENV || "not set";

  // Check DB
  try {
    const count = await prisma.user.count();
    checks.DB_CONNECTION = `OK (${count} users)`;
  } catch (err: any) {
    checks.DB_CONNECTION = `FAILED: ${err.message}`;
  }

  // Try to initialize auth to catch the real error
  try {
    const { auth } = await import("@/lib/auth");
    const session = await auth();
    checks.AUTH_INIT = `OK (session: ${session ? "exists" : "null"})`;
  } catch (err: any) {
    checks.AUTH_INIT = `FAILED: ${err.message}`;
  }

  return NextResponse.json(checks);
}
