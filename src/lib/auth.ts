import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "read:user user:email repo read:org",
        },
      },
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
  events: {
    async signIn({ user }) {
      // Auto-add new users to the existing organization as Editors
      if (!user.id) return;

      try {
        // Check if user is already in any org
        const existingMembership = await prisma.orgMember.findFirst({
          where: { userId: user.id },
        });

        if (!existingMembership) {
          // Find the first (default) organization
          const org = await prisma.organisation.findFirst({
            orderBy: { createdAt: "asc" },
          });

          if (org) {
            // Add as Editor
            await prisma.orgMember.create({
              data: {
                orgId: org.id,
                userId: user.id,
                role: "EDITOR",
              },
            });
          }
        }
      } catch {
        // Non-critical — don't block sign-in
      }
    },
  },
  pages: {
    signIn: "/login",
  },
  trustHost: true,
});
