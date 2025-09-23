import { AwsClient } from 'aws4fetch';

export interface S3Config {
  accessKeyId: string;
  secretAccessKey: string;
  endpoint: string;
  region: string;
  bucket: string;
}

export function createS3Client(config: S3Config) {
  // Create AWS client using aws4fetch
  return new AwsClient({
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
    region: config.region,
    service: 's3'
  });
}

export async function getSignedUrlForUpload(
  config: S3Config,
  bucket: string,
  key: string,
  contentType: string,
  metadata?: Record<string, string>,
  expiresIn: number = 3600 // 1 hour default
) {
  // Use aws4fetch to generate signed URL
  const aws = createS3Client(config);
  
  // Build the URL for the object - ensure proper URL construction
  const cleanEndpoint = config.endpoint.replace(/\/$/, ''); // Remove trailing slash
  const objectUrl = `${cleanEndpoint}/${bucket}/${key}`;
  
  // Create a request that will be signed
  const request = new Request(objectUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': contentType,
    }
  });
  
  // Sign the request and get the signed URL
  const signedRequest = await aws.sign(request, {
    aws: { signQuery: true },
    headers: {
      'Content-Type': contentType,
    }
  });
  
  // Return the signed URL
  return signedRequest.url;
}
