import fetch from "node-fetch";

const DASHBOARD_URL = "http://localhost:3000/api/dashboard";
const USER_ID = "cm8ns346x000ci7mkf45em9jq";
const TOTAL_REQUESTS = 150; // More than the rate limit to test throttling
const DELAY_BETWEEN_REQUESTS = 100; // 100ms between requests

async function makeRequest(index: number) {
  const url = `${DASHBOARD_URL}?userId=${USER_ID}`;
  const startTime = Date.now();

  try {
    const response = await fetch(url);
    const endTime = Date.now();

    const rateLimitLimit = response.headers.get("X-RateLimit-Limit");
    const rateLimitRemaining = response.headers.get("X-RateLimit-Remaining");
    const rateLimitReset = response.headers.get("X-RateLimit-Reset");

    console.log(`\nRequest ${index + 1}:`);
    console.log(`Status: ${response.status}`);
    console.log(`Time taken: ${endTime - startTime}ms`);
    console.log(`Rate Limit Headers:`);
    console.log(`  - Limit: ${rateLimitLimit}`);
    console.log(`  - Remaining: ${rateLimitRemaining}`);
    console.log(`  - Reset: ${rateLimitReset}`);

    if (response.status === 429) {
      const data = await response.json();
      console.log(`Rate limit exceeded:`, data);
    }
  } catch (error) {
    console.error(`Request ${index + 1} failed:`, error);
  }
}

async function runTest() {
  console.log(`Starting rate limit test for ${TOTAL_REQUESTS} requests...`);
  console.log(`URL: ${DASHBOARD_URL}?userId=${USER_ID}`);
  console.log(`Delay between requests: ${DELAY_BETWEEN_REQUESTS}ms\n`);

  for (let i = 0; i < TOTAL_REQUESTS; i++) {
    await makeRequest(i);
    if (i < TOTAL_REQUESTS - 1) {
      await new Promise((resolve) =>
        setTimeout(resolve, DELAY_BETWEEN_REQUESTS)
      );
    }
  }

  console.log("\nTest completed!");
}

runTest().catch(console.error);
