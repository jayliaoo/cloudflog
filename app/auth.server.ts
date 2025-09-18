import { getDBClient } from "~/db";
import { users, sessions } from "~/db/schema";
import { eq } from "drizzle-orm";

// Simple session-based authentication for single-user blog
const SESSION_SECRET = "your-secret-key-here";
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export interface User {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
}

export interface Session {
  user: User;
  expires: Date;
}

// Generate a simple session token
function generateSessionToken(): string {
  return crypto.randomUUID();
}

// Create a new session
export async function createSession(userId: string, env: Env): Promise<string> {
  const db = getDBClient(env.D1);
  const sessionToken = generateSessionToken();
  const expires = new Date(Date.now() + SESSION_DURATION);
  
  await db.insert(sessions).values({
    sessionToken,
    userId,
    expires: expires
  });
  
  return sessionToken;
}

// Get session from token
export async function getSession(sessionToken: string, env: Env): Promise<Session | null> {
  const db = getDBClient(env.D1);
  
  const sessionData = await db
    .select({
      sessionToken: sessions.sessionToken,
      userId: sessions.userId,
      expires: sessions.expires,
      userName: users.name,
      userEmail: users.email,
      userImage: users.image
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.sessionToken, sessionToken))
    .limit(1);
  
  if (sessionData.length === 0) {
    return null;
  }
  
  const session = sessionData[0];
  
  // Check if session is expired
  if (new Date(session.expires) < new Date()) {
    await deleteSession(sessionToken, env);
    return null;
  }
  
  return {
    user: {
      id: session.userId,
      name: session.userName,
      email: session.userEmail,
      image: session.userImage
    },
    expires: new Date(session.expires)
  };
}

// Delete session
export async function deleteSession(sessionToken: string, env: Env): Promise<void> {
  const db = getDBClient(env.D1);
  await db.delete(sessions).where(eq(sessions.sessionToken, sessionToken));
}

// GitHub OAuth simulation for single-user blog
export async function authenticateWithGitHub(code: string, env: Env): Promise<string | null> {
  const db = getDBClient(env.D1);
  
  // For single-user blog, we simulate GitHub authentication
  // In a real app, you'd exchange the code with GitHub for user info
  const existingUser = await db.select().from(users).limit(1);
  
  let userId: string;
  
  if (existingUser.length === 0) {
    // Create default user if none exists
    userId = crypto.randomUUID();
    await db.insert(users).values({
      id: userId,
      name: 'Admin',
      email: 'admin@example.com',
      emailVerified: new Date()
    });
  } else {
    userId = existingUser[0].id;
  }
  
  return createSession(userId, env);
}

// Get current user from request
export async function getCurrentUser(request: Request, env: Env): Promise<User | null> {
  const cookieHeader = request.headers.get('Cookie');
  if (!cookieHeader) return null;
  
  const cookies = parseCookies(cookieHeader);
  const sessionToken = cookies['next-auth.session-token'];
  
  if (!sessionToken) return null;
  
  const session = await getSession(sessionToken, env);
  return session?.user || null;
}

// Simple cookie parser
function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  cookieHeader.split(';').forEach(cookie => {
    const [name, ...rest] = cookie.trim().split('=');
    if (name && rest.length > 0) {
      cookies[name] = decodeURIComponent(rest.join('='));
    }
  });
  return cookies;
}