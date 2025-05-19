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
                
                // Check for WalletConnect modules from CDN
                const wcEthereumProvider = window.EthereumProvider || 
                                          window.W3m?.EthereumProvider || 
                                          window.WalletConnectEthereumProvider;
                
                const w3mStandalone = window.Web3ModalStandalone || 
                                     window.W3mStandalone;
                
                // Проверка на наличие требуемых провайдеров
                if (!wcEthereumProvider) {
                    console.error("EthereumProvider не найден");
                    throw new Error("EthereumProvider не загружен. Убедитесь, что скрипты загружены правильно.");
                }
                
                // Получаем конфигурацию сети
                const networkConfig = window.seismicConfig?.network || config.network;
                if (!networkConfig) {
                    throw new Error("Не указана конфигурация сети");
                }

                // ID проекта WalletConnect
                const projectId = config.projectId || window.seismicConfig?.walletConnect?.projectId || "a85ac05209955cfd18fbe7c0fd018f23";
                
                console.log("Инициализация EthereumProvider...");
                
                // Обернуть в try/catch для более детальной отладки
                try {
                    // Настройка ethereum provider через WalletConnect
                    const ethereumProviderInstance = await wcEthereumProvider.init({
                        projectId,
                        chains: [networkConfig.chainId],
                        showQrModal: true,
                        methods: ['eth_sendTransaction', 'personal_sign'],
                        events: ['chainChanged', 'accountsChanged', 'disconnect']
                    });
                    
                    // Сохраняем провайдер
                    this.ethereum = ethereumProviderInstance;
                    console.log("EthereumProvider успешно инициализирован:", this.ethereum);
                } catch (providerError) {
                    console.error("Ошибка при инициализации EthereumProvider:", providerError);
                    throw providerError;
                }
                
                console.log("Инициализация Web3Modal...");
                
                // Обернуть в try/catch для более детальной отладки
                try {
                    if (w3mStandalone && w3mStandalone.Web3Modal) {
                        // Создаем модальное окно Web3Modal
                        this.web3Modal = new w3mStandalone.Web3Modal({
                            projectId,
                            themeMode: 'dark',
                            walletConnectVersion: 2
                        });
                        console.log("Web3Modal успешно инициализирован:", this.web3Modal);
                    } else {
                        console.warn("Web3Modal не найден, используем только EthereumProvider");
                    }
                } catch (modalError) {
                    console.error("Ошибка при инициализации Web3Modal:", modalError);
                    console.warn("Продолжаем без Web3Modal, используя только EthereumProvider");
                }
                
                // Подписываемся на события провайдера
                this.ethereum.on('accountsChanged', (accounts) => {
                    if (accounts && accounts.length > 0) {
                        this.selectedAccount = accounts[0];
                        this._emitEvent('walletConnected', { account: this.selectedAccount });
                    } else {
                        this.selectedAccount = null;
                        this._emitEvent('walletDisconnected');
                    }
                });
                
                this.ethereum.on('chainChanged', (chainId) => {
                    this.chainId = chainId;
                    this._emitEvent('networkChanged', { chainId: this.chainId });
                });
                
                this.ethereum.on('disconnect', () => {
                    this.selectedAccount = null;
                    this.chainId = null;
                    this._emitEvent('walletDisconnected');
                });

                this.initialized = true;
                console.log("WalletConnect успешно инициализирован");
                return true;
            } catch (error) {
                console.error("Ошибка при инициализации WalletConnect:", error);
                throw error;
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

                // Используем WalletConnect провайдер
                if (this.ethereum) {
                    try {
                        await this.ethereum.enable();
                        const accounts = await this.ethereum.request({ method: 'eth_accounts' });
                        
                        if (accounts && accounts.length > 0) {
                            this.selectedAccount = accounts[0];
                            this.chainId = await this.ethereum.request({ method: 'eth_chainId' });
                            this._emitEvent('walletConnected', { account: this.selectedAccount });
                            this.isConnecting = false;
                            return true;
                        }
                    } catch (error) {
                        console.error("Ошибка при подключении через WalletConnect:", error);
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
                    // Отключаем WalletConnect провайдер
                    await this.ethereum.disconnect();
                    this.selectedAccount = null;
                    this._emitEvent('walletDisconnected');
                    return true;
                } else if (window.ethereum) {
                    // Для MetaMask и других кошельков просто сбрасываем состояние
                    this.selectedAccount = null;
                    this._emitEvent('walletDisconnected');
                    return true;
                }
                
                return false;
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