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
        }
        
        // Инициализация SDK
        async initialize() {
            try {
                if (this.isInitialized) {
                    return true; // Если уже инициализирован, просто возвращаем true
                }
                
                // Проверяем инициализирован ли WalletConnector
                if (typeof window.WalletConnector === 'undefined') {
                    console.error("WalletConnector не найден. Убедитесь, что wallet-connector.js подключен до seismic-sdk.js");
                }
                
                // Проверяем есть ли у нас уже подключенный кошелек через WalletConnector
                const account = window.WalletConnector?.getSelectedAccount();
                const web3Instance = window.WalletConnector?.getWeb3();
                
                if (account && web3Instance) {
                    console.log("Найден подключенный кошелек через WalletConnector:", account);
                    
                    // Используем провайдер из WalletConnector
                    this.provider = new ethers.providers.Web3Provider(web3Instance.currentProvider);
                    this.signer = this.provider.getSigner();
                    
                    // Создаем объект wallet
                    this.wallet = {
                        address: account,
                        provider: this.provider,
                        signer: this.signer,
                        network: await this.provider.getNetwork(),
                        connected: true
                    };
                    
                    console.log("SDK инициализирован с существующим подключением к кошельку");
                } else {
                    // Создаем провайдер для подключения к Seismic Devnet
                    this.provider = new ethers.providers.JsonRpcProvider(this.config.network.rpcUrl);
                    console.log("SDK инициализирован с RPC провайдером");
                }
                
                this.isInitialized = true;
                
                // Устанавливаем обработчики событий WalletConnector
                this._setupWalletConnectorListeners();
                
                return true;
            } catch (error) {
                console.error("Ошибка инициализации Seismic SDK:", error);
                return false;
            }
        }
        
        // Устанавливаем слушатели событий от WalletConnector
        _setupWalletConnectorListeners() {
            // Слушаем событие успешного подключения кошелька
            document.addEventListener('walletConnected', async (event) => {
                const { account, provider } = event.detail;
                console.log("SDK: Получено событие walletConnected, аккаунт:", account);
                
                // Обновляем провайдер и кошелек в SDK
                this.provider = new ethers.providers.Web3Provider(provider);
                this.signer = this.provider.getSigner();
                
                // Создаем объект wallet
                this.wallet = {
                    address: account,
                    provider: this.provider,
                    signer: this.signer,
                    network: await this.provider.getNetwork(),
                    connected: true
                };
                
                console.log("SDK: Кошелек обновлен после подключения");
            });
            
            // Слушаем событие отключения кошелька
            document.addEventListener('walletDisconnected', () => {
                console.log("SDK: Получено событие walletDisconnected");
                
                // Сбрасываем кошелек в SDK
                this.wallet = null;
                this.signer = null;
                
                // Возвращаемся к RPC провайдеру
                this.provider = new ethers.providers.JsonRpcProvider(this.config.network.rpcUrl);
                
                console.log("SDK: Кошелек сброшен после отключения");
            });
            
            // Слушаем событие смены аккаунта
            document.addEventListener('accountChanged', async (event) => {
                const { account } = event.detail;
                console.log("SDK: Получено событие accountChanged, новый аккаунт:", account);
                
                if (!this.wallet) return;
                
                // Обновляем адрес в объекте wallet
                this.wallet.address = account;
                this.signer = this.provider.getSigner();
                this.wallet.signer = this.signer;
                
                console.log("SDK: Кошелек обновлен после смены аккаунта");
            });
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
                    console.log("Используем существующее подключение кошелька:", this.wallet.address);
                    this.connectionInProgress = false;
                    return this.wallet;
                }
                
                // Используем WalletConnector для подключения кошелька
                if (typeof window.WalletConnector !== 'undefined') {
                    // Запускаем подключение через WalletConnector
                    await window.WalletConnector.connect();
                    
                    // Получаем аккаунт из WalletConnector
                    const account = window.WalletConnector.getSelectedAccount();
                    
                    if (!account) {
                        throw new Error("Не удалось получить адрес аккаунта");
                    }
                    
                    // Завершаем подключение с полученным адресом
                    return await this.completeConnection(account);
                } else {
                    this.connectionInProgress = false;
                    throw new Error("WalletConnector не найден. Убедитесь, что wallet-connector.js подключен.");
                }
            } catch (error) {
                this.connectionInProgress = false;
                console.error("Ошибка подключения кошелька:", error);
                throw error;
            }
        }
        
        // Отключение кошелька
        async disconnect() {
            try {
                // Используем WalletConnector для отключения
                if (typeof window.WalletConnector !== 'undefined') {
                    await window.WalletConnector.disconnect();
                }
                
                // Сбрасываем wallet в SDK
                this.wallet = null;
                this.signer = null;
                
                // Возвращаемся к RPC провайдеру
                this.provider = new ethers.providers.JsonRpcProvider(this.config.network.rpcUrl);
                
                return true;
            } catch (error) {
                console.error("Ошибка отключения кошелька:", error);
                throw error;
            }
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
                
                // Используем провайдер из WalletConnector
                if (typeof window.WalletConnector !== 'undefined') {
                    const web3Instance = window.WalletConnector.getWeb3();
                    if (web3Instance) {
                        this.provider = new ethers.providers.Web3Provider(web3Instance.currentProvider);
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
                    connected: true
                };
                
                console.log("Кошелек подключен:", address);
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