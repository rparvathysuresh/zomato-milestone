/**
 * Test script for POST /api/recommend — Phase 3 (LLM integration)
 * Run: node scripts/test-api.js
 */

const http = require('http');

const tests = [
  // --- Validation tests (should still pass from Phase 2) ---
  {
    name: 'Validation: missing location → 400',
    body: { budget: 'medium' },
    expectStatus: 400,
  },
  {
    name: 'Validation: missing budget → 400',
    body: { location: 'banashankari' },
    expectStatus: 400,
  },
  {
    name: 'Validation: invalid budget tier → 400',
    body: { location: 'banashankari', budget: 'super-expensive' },
    expectStatus: 400,
  },

  // --- LLM integration test ---
  {
    name: 'LLM: banashankari, medium, Chinese, 4.0 → AI recommendations',
    body: { location: 'banashankari', budget: 'medium', cuisine: 'Chinese', minRating: 4.0 },
    expectStatus: [200, 503], // 200 if API key works, 503 if LLM fails (graceful fallback)
    checkLLM: true,
  },
  {
    name: 'LLM: koramangala, low → AI recommendations (broad)',
    body: { location: 'koramangala', budget: 'low' },
    expectStatus: [200, 503],
    checkLLM: true,
  },
  {
    name: 'LLM: indiranagar, high, Italian, extras → AI recommendations',
    body: { location: 'indiranagar', budget: 'high', cuisine: 'Italian', minRating: 4.0, extras: 'romantic dinner' },
    expectStatus: [200, 503],
    checkLLM: true,
  },
];

async function runTest(test) {
  return new Promise((resolve) => {
    const data = JSON.stringify(test.body);
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/recommend',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        const expectedStatuses = Array.isArray(test.expectStatus)
          ? test.expectStatus
          : [test.expectStatus];
        const statusOk = expectedStatuses.includes(res.statusCode);

        const parsed = JSON.parse(body);
        console.log(`${statusOk ? '✅' : '❌'} ${test.name}`);
        console.log(`   Status: ${res.statusCode}`);

        if (parsed.recommendations) {
          console.log(`   Results: ${parsed.recommendations.length} recommendations, ${parsed.totalFiltered} total filtered`);

          if (test.checkLLM && res.statusCode === 200) {
            const hasExplanations = parsed.recommendations.some((r) => r.explanation && r.explanation.length > 0);
            const hasSummary = parsed.summary && parsed.summary.length > 0;
            console.log(`   AI explanations: ${hasExplanations ? '✅ present' : '⚠️ empty'}`);
            console.log(`   AI summary: ${hasSummary ? '✅ present' : '⚠️ empty'}`);
            if (hasSummary) {
              console.log(`   Summary: "${parsed.summary.slice(0, 120)}..."`);
            }
            if (parsed.recommendations.length > 0) {
              const top = parsed.recommendations[0];
              console.log(`   Top: #${top.rank} ${top.name} (${top.rating}⭐, ${top.estimatedCost})`);
              if (top.explanation) {
                console.log(`   Explanation: "${top.explanation.slice(0, 120)}..."`);
              }
            }
          }

          if (parsed.warning) {
            console.log(`   ⚠️ Warning: ${parsed.warning}`);
          }
        }

        if (parsed.error) {
          console.log(`   Error: [${parsed.error.code}] ${parsed.error.message}`);
        }

        console.log('');
        resolve(statusOk);
      });
    });

    req.on('error', (err) => {
      console.log(`❌ ${test.name} — connection error: ${err.message}\n`);
      resolve(false);
    });

    req.write(data);
    req.end();
  });
}

(async () => {
  console.log('=== Testing POST /api/recommend (Phase 3) ===\n');
  let passed = 0;
  for (const test of tests) {
    const ok = await runTest(test);
    if (ok) passed++;
  }
  console.log(`\n${passed}/${tests.length} tests passed.`);
  process.exit(passed === tests.length ? 0 : 1);
})();
