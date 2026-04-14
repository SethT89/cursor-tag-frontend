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
            // Wait for dramatic game over overlay to play (2.5s) then show bonus reveal
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

  if ((phase as string) === 'bonusReveal')
    return <BonusReveal players={results} localPlayerId={localPlayerId} />;

  if (phase === 'results')
    return <ResultsScreen players={results} mode={resultMode} onPlayAgain={handlePlayAgain} onHome={handleHome} />;

  return null;
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
