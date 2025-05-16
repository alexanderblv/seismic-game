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
        }
        
        // Инициализация SDK
        async initialize() {
            try {
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
                if (!this.isInitialized) {
                    await this.initialize();
                }
                
                if (window.ethereum) {
                    // Запрашиваем доступ к кошельку пользователя (MetaMask и др.)
                    await window.ethereum.request({ method: 'eth_requestAccounts' });
                    
                    // Подключаем провайдер к MetaMask
                    const provider = new ethers.providers.Web3Provider(window.ethereum);
                    
                    // Проверяем, что пользователь подключен к нужной сети
                    const network = await provider.getNetwork();
                    if (network.chainId !== this.config.network.chainId) {
                        // Если сеть неправильная, предлагаем переключиться
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
                    
                    // Получаем адрес кошелька
                    const address = await this.signer.getAddress();
                    
                    // Создаем объект кошелька
                    this.wallet = {
                        address: address,
                        provider: this.provider,
                        signer: this.signer,
                        network: await this.provider.getNetwork()
                    };
                    
                    console.log("Кошелек подключен:", address);
                    return this.wallet;
                } else {
                    throw new Error("MetaMask или другой провайдер Ethereum не обнаружен");
                }
            } catch (error) {
                console.error("Ошибка подключения кошелька:", error);
                throw error;
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
                
                const provider = new ethers.providers.Web3Provider(window.ethereum);
                const signer = provider.getSigner();
                const address = await signer.getAddress();
                
                console.log("Адрес отправителя:", address);
                
                // Вместо использования демо-контракта с неверной контрольной суммой,
                // отправляем небольшое количество эфира на адрес пользователя
                // Адрес получателя - это адрес самого пользователя
                const recipientAddress = address;
                
                // Создаем транзакцию - без поля data для обычного адреса
                const tx = {
                    to: recipientAddress,
                    value: ethers.utils.parseEther("0.0001"), // Отправляем минимальное количество эфира
                    gasLimit: ethers.utils.hexlify(100000) // Устанавливаем лимит газа для транзакции
                };
                
                // Сохраняем данные в консоль для демонстрации (в реальном приложении они были бы в data)
                console.log("Зашифрованные данные транзакции (не отправляются):", JSON.stringify(data));
                
                console.log("Подготовленная транзакция:", tx);
                
                // Отправляем транзакцию
                const transaction = await signer.sendTransaction(tx);
                console.log("Транзакция отправлена:", transaction.hash);
                
                // Ожидаем подтверждения транзакции (1 подтверждение)
                const receipt = await transaction.wait(1);
                console.log("Транзакция подтверждена:", receipt);
                
                return receipt;
            } catch (error) {
                console.error("Ошибка при отправке транзакции:", error);
                console.log("Подробная информация об ошибке:", error.message);
                if (error.code) console.log("Код ошибки:", error.code);
                if (error.reason) console.log("Причина ошибки:", error.reason);
                throw error;
            }
        }
        
        // Получение баланса кошелька
        async getBalance(address) {
            try {
                if (!this.isInitialized) {
                    await this.initialize();
                }
                
                const targetAddress = address || (this.wallet ? this.wallet.address : null);
                if (!targetAddress) {
                    throw new Error("Адрес не указан и кошелек не подключен");
                }
                
                const balance = await this.provider.getBalance(targetAddress);
                return ethers.utils.formatEther(balance);
            } catch (error) {
                console.error("Ошибка получения баланса:", error);
                throw error;
            }
        }
    }
    
    // Создаем экземпляр SDK и экспортируем его
    const seismicSDK = new SeismicSDK();
    
    // Делаем SDK доступным глобально
    if (typeof window !== 'undefined') {
        window.seismicSDK = seismicSDK;
    }
    
    // Для использования как модуля Node.js
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = seismicSDK;
    }
})(); 