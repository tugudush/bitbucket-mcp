#!/usr/bin/env node

// Test the correct file content endpoint
async function testCorrectEndpoint() {
  console.log('Testing correct file content endpoint...\n');
  
  // Try the raw content endpoint
  const urls = [
    'https://api.bitbucket.org/2.0/repositories/atlassian_tutorial/helloworld/src/master/LICENSE',
    'https://bitbucket.org/atlassian_tutorial/helloworld/raw/master/LICENSE',
    'https://api.bitbucket.org/2.0/repositories/atlassian_tutorial/helloworld/raw/master/LICENSE'
  ];
  
  for (const url of urls) {
    console.log(`\n=== Testing: ${url} ===`);
    try {
      const response = await fetch(url);
      console.log('Status:', response.status, response.statusText);
      console.log('Content-Type:', response.headers.get('content-type'));
      
      if (response.ok) {
        const content = await response.text();
        console.log('✅ Success! Content length:', content.length);
        console.log('Preview:', content.substring(0, 200));
        break;
      }
    } catch (error) {
      console.log('❌ Error:', error.message);
    }
  }
}

testCorrectEndpoint().catch(console.error);
