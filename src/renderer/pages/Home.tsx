import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Package, Clock, TrendingUp, BarChart3 } from 'lucide-react';

interface BasicStats {
  totalGames: number;
  totalHours: number;
  totalLaunches: number;
}

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<BasicStats>({ totalGames: 0, totalHours: 0, totalLaunches: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBasicStats = async () => {
      try {
        setLoading(true);
        
        // Check if electronAPI is available
        if (typeof window.electronAPI === 'undefined') {
          console.error('electronAPI is not available');
          setStats({ totalGames: 0, totalHours: 0, totalLaunches: 0 });
          return;
        }
        
        // Get installed games count
        const installedGames = await window.electronAPI.getInstalledGames();
        
        // Get all stats
        const allStatsResult = await window.electronAPI.getAllGameStats();
        const allStats = allStatsResult.success ? allStatsResult.stats || [] : [];
        
        // Calculate totals
        const totalHours = allStats.reduce((sum, stat) => sum + stat.totalHoursPlayed, 0);
        const totalLaunches = allStats.reduce((sum, stat) => sum + stat.launchCount, 0);
        
        setStats({
          totalGames: installedGames.length,
          totalHours,
          totalLaunches
        });
      } catch (error) {
        console.error('Failed to load basic stats:', error);
        // Set default values on error
        setStats({ totalGames: 0, totalHours: 0, totalLaunches: 0 });
      } finally {
        setLoading(false);
      }
    };

    loadBasicStats();
  }, []);

  const formatHours = (hours: number) => {
    if (hours === 0) return '0h';
    if (hours < 1) return `${Math.round(hours * 60)}m`;
    if (hours < 24) return `${hours.toFixed(1)}h`;
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return `${days}d ${remainingHours.toFixed(1)}h`;
  };

  return (
    <div className="h-full overflow-y-auto p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Welcome to Earth Launcher</h1>
        <p className="text-gray-400">
          Your personal game library and launcher
        </p>
      </div>

      {/* Quick Stats */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Games Installed</p>
                <p className="text-2xl font-bold text-white">{stats.totalGames}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Total Hours</p>
                <p className="text-2xl font-bold text-white">{formatHours(stats.totalHours)}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Total Launches</p>
                <p className="text-2xl font-bold text-white">{stats.totalLaunches}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center space-x-3 mb-4">
            <Play className="w-6 h-6 text-green-400" />
            <h2 className="text-xl font-semibold text-white">Quick Play</h2>
          </div>
          <p className="text-gray-400 mb-4">
            Launch your installed games and start playing immediately.
          </p>
          <button
            onClick={() => navigate('/library')}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
          >
            Browse Library
          </button>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center space-x-3 mb-4">
            <BarChart3 className="w-6 h-6 text-blue-400" />
            <h2 className="text-xl font-semibold text-white">View Statistics</h2>
          </div>
          <p className="text-gray-400 mb-4">
            Track your gaming activity, hours played, and favorite games.
          </p>
          <button
            onClick={() => navigate('/stats')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            View Stats
          </button>
        </div>
      </div>

      {/* Add Games Section */}
      <div className="mt-8 bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white mb-2">Discover New Games</h2>
            <p className="text-gray-400">
              Browse and install games from the Earth Library repository.
            </p>
          </div>
          <button
            onClick={() => navigate('/add-game')}
            className="px-6 py-3 bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
          >
            Add Games
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home; 