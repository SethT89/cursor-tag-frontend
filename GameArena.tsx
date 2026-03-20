import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Player, GameMode } from './gameTypes';

interface LiveScore {
  id: string; name: string; color: string; score: number;
  isIt: boolean; isBot?: boolean; isZombie?: boolean; isTurning?: boolean;
}

interface GameArenaProps {
  players: Player[];
  localPlayerId: string;
  itPlayerId: string;
  timeLeft: number;
  countdown?: number | null;
  liveScores?: LiveScore[];
  tagDistance?: number;
  mode?: GameMode;
  humansLeft?: number | null;
  onMouseMove: (x: number, y: number) => void;
}

interface SmoothedPos { x: number; y: number; targetX: number; targetY: number; }

const ZOMBIE_COLOR = '#4dff6e';
const ZOMBIE_DARK  = '#1a3320';
const TURNING_COLOR = '#a0ff4b';

function zombifyColor(color: string, isZombie: boolean, isTurning: boolean): string {
  if (isZombie) return ZOMBIE_COLOR;
  if (isTurning) return TURNING_COLOR;
  return color;
}

const GameArena: React.FC<GameArenaProps> = ({
  players, localPlayerId, itPlayerId, timeLeft, countdown, liveScores = [],
  tagDistance = 8, mode = 'classic', humansLeft, onMouseMove,
}) => {
  const arenaRef       = useRef<HTMLDivElement>(null);
  const canvasRef      = useRef<HTMLCanvasElement>(null);
  const smoothedRef    = useRef<Map<string, SmoothedPos>>(new Map());
  const animFrameRef   = useRef<number>();
  const localPosRef    = useRef({ x: 50, y: 50 });
  const targetMouseRef = useRef({ x: 50, y: 50 });
  const playersRef     = useRef<Player[]>(players);
  const tagDistRef     = useRef(tagDistance);
  const modeRef        = useRef(mode);
  const prevRanksRef   = useRef<Map<string, number>>(new Map());
  const [renderTick, setRenderTick] = useState(0);

  useEffect(() => { playersRef.current = players; }, [players]);
  useEffect(() => { tagDistRef.current = tagDistance; }, [tagDistance]);
  useEffect(() => { modeRef.current = mode; }, [mode]);

  const localPlayer = players.find(p => p.id === localPlayerId);
  const itPlayer    = players.find(p => p.id === itPlayerId);
  const isZombieMode = mode === 'zombie';
  const localIsZombie  = !!(localPlayer?.isZombie);
  const localIsTurning = !!(localPlayer?.isTurning);

  // Update smooth targets for remote players
  useEffect(() => {
    players.forEach(p => {
      if (p.id === localPlayerId) return;
      const ex = smoothedRef.current.get(p.id);
      if (ex) { ex.targetX = p.x; ex.targetY = p.y; }
      else smoothedRef.current.set(p.id, { x: p.x, y: p.y, targetX: p.x, targetY: p.y });
    });
    const ids = new Set(players.map(p => p.id));
    smoothedRef.current.forEach((_, id) => { if (!ids.has(id)) smoothedRef.current.delete(id); });
  }, [players, localPlayerId]);

  // Canvas draw loop — local cursor with zombie speed dampening
  useEffect(() => {
    const canvas = canvasRef.current;
    const arena  = arenaRef.current;
    if (!canvas || !arena) return;

    const draw = () => {
      const ctx = canvas.getContext('2d');
      if (!ctx) { animFrameRef.current = requestAnimationFrame(draw); return; }

      const rect = arena.getBoundingClientRect();
      canvas.width  = rect.width;
      canvas.height = rect.height;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const player = playersRef.current.find(p => p.id === localPlayerId);
      if (!player) { animFrameRef.current = requestAnimationFrame(draw); return; }

      // Speed dampening: lerp localPos toward targetMouse based on zombie state
      const isZ = player.isZombie;
      const isT = player.isTurning;
      const lerpFactor = isT ? 0.04 : isZ ? 0.07 : 1.0;
      if (lerpFactor < 1.0) {
        localPosRef.current.x += (targetMouseRef.current.x - localPosRef.current.x) * lerpFactor;
        localPosRef.current.y += (targetMouseRef.current.y - localPosRef.current.y) * lerpFactor;
      }

      const px = (localPosRef.current.x / 100) * canvas.width;
      const py = (localPosRef.current.y / 100) * canvas.height;
      const drawColor = zombifyColor(player.color, isZ, isT);
      const { isIt, immune } = player;

      // Zombie mode green fog overlay when you are a zombie
      if (isZ) {
        const grad = ctx.createRadialGradient(px, py, 0, px, py, 120);
        grad.addColorStop(0, 'rgba(30,80,30,0.18)');
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Tag zone ring (classic IT or zombie)
      const showRing = isZombieMode ? isZ && !isT : isIt;
      if (showRing) {
        const tagRingRadius = (tagDistRef.current / 100) * canvas.width;
        const pulse = (Math.sin(Date.now() / 400) + 1) / 2;
        ctx.beginPath();
        ctx.arc(px + 10, py + 14, tagRingRadius, 0, Math.PI * 2);
        ctx.strokeStyle = drawColor;
        ctx.globalAlpha = 0.2 + pulse * 0.2;
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;
      }

      // Immune ring (classic only)
      if (immune && !isZombieMode) {
        ctx.beginPath();
        ctx.arc(px + 10, py + 14, 20, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,255,255,0.4)';
        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;
      }

      // Turning shimmer
      if (isT) {
        const t = Date.now() / 200;
        ctx.globalAlpha = 0.3 + Math.abs(Math.sin(t)) * 0.4;
        ctx.beginPath();
        ctx.arc(px + 10, py + 14, 28, 0, Math.PI * 2);
        ctx.fillStyle = TURNING_COLOR;
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // Cursor arrow
      ctx.save();
      ctx.translate(px, py);
      const cursorPath = new Path2D('M0 0 L0 28 L7 21 L12 32 L16 30 L11 19 L20 19 Z');
      ctx.fillStyle = drawColor;
      ctx.shadowColor = showRing ? drawColor : 'transparent';
      ctx.shadowBlur = showRing ? 12 : 0;
      if (isZ) {
        // Slightly wobbly for zombies
        const wobble = Math.sin(Date.now() / 150) * 1.5;
        ctx.rotate((wobble * Math.PI) / 180);
      }
      ctx.fill(cursorPath);
      ctx.strokeStyle = isZ ? '#001a00' : 'white';
      ctx.lineWidth = 1.5;
      ctx.lineJoin = 'round';
      ctx.stroke(cursorPath);
      ctx.restore();

      // Emoji above cursor
      ctx.font = '16px serif';
      if (isZ) ctx.fillText('🧟', px - 2, py - 6);
      else if (isT) ctx.fillText('😱', px + 2, py - 6);
      else if (isIt && !isZombieMode) ctx.fillText('👑', px + 2, py - 6);

      // Name tag
      const tag = player.name + (isZ ? ' 🧟' : isT ? ' 😱' : isIt && !isZombieMode ? ' 🏷️' : '');
      ctx.font = '600 12px Inter, sans-serif';
      const tw = ctx.measureText(tag).width;
      const pad = 6;
      const tagBg = isZ ? ZOMBIE_DARK : isT ? 'rgba(30,40,0,0.85)' : isIt && !isZombieMode ? player.color : 'rgba(0,0,0,0.75)';
      ctx.fillStyle = tagBg;
      ctx.beginPath();
      (ctx as any).roundRect(px + 26, py, tw + pad * 2, 20, 4);
      ctx.fill();
      ctx.strokeStyle = isZ ? ZOMBIE_COLOR : isT ? TURNING_COLOR : isIt && !isZombieMode ? 'white' : 'rgba(255,255,255,0.15)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = isZ ? ZOMBIE_COLOR : 'white';
      ctx.fillText(tag, px + 26 + pad, py + 14);

      animFrameRef.current = requestAnimationFrame(draw);
    };

    animFrameRef.current = requestAnimationFrame(draw);
    return () => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current); };
  }, [localPlayerId]);

  // LERP remote cursors at 60fps
  useEffect(() => {
    let rafId: number;
    const loop = () => {
      let changed = false;
      smoothedRef.current.forEach(pos => {
        const dx = pos.targetX - pos.x, dy = pos.targetY - pos.y;
        if (Math.abs(dx) > 0.01 || Math.abs(dy) > 0.01) {
          pos.x += dx * 0.25; pos.y += dy * 0.25; changed = true;
        }
      });
      if (changed) setRenderTick(t => t + 1);
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const arena = arenaRef.current;
    if (!arena) return;
    const rect = arena.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    targetMouseRef.current = { x, y };
    // For non-dampened players, localPos tracks instantly
    const player = playersRef.current.find(p => p.id === localPlayerId);
    if (!player?.isZombie && !player?.isTurning) {
      localPosRef.current = { x, y };
    }
    onMouseMove(localPosRef.current.x, localPosRef.current.y);
  }, [onMouseMove, localPlayerId]);

  const getPos = (p: Player) => {
    const s = smoothedRef.current.get(p.id);
    return s ? { x: s.x, y: s.y } : { x: p.x, y: p.y };
  };

  const seconds = Math.ceil(timeLeft / 1000);
  const isLow = isZombieMode ? seconds <= 30 : seconds <= 10;
  const maxDuration = 60;
  const pct = timeLeft / (maxDuration * 1000);

  const bgColor = isZombieMode ? '#050d05' : '#0a0a14';
  const gridColor = isZombieMode ? 'rgba(77,255,110,0.08)' : 'rgba(255,255,255,1)';

  return (
    <div style={{
      width: '100vw', height: '100vh', background: bgColor,
      overflow: 'hidden', position: 'relative', cursor: 'none',
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
      transition: 'background 1s ease',
    }}
      ref={arenaRef}
      onMouseMove={handleMouseMove}
    >
      {/* Grid */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: isZombieMode ? 0.08 : 0.05 }}>
        <defs>
          <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke={isZombieMode ? '#4dff6e' : 'white'} strokeWidth="0.5"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)"/>
      </svg>

      {/* Zombie atmosphere — creeping green fog at edges */}
      {isZombieMode && (
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse at 0% 100%, rgba(0,40,0,0.4) 0%, transparent 50%), radial-gradient(ellipse at 100% 0%, rgba(0,30,0,0.3) 0%, transparent 50%)',
        }} />
      )}

      {/* Canvas — local cursor */}
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 40 }} />

      {/* Countdown overlay */}
      {countdown != null && countdown > 0 && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: '180px', fontWeight: '900', lineHeight: 1,
              background: isZombieMode ? 'linear-gradient(135deg, #4dff6e, #a0ff4b)' : 'linear-gradient(135deg, #FF4B6E, #C84BFF)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              animation: 'popIn 0.3s ease-out',
            }}>{countdown}</div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '20px', marginTop: '16px' }}>
              {isZombieMode ? '🧟 The outbreak begins...' : 'Get ready!'}
            </div>
          </div>
        </div>
      )}

      {/* Timer */}
      <div style={{ position: 'absolute', top: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 50 }}>
        <div style={{
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(16px)',
          border: `1px solid ${isLow ? (isZombieMode ? 'rgba(77,255,110,0.5)' : 'rgba(255,75,110,0.5)') : 'rgba(255,255,255,0.1)'}`,
          borderRadius: '20px', padding: '12px 32px',
          display: 'inline-flex', alignItems: 'center', gap: '16px',
        }}>
          <div style={{ width: '120px', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px' }}>
            <div style={{
              height: '100%', borderRadius: '2px', width: `${pct * 100}%`,
              background: isZombieMode ? 'linear-gradient(90deg, #4dff6e, #a0ff4b)' : isLow ? '#FF4B6E' : 'linear-gradient(90deg, #4B9FFF, #4BFFA5)',
              transition: 'width 0.1s linear',
            }} />
          </div>
          <span style={{
            fontSize: '28px', fontWeight: '900',
            color: isLow ? (isZombieMode ? '#4dff6e' : '#FF4B6E') : 'white',
            fontVariantNumeric: 'tabular-nums', minWidth: '52px', textAlign: 'center',
            animation: isLow && seconds <= 10 ? 'pulse 0.5s ease-in-out infinite' : undefined,
          }}>
            {seconds}s
          </span>
        </div>
      </div>

      {/* Zombie mode: humans left indicator */}
      {isZombieMode && humansLeft !== null && (
        <div style={{ position: 'absolute', top: '80px', left: '50%', transform: 'translateX(-50%)', zIndex: 50 }}>
          <div style={{
            background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(77,255,110,0.3)',
            borderRadius: '12px', padding: '6px 16px', fontSize: '13px',
            color: humansLeft <= 1 ? '#4dff6e' : 'rgba(255,255,255,0.7)',
            fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            <span>🧟</span>
            <span style={{ color: '#4dff6e', fontWeight: '700' }}>{humansLeft}</span>
            <span>{humansLeft === 1 ? 'human remains' : 'humans remaining'}</span>
          </div>
        </div>
      )}

      {/* Classic: IT indicator */}
      {!isZombieMode && itPlayer && (
        <div style={{ position: 'absolute', top: '80px', left: '50%', transform: 'translateX(-50%)', zIndex: 50 }}>
          <div style={{
            background: 'rgba(255,75,110,0.15)', border: '1px solid rgba(255,75,110,0.4)',
            borderRadius: '12px', padding: '6px 16px', fontSize: '13px',
            color: '#FF4B6E', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            <span style={{ animation: 'spin 2s linear infinite', display: 'inline-block' }}>⚡</span>
            <span style={{ color: itPlayer.color, fontWeight: '700' }}>{itPlayer.name}</span>
            <span>is IT</span>
          </div>
        </div>
      )}

      {/* Live scoreboard */}
      {liveScores.length > 0 && (
        <div style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 50, width: '210px' }}>
          <div style={{
            background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(16px)',
            border: `1px solid ${isZombieMode ? 'rgba(77,255,110,0.15)' : 'rgba(255,255,255,0.08)'}`,
            borderRadius: '16px', overflow: 'hidden',
          }}>
            <div style={{
              padding: '8px 14px', borderBottom: `1px solid ${isZombieMode ? 'rgba(77,255,110,0.1)' : 'rgba(255,255,255,0.06)'}`,
              fontSize: '11px', fontWeight: '700', color: isZombieMode ? 'rgba(77,255,110,0.6)' : 'rgba(255,255,255,0.4)',
              letterSpacing: '1px', textTransform: 'uppercase',
            }}>
              {isZombieMode ? '🧟 Survival' : '🏆 Live Scores'}
            </div>
            {liveScores.map((s, i) => {
              const isLocal = s.id === localPlayerId;
              const prevRank = prevRanksRef.current.get(s.id);
              const moved = prevRank !== undefined && prevRank !== i;
              prevRanksRef.current.set(s.id, i);
              const dotColor = s.isZombie ? ZOMBIE_COLOR : s.isTurning ? TURNING_COLOR : s.color;
              return (
                <div key={s.id} style={{
                  display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 14px',
                  background: isLocal ? 'rgba(255,255,255,0.06)' : s.isZombie ? 'rgba(0,20,0,0.4)' : 'transparent',
                  borderBottom: i < liveScores.length - 1 ? `1px solid ${isZombieMode ? 'rgba(77,255,110,0.06)' : 'rgba(255,255,255,0.04)'}` : 'none',
                  transition: 'all 0.4s ease',
                  animation: moved ? 'rankMove 0.4s ease-out' : undefined,
                  opacity: s.isZombie ? 0.8 : 1,
                }}>
                  <span style={{ fontSize: '12px', width: '18px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontWeight: '700' }}>
                    {s.isZombie ? '🧟' : s.isTurning ? '😱' : i + 1}
                  </span>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: dotColor, flexShrink: 0 }} />
                  <span style={{
                    flex: 1, fontSize: '11px', fontWeight: isLocal ? '700' : '500',
                    color: s.isZombie ? ZOMBIE_COLOR : s.isTurning ? TURNING_COLOR : isLocal ? 'white' : 'rgba(255,255,255,0.7)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {s.name}{s.isBot ? ' 🤖' : ''}
                  </span>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: s.isZombie ? ZOMBIE_COLOR : 'rgba(255,255,255,0.5)', minWidth: '28px', textAlign: 'right' }}>
                    {isZombieMode ? (s.isZombie ? `${s.score}🧟` : `${s.score}s`) : s.score}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Bottom banner */}
      {localIsZombie && !localIsTurning && (
        <div style={{ position: 'absolute', bottom: '40px', left: '50%', transform: 'translateX(-50%)', zIndex: 50 }}>
          <div style={{
            background: 'rgba(0,40,0,0.9)', borderRadius: '16px', border: '1px solid rgba(77,255,110,0.4)',
            padding: '14px 28px', fontSize: '18px', fontWeight: '900',
            color: ZOMBIE_COLOR, animation: 'zombieGlow 1.5s ease-in-out infinite alternate',
            whiteSpace: 'nowrap',
          }}>
            🧟 YOU ARE A ZOMBIE — INFECT THE HUMANS!
          </div>
        </div>
      )}

      {localIsTurning && (
        <div style={{ position: 'absolute', bottom: '40px', left: '50%', transform: 'translateX(-50%)', zIndex: 50 }}>
          <div style={{
            background: 'rgba(10,30,0,0.9)', borderRadius: '16px', border: '1px solid rgba(160,255,75,0.5)',
            padding: '14px 28px', fontSize: '18px', fontWeight: '900',
            color: TURNING_COLOR, animation: 'turningFlicker 0.3s ease-in-out infinite alternate',
            whiteSpace: 'nowrap',
          }}>
            😱 YOU'RE TURNING... {Math.ceil(((localPlayer?.turningUntil||0) - Date.now()) / 1000)}s
          </div>
        </div>
      )}

      {!isZombieMode && localPlayer?.isIt && (
        <div style={{ position: 'absolute', bottom: '40px', left: '50%', transform: 'translateX(-50%)', zIndex: 50 }}>
          <div style={{
            background: 'rgba(255,75,110,0.9)', borderRadius: '16px',
            padding: '14px 28px', fontSize: '20px', fontWeight: '900',
            color: 'white', animation: 'glow 1s ease-in-out infinite alternate', whiteSpace: 'nowrap',
          }}>
            ⚡ YOU ARE IT — TAG SOMEONE! ⚡
          </div>
        </div>
      )}

      {/* Remote cursors */}
      {players.filter(p => p.id !== localPlayerId).map(p => {
        const pos = getPos(p);
        return <RemoteCursor key={p.id} player={p} x={pos.x} y={pos.y} tagDistance={tagDistance} mode={mode} />;
      })}

      <style>{`
        @keyframes popIn { from { transform: translateX(-50%) scale(0.5); opacity:0; } to { transform: translateX(-50%) scale(1); opacity:1; } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
        @keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
        @keyframes glow { from { box-shadow:0 0 20px rgba(255,75,110,0.4); } to { box-shadow:0 0 60px rgba(255,75,110,0.8); } }
        @keyframes zombieGlow { from { box-shadow:0 0 20px rgba(77,255,110,0.3); } to { box-shadow:0 0 50px rgba(77,255,110,0.7); } }
        @keyframes turningFlicker { 0% { opacity:1; } 100% { opacity:0.6; } }
        @keyframes rankMove { 0% { transform:translateY(-8px); opacity:0.5; } 100% { transform:translateY(0); opacity:1; } }
        @keyframes tagZonePulse { 0%,100% { opacity:0.3; } 50% { opacity:0.55; } }
        @keyframes zombieZonePulse { 0%,100% { opacity:0.25; } 50% { opacity:0.5; } }
        @keyframes bounce { from { transform:translateY(0); } to { transform:translateY(-4px); } }
        @keyframes immuneShimmer { 0%,100% { opacity:0.4; } 50% { opacity:0.7; } }
        @keyframes zombieWobble { 0%,100% { transform:rotate(-3deg); } 50% { transform:rotate(3deg); } }
        @keyframes turningShake { 0%,100% { transform:translateX(0); } 25% { transform:translateX(-2px); } 75% { transform:translateX(2px); } }
      `}</style>
    </div>
  );
};

const CURSOR_ARROW = `M0 0 L0 28 L7 21 L12 32 L16 30 L11 19 L20 19 Z`;

const RemoteCursor: React.FC<{ player: Player; x: number; y: number; tagDistance: number; mode: GameMode }> = ({ player, x, y, tagDistance, mode }) => {
  const { color, name, isIt, immune, isZombie, isTurning } = player;
  const isZombieMode = mode === 'zombie';
  const drawColor = zombifyColor(color, !!isZombie, !!isTurning);
  const showTagRing = isZombieMode ? (isZombie && !isTurning) : isIt;

  return (
    <div style={{
      position: 'absolute', left: `${x}%`, top: `${y}%`,
      transform: 'translate(-2px, -2px)', pointerEvents: 'none', zIndex: 20,
    }}>
      {/* Tag zone ring */}
      {showTagRing && (
        <div style={{
          position: 'absolute',
          left: `calc(-${tagDistance}vw + 10px)`,
          top: `calc(-${tagDistance}vw + 14px)`,
          width: `${tagDistance * 2}vw`,
          height: `${tagDistance * 2}vw`,
          borderRadius: '50%',
          border: `2px dashed ${drawColor}`,
          opacity: 0.35, pointerEvents: 'none',
          animation: isZombieMode ? 'zombieZonePulse 2s ease-in-out infinite' : 'tagZonePulse 2s ease-in-out infinite',
        }} />
      )}

      {/* Immune ring */}
      {immune && !isZombieMode && (
        <div style={{
          position: 'absolute', left: '-14px', top: '-14px',
          width: '48px', height: '48px', borderRadius: '50%',
          border: '2px dashed rgba(255,255,255,0.4)',
          animation: 'immuneShimmer 0.4s ease-in-out infinite',
        }} />
      )}

      {/* Turning shimmer */}
      {isTurning && (
        <div style={{
          position: 'absolute', left: '-18px', top: '-18px',
          width: '56px', height: '56px', borderRadius: '50%',
          background: 'rgba(160,255,75,0.15)',
          animation: 'turningShake 0.2s ease-in-out infinite',
        }} />
      )}

      {/* Cursor arrow */}
      <svg width="22" height="30" viewBox="0 0 24 32" fill="none" style={{
        filter: showTagRing ? `drop-shadow(0 0 6px ${drawColor})` : undefined,
        opacity: immune ? 0.6 : 1,
        animation: isZombie && !isTurning ? 'zombieWobble 0.8s ease-in-out infinite' : isTurning ? 'turningShake 0.2s linear infinite' : undefined,
      }}>
        <path d={CURSOR_ARROW} fill={drawColor} stroke={isZombie ? '#001a00' : 'white'} strokeWidth="1.5" strokeLinejoin="round"/>
      </svg>

      {/* Emoji above */}
      <div style={{ position: 'absolute', top: '-22px', left: '2px', fontSize: '14px', animation: 'bounce 0.6s ease-in-out infinite alternate' }}>
        {isZombie && !isTurning ? '🧟' : isTurning ? '😱' : isIt && !isZombieMode ? '👑' : ''}
      </div>

      {/* Name label */}
      <div style={{
        position: 'absolute', left: '26px', top: '0px',
        background: isZombie ? ZOMBIE_DARK : isTurning ? 'rgba(15,25,0,0.85)' : isIt && !isZombieMode ? color : 'rgba(0,0,0,0.75)',
        border: `1px solid ${isZombie ? ZOMBIE_COLOR : isTurning ? TURNING_COLOR : isIt && !isZombieMode ? 'white' : 'rgba(255,255,255,0.15)'}`,
        borderRadius: '6px', padding: '3px 8px',
        fontSize: '12px', fontWeight: '600',
        color: isZombie ? ZOMBIE_COLOR : isTurning ? TURNING_COLOR : 'rgba(255,255,255,0.9)',
        whiteSpace: 'nowrap',
      }}>
        {name}{isZombie && !isTurning ? ' 🧟' : isTurning ? ' 😱' : isIt && !isZombieMode ? ' 🏷️' : ''}{player.isBot ? ' 🤖' : ''}
      </div>
    </div>
  );
};

export default GameArena;
