// 📄 frontend/src/utils/handClassifier.js  — DAY 2 REBUILD
// Improvements:
//   - Confidence scoring (0-1) per classification
//   - Better disambiguation for similar shapes (U/V, M/N, S/A/T, R/U, D/G)
//   - Per-letter required frame thresholds (ambiguous = more frames needed)
//   - Reject detections below confidence threshold before entering buffer

// ── Geometry helpers ──────────────────────────────────────────────────────────

function extended(lm, tip, pip) {
  return lm[tip].y < lm[pip].y;
}

function thumbExtended(lm) {
  // Right hand: thumb tip is to the left of thumb IP joint
  return lm[4].x < lm[3].x;
}

function dist(a, b) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2);
}

function touching(lm, a, b, threshold = 0.07) {
  return dist(lm[a], lm[b]) < threshold;
}

function curled(lm, tip) {
  return dist(lm[tip], lm[0]) < 0.20;
}

function fingers(lm) {
  return {
    thumb:  thumbExtended(lm),
    index:  extended(lm, 8, 6),
    middle: extended(lm, 12, 10),
    ring:   extended(lm, 16, 14),
    pinky:  extended(lm, 20, 18),
  };
}

// How far a tip is ABOVE its pip (positive = extended, negative = curled)
function extensionAmount(lm, tip, pip) {
  return lm[pip].y - lm[tip].y;
}

// Angle between three points (in radians)
function angle(a, b, c) {
  const ab = { x: a.x - b.x, y: a.y - b.y };
  const cb = { x: c.x - b.x, y: c.y - b.y };
  const dot = ab.x * cb.x + ab.y * cb.y;
  const cross = Math.abs(ab.x * cb.y - ab.y * cb.x);
  return Math.atan2(cross, dot);
}

// ── Per-letter frame requirements ─────────────────────────────────────────────
// Letters that are easily confused require more frames to confirm
// Letters that are highly distinctive confirm faster

export const LETTER_FRAME_REQUIREMENTS = {
  // Easy, distinctive shapes — confirm faster
  'B': 7,  'I': 7,  'L': 7,  'W': 7,  'Y': 7,

  // Moderate confidence needed
  'A': 10, 'C': 10, 'D': 10, 'E': 10, 'F': 10,
  'G': 10, 'H': 10, 'K': 10, 'O': 10, 'P': 10,
  'Q': 10, 'X': 10, 'Z': 10,

  // Ambiguous pairs — require more frames
  'U': 14, 'V': 14,  // U vs V differs only by finger gap
  'M': 16, 'N': 16,  // M vs N differs by one finger over thumb
  'S': 16, 'T': 16,  // S vs T: thumb position is subtle
  'R': 14,           // R vs U: crossed vs uncrossed
};

export const DEFAULT_FRAME_REQUIREMENT = 10;

// ── Result type ───────────────────────────────────────────────────────────────
// { letter, confidence, reason }
// confidence: 0-1 (1 = perfect match, 0 = no match)
// reason: human-readable explanation for debugging

function result(letter, confidence, reason = '') {
  return { letter, confidence, reason };
}

const NO_MATCH = result(null, 0, 'no match');

// ── Main classifier with confidence ──────────────────────────────────────────

