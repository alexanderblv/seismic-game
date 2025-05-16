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
                    
                    // Initialize Onboard.js
                    if (window.OnboardService) {
                        await window.OnboardService.initialize(this.config.network);
                        console.log("Onboard.js initialized in Seismic SDK");
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
                    this.connectionInProgress = false;
                    return this.wallet;
                }
                
                // Use Onboard.js for wallet connection if available
                if (window.OnboardService) {
                    try {
                        const wallet = await window.OnboardService.connectWallet();
                        
                        if (wallet) {
                            // Update SDK wallet with Onboard wallet info
                            return await this.completeConnection(wallet.address);
                        } else {
                            throw new Error("No wallet connected through Onboard.js");
                        }
                    } catch (error) {
                        console.error("Ошибка при подключении через Onboard.js:", error);
                        // Fall back to MetaMask
                        if (window.ethereum) {
                            // Request access to the user's wallet (MetaMask etc.)
                            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                            
                            // Check if we got addresses
                            if (!accounts || accounts.length === 0) {
                                throw new Error("Не удалось получить адреса аккаунтов");
                            }
                            
                            // Complete the connection
                            const address = accounts[0];
                            return await this.completeConnection(address);
                        } else {
                            throw new Error("No Web3 wallet provider found");
                        }
                    }
                } else if (window.ethereum) {
                    // Fallback to regular connection if Onboard not available
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
                
                // If we're using Onboard.js and have an active wallet, use it directly
                if (window.OnboardService && window.OnboardService.wallet) {
                    const onboardWallet = window.OnboardService.getWallet();
                    if (onboardWallet && onboardWallet.address.toLowerCase() === address.toLowerCase()) {
                        this.provider = onboardWallet.provider;
                        this.signer = onboardWallet.signer;
                        
                        // Create wallet object
                        this.wallet = {
                            address: address,
                            provider: this.provider,
                            signer: this.signer,
                            network: await this.provider.getNetwork(),
                            label: onboardWallet.label
                        };
                        
                        console.log("Wallet connected via Onboard.js:", address);
                        return this.wallet;
                    }
                }
                
                // Fallback to MetaMask connection
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
                const encryptedValue = `0x${Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
                
                return {
                    type: type,
                    value: value,
                    encrypted: encryptedValue
                };
            } catch (error) {
                console.error("Ошибка при шифровании данных:", error);
                throw error;
            }
        }
        
        // Отправка транзакции через Seismic
        async sendTransaction(data) {
            try {
                if (!this.wallet || !this.signer) {
                    throw new Error("Кошелек не подключен");
                }
                
                // Подготавливаем транзакцию
                const tx = {
                    to: data.to,
                    value: data.value
                };
                
                // Отправляем транзакцию
                const transaction = await this.signer.sendTransaction(tx);
                
                // Ждем подтверждения транзакции
                console.log("Транзакция отправлена:", transaction.hash);
                
                return transaction;
            } catch (error) {
                console.error("Ошибка при отправке транзакции:", error);
                throw error;
            }
        }
        
        // Получение баланса
        async getBalance(address) {
            try {
                if (!this.isInitialized) {
                    await this.initialize();
                }
                
                if (!address) {
                    throw new Error("Не указан адрес для проверки баланса");
                }
                
                // Используем ethers.js для получения баланса
                if (this.provider) {
                    const balance = await this.provider.getBalance(address);
                    return balance;
                } else if (this.web3) {
                    // Альтернативный вариант с Web3
                    const balance = await this.web3.eth.getBalance(address);
                    return balance;
                } else {
                    throw new Error("Провайдер не инициализирован");
                }
            } catch (error) {
                console.error("Ошибка при получении баланса:", error);
                throw error;
            }
        }
    }
    
    // Экспортируем класс SeismicSDK в глобальное пространство имен
    window.SeismicSDK = SeismicSDK;
})(); 