/**
 * Data Ingestion Script
 *
 * Fetches the Zomato restaurant dataset from Hugging Face,
 * preprocesses it, and outputs `data/zomato_restaurants.json`.
 *
 * Strategy: Downloads pre-converted Parquet files from HF's conversion
 * endpoint for fast, rate-limit-free bulk data access. Falls back to
 * the rows API if parquet download fails.
 *
 * Usage:  node scripts/ingest.js
 *
 * Dataset: https://huggingface.co/datasets/ManikaSaini/zomato-restaurant-recommendation
 */

const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const OUTPUT_DIR = path.join(__dirname, '..', 'data');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'zomato_restaurants.json');
const TEMP_DIR = path.join(__dirname, '..', 'data', '.tmp');

// Parquet file URLs (from HF's auto-converted parquet branch)
// File 0 is ~140MB (bulk of data), File 1 is ~4.7MB
const PARQUET_URLS = [
  'https://huggingface.co/datasets/ManikaSaini/zomato-restaurant-recommendation/resolve/refs%2Fconvert%2Fparquet/default/train/0000.parquet',
  'https://huggingface.co/datasets/ManikaSaini/zomato-restaurant-recommendation/resolve/refs%2Fconvert%2Fparquet/default/train/0001.parquet',
];

// Budget tier thresholds (₹)
const BUDGET_THRESHOLDS = { low: 500, medium: 1500 };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getBudgetTier(cost) {
  if (cost == null || cost <= 0) return 'low';
  if (cost <= BUDGET_THRESHOLDS.low) return 'low';
  if (cost <= BUDGET_THRESHOLDS.medium) return 'medium';
  return 'high';
}

