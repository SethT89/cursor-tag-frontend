import React, { useState, useCallback, useEffect, useRef } from 'react';
import HomeScreen from './HomeScreen';
import LobbyScreen from './LobbyScreen';
import GameArena from './GameArena';
import ResultsScreen from './ResultsScreen';
import { Player, LiveScore, GamePhase, ServerMessage } from './gameTypes';
import { useGameSocket } from './useGameSocket';

const Index = () => {
  const { send, onMessage, connected } = useGameSocket();

  const [phase, setPhase] = useState<GamePhase>('home');
  const [roomCode, setRoomCode] = useState('');
  const [localPlayerId, setLocalPlayerId] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [itPlayerId, setItPlayerId] = useState('');
  const [timeLeft, setTimeLeft] = useState(60000);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [liveScores, setLiveScores] = useState<LiveScore[]>([]);
  const [tagDistance, setTagDistance] = useState(12);
  const [results, setResults] = useState<Player[]>([]);
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
          setError('');
          setPhase('lobby');
          break;
        case 'roomJoined':
          setRoomCode(msg.roomCode);
          setLocalPlayerId(msg.playerId);
          setPlayers(msg.players);
          setIsHost(false);
          setError('');
          setPhase('lobby');
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
          setItPlayerId(msg.itPlayerId);
          setTimeLeft(msg.duration);
          setTagDistance(msg.tagDistance);
          setCountdown(null);
          setLiveScores([]);
          setPhase('playing');
          break;
        case 'gameState':
          setPlayers(msg.players);
          setItPlayerId(msg.itPlayerId);
          setTimeLeft(msg.timeLeft);
          if (msg.liveScores) setLiveScores(msg.liveScores);
          break;
        case 'gameEnded':
          setResults(msg.players);
          setPhase('results');
          break;
        case 'playAgain':
          setPlayers(msg.players);
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

  useEffect(() => {
  }, [connected, send, phase]);

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

  const handlePlayAgain = useCallback(() => {
    send({ type: 'playAgain' });
    setPhase('lobby');
    setResults([]);
  }, [send]);

  const handleHome = useCallback(() => {
    setPhase('home');
    setRoomCode('');
    setLocalPlayerId('');
    setPlayers([]);
    setResults([]);
    setIsHost(false);
    setError('');
  }, [send]);

  if (phase === 'home')
    return <HomeScreen onCreateGame={handleCreateGame} onJoinGame={handleJoinGame} connected={connected} error={error} />;

  if (phase === 'lobby')
    return <LobbyScreen roomCode={roomCode} players={players} localPlayerId={localPlayerId} isHost={isHost} onStartGame={handleStartGame} onBack={handleHome} onAddBot={handleAddBot} onRemoveBot={handleRemoveBot} />;

  if (phase === 'countdown' || phase === 'playing')
    return <GameArena players={players} localPlayerId={localPlayerId} itPlayerId={itPlayerId} timeLeft={timeLeft} countdown={phase === 'countdown' ? countdown : null} liveScores={liveScores} tagDistance={tagDistance} onMouseMove={handleMouseMove} />;

  if (phase === 'results')
    return <ResultsScreen players={results} onPlayAgain={handlePlayAgain} onHome={handleHome} />;

  return null;
};

export default Index;
