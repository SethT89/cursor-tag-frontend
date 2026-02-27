import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Player } from './gameTypes';

interface GameArenaProps {
  players: Player[];
  localPlayerId: string;
  itPlayerId: string;
  timeLeft: number;
  countdown?: number | null;
  onMouseMove: (x: number, y: number) => void;
}

interface SmoothedPos {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
}

const GameArena: React.FC<GameArenaProps> = ({
  players, localPlayerId, itPlayerId, timeLeft, countdown, onMouseMove,
}) => {
  const arenaRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const smoothedRef = useRef<Map<string, SmoothedPos>>(new Map());
  const animFrameRef = useRef<number>();
  const localPosRef = useRef({ x: 50, y: 50 });
  const playersRef = useRef<Player[]>(players);
  const [renderTick, setRenderTick] = useState(0);

  const localPlayer = players.find(p => p.id === localPlayerId);
  const itPlayer = players.find(p => p.id === itPlayerId);

  // Keep playersRef in sync
  useEffect(() => {
    playersRef.current = players;
  }, [players]);

  // Update smoothed targets when server sends positions
  useEffect(() => {
    players.forEach(p => {
      if (p.id === localPlayerId) return;
      const existing = smoothedRef.current.get(p.id);
      if (existing) {
        existing.targetX = p.x;
        existing.targetY = p.y;
      } else {
        smoothedRef.current.set(p.id, {
          x: p.x, y: p.y, targetX: p.x, targetY: p.y,
        });
      }
    });
    const ids = new Set(players.map(p => p.id));
    smoothedRef.current.forEach((_, id) => {
      if (!ids.has(id)) smoothedRef.current.delete(id);
    });
  }, [players, localPlayerId]);

  // Draw local cursor on canvas — runs at 60fps, never touched by React
  useEffect(() => {
    const canvas = canvasRef.current;
    const arena = arenaRef.current;
    if (!canvas || !arena) return;

    const drawCursor = () => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const rect = arena.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const player = playersRef.current.find(p => p.id === localPlayerId);
      if (!player) return;

      const px = (localPosRef.current.x / 100) * canvas.width;
      const py = (localPosRef.current.y / 100) * canvas.height;
      const color = player.color;
      const isIt = player.isIt;

      // IT pulsing rings
      if (isIt) {
        const time = Date.now() / 1000;
        const pulse = (Math.sin(time * 3) + 1) / 2;
        ctx.beginPath();
        ctx.arc(px + 10, py + 14, 22 + pulse * 8, 0, Math.PI * 2);
        ctx.strokeStyle = color;
        ctx.globalAlpha = 0.5 - pulse * 0.3;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      // Cursor arrow shape
      ctx.save();
      ctx.translate(px, py);
      const path = new Path2D('M0 0 L0 28 L7 21 L12 32 L16 30 L11 19 L20 19 Z');
      ctx.fillStyle = color;
      ctx.shadowColor = isIt ? color : 'transparent';
      ctx.shadowBlur = isIt ? 10 : 0;
      ctx.fill(path);
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 1.5;
      ctx.lineJoin = 'round';
      ctx.stroke(path);
      ctx.restore();

      // IT crown
      if (isIt) {
        ctx.font = '16px serif';
        ctx.fillText('👑', px + 2, py - 6);
      }

      // Name tag
      const tag = player.name + (isIt ? ' 🏷️' : '');
      ctx.font = '600 12px Inter, sans-serif';
      const textWidth = ctx.measureText(tag).width;
      const tagX = px + 26;
      const tagY = py;
      const padding = 6;

      ctx.fillStyle = isIt ? color : 'rgba(0,0,0,0.75)';
      ctx.beginPath();
      ctx.roundRect(tagX, tagY, textWidth + padding * 2, 20, 4);
      ctx.fill();

      ctx.strokeStyle = isIt ? 'white' : 'rgba(255,255,255,0.15)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = 'white';
      ctx.fillText(tag, tagX + padding, tagY + 14);
    };

    const loop = () => {
      drawCursor();
      animFrameRef.current = requestAnimationFrame(loop);
    };
    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [localPlayerId]);

  // Smooth other players at 60fps, trigger React re-render for them
  useEffect(() => {
    const LERP = 0.25;
    let rafId: number;
    const loop = () => {
      let changed = false;
      smoothedRef.current.forEach(pos => {
        const dx = pos.targetX - pos.x;
        const dy = pos.targetY - pos.y;
        if (Math.abs(dx) > 0.01 || Math.abs(dy) > 0.01) {
          pos.x += dx * LERP;
          pos.y += dy * LERP;
          changed = true;
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
    localPosRef.current = { x, y };
    onMouseMove(x, y);
  }, [onMouseMove]);

  const seconds = Math.ceil(timeLeft / 1000);
  const isLow = seconds <= 10;
  const pct = timeLeft / 60000;

  const getPos = (p: Player) => {
    const smoothed = smoothedRef.current.get(p.id);
    return smoothed ? { x: smoothed.x, y: smoothed.y } : { x: p.x, y: p.y };
  };

  return (
    <div style={{
      width: '100vw', height: '100vh', background: '#0a0a14',
      overflow: 'hidden', position: 'relative', cursor: 'none',
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
    }}
      ref={arenaRef}
      onMouseMove={handleMouseMove}
    >
      {/* Grid */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.05 }}>
        <defs>
          <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="white" strokeWidth="0.5"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)"/>
      </svg>

      {/* Canvas layer for local cursor — sits on top of everything */}
      <canvas ref={canvasRef} style={{
        position: 'absolute', inset: 0,
        width: '100%', height: '100%',
        pointerEvents: 'none', zIndex: 40,
      }} />

      {/* Countdown */}
      {countdown != null && countdown > 0 && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          zIndex: 100, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: '180px', fontWeight: '900', lineHeight: 1,
              background: 'linear-gradient(135deg, #FF4B6E, #C84BFF)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              animation: 'popIn 0.3s ease-out',
            }}>
              {countdown}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '20px', marginTop: '16px' }}>
              Get ready!
            </div>
          </div>
        </div>
      )}

      {/* Timer */}
      <div style={{
        position: 'absolute', top: '20px', left: '50%',
        transform: 'translateX(-50%)', zIndex: 50,
      }}>
        <div style={{
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(16px)',
          border: `1px solid ${isLow ? 'rgba(255,75,110,0.5)' : 'rgba(255,255,255,0.1)'}`,
          borderRadius: '20px', padding: '12px 32px',
          display: 'inline-flex', alignItems: 'center', gap: '16px',
        }}>
          <div style={{ width: '120px', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px' }}>
            <div style={{
              height: '100%', borderRadius: '2px', width: `${pct * 100}%`,
              background: isLow ? '#FF4B6E' : 'linear-gradient(90deg, #4B9FFF, #4BFFA5)',
              transition: 'width 0.1s linear',
            }} />
          </div>
          <span style={{
            fontSize: '28px', fontWeight: '900',
            color: isLow ? '#FF4B6E' : 'white',
            fontVariantNumeric: 'tabular-nums', minWidth: '52px', textAlign: 'center',
            animation: isLow && seconds <= 5 ? 'pulse 0.5s ease-in-out infinite' : undefined,
          }}>
            {seconds}s
          </span>
        </div>
      </div>

      {/* IT indicator */}
      {itPlayer && (
        <div style={{
          position: 'absolute', top: '80px', left: '50%',
          transform: 'translateX(-50%)', zIndex: 50,
        }}>
          <div style={{
            background: 'rgba(255,75,110,0.15)',
            border: '1px solid rgba(255,75,110,0.4)',
            borderRadius: '12px', padding: '6px 16px',
            fontSize: '13px', color: '#FF4B6E', fontWeight: '600',
            display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            <span style={{ animation: 'spin 2s linear infinite', display: 'inline-block' }}>⚡</span>
            <span style={{ color: itPlayer.color, fontWeight: '700' }}>{itPlayer.name}</span>
            <span>is IT</span>
          </div>
        </div>
      )}

      {/* Player sidebar */}
      <div style={{
        position: 'absolute', top: '20px', right: '20px',
        zIndex: 50, display: 'flex', flexDirection: 'column', gap: '6px',
      }}>
        {players.map(p => (
          <div key={p.id} style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '6px 12px', background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(8px)', borderRadius: '10px',
            border: `1px solid ${p.isIt ? 'rgba(255,75,110,0.5)' : 'rgba(255,255,255,0.06)'}`,
            opacity: p.immune ? 0.5 : 1,
          }}>
            <div style={{
              width: '8px', height: '8px', borderRadius: '50%', background: p.color,
              boxShadow: p.isIt ? `0 0 6px ${p.color}` : undefined,
            }} />
            <span style={{
              fontSize: '12px',
              fontWeight: p.id === localPlayerId ? '700' : '400',
              color: p.isIt ? '#FF4B6E' : p.id === localPlayerId ? 'white' : 'rgba(255,255,255,0.6)',
            }}>
              {p.name}
            </span>
            {p.isIt && <span style={{ fontSize: '12px' }}>🏷️</span>}
            {p.immune && <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>🛡️</span>}
          </div>
        ))}
      </div>

      {/* YOU ARE IT */}
      {localPlayer?.isIt && (
        <div style={{
          position: 'absolute', bottom: '40px', left: '50%',
          transform: 'translateX(-50%)', zIndex: 50,
        }}>
          <div style={{
            background: 'rgba(255,75,110,0.9)', borderRadius: '16px',
            padding: '14px 28px', fontSize: '20px', fontWeight: '900',
            color: 'white', animation: 'glow 1s ease-in-out infinite alternate',
          }}>
            ⚡ YOU ARE IT — TAG SOMEONE! ⚡
          </div>
        </div>
      )}

      {/* Remote player cursors (React-rendered, smoothed) */}
      {players
        .filter(p => p.id !== localPlayerId)
        .map(p => {
          const pos = getPos(p);
          return <RemoteCursor key={p.id} player={p} x={pos.x} y={pos.y} />;
        })}

      <style>{`
        @keyframes popIn {
          from { transform: translateX(-50%) scale(0.5); opacity: 0; }
          to { transform: translateX(-50%) scale(1); opacity: 1; }
        }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
        @keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
        @keyframes glow {
          from { box-shadow: 0 0 20px rgba(255,75,110,0.4); }
          to { box-shadow: 0 0 60px rgba(255,75,110,0.8); }
        }
        @keyframes immuneShimmer { 0%,100% { opacity:0.4; } 50% { opacity:0.7; } }
        @keyframes itRing {
          0% { transform: scale(0.8); opacity: 0.8; }
          100% { transform: scale(1.4); opacity: 0; }
        }
        @keyframes bounce {
          from { transform: translateY(0); }
          to { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  );
};

const CURSOR_ARROW = `M0 0 L0 28 L7 21 L12 32 L16 30 L11 19 L20 19 Z`;

const RemoteCursor: React.FC<{ player: Player; x: number; y: number }> = ({ player, x, y }) => {
  const { color, name, isIt, immune } = player;
  return (
    <div style={{
      position: 'absolute', left: `${x}%`, top: `${y}%`,
      transform: 'translate(-2px, -2px)',
      pointerEvents: 'none', zIndex: 20,
    }}>
      {isIt && (
        <>
          <div style={{
            position: 'absolute', left: '-20px', top: '-20px',
            width: '60px', height: '60px', borderRadius: '50%',
            border: `2px solid ${color}`,
            animation: 'itRing 1s ease-in-out infinite', opacity: 0.6,
          }} />
          <div style={{
            position: 'absolute', left: '-30px', top: '-30px',
            width: '80px', height: '80px', borderRadius: '50%',
            border: `1px solid ${color}`,
            animation: 'itRing 1s ease-in-out infinite 0.2s', opacity: 0.3,
          }} />
        </>
      )}
      {immune && (
        <div style={{
          position: 'absolute', left: '-14px', top: '-14px',
          width: '48px', height: '48px', borderRadius: '50%',
          border: '2px dashed rgba(255,255,255,0.4)',
          animation: 'immuneShimmer 0.4s ease-in-out infinite',
        }} />
      )}
      <svg width="22" height="30" viewBox="0 0 24 32" fill="none" style={{
        filter: isIt ? `drop-shadow(0 0 6px ${color})` : undefined,
        opacity: immune ? 0.6 : 1,
      }}>
        <path d={CURSOR_ARROW} fill={color} stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
      </svg>
      {isIt && (
        <div style={{
          position: 'absolute', top: '-22px', left: '2px',
          fontSize: '16px', animation: 'bounce 0.5s ease-in-out infinite alternate',
        }}>👑</div>
      )}
      <div style={{
        position: 'absolute', left: '26px', top: '0px',
        background: isIt ? color : 'rgba(0,0,0,0.75)',
        border: `1px solid ${isIt ? 'white' : 'rgba(255,255,255,0.15)'}`,
        borderRadius: '6px', padding: '3px 8px',
        fontSize: '12px', fontWeight: '600',
        color: isIt ? 'white' : 'rgba(255,255,255,0.9)',
        whiteSpace: 'nowrap',
      }}>
        {name}{isIt && ' 🏷️'}
      </div>
    </div>
  );
};

export default GameArena;
