/**
 * Prompt Builder
 *
 * Constructs a structured prompt for the Groq LLM, including user
 * preferences, formatted restaurant data, and an explicit JSON
 * response schema.
 */

import { formatCurrency } from '@/utils/helpers';
import { MAX_RECOMMENDATIONS } from '@/utils/constants';

/**
 * Build the system and user messages for the LLM.
 *
 * @param {Array<Object>} filteredRestaurants — pre-filtered restaurant candidates (max 20)
 * @param {Object}        preferences         — user-supplied filters
 * @param {string}        preferences.location
 * @param {string}        preferences.budget
 * @param {string}        [preferences.cuisine]
 * @param {number}        [preferences.minRating]
 * @param {string}        [preferences.extras]   — free-text additional preferences
 * @returns {{ systemMessage: string, userMessage: string }}
 */
export function buildPrompt(filteredRestaurants, preferences) {
  const systemMessage = [
    'You are a restaurant recommendation expert.',
    'Analyze the provided restaurant data and rank them based on the user\'s preferences.',
    'Return your response as valid JSON matching the schema provided.',
    'Do not include any text outside the JSON object.',
  ].join(' ');

  // ----- Format restaurant list for the prompt -----
  const restaurantList = filteredRestaurants
    .map((r, i) => {
      const cuisines = Array.isArray(r.cuisine) ? r.cuisine.join(', ') : r.cuisine;
      return [
        `${i + 1}. ${r.name}`,
        `   Cuisine: ${cuisines}`,
        `   Rating: ${r.rating}/5 (${r.votes} votes)`,
        `   Cost: ${formatCurrency(r.costForTwo)}`,
        `   Type: ${r.restaurantType || 'N/A'}`,
        `   Highlights: ${Array.isArray(r.highlights) && r.highlights.length > 0 ? r.highlights.join(', ') : 'None'}`,
      ].join('\n');
    })
    .join('\n\n');

  // ----- Format user preferences summary -----
  const prefLines = [
    `Location: ${preferences.location}`,
    `Budget: ${preferences.budget}`,
  ];
  if (preferences.cuisine) prefLines.push(`Preferred cuisine: ${preferences.cuisine}`);
  if (preferences.minRating != null) prefLines.push(`Minimum rating: ${preferences.minRating}`);
  if (preferences.extras) prefLines.push(`Additional preferences: ${preferences.extras}`);

  const prefSummary = prefLines.join('\n');

  // ----- Build user message -----
  const userMessage = `## User Preferences
${prefSummary}

## Available Restaurants (${filteredRestaurants.length} matches)
${restaurantList}

## Instructions
1. From the restaurants above, select and rank the top ${MAX_RECOMMENDATIONS} that best match the user's preferences.
2. For each recommendation, write a brief, helpful explanation (2-3 sentences) of why it's a good match.
3. Write a short overall summary (2-3 sentences) of your recommendations.
4. If fewer than ${MAX_RECOMMENDATIONS} restaurants are available, rank all of them.

## Required JSON Response Schema
\`\`\`json
{
  "recommendations": [
    {
      "rank": 1,
      "name": "Restaurant Name",
      "cuisine": "Cuisine Type",
      "rating": 4.5,
      "estimatedCost": "₹X for two",
      "explanation": "Why this restaurant is recommended..."
    }
  ],
  "summary": "Overall summary of recommendations..."
}
\`\`\`

Return ONLY the JSON object. Do not include any other text.`;

  return { systemMessage, userMessage };
}
