import React, { useState, useEffect } from 'react';
import { Clock, Calendar, MousePointer, TrendingUp, BarChart3, Activity } from 'lucide-react';

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
  duration: number;
}

const Stats: React.FC = () => {
  const [allStats, setAllStats] = useState<GameStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadStats = async () => {
    try {
      setLoading(true);
      setError('');

      const result = await window.electronAPI.getAllGameStats();
      if (result.success && result.stats) {
        setAllStats(result.stats);
      } else {
        setError('Failed to load statistics');
      }
    } catch (error) {
      setError('Failed to load statistics');
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      const hours = Math.floor(diffInHours);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (diffInHours < 168) { // 7 days
      const days = Math.floor(diffInHours / 24);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const formatHours = (hours: number) => {
    if (hours === 0) return '0h';
    if (hours < 1) return `${Math.round(hours * 60)}m`;
    if (hours < 24) return `${hours.toFixed(1)}h`;
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return `${days}d ${remainingHours.toFixed(1)}h`;
  };



  const calculateTotalStats = () => {
    const totalHours = allStats.reduce((sum, stat) => sum + stat.totalHoursPlayed, 0);
    const totalLaunches = allStats.reduce((sum, stat) => sum + stat.launchCount, 0);
    const totalSessions = allStats.reduce((sum, stat) => sum + stat.sessions.length, 0);
    
    return { totalHours, totalLaunches, totalSessions };
  };

  const getMostPlayedGames = () => {
    return [...allStats]
      .sort((a, b) => b.totalHoursPlayed - a.totalHoursPlayed)
      .slice(0, 5);
  };

  const getRecentlyPlayedGames = () => {
    return [...allStats]
      .filter(stat => stat.lastPlayed)
      .sort((a, b) => new Date(b.lastPlayed!).getTime() - new Date(a.lastPlayed!).getTime())
      .slice(0, 5);
  };



  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading statistics...</p>
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
            onClick={loadStats}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const { totalHours, totalLaunches, totalSessions } = calculateTotalStats();
  const mostPlayedGames = getMostPlayedGames();
  const recentlyPlayedGames = getRecentlyPlayedGames();

  return (
    <div className="h-full overflow-y-auto p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Game Statistics</h1>
        <p className="text-gray-400">
          Track your gaming activity and progress
        </p>
      </div>

      {allStats.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No Statistics Available</h3>
          <p className="text-gray-400">
            Start playing games to see your statistics here.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Overall Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Total Hours</p>
                  <p className="text-2xl font-bold text-white">{formatHours(totalHours)}</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                  <MousePointer className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Total Launches</p>
                  <p className="text-2xl font-bold text-white">{totalLaunches}</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Total Sessions</p>
                  <p className="text-2xl font-bold text-white">{totalSessions}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Most Played Games */}
          {mostPlayedGames.length > 0 && (
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center space-x-2">
                <TrendingUp className="w-5 h-5" />
                <span>Most Played Games</span>
              </h2>
              <div className="space-y-3">
                {mostPlayedGames.map((game, index) => (
                  <div key={game.gameName} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <p className="text-white font-medium">{game.gameName}</p>
                        <p className="text-gray-400 text-sm">
                          {game.launchCount} launch{game.launchCount !== 1 ? 'es' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-medium">{formatHours(game.totalHoursPlayed)}</p>
                      <p className="text-gray-400 text-sm">{formatDate(game.lastPlayed)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recently Played Games */}
          {recentlyPlayedGames.length > 0 && (
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center space-x-2">
                <Calendar className="w-5 h-5" />
                <span>Recently Played</span>
              </h2>
              <div className="space-y-3">
                {recentlyPlayedGames.map((game) => (
                  <div key={game.gameName} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                    <div>
                      <p className="text-white font-medium">{game.gameName}</p>
                      <p className="text-gray-400 text-sm">
                        {game.launchCount} launch{game.launchCount !== 1 ? 'es' : ''} • {formatHours(game.totalHoursPlayed)} total
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-medium">{formatDate(game.lastPlayed)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}


        </div>
      )}
    </div>
  );
};

export default Stats; 