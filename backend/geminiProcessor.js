import Groq from 'groq-sdk';
import dotenv from 'dotenv';
dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// OpenRouter as fallback (free, no extra setup needed beyond getting a key)
// Get key free at: https://openrouter.ai/keys
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;

// ── Build the prompt (shared between providers) ───────────────────────────
function buildPrompt(rawTranscript, langName, contextHistory) {
  const contextStr = contextHistory.length > 0
    ? `Previous context:\n${contextHistory.map((c, i) => `${i + 1}. "${c}"`).join('\n')}\n\n`
    : '';

  return `${contextStr}You are a real-time sign language interpreter.

INPUT: "${rawTranscript}"
TARGET: ${langName}

Rules:
- Topic-comment structure (object before action)
- Drop articles (a, the)  
- Drop copula (is, are, was, were)
- Keep only content words
- Example: "The meeting will start soon" → ["meeting", "start", "soon"]

Respond ONLY with valid JSON, no markdown, no extra text:
{
  "cleanedCaption": "natural cleaned sentence here",
  "signTokens": ["word1", "word2", "word3"],
  "topic": "one of: General / Business / Medical / Education / Technology / Casual",
  "confidence": 0.95
}`;
}

// ── Call Groq (primary) ───────────────────────────────────────────────────
async function callGroq(prompt) {
  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.2,
    max_tokens: 300,
  });
  return completion.choices[0]?.message?.content?.trim() || '';
}

// ── Call OpenRouter (fallback) ────────────────────────────────────────────
async function callOpenRouter(prompt) {
  if (!OPENROUTER_KEY) throw new Error('No OpenRouter key');

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost:5173',
      'X-Title': 'SignBridge',
    },
    body: JSON.stringify({
      model: 'meta-llama/llama-3.1-8b-instruct:free',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      max_tokens: 300,
    }),
  });

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || '';
}

// ── Parse JSON response safely ────────────────────────────────────────────
function parseResponse(text, rawTranscript) {
  const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const parsed = JSON.parse(clean);
  return {
    success: true,
    cleanedCaption: parsed.cleanedCaption || rawTranscript,
    signTokens: (parsed.signTokens || []).map(t => t.toLowerCase()),
    topic: parsed.topic || 'General',
    confidence: parsed.confidence || 0.9,
  };
}

// ── Main export ───────────────────────────────────────────────────────────
export async function processTranscript(rawTranscript, targetLanguage = 'asl', contextHistory = []) {
  const languageNames = {
    asl: 'American Sign Language (ASL)',
    bsl: 'British Sign Language (BSL)',
    isl: 'Indian Sign Language (ISL)',
  };
  const langName = languageNames[targetLanguage] || 'ASL';
  const prompt = buildPrompt(rawTranscript, langName, contextHistory);

  // Try Groq first
  try {
    console.log('[LLM] Trying Groq (llama-3.3-70b)...');
    const text = await callGroq(prompt);
    const result = parseResponse(text, rawTranscript);
    console.log(`[LLM] ✅ Groq success | Topic: ${result.topic} | Tokens: ${result.signTokens.length}`);
    return result;
  } catch (err) {
    const isRateLimit = err.message?.includes('429') || err.message?.includes('rate') || err.message?.includes('quota');
    console.warn(`[LLM] Groq failed (${isRateLimit ? 'rate limit' : err.message}) — trying OpenRouter...`);
  }

  // Fallback to OpenRouter
  try {
    const text = await callOpenRouter(prompt);
    const result = parseResponse(text, rawTranscript);
    console.log(`[LLM] ✅ OpenRouter fallback success | Topic: ${result.topic}`);
    return result;
  } catch (err) {
    console.error('[LLM] Both providers failed:', err.message);
  }

  // Last resort: basic word split
  console.log('[LLM] ⚠️ Using word-split fallback');
  return {
    success: false,
    cleanedCaption: rawTranscript,
    signTokens: rawTranscript.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/).filter(Boolean),
    topic: 'General',
    confidence: 0.3,
  };
}