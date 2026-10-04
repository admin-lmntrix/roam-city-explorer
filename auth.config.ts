import type { NextAuthConfig } from "next-auth";

// Edge-safe part of the Auth.js config (no database / bcrypt imports) so the
// middleware can use it. The Credentials provider lives in auth.ts.
export default {
  providers: [],
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  trustHost: true,
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role ?? "USER";
      }
      return token;
    },
    session({ session, token }) {
      if (token.id) session.user.id = token.id;
      session.user.role = token.role ?? "USER";
      return session;
    }
  }
} satisfies NextAuthConfig;
