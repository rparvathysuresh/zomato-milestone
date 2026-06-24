/**
 * Shared Utility Helpers
 *
 * Pure utility functions used across the application.
 */

// ---------------------------------------------------------------------------
// String Normalization
// ---------------------------------------------------------------------------

/**
 * Normalize a string — trim whitespace and convert to lowercase.
 * Returns an empty string for null/undefined input.
 *
 * @param {string|null|undefined} str
 * @returns {string}
 */
export function normalizeString(str) {
  if (str == null || typeof str !== 'string') return '';
  return str.trim().toLowerCase();
}

// ---------------------------------------------------------------------------
// Cuisine Parsing
// ---------------------------------------------------------------------------

/**
 * Parse a comma-separated cuisine string into a cleaned array.
 * Returns `['Unknown']` for empty/null input.
 *
 * @param {string|null|undefined} cuisineStr
 * @returns {string[]}
 *
 * @example
 * parseCuisine("Italian, Continental") // → ["Italian", "Continental"]
 * parseCuisine("")                     // → ["Unknown"]
 */
export function parseCuisine(cuisineStr) {
  if (!cuisineStr || typeof cuisineStr !== 'string') return ['Unknown'];
  const parts = cuisineStr
    .split(',')
    .map((c) => c.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts : ['Unknown'];
}

// ---------------------------------------------------------------------------
// Currency Formatting
// ---------------------------------------------------------------------------

/**
 * Format a number as Indian Rupee currency string.
 *
 * @param {number} amount
 * @returns {string} e.g. "₹800 for two"
 */
export function formatCurrency(amount) {
  if (amount == null || !Number.isFinite(amount)) return '₹— for two';
  return `₹${amount.toLocaleString('en-IN')} for two`;
}

// ---------------------------------------------------------------------------
// Input Sanitization
// ---------------------------------------------------------------------------

/**
 * Sanitize user-provided text input.
 * Strips HTML tags, trims whitespace, and limits length.
 *
 * @param {string|null|undefined} input
 * @param {number} [maxLength=500]
 * @returns {string}
 */
export function sanitizeInput(input, maxLength = 500) {
  if (input == null || typeof input !== 'string') return '';
  // Strip HTML tags
  const cleaned = input.replace(/<[^>]*>/g, '').trim();
  return cleaned.slice(0, maxLength);
}

// ---------------------------------------------------------------------------
// Rating Helpers
// ---------------------------------------------------------------------------

/**
 * Clamp a rating value to the valid range [0, 5].
 *
 * @param {number|null|undefined} rating
 * @param {number} [defaultValue=0]
 * @returns {number}
 */
export function clampRating(rating, defaultValue = 0) {
  if (rating == null || !Number.isFinite(Number(rating))) return defaultValue;
  const val = Number(rating);
  return Math.max(0, Math.min(5, val));
}

/**
 * Generate an array of star representations for a rating.
 * Returns an object with full, half, and empty star counts.
 *
 * @param {number} rating - Rating value (0-5)
 * @returns {{ full: number, half: number, empty: number }}
 */
export function getStarCounts(rating) {
  const clamped = clampRating(rating);
  const full = Math.floor(clamped);
  const half = clamped % 1 >= 0.25 ? 1 : 0;
  const empty = 5 - full - half;
  return { full, half, empty };
}
