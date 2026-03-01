import React, { useState } from 'react';

interface HomeScreenProps {
  onCreateGame: (name: string) => void;
  onJoinGame: (name: string, roomCode: string) => void;
  connected: boolean;
  error?: string;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ onCreateGame, onJoinGame, connected, error }) => {
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [mode, setMode] = useState<'create' | 'join'>('create');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (mode === 'create') {
      onCreateGame(name.trim());
    } else {
      if (!roomCode.trim()) return;
      onJoinGame(name.trim(), roomCode.trim().toUpperCase());
    }
  };

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
      {/* Animated background cursors */}
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', opacity: 0.15 }}>
        {['#FF4B6E','#4BFFA5','#4B9FFF','#FFB74B','#C84BFF'].map((color, i) => (
          <div key={i} style={{
            position: 'absolute',
            left: `${15 + i * 18}%`,
            top: `${20 + (i % 3) * 25}%`,
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
        width: '100%',
        maxWidth: '480px',
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '24px',
        padding: '48px',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ fontSize: '48px', marginBottom: '8px' }}>🏷️</div>
          <h1 style={{
            fontSize: '48px',
            fontWeight: '900',
            margin: 0,
            background: 'linear-gradient(135deg, #FF4B6E, #4B9FFF, #4BFFA5)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-2px',
          }}>
            CURSOR TAG
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', margin: '8px 0 0', fontSize: '15px' }}>
            Real-time multiplayer cursor mayhem
          </p>
        </div>

        {/* Connection status */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          justifyContent: 'center',
          marginBottom: '32px',
        }}>
          <div style={{
            width: '8px', height: '8px', borderRadius: '50%',
            background: connected ? '#4BFFA5' : '#FF4B6E',
            boxShadow: connected ? '0 0 8px #4BFFA5' : '0 0 8px #FF4B6E',
          }} />
          <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
            {connected ? 'Connected to server' : 'Connecting...'}
          </span>
        </div>

        {error && (
          <div style={{
            background: 'rgba(255,75,110,0.15)',
            border: '1px solid rgba(255,75,110,0.4)',
            borderRadius: '12px',
            padding: '12px 16px',
            marginBottom: '24px',
            color: '#FF4B6E',
            fontSize: '14px',
            textAlign: 'center',
          }}>
            {error}
          </div>
        )}

        {/* Mode toggle */}
        <div style={{
          display: 'flex',
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '12px',
          padding: '4px',
          marginBottom: '24px',
        }}>
          {(['create', 'join'] as const).map(m => (
            <button key={m} onClick={() => setMode(m)} style={{
              flex: 1,
              padding: '10px',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '14px',
              transition: 'all 0.2s',
              background: mode === m ? 'rgba(255,255,255,0.12)' : 'transparent',
              color: mode === m ? 'white' : 'rgba(255,255,255,0.4)',
            }}>
              {m === 'create' ? '✨ Create Room' : '🔗 Join Room'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Your name"
            maxLength={20}
            style={inputStyle}
          />
          {mode === 'join' && (
            <input
              value={roomCode}
              onChange={e => setRoomCode(e.target.value.toUpperCase())}
              placeholder="Room code (e.g. AB12C)"
              maxLength={5}
              style={{ ...inputStyle, letterSpacing: '4px', textTransform: 'uppercase' }}
            />
          )}
          <button
            type="submit"
            disabled={!connected || !name.trim() || (mode === 'join' && !roomCode.trim())}
            style={{
              width: '100%',
              padding: '16px',
              border: 'none',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #FF4B6E, #C84BFF)',
              color: 'white',
              fontWeight: '700',
              fontSize: '16px',
              cursor: 'pointer',
              opacity: (!connected || !name.trim()) ? 0.4 : 1,
              transition: 'all 0.2s',
              marginTop: '8px',
            }}
          >
            {mode === 'create' ? '🚀 Create Game' : '🎮 Join Game'}
          </button>
        </form>
      </div>

      <style>{`
        @keyframes float0 { 0%,100% { transform: translate(0,0) rotate(-5deg); } 50% { transform: translate(20px,30px) rotate(5deg); } }
        @keyframes float1 { 0%,100% { transform: translate(0,0) rotate(10deg); } 50% { transform: translate(-30px,20px) rotate(-10deg); } }
        @keyframes float2 { 0%,100% { transform: translate(0,0); } 50% { transform: translate(15px,-25px); } }
        @keyframes float3 { 0%,100% { transform: translate(0,0) rotate(15deg); } 50% { transform: translate(-20px,35px) rotate(-5deg); } }
        @keyframes float4 { 0%,100% { transform: translate(0,0); } 50% { transform: translate(25px,-15px) rotate(8deg); } }
      `}</style>
    </div>
  );
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '14px 18px',
  marginBottom: '12px',
  background: 'rgba(255,255,255,0.07)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: '12px',
  color: 'white',
  fontSize: '16px',
  outline: 'none',
  boxSizing: 'border-box',
};

export default HomeScreen;
