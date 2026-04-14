import React, { useState, useCallback, useEffect, useRef } from 'react';
import HomeScreen from './HomeScreen';
import LobbyScreen from './LobbyScreen';
import GameArena from './GameArena';
import ResultsScreen from './ResultsScreen';
import { Player, LiveScore, GamePhase, GameMode, ServerMessage, PublicRoom } from './gameTypes';
import { useGameSocket } from './useGameSocket';

const Index = () => {
  const { send, onMessage, connected, connectingSeconds } = useGameSocket();

  const [phase, setPhase] = useState<GamePhase>('home');
  const [roomCode, setRoomCode] = useState('');
  const [localPlayerId, setLocalPlayerId] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [itPlayerId, setItPlayerId] = useState('');
  const [timeLeft, setTimeLeft] = useState(60000);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [liveScores, setLiveScores] = useState<LiveScore[]>([]);
  const [tagDistance, setTagDistance] = useState(8);
  const [mode, setMode] = useState<GameMode>('classic');
  const [isPublic, setIsPublic] = useState(false);
  const [publicRooms, setPublicRooms] = useState<PublicRoom[]>([]);
  const [humansLeft, setHumansLeft] = useState<number | null>(null);
  const [results, setResults] = useState<Player[]>([]);
  const [resultMode, setResultMode] = useState<GameMode>('classic');
  const [error, setError] = useState<string>('');

  const lastSentRef = useRef(0);

  const handleMouseMove = useCallback((x: number, y: number) => {
    const now = Date.now();
    if (now - lastSentRef.current < 50) return;
    lastSentRef.current = now;
    send({ type: 'move', x, y });
  }, [send]);

  useEffect(() => {
    const unsubscribe = onMessage((msg: ServerMessage) => {
      switch (msg.type) {
        case 'roomCreated':
          setRoomCode(msg.roomCode);
          setLocalPlayerId(msg.playerId);
          setPlayers(msg.players);
          setIsHost(true);
          setMode(msg.mode || 'classic');
          setIsPublic(msg.isPublic || false);
          setError('');
          setPhase('lobby');
          break;
        case 'roomJoined':
          setRoomCode(msg.roomCode);
          setLocalPlayerId(msg.playerId);
          setPlayers(msg.players);
          setIsHost(false);
          setMode(msg.mode || 'classic');
          setIsPublic(msg.isPublic || false);
          setError('');
          setPhase('lobby');
          break;
        case 'visibilityChanged':
          setIsPublic(msg.isPublic);
          break;
        case 'roomList':
          setPublicRooms(msg.rooms);
          break;
        case 'modeChanged':
          setMode(msg.mode);
          setPlayers(msg.players);
          break;
        case 'playerJoined':
        case 'playerLeft':
          setPlayers(msg.players);
          break;
        case 'countdown':
          setCountdown(msg.count);
          if (phase !== 'countdown') setPhase('countdown');
          break;
        case 'gameStarted':
          setPlayers(msg.players);
          setItPlayerId(msg.itPlayerId || '');
          setTimeLeft(msg.duration);
          setTagDistance(msg.tagDistance);
          setMode(msg.mode);
          setCountdown(null);
          setLiveScores([]);
          setHumansLeft(null);
          setPhase('playing');
          break;
        case 'gameState':
          setPlayers(msg.players);
          setItPlayerId(msg.itPlayerId || '');
          setTimeLeft(msg.timeLeft);
          if (msg.liveScores) setLiveScores(msg.liveScores);
          if (msg.humansLeft !== undefined) setHumansLeft(msg.humansLeft);
          break;
        case 'gameEnded':
          setResults(msg.players);
          setResultMode(msg.mode);
          if (msg.mode === 'zombie') {
            // Show dramatic overlay on arena for 2.5s, then bonus reveal, then results
            setPhase('dramaticEnd' as GamePhase);
            setTimeout(() => setPhase('bonusReveal' as GamePhase), 2500);
            setTimeout(() => setPhase('results'), 5300);
          } else {
            setPhase('results');
          }
          break;
        case 'playAgain':
          setPlayers(msg.players);
          setMode(msg.mode || 'classic');
          setPhase('lobby');
          setResults([]);
          break;
        case 'error':
          setError(msg.message);
          break;
      }
    });
    return unsubscribe;
  }, [onMessage, phase]);

  const handleCreateGame = useCallback((name: string) => {
    setError('');
    send({ type: 'createRoom', name });
  }, [send]);

  const handleJoinGame = useCallback((name: string, code: string) => {
    setError('');
    send({ type: 'joinRoom', name, roomCode: code });
  }, [send]);

  const handleStartGame = useCallback(() => { send({ type: 'startGame' }); }, [send]);

  const handleAddBot = useCallback((difficulty: 'easy' | 'medium' | 'hard') => {
    send({ type: 'addBot', difficulty });
  }, [send]);

  const handleRemoveBot = useCallback((botId: string) => {
    send({ type: 'removeBot', botId });
  }, [send]);

  const handleSetVisibility = useCallback((pub: boolean) => {
    send({ type: 'setVisibility', isPublic: pub });
  }, [send]);

  const handleBrowseRooms = useCallback(() => {
    send({ type: 'browseRooms' });
  }, [send]);

  const handleSetMode = useCallback((newMode: GameMode) => {
    send({ type: 'setMode', mode: newMode });
  }, [send]);

  const handlePlayAgain = useCallback(() => {
    send({ type: 'playAgain' });
    // Don't set phase here — wait for server 'playAgain' message to drive the transition
    // This ensures room.state='waiting' on server before any setMode calls can fire
  }, [send]);

  const handleHome = useCallback(() => {
    setPhase('home');
    setRoomCode('');
    setLocalPlayerId('');
    setPlayers([]);
    setResults([]);
    setIsHost(false);
    setError('');
    setIsPublic(false);
    setPublicRooms([]);
    setMode('classic');
    setHumansLeft(null);
  }, []);

  if (phase === 'home')
    return <HomeScreen onCreateGame={handleCreateGame} onJoinGame={handleJoinGame} onBrowseRooms={handleBrowseRooms} publicRooms={publicRooms} connected={connected} connectingSeconds={connectingSeconds} error={error} />;

  if (phase === 'lobby')
    return <LobbyScreen roomCode={roomCode} players={players} localPlayerId={localPlayerId} isHost={isHost} mode={mode} isPublic={isPublic} onStartGame={handleStartGame} onBack={handleHome} onAddBot={handleAddBot} onRemoveBot={handleRemoveBot} onSetMode={handleSetMode} onSetVisibility={handleSetVisibility} />;

  if (phase === 'countdown' || phase === 'playing')
    return <GameArena players={players} localPlayerId={localPlayerId} itPlayerId={itPlayerId} timeLeft={timeLeft} countdown={phase === 'countdown' ? countdown : null} liveScores={liveScores} tagDistance={tagDistance} mode={mode} humansLeft={humansLeft} hostName={players.find(p => !p.isBot)?.name} onMouseMove={handleMouseMove} />;

  if ((phase as string) === 'dramaticEnd')
    return <DramaticEnd />;

  if ((phase as string) === 'bonusReveal')
    return <BonusReveal players={results} localPlayerId={localPlayerId} />;

  if (phase === 'results')
    return <ResultsScreen players={results} mode={resultMode} onPlayAgain={handlePlayAgain} onHome={handleHome} />;

  return null;
};

