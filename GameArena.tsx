import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Player } from '../game/gameTypes';

interface GameArenaProps {
  players: Player[];
  localPlayerId: string;
  itPlayerId: string;
  timeLeft: number; // ms
  countdown?: number | null;
  onMouseMove: (x: number, y: number) => void;
}

const CURSOR_ARROW = `M0 0 L0 28 L7 21 L12 32 L16 30 L11 19 L20 19 Z`;

const GameArena: React.FC<GameArenaProps> = ({
  players, localPlayerId, itPlayerId, timeLeft, countdown, onMouseMove,
}) => {
  const arenaRef = useRef<HTMLDivElement>(null);
  const localPlayer = players.find(p => p.id === localPlayerId);
  const itPlayer = players.find(p => p.id === itPlayerId);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const arena = arenaRef.current;
    if (!arena) return;
    const rect = arena.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    onMouseMove(
      Math.max(0, Math.min(100, x)),
      Math.max(0, Math.min(100, y)),
    );
  }, [onMouseMove]);

  const seconds = Math.ceil(timeLeft / 1000);
  const isLow = seconds <= 10;
  const pct = timeLeft / 60000;

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: '#0a0a14',
      overflow: 'hidden',
      position: 'relative',
      cursor: 'none',
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
    }}
      ref={arenaRef}
      onMouseMove={handleMouseMove}
    >
      {/* Grid background */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.05 }}>
        <defs>
          <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="white" strokeWidth="0.5"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)"/>
      </svg>

      {/* Countdown overlay */}
      {countdown != null && countdown > 0 && (
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(8px)',
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: '180px',
              fontWeight: '900',
              lineHeight: 1,
              background: 'linear-gradient(135deg, #FF4B6E, #C84BFF)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
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

      {/* HUD - Timer */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 50,
        textAlign: 'center',
      }}>
        <div style={{
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(16px)',
          border: `1px solid ${isLow ? 'rgba(255,75,110,0.5)' : 'rgba(255,255,255,0.1)'}`,
          borderRadius: '20px',
          padding: '12px 32px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '16px',
        }}>
          {/* Timer bar */}
          <div style={{ width: '120px', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px' }}>
            <div style={{
              height: '100%',
              borderRadius: '2px',
              width: `${pct * 100}%`,
              background: isLow ? '#FF4B6E' : 'linear-gradient(90deg, #4B9FFF, #4BFFA5)',
              transition: 'width 0.1s linear',
              boxShadow: isLow ? '0 0 8px #FF4B6E' : undefined,
            }} />
          </div>
          <span style={{
            fontSize: '28px',
            fontWeight: '900',
            color: isLow ? '#FF4B6E' : 'white',
            fontVariantNumeric: 'tabular-nums',
            minWidth: '52px',
            textAlign: 'center',
            animation: isLow && seconds <= 5 ? 'pulse 0.5s ease-in-out infinite' : undefined,
          }}>
            {seconds}s
          </span>
        </div>
      </div>

      {/* HUD - IT indicator */}
      {itPlayer && (
        <div style={{
          position: 'absolute',
          top: '80px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 50,
        }}>
          <div style={{
            background: 'rgba(255,75,110,0.15)',
            border: '1px solid rgba(255,75,110,0.4)',
            borderRadius: '12px',
            padding: '6px 16px',
            fontSize: '13px',
            color: '#FF4B6E',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <span style={{ animation: 'spin 2s linear infinite', display: 'inline-block' }}>⚡</span>
            <span style={{ color: itPlayer.color, fontWeight: '700' }}>{itPlayer.name}</span>
            <span>is IT</span>
          </div>
        </div>
      )}

      {/* Player list sidebar */}
      <div style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
      }}>
        {players.map(p => (
          <div key={p.id} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 12px',
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(8px)',
            borderRadius: '10px',
            border: `1px solid ${p.isIt ? 'rgba(255,75,110,0.5)' : 'rgba(255,255,255,0.06)'}`,
            opacity: p.immune ? 0.5 : 1,
          }}>
            <div style={{
              width: '8px', height: '8px', borderRadius: '50%',
              background: p.color,
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

      {/* LOCAL player "YOU ARE IT" alert */}
      {localPlayer?.isIt && (
        <div style={{
          position: 'absolute',
          bottom: '40px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 50,
          animation: 'popIn 0.3s ease-out',
        }}>
          <div style={{
            background: 'rgba(255,75,110,0.9)',
            borderRadius: '16px',
            padding: '14px 28px',
            fontSize: '20px',
            fontWeight: '900',
            color: 'white',
            textAlign: 'center',
            boxShadow: '0 0 40px rgba(255,75,110,0.5)',
            animation: 'glow 1s ease-in-out infinite alternate',
          }}>
            ⚡ YOU ARE IT — TAG SOMEONE! ⚡
          </div>
        </div>
      )}

      {/* Render all player cursors */}
      {players.map(p => (
        <PlayerCursor key={p.id} player={p} isLocal={p.id === localPlayerId} />
      ))}

      <style>{`
        @keyframes popIn {
          from { transform: translateX(-50%) scale(0.5); opacity: 0; }
          to { transform: translateX(-50%) scale(1); opacity: 1; }
        }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes glow {
          from { box-shadow: 0 0 20px rgba(255,75,110,0.4); }
          to { box-shadow: 0 0 60px rgba(255,75,110,0.8); }
        }
        @keyframes immuneShimmer {
          0%,100% { opacity: 0.4; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
};

const PlayerCursor: React.FC<{ player: Player; isLocal: boolean }> = ({ player, isLocal }) => {
  const { x, y, color, name, isIt, immune } = player;

  return (
    <div style={{
      position: 'absolute',
      left: `${x}%`,
      top: `${y}%`,
      transform: 'translate(-2px, -2px)',
      pointerEvents: 'none',
      zIndex: isLocal ? 30 : 20,
      transition: isLocal ? 'none' : 'left 0.05s linear, top 0.05s linear',
    }}>
      {/* IT pulsing ring */}
      {isIt && (
        <>
          <div style={{
            position: 'absolute',
            left: '-20px',
            top: '-20px',
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            border: `2px solid ${color}`,
            animation: 'itRing 1s ease-in-out infinite',
            opacity: 0.6,
          }} />
          <div style={{
            position: 'absolute',
            left: '-30px',
            top: '-30px',
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            border: `1px solid ${color}`,
            animation: 'itRing 1s ease-in-out infinite 0.2s',
            opacity: 0.3,
          }} />
        </>
      )}

      {/* Immune shimmer */}
      {immune && (
        <div style={{
          position: 'absolute',
          left: '-14px',
          top: '-14px',
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          border: '2px dashed rgba(255,255,255,0.4)',
          animation: 'immuneShimmer 0.4s ease-in-out infinite',
        }} />
      )}

      {/* Cursor SVG */}
      <svg
        width="22"
        height="30"
        viewBox="0 0 24 32"
        fill="none"
        style={{
          filter: isIt ? `drop-shadow(0 0 6px ${color})` : undefined,
          opacity: immune ? 0.6 : 1,
        }}
      >
        <path d={CURSOR_ARROW} fill={color} stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
      </svg>

      {/* IT crown */}
      {isIt && (
        <div style={{
          position: 'absolute',
          top: '-22px',
          left: '2px',
          fontSize: '16px',
          animation: 'bounce 0.5s ease-in-out infinite alternate',
        }}>
          👑
        </div>
      )}

      {/* Name tag */}
      <div style={{
        position: 'absolute',
        left: '26px',
        top: '0px',
        background: isIt ? color : 'rgba(0,0,0,0.75)',
        border: `1px solid ${isIt ? 'white' : 'rgba(255,255,255,0.15)'}`,
        borderRadius: '6px',
        padding: '3px 8px',
        fontSize: '12px',
        fontWeight: '600',
        color: isIt ? 'white' : 'rgba(255,255,255,0.9)',
        whiteSpace: 'nowrap',
        backdropFilter: 'blur(8px)',
        boxShadow: isIt ? `0 0 12px ${color}60` : undefined,
      }}>
        {name}
        {isIt && ' 🏷️'}
      </div>

      <style>{`
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

export default GameArena;
