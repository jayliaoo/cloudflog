import { getDBClient } from "~/db";
import { users, sessions, images } from "~/db/schema";
import { eq, sql } from "drizzle-orm";
import { calculateMD5 } from "~/utils/crypto";

// Simple session-based authentication for single-user blog
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export interface User {
  id: number;
  name: string | null;
  email: string;
  image: string | null;
  role: string;
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
async function createSession(userId: number, env: Env): Promise<string> {
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
async function getSession(sessionToken: string, env: Env): Promise<Session | null> {
  let db
  try{
    db = getDBClient(env.D1);
  } catch (error) {
    console.error('Error getting D1 client:', error);
    return null;
  }
  const sessionData = await db
    .select({
      sessionToken: sessions.sessionToken,
      userId: sessions.userId,
      expires: sessions.expires,
      userName: users.name,
      userEmail: users.email,
      userImage: users.image,
      userRole: users.role
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
      image: session.userImage,
      role: session.userRole
    },
    expires: new Date(session.expires)
  };
}

// Delete session
export async function deleteSession(sessionToken: string, env: Env): Promise<void> {
  const db = getDBClient(env.D1);
  await db.delete(sessions).where(eq(sessions.sessionToken, sessionToken));
}

// Helper function to download and save GitHub avatar image
async function saveGitHubAvatar(avatarUrl: string, userId: number, env: Env): Promise<string | null> {
  try {
    // Validate input parameters
    if (!avatarUrl || !avatarUrl.startsWith('http')) {
      console.error('Invalid avatar URL provided:', avatarUrl);
      return null;
    }

    if (!userId || userId <= 0) {
      console.error('Invalid user ID provided:', userId);
      return null;
    }

    // Download the avatar image with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(avatarUrl, {
      headers: {
        'User-Agent': 'node',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error('Failed to download avatar:', response.status, response.statusText);
      return null;
    }

    // Get the image data
    const imageBuffer = await response.arrayBuffer();
    
    // Validate image size (max 5MB)
    if (imageBuffer.byteLength > 5 * 1024 * 1024) {
      console.error('Avatar image too large:', imageBuffer.byteLength, 'bytes');
      return null;
    }

    // Validate minimum image size (at least 1KB)
    if (imageBuffer.byteLength < 1024) {
      console.error('Avatar image too small:', imageBuffer.byteLength, 'bytes');
      return null;
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    
    // Validate content type
    if (!contentType.startsWith('image/')) {
      console.error('Invalid content type for avatar:', contentType);
      return null;
    }
    
    // Calculate MD5 hash for deduplication
    const md5Hash = await calculateMD5(imageBuffer);
    
    // Extract file extension from content type or URL
    let fileExtension = 'jpg';
    if (contentType.includes('png')) {
      fileExtension = 'png';
    } else if (contentType.includes('gif')) {
      fileExtension = 'gif';
    } else if (contentType.includes('webp')) {
      fileExtension = 'webp';
    } else if (contentType.includes('svg')) {
      fileExtension = 'svg';
    }
    
    // Generate object key
    const objectKey = `${md5Hash}.${fileExtension}`;
    
    let db;
    try {
      db = getDBClient(env.D1);
    } catch (dbError) {
      console.error('Failed to get database client:', dbError);
      return null;
    }
    
    // Check if image already exists (deduplication)
    try {
      const existingImage = await db
        .select()
        .from(images)
        .where(eq(images.md5, md5Hash))
        .limit(1);
      
      if (existingImage.length > 0) {
        // Image already exists, return the existing object key
        console.log('Avatar image already exists, using existing:', existingImage[0].objectKey);
        return `/api/images/${existingImage[0].objectKey}`;
      }
    } catch (dbError) {
      console.error('Error checking for existing image:', dbError);
      // Continue with saving new image
    }
    
    // Save new image to database
    try {
      await db.insert(images).values({
        filename: `github-avatar-${userId}.${fileExtension}`,
        objectKey,
        data: imageBuffer,
        md5: md5Hash,
        contentType,
        fileSize: imageBuffer.byteLength,
        uploadedBy: userId,
      });
      
      console.log('Successfully saved GitHub avatar:', objectKey);
      return `/api/images/${objectKey}`;
    } catch (dbError) {
      console.error('Error saving image to database:', dbError);
      return null;
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('Avatar download timed out');
    } else {
      console.error('Error saving GitHub avatar:', error);
    }
    return null;
  }
}

// Real GitHub OAuth implementation
export async function authenticateWithGitHub(code: string, env: Env): Promise<string | null> {
  try {
    // Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: env.GITHUB_CLIENT_ID,
        client_secret: env.GITHUB_CLIENT_SECRET,
        code: code,
        redirect_uri: `${env.DOMAIN}/auth/callback`,
      }),
    });

    const tokenData = await tokenResponse.json() as { access_token?: string; error?: string };
    if (tokenData.error) {
      console.error('GitHub token exchange error:', tokenData.error);
      return null;
    }

    const accessToken = tokenData.access_token;
    
    // Get user information from GitHub
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'node',
      },
    });
    if (!userResponse.ok) {
      console.error('GitHub user info fetch failed:', userResponse.status);
      console.error('GitHub user info response:', await userResponse.text());
      return null;
    }

    const githubUser = await userResponse.json() as { 
      id: number; 
      login: string; 
      name?: string; 
      email?: string; 
      avatar_url: string; 
    };
    // Get user email if not public
    let email = githubUser.email;
    if (!email) {
      const emailsResponse = await fetch('https://api.github.com/user/emails', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
          'User-Agent': 'node',
        },
      });

      if (emailsResponse.ok) {
        const emails = await emailsResponse.json() as Array<{ email: string; primary: boolean }>;
        const primaryEmail = emails.find((e) => e.primary);
        email = primaryEmail?.email || emails[0]?.email;
      }
    }

    if (!email) {
      console.error('No email found for GitHub user');
      return null;
    }

    const db = getDBClient(env.D1);
    
    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    let userId: number;

    if (existingUser.length > 0) {
      // Update existing user with latest GitHub info
      userId = existingUser[0].id;
      
      // Save GitHub avatar to database and get API endpoint
      const avatarImagePath = await saveGitHubAvatar(githubUser.avatar_url, userId, env);
      
      await db
        .update(users)
        .set({
          name: githubUser.name || githubUser.login,
          image: avatarImagePath || githubUser.avatar_url, // Fallback to original URL if saving fails
        })
        .where(eq(users.id, userId));
    } else {
      // Check if this is the first user (they will be the owner)
      const userCount = await db.select({ count: sql<number>`count(*)` }).from(users);
      const isFirstUser = userCount[0].count === 0;
      
      // Create new user - let auto-increment handle the ID
      const result = await db.insert(users).values({
        name: githubUser.name || githubUser.login,
        email: email,
        image: githubUser.avatar_url, // Temporarily use original URL
        role: isFirstUser ? 'owner' : 'reader'
      }).returning();
      userId = result[0].id;
      
      // Save GitHub avatar to database and update user with API endpoint
      const avatarImagePath = await saveGitHubAvatar(githubUser.avatar_url, userId, env);
      if (avatarImagePath) {
        await db
          .update(users)
          .set({
            image: avatarImagePath,
          })
          .where(eq(users.id, userId));
      }
    }

    return createSession(userId, env);
  } catch (error) {
    console.error('GitHub OAuth error:', error);
    return null;
  }
}

// Get current user from request
export async function getCurrentUser(request: Request, env: Env): Promise<User | null> {
  const cookieHeader = request.headers.get('Cookie');
  if (!cookieHeader) return null;
  
  const cookies = parseCookies(cookieHeader);
  const sessionToken = cookies['session'];
  
  const session = await getSession(sessionToken, env);
  return session?.user || null;
}

// Get the owner user (for blog branding)
export async function getOwnerUser(env: Env): Promise<User | null> {
  const db = getDBClient(env.D1);
  
  const ownerUsers = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      image: users.image,
      role: users.role
    })
    .from(users)
    .where(eq(users.role, 'owner'))
    .limit(1);
  
  return ownerUsers.length > 0 ? ownerUsers[0] : null;
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