// ─── Dramatic End Screen ──────────────────────────────────────────────────────
const DramaticEnd: React.FC = () => {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: '#000d00',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
      animation: 'dramaticBgIn 0.3s ease-out',
      overflow: 'hidden',
    }}>
      {/* Green fog pulses */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at center, rgba(77,255,110,0.15) 0%, transparent 70%)',
        animation: 'fogPulse 0.8s ease-in-out infinite alternate',
      }} />

      {/* Shake wrapper */}
      <div style={{ animation: 'dramaticShake 0.6s ease-out', textAlign: 'center', position: 'relative', zIndex: 1 }}>
        {/* Zombie emoji — grows in */}
        <div style={{
          fontSize: '100px', lineHeight: 1, marginBottom: '24px',
          animation: 'emojiGrow 0.7s cubic-bezier(0.2, 1.5, 0.4, 1) 0.1s both',
          filter: 'drop-shadow(0 0 30px rgba(77,255,110,0.6))',
        }}>🧟</div>

        {/* GAME OVER */}
        <div style={{
          fontSize: '88px', fontWeight: '900', lineHeight: 1,
          color: '#4dff6e',
          textShadow: '0 0 40px rgba(77,255,110,0.9), 0 0 80px rgba(77,255,110,0.5), 0 0 120px rgba(77,255,110,0.3)',
          animation: 'gameOverSlam 0.5s cubic-bezier(0.2, 1.5, 0.4, 1) 0.3s both',
          letterSpacing: '-3px',
        }}>GAME OVER</div>

        {/* Subtext */}
        <div style={{
          fontSize: '22px', color: 'rgba(77,255,110,0.6)', marginTop: '20px', fontWeight: '600',
          animation: 'fadeUp 0.5s ease-out 0.8s both',
        }}>
          The horde wins 🧟
        </div>
      </div>

      <style>{`
        @keyframes dramaticBgIn { from { opacity:0; } to { opacity:1; } }
        @keyframes fogPulse { from { opacity:0.6; } to { opacity:1; } }
        @keyframes dramaticShake {
          0%   { transform: translate(0,0) rotate(0deg); }
          10%  { transform: translate(-10px,-8px) rotate(-1.5deg); }
          20%  { transform: translate(10px,8px) rotate(1.5deg); }
          30%  { transform: translate(-8px,10px) rotate(0deg); }
          40%  { transform: translate(8px,-10px) rotate(1deg); }
          50%  { transform: translate(-5px,5px) rotate(-1deg); }
          60%  { transform: translate(5px,-5px) rotate(0deg); }
          80%  { transform: translate(-2px,2px) rotate(0.5deg); }
          100% { transform: translate(0,0) rotate(0deg); }
        }
        @keyframes emojiGrow { from { opacity:0; transform:scale(0.1) rotate(-30deg); } 70% { transform:scale(1.2) rotate(5deg); } to { opacity:1; transform:scale(1) rotate(0deg); } }
        @keyframes gameOverSlam { from { opacity:0; transform:scale(3); } 70% { transform:scale(0.95); } to { opacity:1; transform:scale(1); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
      `}</style>
    </div>
  );
};

