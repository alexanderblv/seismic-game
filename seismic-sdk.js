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
                
                if (typeof ethers !== 'undefined') {
                    // Создаем провайдер для подключения к Seismic Devnet
                    this.provider = new ethers.providers.JsonRpcProvider(this.config.network.rpcUrl);
                    
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
                
                if (window.ethereum) {
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
                    throw new Error("MetaMask или другой провайдер Ethereum не обнаружен");
                }
            } catch (error) {
                this.connectionInProgress = false;
                console.error("Ошибка подключения кошелька:", error);
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
                
                // Подключаем провайдер к MetaMask
                this.provider = new ethers.providers.Web3Provider(window.ethereum);
                
                // Проверяем, что пользователь подключен к нужной сети
                const network = await this.provider.getNetwork();
                if (network.chainId !== this.config.network.chainId) {
                    try {
                        await window.ethereum.request({
                            method: 'wallet_switchEthereumChain',
                            params: [{ chainId: '0x' + this.config.network.chainId.toString(16) }]
                        });
                        
                        // Обновляем провайдер после переключения
                        this.provider = new ethers.providers.Web3Provider(window.ethereum);
                    } catch (switchError) {
                        // Если сеть не добавлена, предлагаем добавить
                        if (switchError.code === 4902) {
                            await window.ethereum.request({
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
                            this.provider = new ethers.providers.Web3Provider(window.ethereum);
                        } else {
                            throw switchError;
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
                    network: await this.provider.getNetwork()
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
                
                if (!window.ethereum) {
                    throw new Error("MetaMask не обнаружен. Пожалуйста, установите MetaMask для взаимодействия с блокчейном.");
                }
                
                // Используем сохраненный wallet объект для согласованности
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