function parseCuisine(cuisineStr) {
  if (!cuisineStr || typeof cuisineStr !== 'string') return ['Unknown'];
  const parts = cuisineStr
    .split(',')
    .map((c) => c.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts : ['Unknown'];
}

function normalizeLocation(loc) {
  if (!loc || typeof loc !== 'string') return 'unknown';
  return loc.trim().toLowerCase();
}

function parseNumber(val) {
  if (val == null) return null;
  const n = Number(val);
  return Number.isFinite(n) ? n : null;
}

function extractHighlights(row) {
  const highlights = [];
  if (row.online_order && String(row.online_order).toLowerCase() === 'yes') {
    highlights.push('Online Order');
  }
  if (row.book_table && String(row.book_table).toLowerCase() === 'yes') {
    highlights.push('Table Booking');
  }
  return highlights;
}

// ---------------------------------------------------------------------------
// Parquet Download & Parsing (using hyparquet)
// ---------------------------------------------------------------------------

async function downloadFile(url, destPath) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to download: ${res.status} ${res.statusText}`);
  }
  const arrayBuffer = await res.arrayBuffer();
  fs.writeFileSync(destPath, Buffer.from(arrayBuffer));
  return arrayBuffer;
}

async function readParquetBuffer(arrayBuffer) {
  // hyparquet is ESM-only, so we need dynamic import
  const { parquetRead } = await import('hyparquet');

  return new Promise((resolve, reject) => {
    try {
      parquetRead({
        file: arrayBuffer,
        onComplete: (rows) => {
          resolve(rows);
        },
      });
    } catch (err) {
      reject(err);
    }
  });
}

async function getParquetSchema(arrayBuffer) {
  const { parquetMetadata } = await import('hyparquet');
  const metadata = parquetMetadata(arrayBuffer);
  return metadata.schema;
}

async function fetchViaParquet() {
  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
  }

  let allRows = [];
  let columnNames = null;

  for (let i = 0; i < PARQUET_URLS.length; i++) {
    const url = PARQUET_URLS[i];
    const localPath = path.join(TEMP_DIR, `part_${i}.parquet`);

    console.log(`   Downloading parquet file ${i + 1}/${PARQUET_URLS.length}…`);
    const buffer = await downloadFile(url, localPath);
    const fileSize = buffer.byteLength;
    console.log(`   Downloaded ${(fileSize / 1024 / 1024).toFixed(1)} MB`);

    // Get column names from schema on first file
    if (i === 0) {
      const schema = await getParquetSchema(buffer);
      // Schema elements: first is the root (message), rest are columns
      columnNames = schema.slice(1).map((s) => s.name);
      console.log(`   Columns: ${columnNames.join(', ')}`);
    }

    console.log(`   Reading parquet file ${i + 1}…`);
    const rows = await readParquetBuffer(buffer);
    console.log(`   Read ${rows.length} rows from file ${i + 1}`);

    allRows = allRows.concat(rows);

    // Clean up temp file
    try { fs.unlinkSync(localPath); } catch (_) { /* ignore */ }
  }

  // Remove temp directory
  try { fs.rmdirSync(TEMP_DIR); } catch (_) { /* ignore */ }

  // Convert from array-of-arrays to array-of-objects using column names
  if (!columnNames) {
    throw new Error('Could not determine column names from parquet schema');
  }

  console.log(`   Converting ${allRows.length} rows to objects…`);
  const objectRows = allRows.map((row) => {
    const obj = {};
    for (let c = 0; c < columnNames.length; c++) {
      obj[columnNames[c]] = row[c];
    }
    return obj;
  });

  return objectRows;
}

// ---------------------------------------------------------------------------
// Fallback: Rows API (paginated) with rate limiting
// ---------------------------------------------------------------------------

const PAGE_SIZE = 100;
const MAX_PAGES = 600;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(url, maxRetries = 5) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const res = await fetch(url);
    if (res.ok) return res.json();

    if (res.status === 429 || res.status >= 500) {
      const waitTime = Math.min(1000 * Math.pow(2, attempt), 30000);
      console.log(
        `\n⚠️  Rate limited (${res.status}). Retrying in ${waitTime / 1000}s… (attempt ${attempt + 1}/${maxRetries})`
      );
      await sleep(waitTime);
      continue;
    }

    throw new Error(`HF API returned ${res.status}: ${res.statusText}`);
  }
  throw new Error('Max retries exceeded for Hugging Face API');
}

async function fetchViaRowsAPI() {
  let allRows = [];
  let offset = 0;
  let totalRows = Infinity;

  for (let page = 0; page < MAX_PAGES; page++) {
    const url = `https://datasets-server.huggingface.co/rows?dataset=ManikaSaini%2Fzomato-restaurant-recommendation&config=default&split=train&offset=${offset}&length=${PAGE_SIZE}`;
    const data = await fetchWithRetry(url);

    if (page === 0) {
      totalRows = data.num_rows_total ?? data.num_rows ?? 0;
      console.log(`   Total rows in dataset: ${totalRows}`);
    }

    const rows = (data.rows || []).map((r) => r.row);
    if (rows.length === 0) break;

    allRows = allRows.concat(rows);
    offset += rows.length;

    process.stdout.write(`   Fetched ${allRows.length} / ${totalRows} rows\r`);

    if (allRows.length >= totalRows) break;
    await sleep(250);
  }

  console.log(`\n   Fetched ${allRows.length} rows total via rows API.`);
  return allRows;
}

// ---------------------------------------------------------------------------
// Processing
// ---------------------------------------------------------------------------

