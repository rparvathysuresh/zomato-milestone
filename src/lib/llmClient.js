/**
 * Groq LLM Client
 *
 * Sends structured prompts to the Groq API and returns parsed JSON.
 * Includes exponential backoff retry logic (max 3 attempts) and
 * fallback handling for JSON parse failures.
 */

import Groq from 'groq-sdk';
import { LLM_MODEL, LLM_TEMPERATURE, LLM_MAX_TOKENS } from '@/utils/constants';

// ---------------------------------------------------------------------------
// Client singleton
// ---------------------------------------------------------------------------

let groqClient = null;

function getClient() {
  if (!groqClient) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey || apiKey === 'your_key_here') {
      throw new Error(
        'GROQ_API_KEY is not configured. Set it in your .env.local file.'
      );
    }
    groqClient = new Groq({ apiKey });
  }
  return groqClient;
}

// ---------------------------------------------------------------------------
// Retry helper
// ---------------------------------------------------------------------------

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

/**
 * Sleep for a given number of milliseconds.
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// JSON repair helper
// ---------------------------------------------------------------------------

/**
 * Attempt to extract / repair a JSON object from a potentially messy LLM
 * response string. Returns the parsed object or throws.
 */
function repairAndParse(raw) {
  // 1. Try direct parse first
  try {
    return JSON.parse(raw);
  } catch {
    // continue to repair attempts
  }

  // 2. Try to extract JSON from markdown code fences
  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    try {
      return JSON.parse(fenceMatch[1].trim());
    } catch {
      // continue
    }
  }

  // 3. Try to find the outermost { ... }
  const firstBrace = raw.indexOf('{');
  const lastBrace = raw.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    try {
      return JSON.parse(raw.slice(firstBrace, lastBrace + 1));
    } catch {
      // give up
    }
  }

  throw new Error('Unable to parse or repair LLM response as JSON.');
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Send a prompt to the Groq API and return the parsed JSON response.
 *
 * @param {string} systemMessage — system role message
 * @param {string} userMessage   — user role message
 * @returns {Promise<Object>} Parsed JSON from the LLM
 * @throws {Error} After MAX_RETRIES failures
 */
export async function getRecommendations(systemMessage, userMessage) {
  const client = getClient();
  let lastError = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await client.chat.completions.create({
        model: LLM_MODEL,
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: userMessage },
        ],
        temperature: LLM_TEMPERATURE,
        max_tokens: LLM_MAX_TOKENS,
        response_format: { type: 'json_object' },
      });

      const content = response.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error('Empty response from Groq API.');
      }

      return repairAndParse(content);
    } catch (err) {
      lastError = err;
      console.warn(
        `[llmClient] Attempt ${attempt}/${MAX_RETRIES} failed:`,
        err.message
      );

      // Don't retry on configuration errors
      if (err.message.includes('GROQ_API_KEY')) throw err;

      // Exponential backoff before next retry
      if (attempt < MAX_RETRIES) {
        const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1);
        await sleep(delay);
      }
    }
  }

  throw new Error(
    `Groq API failed after ${MAX_RETRIES} attempts. Last error: ${lastError?.message}`
  );
}
