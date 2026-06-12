// 📄 frontend/src/three/HandPoseData.js  — NEW FILE
// Bone rotation values for each sign
// Each finger has 3 joints: base (MCP), middle (PIP), tip (DIP)
// Values are in radians — positive = curl toward palm

// ── Finger curl presets ───────────────────────────────────────────────────────
const STRAIGHT = [0,    0,    0   ];   // fully extended
const HALF     = [0.6,  0.5,  0.4 ];   // half curled
const CURLED   = [1.4,  1.3,  1.1 ];   // fully curled into fist
const HOOKED   = [0.4,  1.2,  0   ];   // bent at middle joint (X shape)
const PINCHED  = [0.8,  1.0,  0.8 ];   // pinched toward thumb

// Thumb curls differently — just base + tip
const THUMB_OUT  = [0,   0  ];
const THUMB_HALF = [0.4, 0.3];
const THUMB_IN   = [0.8, 0.6];

// ── Wrist pose presets ────────────────────────────────────────────────────────
const WRIST_NEUTRAL  = { x: 0,     y: 0,    z: 0    };
const WRIST_BACK     = { x: -0.3,  y: 0,    z: 0    };
const WRIST_FORWARD  = { x: 0.3,   y: 0,    z: 0    };
const WRIST_TILT_L   = { x: 0,     y: 0,    z: 0.3  };
const WRIST_TILT_R   = { x: 0,     y: 0,    z: -0.3 };

// ── Spread values (finger splay on x axis) ────────────────────────────────────
// [index, middle, ring, pinky] spread from center — positive = away from center
const SPREAD_NONE    = [0,     0,     0,     0    ];
const SPREAD_SLIGHT  = [0.08,  0,     0,     0.08 ];
const SPREAD_V       = [0.18,  0,     0,     0    ]; // V sign spread
const SPREAD_W       = [0.14,  0.07,  0.07,  0    ]; // W sign spread
const SPREAD_ALL     = [0.12,  0.04,  0.04,  0.12 ]; // open hand

// ── Pose builder ─────────────────────────────────────────────────────────────

function pose(thumb, index, middle, ring, pinky, wrist = WRIST_NEUTRAL, spread = SPREAD_NONE) {
  return { thumb, index, middle, ring, pinky, wrist, spread };
}

// ── Sign pose library ─────────────────────────────────────────────────────────

