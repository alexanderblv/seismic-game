import { useState, useEffect, ReactNode } from 'react';
import { seismic } from '../lib/seismic';
import './PlayerStats.css';

interface PlayerStatsProps {
  isLoggedIn: boolean;
}

interface PlayerStatistics {
  movements?: number;
  distance?: number;
  path?: Array<{x: number, y: number}>;
}

const PlayerStats: React.FC<PlayerStatsProps> = ({ isLoggedIn }) => {
  const [stats, setStats] = useState<PlayerStatistics | null>(null);
  const [achievements, setAchievements] = useState<string[]>([]);
  const [showStats, setShowStats] = useState<boolean>(false);

  useEffect(() => {
    if (!isLoggedIn) {
      setStats(null);
      setAchievements([]);
      return;
    }

    // Load player stats and achievements
    const loadData = async () => {
      try {
        const gameData = await seismic.data.get();
        if (gameData.achievements) {
          setAchievements(gameData.achievements);
        }

        const playerStats = await seismic.data.getStats();
        setStats(playerStats);
      } catch (error) {
        console.error('Failed to load player stats:', error);
      }
    };

    loadData();

    // Subscribe to data changes
    const unsubscribe = seismic.on('transaction', (transaction) => {
      if (['DATA_UPDATE_COMPLETE', 'DATA_RESPONSE'].includes(transaction.action)) {
        loadData();
      }
    });

    return () => {
      unsubscribe();
    };
  }, [isLoggedIn]);

  if (!isLoggedIn) {
    return null;
  }

  const hasAchievements = achievements.length > 0;
  const hasStats = stats && (stats.movements || stats.distance);

  if (!hasAchievements && !hasStats) {
    return null;
  }

  return (
    <div className="player-stats">
      <div className="stats-header" onClick={() => setShowStats(!showStats)}>
        <h3>Player Statistics {showStats ? '▼' : '▶'}</h3>
      </div>

      {showStats && (
        <div className="stats-content">
          {hasAchievements && (
            <div className="achievements-section">
              <h4>Achievements</h4>
              <div className="achievements-list">
                {achievements.map((achievement, index) => (
                  <div className="achievement-item" key={index}>
                    <div className="achievement-icon">🏆</div>
                    <div className="achievement-name">
                      {formatAchievementName(achievement)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {hasStats && (
            <div className="player-metrics">
              <h4>Game Statistics</h4>
              <div className="metrics-grid">
                <div className="metric-item">
                  <div className="metric-value">{stats.movements || 0}</div>
                  <div className="metric-label">Movements</div>
                </div>
                <div className="metric-item">
                  <div className="metric-value">{stats.distance ? Math.round(stats.distance) : 0}</div>
                  <div className="metric-label">Distance (px)</div>
                </div>
                <div className="metric-item">
                  <div className="metric-value">{stats.path ? stats.path.length : 0}</div>
                  <div className="metric-label">Path Points</div>
                </div>
              </div>

              {stats.path && stats.path.length > 0 && (
                <div className="path-viz">
                  <h4>Movement Path</h4>
                  <div className="path-container">
                    <svg viewBox="0 0 800 600" className="path-svg">
                      {renderPath(stats.path)}
                    </svg>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Helper functions
function formatAchievementName(achievement: string): string {
  return achievement
    .split('_')
    .map(word => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');
}

function renderPath(path: Array<{x: number, y: number}>): ReactNode[] {
  if (!path || path.length < 2) return [];

  // Generate path line
  let pathString = `M ${path[0].x} ${path[0].y}`;
  for (let i = 1; i < path.length; i++) {
    pathString += ` L ${path[i].x} ${path[i].y}`;
  }

  // Add path points
  const points = path.map((point, index) => (
    <circle 
      key={`point-${index}`}
      cx={point.x} 
      cy={point.y} 
      r={index === 0 ? 5 : index === path.length - 1 ? 5 : 3}
      className={index === 0 ? 'start-point' : index === path.length - 1 ? 'end-point' : 'path-point'}
    />
  ));

  return [
    <path key="path-line" d={pathString} className="path-line" />,
    ...points
  ];
}

export default PlayerStats; 