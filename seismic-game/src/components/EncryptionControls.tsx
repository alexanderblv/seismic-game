import { useState, useEffect } from 'react';
import { seismicIntegration } from '../lib/seismic-integration';
import './EncryptionControls.css';

interface EncryptionControlsProps {
  isLoggedIn: boolean;
  userName?: string;
}

const EncryptionControls: React.FC<EncryptionControlsProps> = ({ isLoggedIn, userName }) => {
  const [showControls, setShowControls] = useState(false);
  const [networkMode, setNetworkMode] = useState(seismicIntegration.getNetworkMode());
  const [encryptionStatus, setEncryptionStatus] = useState(seismicIntegration.getEncryptionStatus());
  const [encryptionTypes, setEncryptionTypes] = useState(seismicIntegration.getEncryptionTypes());
  const [example, setExample] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Set username in integration library
    if (userName) {
      seismicIntegration.setUserName(userName);
    }
    
    // Update encryption example when encryption status changes
    if (showControls) {
      updateExample();
    }
  }, [encryptionStatus, showControls, userName]);

  const toggleNetwork = () => {
    const isDevnet = seismicIntegration.toggleNetwork();
    setNetworkMode(seismicIntegration.getNetworkMode());
  };

  const toggleEncryption = () => {
    const isEnabled = seismicIntegration.toggleEncryption();
    setEncryptionStatus(seismicIntegration.getEncryptionStatus());
  };

  const setEncryptionType = (typeId: string) => {
    seismicIntegration.setEncryptionType(typeId);
    setEncryptionStatus(seismicIntegration.getEncryptionStatus());
  };

  const updateExample = async () => {
    setLoading(true);
    try {
      // Get encryption example
      const exampleData = seismicIntegration.getEncryptionExample();
      setExample(exampleData);
      
      // Simulate transaction
      await seismicIntegration.simulateTransaction('ENCRYPTION_EXAMPLE', {
        encryptionEnabled: encryptionStatus.enabled,
        encryptionType: encryptionStatus.type.id
      });
    } catch (error) {
      console.error('Error updating encryption example:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isLoggedIn) {
    return null;
  }

  return (
    <div className="encryption-controls">
      <div className="encryption-header" onClick={() => setShowControls(!showControls)}>
        <h3>Encryption Controls {showControls ? '▼' : '▶'}</h3>
        <div className="controls-summary">
          <span className="network-pill" data-network={networkMode.toLowerCase()}>
            {networkMode}
          </span>
          <span className="encryption-pill" data-enabled={encryptionStatus.enabled.toString()}>
            {encryptionStatus.enabled ? encryptionStatus.type.name : 'No Encryption'}
          </span>
        </div>
      </div>

      {showControls && (
        <div className="controls-content">
          {userName && (
            <div className="user-info-section">
              <p>Hello, <strong>{userName}</strong>! Configure your encryption settings below.</p>
            </div>
          )}
          
          <div className="control-section">
            <h4>Network Mode</h4>
            <div className="toggle-wrapper">
              <span className={networkMode === 'Mainnet' ? 'active' : ''}>Mainnet</span>
              <div className="toggle-switch" onClick={toggleNetwork}>
                <div className={`toggle-slider ${networkMode === 'Devnet' ? 'right' : 'left'}`}></div>
              </div>
              <span className={networkMode === 'Devnet' ? 'active' : ''}>Devnet</span>
            </div>
            <p className="mode-description">
              {networkMode === 'Devnet' 
                ? 'Devnet is used for testing with known decryption keys.' 
                : 'Mainnet is the production network with secure encryption.'}
            </p>
          </div>

          <div className="control-section">
            <h4>Encryption</h4>
            <div className="toggle-wrapper">
              <span className={!encryptionStatus.enabled ? 'active' : ''}>Off</span>
              <div className="toggle-switch" onClick={toggleEncryption}>
                <div className={`toggle-slider ${encryptionStatus.enabled ? 'right' : 'left'}`}></div>
              </div>
              <span className={encryptionStatus.enabled ? 'active' : ''}>On</span>
            </div>
            
            <h5>Encryption Type</h5>
            <div className="encryption-types">
              {encryptionTypes.map(type => (
                <div 
                  key={type.id}
                  className={`encryption-type ${encryptionStatus.type.id === type.id ? 'selected' : ''}`}
                  onClick={() => setEncryptionType(type.id)}
                >
                  <div className="type-name">{type.name}</div>
                  <div className="type-description">{type.description}</div>
                </div>
              ))}
            </div>
          </div>

          {example && (
            <div className="encryption-example">
              <h4>Data Encryption Example</h4>
              
              <div className="example-section">
                <h5>Original Data</h5>
                <pre className="data-display">
                  {JSON.stringify(example.original, null, 2)}
                </pre>
              </div>
              
              <div className="example-section">
                <h5>
                  {encryptionStatus.enabled 
                    ? `Encrypted Data (${encryptionStatus.type.name})` 
                    : 'Unencrypted Data'}
                </h5>
                <pre className="data-display encrypted">
                  {typeof example.encrypted === 'string' 
                    ? example.encrypted.length > 500 
                      ? example.encrypted.substring(0, 500) + '...' 
                      : example.encrypted
                    : JSON.stringify(example.encrypted, null, 2)}
                </pre>
              </div>
              
              <div className="example-section">
                <h5>Computation Example</h5>
                <pre className="data-display computation">
                  {example.computation}
                </pre>
              </div>
              
              <button 
                className="simulate-button" 
                onClick={updateExample}
                disabled={loading}
              >
                {loading ? 'Simulating...' : 'Simulate Transaction'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EncryptionControls; 