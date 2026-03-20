export type GameMode = 'classic' | 'zombie';

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
  isBot?: boolean;
  difficulty?: string | null;
  // Zombie fields
  isZombie?: boolean;
  isTurning?: boolean;
  turningUntil?: number;
  infectCount?: number;
  eliminationRank?: number | null;
  isPatientZero?: boolean;
  // Results only
  score?: number;
  rank?: number;
  isLoser?: boolean;
  isSurvivor?: boolean;
  award?: Award | null;
  stats?: {
    timeNotIt: number;
    tagsMade?: number;
    fastestTag?: number | null;
    survivedUntagged?: boolean;
    itAtEnd?: boolean;
    timesTagged?: number;
    retags?: number;
    totalDistance: number;
    opportunistTags?: number;
    shortestItStreak?: number | null;
    // Zombie stats
    infectCount?: number;
    survivalTime?: number;
    isPatientZero?: boolean;
    survived?: boolean;
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
  isBot?: boolean;
  isZombie?: boolean;
  isTurning?: boolean;
}

export interface LeaderboardEntry {
  name: string;
  gamesPlayed: number;
  totalScore: number;
  bestScore: number;
  wins: number;
}

export type GamePhase = 'home' | 'lobby' | 'countdown' | 'playing' | 'results';

export interface PublicRoom {
  code: string;
  hostName: string;
  mode: GameMode;
  playerCount: number;
  humanCount: number;
  botCount: number;
  maxPlayers: number;
  openSlots: number;
}

export type ServerMessage =
  | { type: 'roomCreated'; roomCode: string; playerId: string; players: Player[]; color: string; mode: GameMode }
  | { type: 'roomJoined'; roomCode: string; playerId: string; players: Player[]; color: string; mode: GameMode }
  | { type: 'playerJoined'; players: Player[] }
  | { type: 'playerLeft'; players: Player[] }
  | { type: 'modeChanged'; mode: GameMode; players: Player[] }
  | { type: 'visibilityChanged'; isPublic: boolean }
  | { type: 'roomList'; rooms: PublicRoom[] }
  | { type: 'countdown'; count: number }
  | { type: 'gameStarted'; players: Player[]; itPlayerId: string; duration: number; tagDistance: number; mode: GameMode; patientZeroId?: string }
  | { type: 'gameState'; players: Player[]; itPlayerId: string | null; timeLeft: number; liveScores: LiveScore[]; mode: GameMode; humansLeft?: number }
  | { type: 'tagged'; newItId: string; taggerId: string }
  | { type: 'infected'; victimId: string; zombieId: string }
  | { type: 'zombieFullyTurned'; playerId: string }
  | { type: 'gameEnded'; players: Player[]; mode: GameMode; reason?: string }
  | { type: 'playAgain'; players: Player[]; mode: GameMode }
  | { type: 'error'; message: string };
