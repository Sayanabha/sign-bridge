import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const dictionaries = {
  asl: JSON.parse(readFileSync(join(__dirname, 'dictionaries/asl.json'), 'utf-8')),
  bsl: JSON.parse(readFileSync(join(__dirname, 'dictionaries/bsl.json'), 'utf-8')),
  isl: JSON.parse(readFileSync(join(__dirname, 'dictionaries/isl.json'), 'utf-8')),
};

/**
 * Maps an array of sign tokens to video paths
 * @param {string[]} tokens - array of words/signs from Gemini
 * @param {string} language - 'asl' | 'bsl' | 'isl'
 * @returns {{ token: string, videoPath: string | null }[]}
 */
export function mapTokensToVideos(tokens, language = 'asl') {
  const dict = dictionaries[language] || dictionaries.asl;

  return tokens.map((token) => {
    const key = token.toLowerCase().trim();
    const videoFile = dict[key] || null;

    return {
      token,
      videoPath: videoFile ? `/signs/${language}/${videoFile}` : null,
      hasVideo: !!videoFile,
    };
  });
}

export function getAvailableSigns(language = 'asl') {
  return Object.keys(dictionaries[language] || dictionaries.asl);
}