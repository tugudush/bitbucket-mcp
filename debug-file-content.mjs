#!/usr/bin/env node

// Debug file content fetching
async function debugFileContent() {
  console.log('Debugging file content fetching...\n');
  
  const baseUrl = 'https://api.bitbucket.org/2.0';
  
  // Test different URL patterns for file content
  const urls = [
    `${baseUrl}/repositories/atlassian_tutorial/helloworld/src/LICENSE`,
    `${baseUrl}/repositories/atlassian_tutorial/helloworld/src/main/LICENSE`,
    `${baseUrl}/repositories/atlassian_tutorial/helloworld/src?format=raw&path=LICENSE`,
    `${baseUrl}/repositories/atlassian_tutorial/helloworld/src/LICENSE?format=raw`,
    // Try with different endpoints
    `${baseUrl}/repositories/atlassian_tutorial/helloworld/downloads/LICENSE`,
    `${baseUrl}/repositories/atlassian_tutorial/helloworld/raw/LICENSE`,
    `${baseUrl}/repositories/atlassian_tutorial/helloworld/raw/main/LICENSE`
  ];
  
  for (const url of urls) {
    console.log(`\n=== Testing: ${url} ===`);
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'bitbucket-mcp-server/1.0.0'
        }
      });
      
      console.log('Status:', response.status, response.statusText);
      console.log('Content-Type:', response.headers.get('content-type'));
      
      if (response.ok) {
        const content = await response.text();
        console.log('✅ Success! Content length:', content.length);
        console.log('Preview:', content.substring(0, 100));
        break; // Stop at first success
      } else {
        const error = await response.text();
        console.log('❌ Error preview:', error.substring(0, 200));
      }
    } catch (error) {
      console.log('❌ Request failed:', error.message);
    }
  }
}

debugFileContent().catch(console.error);
