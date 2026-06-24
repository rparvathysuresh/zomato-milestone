/**
 * Filter Engine
 *
 * Filters the restaurant dataset by user preferences and returns a sorted,
 * limited array of candidates.
 *
 * Filter Pipeline:
 *   All Restaurants → Location → Budget → Cuisine (opt) → Rating (opt)
 *     → Sort (rating desc, votes desc) → Slice top 20
 */

import { normalizeString } from '@/utils/helpers';
import { MAX_CANDIDATES } from '@/utils/constants';

/**
 * Filter and rank restaurants based on user preferences.
 *
 * @param {Array<Object>} restaurants  — full restaurant array
 * @param {Object}        preferences  — user-supplied filters
 * @param {string}        preferences.location   — required, city/area name
 * @param {string}        preferences.budget     — required, budget tier (low|medium|high)
 * @param {string}        [preferences.cuisine]  — optional, cuisine search term
 * @param {number}        [preferences.minRating] — optional, minimum rating (0-5)
 * @returns {Array<Object>} Sorted, filtered array of up to MAX_CANDIDATES restaurants
 */
export function filterRestaurants(restaurants, preferences) {
  const { location, budget, cuisine, minRating } = preferences;

  let results = restaurants;

  // --- 1. Location filter (required, exact case-insensitive match) ----------
  const normalizedLocation = normalizeString(location);
  results = results.filter(
    (r) => normalizeString(r.location) === normalizedLocation
  );

  // --- 2. Budget filter (required, match budgetTier field) ------------------
  const normalizedBudget = normalizeString(budget);
  results = results.filter(
    (r) => normalizeString(r.budgetTier) === normalizedBudget
  );

  // --- 3. Cuisine filter (optional) ----------------------------------------
  if (cuisine) {
    const normalizedCuisine = normalizeString(cuisine);
    results = results.filter((r) =>
      Array.isArray(r.cuisine) &&
      r.cuisine.some((c) => normalizeString(c).includes(normalizedCuisine))
    );
  }

  // --- 4. Rating filter (optional) -----------------------------------------
  if (minRating != null && Number.isFinite(Number(minRating))) {
    const threshold = Number(minRating);
    results = results.filter((r) => r.rating >= threshold);
  }

  // --- 5. Sort: primary by rating (desc), tiebreaker by votes (desc) -------
  results.sort((a, b) => {
    if (b.rating !== a.rating) return b.rating - a.rating;
    return b.votes - a.votes;
  });

  // --- 6. Limit to top candidates ------------------------------------------
  return results.slice(0, MAX_CANDIDATES);
}
