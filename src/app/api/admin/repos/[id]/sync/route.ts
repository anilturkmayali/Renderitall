import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { syncRepository } from "@/lib/sync";

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

  // Run sync and return result — the function has up to 60s
  // If it times out, the auto-reset mechanism will catch it
  try {
    const result = await syncRepository(id);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Sync failed" },
      { status: 500 }
    );
  }
}