export function classifyLetterWithConfidence(lm) {
  if (!lm || lm.length < 21) return NO_MATCH;

  const f = fingers(lm);
  const indexMiddleGap  = Math.abs(lm[8].x - lm[12].x);
  const thumbIndexDist  = dist(lm[4], lm[8]);
  const thumbMiddleDist = dist(lm[4], lm[12]);
  const thumbPinkyDist  = dist(lm[4], lm[20]);

  // ── B — four fingers up, close together, thumb folded ────────────────────
  if (!f.thumb && f.index && f.middle && f.ring && f.pinky) {
    const fingersTogether = indexMiddleGap < 0.04;
    const allHighUp = extensionAmount(lm, 8, 6) > 0.05 &&
                      extensionAmount(lm, 12, 10) > 0.05;
    if (fingersTogether && allHighUp) return result('B', 0.95, 'four fingers up close');
    if (fingersTogether) return result('B', 0.80, 'four fingers up');
    return result('B', 0.60, 'four fingers up spread');
  }

  // ── I — pinky only up ─────────────────────────────────────────────────────
  if (!f.thumb && !f.index && !f.middle && !f.ring && f.pinky) {
    const pinkyHigh = extensionAmount(lm, 20, 18) > 0.06;
    const othersDown = curled(lm, 8) && curled(lm, 12);
    if (pinkyHigh && othersDown) return result('I', 0.95, 'pinky only, others curled');
    if (pinkyHigh) return result('I', 0.80, 'pinky only');
    return result('I', 0.65, 'pinky mostly up');
  }

  // ── L — thumb and index only, classic L shape ─────────────────────────────
  if (f.thumb && f.index && !f.middle && !f.ring && !f.pinky) {
    const thumbOut  = extensionAmount(lm, 4, 3) < -0.03; // thumb pointing sideways
    const indexUp   = extensionAmount(lm, 8, 6) > 0.06;
    const rightAngle = Math.abs(angle(lm[8], lm[5], lm[4]) - Math.PI / 2) < 0.4;
    if (thumbOut && indexUp) return result('L', 0.95, 'L shape');
    if (indexUp) return result('L', 0.78, 'index up thumb out');
    return result('L', 0.60, 'partial L');
  }

  // ── Y — thumb and pinky only ──────────────────────────────────────────────
  if (f.thumb && !f.index && !f.middle && !f.ring && f.pinky) {
    const bothExtended = extensionAmount(lm, 20, 18) > 0.05;
    const spread = thumbPinkyDist > 0.18;
    if (bothExtended && spread) return result('Y', 0.93, 'thumb and pinky spread');
    if (bothExtended) return result('Y', 0.78, 'thumb and pinky');
    return result('Y', 0.62, 'partial Y');
  }

  // ── W — index, middle, ring up ────────────────────────────────────────────
  if (!f.thumb && f.index && f.middle && f.ring && !f.pinky) {
    const spread = Math.abs(lm[8].x - lm[16].x) > 0.06;
    if (spread) return result('W', 0.90, 'three fingers spread');
    return result('W', 0.72, 'three fingers');
  }

  // ── F — index+thumb touch, middle/ring/pinky up ───────────────────────────
  if (touching(lm, 4, 8, 0.06) && f.middle && f.ring && f.pinky) {
    const pinch = dist(lm[4], lm[8]);
    const conf = pinch < 0.04 ? 0.92 : pinch < 0.06 ? 0.80 : 0.65;
    return result('F', conf, `pinch dist ${pinch.toFixed(3)}`);
  }

  // ── U vs V disambiguation ─────────────────────────────────────────────────
  if (!f.thumb && f.index && f.middle && !f.ring && !f.pinky) {
    const gap = indexMiddleGap;
    const bothHigh = extensionAmount(lm, 8, 6) > 0.05 &&
                     extensionAmount(lm, 12, 10) > 0.05;

    if (gap < 0.025) {
      // R — could be crossed
      const crossed = lm[8].x < lm[12].x; // index crosses over middle
      if (crossed) return result('R', 0.82, 'index crosses middle');
      return result('U', bothHigh ? 0.85 : 0.70, 'two fingers very close');
    }
    if (gap < 0.05) {
      return result('U', bothHigh ? 0.80 : 0.65, `gap ${gap.toFixed(3)} — U range`);
    }
    // Spread = V
    return result('V', bothHigh ? 0.88 : 0.72, `gap ${gap.toFixed(3)} — V range`);
  }

  // ── K — index+middle+thumb, thumb pointing up between them ───────────────
  if (f.index && f.middle && !f.ring && !f.pinky && f.thumb) {
    const thumbBetween = lm[4].x > Math.min(lm[8].x, lm[12].x) &&
                         lm[4].x < Math.max(lm[8].x, lm[12].x);
    const thumbUp = lm[4].y < lm[5].y;
    if (thumbBetween && thumbUp) return result('K', 0.88, 'thumb between index+middle');
    return result('K', 0.68, 'index+middle+thumb');
  }

  // ── A vs S vs M vs N vs T vs E ────────────────────────────────────────────
  if (!f.index && !f.middle && !f.ring && !f.pinky) {
    const allFingersDown = curled(lm, 8) && curled(lm, 12) &&
                           curled(lm, 16) && curled(lm, 20);

    // E — all fingers curled very tight, thumb tucked
    if (allFingersDown && !f.thumb) {
      const veryTight = dist(lm[8], lm[0]) < 0.14 && dist(lm[12], lm[0]) < 0.14;
      if (veryTight) return result('E', 0.85, 'all tight curled');
      return result('E', 0.68, 'all curled');
    }

    if (f.thumb) {
      const thumbOverIndex = lm[4].y > lm[8].y;
      const thumbTouchIndex = touching(lm, 4, 8, 0.09);
      const thumbSide = lm[4].x < lm[3].x;

      // T — thumb tucked between index and middle (tip above index tip)
      if (thumbTouchIndex && !thumbOverIndex) {
        return result('T', 0.80, 'thumb touches index from below');
      }

      // S — thumb over fingers, crossing them
      if (thumbOverIndex && lm[4].x > lm[8].x) {
        return result('S', 0.82, 'thumb over curled fingers');
      }

      // A — thumb beside index, not over, pointing up
      if (thumbSide && lm[4].y < lm[8].y) {
        return result('A', 0.80, 'thumb beside index');
      }

      // M — three fingers folded over thumb
      if (lm[8].y > lm[5].y && lm[12].y > lm[9].y && lm[16].y > lm[13].y) {
        return result('M', 0.78, 'three fingers over thumb');
      }

      // N — two fingers over thumb
      if (lm[8].y > lm[5].y && lm[12].y > lm[9].y) {
        return result('N', 0.75, 'two fingers over thumb');
      }

      return result('A', 0.55, 'fist with thumb — defaulting A');
    }

    // M vs N without thumb
    if (lm[8].y > lm[5].y && lm[12].y > lm[9].y && lm[16].y > lm[13].y) {
      return result('M', 0.72, 'three fingers folded');
    }
    if (lm[8].y > lm[5].y && lm[12].y > lm[9].y) {
      return result('N', 0.70, 'two fingers folded');
    }
  }

  // ── C — curved open hand ──────────────────────────────────────────────────
  if (!f.index && !f.middle && !f.ring && !f.pinky && !f.thumb) {
    const gap = dist(lm[4], lm[8]);
    if (gap > 0.08 && gap < 0.22) {
      const conf = gap > 0.10 && gap < 0.18 ? 0.85 : 0.70;
      return result('C', conf, `thumb-index gap ${gap.toFixed(3)}`);
    }
  }

  // ── O — fingertips pinch to thumb ─────────────────────────────────────────
  if (touching(lm, 4, 8, 0.07) && !f.middle && !f.ring && !f.pinky) {
    const pinch = dist(lm[4], lm[8]);
    const conf = pinch < 0.04 ? 0.90 : pinch < 0.07 ? 0.78 : 0.62;
    return result('O', conf, `O pinch ${pinch.toFixed(3)}`);
  }

  // ── D — index up, others touch thumb ─────────────────────────────────────
  if (f.index && !f.middle && !f.ring && !f.pinky) {
    if (touching(lm, 4, 12, 0.08)) {
      const indexHigh = extensionAmount(lm, 8, 6) > 0.06;
      return result('D', indexHigh ? 0.85 : 0.70, 'index up, others to thumb');
    }
    // Could be Z (index pointing, no thumb contact)
    if (!f.thumb) return result('Z', 0.65, 'index only pointing');
  }

  // ── G — index points sideways ─────────────────────────────────────────────
  if (f.index && !f.middle && !f.ring && !f.pinky && f.thumb) {
    const sideways = Math.abs(lm[8].x - lm[5].x) > 0.10;
    const pointingDown = lm[8].y > lm[5].y;
    if (sideways && !pointingDown) return result('G', 0.82, 'index sideways');
    if (pointingDown) return result('P', 0.78, 'index pointing down');
  }

  // ── H — index and middle sideways together ────────────────────────────────
  if (f.index && f.middle && !f.ring && !f.pinky && !f.thumb) {
    const sideways = Math.abs(lm[8].x - lm[5].x) > 0.08;
    const together = indexMiddleGap < 0.05;
    if (sideways && together) return result('H', 0.83, 'two fingers sideways');
  }

  // ── X — index hooked ─────────────────────────────────────────────────────
  if (!f.thumb && !f.middle && !f.ring && !f.pinky) {
    const hooked = lm[8].y > lm[7].y && lm[8].y < lm[5].y;
    if (hooked) return result('X', 0.78, 'index hooked');
  }

  return NO_MATCH;
}

