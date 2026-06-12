// 📄 frontend/src/components/AvatarSignPlayer.jsx  — NEW FILE
// Replaces SignPlayer with a 3D animated hand using Three.js
// Drop-in replacement — same props interface as SignPlayer

import { useRef, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import HandModel from '../three/HandModel';
import { getPoseForToken, FALLBACK_POSE } from '../three/HandPoseData';

const SIGN_DURATION_MS = 800;  // time per sign at 1x speed
const HOLD_MS          = 200;  // brief hold at peak of each sign

export default function AvatarSignPlayer({
  signQueue = [],
  language,
  isProcessing,
  speed = 1,
  size = 1,
  colors,
  coverage,
  presentationMode,
}) {
  const handRef         = useRef();
  const queueRef        = useRef([]);
  const isAnimatingRef  = useRef(false);
  const timeoutRef      = useRef(null);

  const [currentToken, setCurrentToken] = useState(null);
  const [queueLength, setQueueLength]   = useState(0);
  const [isPlaying, setIsPlaying]       = useState(false);

  // ── When sign queue updates, add new items ────────────────────────────────
  useEffect(() => {
    if (!signQueue || signQueue.length === 0) return;

    // Add new tokens to internal queue
    const tokens = signQueue.map(s => s.token).filter(Boolean);
    queueRef.current = tokens;
    setQueueLength(tokens.length);

    if (!isAnimatingRef.current) {
      playNext();
    }
  }, [signQueue]);

  // ── Play next sign in queue ───────────────────────────────────────────────
  const playNext = () => {
    if (queueRef.current.length === 0) {
      isAnimatingRef.current = false;
      setIsPlaying(false);
      setCurrentToken(null);

      // Return to rest pose
      handRef.current?.setPose(FALLBACK_POSE, 0.5);
      return;
    }

    isAnimatingRef.current = true;
    setIsPlaying(true);

    const token = queueRef.current.shift();
    setCurrentToken(token);
    setQueueLength(queueRef.current.length);

    const pose = getPoseForToken(token);
    const duration = SIGN_DURATION_MS / speed;

    // Animate to the sign pose
    handRef.current?.setPose(pose, duration / 1000);

    // Hold then advance
    timeoutRef.current = setTimeout(playNext, duration + HOLD_MS);
  };

  // Cleanup on unmount
  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      background: colors.panel, border: `1px solid ${colors.border}`,
      borderRadius: presentationMode ? '0' : '16px', overflow: 'hidden',
    }}>

      {/* ── Header ── */}
      <div style={{
        padding: '10px 14px', borderBottom: `1px solid ${colors.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontWeight: 700, fontSize: '13px', color: colors.text }}>
            Sign Player
          </span>
          <span style={{
            fontSize: '10px', padding: '2px 8px', borderRadius: '20px',
            background: colors.accent + '22', color: colors.accentGlow,
            border: `1px solid ${colors.accent}33`, fontFamily: 'monospace',
          }}>
            {language?.toUpperCase()} · 3D
          </span>
          {isPlaying && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: colors.live, animation: 'apPulse 0.8s infinite' }} />
              <span style={{ fontSize: '10px', color: colors.live, fontFamily: 'monospace' }}>
                SIGNING
              </span>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {queueLength > 0 && (
            <span style={{ fontSize: '10px', color: colors.muted, fontFamily: 'monospace' }}>
              {queueLength} queued
            </span>
          )}
          {coverage !== undefined && (
            <span style={{
              fontSize: '10px', fontFamily: 'monospace',
              color: coverage > 60 ? colors.live : '#F59E0B',
            }}>
              {coverage}% signed
            </span>
          )}
        </div>
      </div>

      {/* ── Three.js Canvas ── */}
      <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
        <Canvas
          camera={{ position: [0, 0.3, 1.2], fov: 45 }}
          shadows
          style={{ background: 'transparent' }}
        >
          {/* Lighting */}
          <ambientLight intensity={0.6} />
          <directionalLight
            position={[2, 4, 2]}
            intensity={1.2}
            castShadow
            shadow-mapSize={[1024, 1024]}
          />
          <directionalLight position={[-2, 2, -1]} intensity={0.4} color="#A89BFA" />
          <pointLight position={[0, 2, 1]} intensity={0.5} color="#ffffff" />

          {/* Environment for realistic reflections */}
          <Environment preset="studio" />

          {/* The hand */}
          <group scale={[size, size, size]}>
            <HandModel ref={handRef} accentColor={colors.accent} />
          </group>

          {/* Subtle ground shadow */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
            <planeGeometry args={[4, 4]} />
            <shadowMaterial opacity={0.15} />
          </mesh>

          {/* Orbit controls — let user rotate the hand */}
          <OrbitControls
            enableZoom={false}
            enablePan={false}
            minPolarAngle={Math.PI / 4}
            maxPolarAngle={Math.PI / 1.5}
            target={[0, 0.15, 0]}
            autoRotate={!isPlaying}
            autoRotateSpeed={0.5}
          />
        </Canvas>

        {/* Current sign overlay */}
        {currentToken && (
          <div style={{
            position: 'absolute', bottom: '12px', left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)',
            borderRadius: '10px', padding: '6px 18px',
            border: `1px solid ${colors.accent}44`,
          }}>
            <span style={{
              fontSize: '16px', fontWeight: 800, color: colors.accentGlow,
              fontFamily: 'monospace', letterSpacing: '2px', textTransform: 'uppercase',
            }}>
              {currentToken}
            </span>
          </div>
        )}

        {/* Empty state */}
        {!isPlaying && !isProcessing && signQueue.length === 0 && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: '10px', pointerEvents: 'none',
          }}>
            <p style={{ fontSize: '12px', color: colors.muted, textAlign: 'center' }}>
              Start speaking to see signs
            </p>
            <p style={{ fontSize: '10px', color: colors.muted + '88', fontFamily: 'monospace' }}>
              Drag to rotate · Auto-rotates when idle
            </p>
          </div>
        )}

        {/* Processing indicator */}
        {isProcessing && !isPlaying && (
          <div style={{
            position: 'absolute', bottom: '12px', left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(0,0,0,0.65)', borderRadius: '10px',
            padding: '6px 18px',
          }}>
            <span style={{ fontSize: '11px', color: colors.muted, fontFamily: 'monospace', animation: 'apPulse 1s infinite' }}>
              Processing...
            </span>
          </div>
        )}
      </div>

      <style>{`@keyframes apPulse { 0%,100%{opacity:1}50%{opacity:0.4} }`}</style>
    </div>
  );
}