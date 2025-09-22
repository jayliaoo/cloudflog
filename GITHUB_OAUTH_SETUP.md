# GitHub OAuth Setup Guide

To use real GitHub OAuth authentication with your blog, follow these steps:

## 1. Create a GitHub OAuth App

1. Go to your GitHub Settings
2. Navigate to Developer settings → OAuth Apps
3. Click "New OAuth App"
4. Fill in the following details:
   - **Application name**: Your Blog Name (e.g., "My Personal Blog")
   - **Homepage URL**: `http://localhost:5173` (for local development)
   - **Authorization callback URL**: `http://localhost:5173/auth/callback`
   - **Application description**: Optional description

## 2. Get Your Credentials

After creating the app, you'll receive:
- **Client ID**: Copy this value
- **Client Secret**: Generate and copy this value (keep it secure!)

## 3. Update Environment Variables

You need to update your environment variables in Cloudflare:

1. Go to your Cloudflare dashboard
2. Navigate to your Workers & Pages project
3. Go to Settings → Variables
4. Update these variables:
   - `GITHUB_CLIENT_ID`: Your GitHub app's Client ID
   - `GITHUB_CLIENT_SECRET`: Your GitHub app's Client Secret

## 4. Test the Authentication

1. Visit `http://localhost:5173/auth/signin`
2. Click "Sign in with GitHub"
3. Authorize your GitHub app
4. You should be redirected to the admin panel

## 5. Production Setup

For production deployment:
1. Update the Homepage URL to your actual domain
2. Update the Authorization callback URL to `https://yourdomain.com/auth/callback`

## Troubleshooting

- **Invalid Client ID**: Double-check your GitHub app credentials
- **Redirect URI mismatch**: Ensure the callback URL matches exactly
- **No email access**: Make sure your GitHub account has a public email or the app requests email permissions

## Security Notes

- Never commit your Client Secret to code
- Use environment variables for all sensitive data
- Consider implementing rate limiting for production use
- Review GitHub's OAuth security best practices