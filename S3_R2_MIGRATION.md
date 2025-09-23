# S3 R2 Migration Guide

This guide explains how to migrate from Cloudflare Workers R2 binding to S3-compatible API for R2 access.

## Overview

We've migrated from using the native R2 binding (`env.R2.put()` / `env.R2.get()`) to using the S3-compatible API. This provides more flexibility and compatibility with standard S3 tools and libraries.

## Configuration Changes

### Environment Variables

You need to set the following environment variables in your Cloudflare Workers dashboard:

1. **R2_ACCESS_KEY_ID** - Your R2 access key ID
2. **R2_SECRET_ACCESS_KEY** - Your R2 secret access key
3. **R2_ENDPOINT** - Your R2 endpoint (optional, defaults to `https://<account-id>.r2.cloudflarestorage.com`)
4. **R2_REGION** - R2 region (optional, defaults to `auto`)
5. **R2_BUCKET_NAME** - Your R2 bucket name (optional, defaults to `blog-images`)

### Getting R2 S3 Credentials

1. Go to your Cloudflare dashboard
2. Navigate to R2 → Manage → Settings
3. Click on "Create API Token" or "Manage API Tokens"
4. Create a token with the following permissions:
   - Object Read & Write
   - Object Delete (if you want to implement delete functionality)
5. Copy the Access Key ID and Secret Access Key
6. Set these as environment variables in your Workers project

### Wrangler Configuration

The `wrangler.jsonc` file has been updated to include S3 configuration variables:

```json
"vars": {
  "AUTH_URL": "https://blog.jayliao.workers.dev",
  "IMAGE_BASE_URL": "https://pub-472ed6155ec7452a9847ea0870702ffa.r2.dev/",
  "R2_ENDPOINT": "https://<account-id>.r2.cloudflarestorage.com",
  "R2_REGION": "auto",
  "R2_BUCKET_NAME": "blog-images"
}
```

**Note**: Replace `<account-id>` with your actual Cloudflare account ID.

### Removed Configuration

The R2 bucket binding has been removed from `wrangler.jsonc`:

```json
// REMOVED:
"r2_buckets": [
  {
    "binding": "R2",
    "bucket_name": "blog-images"
  }
]
```

## Code Changes

### New S3 Client Utility

A new utility file `app/utils/s3-client.ts` has been created to handle S3 operations:

```typescript
import { createS3Client, uploadToS3, getFromS3 } from "~/utils/s3-client";
```

### Updated API Routes

The image upload and retrieval endpoints in `app/routes/api.images.ts` now use the S3 client instead of the R2 binding.

### Environment Type Definitions

New type definitions have been added in `app/types/env.d.ts` to support the S3 configuration.

## Benefits of S3 API

1. **Standard S3 Compatibility**: Works with any S3-compatible tool or library
2. **Better Error Handling**: More detailed error messages and status codes
3. **Flexibility**: Can easily switch to other S3-compatible storage providers
4. **Tooling**: Can use standard AWS CLI and SDK tools
5. **Performance**: Often better performance for large files

## Migration Steps

1. **Set up S3 credentials** in your Cloudflare R2 dashboard
2. **Update environment variables** in your Workers project
3. **Deploy the updated code** using `npm run deploy`
4. **Test image upload and retrieval** functionality
5. **Verify existing images** are still accessible (they should be, as the underlying storage is the same)

## Rollback Plan

If you need to rollback to the R2 binding:

1. Restore the R2 bucket binding in `wrangler.jsonc`
2. Revert the code changes in `app/routes/api.images.ts`
3. Remove the S3 environment variables
4. Redeploy

## Troubleshooting

### Common Issues

1. **Access Denied**: Check your R2 API token permissions
2. **Endpoint Not Found**: Verify your account ID in the endpoint URL
3. **Invalid Credentials**: Double-check your access key and secret
4. **Bucket Not Found**: Ensure the bucket name matches exactly

### Debugging

Enable debug logging by setting `NODE_ENV=development` to see detailed S3 operation logs.

## Security Notes

- Never commit your S3 credentials to code
- Use environment variables for all sensitive data
- Consider implementing presigned URLs for temporary access
- Regularly rotate your API tokens
- Use the principle of least privilege for API token permissions