import { useState, useEffect } from 'react';
import { seismic } from '../lib/seismic';
import './DevnetSetup.css';

interface DevnetSetupProps {
  isLoggedIn: boolean;
}

const DevnetSetup: React.FC<DevnetSetupProps> = ({ isLoggedIn }) => {
  const [showInstructions, setShowInstructions] = useState(false);
  const [connectionInfo, setConnectionInfo] = useState<any>(null);
  const [setupStage, setSetupStage] = useState<string>('not_started');

  useEffect(() => {
    if (!isLoggedIn) {
      setConnectionInfo(null);
      return;
    }

    const info = seismic.getConnectionInfo();
    setConnectionInfo(info);

    // Subscribe to connection status changes
    const unsubscribe = seismic.on('transaction', (transaction) => {
      if (transaction.action === 'DEVNET_CONNECTED') {
        setConnectionInfo(seismic.getConnectionInfo());
      }
    });

    return () => {
      unsubscribe();
    };
  }, [isLoggedIn]);

  const startSetup = () => {
    setSetupStage('installing_dependencies');
    
    // Simulate installation process
    setTimeout(() => {
      setSetupStage('contract_deployed');
    }, 2000);
  };

  if (!isLoggedIn) {
    return null;
  }

  return (
    <div className="devnet-setup">
      <div className="devnet-header" onClick={() => setShowInstructions(!showInstructions)}>
        <h3>Seismic Devnet Connection {showInstructions ? '▼' : '▶'}</h3>
        {connectionInfo && (
          <div className="connection-status">
            <span className={`status-dot ${connectionInfo.connected ? 'connected' : 'disconnected'}`}></span>
            <span>{connectionInfo.connected ? 'Connected' : 'Not Connected'}</span>
          </div>
        )}
      </div>

      {showInstructions && (
        <div className="devnet-content">
          {connectionInfo?.connected ? (
            <div className="connection-info">
              <p>Connected to Seismic Devnet</p>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Network:</span>
                  <span className="info-value">{connectionInfo.network}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Chain ID:</span>
                  <span className="info-value">{connectionInfo.chainId}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Contract:</span>
                  <span className="info-value contract-address">{connectionInfo.contractAddress}</span>
                </div>
              </div>
              
              {connectionInfo.contractAddress === '0x0000000000000000000000000000000000000000' && (
                <div className="setup-section">
                  <h4>Deploy a Game Contract</h4>
                  <p>You need to deploy a contract to store your game data on the Seismic blockchain.</p>
                  
                  {setupStage === 'not_started' && (
                    <button className="setup-button" onClick={startSetup}>
                      Deploy Contract
                    </button>
                  )}
                  
                  {setupStage === 'installing_dependencies' && (
                    <div className="setup-progress">
                      <div className="setup-step active">
                        <div className="step-number">1</div>
                        <div className="step-details">
                          <div className="step-name">Installing dependencies</div>
                          <div className="loading-dots"><span>.</span><span>.</span><span>.</span></div>
                        </div>
                      </div>
                      <div className="setup-step">
                        <div className="step-number">2</div>
                        <div className="step-details">
                          <div className="step-name">Deploying contract</div>
                        </div>
                      </div>
                      <div className="setup-step">
                        <div className="step-number">3</div>
                        <div className="step-details">
                          <div className="step-name">Testing connection</div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {setupStage === 'contract_deployed' && (
                    <div className="setup-success">
                      <div className="success-icon">✓</div>
                      <div className="success-message">
                        <h5>Contract Deployed!</h5>
                        <p>Your game contract is now deployed to the Seismic Devnet.</p>
                        <p className="contract-address">
                          Contract Address: 0x1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="setup-instructions">
              <h4>Connect to Seismic Devnet</h4>
              <p>Follow these steps to connect your game to the Seismic encrypted blockchain:</p>
              
              <ol className="setup-steps">
                <li>
                  <h5>Set Up Development Environment</h5>
                  <pre className="code-block">
                    <code>
                      # Install Rust<br />
                      curl https://sh.rustup.rs -sSf | sh<br />
                      <br />
                      # Install jq<br />
                      brew install jq<br />
                      <br />
                      # Install sfoundryup<br />
                      curl -L -H "Accept: application/vnd.github.v3.raw" "https://api.github.com/repos/SeismicSystems/seismic-foundry/contents/sfoundryup/install?ref=seismic" | bash<br />
                      source ~/.bashrc
                    </code>
                  </pre>
                </li>
                <li>
                  <h5>Run sfoundryup</h5>
                  <pre className="code-block">
                    <code>
                      sfoundryup  # takes between 5m to 60m
                    </code>
                  </pre>
                </li>
                <li>
                  <h5>Clone Repository</h5>
                  <pre className="code-block">
                    <code>
                      git clone --recurse-submodules https://github.com/SeismicSystems/try-devnet.git<br />
                      cd try-devnet/packages/contract/
                    </code>
                  </pre>
                </li>
                <li>
                  <h5>Deploy Contract</h5>
                  <pre className="code-block">
                    <code>
                      bash script/deploy.sh
                    </code>
                  </pre>
                </li>
                <li>
                  <h5>Get Contract Address</h5>
                  <p>After deployment, update the <code>GAME_CONTRACT_ADDRESS</code> in your code.</p>
                </li>
              </ol>
              
              <div className="note">
                <strong>Note:</strong> This is a testnet with known decryption keys. Don't use for sensitive data!
              </div>
              
              <div className="devnet-links">
                <h5>Useful Links</h5>
                <ul>
                  <li><a href="https://node-2.seismicdev.net/rpc" target="_blank" rel="noopener noreferrer">RPC URL</a></li>
                  <li><a href="https://explorer-2.seismicdev.net" target="_blank" rel="noopener noreferrer">Explorer</a></li>
                  <li><a href="https://faucet-2.seismicdev.net" target="_blank" rel="noopener noreferrer">Faucet</a></li>
                  <li><a href="https://docs.seismic.systems/appendix/devnet" target="_blank" rel="noopener noreferrer">Documentation</a></li>
                </ul>
              </div>
              
              <button className="connect-button">Connect Manually</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DevnetSetup; 