/**
 * lib/api.js — sentiment model endpoint adapter
 *
 * Set VITE_SENTIMENT_API_URL in your .env or Vercel env vars.
 * Example: VITE_SENTIMENT_API_URL=https://your-api.example.com
 *
 * Expected request:
 *   POST /predict
 *   Content-Type: application/json
 *   { "text": "...", "entity": "..." }
 *
 * Expected response:
 *   { "label": "Positive", "scores": { "Positive": 0.82, "Negative": 0.05, "Neutral": 0.08, "Mixed": 0.05 }, "latency_ms": 120 }
 *
 * Health check (used by StatusPill):
 *   GET /health  →  200 OK   (any 2xx counts as online)
 *
 * Adjust the shape of buildBody() and parseResponse() to match your
 * actual API contract without touching the rest of the codebase.
 */

export const API_BASE_URL =
  import.meta.env.VITE_SENTIMENT_API_URL ?? 'http://localhost:8000';

/** Build request payload — adjust if your API uses different field names */
function buildBody({ text, entity }) {
  return JSON.stringify({ text, entity });
}

function parseResponse(json) {
  const rawLabel = json.label ?? json.sentiment ?? 'unknown';
  const label = rawLabel.charAt(0).toUpperCase() + rawLabel.slice(1);
  const rawProbs = json.probs ?? json.scores ?? json.probabilities ?? {};
  const scores = Object.fromEntries(
    Object.entries(rawProbs).map(([k, v]) => [
      k.charAt(0).toUpperCase() + k.slice(1),
      v,
    ])
  );
 
  return {
    label,
    scores,
    latency:   json.latency_ms ?? json.inference_time_ms ?? null,
    raw:       json,
  };
}

/**
 * predictSentiment({ text, entity })
 * Returns { label, scores, latency, raw } or throws on error.
 */
export async function predictSentiment({ text, entity }) {
  const res = await fetch(`${API_BASE_URL}/predict`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    buildBody({ text, entity }),
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(`API ${res.status}: ${msg}`);
  }

  const json = await res.json();
  return parseResponse(json);
}

/**
 * checkHealth()
 * Returns true if the API responds with a 2xx status.
 */
export async function checkHealth() {
  try {
    const res = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(4000),
    });
    return res.ok;
  } catch {
    return false;
  }
}
