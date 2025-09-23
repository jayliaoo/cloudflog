# R2 CORS Configuration Guide

## The Problem
When using fetch() in the browser to upload to R2, you encounter CORS issues because:

1. **Preflight Requests**: Browsers send an OPTIONS request before PUT requests to check CORS permissions
2. **Missing CORS Headers**: R2 bucket needs to be configured to allow cross-origin requests
3. **Signed Headers Mismatch**: All headers in the request must be included in the signed URL

## Solution

### 1. Configure R2 Bucket CORS (Required)
You need to configure your Cloudflare R2 bucket to allow CORS requests:

```bash
# Using Wrangler CLI
wrangler r2 bucket cors put <your-bucket-name> --file cors-config.json
```

cors-config.json:
```json
[
  {
    "AllowedOrigins": ["http://localhost:5173", "http://localhost:5174", "https://yourdomain.com"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag", "x-amz-checksum-crc32", "x-amz-sdk-checksum-algorithm"],
    "MaxAgeSeconds": 3600
  }
]
```

### 2. Update Signed URL Generation (Already Done)
The signed URL now includes all required headers:
- `x-amz-checksum-crc32`
- `x-amz-sdk-checksum-algorithm`
- `x-id: PutObject`

### 3. Browser Upload Code
Here's the correct way to upload from the browser:

```javascript
async function uploadToR2(file, signedUrl) {
  try {
    const response = await fetch(signedUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type,
        'x-amz-checksum-crc32': 'AAAAAA==',
        'x-amz-sdk-checksum-algorithm': 'CRC32'
      },
      body: file,
      mode: 'cors'
    });

    if (response.ok) {
      console.log('Upload successful!');
      return true;
    } else {
      const errorText = await response.text();
      console.error('Upload failed:', errorText);
      return false;
    }
  } catch (error) {
    console.error('Network error:', error);
    return false;
  }
}
```

## Testing
1. Open `cors-test.html` in your browser
2. Select an image file
3. Click "Upload to R2"
4. Check browser console for detailed error messages

## Common Issues

### 403 SignatureDoesNotMatch
- **Cause**: Headers in request don't match signed headers
- **Solution**: Ensure all headers sent match exactly what's in the signed URL

### CORS Preflight Failed
- **Cause**: R2 bucket CORS not configured
- **Solution**: Set up R2 bucket CORS configuration

### Network Error
- **Cause**: Mixed content (HTTP vs HTTPS)
- **Solution**: Ensure your site uses HTTPS when uploading to R2

## Next Steps
1. Configure your R2 bucket CORS settings
2. Test with the provided HTML file
3. Check browser console for specific error messages
4. Adjust CORS configuration as needed