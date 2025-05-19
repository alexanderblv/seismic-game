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
                // Проверяем доступность Web3Modal или используем SafeWallet
                let useWeb3Modal = false;
                
                // Проверка на Web3Modal библиотеки
                if ((window.W3M && window.W3M.EthereumClient) || 
                    (window.Web3ModalEthereum && window.Web3ModalEthereum.EthereumClient)) {
                    useWeb3Modal = true;
                }
                
                // Если Web3Modal недоступен, используем SafeWallet
                if (!useWeb3Modal) {
                    if (window.SafeWallet) {
                        console.log("Используем SafeWallet для подключения");
                        this.provider = window.SafeWallet.getProvider();
                        
                        // Проверяем, подключен ли уже кошелек
                        const isConnected = await window.SafeWallet.isConnected();
                        if (isConnected) {
                            this.selectedAccount = await window.SafeWallet.getAddress();
                            if (this.selectedAccount) {
                                this._emitEvent('accountChanged', { account: this.selectedAccount });
                            }
                        }
                        
                        this.initialized = true;
                        console.log("SafeWallet инициализирован успешно");
                        return true;
                    }
                    
                    // Если нет ни Web3Modal, ни SafeWallet, пробуем напрямую через window.ethereum
                    if (window.ethereum) {
                        console.log("Используем прямое подключение через window.ethereum");
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
                    
                    console.warn("Web3Modal не загружен, используем базовое подключение");
                    this.initialized = true;
                    return true;
                }
                
                // Если доступны библиотеки Web3Modal, используем их
                const EthereumClient = window.W3M?.EthereumClient || window.Web3ModalEthereum?.EthereumClient;
                const w3mConnectors = window.W3M?.w3mConnectors || window.Web3ModalEthereum?.w3mConnectors;
                const w3mProvider = window.W3M?.w3mProvider || window.Web3ModalEthereum?.w3mProvider;
                const Web3Modal = window.W3M_HTML?.Web3Modal || window.Web3ModalHtml?.Web3Modal;

                if (!Web3Modal || !EthereumClient) {
                    throw new Error("Web3Modal не загружен");
                }

                // Получаем конфигурацию сети из seismicConfig или используем предоставленную конфигурацию
                const networkConfig = window.seismicConfig && window.seismicConfig.network 
                    ? window.seismicConfig.network
                    : config.network;

                // Настройка проекта Web3Modal
                const projectId = config.projectId || window.seismicConfig?.walletConnect?.projectId || "a85ac05209955cfd18fbe7c0fd018f23";

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
                try {
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
                } catch (error) {
                    console.error("Ошибка при настройке Web3Modal:", error);
                    
                    // Fallback на SafeWallet или прямое подключение
                    if (window.SafeWallet) {
                        console.log("Fallback на SafeWallet");
                        this.provider = window.SafeWallet.getProvider();
                        const isConnected = await window.SafeWallet.isConnected();
                        if (isConnected) {
                            this.selectedAccount = await window.SafeWallet.getAddress();
                        }
                    } else if (window.ethereum) {
                        console.log("Fallback на window.ethereum");
                        this.provider = window.ethereum;
                        try {
                            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                            if (accounts.length > 0) {
                                this.selectedAccount = accounts[0];
                            }
                        } catch (e) {
                            console.warn("Ошибка при получении аккаунтов:", e);
                        }
                    }
                }

                this.initialized = true;
                console.log("Web3Modal инициализирован успешно");
                return true;
            } catch (error) {
                console.error("Ошибка инициализации Web3Modal:", error);
                
                // Fallback на SafeWallet или window.ethereum
                if (window.SafeWallet) {
                    console.log("Fallback на SafeWallet после ошибки");
                    this.provider = window.SafeWallet.getProvider();
                    this.initialized = true;
                    return true;
                } else if (window.ethereum) {
                    console.log("Fallback на ethereum после ошибки");
                    this.provider = window.ethereum; 
                    this.initialized = true;
                    return true;
                }
                
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
                
                // Если есть SafeWallet, используем его
                if (window.SafeWallet) {
                    const address = await window.SafeWallet.connect();
                    if (address) {
                        this.selectedAccount = address;
                        this._emitEvent('walletConnected', { account: address });
                        this.isConnecting = false;
                        return true;
                    }
                    // Если не удалось подключиться через SafeWallet, продолжаем с Web3Modal
                }
                
                // Если провайдер напрямую доступен через window.ethereum
                if (!this.web3Modal && window.ethereum) {
                    try {
                        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                        if (accounts.length > 0) {
                            this.selectedAccount = accounts[0];
                            this._emitEvent('walletConnected', { account: accounts[0] });
                            this.isConnecting = false;
                            return true;
                        }
                    } catch (error) {
                        console.error("Ошибка прямого подключения кошелька:", error);
                    }
                }
                
                // Открываем модальное окно выбора кошелька через Web3Modal
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
                
                this.isConnecting = false;
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
                // Если есть SafeWallet
                if (window.SafeWallet && this.selectedAccount) {
                    this.selectedAccount = null;
                    this.provider = null;
                    this._emitEvent('walletDisconnected');
                    return true;
                }
                
                // Если есть Web3Modal
                if (this.web3Modal && this.selectedAccount) {
                    try {
                        await this.web3Modal.wagmiConfig.disconnect();
                    } catch (error) {
                        console.warn("Ошибка при отключении через Web3Modal:", error);
                    }
                    this.selectedAccount = null;
                    this.provider = null;
                    this._emitEvent('walletDisconnected');
                    return true;
                }
                
                // Если использовался прямой провайдер
                if (this.selectedAccount) {
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
                try {
                    return this.web3Modal.wagmiConfig.getPublicClient();
                } catch (e) {
                    console.warn("Ошибка получения publicClient:", e);
                }
            }
            
            // Fallback на провайдеры
            return this.provider || 
                   window.safeEthereumProvider || 
                   (window.SafeWallet ? window.SafeWallet.getProvider() : null) || 
                   window.ethereum;
        }

        // Запрос смены сети
        async switchNetwork(chainId) {
            try {
                if (this.web3Modal && this.selectedAccount) {
                    try {
                        await this.web3Modal.wagmiConfig.switchNetwork(chainId);
                        return true;
                    } catch (e) {
                        console.warn("Ошибка смены сети через Web3Modal:", e);
                    }
                }
                
                // Fallback на прямой запрос
                if (this.provider && this.provider.request) {
                    await this.provider.request({
                        method: 'wallet_switchEthereumChain',
                        params: [{ chainId: '0x' + chainId.toString(16) }]
                    });
                    return true;
                } else if (window.ethereum) {
                    await window.ethereum.request({
                        method: 'wallet_switchEthereumChain',
                        params: [{ chainId: '0x' + chainId.toString(16) }]
                    });
                    return true;
                }
                
                throw new Error("Провайдер не поддерживает смену сети");
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