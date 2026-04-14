import React, { useState, useEffect } from 'react';
import { PublicRoom } from './gameTypes';

interface HomeScreenProps {
  onCreateGame: (name: string) => void;
  onJoinGame: (name: string, roomCode: string) => void;
  onBrowseRooms: () => void;
  publicRooms: PublicRoom[];
  connected: boolean;
  connectingSeconds?: number;
  error?: string;
}

function getConnectionMessage(seconds: number): { text: string; emoji: string; color: string } {
  if (seconds < 3)  return { text: 'Connecting to server...', emoji: '🔄', color: 'rgba(255,255,255,0.4)' };
  if (seconds < 8)  return { text: 'Waking up the server...', emoji: '⏳', color: 'rgba(255,183,75,0.8)' };
  if (seconds < 15) return { text: 'Server is starting up, hang tight...', emoji: '☕', color: 'rgba(255,183,75,0.8)' };
  if (seconds < 25) return { text: 'Almost there, server is warming up...', emoji: '🔥', color: 'rgba(255,140,75,0.9)' };
  if (seconds < 40) return { text: 'This is taking a bit — nearly ready!', emoji: '🐢', color: 'rgba(255,140,75,0.9)' };
  return { text: 'Any second now, promise...', emoji: '🤞', color: 'rgba(255,75,110,0.9)' };
}

