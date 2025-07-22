import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  getGamesDirectory: () => ipcRenderer.invoke('get-games-directory'),
  cloneGame: (repoUrl: string, gameName: string) =>
    ipcRenderer.invoke('clone-game', repoUrl, gameName),
  installZipGame: (downloadUrl: string, gameName: string) =>
    ipcRenderer.invoke('install-zip-game', downloadUrl, gameName),
  updateGame: (gameName: string) =>
    ipcRenderer.invoke('update-game', gameName),
  getInstalledGames: () =>
    ipcRenderer.invoke('get-installed-games'),
  getGameSize: (gameName: string) =>
    ipcRenderer.invoke('get-game-size', gameName),
  launchGame: (gameName: string) =>
    ipcRenderer.invoke('launch-game', gameName),
  deleteGame: (gameName: string) =>
    ipcRenderer.invoke('delete-game', gameName),
  selectDirectory: () =>
    ipcRenderer.invoke('select-directory'),
  // Stats tracking API
  getGameStats: (gameName: string) =>
    ipcRenderer.invoke('get-game-stats', gameName),
  getAllGameStats: () =>
    ipcRenderer.invoke('get-all-game-stats'),
  startGameSession: (gameName: string) =>
    ipcRenderer.invoke('start-game-session', gameName),
  endGameSession: (gameName: string) =>
    ipcRenderer.invoke('end-game-session', gameName)
});

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