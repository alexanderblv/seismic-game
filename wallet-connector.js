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
            this.ethereumClient = null;
            this.initialized = false;
        }

        // Инициализация Web3Modal с настройками
        async initialize(config = {}) {
            if (this.initialized) return true;

            try {
                console.log("Инициализация Web3Modal...");
                
                // Проверяем наличие необходимых компонентов для Web3Modal
                const Web3Modal = window.W3M_HTML?.Web3Modal || window.Web3ModalHtml?.Web3Modal;
                const EthereumClient = window.W3M?.EthereumClient || window.Web3ModalEthereum?.EthereumClient;
                const w3mConnectors = window.W3M?.w3mConnectors || window.Web3ModalEthereum?.w3mConnectors;
                const w3mProvider = window.W3M?.w3mProvider || window.Web3ModalEthereum?.w3mProvider;
                
                if (!Web3Modal || !EthereumClient || !w3mConnectors || !w3mProvider) {
                    console.error("Web3Modal компоненты не обнаружены");
                    
                    // Fallback на basic provider
                    if (window.ethereum) {
                        console.log("Fallback на базовый provider (window.ethereum)");
                        this.provider = window.ethereum;
                        
                        try {
                            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                            if (accounts.length > 0) {
                                this.selectedAccount = accounts[0];
                                this._emitEvent('accountChanged', { account: this.selectedAccount });
                            }
                        } catch (error) {
                            console.warn("Ошибка при проверке аккаунтов:", error);
                        }
                        
                        this.initialized = true;
                        return true;
                    }
                    
                    throw new Error("Web3Modal компоненты не обнаружены и нет fallback");
                }
                
                // Получаем конфигурацию сети
                const networkConfig = window.seismicConfig && window.seismicConfig.network 
                    ? window.seismicConfig.network
                    : config.network;

                if (!networkConfig) {
                    throw new Error("Не указана конфигурация сети");
                }

                // ID проекта WalletConnect
                const projectId = config.projectId || window.seismicConfig?.walletConnect?.projectId || "a85ac05209955cfd18fbe7c0fd018f23";
                
                if (!projectId) {
                    throw new Error("Не указан projectId для WalletConnect");
                }

                // Определение цепи
                const chains = [
                    {
                        id: networkConfig.chainId,
                        name: networkConfig.name || "Seismic Network",
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

                // Создаем конфигурацию соединителей
                const connectors = w3mConnectors({ 
                    projectId, 
                    chains, 
                    version: "2" 
                });

                // Создаем конфигурацию wagmi
                const wagmiConfig = {
                    autoConnect: false,
                    connectors,
                    publicClient: w3mProvider({ projectId, chains })
                };

                // Создаем клиент Ethereum
                this.ethereumClient = new EthereumClient(wagmiConfig, chains);
                
                // Создаем экземпляр Web3Modal
                this.web3Modal = new Web3Modal({
                    projectId,
                    themeMode: "light",
                    themeVariables: {
                        "--w3m-font-family": "system-ui, sans-serif",
                        "--w3m-accent-color": "#3B82F6"
                    },
                    // Принудительно включаем выбор из всех доступных кошельков 
                    explorerRecommendedWalletIds: "ALL",
                    excludeWalletIds: ["trustwallet"], // Исключаем Trust Wallet из списка
                    includeWalletIds: ["metaMask", "coinbaseWallet"], // Явно указываем приоритетные кошельки
                    // Приоритетные кошельки для десктопа (Trust Wallet исключен)
                    desktopWallets: [
                        "metamask",
                        "coinbase",
                        "rabby",
                        "brave",
                        "zerion"
                    ],
                    // Приоритетные кошельки для мобильных (Trust Wallet исключен)
                    mobileWallets: [
                        "metamask",
                        "rainbow",
                        "argent", 
                        "brave",
                        "ledger",
                        "imToken"
                    ],
                    // Дополнительные настройки для предотвращения автоподключения
                    enableAnalytics: false,
                    enableNetworkView: true,
                    enableAccountView: true,
                    // Принудительно отключаем автоматический выбор
                    enableExplorer: true,
                    enableWalletFeatures: ["explorer"]
                }, this.ethereumClient);

                // Настройка обработчиков событий
                this.ethereumClient.watchAccount((account) => {
                    if (account.address) {
                        this.selectedAccount = account.address;
                        this._emitEvent('accountChanged', { account: account.address });
                    } else if (this.selectedAccount && !account.address) {
                        this.selectedAccount = null;
                        this._emitEvent('walletDisconnected');
                    }
                });

                this.ethereumClient.watchNetwork((network) => {
                    if (network.chain) {
                        this.chainId = network.chain.id;
                        this._emitEvent('networkChanged', { chainId: network.chain.id });
                    }
                });

                this.initialized = true;
                console.log("Web3Modal успешно инициализирован");
                return true;
            } catch (error) {
                console.error("Ошибка при инициализации Web3Modal:", error);
                
                // Fallback на базовый provider
                if (window.ethereum) {
                    console.log("Fallback на базовый provider после ошибки");
                    this.provider = window.ethereum;
                    this.initialized = true;
                    return true;
                }
                
                throw error;
            }
        }

        // Подключение кошелька
        async connect() {
            if (this.isConnecting) {
                console.log("Процесс подключения уже запущен");
                return false;
            }
            
            this.isConnecting = true;
            
            try {
                // Инициализируем компонент при необходимости
                if (!this.initialized) {
                    await this.initialize();
                }

                // Сбрасываем состояние перед новым подключением
                if (this.selectedAccount) {
                    try {
                        await this.disconnect();
                    } catch (e) {
                        console.warn("Ошибка при сбросе предыдущего подключения:", e);
                    }
                }

                // Если web3Modal доступен, используем его
                if (this.web3Modal) {
                    console.log("Открываем Web3Modal для выбора кошелька");
                    
                    // Идентификатор для отслеживания момента автоподключения
                    const startTime = Date.now();
                    
                    // Принудительно удаляем TrustWallet из localStorage, если он был там сохранен
                    try {
                        const walletConnectData = localStorage.getItem('wagmi.wallet');
                        if (walletConnectData && walletConnectData.includes('trust')) {
                            localStorage.removeItem('wagmi.wallet');
                            localStorage.removeItem('wagmi.connected');
                            console.log("Удален сохраненный выбор Trust Wallet");
                        }
                    } catch (e) {
                        console.warn("Не удалось проверить localStorage:", e);
                    }
                    
                    // Открываем модальное окно и ждем подключения
                    this.web3Modal.openModal({
                        route: 'ConnectWallet',
                        view: 'Wallets'
                    });
                    
                    // Создаем Promise, который разрешится, когда пользователь выберет кошелек
                    return new Promise((resolve) => {
                        // Функция для проверки подключения
                        const checkConnection = () => {
                            const elapsed = Date.now() - startTime;
                            
                            // Если подключение произошло слишком быстро (менее 1 секунды),
                            // это вероятно автоматическое подключение к Trust Wallet
                            if (this.selectedAccount && elapsed < 1000) {
                                console.warn("Обнаружено автоматическое подключение, принудительно показываем выбор");
                                
                                try {
                                    // Сбрасываем подключение и открываем меню заново
                                    this.disconnect().then(() => {
                                        setTimeout(() => {
                                            this.web3Modal.openModal({
                                                route: 'ConnectWallet',
                                                view: 'Wallets'
                                            });
                                        }, 500);
                                    });
                                    
                                    // Очищаем интервал и продолжаем проверку
                                    clearInterval(interval);
                                    setTimeout(() => {
                                        const newInterval = setInterval(() => {
                                            if (this.selectedAccount) {
                                                clearInterval(newInterval);
                                                this._emitEvent('walletConnected', { 
                                                    account: this.selectedAccount 
                                                });
                                                this.isConnecting = false;
                                                resolve(true);
                                            }
                                        }, 500);
                                    }, 1000);
                                    
                                    return;
                                } catch (e) {
                                    console.error("Ошибка сброса автоподключения:", e);
                                }
                            }
                            
                            if (this.selectedAccount) {
                                // Кошелек подключен после выбора пользователем
                                console.log("Подключен кошелек после явного выбора:", this.selectedAccount);
                                this._emitEvent('walletConnected', { 
                                    account: this.selectedAccount 
                                });
                                
                                this.isConnecting = false;
                                resolve(true);
                                
                                // Очищаем интервал
                                clearInterval(interval);
                            }
                        };
                        
                        // Проверяем подключение каждые 500мс
                        const interval = setInterval(checkConnection, 500);
                        
                        // Также слушаем событие закрытия модального окна
                        const modalClose = () => {
                            clearInterval(interval);
                            this.isConnecting = false;
                            
                            // Если кошелек не был выбран, возвращаем false
                            if (!this.selectedAccount) {
                                resolve(false);
                            }
                        };
                        
                        // Добавляем слушатель на закрытие модального окна
                        window.addEventListener('web3modal_close', modalClose, { once: true });
                    });
                }
                
                // Если Web3Modal недоступен, пробуем использовать базовый метод через window.ethereum
                if (window.ethereum) {
                    // Проверяем, не Trust Wallet ли это
                    if (window.ethereum.isTrust) {
                        console.warn("Обнаружен Trust Wallet, принудительно запрашиваем выбор");
                        // Показываем пользователю сообщение о необходимости использовать другой кошелек
                        alert("Trust Wallet автоматически подключается, что может вызывать проблемы. Пожалуйста, используйте другой кошелек.");
                    }
                    
                    try {
                        console.log("Используем прямое подключение через window.ethereum");
                        const accounts = await window.ethereum.request({ 
                            method: 'eth_requestAccounts' 
                        });
                        
                        if (accounts.length > 0) {
                            this.selectedAccount = accounts[0];
                            this._emitEvent('walletConnected', { 
                                account: accounts[0] 
                            });
                            this.isConnecting = false;
                            return true;
                        }
                    } catch (error) {
                        console.error("Ошибка при прямом подключении кошелька:", error);
                        throw error;
                    }
                }
                
                throw new Error("Нет доступных методов для подключения кошелька");
            } catch (error) {
                console.error("Ошибка при подключении кошелька:", error);
                this.isConnecting = false;
                throw error;
            }
        }

        // Отключение кошелька
        async disconnect() {
            try {
                if (this.ethereumClient) {
                    await this.ethereumClient.disconnect();
                    this.selectedAccount = null;
                    this._emitEvent('walletDisconnected');
                    return true;
                } else if (window.ethereum && window.ethereum._handleDisconnect) {
                    await window.ethereum._handleDisconnect();
                    this.selectedAccount = null;
                    this._emitEvent('walletDisconnected');
                    return true;
                }
                
                // Просто сбрасываем состояние
                this.selectedAccount = null;
                this._emitEvent('walletDisconnected');
                return true;
            } catch (error) {
                console.error("Ошибка при отключении кошелька:", error);
                throw error;
            }
        }

        // Проверка, подключен ли кошелек
        isConnected() {
            return !!this.selectedAccount;
        }

        // Получение текущего адреса
        getSelectedAccount() {
            return this.selectedAccount;
        }

        // Получение провайдера
        getProvider() {
            if (this.ethereumClient) {
                return this.ethereumClient.getProvider();
            }
            
            return this.provider || window.ethereum;
        }

        // Переключение сети
        async switchNetwork(chainId) {
            try {
                if (this.ethereumClient) {
                    await this.ethereumClient.switchNetwork({ chainId });
                    return true;
                } else if (window.ethereum) {
                    await window.ethereum.request({
                        method: 'wallet_switchEthereumChain',
                        params: [{ chainId: `0x${chainId.toString(16)}` }]
                    });
                    return true;
                }
                
                throw new Error("Нет доступных методов для переключения сети");
            } catch (error) {
                console.error("Ошибка при переключении сети:", error);
                throw error;
            }
        }

        // Генерация и отправка события
        _emitEvent(eventName, detail = {}) {
            const event = new CustomEvent(eventName, { 
                detail,
                bubbles: true,
                cancelable: true
            });
            
            document.dispatchEvent(event);
            console.log(`Событие ${eventName} отправлено:`, detail);
        }
    }

    // Создаем глобальный экземпляр WalletConnector
    window.WalletConnector = new WalletConnector();
})(); 