// ── Convenience wrapper (returns just the letter string) ─────────────────────

export function classifyLetter(lm) {
  const { letter, confidence } = classifyLetterWithConfidence(lm);
  return confidence >= 0.65 ? letter : null;
}

// ── Common word signs (unchanged from Day 1) ──────────────────────────────────

export function classifyWordSign(lm) {
  if (!lm || lm.length < 21) return null;

  const f = fingers(lm);

  if (f.thumb && f.index && !f.middle && !f.ring && f.pinky) return 'ILY';

  if (f.thumb && f.index && f.middle && f.ring && f.pinky) {
    if (lm[0].y < 0.45) return 'HELLO';
    if (lm[0].y > 0.55 && lm[0].y < 0.75) return 'PLEASE';
  }

  if (!f.thumb && !f.index && !f.middle && !f.ring && !f.pinky) {
    if (lm[0].y > 0.55) return 'YES';
  }

  if (f.thumb && !f.index && !f.middle && !f.ring && !f.pinky) {
    if (lm[0].y > 0.4 && lm[0].y < 0.7) return 'GOOD';
  }

  if (!f.thumb && f.index && f.middle && f.ring && f.pinky) {
    if (lm[0].y > 0.5) return 'STOP';
  }

  if (touching(lm, 4, 8) && touching(lm, 4, 12)) return 'MORE';

  return null;
}