const HomeScreen: React.FC<HomeScreenProps> = ({
  onCreateGame, onJoinGame, onBrowseRooms, publicRooms, connected, connectingSeconds = 0, error,
}) => {
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [tab, setTab] = useState<'create' | 'join' | 'browse'>('create');

  const connMsg = getConnectionMessage(connectingSeconds);

  // Auto-refresh room list every 3s while on Browse tab
  useEffect(() => {
    if (tab !== 'browse' || !connected) return;
    onBrowseRooms();
    const iv = setInterval(onBrowseRooms, 3000);
    return () => clearInterval(iv);
  }, [tab, connected]);

  const handleQuickJoin = (code: string) => {
    if (!name.trim()) return;
    onJoinGame(name.trim(), code);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f0f1a 0%, #1a0f2e 50%, #0f1a2e 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Inter', 'Segoe UI', sans-serif", color: 'white', padding: '20px',
    }}>
      {/* Animated background cursors */}
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', opacity: 0.15 }}>
        {['#FF4B6E','#4BFFA5','#4B9FFF','#FFB74B','#C84BFF'].map((color, i) => (
          <div key={i} style={{
            position: 'absolute', left: `${15 + i * 18}%`, top: `${20 + (i % 3) * 25}%`,
            animation: `float${i} ${3 + i}s ease-in-out infinite`,
          }}>
            <svg width="24" height="32" viewBox="0 0 24 32" fill="none">
              <path d="M0 0 L0 28 L7 21 L12 32 L16 30 L11 19 L20 19 Z" fill={color} stroke="white" strokeWidth="1.5"/>
            </svg>
          </div>
        ))}
      </div>

      {/* Main card */}
      <div style={{
        width: '100%', maxWidth: '480px',
        background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', padding: '48px',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ fontSize: '48px', marginBottom: '8px' }}>🏷️</div>
          <h1 style={{ fontSize: '48px', fontWeight: '900', margin: 0, letterSpacing: '-2px', color: 'white' }}>
            CURSOR TAG
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', margin: '8px 0 0', fontSize: '15px' }}>
            Real-time multiplayer cursor mayhem
          </p>
        </div>

        {/* Connection status */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', marginBottom: '32px' }}>
          {connected ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4BFFA5', boxShadow: '0 0 8px #4BFFA5' }} />
              <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>Connected to server</span>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#FF4B6E', boxShadow: '0 0 8px #FF4B6E', animation: 'pulseDot 1s ease-in-out infinite' }} />
                <span style={{ fontSize: '13px', color: connMsg.color, fontWeight: '600', transition: 'color 0.5s' }}>
                  {connMsg.emoji} {connMsg.text}
                </span>
              </div>
              {connectingSeconds >= 3 && (
                <div style={{ width: '200px', height: '3px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: '2px',
                    background: connectingSeconds < 15 ? '#FFB74B' : connectingSeconds < 30 ? '#FF8C4B' : '#FF4B6E',
                    width: `${Math.min(100, (connectingSeconds / 50) * 100)}%`,
                    transition: 'width 1s linear, background 0.5s',
                  }} />
                </div>
              )}
              {connectingSeconds >= 8 && (
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)' }}>
                  {connectingSeconds}s — free servers wake up after being idle
                </span>
              )}
            </>
          )}
        </div>

        {error && (
          <div style={{
            background: 'rgba(255,75,110,0.15)', border: '1px solid rgba(255,75,110,0.4)',
            borderRadius: '12px', padding: '12px 16px', marginBottom: '24px',
            color: '#FF4B6E', fontSize: '14px', textAlign: 'center',
          }}>{error}</div>
        )}

        {/* Tab toggle */}
        <div style={{
          display: 'flex', background: 'rgba(255,255,255,0.05)',
          borderRadius: '12px', padding: '4px', marginBottom: '24px',
        }}>
          {(['create', 'join', 'browse'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex: 1, padding: '10px', border: 'none', borderRadius: '10px',
              cursor: 'pointer', fontWeight: '600', fontSize: '13px', transition: 'all 0.2s',
              background: tab === t ? 'rgba(255,255,255,0.12)' : 'transparent',
              color: tab === t ? 'white' : 'rgba(255,255,255,0.4)',
            }}>
              {t === 'create' ? '✨ Create' : t === 'join' ? '🔗 Join' : '🌐 Browse'}
            </button>
          ))}
        </div>

        {/* Name field — always shown */}
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Your name"
          maxLength={20}
          style={inputStyle}
        />

        {/* Create tab */}
        {tab === 'create' && (
          <button
            onClick={() => { if (name.trim() && connected) onCreateGame(name.trim()); }}
            disabled={!connected || !name.trim()}
            style={{
              width: '100%', padding: '16px', border: 'none', borderRadius: '14px',
              background: 'linear-gradient(135deg, #FF4B6E, #C84BFF)', color: 'white',
              fontWeight: '700', fontSize: '16px', cursor: 'pointer',
              opacity: (!connected || !name.trim()) ? 0.4 : 1, transition: 'all 0.2s',
            }}
          >🚀 Create Game</button>
        )}

        {/* Join tab */}
        {tab === 'join' && (
          <>
            <input
              value={roomCode}
              onChange={e => setRoomCode(e.target.value.toUpperCase())}
              placeholder="Room code (e.g. AB12C)"
              maxLength={5}
              style={{ ...inputStyle, letterSpacing: '4px', textTransform: 'uppercase' }}
            />
            <button
              onClick={() => { if (name.trim() && roomCode.trim()) onJoinGame(name.trim(), roomCode.trim().toUpperCase()); }}
              disabled={!connected || !name.trim() || !roomCode.trim()}
              style={{
                width: '100%', padding: '16px', border: 'none', borderRadius: '14px',
                background: 'linear-gradient(135deg, #FF4B6E, #C84BFF)', color: 'white',
                fontWeight: '700', fontSize: '16px', cursor: 'pointer',
                opacity: (!connected || !name.trim() || !roomCode.trim()) ? 0.4 : 1,
                transition: 'all 0.2s',
              }}
            >🎮 Join Game</button>
          </>
        )}

        {/* Browse tab */}
        {tab === 'browse' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase' }}>
                Open Rooms
              </span>
              <button onClick={onBrowseRooms} style={{
                padding: '4px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.12)',
                background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)',
                fontSize: '12px', cursor: 'pointer', fontWeight: '600',
              }}>↻ Refresh</button>
            </div>

            {publicRooms.length === 0 ? (
              <div style={{
                padding: '32px 20px', textAlign: 'center',
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '14px', color: 'rgba(255,255,255,0.3)', fontSize: '14px',
              }}>
                No public rooms open right now
                <div style={{ marginTop: '8px', fontSize: '12px' }}>Create one and flip it to public!</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {publicRooms.map(r => (
                  <div key={r.code} style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '14px', padding: '14px 16px',
                  }}>
                    <div style={{ fontSize: '22px' }}>{r.mode === 'zombie' ? '🧟' : '🏷️'}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: '700', fontSize: '14px', marginBottom: '2px' }}>
                        {r.hostName}'s room
                      </div>
                      <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <span>{r.mode === 'zombie' ? 'Zombie Mode' : 'Classic Tag'}</span>
                        <span>·</span>
                        <span>{r.humanCount}/{r.maxPlayers} players</span>
                        <span>·</span>
                        <span style={{ color: r.openSlots <= 2 ? '#FFB74B' : 'rgba(255,255,255,0.4)' }}>
                          {r.openSlots} slot{r.openSlots !== 1 ? 's' : ''} open
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleQuickJoin(r.code)}
                      disabled={!name.trim()}
                      style={{
                        padding: '8px 16px', borderRadius: '10px', border: 'none',
                        background: name.trim()
                          ? r.mode === 'zombie'
                            ? 'linear-gradient(135deg, #1a8c2e, #4dff6e)'
                            : 'linear-gradient(135deg, #FF4B6E, #C84BFF)'
                          : 'rgba(255,255,255,0.08)',
                        color: name.trim() ? 'white' : 'rgba(255,255,255,0.3)',
                        fontWeight: '700', fontSize: '13px',
                        cursor: name.trim() ? 'pointer' : 'not-allowed',
                        whiteSpace: 'nowrap', flexShrink: 0,
                      }}
                    >
                      {name.trim() ? 'Join →' : 'Enter name'}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {!name.trim() && publicRooms.length > 0 && (
              <div style={{ marginTop: '10px', fontSize: '12px', color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>
                Enter your name above to join a room
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes float0 { 0%,100% { transform: translate(0,0) rotate(-5deg); } 50% { transform: translate(20px,30px) rotate(5deg); } }
        @keyframes float1 { 0%,100% { transform: translate(0,0) rotate(10deg); } 50% { transform: translate(-30px,20px) rotate(-10deg); } }
        @keyframes float2 { 0%,100% { transform: translate(0,0); } 50% { transform: translate(15px,-25px); } }
        @keyframes float3 { 0%,100% { transform: translate(0,0) rotate(15deg); } 50% { transform: translate(-20px,35px) rotate(-5deg); } }
        @keyframes float4 { 0%,100% { transform: translate(0,0); } 50% { transform: translate(25px,-15px) rotate(8deg); } }
        @keyframes pulseDot { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:0.4; transform:scale(0.7); } }
        html, body, #root { height: auto !important; overflow: visible !important; }
      `}</style>
    </div>
  );
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '14px 18px', marginBottom: '12px',
  background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: '12px', color: 'white', fontSize: '16px', outline: 'none', boxSizing: 'border-box',
};

export default HomeScreen;
