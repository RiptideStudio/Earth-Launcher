import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, RefreshCw, Trash2 } from 'lucide-react';

interface Game {
  name: string;
  size?: string;
}

const Library: React.FC = () => {
  const navigate = useNavigate();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingGames, setUpdatingGames] = useState<Set<string>>(new Set());
  const [deletingGames, setDeletingGames] = useState<Set<string>>(new Set());

  const loadGames = async () => {
    try {
      setLoading(true);
      setError('');

      console.log('Loading games...');
      const installedGames = await window.electronAPI.getInstalledGames();
      console.log('Installed games:', installedGames);
      
      const allStats = await window.electronAPI.getAllGameStats();
      console.log('All stats result:', allStats);
      
      const gamesWithStats: Game[] = await Promise.all(
        installedGames.map(async (gameName) => {
          try {
            const sizeResult = await window.electronAPI.getGameSize(gameName);
            console.log(`Size result for ${gameName}:`, sizeResult);
            
            return {
              name: gameName,
              size: sizeResult.success ? sizeResult.size : 'Unknown'
            };
          } catch (error) {
            console.error(`Error processing game ${gameName}:`, error);
            return {
              name: gameName,
              size: 'Unknown'
            };
          }
        })
      );

      console.log('Final games with stats:', gamesWithStats);
      setGames(gamesWithStats);
    } catch (error) {
      console.error('Failed to load games:', error);
      setError(`Failed to load games: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGames();
  }, []);

  const handlePlayGame = async (gameName: string) => {
    try {
      const result = await window.electronAPI.launchGame(gameName);
      if (!result.success) {
        alert(`Failed to launch ${gameName}: ${result.error}`);
      }
    } catch (error) {
      console.error('Failed to launch game:', error);
      alert(`Failed to launch ${gameName}`);
    }
  };

  const handleUpdateGame = async (gameName: string) => {
    try {
      setUpdatingGames(prev => new Set(prev).add(gameName));
      const result = await window.electronAPI.updateGame(gameName);

      if (result.success) {
        alert(`${gameName} has been successfully updated.`);
        await loadGames(); // Refresh games to update sizes
      } else {
        alert(`Failed to update ${gameName}: ${result.error}`);
      }
    } catch (error) {
      console.error('Failed to update game:', error);
      alert(`Failed to update ${gameName}: An unexpected error occurred.`);
    } finally {
      setUpdatingGames(prev => {
        const newSet = new Set(prev);
        newSet.delete(gameName);
        return newSet;
      });
    }
  };

  const handleDeleteGame = async (gameName: string) => {
    // Show confirmation dialog
    const confirmed = confirm(
      `Are you sure you want to delete "${gameName}"?\n\nThis will permanently remove the game and all its files from your system.`
    );

    if (!confirmed) return;

    try {
      setDeletingGames(prev => new Set(prev).add(gameName));
      const result = await window.electronAPI.deleteGame(gameName);

      if (result.success) {
        // Remove the game from the local state
        setGames(prev => prev.filter(game => game.name !== gameName));
        alert(`${gameName} has been successfully deleted.`);
      } else {
        alert(`Failed to delete ${gameName}: ${result.error}`);
      }
    } catch (error) {
      console.error('Failed to delete game:', error);
      alert(`Failed to delete ${gameName}: An unexpected error occurred.`);
    } finally {
      setDeletingGames(prev => {
        const newSet = new Set(prev);
        newSet.delete(gameName);
        return newSet;
      });
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading your games...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={loadGames}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Game Library</h1>
        <p className="text-gray-400">
          {games.length} game{games.length !== 1 ? 's' : ''} installed
        </p>
      </div>

      {games.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Play className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No Games Installed</h3>
          <p className="text-gray-400 mb-6">
            Install some games from the Add Games page to get started.
          </p>
          <button
            onClick={() => navigate('/add-game')}
            className="px-6 py-3 bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
          >
            Browse Games
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {games.map((game) => {
            const isUpdating = updatingGames.has(game.name);
            const isDeleting = deletingGames.has(game.name);

            return (
              <div
                key={game.name}
                className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-colors"
              >
                {/* Game Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-white text-lg mb-1">{game.name}</h3>
                    <p className="text-gray-400 text-sm">{game.size}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => navigate(`/game/${encodeURIComponent(game.name)}`)}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => handlePlayGame(game.name)}
                    disabled={isUpdating || isDeleting}
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded-lg transition-colors"
                  >
                    <Play className="w-4 h-4" />
                    <span>Play</span>
                  </button>
                  
                  <button
                    onClick={() => handleUpdateGame(game.name)}
                    disabled={isUpdating || isDeleting}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-lg transition-colors"
                    title="Update Game"
                  >
                    {isUpdating ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                  </button>
                  
                  <button
                    onClick={() => handleDeleteGame(game.name)}
                    disabled={isUpdating || isDeleting}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 rounded-lg transition-colors"
                    title="Delete Game"
                  >
                    {isDeleting ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Library; 