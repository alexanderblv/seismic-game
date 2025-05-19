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
                
                // Check for WalletConnect providers (v1 format)
                const WalletConnectProvider = window.WalletConnectProvider || window.EthereumProvider;
                const Web3Modal = window.Web3Modal || (window.Web3ModalStandalone ? window.Web3ModalStandalone.Web3Modal : null);
                
                // Ensure we have the providers
                if (!WalletConnectProvider) {
                    console.error("WalletConnectProvider не найден");
                    throw new Error("WalletConnectProvider не загружен. Убедитесь, что скрипты загружены правильно.");
                }
                
                if (!Web3Modal) {
                    console.error("Web3Modal не найден");
                    throw new Error("Web3Modal не загружен. Убедитесь, что скрипты загружены правильно.");
                }
                
                // Получаем конфигурацию сети
                const networkConfig = window.seismicConfig?.network || config.network;
                if (!networkConfig) {
                    throw new Error("Не указана конфигурация сети");
                }

                // ID проекта WalletConnect
                const projectId = config.projectId || window.seismicConfig?.walletConnect?.projectId || "a85ac05209955cfd18fbe7c0fd018f23";
                const infuraId = config.infuraId || window.seismicConfig?.walletConnect?.infuraId || "your-infura-id";
                
                console.log("Инициализация Web3Modal...");
                
                try {
                    // Create WalletConnect Provider options
                    const providerOptions = {
                        walletconnect: {
                            package: WalletConnectProvider,
                            options: {
                                infuraId: infuraId,
                                rpc: {
                                    [networkConfig.chainId]: networkConfig.rpcUrl
                                },
                                chainId: networkConfig.chainId
                            }
                        }
                    };
                
                    // Создаем Web3Modal
                    this.web3Modal = new Web3Modal({
                        network: networkConfig.name.toLowerCase(),
                        cacheProvider: true,
                        providerOptions: providerOptions,
                        theme: "dark"
                    });
                    
                    console.log("Web3Modal успешно инициализирован:", this.web3Modal);
                    
                    // Try to retrieve the cached provider
                    if (this.web3Modal.cachedProvider) {
                        console.log("Найден кешированный провайдер:", this.web3Modal.cachedProvider);
                        const provider = await this.web3Modal.connect();
                        this.ethereum = provider;
                        
                        // Subscribe to provider events
                        this.registerProviderEvents(provider);
                        
                        console.log("Восстановлена сессия из кешированного провайдера");
                    }
                } catch (modalError) {
                    console.error("Ошибка при инициализации Web3Modal:", modalError);
                    throw modalError;
                }

                this.initialized = true;
                console.log("WalletConnect успешно инициализирован");
                return true;
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
            
            // Subscribe to accounts change
            provider.on("accountsChanged", (accounts) => {
                if (accounts && accounts.length > 0) {
                    this.selectedAccount = accounts[0];
                    this._emitEvent('walletConnected', { account: this.selectedAccount });
                } else {
                    this.selectedAccount = null;
                    this._emitEvent('walletDisconnected');
                }
            });
            
            // Subscribe to chainId change
            provider.on("chainChanged", (chainId) => {
                this.chainId = chainId;
                this._emitEvent('networkChanged', { chainId: this.chainId });
            });
            
            // Subscribe to provider disconnection
            provider.on("disconnect", (error) => {
                this.selectedAccount = null;
                this.chainId = null;
                this._emitEvent('walletDisconnected');
            });
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

                // Connect using Web3Modal
                if (this.web3Modal) {
                    try {
                        console.log("Открываем модальное окно Web3Modal...");
                        const provider = await this.web3Modal.connect();
                        this.ethereum = provider;
                        
                        // Subscribe to provider events
                        this.registerProviderEvents(provider);
                        
                        // Get selected account
                        const accounts = await provider.request({ method: 'eth_accounts' });
                        if (accounts && accounts.length > 0) {
                            this.selectedAccount = accounts[0];
                            this.chainId = await provider.request({ method: 'eth_chainId' });
                            
                            this._emitEvent('walletConnected', { account: this.selectedAccount });
                            this.isConnecting = false;
                            return true;
                        }
                    } catch (error) {
                        console.error("Ошибка при подключении через Web3Modal:", error);
                        throw error;
                    }
                }
                
                // Если WalletConnect не сработал, проверяем window.ethereum
                if (window.ethereum) {
                    try {
                        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                        if (accounts && accounts.length > 0) {
                            this.selectedAccount = accounts[0];
                            this._emitEvent('walletConnected', { account: this.selectedAccount });
                            this.isConnecting = false;
                            return true;
                        }
                    } catch (error) {
                        console.error("Ошибка при подключении через window.ethereum:", error);
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