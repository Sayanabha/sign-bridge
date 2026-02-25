
const FILLERS = new Set([
  'um', 'uh', 'er', 'ah', 'so', 'well', 'just', 'like',
  'okay', 'ok', 'right', 'now', 'then', 'also', 'very',
  'much', 'really', 'quite', 'rather', 'pretty', 'basically',
  'literally', 'actually', 'honestly', 'anyway', 'alright',
  'you know', 'i mean', 'kind of', 'sort of', 'a lot',
]);
const ARTICLES = new Set(['a', 'an', 'the']);

const COPULA = new Set([
  'is', 'are', 'was', 'were', 'am', 'be', 'been', 'being',
]);

const AUXILIARIES = new Set([
  'will', 'would', 'could', 'should', 'can', 'may', 'might',
  'shall', 'must', 'do', 'does', 'did', 'have', 'has', 'had',
  'going', 'to', 'then', 'now', 'when', 'that', 'this',
]);

const QUESTION_WORDS = new Set([
  'what', 'where', 'when', 'why', 'who', 'which', 'how',
]);

const CONTRACTIONS = {
  "don't":     'not',
  "doesnt":    'not',
  "doesn't":   'not',
  "didnt":     'not',
  "didn't":    'not',
  "cant":      'cannot',
  "can't":     'cannot',
  "cannot":    'cannot',
  "wont":      'not',
  "won't":     'not',
  "wouldnt":   'not',
  "wouldn't":  'not',
  "couldnt":   'not',
  "couldn't":  'not',
  "shouldnt":  'not',
  "shouldn't": 'not',
  "isnt":      'not',
  "isn't":     'not',
  "arent":     'not',
  "aren't":    'not',
  "wasnt":     'not',
  "wasn't":    'not',
  "werent":    'not',
  "weren't":   'not',
  "im":        'i',
  "i'm":       'i',
  "ive":       'i',
  "i've":      'i',
  "ill":       'i',
  "i'll":      'i',
  "id":        'i',
  "i'd":       'i',
  "hes":       'he',
  "he's":      'he',
  "shes":      'she',
  "she's":     'she',
  "its":       'it',
  "it's":      'it',
  "were":      'we',
  "we're":     'we',
  "theyre":    'they',
  "they're":   'they',
  "youre":     'you',
  "you're":    'you',
  "thats":     'that',
  "that's":    'that',
  "theres":    'there',
  "there's":   'there',
  "lets":      'let',
  "let's":     'let',
  "gonna":     'go',
  "gotta":     'have',
  "wanna":     'want',
  "kinda":     'kind',
  "sorta":     'sort',
};

const TOPIC_KEYWORDS = {
  Business:   ['meeting', 'project', 'deadline', 'client', 'budget', 'team', 'report', 'presentation', 'office', 'work', 'schedule', 'agenda'],
  Medical:    ['doctor', 'hospital', 'medicine', 'health', 'patient', 'treatment', 'symptom', 'diagnosis', 'nurse', 'pain', 'appointment'],
  Education:  ['student', 'teacher', 'class', 'school', 'lesson', 'homework', 'exam', 'university', 'lecture', 'study', 'course', 'grade'],
  Technology: ['computer', 'software', 'code', 'app', 'data', 'system', 'network', 'algorithm', 'programming', 'device', 'internet', 'ai'],
  Casual:     ['lunch', 'dinner', 'movie', 'weekend', 'friend', 'party', 'music', 'game', 'fun', 'holiday', 'travel', 'food'],
};
// ── Pipeline steps ────────────────────────────────────────────────────────────

function expandContractions(text) {
  let result = text.toLowerCase();
  for (const [contraction, expansion] of Object.entries(CONTRACTIONS)) {
    result = result.replace(new RegExp(`\\b${contraction}\\b`, 'gi'), expansion);
  }
  return result;
}

function tokenize(text) {
  return text
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/)
    .map(w => w.trim())
    .filter(Boolean);
}

const KEEP_SHORT = new Set(['no', 'not', 'yes', 'who', 'why', 'how', 'eat', 'sit', 'run', 'see', 'ask']);

function removeFillers(words) {
  return words.filter(w => w && !FILLERS.has(w) && (w.length > 3 || KEEP_SHORT.has(w)));
}

function removeArticles(words) {
  return words.filter(w => !ARTICLES.has(w));
}

function removeCopula(words) {
  return words.filter((w, i) => {
    if (!COPULA.has(w)) return true;
    if (words[i + 1] === 'not') return false;
    return false;
  });
}

function removeAuxiliaries(words) {
  return words.filter((w, i) => {
    if (!AUXILIARIES.has(w)) return true;
    if (words[i + 1] === 'not') return false;
    return false;
  });
}

function isQuestion(text) {
  return text.trim().endsWith('?') ||
    /^(what|where|when|why|who|which|how|is|are|was|were|do|does|did|can|could|will|would|should)\b/i.test(text.trim());
}

function reorderTopicComment(words, isQ) {
  if (!isQ) return words;
  const qWordIndex = words.findIndex(w => QUESTION_WORDS.has(w));
  if (qWordIndex === -1) return words;
  const qWord = words[qWordIndex];
  const rest = words.filter((_, i) => i !== qWordIndex);
  return [...rest, qWord];
}

function detectTopic(words) {
  const wordSet = new Set(words);
  for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    if (keywords.some(k => wordSet.has(k))) return topic;
  }
  return 'General';
}
function buildCleanedCaption(rawText) {
  // Keep sentence structure — only remove fillers and expand contractions
  let text = rawText.trim();

  // Expand contractions
  for (const [contraction, expansion] of Object.entries(CONTRACTIONS)) {
    text = text.replace(
      new RegExp(`\\b${contraction}\\b`, 'gi'),
      expansion
    );
  }

  // Remove filler words only
  for (const filler of FILLERS) {
    text = text.replace(new RegExp(`\\b${filler}\\b`, 'gi'), '');
  }

  // Clean up extra spaces
  text = text.replace(/\s+/g, ' ').trim();

  // Capitalize first letter
  return text.charAt(0).toUpperCase() + text.slice(1);
}
// ── Main export ───────────────────────────────────────────────────────────────

export function processTranscriptLocally(rawTranscript) {
  if (!rawTranscript?.trim()) {
    return { cleanedCaption: rawTranscript, signTokens: [], topic: 'General', confidence: 0 };
  }

  const questionDetected = isQuestion(rawTranscript);

  let words = tokenize(expandContractions(rawTranscript));
  words = removeFillers(words);
  words = removeArticles(words);
  words = removeCopula(words);
  words = removeAuxiliaries(words);
  words = reorderTopicComment(words, questionDetected);

  // Clean up
words = words.filter(w => w && w.length > 2);
// remove adjacent duplicates

  const topic = detectTopic(words);
 const cleanedCaption = words.length
  ? words.map((w, i) => i === 0 ? w.charAt(0).toUpperCase() + w.slice(1) : w).join(' ')
  : rawTranscript;

  return {
    cleanedCaption,
    signTokens: words,
    topic,
    confidence: questionDetected ? 0.82 : 0.91,
    isQuestion: questionDetected,
  };
}