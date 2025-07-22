// Stats interfaces for TypeScript
interface GameStats {
  gameName: string;
  launchCount: number;
  totalHoursPlayed: number;
  lastPlayed: string | null;
  sessions: GameSession[];
}

interface GameSession {
  startTime: string;
  endTime: string | null;
  duration: number; // in seconds
}

declare global {
  interface Window {
    electronAPI: {
      getGamesDirectory: () => Promise<string>;
      cloneGame: (repoUrl: string, gameName: string) => Promise<{ success: boolean; path?: string; error?: string }>;
      installZipGame: (downloadUrl: string, gameName: string) => Promise<{ success: boolean; path?: string; error?: string }>;
      updateGame: (gameName: string) => Promise<{ success: boolean; error?: string }>;
      getInstalledGames: () => Promise<string[]>;
      getGameSize: (gameName: string) => Promise<{ success: boolean; size?: string; error?: string }>;
      launchGame: (gameName: string) => Promise<{ success: boolean; error?: string }>;
      deleteGame: (gameName: string) => Promise<{ success: boolean; error?: string }>;
      selectDirectory: () => Promise<string | null>;
      // Stats tracking types
      getGameStats: (gameName: string) => Promise<{ success: boolean; stats?: GameStats; error?: string }>;
      getAllGameStats: () => Promise<{ success: boolean; stats?: GameStats[]; error?: string }>;
      startGameSession: (gameName: string) => Promise<{ success: boolean; session?: GameSession; error?: string }>;
      endGameSession: (gameName: string) => Promise<{ success: boolean; error?: string }>;
    };
  }
}

export {}; 