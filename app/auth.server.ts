import { DrizzleAdapter } from "@auth/drizzle-adapter";
import NextAuth from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import { getDBClient } from "~/db";
import { accounts, sessions, users, verificationTokens } from "~/db/schema";

const getNextAuth = (env: Env) => {
  const db = getDBClient(env.D1);
  
  return NextAuth({
    adapter: DrizzleAdapter(db, {
      usersTable: users,
      accountsTable: accounts,
      sessionsTable: sessions,
      verificationTokensTable: verificationTokens,
    }),
    providers: [
      GitHubProvider({
        clientId: env.GITHUB_CLIENT_ID,
        clientSecret: env.GITHUB_CLIENT_SECRET,
      }),
    ],
    callbacks: {
      async session({ session, user }) {
        if (session.user) {
          session.user.id = user.id;
        }
        return session;
      },
      async jwt({ token, account, user }) {
        if (user) {
          token.id = user.id;
        }
        return token;
      },
    },
    pages: {
      signIn: '/auth/signin',
      error: '/auth/error',
    },
    secret: env.NEXTAUTH_SECRET || "your-secret-key-here",
    trustHost: true,
  });
};

export function getAuth(env: Env) {
  return getNextAuth(env);
}

export async function getSession(req: Request, env: Env) {
  const nextAuth = getNextAuth(env);
  
  // Create a mock request to get the session
  const url = new URL(req.url);
  const sessionUrl = new URL("/api/auth/session", url.origin);
  
  // Create a request with NextAuth-compatible structure
  const sessionReq = new Request(sessionUrl.toString(), {
    headers: req.headers,
    method: "GET",
  }) as any;
  
  // Add NextAuth-specific properties
  sessionReq.query = { nextauth: ["session"] };
  
  try {
    const response = await nextAuth(sessionReq);
    
    if (response.ok && response.headers.get('content-type')?.includes('application/json')) {
      const session = await response.json();
      return session;
    }
  } catch (error) {
    console.error("Error getting session:", error);
  }
  
  return null;
}

export type Auth = ReturnType<typeof getNextAuth>;