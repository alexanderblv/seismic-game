import React from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { seismicConfig } from '../../seismic-config.js';

const WalletInfo = () => {
    const { user } = usePrivy();

    if (!user?.wallet?.address) {
        return null;
    }

    const formatAddress = (address) => {
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text).then(() => {
            alert('✅ Адрес скопирован в буфер обмена!');
        }).catch(() => {
            alert('❌ Не удалось скопировать адрес');
        });
    };

    const openInExplorer = (address) => {
        const explorerUrl = `${seismicConfig.network.explorer}address/${address}`;
        window.open(explorerUrl, '_blank');
    };

    return (
        <div className="wallet-info-card">
            <h3>👛 Информация о кошельке</h3>
            <div className="wallet-details">
                <div className="wallet-item">
                    <label>Адрес:</label>
                    <div className="wallet-address">
                        <code onClick={() => copyToClipboard(user.wallet.address)}>
                            {formatAddress(user.wallet.address)}
                        </code>
                        <button 
                            className="copy-btn"
                            onClick={() => copyToClipboard(user.wallet.address)}
                            title="Скопировать полный адрес"
                        >
                            📋
                        </button>
                        <button 
                            className="explorer-btn"
                            onClick={() => openInExplorer(user.wallet.address)}
                            title="Открыть в блокчейн эксплорере"
                        >
                            🔍
                        </button>
                    </div>
                </div>
                
                {user.wallet.chainId && (
                    <div className="wallet-item">
                        <label>Chain ID:</label>
                        <span className="chain-id">{user.wallet.chainId}</span>
                    </div>
                )}
                
                {user.wallet.connectorType && (
                    <div className="wallet-item">
                        <label>Тип кошелька:</label>
                        <span className="connector-type">{user.wallet.connectorType}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WalletInfo; 