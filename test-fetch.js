// Test fetch with the signed URL
async function testFetch() {
  try {
    // Get a fresh signed URL
    const response = await fetch('http://localhost:5173/api/images?action=getUploadUrl&filename=test-fetch.jpg&contentType=image/jpeg');
    const data = await response.json();
    
    console.log('Signed URL response:', data);
    
    if (data.success) {
      // Test PUT request with fetch
      const testData = new Blob(['test image data'], { type: 'image/jpeg' });
      
      const putResponse = await fetch(data.signedUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'image/jpeg',
          'x-amz-checksum-crc32': 'AAAAAA==',
          'x-amz-sdk-checksum-algorithm': 'CRC32'
        },
        body: testData
      });
      
      console.log('PUT Response status:', putResponse.status);
      console.log('PUT Response headers:', Object.fromEntries(putResponse.headers.entries()));
      
      if (!putResponse.ok) {
        const errorText = await putResponse.text();
        console.log('PUT Error response:', errorText);
      } else {
        console.log('PUT Success!');
      }
    }
  } catch (error) {
    console.error('Fetch error:', error);
  }
}

testFetch();