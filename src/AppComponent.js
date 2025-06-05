import React from 'react';
import { PrivyProvider, usePrivy } from '@privy-io/react-auth';
import './App.css';

// Debug logging
console.log('🚀 AppComponent.js loaded successfully');
console.log('✅ Privy components:', { PrivyProvider, usePrivy });

// Конфигурация сети Seismic
const seismicNetwork = {
  id: 5124,
  name: 'Seismic devnet',
  network: 'seismic',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    public: { http: ['https://node-2.seismicdev.net/rpc'] },
    default: { http: ['https://node-2.seismicdev.net/rpc'] },
  },
  blockExplorers: {
    default: { name: 'Seismic Explorer', url: 'https://explorer-2.seismicdev.net/' },
  },
};

// Конфигурация Privy
const privyConfig = {
  appearance: {
    accentColor: '#6A6FF5',
    theme: 'light',
    showWalletLoginFirst: false,
    logo: 'https://auth.privy.io/logos/privy-logo.png',
  },
  loginMethods: ['wallet', 'email'],
  embeddedWallets: {
    createOnLogin: 'users-without-wallets',
    requireUserPasswordOnCreate: false,
    showWalletUIs: true,
  },
  defaultChain: seismicNetwork,
  supportedChains: [seismicNetwork],
};

// Основной контент приложения
function AppContent() {
  const { ready, authenticated, user, login, logout } = usePrivy();

  if (!ready) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <h2>🌊 Загрузка Seismic Game</h2>
        <p>Инициализация Privy React Auth SDK...</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>🌊 Seismic Game</h1>
        <p>Блокчейн приложение с Privy React Auth SDK</p>
      </header>

      <main className="app-main">
        {!authenticated ? (
          <div className="auth-section">
            <h2>Добро пожаловать!</h2>
            <p>Подключите кошелек для входа в игру</p>
            <button className="connect-button" onClick={login}>
              🔐 Подключить кошелек
            </button>
          </div>
        ) : (
          <div className="user-section">
            <div className="user-info">
              <h2>✅ Успешно подключен!</h2>
              <div className="user-details">
                <p><strong>ID:</strong> {user?.id}</p>
                {user?.wallet?.address && (
                  <p><strong>Кошелек:</strong> <code>{user.wallet.address}</code></p>
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
                onClick={() => alert('🎮 Игра скоро будет доступна!')}
              >
                🎮 Начать игру
              </button>
              
              <button 
                className="action-button wallet-button"
                onClick={() => {
                  console.log('User wallets:', user?.linkedAccounts);
                  alert('📊 Информация о кошельке в консоли');
                }}
              >
                👛 Информация о кошельке
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
                <p><strong>Сеть:</strong> {seismicNetwork.name}</p>
                <p><strong>Chain ID:</strong> <code>{seismicNetwork.id}</code></p>
                <p><strong>RPC:</strong> <a href={seismicNetwork.rpcUrls.default.http[0]} target="_blank" rel="noopener noreferrer">{seismicNetwork.rpcUrls.default.http[0]}</a></p>
                <p><strong>Explorer:</strong> <a href={seismicNetwork.blockExplorers.default.url} target="_blank" rel="noopener noreferrer">Открыть explorer</a></p>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p>© 2024 Seismic Game. Powered by Privy React Auth</p>
      </footer>
    </div>
  );
}

// Главный компонент приложения
function App() {
  return (
    <PrivyProvider
      appId="cmbhhu8sr00mojr0l66siei2z"
      config={privyConfig}
    >
      <AppContent />
    </PrivyProvider>
  );
}

export default App; 