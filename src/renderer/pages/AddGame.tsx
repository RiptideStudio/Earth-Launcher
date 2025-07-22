import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, AlertCircle, CheckCircle, Package, Check } from 'lucide-react';

interface ZipGame {
  name: string;
  downloadUrl: string;
  size?: string;
}

interface InstallProgress {
  gameName: string;
  progress: number;
  status: 'downloading' | 'extracting' | 'complete' | 'error';
  message: string;
}

const AddGame: React.FC = () => {
  const navigate = useNavigate();
  const [availableGames, setAvailableGames] = useState<ZipGame[]>([]);
  const [installedGames, setInstalledGames] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [installProgress, setInstallProgress] = useState<InstallProgress | null>(null);

  // Default repository URL
  const REPO_URL = 'https://github.com/RiptideStudio/Earth-Library';

  // Function to format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const fetchGamesFromRepo = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Extract owner and repo from GitHub URL
      const match = REPO_URL.match(/github\.com\/([^\/]+)\/([^\/]+)/);
      if (!match) {
        throw new Error('Invalid GitHub repository URL');
      }
      
      const [, owner, repo] = match;
      
      // Fetch repository contents using GitHub API
      const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents`);
      const contents = await response.json();
      
      if (!Array.isArray(contents)) {
        throw new Error('Failed to fetch repository contents');
      }
      
      // Filter for zip files
      const zipFiles = contents
        .filter((item: any) => item.name.toLowerCase().endsWith('.zip'))
        .map((item: any) => ({
          name: item.name.replace('.zip', ''),
          downloadUrl: item.download_url,
          size: item.size ? formatFileSize(item.size) : undefined
        }));
      
      setAvailableGames(zipFiles);
      
      if (zipFiles.length === 0) {
        setError('No zip files found in this repository');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch games');
    } finally {
      setLoading(false);
    }
  };

  const loadInstalledGames = async () => {
    try {
      // Check if electronAPI is available
      if (typeof window.electronAPI === 'undefined') {
        console.error('electronAPI is not available');
        setInstalledGames([]);
        return;
      }
      
      const games = await window.electronAPI.getInstalledGames();
      setInstalledGames(games);
    } catch (error) {
      console.error('Failed to load installed games:', error);
      setInstalledGames([]);
    }
  };

  // Load games automatically when component mounts
  useEffect(() => {
    fetchGamesFromRepo();
    loadInstalledGames();
  }, []);

  const handleInstallGame = async (game: ZipGame) => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      // Start progress tracking
      setInstallProgress({
        gameName: game.name,
        progress: 0,
        status: 'downloading',
        message: 'Starting download...'
      });

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setInstallProgress(prev => {
          if (!prev) return prev;
          
          if (prev.status === 'downloading' && prev.progress < 80) {
            return {
              ...prev,
              progress: prev.progress + Math.random() * 10,
              message: `Downloading ${game.name}... ${Math.round(prev.progress)}%`
            };
          } else if (prev.status === 'downloading' && prev.progress >= 80) {
            return {
              ...prev,
              status: 'extracting',
              progress: 80,
              message: 'Extracting files...'
            };
          } else if (prev.status === 'extracting' && prev.progress < 95) {
            return {
              ...prev,
              progress: prev.progress + Math.random() * 5,
              message: `Extracting ${game.name}... ${Math.round(prev.progress)}%`
            };
          }
          return prev;
        });
      }, 200);

      // Check if electronAPI is available
      if (typeof window.electronAPI === 'undefined') {
        throw new Error('electronAPI is not available');
      }
      
      // Download and extract the zip file
      const result = await window.electronAPI.installZipGame(game.downloadUrl, game.name);
      
      clearInterval(progressInterval);
      
      if (result.success) {
        setInstallProgress({
          gameName: game.name,
          progress: 100,
          status: 'complete',
          message: 'Installation complete!'
        });
        
        setSuccess(`Game "${game.name}" has been successfully installed!`);
        
        // Update installed games list
        await loadInstalledGames();
        
        // Clear progress after a delay
        setTimeout(() => {
          setInstallProgress(null);
          navigate('/library');
        }, 2000);
      } else {
        setInstallProgress({
          gameName: game.name,
          progress: 0,
          status: 'error',
          message: result.error || 'Installation failed'
        });
        setError(result.error || 'Failed to install game');
      }
    } catch (error) {
      setInstallProgress({
        gameName: game.name,
        progress: 0,
        status: 'error',
        message: 'An unexpected error occurred'
      });
      setError('An unexpected error occurred');
      console.error('Failed to install game:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshGames = () => {
    fetchGamesFromRepo();
    loadInstalledGames();
  };

  const filteredGames = availableGames.filter(game =>
    game.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isGameInstalled = (gameName: string) => {
    return installedGames.includes(gameName);
  };

  return (
    <div className="h-full overflow-y-auto p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Add Games</h1>
        <p className="text-gray-400">
          Browse and install games from the Earth Library
        </p>
      </div>

      {/* Installation Progress */}
      {installProgress && (
        <div className="mb-6 bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">
              Installing {installProgress.gameName}
            </h3>
            <span className={`text-sm px-2 py-1 rounded ${
              installProgress.status === 'complete' ? 'bg-green-600 text-white' :
              installProgress.status === 'error' ? 'bg-red-600 text-white' :
              'bg-blue-600 text-white'
            }`}>
              {installProgress.status === 'downloading' ? 'Downloading' :
               installProgress.status === 'extracting' ? 'Extracting' :
               installProgress.status === 'complete' ? 'Complete' : 'Error'}
            </span>
          </div>
          
          <div className="mb-2">
            <div className="flex justify-between text-sm text-gray-400 mb-1">
              <span>{installProgress.message}</span>
              <span>{Math.round(installProgress.progress)}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  installProgress.status === 'complete' ? 'bg-green-500' :
                  installProgress.status === 'error' ? 'bg-red-500' :
                  'bg-blue-500'
                }`}
                style={{ width: `${installProgress.progress}%` }}
              />
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
        {/* Available Games */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-white">Available Games</h2>
              <p className="text-gray-400 text-sm">From Earth-Library repository</p>
            </div>
            <div className="flex items-center space-x-4">
              {availableGames.length > 0 && (
                <span className="text-gray-400">{filteredGames.length} of {availableGames.length} games</span>
              )}
              <button
                onClick={handleRefreshGames}
                disabled={loading}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-600 rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {availableGames.length > 0 && (
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search games..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary-500"
              />
            </div>
          )}

          {/* Error/Success Messages */}
          {error && (
            <div className="flex items-center space-x-2 p-3 bg-red-900/50 border border-red-700 rounded-lg mb-4">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <span className="text-red-400">{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center space-x-2 p-3 bg-green-900/50 border border-green-700 rounded-lg mb-4">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="text-green-400">{success}</span>
            </div>
          )}

          {loading && availableGames.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400">Loading games from Earth-Library...</div>
            </div>
          ) : availableGames.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No Games Found</h3>
              <p className="text-gray-400">
                No zip files found in the Earth-Library repository
              </p>
            </div>
          ) : filteredGames.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400">No games match your search</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredGames.map((game) => {
                const installed = isGameInstalled(game.name);
                return (
                  <div
                    key={game.name}
                    className={`bg-gray-700 rounded-lg p-4 transition-colors ${
                      installed ? 'border border-green-600' : 'hover:bg-gray-600'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-white">{game.name}</h3>
                      {game.size && (
                        <span className="text-xs text-gray-400">{game.size}</span>
                      )}
                    </div>
                    
                    {installed ? (
                      <div className="flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg">
                        <Check className="w-4 h-4" />
                        <span>Installed</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleInstallGame(game)}
                        disabled={loading || Boolean(installProgress && installProgress.gameName === game.name)}
                        className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded-lg transition-colors"
                      >
                        {installProgress && installProgress.gameName === game.name ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Installing...</span>
                          </>
                        ) : (
                          <>
                            <Download className="w-4 h-4" />
                            <span>Install</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddGame; 