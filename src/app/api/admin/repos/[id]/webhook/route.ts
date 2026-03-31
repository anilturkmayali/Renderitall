import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { setupWebhook, removeWebhook } from "@/lib/webhook-setup";

// POST: enable auto-sync (set up webhook)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const success = await setupWebhook(id);

  if (success) {
    return NextResponse.json({ success: true, message: "Auto-sync enabled. Changes pushed to GitHub will be imported automatically." });
  } else {
    return NextResponse.json({ success: false, message: "Could not set up auto-sync. You may not have admin access to this repository. Manual import still works." }, { status: 400 });
  }
}

// DELETE: disable auto-sync (remove webhook)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await removeWebhook(id);

  return NextResponse.json({ success: true });
}