// ─── Bonus Reveal Overlay ─────────────────────────────────────────────────────
const BonusReveal: React.FC<{ players: Player[]; localPlayerId: string }> = ({ players, localPlayerId }) => {
  const survivors = players.filter(p => !p.isZombie && !p.isTurning);
  const localPlayer = players.find(p => p.id === localPlayerId);
  const localIsSurvivor = localPlayer && !localPlayer.isZombie && !localPlayer.isTurning;
  const localIsPatientZero = localPlayer?.isPatientZero;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'linear-gradient(135deg, #050d05 0%, #0a180a 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Inter', 'Segoe UI', sans-serif", color: 'white',
      animation: 'fadeInBonus 0.4s ease-out',
    }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div style={{ fontSize: '48px', marginBottom: '8px' }}>
          {localIsSurvivor ? '🏆' : localIsPatientZero ? '🧟' : '💀'}
        </div>
        <div style={{ fontSize: '28px', fontWeight: '900', marginBottom: '4px' }}>
          {localIsSurvivor ? 'YOU SURVIVED!' : localIsPatientZero ? 'OUTBREAK OVER' : 'GAME OVER'}
        </div>
        <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)' }}>
          Tallying final scores...
        </div>
      </div>

      {/* Bonus cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', maxWidth: '360px', padding: '0 24px' }}>
        {survivors.length > 0 && (
          <div style={{
            background: 'rgba(77,255,110,0.08)', border: '1px solid rgba(77,255,110,0.3)',
            borderRadius: '16px', padding: '16px 20px',
            animation: 'bonusSlideIn 0.5s ease-out 0.3s both',
          }}>
            <div style={{ fontSize: '12px', color: 'rgba(77,255,110,0.6)', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>
              🛡️ Survival Bonus
            </div>
            {survivors.map(p => (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '14px', fontWeight: p.id === localPlayerId ? '800' : '500', color: p.id === localPlayerId ? 'white' : 'rgba(255,255,255,0.6)' }}>
                  {p.name}{p.id === localPlayerId ? ' (you)' : ''}
                </span>
                <span style={{ fontSize: '16px', fontWeight: '800', color: '#4dff6e', animation: 'bonusPop 0.4s ease-out 0.8s both' }}>
                  +200 pts
                </span>
              </div>
            ))}
          </div>
        )}

        {localPlayer && localPlayer.isPatientZero && (
          <div style={{
            background: 'rgba(255,75,110,0.08)', border: '1px solid rgba(255,75,110,0.3)',
            borderRadius: '16px', padding: '16px 20px',
            animation: 'bonusSlideIn 0.5s ease-out 0.5s both',
          }}>
            <div style={{ fontSize: '12px', color: 'rgba(255,75,110,0.6)', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>
              🧟 Patient Zero
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)' }}>
                {localPlayer.infectCount || 0} infections × 120pts
              </span>
              <span style={{ fontSize: '16px', fontWeight: '800', color: '#FF4B6E', animation: 'bonusPop 0.4s ease-out 1s both' }}>
                +{(localPlayer.infectCount || 0) * 120} pts
              </span>
            </div>
          </div>
        )}

        <div style={{
          textAlign: 'center', fontSize: '13px', color: 'rgba(255,255,255,0.25)',
          animation: 'bonusSlideIn 0.5s ease-out 1s both',
          marginTop: '8px',
        }}>
          Results in a moment...
        </div>
      </div>

      <style>{`
        @keyframes fadeInBonus { from { opacity:0; } to { opacity:1; } }
        @keyframes bonusSlideIn { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes bonusPop { 0% { transform:scale(0.5); opacity:0; } 70% { transform:scale(1.2); } 100% { transform:scale(1); opacity:1; } }
      `}</style>
    </div>
  );
};

export default Index;
