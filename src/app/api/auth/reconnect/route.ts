import { signIn } from "@/lib/auth";

export async function GET() {
  return signIn("github", { redirectTo: "/admin/settings" });
}
