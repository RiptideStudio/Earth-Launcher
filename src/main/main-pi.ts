import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { simpleGit } from 'simple-git';
import fetch from 'node-fetch';
import extract from 'extract-zip';

// --- GPU/Software Rendering Flags for Pi Compatibility ---
app.disableHardwareAcceleration();
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('disable-software-rasterizer');
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('disable-accelerated-2d-canvas');
app.commandLine.appendSwitch('disable-accelerated-jpeg-decoding');
app.commandLine.appendSwitch('disable-accelerated-mjpeg-decode');
app.commandLine.appendSwitch('disable-accelerated-video-decode');
app.commandLine.appendSwitch('disable-accelerated-video-encode');
app.commandLine.appendSwitch('use-gl', 'swiftshader');
app.commandLine.appendSwitch('no-sandbox');
// --------------------------------------------------------

console.log('Starting main process: main-pi.ts');

let mainWindow: BrowserWindow | null = null;
const isDev = process.env.NODE_ENV === 'development';

// Pi 4 optimizations
const isPi4 = process.platform === 'linux' && process.arch === 'arm64';

function createWindow(): void {
  // Pi 4 specific window settings
  const windowOptions = {
    width: isPi4 ? 1024 : 1200,
    height: isPi4 ? 768 : 800,
    minWidth: isPi4 ? 800 : 800,
    minHeight: isPi4 ? 600 : 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      // Pi 4 optimizations
      enableRemoteModule: false,
      backgroundThrottling: false,
      webSecurity: true
    },
    titleBarStyle: 'default' as const,
    show: false,
    // Pi 4 specific optimizations
    ...(isPi4 && {
      fullscreenable: false,
      resizable: true,
      maximizable: false
    })
  };

  mainWindow = new BrowserWindow(windowOptions);

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    if (!isPi4) {
      mainWindow.webContents.openDevTools();
    }
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Pi 4 memory management
  if (isPi4) {
    setInterval(() => {
      if (global.gc) {
        global.gc();
      }
    }, 30000); // Garbage collect every 30 seconds
  }
}

