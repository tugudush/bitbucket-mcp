// Debug version of the MCP server makeRequest function
import { Buffer } from 'buffer';

const BITBUCKET_API_BASE = 'https://api.bitbucket.org/2.0';

async function makeRequest(url, options = {}) {
  // Debug logging
  console.log('🔍 MCP Server Debug:');
  console.log('  URL:', url);
  console.log('  Environment variables:');
  console.log('    BITBUCKET_API_TOKEN:', process.env.BITBUCKET_API_TOKEN ? 'SET (length: ' + process.env.BITBUCKET_API_TOKEN.length + ')' : 'NOT SET');
  console.log('    BITBUCKET_EMAIL:', process.env.BITBUCKET_EMAIL || 'NOT SET');
  console.log('    BITBUCKET_USERNAME:', process.env.BITBUCKET_USERNAME || 'NOT SET');
  console.log('    BITBUCKET_APP_PASSWORD:', process.env.BITBUCKET_APP_PASSWORD ? 'SET' : 'NOT SET');

  const requestedMethod = (options.method || 'GET').toString().toUpperCase();
  if (requestedMethod !== 'GET') {
    throw new Error(`Write operations are disabled: attempted ${requestedMethod} ${url}`);
  }

  const headers = {
    Accept: 'application/json',
    'User-Agent': 'bitbucket-mcp-server/1.0.0',
    ...((options.headers) || {}),
  };

  // Add authentication if available
  const apiToken = process.env.BITBUCKET_API_TOKEN;
  const email = process.env.BITBUCKET_EMAIL;
  const username = process.env.BITBUCKET_USERNAME;
  const appPassword = process.env.BITBUCKET_APP_PASSWORD;

  if (apiToken && email) {
    const auth = Buffer.from(`${email}:${apiToken}`).toString('base64');
    headers.Authorization = `Basic ${auth}`;
    console.log('  Auth: Using API Token with email');
  } else if (username && appPassword) {
    const auth = Buffer.from(`${username}:${appPassword}`).toString('base64');
    headers.Authorization = `Basic ${auth}`;
    console.log('  Auth: Using App Password with username');
  } else {
    console.log('  Auth: NO AUTHENTICATION');
  }

  console.log('  Headers:', JSON.stringify(headers, null, 2));

  const response = await fetch(url, {
    ...options,
    method: 'GET',
    headers,
  });

  console.log('  Response Status:', response.status, response.statusText);
  console.log('  Response URL:', response.url);

  if (!response.ok) {
    const errorText = await response.text();
    console.log('  Error Response:', errorText.substring(0, 500));
    throw new Error(`Bitbucket API error: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const result = await response.json();
  console.log('  Success: Found', result.values?.length || 0, 'items\n');
  return result;
}

// Test the function
async function testMakeRequest() {
  try {
    const url = `${BITBUCKET_API_BASE}/repositories/tugudush/template2/src`;
    await makeRequest(url);
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testMakeRequest();
