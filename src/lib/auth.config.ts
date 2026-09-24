import type { NextAuthConfig } from "next-auth";

/**
 * Konfigurasi dasar yang aman untuk edge (middleware).
 * Tidak mengimpor Prisma atau bcrypt di sini.
 */
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  trustHost: true,
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = (user as { role?: string }).role;
        token.username = (user as { username?: string }).username;
        token.name = user.name ?? token.name;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "ADMIN" | "KASIR";
        session.user.username = token.username as string;
      }
      return session;
    },
  },
};
