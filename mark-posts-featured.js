// Script to mark the first 2 posts as featured
import { getDBClient } from './app/db/index.js';
import { posts } from './app/db/schema.js';
import { eq } from 'drizzle-orm';

async function markPostsAsFeatured() {
  try {
    // This would normally use the Cloudflare env, but for local development
    // we'll need to use a different approach
    console.log('This script needs to be run in the context of the application');
    console.log('Please use the admin panel to mark posts as featured instead.');
    console.log('Go to /admin and click the "☆ Feature" button on any post.');
  } catch (error) {
    console.error('Error:', error);
  }
}

markPostsAsFeatured();