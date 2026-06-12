// 📄 frontend/src/utils/LetterRecognizer.js  — NEW FILE
// Analyzes a normalized trail of points (0-1 range) and returns the most likely letter
// Uses directional features — no ML needed, works well for block capitals

// ── Normalize trail to 0-1 bounding box ──────────────────────────────────────

export function normalizeTrail(points) {
  if (points.length < 2) return points;

  const xs = points.map(p => p.x);
  const ys = points.map(p => p.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;

  return points.map(p => ({
    x: (p.x - minX) / rangeX,
    y: (p.y - minY) / rangeY,
  }));
}

// ── Resample trail to fixed number of points ──────────────────────────────────

export function resampleTrail(points, n = 32) {
  if (points.length < 2) return points;

  // Total path length
  let totalLength = 0;
  for (let i = 1; i < points.length; i++) {
    totalLength += dist(points[i - 1], points[i]);
  }

  const interval = totalLength / (n - 1);
  const resampled = [points[0]];
  let accumulated = 0;
  let i = 1;

  while (resampled.length < n && i < points.length) {
    const d = dist(points[i - 1], points[i]);
    if (accumulated + d >= interval) {
      const t = (interval - accumulated) / d;
      const newPoint = {
        x: points[i - 1].x + t * (points[i].x - points[i - 1].x),
        y: points[i - 1].y + t * (points[i].y - points[i - 1].y),
      };
      resampled.push(newPoint);
      points = [newPoint, ...points.slice(i)];
      i = 1;
      accumulated = 0;
    } else {
      accumulated += d;
      i++;
    }
  }

  while (resampled.length < n) resampled.push(points[points.length - 1]);
  return resampled;
}

function dist(a, b) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

// ── Extract directional features from trail ───────────────────────────────────

function getFeatures(points) {
  const n = normalizeTrail(resampleTrail(points, 32));

  // Direction chain — 8 directions (N NE E SE S SW W NW)
  const dirs = [];
  for (let i = 1; i < n.length; i++) {
    const dx = n[i].x - n[i-1].x;
    const dy = n[i].y - n[i-1].y;
    const angle = Math.atan2(dy, dx);
    const dir = Math.round((angle + Math.PI) / (Math.PI / 4)) % 8;
    dirs.push(dir);
  }

  // Aspect ratio of bounding box
  const xs = points.map(p => p.x);
  const ys = points.map(p => p.y);
  const w = Math.max(...xs) - Math.min(...xs);
  const h = Math.max(...ys) - Math.min(...ys);
  const aspect = w / (h || 1);

  // Start and end points (normalized)
  const start = n[0];
  const end   = n[n.length - 1];

  // Horizontal/vertical stroke counts
  const hStrokes = dirs.filter(d => d === 0 || d === 4).length;
  const vStrokes = dirs.filter(d => d === 2 || d === 6).length;
  const diagStrokes = dirs.filter(d => d === 1 || d === 3 || d === 5 || d === 7).length;

  // Does the trail close (start ≈ end)?
  const closes = dist(start, end) < 0.25;

  // Crossings — count times trail crosses its own midpoint
  const midX = 0.5, midY = 0.5;
  let crossingsH = 0, crossingsV = 0;
  for (let i = 1; i < n.length; i++) {
    if ((n[i-1].y - midY) * (n[i].y - midY) < 0) crossingsH++;
    if ((n[i-1].x - midX) * (n[i].x - midX) < 0) crossingsV++;
  }

  // Direction changes (sharp turns)
  let turns = 0;
  for (let i = 1; i < dirs.length; i++) {
    const diff = Math.abs(dirs[i] - dirs[i-1]);
    if (diff > 2 && diff < 6) turns++;
  }

  return {
    dirs, aspect, start, end,
    hStrokes, vStrokes, diagStrokes,
    closes, crossingsH, crossingsV, turns,
    n, // normalized resampled points
  };
}

// ── Letter templates (directional patterns) ───────────────────────────────────
// Each letter has a scoring function that returns 0-1

const LETTER_SCORERS = {

  'A': f => {
    // Two diagonals meeting at top, horizontal crossbar
    const hasDiag = f.diagStrokes > 10;
    const hasH = f.hStrokes > 3;
    const tallAspect = f.aspect < 0.8;
    return score([hasDiag, hasH, tallAspect], [0.4, 0.3, 0.3]);
  },

  'B': f => {
    // Vertical stroke + two bumps going right
    const hasV = f.vStrokes > 8;
    const goesRight = f.n.some(p => p.x > 0.7);
    const tallAspect = f.aspect < 0.8;
    return score([hasV, goesRight, tallAspect], [0.4, 0.4, 0.2]);
  },

  'C': f => {
    // Curved left-open shape, starts top right ends bottom right
    const wideAspect = f.aspect > 0.5;
    const startRight = f.start.x > 0.5;
    const endRight = f.end.x > 0.5;
    const notClosed = !f.closes;
    return score([wideAspect, startRight, endRight, notClosed], [0.2, 0.3, 0.3, 0.2]);
  },

  'D': f => {
    // Vertical stroke + rightward bump
    const hasV = f.vStrokes > 8;
    const goesRight = f.n.some(p => p.x > 0.65);
    const closes = f.closes || dist(f.start, f.end) < 0.35;
    return score([hasV, goesRight, closes], [0.4, 0.35, 0.25]);
  },

  'E': f => {
    // Three horizontal strokes, vertical on left
    const hasH = f.hStrokes > 8;
    const hasV = f.vStrokes > 4;
    const startLeft = f.start.x < 0.3;
    return score([hasH, hasV, startLeft], [0.5, 0.3, 0.2]);
  },

  'F': f => {
    // Two horizontal strokes + vertical, open bottom
    const hasH = f.hStrokes > 6;
    const hasV = f.vStrokes > 4;
    const endsLow = f.end.y > 0.6;
    return score([hasH, hasV, endsLow], [0.4, 0.35, 0.25]);
  },

  'G': f => {
    // Like C but with horizontal inward at middle
    const wideAspect = f.aspect > 0.5;
    const startRight = f.start.x > 0.5;
    const hasH = f.hStrokes > 4;
    return score([wideAspect, startRight, hasH], [0.3, 0.35, 0.35]);
  },

  'H': f => {
    // Two verticals + horizontal crossbar
    const hasV = f.vStrokes > 8;
    const hasH = f.hStrokes > 4;
    const crossingsMid = f.crossingsH > 1;
    return score([hasV, hasH, crossingsMid], [0.4, 0.35, 0.25]);
  },

  'I': f => {
    // Single vertical stroke (possibly with serifs)
    const hasV = f.vStrokes > 12;
    const narrowAspect = f.aspect < 0.4;
    const fewTurns = f.turns < 4;
    return score([hasV, narrowAspect, fewTurns], [0.5, 0.3, 0.2]);
  },

  'J': f => {
    // Vertical down then curve left at bottom
    const hasV = f.vStrokes > 8;
    const endsLeft = f.end.x < 0.4;
    const startTop = f.start.y < 0.3;
    return score([hasV, endsLeft, startTop], [0.4, 0.35, 0.25]);
  },

  'K': f => {
    // Vertical + two diagonals (< shape)
    const hasV = f.vStrokes > 6;
    const hasDiag = f.diagStrokes > 8;
    const turns = f.turns > 2;
    return score([hasV, hasDiag, turns], [0.4, 0.35, 0.25]);
  },

  'L': f => {
    // Vertical down + horizontal right at bottom
    const hasV = f.vStrokes > 6;
    const hasH = f.hStrokes > 6;
    const endsRight = f.end.x > 0.6;
    const startsTop = f.start.y < 0.3;
    return score([hasV, hasH, endsRight, startsTop], [0.35, 0.3, 0.2, 0.15]);
  },

  'M': f => {
    // Two peaks going down
    const hasDiag = f.diagStrokes > 10;
    const hasV = f.vStrokes > 6;
    const wideAspect = f.aspect > 0.8;
    return score([hasDiag, hasV, wideAspect], [0.4, 0.35, 0.25]);
  },

  'N': f => {
    // Two verticals + diagonal
    const hasV = f.vStrokes > 8;
    const hasDiag = f.diagStrokes > 6;
    const wideAspect = f.aspect > 0.6;
    return score([hasV, hasDiag, wideAspect], [0.45, 0.35, 0.2]);
  },

  'O': f => {
    // Closed oval
    const closes = f.closes;
    const wideAspect = f.aspect > 0.5 && f.aspect < 1.5;
    const crossH = f.crossingsH > 1;
    const crossV = f.crossingsV > 1;
    return score([closes, wideAspect, crossH, crossV], [0.4, 0.2, 0.2, 0.2]);
  },

  'P': f => {
    // Vertical + bump on upper right
    const hasV = f.vStrokes > 8;
    const goesRight = f.n.some(p => p.x > 0.65);
    const endsLow = f.end.y > 0.5;
    return score([hasV, goesRight, endsLow], [0.45, 0.35, 0.2]);
  },

  'Q': f => {
    // O with a tail going bottom right
    const closes = f.closes || f.crossingsH > 1;
    const tailRight = f.end.x > 0.6 && f.end.y > 0.6;
    return score([closes, tailRight], [0.5, 0.5]);
  },

  'R': f => {
    // P with a diagonal leg at bottom
    const hasV = f.vStrokes > 6;
    const hasDiag = f.diagStrokes > 6;
    const goesRight = f.n.some(p => p.x > 0.65);
    return score([hasV, hasDiag, goesRight], [0.4, 0.35, 0.25]);
  },

  'S': f => {
    // S curve — direction changes twice
    const turns = f.turns > 3;
    const crossH = f.crossingsH > 1;
    const notClosed = !f.closes;
    return score([turns, crossH, notClosed], [0.4, 0.4, 0.2]);
  },

  'T': f => {
    // Vertical + horizontal crossbar at top
    const hasV = f.vStrokes > 8;
    const hasH = f.hStrokes > 6;
    const crossTop = f.n.some(p => p.y < 0.2 && p.x > 0.7);
    return score([hasV, hasH, crossTop], [0.4, 0.35, 0.25]);
  },

  'U': f => {
    // Two verticals + curve at bottom
    const hasV = f.vStrokes > 8;
    const wideAspect = f.aspect > 0.5;
    const bottomCurve = f.n.some(p => p.y > 0.8);
    return score([hasV, wideAspect, bottomCurve], [0.4, 0.3, 0.3]);
  },

  'V': f => {
    // Two diagonals meeting at bottom
    const hasDiag = f.diagStrokes > 12;
    const bottomMeet = f.n.some(p => p.y > 0.8 && p.x > 0.3 && p.x < 0.7);
    const wideAspect = f.aspect > 0.6;
    return score([hasDiag, bottomMeet, wideAspect], [0.4, 0.35, 0.25]);
  },

  'W': f => {
    // Three peaks going down
    const hasDiag = f.diagStrokes > 12;
    const wideAspect = f.aspect > 1.0;
    const turns = f.turns > 3;
    return score([hasDiag, wideAspect, turns], [0.4, 0.35, 0.25]);
  },

  'X': f => {
    // Two crossing diagonals
    const hasDiag = f.diagStrokes > 12;
    const crossH = f.crossingsH > 0;
    const crossV = f.crossingsV > 0;
    return score([hasDiag, crossH, crossV], [0.4, 0.3, 0.3]);
  },

  'Y': f => {
    // Two diagonals meeting mid + vertical down
    const hasDiag = f.diagStrokes > 8;
    const hasV = f.vStrokes > 6;
    const endsBottom = f.end.y > 0.7;
    return score([hasDiag, hasV, endsBottom], [0.4, 0.35, 0.25]);
  },

  'Z': f => {
    // Horizontal top + diagonal + horizontal bottom
    const hasH = f.hStrokes > 8;
    const hasDiag = f.diagStrokes > 6;
    const startTop = f.start.y < 0.3;
    const endsBottom = f.end.y > 0.7;
    return score([hasH, hasDiag, startTop, endsBottom], [0.3, 0.3, 0.2, 0.2]);
  },
};

// ── Score helper ──────────────────────────────────────────────────────────────
function score(conditions, weights) {
  let total = 0;
  conditions.forEach((c, i) => { if (c) total += weights[i]; });
  return total;
}

// ── Main recognizer ───────────────────────────────────────────────────────────

export function recognizeLetter(rawPoints) {
  if (!rawPoints || rawPoints.length < 5) return null;

  const features = getFeatures(rawPoints);
  let best = null;
  let bestScore = 0.35; // minimum confidence threshold

  for (const [letter, scorer] of Object.entries(LETTER_SCORERS)) {
    const s = scorer(features);
    if (s > bestScore) {
      bestScore = s;
      best = letter;
    }
  }

  return best ? { letter: best, confidence: bestScore } : null;
}