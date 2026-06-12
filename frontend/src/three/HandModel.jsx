// 📄 frontend/src/three/HandModel.jsx  — FIXED
// Key fix: each joint group is positioned at the TIP of the parent segment
// so children always connect from where the parent ends

import { useRef, useImperativeHandle, forwardRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { lerpPose, FALLBACK_POSE } from './HandPoseData';

// ── Skin colors ───────────────────────────────────────────────────────────────
const SKIN      = '#E8C49A';
const SKIN_DARK = '#C8A070';

// ── Finger definitions ────────────────────────────────────────────────────────
// lengths: [proximal, middle, distal] in Three.js units
// origin: where the finger starts on the palm (x, y, z)
// baseRot: initial rotation of the whole finger (Euler, radians)

const FINGERS = {
  thumb: {
    radius:  [0.046, 0.038, 0.032],
    lengths: [0.18,  0.14,  0.11 ],
    origin:  [-0.16, 0.06,  0.03 ],
    baseRot: new THREE.Euler(0.2, 0, 0.7),
  },
  index: {
    radius:  [0.040, 0.034, 0.028],
    lengths: [0.22,  0.16,  0.12 ],
    origin:  [-0.09, 0.20,  0    ],
    baseRot: new THREE.Euler(0, 0, 0.08),
  },
  middle: {
    radius:  [0.042, 0.036, 0.030],
    lengths: [0.24,  0.17,  0.13 ],
    origin:  [-0.01, 0.22,  0    ],
    baseRot: new THREE.Euler(0, 0, 0),
  },
  ring: {
    radius:  [0.038, 0.032, 0.026],
    lengths: [0.22,  0.16,  0.12 ],
    origin:  [ 0.07, 0.20,  0    ],
    baseRot: new THREE.Euler(0, 0, -0.08),
  },
  pinky: {
    radius:  [0.030, 0.025, 0.020],
    lengths: [0.18,  0.13,  0.10 ],
    origin:  [ 0.14, 0.17,  0    ],
    baseRot: new THREE.Euler(0, 0, -0.16),
  },
};

// ── One bone segment (cylinder + knuckle sphere at tip) ───────────────────────
function BoneSegment({ radius, length }) {
  return (
    <>
      {/* Cylinder — centered on Y axis, so spans from 0 to length */}
      <mesh position={[0, length / 2, 0]} castShadow>
        <cylinderGeometry args={[radius * 0.85, radius, length, 8, 1]} />
        <meshStandardMaterial color={SKIN} roughness={0.65} metalness={0.02} />
      </mesh>
      {/* Knuckle sphere at the tip — this is where child joint pivots */}
      <mesh position={[0, length, 0]}>
        <sphereGeometry args={[radius * 0.95, 8, 6]} />
        <meshStandardMaterial color={SKIN_DARK} roughness={0.55} metalness={0.02} />
      </mesh>
    </>
  );
}

// ── One finger with 3 joints ──────────────────────────────────────────────────
// Joint hierarchy:
//   mcpGroup (rotation = MCP curl)
//     BoneSegment (proximal phalanx)
//     pipGroup at [0, proximalLength, 0]  (rotation = PIP curl)
//       BoneSegment (middle phalanx)
//       dipGroup at [0, middleLength, 0]   (rotation = DIP curl)
//         BoneSegment (distal phalanx)

function FingerJoints({ fingerDef, jointRefs }) {
  const { radius, lengths } = fingerDef;

  return (
    <group ref={jointRefs[0]}>
      <BoneSegment radius={radius[0]} length={lengths[0]} />
      {/* PIP joint — positioned at tip of proximal bone */}
      <group position={[0, lengths[0], 0]} ref={jointRefs[1]}>
        <BoneSegment radius={radius[1]} length={lengths[1]} />
        {/* DIP joint — positioned at tip of middle bone */}
        <group position={[0, lengths[1], 0]} ref={jointRefs[2]}>
          <BoneSegment radius={radius[2]} length={lengths[2]} />
        </group>
      </group>
    </group>
  );
}

// ── Main hand model ───────────────────────────────────────────────────────────

const HandModel = forwardRef(function HandModel({ accentColor }, ref) {

  // Wrist group ref
  const wristRef = useRef();

  // Per-finger joint refs: fingerJointRefs[fingerName][jointIndex]
  const fingerJointRefs = {
    thumb:  [useRef(), useRef(), useRef()],
    index:  [useRef(), useRef(), useRef()],
    middle: [useRef(), useRef(), useRef()],
    ring:   [useRef(), useRef(), useRef()],
    pinky:  [useRef(), useRef(), useRef()],
  };

  // Finger base group refs (for spread)
  const fingerBaseRefs = {
    thumb:  useRef(),
    index:  useRef(),
    middle: useRef(),
    ring:   useRef(),
    pinky:  useRef(),
  };

  // Interpolation state
  const fromPose   = useRef(FALLBACK_POSE);
  const toPose     = useRef(FALLBACK_POSE);
  const progress   = useRef(1);
  const duration   = useRef(0.4);

  // ── Public API ──────────────────────────────────────────────────────────
  useImperativeHandle(ref, () => ({
    setPose(newPose, dur = 0.4) {
      // Snapshot current interpolated pose as the new start
      fromPose.current = lerpPose(fromPose.current, toPose.current, easeInOut(Math.min(progress.current, 1)));
      toPose.current   = newPose;
      progress.current = 0;
      duration.current = dur;
    },
  }));

  // ── Animation frame ─────────────────────────────────────────────────────
  useFrame((state, delta) => {
    if (progress.current >= 1) return;

    progress.current = Math.min(progress.current + delta / duration.current, 1);
    const t = easeInOut(progress.current);

    const pose = lerpPose(fromPose.current, toPose.current, t);

    // Wrist
    if (wristRef.current) {
      wristRef.current.rotation.x = pose.wrist.x;
      wristRef.current.rotation.y = pose.wrist.y;
      wristRef.current.rotation.z = pose.wrist.z;
    }

    // Fingers
    const names = ['thumb', 'index', 'middle', 'ring', 'pinky'];
    names.forEach((name, fi) => {
      const rotations = pose[name];
      // Apply curl to each joint
      fingerJointRefs[name].forEach((r, ji) => {
        if (r.current) {
          r.current.rotation.x = rotations[ji] ?? 0;
        }
      });

      // Apply spread (x position offset for non-thumb fingers)
      if (name !== 'thumb' && fingerBaseRefs[name].current) {
        const spreadIdx = ['index', 'middle', 'ring', 'pinky'].indexOf(name);
        const baseX = FINGERS[name].origin[0];
        fingerBaseRefs[name].current.position.x = baseX + (pose.spread[spreadIdx] ?? 0);
      }
    });
  });

  return (
    <group position={[0, -0.15, 0]}>

      {/* Wrist */}
      <group ref={wristRef}>

        {/* Palm base */}
        <mesh position={[0, 0.10, 0]} castShadow>
          <boxGeometry args={[0.36, 0.26, 0.09]} />
          <meshStandardMaterial color={SKIN} roughness={0.65} metalness={0.02} />
        </mesh>

        {/* Wrist cylinder */}
        <mesh position={[0, -0.07, 0]}>
          <cylinderGeometry args={[0.13, 0.11, 0.12, 10]} />
          <meshStandardMaterial color={SKIN_DARK} roughness={0.7} metalness={0.02} />
        </mesh>

        {/* Fingers */}
        {Object.entries(FINGERS).map(([name, def]) => (
          <group
            key={name}
            ref={fingerBaseRefs[name]}
            position={def.origin}
            rotation={def.baseRot}
          >
            <FingerJoints
              fingerDef={def}
              jointRefs={fingerJointRefs[name]}
            />
          </group>
        ))}

      </group>
    </group>
  );
});

export default HandModel;

function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}