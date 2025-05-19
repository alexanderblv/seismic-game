/**
 * wallet-connector.js - Простая реализация подключения кошелька через WalletConnect
 */

(function() {
    class WalletConnector {
        constructor() {
            this.web3Modal = null;
            this.ethereum = null;
            this.selectedAccount = null;
            this.chainId = null;
            this.initialized = false;
            this.isConnecting = false;
        }

        /**
         * Инициализация Web3Modal
         */
        async initialize(config = {}) {
            if (this.initialized) return true;

            try {
                console.log("Инициализация WalletConnect...");
                
                // Более детальная проверка доступности провайдеров
                console.log("Проверка WalletConnect провайдеров...");
                console.log("- EthereumProvider:", typeof window.EthereumProvider, window.EthereumProvider);
                console.log("- Web3ModalStandalone:", typeof window.Web3ModalStandalone, window.Web3ModalStandalone);
                console.log("- WalletConnectProvider:", typeof window.WalletConnectProvider, window.WalletConnectProvider);
                console.log("- Web3Modal:", typeof window.Web3Modal, window.Web3Modal);
                
                // Look for any available provider, in order of preference
                const providerClass = 
                    window.WalletConnectProvider || 
                    (window.WalletConnectProvider && window.WalletConnectProvider.default) ||
                    window.EthereumProvider ||
                    (window.EthereumProvider && window.EthereumProvider.default);
                    
                // Find Web3Modal or a compatible alternative
                const Web3ModalClass = 
                    window.Web3Modal || 
                    (window.Web3ModalStandalone && window.Web3ModalStandalone.Web3Modal);
                
                // Ensure we have the provider class
                if (!providerClass) {
                    console.error("No compatible WalletConnect provider found");
                    throw new Error("WalletConnect провайдер не найден. Переподключите страницу или используйте другой браузер.");
                }
                
                // Получаем конфигурацию сети
                const networkConfig = window.seismicConfig?.network || config.network;
                if (!networkConfig) {
                    throw new Error("Не указана конфигурация сети");
                }

                // ID проекта и Infura ID для WalletConnect v1
                const projectId = config.projectId || window.seismicConfig?.walletConnect?.projectId || "a85ac05209955cfd18fbe7c0fd018f23";
                const infuraId = config.infuraId || window.seismicConfig?.walletConnect?.infuraId || "9aa3d95b3bc440fa88ea12eaa4456161";
                
                // Provider configuration
                const providerConfig = {
                    infuraId: infuraId,
                    rpc: {
                        [networkConfig.chainId]: networkConfig.rpcUrl
                    },
                    chainId: networkConfig.chainId,
                    qrcode: true,
                    qrcodeModalOptions: {
                        mobileLinks: ["metamask", "trust", "rainbow", "coinbase", "imtoken"]
                    }
                };
                
                console.log("Создание WalletConnect провайдера...");
                
                try {
                    // Create a provider instance
                    const provider = typeof providerClass === 'function' ? 
                        new providerClass(providerConfig) : 
                        providerClass;
                    
                    // Store the provider
                    this.ethereum = provider;
                    console.log("WalletConnect провайдер создан:", this.ethereum);
                    
                    // If we have Web3Modal, initialize it as well
                    if (Web3ModalClass) {
                        console.log("Инициализация Web3Modal...");
                        
                        try {
                            // Создаем Web3Modal
                            this.web3Modal = new Web3ModalClass({
                                network: networkConfig.name.toLowerCase(),
                                cacheProvider: true,
                                providerOptions: {
                                    walletconnect: {
                                        package: providerClass,
                                        options: providerConfig
                                    }
                                },
                                theme: "dark"
                            });
                            
                            console.log("Web3Modal успешно инициализирован:", this.web3Modal);
                            
                            // Try to restore cached provider
                            if (this.web3Modal.cachedProvider) {
                                try {
                                    console.log("Найден кешированный провайдер, восстанавливаем");
                                    const cachedProvider = await this.web3Modal.connect();
                                    this.ethereum = cachedProvider;
                                    this.registerProviderEvents(cachedProvider);
                                } catch (e) {
                                    console.warn("Не удалось восстановить кешированный провайдер:", e);
                                }
                            }
                        } catch (modalError) {
                            console.error("Ошибка при инициализации Web3Modal:", modalError);
                            console.warn("Продолжаем без Web3Modal, используя только провайдер");
                        }
                    } else {
                        console.warn("Web3Modal не найден, используем только провайдер напрямую");
                    }
                    
                    // Register event listeners
                    this.registerProviderEvents(this.ethereum);
                    
                    this.initialized = true;
                    console.log("WalletConnect успешно инициализирован");
                    return true;
                } catch (error) {
                    console.error("Ошибка при создании WalletConnect провайдера:", error);
                    throw error;
                }
            } catch (error) {
                console.error("Ошибка при инициализации WalletConnect:", error);
                throw error;
            }
        }

        /**
         * Register event listeners for the provider
         */
        registerProviderEvents(provider) {
            if (!provider) return;
            
            try {
                // Handle different event registration patterns
                const registerMethod = (event, handler) => {
                    if (typeof provider.on === 'function') {
                        provider.on(event, handler);
                    } else if (provider.connector && typeof provider.connector.on === 'function') {
                        provider.connector.on(event, handler);
                    } else {
                        console.warn(`Provider doesn't support event: ${event}`);
                    }
                };
                
                // Subscribe to accounts change
                registerMethod("accountsChanged", (accounts) => {
                    console.log("accountsChanged event:", accounts);
                    if (accounts && accounts.length > 0) {
                        this.selectedAccount = accounts[0];
                        this._emitEvent('walletConnected', { account: this.selectedAccount });
                    } else {
                        this.selectedAccount = null;
                        this._emitEvent('walletDisconnected');
                    }
                });
                
                // Subscribe to chainId change
                registerMethod("chainChanged", (chainId) => {
                    console.log("chainChanged event:", chainId);
                    this.chainId = chainId;
                    this._emitEvent('networkChanged', { chainId: this.chainId });
                });
                
                // Subscribe to provider disconnection
                registerMethod("disconnect", (error) => {
                    console.log("disconnect event:", error);
                    this.selectedAccount = null;
                    this.chainId = null;
                    this._emitEvent('walletDisconnected');
                });
            } catch (e) {
                console.warn("Ошибка при регистрации обработчиков событий:", e);
            }
        }

        /**
         * Подключение кошелька
         */
        async connect() {
            if (this.isConnecting) {
                console.log("Процесс подключения уже запущен");
                return false;
            }
            
            try {
                this.isConnecting = true;
                
                // Инициализируем при необходимости
                if (!this.initialized) {
                    await this.initialize();
                }

                // Try Web3Modal first if available
                if (this.web3Modal) {
                    try {
                        console.log("Подключение через Web3Modal...");
                        const provider = await this.web3Modal.connect();
                        this.ethereum = provider;
                        
                        // Register events for the new provider
                        this.registerProviderEvents(provider);
                        
                        // Get selected account
                        let accounts;
                        
                        // Different provider implementations have different methods
                        if (typeof provider.request === 'function') {
                            accounts = await provider.request({ method: 'eth_accounts' });
                        } else if (typeof provider.enable === 'function') {
                            accounts = await provider.enable();
                        } else if (provider.accounts) {
                            accounts = provider.accounts;
                        }
                        
                        if (accounts && accounts.length > 0) {
                            this.selectedAccount = accounts[0];
                            
                            try {
                                if (typeof provider.request === 'function') {
                                    this.chainId = await provider.request({ method: 'eth_chainId' });
                                } else if (provider.chainId) {
                                    this.chainId = provider.chainId;
                                }
                            } catch (e) {
                                console.warn("Не удалось получить chainId:", e);
                            }
                            
                            this._emitEvent('walletConnected', { account: this.selectedAccount });
                            this.isConnecting = false;
                            return true;
                        }
                    } catch (error) {
                        console.error("Ошибка при подключении через Web3Modal:", error);
                        // Continue to try direct provider connection
                    }
                }
                
                // If Web3Modal fails or isn't available, try direct provider connection
                if (this.ethereum) {
                    try {
                        console.log("Прямое подключение к провайдеру...");
                        let accounts;
                        
                        // Try different methods to get accounts
                        if (typeof this.ethereum.enable === 'function') {
                            accounts = await this.ethereum.enable();
                        } else if (typeof this.ethereum.request === 'function') {
                            accounts = await this.ethereum.request({ method: 'eth_requestAccounts' });
                        } else if (this.ethereum.accounts) {
                            accounts = this.ethereum.accounts;
                        }
                        
                        if (accounts && accounts.length > 0) {
                            this.selectedAccount = accounts[0];
                            this._emitEvent('walletConnected', { account: this.selectedAccount });
                            this.isConnecting = false;
                            return true;
                        }
                    } catch (error) {
                        console.error("Ошибка при прямом подключении к провайдеру:", error);
                        throw error;
                    }
                }
                
                throw new Error("Не удалось подключить кошелек. Попробуйте установить MetaMask или другой кошелек.");
            } catch (error) {
                console.error("Ошибка при подключении кошелька:", error);
                this.isConnecting = false;
                throw error;
            }
        }

        /**
         * Отключение кошелька
         */
        async disconnect() {
            try {
                if (this.ethereum) {
                    // If we have an active provider
                    if (typeof this.ethereum.disconnect === 'function') {
                        // Use disconnect method if available
                        await this.ethereum.disconnect();
                    } else if (typeof this.ethereum.close === 'function') {
                        // Try using close method as fallback
                        await this.ethereum.close();
                    }
                    
                    this.ethereum = null;
                }
                
                // Clear Web3Modal cached provider if available
                if (this.web3Modal && typeof this.web3Modal.clearCachedProvider === 'function') {
                    this.web3Modal.clearCachedProvider();
                }
                
                // Reset state
                this.selectedAccount = null;
                this.chainId = null;
                
                // Emit disconnected event
                this._emitEvent('walletDisconnected');
                
                return true;
            } catch (error) {
                console.error("Ошибка при отключении кошелька:", error);
                throw error;
            }
        }

        /**
         * Проверка подключения кошелька
         */
        isConnected() {
            return !!this.selectedAccount;
        }

        /**
         * Получение адреса подключенного кошелька
         */
        getSelectedAccount() {
            return this.selectedAccount;
        }

        /**
         * Получение провайдера
         */
        getProvider() {
            return this.ethereum || window.ethereum || null;
        }

        /**
         * Вспомогательный метод для отправки кастомных событий
         */
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