function processRows(rows) {
  const seen = new Set();
  const restaurants = [];
  let idCounter = 1;

  for (const row of rows) {
    const name =
      row.name || row.restaurant_name || row.Name || row.Restaurant_Name;
    if (!name || typeof name !== 'string' || !name.trim()) continue;

    const locationRaw =
      row.location ||
      row.city ||
      row.Location ||
      row.City ||
      row.listed_in_city ||
      '';
    const location = normalizeLocation(locationRaw);

    const dedupeKey = `${name.trim().toLowerCase()}||${location}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);

    const cuisineRaw =
      row.cuisines || row.cuisine || row.Cuisines || row.Cuisine || '';
    const cuisine = parseCuisine(cuisineRaw);

    const costRaw =
      row.approx_cost_for_two_people ??
      row.cost_for_two ??
      row.costForTwo ??
      row['approx_cost(for two people)'] ??
      row.average_cost_for_two ??
      null;
    const costForTwo =
      parseNumber(
        typeof costRaw === 'string' ? costRaw.replace(/,/g, '') : costRaw
      ) ?? 0;

    const ratingRaw =
      row.rate || row.rating || row.Rating || row.aggregate_rating || null;
    let rating = parseNumber(
      typeof ratingRaw === 'string'
        ? ratingRaw.replace(/\/5$/, '').trim()
        : ratingRaw
    );
    if (rating === null) rating = 0;
    if (rating > 5) rating = 5;

    const votesRaw = row.votes || row.Votes || row.num_votes || 0;
    const votes = parseNumber(votesRaw) ?? 0;

    const restaurantType =
      row.rest_type ||
      row.restaurant_type ||
      row.listed_in_type ||
      row.RestaurantType ||
      'Unknown';

    const budgetTier = getBudgetTier(costForTwo);
    const highlights = extractHighlights(row);

    const id = `rest_${String(idCounter).padStart(3, '0')}`;
    idCounter++;

    restaurants.push({
      id,
      name: name.trim(),
      location,
      cuisine,
      costForTwo,
      budgetTier,
      rating: Math.round(rating * 10) / 10,
      votes,
      restaurantType:
        typeof restaurantType === 'string' ? restaurantType.trim() : 'Unknown',
      highlights,
    });
  }

  return restaurants;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('━'.repeat(60));
  console.log('🍽️  Zomato Restaurant Data Ingestion');
  console.log('━'.repeat(60));

  try {
    let rawRows;
    try {
      console.log('\n📦 Strategy 1: Downloading Parquet files (fast)…');
      rawRows = await fetchViaParquet();
    } catch (err) {
      console.log(`\n⚠️  Parquet download failed: ${err.message}`);
      console.log('📡 Strategy 2: Falling back to Rows API (slower)…');
      rawRows = await fetchViaRowsAPI();
    }

    if (rawRows.length === 0) {
      console.error('❌ No rows fetched. Aborting.');
      process.exit(1);
    }
    console.log(`\n✅ Fetched ${rawRows.length} raw rows.`);

    console.log('\n🔧 Processing and normalizing records…');
    const restaurants = processRows(rawRows);
    console.log(`   ${restaurants.length} unique restaurants after processing.`);

    if (restaurants.length === 0) {
      console.error('❌ No valid restaurants after processing. Aborting.');
      process.exit(1);
    }

    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(restaurants, null, 2), 'utf-8');
    console.log(`\n✅ Wrote ${restaurants.length} restaurants to:`);
    console.log(`   ${OUTPUT_FILE}`);

    // Stats
    const locations = new Set(restaurants.map((r) => r.location));
    const cuisines = new Set(restaurants.flatMap((r) => r.cuisine));
    const tiers = { low: 0, medium: 0, high: 0 };
    restaurants.forEach((r) => tiers[r.budgetTier]++);

    console.log('\n📊 Dataset stats:');
    console.log(`   Unique locations: ${locations.size}`);
    console.log(`   Unique cuisines:  ${cuisines.size}`);
    console.log(
      `   Budget tiers:     low=${tiers.low}  medium=${tiers.medium}  high=${tiers.high}`
    );
    console.log(
      `   Rating range:     ${Math.min(...restaurants.map((r) => r.rating))} – ${Math.max(...restaurants.map((r) => r.rating))}`
    );

    // Print city and cuisine lists for updating constants.js
    console.log('\n📋 City list (for constants.js):');
    const sortedLocations = [...locations].sort();
    console.log(JSON.stringify(sortedLocations));

    console.log('\n📋 Cuisine list (for constants.js):');
    const sortedCuisines = [...cuisines].sort();
    console.log(JSON.stringify(sortedCuisines));

    console.log('\n' + '━'.repeat(60));
    console.log('✨ Ingestion complete!');
    console.log('━'.repeat(60));
  } catch (err) {
    console.error('\n❌ Ingestion failed:', err.message);
    console.error(
      '   Tip: Ensure you have internet and the HF API is reachable.'
    );
    process.exit(1);
  }
}

main();
