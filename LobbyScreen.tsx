import React, { useState } from 'react';
import { Player } from './gameTypes';

interface LobbyScreenProps {
  roomCode: string;
  players: Player[];
  localPlayerId: string;
  isHost: boolean;
  onStartGame: () => void;
  onBack: () => void;
  onAddBot: (difficulty: 'easy' | 'medium' | 'hard') => void;
  onRemoveBot: (botId: string) => void;
}

const DIFFICULTY_CONFIG = {
  easy:   { label: 'Easy',   emoji: '🟢', desc: 'Slow & clumsy' },
  medium: { label: 'Medium', emoji: '🟡', desc: 'Decent reactions' },
  hard:   { label: 'Hard',   emoji: '🔴', desc: 'Fast & relentless' },
};

const LobbyScreen: React.FC<LobbyScreenProps> = ({
  roomCode, players, localPlayerId, isHost, onStartGame, onBack, onAddBot, onRemoveBot,
}) => {
  const [selectedDifficulty, setSelectedDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [copied, setCopied] = useState(false);

  const humanPlayers = players.filter(p => !p.isBot);
  const bots = players.filter(p => p.isBot);
  const canAddBot = players.length < 8;
  const canStart = players.length >= 2;

  const copyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f0f1a 0%, #1a0f2e 50%, #0f1a2e 100%)',
      fontFamily: "'Inter', 'Segoe UI', sans-serif", color: 'white', padding: '20px',
      overflowY: 'auto',
    }}>
      <div style={{ width: '100%', maxWidth: '520px', margin: '0 auto', paddingTop: '40px', paddingBottom: '40px' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '40px', marginBottom: '8px' }}>🏷️</div>
          <h1 style={{
            fontSize: '32px', fontWeight: '900', margin: '0 0 8px',
            background: 'linear-gradient(135deg, #a78bfa, #60a5fa)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>Game Lobby</h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', margin: 0, fontSize: '14px' }}>
            {isHost ? 'Share the code and add bots to fill the room' : 'Waiting for host to start...'}
          </p>
        </div>

        {/* Room code */}
        <div style={{
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '16px', padding: '20px 24px', marginBottom: '20px', textAlign: 'center',
        }}>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '8px', letterSpacing: '1px', textTransform: 'uppercase' }}>
            Room Code
          </div>
          <div style={{ fontSize: '42px', fontWeight: '900', letterSpacing: '8px', color: 'white', marginBottom: '12px' }}>
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
            <span>{players.length} / 8</span>
          </div>

          {/* Human players */}
          {humanPlayers.map((p, i) => (
            <div key={p.id} style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '14px 20px',
              borderBottom: (i < humanPlayers.length - 1 || bots.length > 0) ? '1px solid rgba(255,255,255,0.04)' : 'none',
              background: p.id === localPlayerId ? 'rgba(255,255,255,0.04)' : 'transparent',
            }}>
              <div style={{
                width: '10px', height: '10px', borderRadius: '50%', background: p.color,
                boxShadow: `0 0 8px ${p.color}60`, flexShrink: 0,
              }} />
              <span style={{ flex: 1, fontWeight: p.id === localPlayerId ? '700' : '500', fontSize: '15px' }}>
                {p.name}
              </span>
              {p.id === localPlayerId && (
                <span style={{
                  fontSize: '11px', padding: '2px 8px', borderRadius: '6px',
                  background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)',
                }}>You</span>
              )}
              {i === 0 && (
                <span style={{
                  fontSize: '11px', padding: '2px 8px', borderRadius: '6px',
                  background: 'rgba(255,183,75,0.15)', color: '#FFB74B',
                }}>👑 Host</span>
              )}
            </div>
          ))}

          {/* Bot players */}
          {bots.map((bot, i) => {
            const diff = DIFFICULTY_CONFIG[bot.difficulty as keyof typeof DIFFICULTY_CONFIG] || DIFFICULTY_CONFIG.medium;
            return (
              <div key={bot.id} style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '14px 20px',
                borderBottom: i < bots.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                background: 'rgba(255,255,255,0.02)',
              }}>
                <div style={{
                  width: '10px', height: '10px', borderRadius: '50%', background: bot.color,
                  opacity: 0.7, flexShrink: 0,
                }} />
                <span style={{ flex: 1, fontSize: '15px', color: 'rgba(255,255,255,0.7)' }}>
                  {bot.name}
                </span>
                <span style={{
                  fontSize: '11px', padding: '2px 8px', borderRadius: '6px',
                  background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)',
                }}>
                  🤖 {diff.emoji} {diff.label}
                </span>
                {isHost && (
                  <button onClick={() => onRemoveBot(bot.id)} style={{
                    width: '24px', height: '24px', borderRadius: '6px',
                    border: '1px solid rgba(255,75,110,0.3)',
                    background: 'rgba(255,75,110,0.1)',
                    color: '#FF4B6E', fontSize: '14px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: 0, lineHeight: 1,
                  }}>×</button>
                )}
              </div>
            );
          })}

          {/* Empty slots */}
          {Array.from({ length: Math.max(0, 2 - players.length) }).map((_, i) => (
            <div key={`empty-${i}`} style={{
              padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '12px',
              borderTop: '1px solid rgba(255,255,255,0.04)',
            }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
              <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.2)', fontStyle: 'italic' }}>
                Waiting for player...
              </span>
            </div>
          ))}
        </div>

        {/* Add bot section — host only */}
        {isHost && canAddBot && (
          <div style={{
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '16px', padding: '16px 20px', marginBottom: '20px',
          }}>
            <div style={{ fontSize: '12px', fontWeight: '700', color: 'rgba(255,255,255,0.4)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '12px' }}>
              🤖 Add Bot
            </div>

            {/* Difficulty selector */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              {(Object.entries(DIFFICULTY_CONFIG) as [string, typeof DIFFICULTY_CONFIG.easy][]).map(([key, config]) => (
                <button
                  key={key}
                  onClick={() => setSelectedDifficulty(key as 'easy' | 'medium' | 'hard')}
                  style={{
                    flex: 1, padding: '10px 8px', borderRadius: '10px', cursor: 'pointer',
                    border: selectedDifficulty === key
                      ? '1px solid rgba(255,255,255,0.3)'
                      : '1px solid rgba(255,255,255,0.08)',
                    background: selectedDifficulty === key
                      ? 'rgba(255,255,255,0.1)'
                      : 'rgba(255,255,255,0.03)',
                    color: 'white', textAlign: 'center', transition: 'all 0.15s',
                  }}
                >
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

        {/* Start / back buttons */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={onBack} style={{
            flex: 1, padding: '16px', borderRadius: '14px',
            border: '1px solid rgba(255,255,255,0.12)',
            background: 'rgba(255,255,255,0.04)',
            color: 'rgba(255,255,255,0.6)', fontWeight: '600', fontSize: '15px', cursor: 'pointer',
          }}>← Back</button>

          {isHost && (
            <button
              onClick={onStartGame}
              disabled={!canStart}
              style={{
                flex: 3, padding: '16px', borderRadius: '14px', border: 'none',
                background: canStart
                  ? 'linear-gradient(135deg, #FF4B6E, #C84BFF)'
                  : 'rgba(255,255,255,0.08)',
                color: canStart ? 'white' : 'rgba(255,255,255,0.3)',
                fontWeight: '700', fontSize: '16px',
                cursor: canStart ? 'pointer' : 'not-allowed',
              }}
            >
              {canStart ? '🚀 Start Game' : `Need ${2 - players.length} more player${2 - players.length !== 1 ? 's' : ''}`}
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
    </div>
  );
};

export default LobbyScreen;
