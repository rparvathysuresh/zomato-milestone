/**
 * API Route — POST /api/recommend
 *
 * Phase 3: Full pipeline with LLM integration.
 *   validate(body) → getRestaurants() → filterRestaurants()
 *     → buildPrompt() → getRecommendations() → respond
 *
 * Falls back to filter-only results if the LLM call fails.
 */

import { NextResponse } from 'next/server';
import { getRestaurants } from '@/lib/dataLoader';
import { filterRestaurants } from '@/lib/filterEngine';
import { buildPrompt } from '@/lib/promptBuilder';
import { getRecommendations } from '@/lib/llmClient';
import { formatCurrency, sanitizeInput, normalizeString } from '@/utils/helpers';
import { BUDGET_TIERS, MAX_RECOMMENDATIONS } from '@/utils/constants';

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/**
 * Validate the incoming request body.
 * Returns an error message string or null if valid.
 */
function validateBody(body) {
  if (!body || typeof body !== 'object') {
    return 'Request body must be a JSON object.';
  }

  if (!body.location || typeof body.location !== 'string' || !body.location.trim()) {
    return '"location" is required and must be a non-empty string.';
  }

  if (!body.budget || typeof body.budget !== 'string' || !body.budget.trim()) {
    return '"budget" is required and must be a non-empty string.';
  }

  const normalizedBudget = normalizeString(body.budget);
  if (!BUDGET_TIERS.includes(normalizedBudget)) {
    return `"budget" must be one of: ${BUDGET_TIERS.join(', ')}. Received "${body.budget}".`;
  }

  return null;
}

// ---------------------------------------------------------------------------
// Fallback formatter (filter-only, no LLM)
// ---------------------------------------------------------------------------

/**
 * Build a plain response from filtered results when the LLM is unavailable.
 */
function buildFallbackResponse(filtered) {
  const topResults = filtered.slice(0, MAX_RECOMMENDATIONS);

  const recommendations = topResults.map((r, idx) => ({
    rank: idx + 1,
    name: r.name,
    cuisine: Array.isArray(r.cuisine) ? r.cuisine.join(', ') : r.cuisine,
    rating: r.rating,
    estimatedCost: formatCurrency(r.costForTwo),
    explanation: '',
  }));

  return {
    recommendations,
    summary: '',
    totalFiltered: filtered.length,
    timestamp: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Route Handler
// ---------------------------------------------------------------------------

export async function POST(request) {
  try {
    // --- Parse body ---
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Invalid JSON body.' } },
        { status: 400 }
      );
    }

    // --- Validate ---
    const validationError = validateBody(body);
    if (validationError) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: validationError } },
        { status: 400 }
      );
    }

    // --- Build preferences ---
    const preferences = {
      location: sanitizeInput(body.location),
      budget: normalizeString(body.budget),
      cuisine: body.cuisine ? sanitizeInput(body.cuisine) : undefined,
      minRating: body.minRating != null ? Number(body.minRating) : undefined,
      extras: body.extras ? sanitizeInput(body.extras) : undefined,
    };

    // --- Load data ---
    let restaurants;
    try {
      restaurants = getRestaurants();
    } catch (err) {
      console.error('[/api/recommend] Data load error:', err.message);
      return NextResponse.json(
        {
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to load restaurant data. Please try again later.',
          },
        },
        { status: 500 }
      );
    }

    // --- Filter ---
    const filtered = filterRestaurants(restaurants, preferences);

    // --- Early return if no results ---
    if (filtered.length === 0) {
      return NextResponse.json({
        recommendations: [],
        summary: 'No restaurants matched your preferences. Try broadening your filters.',
        totalFiltered: 0,
        timestamp: new Date().toISOString(),
      });
    }

    // --- LLM pipeline ---
    try {
      const { systemMessage, userMessage } = buildPrompt(filtered, preferences);
      const llmResult = await getRecommendations(systemMessage, userMessage);

      // Normalize the LLM response to match our API contract
      const recommendations = (llmResult.recommendations || [])
        .slice(0, MAX_RECOMMENDATIONS)
        .map((rec, idx) => ({
          rank: rec.rank ?? idx + 1,
          name: rec.name || 'Unknown',
          cuisine: rec.cuisine || '',
          rating: rec.rating ?? 0,
          estimatedCost: rec.estimatedCost || '',
          explanation: rec.explanation || '',
        }));

      return NextResponse.json(
        {
          recommendations,
          summary: llmResult.summary || '',
          totalFiltered: filtered.length,
          timestamp: new Date().toISOString(),
        },
        {
          status: 200,
          headers: {
            'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
          },
        }
      );
    } catch (llmErr) {
      console.error('[/api/recommend] LLM error:', llmErr.message);

      // Fallback: return filter-only results without AI explanations
      // If the API key is missing, return 503 instead of a silent fallback
      if (llmErr.message.includes('GROQ_API_KEY')) {
        return NextResponse.json(
          {
            error: {
              code: 'LLM_ERROR',
              message: 'AI service is not configured. Please set your GROQ_API_KEY.',
            },
          },
          { status: 503 }
        );
      }

      // For other LLM errors, return 503 with the fallback data included
      const fallback = buildFallbackResponse(filtered);
      return NextResponse.json(
        {
          ...fallback,
          warning: 'AI ranking unavailable — showing results by rating instead.',
          error: {
            code: 'LLM_ERROR',
            message: 'AI service temporarily unavailable. Showing filter-based results.',
          },
        },
        { status: 503 }
      );
    }
  } catch (err) {
    console.error('[/api/recommend] Unexpected error:', err);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred. Please try again later.',
        },
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS(request) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,OPTIONS,PATCH,DELETE,POST,PUT',
      'Access-Control-Allow-Headers': 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version',
    },
  });
}
