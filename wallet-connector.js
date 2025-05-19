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
                
                // Получаем конфигурацию сети
                const networkConfig = window.seismicConfig?.network || config.network;
                if (!networkConfig) {
                    throw new Error("Не указана конфигурация сети");
                }

                // ID проекта WalletConnect
                const projectId = config.projectId || window.seismicConfig?.walletConnect?.projectId || "a85ac05209955cfd18fbe7c0fd018f23";
                
                // Создаем клиент WalletConnect
                this.web3Modal = window.Web3Modal.createWeb3Modal({
                    projectId,
                    themeMode: "dark",
                    themeVariables: {
                        "--w3m-font-family": "system-ui, sans-serif",
                        "--w3m-accent-color": "#3B82F6",
                        "--w3m-background-color": "#000000",
                        "--w3m-container-border-radius": "8px",
                        "--w3m-wallet-icon-border-radius": "8px"
                    },
                    explorerRecommendedWalletIds: "NONE",
                    // Определяем порядок кошельков как на скриншоте
                    featuredWalletIds: [
                        "ecc4036f814562b41a5268adc86270fba1365471402006302e70169465b7ac18", // WalletConnect
                        "dceb063851b1833cbb209e3717a0a0b06bf3fb500fe9db8cd3a553e4b1d02137", // Rabby
                        "ef333840daf915aafdc4a004525502d6d49d77bd9c65e0642dbaefb3c2893bef", // Trust Wallet
                        "c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96", // MetaMask
                        "4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0", // Coinbase
                    ],
                    // Включаем кнопку "Все кошельки"
                    includeWalletIds: "ALL",
                    // Включаем QR код для WalletConnect
                    enableWalletConnect: true,
                    // Определяем цепи для подключения
                    chains: [{
                        id: networkConfig.chainId,
                        name: networkConfig.name || "Seismic Network",
                        rpcUrl: networkConfig.rpcUrl
                    }],
                    // Используем Web3Modal версии 3
                    version: "3"
                });
                
                // Подписываемся на события WalletConnect
                window.Web3Modal.subscribeEvents((event) => {
                    if (event.name === "ACCOUNT_CONNECTED") {
                        this.selectedAccount = event.data.address;
                        this.chainId = event.data.chainId;
                        this._emitEvent('walletConnected', { account: this.selectedAccount });
                    } 
                    else if (event.name === "ACCOUNT_DISCONNECTED") {
                        this.selectedAccount = null;
                        this.chainId = null;
                        this._emitEvent('walletDisconnected');
                    }
                    else if (event.name === "CHAIN_CHANGED") {
                        this.chainId = event.data.chainId;
                        this._emitEvent('networkChanged', { chainId: this.chainId });
                    }
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

                // Открываем модальное окно WalletConnect
                if (this.web3Modal) {
                    this.web3Modal.open();
                    
                    // Мы просто открываем модальное окно и ждем события подключения
                    return new Promise((resolve) => {
                        // Функция для проверки подключения каждые 500мс
                        const interval = setInterval(() => {
                            if (this.selectedAccount) {
                                clearInterval(interval);
                                this.isConnecting = false;
                                resolve(true);
                            }
                        }, 500);
                        
                        // Если модальное окно закрылось
                        const modalCloseListener = () => {
                            clearInterval(interval);
                            this.isConnecting = false;
                            resolve(!!this.selectedAccount);
                        };
                        
                        // Удаляем слушатель через 15 секунд (если не произошло подключение)
                        setTimeout(() => {
                            document.removeEventListener('w3m-modal-close', modalCloseListener);
                            clearInterval(interval);
                            this.isConnecting = false;
                            resolve(!!this.selectedAccount);
                        }, 15000);
                        
                        // Добавляем слушатель на закрытие модального окна
                        document.addEventListener('w3m-modal-close', modalCloseListener, { once: true });
                    });
                }
                
                // Если Web3Modal не инициализирован, пробуем использовать window.ethereum
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
                if (this.web3Modal) {
                    // Отключаем кошелек через WalletConnect
                    await window.Web3Modal.disconnect();
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
            return window.ethereum || null;
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