// ── Stability Buffer ──────────────────────────────────────────────────────────

export class StabilityBuffer {
  constructor({ requiredFrames = 10, cooldownFrames = 20 } = {}) {
    this.defaultRequired = requiredFrames;
    this.cooldownFrames  = cooldownFrames;
    this.current         = null;
    this.count           = 0;
    this.lastConfirmed   = null;
    this.cooldown        = 0;
  }

  // How many frames does this sign need?
  _required(sign) {
    if (!sign) return this.defaultRequired;
    return LETTER_FRAME_REQUIREMENTS[sign] ?? this.defaultRequired;
  }

  update(sign, confidence = 1.0) {
    if (this.cooldown > 0) {
      this.cooldown--;
      return null;
    }

    // Reject low confidence detections outright
    if (sign !== null && confidence < 0.65) {
      this.current = null;
      this.count = 0;
      return null;
    }

    if (sign === this.current) {
      this.count++;
    } else {
      this.current = sign;
      this.count = 1;
    }

    const required = this._required(sign);

    if (this.count >= required && sign !== null) {
      if (sign !== this.lastConfirmed) {
        this.lastConfirmed = sign;
        this.count = 0;
        this.cooldown = this.cooldownFrames;
        return sign;
      }
    }

    return null;
  }

  reset() {
    this.current = null;
    this.count = 0;
    this.lastConfirmed = null;
    this.cooldown = 0;
  }

  get progress() {
    if (!this.current || this.count === 0) return 0;
    return Math.min(this.count / this._required(this.current), 1);
  }

  get currentRequired() {
    return this._required(this.current);
  }
}