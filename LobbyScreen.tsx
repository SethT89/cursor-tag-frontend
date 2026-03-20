import React, { useState } from 'react';
import { Player, GameMode } from './gameTypes';

interface LobbyScreenProps {
  roomCode: string;
  players: Player[];
  localPlayerId: string;
  isHost: boolean;
  mode: GameMode;
  onStartGame: () => void;
  onBack: () => void;
  onAddBot: (difficulty: 'easy' | 'medium' | 'hard') => void;
  onRemoveBot: (botId: string) => void;
  onSetMode: (mode: GameMode) => void;
}

const DIFFICULTY_CONFIG = {
  easy:   { label: 'Easy',   emoji: '🟢', desc: 'Slow & clumsy' },
  medium: { label: 'Medium', emoji: '🟡', desc: 'Decent reactions' },
  hard:   { label: 'Hard',   emoji: '🔴', desc: 'Fast & relentless' },
};

const LobbyScreen: React.FC<LobbyScreenProps> = ({
  roomCode, players, localPlayerId, isHost, mode, onStartGame, onBack, onAddBot, onRemoveBot, onSetMode,
}) => {
  const [selectedDifficulty, setSelectedDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [copied, setCopied] = useState(false);

  const maxPlayers = mode === 'zombie' ? 12 : 8;
  const humanPlayers = players.filter(p => !p.isBot);
  const bots = players.filter(p => p.isBot);
  const canAddBot = players.length < maxPlayers;
  const canStart = players.length >= 2;

  const copyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: mode === 'zombie'
        ? 'linear-gradient(135deg, #0a0f0a 0%, #0f1a0f 50%, #0a0f14 100%)'
        : 'linear-gradient(135deg, #0f0f1a 0%, #1a0f2e 50%, #0f1a2e 100%)',
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
      color: 'white',
    }}>
      <div style={{ width: '100%', maxWidth: '520px', margin: '0 auto', padding: '40px 20px 60px' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '40px', marginBottom: '8px' }}>{mode === 'zombie' ? '🧟' : '🏷️'}</div>
          <h1 style={{
            fontSize: '32px', fontWeight: '900', margin: '0 0 8px',
            background: mode === 'zombie'
              ? 'linear-gradient(135deg, #4dff6e, #a0ff4b)'
              : 'linear-gradient(135deg, #a78bfa, #60a5fa)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>Game Lobby</h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', margin: 0, fontSize: '14px' }}>
            {isHost ? 'Choose a mode, add bots, and start when ready' : 'Waiting for host to start...'}
          </p>
        </div>

        {/* Mode selector — host only */}
        {isHost && (
          <div style={{
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '16px', padding: '16px 20px', marginBottom: '20px',
          }}>
            <div style={{ fontSize: '12px', fontWeight: '700', color: 'rgba(255,255,255,0.4)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '12px' }}>
              🎮 Game Mode
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => onSetMode('classic')} style={{
                flex: 1, padding: '14px 10px', borderRadius: '12px', cursor: 'pointer',
                border: mode === 'classic' ? '2px solid rgba(167,139,250,0.7)' : '1px solid rgba(255,255,255,0.08)',
                background: mode === 'classic' ? 'rgba(167,139,250,0.15)' : 'rgba(255,255,255,0.03)',
                color: 'white', transition: 'all 0.2s',
              }}>
                <div style={{ fontSize: '24px', marginBottom: '4px' }}>🏷️</div>
                <div style={{ fontWeight: '700', fontSize: '13px' }}>Classic Tag</div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>60s · Up to 8 players</div>
              </button>
              <button onClick={() => onSetMode('zombie')} style={{
                flex: 1, padding: '14px 10px', borderRadius: '12px', cursor: 'pointer',
                border: mode === 'zombie' ? '2px solid rgba(77,255,110,0.7)' : '1px solid rgba(255,255,255,0.08)',
                background: mode === 'zombie' ? 'rgba(77,255,110,0.1)' : 'rgba(255,255,255,0.03)',
                color: 'white', transition: 'all 0.2s',
              }}>
                <div style={{ fontSize: '24px', marginBottom: '4px' }}>🧟</div>
                <div style={{ fontWeight: '700', fontSize: '13px' }}>Zombie Mode</div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>3min · Up to 12 players</div>
              </button>
            </div>
            {mode === 'zombie' && (
              <div style={{ marginTop: '10px', padding: '8px 12px', background: 'rgba(77,255,110,0.07)', borderRadius: '8px', fontSize: '12px', color: 'rgba(77,255,110,0.8)' }}>
                🧟 One zombie hunts everyone. Get infected and join the horde. Last human wins!
              </div>
            )}
          </div>
        )}

        {/* Mode badge for non-hosts */}
        {!isHost && (
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <span style={{
              display: 'inline-block', padding: '6px 16px', borderRadius: '20px',
              background: mode === 'zombie' ? 'rgba(77,255,110,0.1)' : 'rgba(167,139,250,0.1)',
              border: `1px solid ${mode === 'zombie' ? 'rgba(77,255,110,0.3)' : 'rgba(167,139,250,0.3)'}`,
              color: mode === 'zombie' ? '#4dff6e' : '#a78bfa',
              fontSize: '13px', fontWeight: '600',
            }}>
              {mode === 'zombie' ? '🧟 Zombie Mode' : '🏷️ Classic Tag'}
            </span>
          </div>
        )}

        {/* Room code */}
        <div style={{
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '16px', padding: '20px 24px', marginBottom: '20px', textAlign: 'center',
        }}>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '8px', letterSpacing: '1px', textTransform: 'uppercase' }}>
            Room Code
          </div>
          <div style={{ fontSize: '42px', fontWeight: '900', letterSpacing: '8px', marginBottom: '12px' }}>
            {roomCode}
          </div>
          <button onClick={copyCode} style={{
            padding: '8px 20px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.15)',
            background: copied ? 'rgba(75,255,165,0.15)' : 'rgba(255,255,255,0.06)',
            color: copied ? '#4BFFA5' : 'rgba(255,255,255,0.7)',
            fontSize: '13px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s',
          }}>
            {copied ? '✓ Copied!' : '📋 Copy Code'}
          </button>
        </div>

        {/* Players list */}
        <div style={{
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '16px', marginBottom: '20px', overflow: 'hidden',
        }}>
          <div style={{
            padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)',
            fontSize: '12px', fontWeight: '700', color: 'rgba(255,255,255,0.4)',
            letterSpacing: '1px', textTransform: 'uppercase', display: 'flex', justifyContent: 'space-between',
          }}>
            <span>Players</span>
            <span>{players.length} / {maxPlayers}</span>
          </div>

          {humanPlayers.map((p, i) => (
            <div key={p.id} style={{
              display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 20px',
              borderBottom: (i < humanPlayers.length - 1 || bots.length > 0) ? '1px solid rgba(255,255,255,0.04)' : 'none',
              background: p.id === localPlayerId ? 'rgba(255,255,255,0.04)' : 'transparent',
            }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: p.color, boxShadow: `0 0 8px ${p.color}60`, flexShrink: 0 }} />
              <span style={{ flex: 1, fontWeight: p.id === localPlayerId ? '700' : '500', fontSize: '15px' }}>{p.name}</span>
              {p.id === localPlayerId && <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '6px', background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}>You</span>}
              {i === 0 && <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '6px', background: 'rgba(255,183,75,0.15)', color: '#FFB74B' }}>👑 Host</span>}
            </div>
          ))}

          {bots.map((bot, i) => {
            const diff = DIFFICULTY_CONFIG[bot.difficulty as keyof typeof DIFFICULTY_CONFIG] || DIFFICULTY_CONFIG.medium;
            return (
              <div key={bot.id} style={{
                display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 20px',
                borderBottom: i < bots.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                background: 'rgba(255,255,255,0.02)',
              }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: bot.color, opacity: 0.7, flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: '15px', color: 'rgba(255,255,255,0.7)' }}>{bot.name}</span>
                <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '6px', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>
                  🤖 {diff.emoji} {diff.label}
                </span>
                {isHost && (
                  <button onClick={() => onRemoveBot(bot.id)} style={{
                    width: '24px', height: '24px', borderRadius: '6px',
                    border: '1px solid rgba(255,75,110,0.3)', background: 'rgba(255,75,110,0.1)',
                    color: '#FF4B6E', fontSize: '14px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
                  }}>×</button>
                )}
              </div>
            );
          })}

          {Array.from({ length: Math.max(0, 2 - players.length) }).map((_, i) => (
            <div key={`empty-${i}`} style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '12px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
              <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.2)', fontStyle: 'italic' }}>Waiting for player...</span>
            </div>
          ))}
        </div>

        {/* Add bot — host only */}
        {isHost && canAddBot && (
          <div style={{
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '16px', padding: '16px 20px', marginBottom: '20px',
          }}>
            <div style={{ fontSize: '12px', fontWeight: '700', color: 'rgba(255,255,255,0.4)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '12px' }}>
              🤖 Add Bot
            </div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              {(Object.entries(DIFFICULTY_CONFIG) as [string, typeof DIFFICULTY_CONFIG.easy][]).map(([key, config]) => (
                <button key={key} onClick={() => setSelectedDifficulty(key as 'easy' | 'medium' | 'hard')} style={{
                  flex: 1, padding: '10px 8px', borderRadius: '10px', cursor: 'pointer',
                  border: selectedDifficulty === key ? '1px solid rgba(255,255,255,0.3)' : '1px solid rgba(255,255,255,0.08)',
                  background: selectedDifficulty === key ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.03)',
                  color: 'white', textAlign: 'center', transition: 'all 0.15s',
                }}>
                  <div style={{ fontSize: '16px', marginBottom: '2px' }}>{config.emoji}</div>
                  <div style={{ fontSize: '12px', fontWeight: '700' }}>{config.label}</div>
                  <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>{config.desc}</div>
                </button>
              ))}
            </div>
            <button onClick={() => onAddBot(selectedDifficulty)} style={{
              width: '100%', padding: '12px', borderRadius: '10px',
              border: '1px solid rgba(75,159,255,0.3)',
              background: 'rgba(75,159,255,0.15)',
              color: '#4B9FFF', fontWeight: '700', fontSize: '14px', cursor: 'pointer',
            }}>
              + Add {DIFFICULTY_CONFIG[selectedDifficulty].label} Bot
            </button>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={onBack} style={{
            flex: 1, padding: '16px', borderRadius: '14px',
            border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)',
            color: 'rgba(255,255,255,0.6)', fontWeight: '600', fontSize: '15px', cursor: 'pointer',
          }}>← Back</button>

          {isHost && (
            <button onClick={onStartGame} disabled={!canStart} style={{
              flex: 3, padding: '16px', borderRadius: '14px', border: 'none',
              background: canStart
                ? mode === 'zombie'
                  ? 'linear-gradient(135deg, #1a8c2e, #4dff6e)'
                  : 'linear-gradient(135deg, #FF4B6E, #C84BFF)'
                : 'rgba(255,255,255,0.08)',
              color: canStart ? 'white' : 'rgba(255,255,255,0.3)',
              fontWeight: '700', fontSize: '16px',
              cursor: canStart ? 'pointer' : 'not-allowed',
            }}>
              {canStart
                ? mode === 'zombie' ? '🧟 Start Zombie Game' : '🚀 Start Game'
                : `Need ${2 - players.length} more player${2 - players.length !== 1 ? 's' : ''}`}
            </button>
          )}

          {!isHost && (
            <div style={{
              flex: 3, padding: '16px', borderRadius: '14px',
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.4)', fontSize: '15px', textAlign: 'center',
            }}>
              ⏳ Waiting for host...
            </div>
          )}
        </div>
      </div>

      <style>{`
        html, body, #root { height: auto !important; overflow: visible !important; }
      `}</style>
    </div>
  );
};

export default LobbyScreen;
