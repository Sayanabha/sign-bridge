// 📄 frontend/src/utils/handClassifier.js  — NEW FILE
// Maps MediaPipe 21-point hand landmarks to ASL letters and common signs

// ── Geometry helpers ──────────────────────────────────────────────────────────

function extended(landmarks, tip, pip) {
  return landmarks[tip].y < landmarks[pip].y;
}

function thumbExtended(landmarks) {
  return landmarks[4].x < landmarks[3].x;
}

function dist(a, b) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2);
}

function touching(landmarks, a, b, threshold = 0.07) {
  return dist(landmarks[a], landmarks[b]) < threshold;
}

function curled(landmarks, tip) {
  return dist(landmarks[tip], landmarks[0]) < 0.20;
}

function fingers(landmarks) {
  return {
    thumb:  thumbExtended(landmarks),
    index:  extended(landmarks, 8, 6),
    middle: extended(landmarks, 12, 10),
    ring:   extended(landmarks, 16, 14),
    pinky:  extended(landmarks, 20, 18),
  };
}

// ── ASL Letter Classifier ─────────────────────────────────────────────────────

export function classifyLetter(landmarks) {
  if (!landmarks || landmarks.length < 21) return null;

  const f = fingers(landmarks);
  const lm = landmarks;
  const indexMiddleGap = Math.abs(lm[8].x - lm[12].x);

  // A — fist, thumb beside index
  if (!f.index && !f.middle && !f.ring && !f.pinky) {
    if (lm[4].y > lm[3].y && lm[4].x < lm[3].x) return 'A';
  }

  // B — four fingers up, thumb folded
  if (!f.thumb && f.index && f.middle && f.ring && f.pinky) {
    if (indexMiddleGap < 0.04) return 'B';
  }

  // C — curved hand, gap between thumb and index
  if (!f.index && !f.middle && !f.ring && !f.pinky && !f.thumb) {
    const gap = dist(lm[4], lm[8]);
    if (gap > 0.08 && gap < 0.22) return 'C';
  }

  // D — index up, others curl to meet thumb
  if (f.index && !f.middle && !f.ring && !f.pinky) {
    if (touching(lm, 4, 12, 0.08)) return 'D';
  }

  // E — all fingers curled tight
  if (curled(lm, 8) && curled(lm, 12) && curled(lm, 16) && curled(lm, 20)) {
    return 'E';
  }

  // F — index and thumb touch, three extended
  if (touching(lm, 4, 8, 0.06) && f.middle && f.ring && f.pinky) return 'F';

  // G — index points sideways, thumb parallel
  if (f.index && !f.middle && !f.ring && !f.pinky && f.thumb) {
    if (Math.abs(lm[8].x - lm[5].x) > 0.10) return 'G';
  }

  // H — index and middle sideways together
  if (f.index && f.middle && !f.ring && !f.pinky && !f.thumb) {
    if (Math.abs(lm[8].x - lm[5].x) > 0.08 && indexMiddleGap < 0.05) return 'H';
  }

  // I — pinky only
  if (!f.thumb && !f.index && !f.middle && !f.ring && f.pinky) return 'I';

  // K — index and middle up, thumb up between them
  if (f.index && f.middle && !f.ring && !f.pinky && f.thumb) {
    if (!touching(lm, 4, 8, 0.08) && lm[4].y < lm[5].y) return 'K';
  }

  // L — index up, thumb out
  if (f.thumb && f.index && !f.middle && !f.ring && !f.pinky) return 'L';

  // M — three fingers over thumb
  if (!f.index && !f.middle && !f.ring && !f.pinky && !f.thumb) {
    if (lm[8].y > lm[5].y && lm[12].y > lm[9].y && lm[16].y > lm[13].y) return 'M';
  }

  // N — two fingers over thumb
  if (!f.index && !f.middle && !f.ring && !f.pinky && !f.thumb) {
    if (lm[8].y > lm[5].y && lm[12].y > lm[9].y && lm[16].y < lm[13].y) return 'N';
  }

  // O — fingertips meet thumb
  if (touching(lm, 4, 8, 0.07) && !f.middle && !f.ring && !f.pinky) return 'O';

  // P — index points down
  if (f.index && !f.middle && !f.ring && !f.pinky && f.thumb) {
    if (lm[8].y > lm[5].y) return 'P';
  }

  // R — index and middle crossed (very close)
  if (f.index && f.middle && !f.ring && !f.pinky && !f.thumb) {
    if (indexMiddleGap < 0.025) return 'R';
  }

  // S — fist, thumb over fingers
  if (!f.index && !f.middle && !f.ring && !f.pinky && f.thumb) {
    if (lm[4].y > lm[8].y) return 'S';
  }

  // T — thumb between index and middle
  if (!f.index && !f.middle && !f.ring && !f.pinky && f.thumb) {
    if (touching(lm, 4, 8, 0.09) && lm[4].y < lm[8].y) return 'T';
  }

  // U — index and middle up, close together
  if (!f.thumb && f.index && f.middle && !f.ring && !f.pinky) {
    if (indexMiddleGap < 0.04) return 'U';
  }

  // V — index and middle up, spread apart
  if (!f.thumb && f.index && f.middle && !f.ring && !f.pinky) {
    if (indexMiddleGap >= 0.04) return 'V';
  }

  // W — index, middle, ring up
  if (!f.thumb && f.index && f.middle && f.ring && !f.pinky) return 'W';

  // X — index hooked
  if (!f.thumb && !f.middle && !f.ring && !f.pinky) {
    const hooked = lm[8].y > lm[7].y && lm[8].y < lm[5].y;
    if (hooked) return 'X';
  }

  // Y — thumb and pinky out
  if (f.thumb && !f.index && !f.middle && !f.ring && f.pinky) return 'Y';

  // Z — index pointing forward
  if (!f.thumb && f.index && !f.middle && !f.ring && !f.pinky) return 'Z';

  return null;
}