export const SIGN_POSES = {

  // ── Alphabet ──────────────────────────────────────────────────────────────

  'A': pose(THUMB_HALF, CURLED,   CURLED,   CURLED,   CURLED,   WRIST_NEUTRAL, SPREAD_NONE),
  'B': pose(THUMB_IN,   STRAIGHT, STRAIGHT, STRAIGHT, STRAIGHT, WRIST_NEUTRAL, SPREAD_NONE),
  'C': pose(THUMB_HALF, HALF,     HALF,     HALF,     HALF,     WRIST_NEUTRAL, SPREAD_SLIGHT),
  'D': pose(THUMB_HALF, STRAIGHT, CURLED,   CURLED,   CURLED,   WRIST_NEUTRAL, SPREAD_NONE),
  'E': pose(THUMB_IN,   CURLED,   CURLED,   CURLED,   CURLED,   WRIST_NEUTRAL, SPREAD_NONE),
  'F': pose(THUMB_HALF, PINCHED,  STRAIGHT, STRAIGHT, STRAIGHT, WRIST_NEUTRAL, SPREAD_NONE),
  'G': pose(THUMB_HALF, STRAIGHT, CURLED,   CURLED,   CURLED,   WRIST_TILT_L,  SPREAD_NONE),
  'H': pose(THUMB_IN,   STRAIGHT, STRAIGHT, CURLED,   CURLED,   WRIST_TILT_L,  SPREAD_NONE),
  'I': pose(THUMB_IN,   CURLED,   CURLED,   CURLED,   STRAIGHT, WRIST_NEUTRAL, SPREAD_NONE),
  'K': pose(THUMB_HALF, STRAIGHT, STRAIGHT, CURLED,   CURLED,   WRIST_NEUTRAL, SPREAD_V),
  'L': pose(THUMB_OUT,  STRAIGHT, CURLED,   CURLED,   CURLED,   WRIST_NEUTRAL, SPREAD_NONE),
  'M': pose(THUMB_IN,   CURLED,   CURLED,   CURLED,   CURLED,   WRIST_FORWARD, SPREAD_NONE),
  'N': pose(THUMB_IN,   CURLED,   CURLED,   CURLED,   CURLED,   WRIST_NEUTRAL, SPREAD_NONE),
  'O': pose(THUMB_HALF, PINCHED,  PINCHED,  PINCHED,  PINCHED,  WRIST_NEUTRAL, SPREAD_NONE),
  'P': pose(THUMB_HALF, STRAIGHT, CURLED,   CURLED,   CURLED,   WRIST_BACK,    SPREAD_NONE),
  'R': pose(THUMB_IN,   STRAIGHT, STRAIGHT, CURLED,   CURLED,   WRIST_NEUTRAL, [0.04, -0.04, 0, 0]),
  'S': pose(THUMB_HALF, CURLED,   CURLED,   CURLED,   CURLED,   WRIST_FORWARD, SPREAD_NONE),
  'T': pose(THUMB_HALF, CURLED,   CURLED,   CURLED,   CURLED,   WRIST_NEUTRAL, SPREAD_NONE),
  'U': pose(THUMB_IN,   STRAIGHT, STRAIGHT, CURLED,   CURLED,   WRIST_NEUTRAL, SPREAD_NONE),
  'V': pose(THUMB_IN,   STRAIGHT, STRAIGHT, CURLED,   CURLED,   WRIST_NEUTRAL, SPREAD_V),
  'W': pose(THUMB_IN,   STRAIGHT, STRAIGHT, STRAIGHT, CURLED,   WRIST_NEUTRAL, SPREAD_W),
  'X': pose(THUMB_IN,   HOOKED,   CURLED,   CURLED,   CURLED,   WRIST_NEUTRAL, SPREAD_NONE),
  'Y': pose(THUMB_OUT,  CURLED,   CURLED,   CURLED,   STRAIGHT, WRIST_NEUTRAL, SPREAD_NONE),
  'Z': pose(THUMB_IN,   STRAIGHT, CURLED,   CURLED,   CURLED,   WRIST_TILT_R,  SPREAD_NONE),

  // ── Common words ──────────────────────────────────────────────────────────

  'hello': pose(THUMB_OUT,  STRAIGHT, STRAIGHT, STRAIGHT, STRAIGHT, { x: -0.2, y: 0.1, z: 0.1 }, SPREAD_ALL),
  'yes':   pose(THUMB_IN,   CURLED,   CURLED,   CURLED,   CURLED,   WRIST_FORWARD, SPREAD_NONE),
  'no':    pose(THUMB_HALF, STRAIGHT, STRAIGHT, CURLED,   CURLED,   WRIST_NEUTRAL, SPREAD_V),
  'please':pose(THUMB_OUT,  STRAIGHT, STRAIGHT, STRAIGHT, STRAIGHT, WRIST_BACK,    SPREAD_SLIGHT),
  'thank': pose(THUMB_OUT,  STRAIGHT, STRAIGHT, STRAIGHT, STRAIGHT, { x: 0.2, y: 0, z: 0 }, SPREAD_SLIGHT),
  'sorry': pose(THUMB_IN,   CURLED,   CURLED,   CURLED,   CURLED,   { x: 0, y: 0, z: 0.2 }, SPREAD_NONE),
  'help':  pose(THUMB_OUT,  STRAIGHT, STRAIGHT, STRAIGHT, STRAIGHT, WRIST_BACK,    SPREAD_ALL),
  'stop':  pose(THUMB_OUT,  STRAIGHT, STRAIGHT, STRAIGHT, STRAIGHT, { x: 0, y: 0, z: 0.5 }, SPREAD_NONE),
  'more':  pose(THUMB_HALF, PINCHED,  PINCHED,  PINCHED,  PINCHED,  WRIST_NEUTRAL, SPREAD_NONE),
  'good':  pose(THUMB_OUT,  STRAIGHT, CURLED,   CURLED,   CURLED,   WRIST_BACK,    SPREAD_NONE),
  'bad':   pose(THUMB_OUT,  STRAIGHT, CURLED,   CURLED,   CURLED,   { x: 0.3, y: 0, z: -0.3 }, SPREAD_NONE),
  'love':  pose(THUMB_OUT,  CURLED,   CURLED,   CURLED,   STRAIGHT, WRIST_NEUTRAL, SPREAD_NONE),
  'work':  pose(THUMB_IN,   CURLED,   CURLED,   CURLED,   CURLED,   WRIST_NEUTRAL, SPREAD_NONE),
  'home':  pose(THUMB_HALF, PINCHED,  PINCHED,  PINCHED,  PINCHED,  { x: -0.2, y: 0.2, z: 0 }, SPREAD_NONE),
  'food':  pose(THUMB_HALF, PINCHED,  PINCHED,  PINCHED,  PINCHED,  { x: 0.3, y: 0, z: 0 }, SPREAD_NONE),
  'water': pose(THUMB_IN,   STRAIGHT, STRAIGHT, STRAIGHT, CURLED,   WRIST_NEUTRAL, SPREAD_W),
  'time':  pose(THUMB_IN,   HOOKED,   CURLED,   CURLED,   CURLED,   WRIST_TILT_R,  SPREAD_NONE),
  'day':   pose(THUMB_OUT,  STRAIGHT, CURLED,   CURLED,   CURLED,   { x: -0.3, y: 0.2, z: 0 }, SPREAD_NONE),
  'night': pose(THUMB_IN,   CURLED,   CURLED,   CURLED,   CURLED,   { x: 0.3, y: -0.2, z: 0 }, SPREAD_NONE),
  'name':  pose(THUMB_IN,   STRAIGHT, STRAIGHT, CURLED,   CURLED,   WRIST_NEUTRAL, SPREAD_NONE),
  'learn': pose(THUMB_HALF, PINCHED,  PINCHED,  PINCHED,  PINCHED,  { x: -0.3, y: 0, z: 0 }, SPREAD_NONE),
  'know':  pose(THUMB_IN,   STRAIGHT, CURLED,   CURLED,   CURLED,   { x: -0.2, y: 0, z: 0 }, SPREAD_NONE),
  'think': pose(THUMB_IN,   HOOKED,   CURLED,   CURLED,   CURLED,   { x: -0.3, y: 0, z: 0 }, SPREAD_NONE),
  'want':  pose(THUMB_HALF, HALF,     HALF,     HALF,     HALF,     { x: 0.3, y: 0, z: 0 }, SPREAD_NONE),
  'need':  pose(THUMB_IN,   HOOKED,   CURLED,   CURLED,   CURLED,   WRIST_BACK,    SPREAD_NONE),
  'meet':  pose(THUMB_IN,   STRAIGHT, CURLED,   CURLED,   CURLED,   WRIST_NEUTRAL, SPREAD_NONE),
  'talk':  pose(THUMB_IN,   STRAIGHT, STRAIGHT, CURLED,   CURLED,   { x: 0, y: 0.2, z: 0 }, SPREAD_NONE),
  'hear':  pose(THUMB_IN,   HOOKED,   CURLED,   CURLED,   CURLED,   { x: -0.3, y: 0.1, z: 0 }, SPREAD_NONE),
  'see':   pose(THUMB_IN,   STRAIGHT, STRAIGHT, CURLED,   CURLED,   { x: -0.2, y: 0.1, z: 0 }, SPREAD_V),
  'come':  pose(THUMB_IN,   STRAIGHT, CURLED,   CURLED,   CURLED,   { x: 0.2, y: 0, z: 0 }, SPREAD_NONE),
  'go':    pose(THUMB_IN,   STRAIGHT, CURLED,   CURLED,   CURLED,   { x: -0.2, y: 0, z: 0 }, SPREAD_NONE),
  'give':  pose(THUMB_HALF, HALF,     HALF,     HALF,     HALF,     { x: 0, y: 0, z: -0.2 }, SPREAD_NONE),
  'take':  pose(THUMB_HALF, HALF,     HALF,     HALF,     HALF,     { x: 0, y: 0, z: 0.2 }, SPREAD_NONE),
  'open':  pose(THUMB_OUT,  STRAIGHT, STRAIGHT, STRAIGHT, STRAIGHT, WRIST_NEUTRAL, SPREAD_ALL),
  'close': pose(THUMB_IN,   CURLED,   CURLED,   CURLED,   CURLED,   WRIST_NEUTRAL, SPREAD_NONE),
  'big':   pose(THUMB_OUT,  STRAIGHT, CURLED,   CURLED,   CURLED,   { x: 0, y: 0, z: 0.3 }, SPREAD_NONE),
  'small': pose(THUMB_HALF, PINCHED,  CURLED,   CURLED,   CURLED,   WRIST_NEUTRAL, SPREAD_NONE),
  'fast':  pose(THUMB_IN,   HOOKED,   CURLED,   CURLED,   CURLED,   { x: 0, y: 0.3, z: 0 }, SPREAD_NONE),
  'slow':  pose(THUMB_OUT,  STRAIGHT, STRAIGHT, STRAIGHT, STRAIGHT, { x: 0.3, y: 0, z: 0 }, SPREAD_SLIGHT),
  'hot':   pose(THUMB_HALF, HALF,     HALF,     HALF,     HALF,     { x: 0.3, y: 0, z: 0.2 }, SPREAD_NONE),
  'cold':  pose(THUMB_HALF, HALF,     HALF,     HALF,     HALF,     { x: 0, y: 0, z: 0.3 }, SPREAD_SLIGHT),
  'happy': pose(THUMB_OUT,  STRAIGHT, STRAIGHT, STRAIGHT, STRAIGHT, { x: 0.2, y: 0, z: 0.2 }, SPREAD_SLIGHT),
  'sad':   pose(THUMB_IN,   STRAIGHT, STRAIGHT, STRAIGHT, STRAIGHT, { x: -0.3, y: 0, z: 0 }, SPREAD_SLIGHT),
  'sick':  pose(THUMB_HALF, HALF,     HALF,     HALF,     HALF,     { x: -0.2, y: 0, z: 0 }, SPREAD_NONE),
  'pain':  pose(THUMB_IN,   HOOKED,   CURLED,   CURLED,   CURLED,   WRIST_BACK,    SPREAD_NONE),
  'doctor':pose(THUMB_HALF, STRAIGHT, CURLED,   CURLED,   CURLED,   { x: -0.2, y: 0, z: 0 }, SPREAD_NONE),
  'school':pose(THUMB_IN,   STRAIGHT, STRAIGHT, CURLED,   CURLED,   { x: 0.2, y: 0, z: 0 }, SPREAD_NONE),
  'book':  pose(THUMB_OUT,  STRAIGHT, STRAIGHT, STRAIGHT, STRAIGHT, { x: 0, y: 0, z: 0.4 }, SPREAD_NONE),
  'read':  pose(THUMB_IN,   STRAIGHT, STRAIGHT, CURLED,   CURLED,   { x: -0.3, y: 0, z: 0 }, SPREAD_V),
  'write': pose(THUMB_HALF, PINCHED,  CURLED,   CURLED,   CURLED,   WRIST_NEUTRAL, SPREAD_NONE),
  'study': pose(THUMB_HALF, STRAIGHT, STRAIGHT, CURLED,   CURLED,   { x: -0.3, y: 0, z: 0 }, SPREAD_NONE),
  'money': pose(THUMB_HALF, PINCHED,  PINCHED,  PINCHED,  PINCHED,  { x: 0.2, y: 0, z: 0 }, SPREAD_NONE),
  'today': pose(THUMB_IN,   STRAIGHT, CURLED,   CURLED,   CURLED,   WRIST_BACK,    SPREAD_NONE),
  'tomorrow':pose(THUMB_OUT,STRAIGHT, CURLED,   CURLED,   CURLED,   { x: -0.2, y: 0.2, z: 0 }, SPREAD_NONE),
  'morning':pose(THUMB_OUT, STRAIGHT, STRAIGHT, STRAIGHT, STRAIGHT, { x: -0.4, y: 0, z: 0 }, SPREAD_SLIGHT),
  'meeting':pose(THUMB_IN,  CURLED,   CURLED,   CURLED,   CURLED,   { x: 0, y: 0.2, z: 0 }, SPREAD_NONE),
  'important':pose(THUMB_HALF,PINCHED,PINCHED,  PINCHED,  PINCHED,  { x: 0.2, y: 0.2, z: 0 }, SPREAD_NONE),
  'understand':pose(THUMB_IN,STRAIGHT,CURLED,   CURLED,   CURLED,   { x: -0.3, y: 0.2, z: 0 }, SPREAD_NONE),
  'question':pose(THUMB_IN, HOOKED,   CURLED,   CURLED,   CURLED,   WRIST_NEUTRAL, SPREAD_NONE),
  'answer': pose(THUMB_IN,  STRAIGHT, CURLED,   CURLED,   CURLED,   { x: 0, y: 0.3, z: 0 }, SPREAD_NONE),

  // ── Rest pose (between signs) ──────────────────────────────────────────
  'rest':   pose(THUMB_HALF, HALF,    HALF,     HALF,     HALF,     WRIST_NEUTRAL, SPREAD_NONE),
};