// Pi 4 specific app optimizations
if (isPi4) {
  // Disable hardware acceleration if causing issues
  app.disableHardwareAcceleration();
  
  // Force software rendering
  app.commandLine.appendSwitch('disable-gpu');
  app.commandLine.appendSwitch('disable-software-rasterizer');
  app.commandLine.appendSwitch('disable-gpu-sandbox');
  app.commandLine.appendSwitch('disable-accelerated-2d-canvas');
  app.commandLine.appendSwitch('disable-accelerated-jpeg-decoding');
  app.commandLine.appendSwitch('disable-accelerated-mjpeg-decode');
  app.commandLine.appendSwitch('disable-accelerated-video-decode');
  app.commandLine.appendSwitch('disable-accelerated-video-encode');
  
  // Set lower memory limits
  app.commandLine.appendSwitch('max-old-space-size', '512');
  app.commandLine.appendSwitch('disable-background-timer-throttling');
  app.commandLine.appendSwitch('disable-backgrounding-occluded-windows');
  app.commandLine.appendSwitch('disable-renderer-backgrounding');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Pi 4 specific IPC handlers with memory optimization
ipcMain.handle('get-games-directory', async () => {
  const userDataPath = app.getPath('userData');
  const gamesPath = path.join(userDataPath, 'games');
  
  if (!fs.existsSync(gamesPath)) {
    fs.mkdirSync(gamesPath, { recursive: true });
  }
  
  return gamesPath;
});

ipcMain.handle('clone-game', async (event, repoUrl: string, gameName: string) => {
  try {
    const userDataPath = app.getPath('userData');
    const gamesPath = path.join(userDataPath, 'games');
    const gamePath = path.join(gamesPath, gameName);
    
    if (fs.existsSync(gamePath)) {
      throw new Error('Game already exists');
    }
    
    // Pi 4 optimized git operations
    const git = simpleGit();
    await git.clone(repoUrl, gamePath, ['--depth', '1', '--single-branch']);
    
    // Fix permissions after cloning
    try {
      require('child_process').execSync(`chmod -R 755 "${gamePath}"`);
      console.log('Permissions fixed for', gamePath);
    } catch (e) {
      console.warn('Could not set permissions:', e);
    }
    
    return { success: true, path: gamePath };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
});

ipcMain.handle('install-zip-game', async (event, downloadUrl: string, gameName: string) => {
  try {
    const userDataPath = app.getPath('userData');
    const gamesPath = path.join(userDataPath, 'games');
    const gamePath = path.join(gamesPath, gameName);
    
    if (fs.existsSync(gamePath)) {
      throw new Error('Game already exists');
    }
    
    // Create game directory
    fs.mkdirSync(gamePath, { recursive: true });
    
    // Download and extract zip file
    const zipPath = path.join(gamePath, 'temp.zip');
    
    // Download the zip file using node-fetch
    const response = await fetch(downloadUrl);
    if (!response.ok) {
      throw new Error(`Failed to download: ${response.statusText}`);
    }
    
    const fileStream = fs.createWriteStream(zipPath);
    await new Promise<void>((resolve, reject) => {
      response.body?.pipe(fileStream);
      fileStream.on('finish', () => {
        fileStream.close();
        resolve();
      });
      fileStream.on('error', reject);
    });
    
    // Extract the zip file
    await extract(zipPath, { dir: gamePath });
    
    // Fix permissions after extraction
    try {
      require('child_process').execSync(`chmod -R 755 "${gamePath}"`);
      console.log('Permissions fixed for', gamePath);
    } catch (e) {
      console.warn('Could not set permissions:', e);
    }
    
    // Remove the temporary zip file
    fs.unlinkSync(zipPath);
    
    return { success: true, path: gamePath };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
});

ipcMain.handle('update-game', async (event, gameName: string) => {
  try {
    const userDataPath = app.getPath('userData');
    const gamesPath = path.join(userDataPath, 'games');
    const gamePath = path.join(gamesPath, gameName);
    
    if (!fs.existsSync(gamePath)) {
      throw new Error('Game not found');
    }
    
    const git = simpleGit(gamePath);
    await git.pull();
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
});

ipcMain.handle('get-installed-games', async () => {
  try {
    const userDataPath = app.getPath('userData');
    const gamesPath = path.join(userDataPath, 'games');
    
    if (!fs.existsSync(gamesPath)) {
      return [];
    }
    
    const games = fs.readdirSync(gamesPath, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);
    
    return games;
  } catch (error) {
    return [];
  }
});

ipcMain.handle('get-game-size', async (event, gameName: string) => {
  try {
    const userDataPath = app.getPath('userData');
    const gamesPath = path.join(userDataPath, 'games');
    const gamePath = path.join(gamesPath, gameName);
    
    if (!fs.existsSync(gamePath)) {
      throw new Error('Game not found');
    }
    
    // Recursively calculate directory size
    const calculateDirectorySize = (dirPath: string): number => {
      let totalSize = 0;
      
      const items = fs.readdirSync(dirPath, { withFileTypes: true });
      
      for (const item of items) {
        const itemPath = path.join(dirPath, item.name);
        
        if (item.isDirectory()) {
          totalSize += calculateDirectorySize(itemPath);
        } else {
          try {
            const stats = fs.statSync(itemPath);
            totalSize += stats.size;
          } catch (error) {
            // Skip files that can't be accessed
            console.warn(`Could not access file: ${itemPath}`);
          }
        }
      }
      
      return totalSize;
    };
    
    const sizeInBytes = calculateDirectorySize(gamePath);
    
    // Convert to human readable format
    const formatFileSize = (bytes: number): string => {
      if (bytes === 0) return '0 B';
      
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      
      return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };
    
    return { success: true, size: formatFileSize(sizeInBytes) };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
});

// Helper function to check if a game actually failed due to Steam
const isSteamLaunchError = (errorMessage: string): boolean => {
  const steamErrorKeywords = [
    'steam_api.dll not found',
    'steamclient.dll not found',
    'steam must be running',
    'steam is required',
    'steam initialization failed',
    'steam connection failed',
    'steam authentication failed',
    'steam login required',
    'steam_appid.txt not found'
  ];
  
  const lowerError = errorMessage.toLowerCase();
  return steamErrorKeywords.some(keyword => lowerError.includes(keyword));
};

// Stats tracking interface
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

// Stats file path
const getStatsFilePath = () => {
  const userDataPath = app.getPath('userData');
  return path.join(userDataPath, 'game-stats.json');
};

// Load stats from file
const loadStats = (): GameStats[] => {
  const statsPath = getStatsFilePath();
  try {
    if (fs.existsSync(statsPath)) {
      const data = fs.readFileSync(statsPath, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading stats:', error);
  }
  return [];
};

// Save stats to file
const saveStats = (stats: GameStats[]) => {
  const statsPath = getStatsFilePath();
  try {
    fs.writeFileSync(statsPath, JSON.stringify(stats, null, 2));
  } catch (error) {
    console.error('Error saving stats:', error);
  }
};

// Get or create stats for a game
const getGameStats = (gameName: string): GameStats => {
  const stats = loadStats();
  let gameStats = stats.find(s => s.gameName === gameName);
  
  if (!gameStats) {
    gameStats = {
      gameName,
      launchCount: 0,
      totalHoursPlayed: 0,
      lastPlayed: null,
      sessions: []
    };
    stats.push(gameStats);
    saveStats(stats);
  }
  
  return gameStats;
};

// Update game stats
const updateGameStats = (gameName: string, updates: Partial<GameStats>) => {
  const stats = loadStats();
  const gameIndex = stats.findIndex(s => s.gameName === gameName);
  
  if (gameIndex >= 0) {
    stats[gameIndex] = { ...stats[gameIndex], ...updates };
  } else {
    stats.push({
      gameName,
      launchCount: 0,
      totalHoursPlayed: 0,
      lastPlayed: null,
      sessions: [],
      ...updates
    });
  }
  
  saveStats(stats);
};

// Start a game session
const startGameSession = (gameName: string) => {
  const gameStats = getGameStats(gameName);
  const now = new Date().toISOString();
  
  // Create new session
  const newSession: GameSession = {
    startTime: now,
    endTime: null,
    duration: 0
  };
  
  // Update stats
  updateGameStats(gameName, {
    launchCount: gameStats.launchCount + 1,
    lastPlayed: now,
    sessions: [...gameStats.sessions, newSession]
  });
  
  return newSession;
};

// End a game session
const endGameSession = (gameName: string) => {
  const gameStats = getGameStats(gameName);
  const now = new Date().toISOString();
  
  if (gameStats.sessions.length > 0) {
    const lastSession = gameStats.sessions[gameStats.sessions.length - 1];
    
    if (!lastSession.endTime) {
      const startTime = new Date(lastSession.startTime);
      const endTime = new Date(now);
      const duration = (endTime.getTime() - startTime.getTime()) / 1000; // seconds
      
      // Update the last session
      const updatedSessions = [...gameStats.sessions];
      updatedSessions[updatedSessions.length - 1] = {
        ...lastSession,
        endTime: now,
        duration
      };
      
      // Calculate total hours played
      const totalHoursPlayed = updatedSessions.reduce((total, session) => {
        return total + (session.duration || 0);
      }, 0) / 3600; // Convert seconds to hours
      
      updateGameStats(gameName, {
        sessions: updatedSessions,
        totalHoursPlayed: Math.round(totalHoursPlayed * 100) / 100 // Round to 2 decimal places
      });
    }
  }
};

// Modify the existing launch-game handler to track stats
ipcMain.handle('launch-game', async (event, gameName: string) => {
  try {
    const userDataPath = app.getPath('userData');
    const gamesPath = path.join(userDataPath, 'games');
    const gamePath = path.join(gamesPath, gameName);

    if (!fs.existsSync(gamePath)) {
      throw new Error('Game not found');
    }

    // Start tracking session
    startGameSession(gameName);

    // Pi-optimized executable patterns (Linux-based)
    const possibleExecutables = [
      'game.sh', 'Game.sh', 'main.sh', 'Main.sh', 'start.sh', 'Start.sh',
      'game', 'Game', 'main', 'Main', 'start', 'Start',
      'index.html', 'index.htm'
    ];

    // First, try to find executables in the root directory
    for (const executable of possibleExecutables) {
      const executablePath = path.join(gamePath, executable);
      if (fs.existsSync(executablePath)) {
        console.log(`Found executable: ${executablePath}`);
        const { exec, spawn } = require('child_process');

        if (executable.endsWith('.html') || executable.endsWith('.htm')) {
          // For web games, open in default browser
          const { shell } = require('electron');
          shell.openPath(executablePath);
          return { success: true };
        } else {
          // For executable games on Pi
          const execOptions = {
            cwd: gamePath,
            detached: true, // Detach from parent process
            stdio: 'ignore', // Ignore stdio to prevent hanging
            env: { ...process.env, DISPLAY: ':0' } // Pi-specific display setting
          };

          try {
            // Make file executable if it's a script
            if (executable.endsWith('.sh') || !executable.includes('.')) {
              fs.chmodSync(executablePath, '755');
            }
            // Use spawn for better process management
            const childProcess = spawn(executablePath, [], execOptions);
            
            // Track when the process ends
            childProcess.on('exit', (code: number, signal: string) => {
              console.log(`Game process exited with code ${code}, signal ${signal}`);
              endGameSession(gameName);
            });

            // Handle process errors
            childProcess.on('error', (error: Error) => {
              console.error(`Game process error:`, error);
              // Don't end session on error, let it continue running
            });
          } catch (chmodError) {
            // If chmod fails, try running anyway
            const childProcess = spawn(executablePath, [], execOptions);
            
            // Track when the process ends
            childProcess.on('exit', (code: number, signal: string) => {
              console.log(`Game process exited with code ${code}, signal ${signal}`);
              endGameSession(gameName);
            });

            // Handle process errors
            childProcess.on('error', (error: Error) => {
              console.error(`Game process error:`, error);
              // Don't end session on error, let it continue running
            });
          }
          return { success: true };
        }
      }
    }

    // If no executable found in root, search recursively
    const findExecutableRecursively = (dirPath: string, depth = 0): string | null => {
      if (depth > 3) return null; // Limit search depth

      try {
        const items = fs.readdirSync(dirPath, { withFileTypes: true });

        for (const item of items) {
          const itemPath = path.join(dirPath, item.name);

          if (item.isDirectory()) {
            // Recursively search subdirectories
            const found = findExecutableRecursively(itemPath, depth + 1);
            if (found) return found;
          } else if (item.isFile()) {
            // Check if this file is an executable
            const fileName = item.name.toLowerCase();
            const isExecutable = fileName.endsWith('.sh') || !fileName.includes('.') || fileName.endsWith('.app');

            if (isExecutable) {
              console.log(`Found executable in subdirectory: ${itemPath}`);
              return itemPath;
            }
          }
        }
      } catch (error) {
        console.warn(`Error searching directory ${dirPath}:`, error);
      }

      return null;
    };

    // Search recursively for executables
    const foundExecutable = findExecutableRecursively(gamePath);
    if (foundExecutable) {
      const { exec, spawn } = require('child_process');
      const execOptions = {
        cwd: path.dirname(foundExecutable),
        detached: true,
        stdio: 'ignore',
        env: { ...process.env, DISPLAY: ':0' }
      };

      try {
        // Make file executable
        fs.chmodSync(foundExecutable, '755');
        const childProcess = spawn(foundExecutable, [], execOptions);
        
        // Track when the process ends
        childProcess.on('exit', (code: number, signal: string) => {
          console.log(`Game process exited with code ${code}, signal ${signal}`);
          endGameSession(gameName);
        });

        // Handle process errors
        childProcess.on('error', (error: Error) => {
          console.error(`Game process error:`, error);
          // Don't end session on error, let it continue running
        });
      } catch (chmodError) {
        const childProcess = spawn(foundExecutable, [], execOptions);
        
        // Track when the process ends
        childProcess.on('exit', (code: number, signal: string) => {
          console.log(`Game process exited with code ${code}, signal ${signal}`);
          endGameSession(gameName);
        });

        // Handle process errors
        childProcess.on('error', (error: Error) => {
          console.error(`Game process error:`, error);
          // Don't end session on error, let it continue running
        });
      }
      return { success: true };
    }

    // If still no executable found, open the directory
    console.log(`No executable found for ${gameName}, opening directory: ${gamePath}`);
    const { shell } = require('electron');
    shell.openPath(gamePath);
    return { success: true };
  } catch (error) {
    console.error(`Error launching game ${gameName}:`, error);
    
    // Only check for Steam-related errors if the game actually failed to launch
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Very permissive Steam detection - only block if it's clearly a Steam error
    const steamErrorKeywords = [
      'steam_api.dll not found',
      'steamclient.dll not found',
      'steam must be running',
      'steam is required',
      'steam initialization failed',
      'steam connection failed',
      'steam authentication failed',
      'steam login required',
      'steam_appid.txt not found'
    ];
    
    const lowerError = errorMessage.toLowerCase();
    const isSteamError = steamErrorKeywords.some(keyword => 
      lowerError.includes(keyword.toLowerCase())
    );
    
    if (isSteamError) {
      return { 
        success: false, 
        error: `This game requires Steam to run. Please ensure Steam is installed and running, then try launching the game again.` 
      };
    }
    
    return { success: false, error: errorMessage };
  }
});

ipcMain.handle('delete-game', async (event, gameName: string) => {
  try {
    const userDataPath = app.getPath('userData');
    const gamesPath = path.join(userDataPath, 'games');
    const gamePath = path.join(gamesPath, gameName);
    
    if (!fs.existsSync(gamePath)) {
      throw new Error('Game not found');
    }
    
    // Remove the game directory and all its contents
    const { rmSync } = require('fs');
    rmSync(gamePath, { recursive: true, force: true });
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
});

ipcMain.handle('select-directory', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openDirectory']
  });
  
  return result.filePaths[0] || null;
});

// Add new IPC handlers for stats
ipcMain.handle('get-game-stats', async (event, gameName: string) => {
  try {
    const stats = getGameStats(gameName);
    return { success: true, stats };
  } catch (error) {
    console.error(`Error getting stats for ${gameName}:`, error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
});

ipcMain.handle('get-all-game-stats', async () => {
  try {
    const stats = loadStats();
    return { success: true, stats };
  } catch (error) {
    console.error('Error getting all game stats:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
});

ipcMain.handle('start-game-session', async (event, gameName: string) => {
  try {
    const session = startGameSession(gameName);
    return { success: true, session };
  } catch (error) {
    console.error(`Error starting session for ${gameName}:`, error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
});

ipcMain.handle('end-game-session', async (event, gameName: string) => {
  try {
    endGameSession(gameName);
    return { success: true };
  } catch (error) {
    console.error(`Error ending session for ${gameName}:`, error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
});

// Pi 4 specific system monitoring
if (isPi4) {
  setInterval(() => {
    const used = process.memoryUsage();
    console.log(`Memory usage: ${Math.round(used.heapUsed / 1024 / 1024)}MB`);
    
    // Force garbage collection if memory usage is high
    if (used.heapUsed > 200 * 1024 * 1024) { // 200MB
      if (global.gc) {
        global.gc();
      }
    }
  }, 60000); // Check every minute
} 