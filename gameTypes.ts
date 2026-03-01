export interface Player {
  id: string;
  name: string;
  color: string;
  x: number;
  y: number;
  isIt: boolean;
  immune: boolean;
  wasEverIt: boolean;
  timeNotIt: number;
  tagsMade: number;
  fastestTag: number | null;
  timesTagged: number;
  retags: number;
  totalDistance: number;
  // Results only
  score?: number;
  rank?: number;
  isLoser?: boolean;
  award?: Award | null;
  stats?: {
    timeNotIt: number;
    tagsMade: number;
    fastestTag: number | null;
    survivedUntagged: boolean;
    itAtEnd: boolean;
    timesTagged: number;
    retags: number;
    totalDistance: number;
    opportunistTags: number;
    shortestItStreak: number | null;
  };
}

export interface Award {
  emoji: string;
  title: string;
  desc: string;
}

export interface LiveScore {
  id: string;
  name: string;
  color: string;
  score: number;
  isIt: boolean;
}

export interface LeaderboardEntry {
  name: string;
  gamesPlayed: number;
  totalScore: number;
  bestScore: number;
  wins: number;
}

export type GamePhase = 'home' | 'lobby' | 'countdown' | 'playing' | 'results';

export type ServerMessage =
  | { type: 'roomCreated'; roomCode: string; playerId: string; players: Player[]; color: string; leaderboard: LeaderboardEntry[] }
  | { type: 'roomJoined'; roomCode: string; playerId: string; players: Player[]; color: string }
  | { type: 'playerJoined'; players: Player[] }
  | { type: 'playerLeft'; players: Player[] }
  | { type: 'countdown'; count: number }
  | { type: 'gameStarted'; players: Player[]; itPlayerId: string; duration: number; tagDistance: number }
  | { type: 'gameState'; players: Player[]; itPlayerId: string; timeLeft: number; liveScores: LiveScore[] }
  | { type: 'tagged'; newItId: string; taggerId: string }
  | { type: 'gameEnded'; players: Player[]; leaderboard: LeaderboardEntry[] }
  | { type: 'playAgain'; players: Player[] }
  | { type: 'leaderboard'; leaderboard: LeaderboardEntry[] }
  | { type: 'error'; message: string };
