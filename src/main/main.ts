import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { simpleGit, SimpleGit } from 'simple-git';
import * as https from 'https';
import * as zlib from 'zlib';
import * as stream from 'stream';
import { promisify } from 'util';
import extract from 'extract-zip';
import { exec, spawn } from 'child_process';
import { shell } from 'electron';
import { rmSync } from 'fs';
import { ChildProcess } from 'child_process';

console.log('Starting main process: main.ts');

let mainWindow: BrowserWindow | null = null;
const isDev = false;

async function createWindow(): Promise<void> {
  console.log('Creating Electron window...');
  const preloadPath = path.join(__dirname, 'preload.js');
  console.log('Preload script path:', preloadPath);
  console.log('Preload script exists:', fs.existsSync(preloadPath));
  
  mainWindow = new BrowserWindow({
    x: 100,
    y: 100,
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: preloadPath
    },
    titleBarStyle: 'default',
    show: false
  });

  console.log('Window created, loading URL...');
  if (isDev) {
    // Try different ports since Vite might use different ones
    const ports = [3000, 3001, 3002, 3003, 3004, 3005];
    let connected = false;
    
    for (const port of ports) {
      try {
        console.log(`Trying to connect to port ${port}...`);
        await Promise.race([
          mainWindow.loadURL(`http://localhost:${port}`),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), 2000)
          )
        ]);
        connected = true;
        console.log(`Connected to Vite dev server on port ${port}`);
        break;
      } catch (error) {
        console.log(`Failed to connect to port ${port}, trying next...`);
      }
    }
    
    if (!connected) {
      console.error('Failed to connect to Vite dev server on any port');
      // Try to load the file directly as fallback
      try {
        mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
        console.log('Loaded fallback HTML file');
      } catch (fallbackError) {
        console.error('Failed to load fallback file:', fallbackError);
      }
    }
    
    mainWindow.webContents.openDevTools();
  } else {
    const rendererPath = path.join(process.resourcesPath, 'dist/renderer/index.html');
    console.log('Attempting to load renderer from:', rendererPath);
    console.log('Renderer file exists:', fs.existsSync(rendererPath));
    if (!fs.existsSync(rendererPath)) {
      console.error('Renderer HTML file does not exist!');
    }
    mainWindow.loadFile(rendererPath)
      .then(() => {
        console.log('Renderer loaded successfully!');
      })
      .catch((err) => {
        console.error('Failed to load renderer:', err);
      });
  }

  console.log('Setting up window events...');
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
    mainWindow?.focus();
    mainWindow?.setAlwaysOnTop(true);
    setTimeout(() => mainWindow?.setAlwaysOnTop(false), 2000);
  });

  mainWindow.on('closed', () => {
    console.log('Window closed');
    mainWindow = null;
  });
  
  console.log('Window creation complete');
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

