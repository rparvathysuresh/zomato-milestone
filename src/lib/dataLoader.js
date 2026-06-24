/**
 * Data Loader
 *
 * Loads the restaurant dataset from `data/zomato_restaurants.json` and caches
 * it in a module-level variable so the file is read only once per cold start.
 */

import fs from 'fs';
import path from 'path';

// ---------------------------------------------------------------------------
// Module-level cache
// ---------------------------------------------------------------------------

let cache = null;

/**
 * Return the full array of restaurant records.
 * The JSON file is read synchronously on the first call and cached in memory
 * for all subsequent invocations within the same server process.
 *
 * @returns {Array<Object>} Array of restaurant objects
 * @throws {Error} If the data file is missing or contains invalid JSON
 */
export function getRestaurants() {
  if (cache) return cache;

  const dataPath = path.join(process.cwd(), 'data', 'zomato_restaurants.json');

  if (!fs.existsSync(dataPath)) {
    throw new Error(
      `Restaurant data file not found at "${dataPath}". ` +
        'Run "node scripts/ingest.js" to generate it.'
    );
  }

  try {
    const raw = fs.readFileSync(dataPath, 'utf-8');
    cache = JSON.parse(raw);
  } catch (err) {
    throw new Error(
      `Failed to parse restaurant data file: ${err.message}. ` +
        'Ensure the file contains valid JSON.'
    );
  }

  if (!Array.isArray(cache) || cache.length === 0) {
    cache = null;
    throw new Error(
      'Restaurant data file is empty or not an array. ' +
        'Re-run "node scripts/ingest.js" to regenerate it.'
    );
  }

  return cache;
}
