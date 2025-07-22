import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, Download, Settings, Trash2, RefreshCw, Calendar, HardDrive, GitBranch, AlertCircle } from 'lucide-react';

interface GameDetails {
  name: string;
  version: string;
  lastPlayed: string;
  size: string;
  installDate: string;
  description: string;
  repository: string;
}

const GameDetails: React.FC = () => {
  const { gameName } = useParams<{ gameName: string }>();
  const navigate = useNavigate();
  const [gameDetails, setGameDetails] = useState<GameDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (gameName) {
      loadGameDetails();
    }
  }, [gameName]);

  const loadGameDetails = async () => {
    try {
      setLoading(true);
      // In a real app, you'd fetch detailed game info
      // For now, we'll create mock data
      const details: GameDetails = {
        name: gameName!,
        version: '1.0.0',
        lastPlayed: 'Never',
        size: 'Unknown',
        installDate: new Date().toLocaleDateString(),
        description: 'A fantastic game from the Earth Library collection.',
        repository: `https://github.com/username/${gameName}`
      };
      setGameDetails(details);
    } catch (error) {
      setError('Failed to load game details');
      console.error('Failed to load game details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLaunchGame = async () => {
    if (!gameName) return;
    
    try {
      const result = await window.electronAPI.launchGame(gameName);
      if (result.success) {
        // Update last played time
        setGameDetails(prev => prev ? {
          ...prev,
          lastPlayed: new Date().toLocaleString()
        } : null);
      } else {
        setError(`Failed to launch game: ${result.error}`);
      }
    } catch (error) {
      setError('Failed to launch game');
      console.error('Failed to launch game:', error);
    }
  };

  const handleUpdateGame = async () => {
    if (!gameName) return;
    
    try {
      setUpdating(true);
      const result = await window.electronAPI.updateGame(gameName);
      if (result.success) {
        alert(`${gameName} updated successfully!`);
        loadGameDetails(); // Reload details
      } else {
        setError(`Failed to update game: ${result.error}`);
      }
    } catch (error) {
      setError('Failed to update game');
      console.error('Failed to update game:', error);
    } finally {
      setUpdating(false);
    }
  };

  const handleRemoveGame = async () => {
    if (!gameName) return;
    
    // Show confirmation dialog
    const confirmed = confirm(
      `Are you sure you want to delete "${gameName}"?\n\nThis will permanently remove the game and all its files from your system.`
    );
    
    if (!confirmed) return;
    
    try {
      setDeleting(true);
      const result = await window.electronAPI.deleteGame(gameName);
      
      if (result.success) {
        alert(`${gameName} has been successfully deleted.`);
        // Navigate back to library
        navigate('/library');
      } else {
        setError(`Failed to delete game: ${result.error}`);
      }
    } catch (error) {
      setError('Failed to delete game');
      console.error('Failed to delete game:', error);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-gray-400">Loading game details...</div>
      </div>
    );
  }

  if (!gameDetails) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Game Not Found</h2>
          <p className="text-gray-400 mb-4">The game "{gameName}" could not be found.</p>
          <button
            onClick={() => navigate('/library')}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
          >
            Back to Library
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">{gameDetails.name}</h1>
            <p className="text-gray-400">Game Details & Management</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleLaunchGame}
              className="flex items-center space-x-2 px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
            >
              <Play className="w-5 h-5" />
              <span>Launch Game</span>
            </button>
            <button
              onClick={handleUpdateGame}
              disabled={updating || deleting}
              className="flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-lg transition-colors"
            >
              {updating ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-5 h-5" />
                  <span>Update</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-900/50 border border-red-700 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <span className="text-red-400">{error}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Game Information */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">Game Information</h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <GitBranch className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="text-sm text-gray-400">Repository</div>
                  <div className="text-white">{gameDetails.repository}</div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="text-sm text-gray-400">Install Date</div>
                  <div className="text-white">{gameDetails.installDate}</div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <HardDrive className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="text-sm text-gray-400">Size</div>
                  <div className="text-white">{gameDetails.size}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Game Description */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">Description</h3>
            <p className="text-gray-300 leading-relaxed">
              {gameDetails.description}
            </p>
          </div>

          {/* Game Statistics */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">Statistics</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-400">Version</div>
                <div className="text-white font-semibold">{gameDetails.version}</div>
              </div>
              <div>
                <div className="text-sm text-gray-400">Last Played</div>
                <div className="text-white font-semibold">{gameDetails.lastPlayed}</div>
              </div>
              <div>
                <div className="text-sm text-gray-400">Play Time</div>
                <div className="text-white font-semibold">0 hours</div>
              </div>
              <div>
                <div className="text-sm text-gray-400">Times Launched</div>
                <div className="text-white font-semibold">0</div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Game Management */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">Game Management</h3>
            <div className="space-y-3">
              <button
                onClick={() => navigate('/library')}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              >
                <Settings className="w-5 h-5" />
                <span>Back to Library</span>
              </button>
              <button
                onClick={handleRemoveGame}
                disabled={deleting || updating}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 rounded-lg transition-colors"
              >
                {deleting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-5 h-5" />
                    <span>Remove Game</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Game Stats */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">Statistics</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Play Time</span>
                <span className="text-white">0 hours</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Times Launched</span>
                <span className="text-white">0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Last Updated</span>
                <span className="text-white">Today</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameDetails; 