// IPC handlers for game management
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
    
    const git: SimpleGit = simpleGit();
    await git.clone(repoUrl, gamePath);
    
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
    
    // Download the zip file
    await new Promise<void>((resolve, reject) => {
      const file = fs.createWriteStream(zipPath);
      https.get(downloadUrl, (response) => {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve();
        });
      }).on('error', reject);
    });
    
    // Extract the zip file
    await extract(zipPath, { dir: gamePath });
    
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
    
    const git: SimpleGit = simpleGit(gamePath);
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

    // Platform-specific executable patterns
    const isWindows = process.platform === 'win32';
    const possibleExecutables = isWindows ? [
      'game.exe', 'Game.exe', 'main.exe', 'Main.exe',
      'start.exe', 'Start.exe', 'launcher.exe', 'Launcher.exe',
      'index.html', 'index.htm'
    ] : [
      'game', 'Game', 'main', 'Main', 'start', 'Start',
      'game.sh', 'Game.sh', 'main.sh', 'Main.sh', 'start.sh', 'Start.sh',
      'index.html', 'index.htm'
    ];

    // First, try to find executables in the root directory
    for (const executable of possibleExecutables) {
      const executablePath = path.join(gamePath, executable);
      if (fs.existsSync(executablePath)) {
        console.log(`Found executable: ${executablePath}`);
        
        if (executable.endsWith('.html') || executable.endsWith('.htm')) {
          // For web games, open in default browser
          shell.openPath(executablePath);
          return { success: true };
        } else {
          // For executable games
          const execOptions = {
            cwd: gamePath,
            detached: false, // Don't detach so we can capture output
            stdio: ['ignore', 'pipe', 'pipe'] // Capture stdout and stderr
          };

          if (isWindows) {
            // Windows: use exec with proper quoting
            const childProcess = exec(`"${executablePath}"`, execOptions);
            
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
            
            // Capture stdout and stderr to see what the game is outputting
            if (childProcess.stdout) {
              childProcess.stdout.on('data', (data: Buffer) => {
                console.log(`Game stdout: ${data}`);
              });
            }
            if (childProcess.stderr) {
              childProcess.stderr.on('data', (data: Buffer) => {
                console.log(`Game stderr: ${data}`);
              });
            }
          } else {
            // Linux/macOS: make executable and run
            try {
              // Make file executable if it's a script
              if (executable.endsWith('.sh') || !executable.includes('.')) {
                fs.chmodSync(executablePath, '755');
              }
              // Use spawn for better process management
              const childProcess: ChildProcess = spawn(executablePath, [], { ...execOptions, stdio: 'ignore' });
              
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
              
              // Capture stdout and stderr to see what the game is outputting
              if (childProcess.stdout) {
                childProcess.stdout.on('data', (data: Buffer) => {
                  console.log(`Game stdout: ${data}`);
                });
              }
              if (childProcess.stderr) {
                childProcess.stderr.on('data', (data: Buffer) => {
                  console.log(`Game stderr: ${data}`);
                });
              }
            } catch (chmodError) {
              // If chmod fails, try running anyway
              const childProcess: ChildProcess = spawn(executablePath, [], { ...execOptions, stdio: 'ignore' });
              
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
              
              // Capture stdout and stderr to see what the game is outputting
              if (childProcess.stdout) {
                childProcess.stdout.on('data', (data: Buffer) => {
                  console.log(`Game stdout: ${data}`);
                });
              }
              if (childProcess.stderr) {
                childProcess.stderr.on('data', (data: Buffer) => {
                  console.log(`Game stderr: ${data}`);
                });
              }
            }
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
            const isExecutable = isWindows ?
              fileName.endsWith('.exe') || fileName.endsWith('.bat') || fileName.endsWith('.cmd') :
              fileName.endsWith('.sh') || !fileName.includes('.') || fileName.endsWith('.app');

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
      const execOptions = {
        cwd: path.dirname(foundExecutable),
        detached: false,
        stdio: ['ignore', 'pipe', 'pipe']
      };

      if (isWindows) {
        const childProcess = exec(`"${foundExecutable}"`, execOptions);
        
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
        
        // Capture stdout and stderr to see what the game is outputting
        if (childProcess.stdout) {
          childProcess.stdout.on('data', (data: Buffer) => {
            console.log(`Game stdout: ${data}`);
          });
        }
        if (childProcess.stderr) {
          childProcess.stderr.on('data', (data: Buffer) => {
            console.log(`Game stderr: ${data}`);
          });
        }
              } else {
          try {
            // Make file executable
            fs.chmodSync(foundExecutable, '755');
            const childProcess: ChildProcess = spawn(foundExecutable, [], { ...execOptions, stdio: ['ignore', 'pipe', 'pipe'] });
            
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
            
            // Capture stdout and stderr to see what the game is outputting
            if (childProcess.stdout) {
              childProcess.stdout.on('data', (data: Buffer) => {
                console.log(`Game stdout: ${data}`);
              });
            }
            if (childProcess.stderr) {
              childProcess.stderr.on('data', (data: Buffer) => {
                console.log(`Game stderr: ${data}`);
              });
            }
          } catch (chmodError) {
            const childProcess: ChildProcess = spawn(foundExecutable, [], { ...execOptions, stdio: ['ignore', 'pipe', 'pipe'] });
            
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
            
            // Capture stdout and stderr to see what the game is outputting
            if (childProcess.stdout) {
              childProcess.stdout.on('data', (data: Buffer) => {
                console.log(`Game stdout: ${data}`);
              });
            }
            if (childProcess.stderr) {
              childProcess.stderr.on('data', (data: Buffer) => {
                console.log(`Game stderr: ${data}`);
              });
            }
          }
        }
      return { success: true };
    }

    // If still no executable found, open the directory
    console.log(`No executable found for ${gameName}, opening directory: ${gamePath}`);
    shell.openPath(gamePath);
    return { success: true };
  } catch (error) {
    console.error(`Error launching game ${gameName}:`, error);
    
    // Log the exact error for debugging
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.log(`Full error message: "${errorMessage}"`);
    
    // Check for Steam-related errors
    const steamErrorKeywords = [
      'steam_api.dll not found',
      'steamclient.dll not found',
      'steam must be running',
      'steam is required',
      'steam initialization failed',
      'steam connection failed',
      'steam authentication failed',
      'steam login required',
      'steam_appid.txt not found',
      'steamworks',
      'restartappifnecessary'
    ];
    
    const lowerError = errorMessage.toLowerCase();
    console.log(`Checking for Steam keywords in: "${lowerError}"`);
    
    const isSteamError = steamErrorKeywords.some(keyword => {
      const found = lowerError.includes(keyword.toLowerCase());
      if (found) {
        console.log(`Found Steam keyword: "${keyword}"`);
      }
      return found;
    });
    
    if (isSteamError) {
      console.log(`Blocking game due to Steam error`);
      return { 
        success: false, 
        error: `This game requires Steam to run. Please ensure Steam is installed and running, then try launching the game again.` 
      };
    }
    
    // For all other errors, just return the original error message
    console.log(`Not a Steam error, returning original error: "${errorMessage}"`);
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