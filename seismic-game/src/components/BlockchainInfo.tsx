import { useState, useEffect } from 'react';
import { seismic } from '../lib/seismic';
import './BlockchainInfo.css';

interface BlockchainInfoProps {
  isLoggedIn: boolean;
}

const BlockchainInfo: React.FC<BlockchainInfoProps> = ({ isLoggedIn }) => {
  const [stats, setStats] = useState<any>(null);
  const [showDetails, setShowDetails] = useState<boolean>(false);
  const [transactionLog, setTransactionLog] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!isLoggedIn) {
      setStats(null);
      setTransactionLog([]);
      setLoading(false);
      return;
    }

    // Fetch network stats
    const fetchStats = async () => {
      setLoading(true);
      try {
        const networkStats = await seismic.getNetworkStats();
        setStats(networkStats);
      } catch (error) {
        console.error('Failed to fetch network stats', error);
      } finally {
        setLoading(false);
      }
    };

    // Get initial transaction log
    setTransactionLog(seismic.getTransactionLog().slice(-5));

    // Subscribe to transaction events
    const unsubscribe = seismic.on('transaction', (transaction) => {
      setTransactionLog(prev => {
        // Keep only the latest 5 transactions
        const updated = [...prev, transaction].slice(-5);
        return updated;
      });
    });

    fetchStats();
    
    // Refresh stats every 10 seconds
    const interval = setInterval(fetchStats, 10000);

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, [isLoggedIn]);

  if (!isLoggedIn) {
    return null;
  }

  return (
    <div className="blockchain-info">
      <div className="blockchain-header" onClick={() => setShowDetails(!showDetails)}>
        <h3>Seismic Blockchain {showDetails ? '▼' : '▶'}</h3>
        {stats && !loading && (
          <div className="network-summary">
            <span className="status-indicator active"></span>
            <span>{stats.blockHeight.toLocaleString()} blocks</span>
            <span>{stats.transactionsPerSecond} TPS</span>
          </div>
        )}
        {loading && <div className="loading-indicator">Connecting...</div>}
      </div>

      {showDetails && (
        <div className="blockchain-details">
          {stats && (
            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-value">{stats.blockHeight.toLocaleString()}</div>
                <div className="stat-label">Block Height</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{stats.transactionsPerSecond}</div>
                <div className="stat-label">TPS</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{stats.activeNodes}</div>
                <div className="stat-label">Nodes</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{stats.encryptionStrength}</div>
                <div className="stat-label">Encryption</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{stats.networkLatency}</div>
                <div className="stat-label">Latency</div>
              </div>
            </div>
          )}

          <div className="transaction-log">
            <h4>Recent Transactions</h4>
            {transactionLog.length > 0 ? (
              <ul>
                {transactionLog.map((transaction, index) => (
                  <li key={transaction.timestamp + index} className="transaction-item">
                    <div className="transaction-time">
                      {new Date(transaction.timestamp).toLocaleTimeString()}
                    </div>
                    <div className="transaction-action">
                      {transaction.action}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="no-transactions">No transactions yet</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BlockchainInfo; 