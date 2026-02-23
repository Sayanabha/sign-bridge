import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

/**
 * Groq Whisper  → speech to text        (handled in server.js)
 * Gemini Flash  → sign grammar tokens   (handled here)
 */
export async function processTranscript(rawTranscript, targetLanguage = 'asl', contextHistory = []) {
  const languageNames = {
    asl: 'American Sign Language (ASL)',
    bsl: 'British Sign Language (BSL)',
    isl: 'Indian Sign Language (ISL)',
  };
  const langName = languageNames[targetLanguage] || 'ASL';

  const contextStr = contextHistory.length > 0
    ? `Previous context:\n${contextHistory.map((c, i) => `${i + 1}. "${c}"`).join('\n')}\n\n`
    : '';

  const prompt = `${contextStr}You are a real-time sign language interpreter.

INPUT: "${rawTranscript}"
TARGET: ${langName}

Rules:
- Topic-comment structure (object before action)
- Drop articles (a, the)
- Drop copula (is, are, was, were)
- Keep only content words
- Example: "The meeting will start soon" → ["meeting", "start", "soon"]

Respond ONLY with valid JSON, no markdown, no explanation:
{
  "cleanedCaption": "natural cleaned sentence here",
  "signTokens": ["word1", "word2", "word3"],
  "topic": "one of: General / Business / Medical / Education / Technology / Casual",
  "confidence": 0.95
}`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim()
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    const parsed = JSON.parse(text);
    console.log(`[Gemini] Topic: ${parsed.topic} | Tokens: ${parsed.signTokens?.length}`);

    return {
      success: true,
      cleanedCaption: parsed.cleanedCaption || rawTranscript,
      signTokens: (parsed.signTokens || []).map(t => t.toLowerCase()),
      topic: parsed.topic || 'General',
      confidence: parsed.confidence || 0.9,
    };

  } catch (err) {
    console.error('[Gemini] Error:', err.message);
    return {
      success: false,
      cleanedCaption: rawTranscript,
      signTokens: rawTranscript
        .toLowerCase()
        .replace(/[^a-z\s]/g, '')
        .split(/\s+/)
        .filter(Boolean),
      topic: 'General',
      confidence: 0.3,
    };
  }
}