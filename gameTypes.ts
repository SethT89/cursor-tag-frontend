export interface Player {
  id: string;
  name: string;
  color: string;
  x: number; // 0-100 percentage
  y: number; // 0-100 percentage
  isIt: boolean;
  immune: boolean;
  wasEverIt: boolean;
  timeNotIt: number;
  tagsMade: number;
  fastestTag: number | null;
  // Results only
  score?: number;
  rank?: number;
  isLoser?: boolean;
  stats?: {
    timeNotIt: number;
    tagsMade: number;
    fastestTag: number | null;
    survivedUntagged: boolean;
    itAtEnd: boolean;
  };
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
  | { type: 'gameStarted'; players: Player[]; itPlayerId: string; duration: number }
  | { type: 'gameState'; players: Player[]; itPlayerId: string; timeLeft: number }
  | { type: 'tagged'; newItId: string; taggerId: string }
  | { type: 'gameEnded'; players: Player[]; leaderboard: LeaderboardEntry[] }
  | { type: 'leaderboard'; leaderboard: LeaderboardEntry[] }
  | { type: 'error'; message: string };
