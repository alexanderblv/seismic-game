// Модуль для работы с Seismic SDK
(function() {
    // Импортируем конфигурацию
    const config = typeof seismicConfig !== 'undefined' ? seismicConfig : 
                  (typeof require !== 'undefined' ? require('./seismic-config') : {});
    
    // Класс для работы с Seismic
    class SeismicSDK {
        constructor() {
            this.config = config;
            this.provider = null;
            this.signer = null;
            this.web3 = null;
            this.isInitialized = false;
            this.wallet = null;
            this.connectionInProgress = false; // Флаг для отслеживания процесса подключения
            this.web3Modal = null; // Web3Modal инстанс
        }
        
        // Инициализация SDK
        async initialize() {
            try {
                if (this.isInitialized) {
                    return true; // Если уже инициализирован, просто возвращаем true
                }
                
                // Инициализируем Web3Modal если он доступен
                if (typeof Web3Modal !== 'undefined') {
                    const providerOptions = this._getProviderOptions();
                    
                    this.web3Modal = new Web3Modal({
                        cacheProvider: true, // Запоминаем последний выбранный провайдер
                        providerOptions: providerOptions,
                        theme: "dark",
                        disableInjectedProvider: false, // Разрешаем встроенные провайдеры (MetaMask и др.)
                        // Настройка пользовательского интерфейса Web3Modal
                        themeVariables: {
                            '--w3m-background-color': '#1a1e23',
                            '--w3m-accent-color': '#3B82F6',
                            '--w3m-text-color': '#ffffff'
                        },
                        // Логотип и название приложения
                        network: this.config.network.name,
                        description: "Подключите свой кошелек для отправки транзакций через Seismic",
                        showQrModal: true // Показываем QR-код для WalletConnect
                    });
                    
                    // Если есть кешированный провайдер, пробуем подключиться автоматически
                    if (this.web3Modal.cachedProvider) {
                        await this._connectWithWeb3Modal();
                    }
                }
                
                if (typeof ethers !== 'undefined') {
                    // Создаем провайдер для подключения к Seismic Devnet
                    if (!this.provider) {
                        this.provider = new ethers.providers.JsonRpcProvider(this.config.network.rpcUrl);
                    }
                    
                    console.log("Seismic SDK инициализирован");
                    this.isInitialized = true;
                    return true;
                } else if (typeof Web3 !== 'undefined') {
                    // Альтернативный вариант с Web3
                    this.web3 = new Web3(this.config.network.rpcUrl);
                    console.log("Seismic SDK инициализирован через Web3");
                    this.isInitialized = true;
                    return true;
                } else {
                    console.error("Для работы SDK необходим ethers.js или web3.js");
                    return false;
                }
            } catch (error) {
                console.error("Ошибка инициализации Seismic SDK:", error);
                return false;
            }
        }
        
        // Получить опции провайдеров для Web3Modal
        _getProviderOptions() {
            const providerOptions = {};
            
            // Добавляем WalletConnect если он доступен
            if (typeof WalletConnectProvider !== 'undefined') {
                providerOptions.walletconnect = {
                    package: WalletConnectProvider,
                    options: {
                        rpc: {
                            [this.config.network.chainId]: this.config.network.rpcUrl
                        },
                        chainId: this.config.network.chainId
                    }
                };
            }
            
            // Добавляем Coinbase Wallet если он доступен
            if (typeof CoinbaseWalletSDK !== 'undefined') {
                providerOptions.coinbasewallet = {
                    package: CoinbaseWalletSDK,
                    options: {
                        appName: "Seismic Transaction Sender",
                        rpc: this.config.network.rpcUrl,
                        chainId: this.config.network.chainId
                    }
                };
            }
            
            // Добавляем Fortmatic если он доступен
            if (typeof Fortmatic !== 'undefined') {
                providerOptions.fortmatic = {
                    package: Fortmatic,
                    options: {
                        key: "pk_test_" // В продакшене нужен настоящий ключ
                    }
                };
            }
            
            // Добавляем Torus если он доступен
            if (typeof Torus !== 'undefined') {
                providerOptions.torus = {
                    package: Torus
                };
            }
            
            // Добавляем Trust Wallet если он доступен
            if (typeof TrustWalletConnector !== 'undefined') {
                providerOptions.trust = {
                    package: TrustWalletConnector,
                    options: {
                        rpc: {
                            [this.config.network.chainId]: this.config.network.rpcUrl
                        },
                        chainId: this.config.network.chainId
                    }
                };
            }
            
            // Поддержка Ledger Live если он доступен
            if (typeof LedgerConnectProvider !== 'undefined') {
                providerOptions.ledger = {
                    package: LedgerConnectProvider
                };
            }
            
            return providerOptions;
        }
        
        // Подключение с использованием Web3Modal
        async _connectWithWeb3Modal() {
            try {
                const provider = await this.web3Modal.connect();
                
                // Сохраняем тип провайдера для отображения пользователю
                this.providerType = this._detectProviderType(provider);
                console.log(`Подключен кошелек типа: ${this.providerType}`);
                
                // Настраиваем обработчики событий провайдера
                provider.on("accountsChanged", (accounts) => {
                    console.log("Аккаунт сменился:", accounts);
                    if (accounts.length === 0) {
                        // Пользователь отключился
                        this.wallet = null;
                        window.location.reload();
                    } else if (this.wallet && this.wallet.address !== accounts[0]) {
                        // Пользователь сменил аккаунт
                        this.completeConnection(accounts[0]);
                    }
                });
                
                provider.on("chainChanged", (chainId) => {
                    console.log("Сеть изменилась:", chainId);
                    // Проверяем, изменилась ли сеть на нашу целевую
                    const chainIdNum = parseInt(chainId, 16);
                    if (chainIdNum === this.config.network.chainId) {
                        console.log("Сеть изменена на нужную, обновляем соединение");
                        this._refreshConnection();
                    } else {
                        // Перезагружаем страницу при смене сети
                        window.location.reload();
                    }
                });
                
                provider.on("disconnect", (error) => {
                    console.log("Отключен от кошелька:", error);
                    // Пользователь отключился
                    this.wallet = null;
                    this.web3Modal.clearCachedProvider();
                    window.location.reload();
                });
                
                // Используем ethers.js для работы с провайдером
                this.provider = new ethers.providers.Web3Provider(provider);
                
                // Получаем адрес пользователя
                const accounts = await this.provider.listAccounts();
                
                if (accounts.length === 0) {
                    throw new Error("Не найдено ни одного аккаунта");
                }
                
                return await this.completeConnection(accounts[0]);
            } catch (error) {
                console.error("Ошибка при подключении через Web3Modal:", error);
                throw error;
            }
        }
        
        // Определение типа провайдера кошелька
        _detectProviderType(provider) {
            if (provider.isMetaMask) {
                return "MetaMask";
            } else if (provider.isCoinbaseWallet) {
                return "Coinbase Wallet";
            } else if (provider.isWalletConnect) {
                return "WalletConnect";
            } else if (provider.isTrust) {
                return "Trust Wallet";
            } else if (provider.isLedger) {
                return "Ledger";
            } else if (provider.isTorus) {
                return "Torus";
            } else if (provider.isFortmatic) {
                return "Fortmatic";
            } else if (provider.isPortis) {
                return "Portis";
            } else {
                return "Unknown Wallet";
            }
        }
        
        // Обновление соединения при смене сети
        async _refreshConnection() {
            if (!this.wallet) return;
            
            try {
                // Обновляем сеть
                this.wallet.network = await this.provider.getNetwork();
                
                // Обновляем подписчика
                this.signer = this.provider.getSigner();
                this.wallet.signer = this.signer;
                
                console.log("Соединение обновлено для сети:", this.wallet.network.name);
            } catch (error) {
                console.error("Ошибка обновления соединения:", error);
            }
        }
        
        // Подключение кошелька
        async connect() {
            try {
                // Если подключение уже идет, ждем его завершения
                if (this.connectionInProgress) {
                    console.log("Подключение уже в процессе, ожидаем завершения...");
                    await new Promise(resolve => {
                        const checkInterval = setInterval(() => {
                            if (!this.connectionInProgress) {
                                clearInterval(checkInterval);
                                resolve();
                            }
                        }, 100);
                    });
                    
                    // Если кошелек уже подключен после ожидания, возвращаем его
                    if (this.wallet) {
                        console.log("Кошелек уже подключен:", this.wallet.address);
                        return this.wallet;
                    }
                }
                
                // Устанавливаем флаг, что подключение началось
                this.connectionInProgress = true;
                
                if (!this.isInitialized) {
                    await this.initialize();
                }
                
                // Если кошелек уже подключен, просто возвращаем его
                if (this.wallet) {
                    // Проверяем, что аккаунт не сменился
                    if (window.ethereum && window.ethereum.selectedAddress && 
                        window.ethereum.selectedAddress.toLowerCase() === this.wallet.address.toLowerCase()) {
                        console.log("Используем существующее подключение кошелька:", this.wallet.address);
                        this.connectionInProgress = false;
                        return this.wallet;
                    }
                }
                
                // Если есть Web3Modal, используем его для подключения
                if (this.web3Modal) {
                    return await this._connectWithWeb3Modal();
                } else if (window.ethereum) {
                    // Запрашиваем доступ к кошельку пользователя (MetaMask и др.)
                    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                    
                    // Проверяем, получили ли мы адреса
                    if (!accounts || accounts.length === 0) {
                        throw new Error("Не удалось получить адреса аккаунтов");
                    }
                    
                    // Финализируем подключение
                    const address = accounts[0];
                    return await this.completeConnection(address);
                    
                } else {
                    this.connectionInProgress = false;
                    throw new Error("Web3 провайдер не обнаружен. Установите MetaMask или другой кошелек.");
                }
            } catch (error) {
                this.connectionInProgress = false;
                console.error("Ошибка подключения кошелька:", error);
                throw error;
            }
        }
        
        // Отключение кошелька
        async disconnect() {
            if (this.web3Modal) {
                this.web3Modal.clearCachedProvider();
            }
            
            this.wallet = null;
            this.provider = new ethers.providers.JsonRpcProvider(this.config.network.rpcUrl);
            
            return true;
        }
        
        // Завершение подключения кошелька по известному адресу
        async completeConnection(address) {
            try {
                if (!this.isInitialized) {
                    await this.initialize();
                }
                
                // Проверяем, если кошелек уже подключен с тем же адресом
                if (this.wallet && this.wallet.address.toLowerCase() === address.toLowerCase()) {
                    console.log("Кошелек уже подключен с этим адресом:", address);
                    return this.wallet;
                }
                
                // Если не используем Web3Modal, подключаем провайдер напрямую
                if (!this.web3Modal && window.ethereum) {
                    this.provider = new ethers.providers.Web3Provider(window.ethereum);
                    this.providerType = "MetaMask или другой инжектированный провайдер";
                }
                
                // Проверяем, что пользователь подключен к нужной сети
                const network = await this.provider.getNetwork();
                if (network.chainId !== this.config.network.chainId) {
                    try {
                        const provider = this.provider.provider;
                        
                        // Проверяем, является ли провайдер WalletConnect, который использует другой метод
                        if (provider.isWalletConnect) {
                            console.log("Используем WalletConnect, просим пользователя сменить сеть вручную");
                            throw new Error(`Пожалуйста, смените сеть в вашем кошельке на ${this.config.network.name} (Chain ID: ${this.config.network.chainId})`);
                        }
                        
                        // Пробуем переключить сеть
                        await provider.request({
                            method: 'wallet_switchEthereumChain',
                            params: [{ chainId: '0x' + this.config.network.chainId.toString(16) }]
                        });
                        
                        // Обновляем провайдер после переключения
                        if (!this.web3Modal) {
                            this.provider = new ethers.providers.Web3Provider(window.ethereum);
                        }
                    } catch (switchError) {
                        // Если сеть не добавлена, предлагаем добавить
                        if (switchError.code === 4902) {
                            try {
                                const provider = this.provider.provider;
                                await provider.request({
                                    method: 'wallet_addEthereumChain',
                                    params: [{
                                        chainId: '0x' + this.config.network.chainId.toString(16),
                                        chainName: this.config.network.name,
                                        nativeCurrency: {
                                            name: 'Ethereum',
                                            symbol: this.config.network.symbol,
                                            decimals: 18
                                        },
                                        rpcUrls: [this.config.network.rpcUrl],
                                        blockExplorerUrls: [this.config.network.explorer]
                                    }]
                                });
                                
                                // Обновляем провайдер после добавления сети
                                if (!this.web3Modal) {
                                    this.provider = new ethers.providers.Web3Provider(window.ethereum);
                                }
                            } catch (addError) {
                                console.error("Ошибка добавления сети:", addError);
                                throw new Error(`Не удалось добавить сеть ${this.config.network.name}. Пожалуйста, добавьте её вручную.`);
                            }
                        } else {
                            console.error("Ошибка переключения сети:", switchError);
                            throw new Error(`Пожалуйста, переключитесь на сеть ${this.config.network.name} (Chain ID: ${this.config.network.chainId}) в вашем кошельке.`);
                        }
                    }
                }
                
                // Получаем подписчика для отправки транзакций
                this.signer = this.provider.getSigner();
                
                // Создаем объект кошелька
                this.wallet = {
                    address: address,
                    provider: this.provider,
                    signer: this.signer,
                    network: await this.provider.getNetwork(),
                    walletType: this.providerType || "Unknown Wallet",
                    connected: true,
                    connectedAt: new Date()
                };
                
                console.log("Кошелек подключен:", address);
                console.log("Тип кошелька:", this.wallet.walletType);
                return this.wallet;
            } catch (error) {
                console.error("Ошибка завершения подключения кошелька:", error);
                throw error;
            } finally {
                this.connectionInProgress = false;
            }
        }
        
        // Шифрование данных для отправки в Seismic
        async encrypt(type, value) {
            try {
                if (!this.isInitialized) {
                    await this.initialize();
                }
                
                // В реальном SDK здесь было бы реальное шифрование
                // Сейчас мы просто имитируем этот процесс для демонстрации
                
                // Имитация задержки операции шифрования
                await new Promise(resolve => setTimeout(resolve, 500));
                
                // Генерируем "зашифрованные" данные
                let encryptedValue;
                switch (type) {
                    case 'suint':
                        // Имитация шифрования числа
                        encryptedValue = "0x" + Array.from({length: 20}, () => 
                            Math.floor(Math.random() * 16).toString(16)).join('');
                        break;
                        
                    case 'saddress':
                        // Имитация шифрования адреса
                        encryptedValue = "0x" + Array.from({length: 40}, () => 
                            Math.floor(Math.random() * 16).toString(16)).join('');
                        break;
                        
                    case 'sbool':
                        // Имитация шифрования булевого значения
                        encryptedValue = "0x" + Array.from({length: 4}, () => 
                            Math.floor(Math.random() * 16).toString(16)).join('');
                        break;
                        
                    default:
                        throw new Error(`Неподдерживаемый тип данных: ${type}`);
                }
                
                // Возвращаем результат шифрования с метаданными
                return {
                    type: type,
                    originalValue: value,
                    encryptedValue: encryptedValue,
                    timestamp: Date.now()
                };
            } catch (error) {
                console.error("Ошибка шифрования данных:", error);
                throw error;
            }
        }
        
        // Отправка транзакции в Seismic Devnet
        async sendTransaction(data) {
            try {
                console.log("Начало отправки транзакции с данными:", data);
                
                // Проверяем подключение к кошельку
                if (!this.wallet) {
                    throw new Error("Кошелек не подключен. Сначала подключите кошелек.");
                }
                
                const address = this.wallet.address;
                console.log("Адрес отправителя:", address);
                
                // Вместо использования демо-контракта с неверной контрольной суммой,
                // отправляем небольшое количество эфира на адрес пользователя
                // Адрес получателя - это адрес самого пользователя
                const recipientAddress = data.to || address;
                
                // Создаем транзакцию - без поля data для обычного адреса
                const tx = {
                    to: recipientAddress,
                    value: data.value || ethers.utils.parseEther("0.0001"), // Отправляем минимальное количество эфира
                    gasLimit: ethers.utils.hexlify(100000) // Устанавливаем лимит газа для транзакции
                };
                
                // Сохраняем данные в консоль для демонстрации (в реальном приложении они были бы в data)
                console.log("Зашифрованные данные транзакции (не отправляются):", JSON.stringify(data));
                
                // Отправляем транзакцию
                const transaction = await this.wallet.signer.sendTransaction(tx);
                console.log("Транзакция отправлена:", transaction.hash);
                
                // Ожидаем подтверждения транзакции
                console.log("Ожидание подтверждения транзакции...");
                const receipt = await transaction.wait();
                console.log("Транзакция подтверждена в блоке", receipt.blockNumber);
                
                return transaction;
            } catch (error) {
                console.error("Ошибка отправки транзакции:", error);
                throw error;
            }
        }
        
        // Получение баланса адреса
        async getBalance(address) {
            try {
                if (!this.isInitialized) {
                    await this.initialize();
                }
                
                if (!address && this.wallet) {
                    address = this.wallet.address;
                }
                
                if (!address) {
                    throw new Error("Адрес не указан");
                }
                
                const balance = await this.provider.getBalance(address);
                console.log("Баланс:", ethers.utils.formatEther(balance), "ETH");
                
                return balance;
            } catch (error) {
                console.error("Ошибка получения баланса:", error);
                throw error;
            }
        }
    }
    
    // Экспортируем класс SeismicSDK в глобальное пространство имен
    window.SeismicSDK = SeismicSDK;
})(); 