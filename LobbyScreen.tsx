import React from 'react';
import { Player } from '../game/gameTypes';

interface LobbyScreenProps {
  roomCode: string;
  players: Player[];
  localPlayerId: string;
  isHost: boolean;
  onStartGame: () => void;
  onBack: () => void;
}

const LobbyScreen: React.FC<LobbyScreenProps> = ({
  roomCode, players, localPlayerId, isHost, onStartGame, onBack,
}) => {
  const canStart = isHost && players.length >= 2;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f0f1a 0%, #1a0f2e 50%, #0f1a2e 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
      color: 'white',
      padding: '20px',
    }}>
      <div style={{
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '24px',
        padding: '48px',
        width: '100%',
        maxWidth: '520px',
      }}>
        <button onClick={onBack} style={{
          background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)',
          cursor: 'pointer', fontSize: '14px', marginBottom: '24px', padding: 0,
        }}>
          ← Back
        </button>

        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <p style={{ margin: '0 0 8px', color: 'rgba(255,255,255,0.5)', fontSize: '13px', letterSpacing: '2px', textTransform: 'uppercase' }}>
            Room Code
          </p>
          <div style={{
            fontSize: '48px',
            fontWeight: '900',
            letterSpacing: '8px',
            background: 'linear-gradient(135deg, #4B9FFF, #4BFFA5)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            {roomCode}
          </div>
          <p style={{ margin: '8px 0 0', color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>
            Share this code with friends
          </p>
        </div>

        {/* Players list */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: 'rgba(255,255,255,0.6)' }}>
              PLAYERS
            </h3>
            <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>
              {players.length}/8
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {players.map((p, i) => (
              <div key={p.id} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                padding: '14px 18px',
                background: p.id === localPlayerId
                  ? 'rgba(255,255,255,0.08)'
                  : 'rgba(255,255,255,0.03)',
                border: `1px solid ${p.id === localPlayerId ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.06)'}`,
                borderRadius: '14px',
              }}>
                {/* Cursor icon */}
                <svg width="18" height="24" viewBox="0 0 24 32" fill="none">
                  <path d="M0 0 L0 28 L7 21 L12 32 L16 30 L11 19 L20 19 Z" fill={p.color} stroke="white" strokeWidth="1.5"/>
                </svg>
                {/* Color dot */}
                <div style={{
                  width: '10px', height: '10px', borderRadius: '50%',
                  background: p.color,
                  boxShadow: `0 0 8px ${p.color}`,
                  flexShrink: 0,
                }} />
                <span style={{ fontWeight: '600', fontSize: '15px', flex: 1 }}>{p.name}</span>
                {p.id === localPlayerId && (
                  <span style={{
                    fontSize: '11px', padding: '3px 8px', borderRadius: '6px',
                    background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)',
                  }}>
                    YOU
                  </span>
                )}
                {i === 0 && (
                  <span style={{
                    fontSize: '11px', padding: '3px 8px', borderRadius: '6px',
                    background: 'rgba(255,183,75,0.15)', color: '#FFB74B',
                  }}>
                    HOST
                  </span>
                )}
              </div>
            ))}

            {/* Empty slots */}
            {Array.from({ length: Math.max(0, 2 - players.length) }).map((_, i) => (
              <div key={`empty-${i}`} style={{
                padding: '14px 18px',
                background: 'rgba(255,255,255,0.02)',
                border: '1px dashed rgba(255,255,255,0.08)',
                borderRadius: '14px',
                color: 'rgba(255,255,255,0.2)',
                fontSize: '14px',
              }}>
                Waiting for player...
              </div>
            ))}
          </div>
        </div>

        {isHost ? (
          <button
            onClick={onStartGame}
            disabled={!canStart}
            style={{
              width: '100%',
              padding: '18px',
              border: 'none',
              borderRadius: '14px',
              background: canStart
                ? 'linear-gradient(135deg, #FF4B6E, #C84BFF)'
                : 'rgba(255,255,255,0.08)',
              color: 'white',
              fontWeight: '700',
              fontSize: '17px',
              cursor: canStart ? 'pointer' : 'not-allowed',
              opacity: canStart ? 1 : 0.5,
              transition: 'all 0.2s',
            }}
          >
            {canStart ? '🚀 Start Game' : `Need ${Math.max(0, 2 - players.length)} more player${players.length === 1 ? '' : 's'}`}
          </button>
        ) : (
          <div style={{
            textAlign: 'center',
            padding: '18px',
            background: 'rgba(255,255,255,0.03)',
            borderRadius: '14px',
            color: 'rgba(255,255,255,0.4)',
            fontSize: '14px',
          }}>
            ⏳ Waiting for host to start...
          </div>
        )}

        <div style={{
          marginTop: '20px',
          padding: '16px',
          background: 'rgba(75,159,255,0.08)',
          border: '1px solid rgba(75,159,255,0.15)',
          borderRadius: '12px',
        }}>
          <p style={{ margin: 0, fontSize: '13px', color: 'rgba(75,159,255,0.8)', lineHeight: 1.6 }}>
            <strong>How to play:</strong> Move your cursor to avoid being IT. 
            Get close enough to another player to tag them. 
            The player IT when time runs out loses! 
            Score points by staying NOT IT and tagging quickly.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LobbyScreen;