// ── Common word signs ─────────────────────────────────────────────────────────

export function classifyWordSign(landmarks) {
  if (!landmarks || landmarks.length < 21) return null;

  const f = fingers(landmarks);
  const lm = landmarks;

  // HELLO — open hand raised near face
  if (f.thumb && f.index && f.middle && f.ring && f.pinky) {
    if (lm[0].y < 0.45) return 'HELLO';
  }

  // YES — closed fist at mid level
  if (!f.thumb && !f.index && !f.middle && !f.ring && !f.pinky) {
    if (lm[0].y > 0.55) return 'YES';
  }

  // ILY — thumb + index + pinky (I Love You)
  if (f.thumb && f.index && !f.middle && !f.ring && f.pinky) return 'ILY';

  // GOOD — thumbs up at chest
  if (f.thumb && !f.index && !f.middle && !f.ring && !f.pinky) {
    if (lm[0].y > 0.4 && lm[0].y < 0.7) return 'GOOD';
  }

  // STOP — flat hand, fingers together, low position
  if (!f.thumb && f.index && f.middle && f.ring && f.pinky) {
    if (lm[0].y > 0.5) return 'STOP';
  }

  // MORE — pinched fingers
  if (touching(lm, 4, 8) && touching(lm, 4, 12)) return 'MORE';

  // PLEASE — open hand at chest level
  if (f.thumb && f.index && f.middle && f.ring && f.pinky) {
    if (lm[0].y > 0.55 && lm[0].y < 0.75) return 'PLEASE';
  }

  return null;
}

// ── Stability Buffer ──────────────────────────────────────────────────────────
// Prevents flicker — requires same sign for N consecutive frames before confirming

export class StabilityBuffer {
  constructor({ requiredFrames = 10, cooldownFrames = 20 } = {}) {
    this.requiredFrames = requiredFrames;
    this.cooldownFrames = cooldownFrames;
    this.current = null;
    this.count = 0;
    this.lastConfirmed = null;
    this.cooldown = 0;
  }

  update(sign) {
    if (this.cooldown > 0) {
      this.cooldown--;
      return null;
    }

    if (sign === this.current) {
      this.count++;
    } else {
      this.current = sign;
      this.count = 1;
    }

    if (this.count >= this.requiredFrames && sign !== null) {
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
    return Math.min(this.count / this.requiredFrames, 1);
  }
}