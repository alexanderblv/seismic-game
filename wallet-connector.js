// wallet-connector.js - Современная реализация Web3Modal v2 для веб3 приложений

(function() {
    class WalletConnector {
        constructor() {
            // Инициализация необходимых переменных
            this.provider = null;
            this.selectedAccount = null;
            this.chainId = null;
            this.isConnecting = false;
            this.web3Modal = null;
            this.initialized = false;
        }

        // Инициализация Web3Modal с настройками
        async initialize(config = {}) {
            if (this.initialized) return;

            try {
                const { EthereumClient, w3mConnectors, w3mProvider } = window.W3M || {};
                const { Web3Modal } = window.W3M_HTML || {};

                if (!Web3Modal || !EthereumClient) {
                    throw new Error("Web3Modal не загружен");
                }

                // Получаем конфигурацию сети из seismicConfig или используем предоставленную конфигурацию
                const networkConfig = window.seismicConfig && window.seismicConfig.network 
                    ? window.seismicConfig.network
                    : config.network;

                // Настройка проекта Web3Modal
                const projectId = config.projectId || "YOUR_PROJECT_ID"; // Требуется ID проекта от WalletConnect Cloud

                // Определение цепей
                const chains = [
                    {
                        id: networkConfig.chainId,
                        name: networkConfig.name,
                        network: networkConfig.network || "seismic",
                        nativeCurrency: networkConfig.nativeCurrency || {
                            name: "Ether",
                            symbol: "ETH",
                            decimals: 18
                        },
                        rpcUrls: {
                            default: { http: [networkConfig.rpcUrl] },
                            public: { http: [networkConfig.rpcUrl] }
                        }
                    }
                ];

                // Настройка Web3Modal
                const connectors = w3mConnectors({ 
                    projectId, 
                    chains, 
                    version: "2" 
                });

                const wagmiConfig = {
                    autoConnect: true,
                    connectors,
                    publicClient: w3mProvider({ projectId, chains })
                };

                const ethereumClient = new EthereumClient(wagmiConfig, chains);
                this.web3Modal = new Web3Modal({
                    projectId,
                    themeMode: "light",
                    themeVariables: {
                        "--w3m-font-family": "system-ui, sans-serif",
                        "--w3m-accent-color": "#3B82F6"
                    },
                    desktopWallets: ["browser", "coinbaseWallet", "metaMask", "rabby", "trust", "zerion"],
                    mobileWallets: ["argent", "brave", "ledger", "imToken", "metamask", "rainbow", "trust"],
                    explorerRecommendedWalletIds: [
                        "c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96", // MetaMask
                        "4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0", // Trust
                        "fd20dc426fb37566d803205b19bbc1d4096b248ac04548e3cfb6b3a38bd033aa", // Coinbase
                    ],
                    enableAnalytics: true,
                    enableNetworkView: true,
                    enableAccountView: true
                }, ethereumClient);

                // Настройка обработчиков событий
                ethereumClient.watchAccount(account => {
                    if (account.address) {
                        this.selectedAccount = account.address;
                        this._emitEvent('accountChanged', { account: account.address });
                    } else if (this.selectedAccount && !account.address) {
                        this.selectedAccount = null;
                        this._emitEvent('walletDisconnected');
                    }
                });

                ethereumClient.watchNetwork(network => {
                    if (network.chain) {
                        this.chainId = network.chain.id;
                        this._emitEvent('networkChanged', { chainId: network.chain.id });
                    }
                });

                this.initialized = true;
                console.log("Web3Modal инициализирован успешно");
                return true;
            } catch (error) {
                console.error("Ошибка инициализации Web3Modal:", error);
                throw error;
            }
        }

        // Подключение кошелька
        async connect() {
            if (this.isConnecting) return false;
            this.isConnecting = true;
            
            try {
                if (!this.initialized) {
                    await this.initialize();
                }
                
                // Открываем модальное окно выбора кошелька
                if (this.web3Modal) {
                    await this.web3Modal.openModal();
                    
                    // Ждем пока пользователь подключит кошелек
                    const interval = setInterval(() => {
                        if (this.selectedAccount) {
                            clearInterval(interval);
                            this.isConnecting = false;
                            this._emitEvent('walletConnected', { account: this.selectedAccount });
                            return true;
                        }
                    }, 500);

                    // Устанавливаем таймаут чтобы избежать бесконечного ожидания
                    setTimeout(() => {
                        clearInterval(interval);
                        if (!this.selectedAccount) {
                            this.isConnecting = false;
                        }
                    }, 60000); // Таймаут 1 минута
                    
                    return true;
                }
                
                return false;
            } catch (error) {
                console.error("Ошибка подключения кошелька:", error);
                this.isConnecting = false;
                return false;
            }
        }

        // Отключение кошелька
        async disconnect() {
            try {
                if (this.web3Modal && this.selectedAccount) {
                    await this.web3Modal.wagmiConfig.disconnect();
                    this.selectedAccount = null;
                    this.provider = null;
                    this._emitEvent('walletDisconnected');
                    return true;
                }
                return false;
            } catch (error) {
                console.error("Ошибка отключения кошелька:", error);
                return false;
            }
        }

        // Проверка, подключен ли кошелек
        isConnected() {
            return !!this.selectedAccount;
        }

        // Получение текущего аккаунта
        getSelectedAccount() {
            return this.selectedAccount;
        }

        // Получение провайдера для использования с ethers.js
        getProvider() {
            if (this.web3Modal && this.selectedAccount) {
                return this.web3Modal.wagmiConfig.getPublicClient();
            }
            return null;
        }

        // Запрос смены сети
        async switchNetwork(chainId) {
            try {
                if (!this.web3Modal || !this.selectedAccount) {
                    throw new Error("Кошелек не подключен");
                }
                
                await this.web3Modal.wagmiConfig.switchNetwork(chainId);
                return true;
            } catch (error) {
                console.error("Ошибка смены сети:", error);
                return false;
            }
        }

        // Вспомогательный метод для генерации событий
        _emitEvent(eventName, detail = {}) {
            const event = new CustomEvent(eventName, { detail });
            document.dispatchEvent(event);
        }
    }

    // Создаем и экспортируем инстанс WalletConnector
    const walletConnector = new WalletConnector();
    window.WalletConnector = walletConnector;
})(); 