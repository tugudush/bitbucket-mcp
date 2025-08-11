// Debug: Test the exact URL our MCP server builds
const BITBUCKET_API_BASE = 'https://api.bitbucket.org/2.0';

function buildListingUrl(workspace, repo_slug, ref, path, page, pagelen) {
  const params = new URLSearchParams();
  if (ref) params.append('at', ref);
  if (page) params.append('page', page.toString());
  if (pagelen) params.append('pagelen', Math.min(pagelen, 100).toString());

  let url = `${BITBUCKET_API_BASE}/repositories/${workspace}/${repo_slug}/src`;
  if (path) url += `/${path.replace(/^\/+|\/+$/g, '')}`;
  if (params.toString()) url += `?${params}`;
  return url;
}

// Test with the same parameters as our failed call
const url1 = buildListingUrl('tugudush', 'template2', undefined, undefined, undefined, undefined);
const url2 = buildListingUrl('tugudush', 'template2', 'master', undefined, undefined, undefined);

console.log("URL without ref:", url1);
console.log("URL with ref:", url2);
console.log("Working direct URL from curl test:");
console.log("https://api.bitbucket.org/2.0/repositories/tugudush/template2/src");

// Test both URLs
const apiToken = "ATATT3xFfGF0qtjINJnWm5Jcj5wlFHS4KHSdDWXX2LRtizlPUIMdvMxKp6G4pgBAVJxDiTS1Z0Fnw4x-ggefxEFF3NslfMg10UE5K2QEgYhvMkGUiwj_DKoiJIredpfBjW7vdHLZw4CRs_JklGS9kCJs9eJ3iXgdTXk0D3MhUNlbW1a2Ubj6cLc=0F9CB982";
const email = "jerome2kph@gmail.com";

async function testUrl(testUrl, label) {
  console.log(`\n=== Testing ${label}: ${testUrl} ===`);
  const headers = {
    Accept: 'application/json',
    'User-Agent': 'bitbucket-mcp-server/1.0.0',
    Authorization: `Basic ${Buffer.from(`${email}:${apiToken}`).toString('base64')}`
  };

  try {
    const response = await fetch(testUrl, { method: 'GET', headers });
    console.log("Status:", response.status, response.statusText);
    
    if (response.ok) {
      const data = await response.json();
      console.log("✅ Success! Found", data.values?.length || 0, "items");
    } else {
      const errorText = await response.text();
      if (errorText.includes('Something went wrong')) {
        console.log("❌ 500 Internal Server Error (HTML page)");
      } else {
        console.log("❌ Error:", errorText.substring(0, 200));
      }
    }
  } catch (error) {
    console.error("❌ Exception:", error.message);
  }
}

async function runTests() {
  await testUrl(url1, "MCP URL (no ref)");
  await testUrl(url2, "MCP URL (with master ref)");
}

runTests();
