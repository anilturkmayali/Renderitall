import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { syncRepository } from "@/lib/sync";

// Allow up to 60 seconds for sync (Vercel Pro) or 10s (free tier)
export const maxDuration = 60;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const result = await syncRepository(id);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error, ...result },
      { status: 500 }
    );
  }

  return NextResponse.json(result);
}
