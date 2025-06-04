import React from 'react';
import { PrivyProvider, usePrivy } from '@privy-io/react-auth';

// Импортируем конфигурацию
import { seismicConfig } from '../seismic-config.js';

// Компонент приложения
function AppContent() {
    const { ready, authenticated, user, login, logout } = usePrivy();

    if (!ready) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Загрузка Privy SDK...</p>
            </div>
        );
    }

    return (
        <div className="app-container">
            <header className="app-header">
                <h1>🌊 Seismic Game</h1>
                <p>Блокчейн приложение с Privy аутентификацией</p>
            </header>

            <main className="app-main">
                {!authenticated ? (
                    <div className="auth-section">
                        <h2>Подключитесь к приложению</h2>
                        <p>Используйте кошелек для входа в систему</p>
                        <button 
                            className="connect-button"
                            onClick={login}
                        >
                            🔐 Подключить кошелек
                        </button>
                    </div>
                ) : (
                    <div className="user-section">
                        <div className="user-info">
                            <h2>✅ Подключен!</h2>
                            <div className="user-details">
                                <p><strong>ID:</strong> {user?.id}</p>
                                {user?.wallet?.address && (
                                    <p><strong>Кошелек:</strong> {user.wallet.address}</p>
                                )}
                                {user?.email?.address && (
                                    <p><strong>Email:</strong> {user.email.address}</p>
                                )}
                                <p><strong>Создан:</strong> {user?.createdAt ? new Date(user.createdAt).toLocaleString('ru-RU') : 'N/A'}</p>
                            </div>
                        </div>

                        <div className="actions">
                            <button 
                                className="action-button game-button"
                                onClick={() => {
                                    // Здесь будет логика игры
                                    alert('Игра скоро будет доступна!');
                                }}
                            >
                                🎮 Начать игру
                            </button>
                            
                            <button 
                                className="action-button wallet-button"
                                onClick={() => {
                                    // Показать информацию о кошельке
                                    console.log('User wallets:', user?.linkedAccounts);
                                }}
                            >
                                👛 Управление кошельком
                            </button>
                            
                            <button 
                                className="action-button logout-button"
                                onClick={logout}
                            >
                                🚪 Выйти
                            </button>
                        </div>

                        <div className="network-info">
                            <h3>🌐 Информация о сети</h3>
                            <div className="network-details">
                                <p><strong>Сеть:</strong> {seismicConfig.network.name}</p>
                                <p><strong>Chain ID:</strong> {seismicConfig.network.chainId}</p>
                                <p><strong>RPC:</strong> {seismicConfig.network.rpcUrl}</p>
                                <p><strong>Explorer:</strong> <a href={seismicConfig.network.explorer} target="_blank" rel="noopener noreferrer">Открыть explorer</a></p>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            <footer className="app-footer">
                <p>&copy; 2024 Seismic Game. Powered by Privy</p>
            </footer>
        </div>
    );
}

// Основной компонент приложения с Privy Provider
function App() {
    return (
        <PrivyProvider 
            appId={seismicConfig.privy.appId}
            config={seismicConfig.privy.config}
        >
            <AppContent />
        </PrivyProvider>
    );
}

export default App; 