// ── Fallback pose for unknown tokens ─────────────────────────────────────────
export const FALLBACK_POSE = SIGN_POSES['rest'];

// ── Get pose for a token ──────────────────────────────────────────────────────
export function getPoseForToken(token) {
  if (!token) return FALLBACK_POSE;
  const lower = token.toLowerCase();

  // Exact match
  if (SIGN_POSES[lower]) return SIGN_POSES[lower];

  // Single letter (fingerspelling)
  const upper = token.toUpperCase();
  if (SIGN_POSES[upper]) return SIGN_POSES[upper];

  return FALLBACK_POSE;
}

// ── Interpolate between two poses ────────────────────────────────────────────
export function lerpPose(from, to, t) {
  const lerp = (a, b, t) => a + (b - a) * t;
  const lerpArr = (a, b, t) => a.map((v, i) => lerp(v, b[i], t));

  return {
    thumb:  lerpArr(from.thumb,  to.thumb,  t),
    index:  lerpArr(from.index,  to.index,  t),
    middle: lerpArr(from.middle, to.middle, t),
    ring:   lerpArr(from.ring,   to.ring,   t),
    pinky:  lerpArr(from.pinky,  to.pinky,  t),
    wrist: {
      x: lerp(from.wrist.x, to.wrist.x, t),
      y: lerp(from.wrist.y, to.wrist.y, t),
      z: lerp(from.wrist.z, to.wrist.z, t),
    },
    spread: lerpArr(from.spread, to.spread, t),
  };
}