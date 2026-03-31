import { prisma } from "@/lib/prisma";

export type Role = "OWNER" | "ADMIN" | "EDITOR" | "REVIEWER";

const ROLE_HIERARCHY: Record<Role, number> = {
  OWNER: 4,
  ADMIN: 3,
  EDITOR: 2,
  REVIEWER: 1,
};

export async function getUserRole(userId: string): Promise<Role | null> {
  const membership = await prisma.orgMember.findFirst({
    where: { userId },
    select: { role: true },
  });
  return (membership?.role as Role) || null;
}

export function hasPermission(userRole: Role | null, requiredRole: Role): boolean {
  if (!userRole) return false;
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

/**
 * Check if a role can perform a specific action.
 */
export function canPerform(role: Role | null, action: string): boolean {
  if (!role) return false;

  switch (action) {
    case "manage_team":
      return hasPermission(role, "ADMIN");
    case "delete_site":
      return hasPermission(role, "ADMIN");
    case "manage_repos":
      return hasPermission(role, "EDITOR");
    case "edit_content":
      return hasPermission(role, "EDITOR");
    case "edit_design":
      return hasPermission(role, "EDITOR");
    case "view_admin":
      return hasPermission(role, "REVIEWER");
    default:
      return false;
  }
}
