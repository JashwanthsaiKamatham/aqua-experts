/**
 * Google Gemini — backend only.
 * The API key lives in server/.env and is never sent to the browser.
 * Uses the REST endpoint directly (no SDK needed) with model fallbacks.
 */
const API_KEY = () => process.env.GEMINI_API_KEY || '';
const PRIMARY = process.env.GEMINI_MODEL || 'gemini-3.5-flash';
// Model availability changes over time — try a few, first success wins.
const FALLBACKS = [
  PRIMARY,
  'gemini-3.5-flash',
  'gemini-3.1-flash-lite',
  'gemini-flash-latest',
  'gemini-2.5-flash'
];

export const isGeminiConfigured = () => Boolean(API_KEY());

function endpoint(model) {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
}

/**
 * @param {string} prompt   user prompt
 * @param {object} opts     { system, temperature, maxTokens }
 * @returns {Promise<{text:string, model:string}>}
 */
export async function generateText(prompt, opts = {}) {
  if (!API_KEY()) {
    const err = new Error(
      'AI is not configured yet. Add GEMINI_API_KEY to the server environment.'
    );
    err.status = 503;
    throw err;
  }

  const body = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: opts.temperature ?? 0.7,
      maxOutputTokens: opts.maxTokens ?? 900,
      topP: 0.95
    }
  };
  if (opts.system) body.systemInstruction = { parts: [{ text: opts.system }] };

  const tried = [...new Set(FALLBACKS)];
  let lastError;

  for (const model of tried) {
    try {
      const res = await fetch(endpoint(model), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': API_KEY() },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const detail = await res.text().catch(() => '');
        // "model unavailable / over capacity / bad request" → try the next model
        if ([400, 404, 429, 500, 502, 503].includes(res.status)) {
          lastError = new Error(`Gemini ${model}: ${res.status} ${detail.slice(0, 200)}`);
          continue;
        }
        const e = new Error(`Gemini request failed (${res.status}).`);
        e.status = 502;
        throw e;
      }

      const json = await res.json();
      const text =
        json?.candidates?.[0]?.content?.parts?.map((p) => p.text).filter(Boolean).join('\n').trim() ||
        '';

      if (!text) {
        lastError = new Error(`Gemini ${model}: empty response`);
        continue;
      }
      return { text, model };
    } catch (e) {
      if (e.status === 429 || e.status === 502) throw e;
      lastError = e;
    }
  }

  const err = new Error(
    'The AI assistant is busy right now. Please try again in a moment — or call us and a human will help.'
  );
  err.status = 503;
  err.cause = lastError;
  throw err;
}

/** Brand voice used for every assistant call. */
export const AQUA_SYSTEM_PROMPT = `You are "Aqua Assist", the friendly water-quality expert for AQUA-EXPERTS, a water purifier sales and service business in Bengaluru, India.
Products: RO, RO+UV, RO+UV+UF+TDS home purifiers priced between ₹7,000 and ₹12,000.
Services: installation, repair, filter/membrane replacement, and Annual Maintenance Contracts (AMC).
Rules:
- Be concise, warm and practical. Short paragraphs or tight bullet points.
- Always use ₹ for prices. Never invent prices outside the ₹7,000–₹12,000 range for purifiers.
- Never give medical diagnoses; suggest consulting a doctor for health concerns.
- If asked about bookings, point to the "Book a Service" form or the WhatsApp button.
- Reply in the language the customer writes in (English, Hindi or Kannada).`;
