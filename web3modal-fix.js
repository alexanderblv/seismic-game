/**
 * web3modal-fix.js
 * Модуль для преодоления CORS-блокировок Web3Modal и конфликтов с существующими провайдерами Ethereum
 */

(function() {
    // Предотвратить повторную инициализацию
    if (window.__web3ModalFixInitialized) return;
    window.__web3ModalFixInitialized = true;
    
    console.log("Инициализация Web3Modal Fix...");
    
    /**
     * Функция для проверки и загрузки зависимостей Web3Modal
     */
    async function loadWeb3ModalDependencies() {
        try {
            // Проверяем есть ли уже загруженные библиотеки
            if (
                window.W3M || 
                window.Web3ModalEthereum || 
                window.W3M_HTML || 
                window.Web3ModalHtml
            ) {
                console.log("Web3Modal зависимости уже загружены");
                return true;
            }
            
            // Загружаем библиотеки если их нет
            const ethereumScript = document.createElement('script');
            ethereumScript.src = 'https://unpkg.com/@web3modal/ethereum@2.7.1/dist/cdn.js';
            ethereumScript.async = true;
            
            const htmlScript = document.createElement('script');
            htmlScript.src = 'https://unpkg.com/@web3modal/html@2.7.1/dist/cdn.js';
            htmlScript.async = true;
            
            // Ждем загрузки обеих библиотек
            const loadEthereum = new Promise((resolve, reject) => {
                ethereumScript.onload = resolve;
                ethereumScript.onerror = () => reject(new Error("Не удалось загрузить @web3modal/ethereum"));
            });
            
            const loadHtml = new Promise((resolve, reject) => {
                htmlScript.onload = resolve;
                htmlScript.onerror = () => reject(new Error("Не удалось загрузить @web3modal/html"));
            });
            
            // Добавляем скрипты в DOM
            document.head.appendChild(ethereumScript);
            document.head.appendChild(htmlScript);
            
            // Ждем загрузки обоих скриптов
            await Promise.all([loadEthereum, loadHtml]);
            console.log("Web3Modal зависимости успешно загружены");
            return true;
        } catch (error) {
            console.error("Ошибка при загрузке Web3Modal зависимостей:", error);
            return false;
        }
    }
    
    /**
     * Функция для создания безопасного провайдера Ethereum
     * Защищает от конфликтов с существующими провайдерами
     */
    function createSafeProvider() {
        // Сохраняем оригинальный ethereum провайдер, если он есть
        const originalEthereum = window.ethereum;
        
        // Если провайдера нет, то нечего патчить
        if (!originalEthereum) return null;
        
        try {
            // Проверяем, является ли ethereum геттером (как в MetaMask)
            const ethereumDescriptor = Object.getOwnPropertyDescriptor(window, 'ethereum');
            const isEthereumGetter = ethereumDescriptor && ethereumDescriptor.get && !ethereumDescriptor.set;
            
            // Если это геттер, создаем прокси-объект, который будет корректно работать
            if (isEthereumGetter) {
                console.log("Обнаружен ethereum как getter, создаем прокси");
                
                const safeProvider = {
                    isMetaMask: originalEthereum.isMetaMask,
                    isTrust: originalEthereum.isTrust,
                    isTokenPocket: originalEthereum.isTokenPocket,
                    isCoinbaseWallet: originalEthereum.isCoinbaseWallet,
                    isWalletConnect: originalEthereum.isWalletConnect,
                    
                    // Проксируем базовые методы
                    request: function(args) {
                        return originalEthereum.request(args);
                    },
                    
                    enable: function() {
                        return originalEthereum.enable ? originalEthereum.enable() : 
                               originalEthereum.request({ method: 'eth_requestAccounts' });
                    },
                    
                    // События
                    on: function(eventName, listener) {
                        if (typeof originalEthereum.on === 'function') {
                            return originalEthereum.on(eventName, listener);
                        }
                    },
                    
                    removeListener: function(eventName, listener) {
                        if (typeof originalEthereum.removeListener === 'function') {
                            return originalEthereum.removeListener(eventName, listener);
                        }
                    },
                    
                    // Вспомогательные свойства
                    chainId: originalEthereum.chainId,
                    networkVersion: originalEthereum.networkVersion,
                    selectedAddress: originalEthereum.selectedAddress,
                    
                    // Метод isConnected
                    isConnected: function() {
                        return typeof originalEthereum.isConnected === 'function' 
                               ? originalEthereum.isConnected() 
                               : !!originalEthereum.selectedAddress;
                    }
                };
                
                // Сохраняем провайдер для использования в будущем
                window.__safeEthereumProvider = safeProvider;
                return safeProvider;
            }
            
            // Если это не геттер, просто используем оригинальный провайдер
            return originalEthereum;
        } catch (error) {
            console.error("Ошибка при создании безопасного провайдера:", error);
            return originalEthereum;
        }
    }
    
    /**
     * Патчит метод window.ethereum.request для работы с Promise
     */
    function patchEthereumRequest() {
        // Если ethereum не существует, нечего патчить
        if (!window.ethereum || typeof window.ethereum.request === 'function') return;
        
        // Если request не существует, но есть enable или send
        if (typeof window.ethereum.enable === 'function') {
            console.log("Патчим ethereum.request через enable");
            
            // Создаем новую функцию request
            window.ethereum.request = async function(args) {
                if (args.method === 'eth_requestAccounts') {
                    return window.ethereum.enable();
                }
                
                // Используем старый метод send, если он есть
                if (typeof window.ethereum.send === 'function') {
                    return new Promise((resolve, reject) => {
                        window.ethereum.send(args.method, args.params || [], (error, response) => {
                            if (error) reject(error);
                            else resolve(response.result);
                        });
                    });
                }
                
                throw new Error(`Метод ${args.method} не поддерживается`);
            };
        }
    }
    
    /**
     * Создает глобальный объект для удобной работы с Ethereum
     */
    function createEthereumHelper() {
        // Получаем провайдера
        const provider = window.__safeEthereumProvider || window.ethereum;
        
        // Если провайдера нет, то нечего делать
        if (!provider) {
            console.warn("Ethereum провайдер не найден");
            return;
        }
        
        // Создаем глобальный хелпер для работы с кошельком
        window.EthereumHelper = {
            // Запрос подключения кошелька
            async connect() {
                try {
                    if (provider && provider.request) {
                        const accounts = await provider.request({ method: 'eth_requestAccounts' });
                        return accounts[0] || null;
                    }
                    return null;
                } catch (error) {
                    console.error("Ошибка подключения кошелька:", error);
                    return null;
                }
            },
            
            // Проверка подключения
            async isConnected() {
                try {
                    if (provider && provider.request) {
                        const accounts = await provider.request({ method: 'eth_accounts' });
                        return accounts.length > 0;
                    }
                    return false;
                } catch (error) {
                    console.error("Ошибка проверки подключения:", error);
                    return false;
                }
            },
            
            // Получение адреса аккаунта
            async getAddress() {
                try {
                    if (provider && provider.request) {
                        const accounts = await provider.request({ method: 'eth_accounts' });
                        return accounts[0] || null;
                    }
                    return null;
                } catch (error) {
                    console.error("Ошибка получения адреса:", error);
                    return null;
                }
            },
            
            // Получение текущей сети
            async getChainId() {
                try {
                    if (provider && provider.request) {
                        const chainId = await provider.request({ method: 'eth_chainId' });
                        return chainId ? parseInt(chainId, 16) : null;
                    }
                    return null;
                } catch (error) {
                    console.error("Ошибка получения chainId:", error);
                    return null;
                }
            },
            
            // Получение баланса
            async getBalance(address) {
                try {
                    if (provider && provider.request) {
                        const balance = await provider.request({ 
                            method: 'eth_getBalance',
                            params: [address || await this.getAddress(), 'latest']
                        });
                        return balance ? parseInt(balance, 16) : null;
                    }
                    return null;
                } catch (error) {
                    console.error("Ошибка получения баланса:", error);
                    return null;
                }
            },
            
            // Получение провайдера
            getProvider() {
                return provider;
            }
        };
        
        console.log("Ethereum Helper инициализирован");
    }
    
    /**
     * Основная функция инициализации
     */
    async function initialize() {
        // Создаем безопасный провайдер
        const safeProvider = createSafeProvider();
        if (safeProvider) {
            window.__safeEthereumProvider = safeProvider;
        }
        
        // Патчим ethereum.request при необходимости
        patchEthereumRequest();
        
        // Создаем хелпер
        createEthereumHelper();
        
        // Загружаем зависимости Web3Modal
        try {
            await loadWeb3ModalDependencies();
        } catch (error) {
            console.error("Не удалось загрузить Web3Modal:", error);
        }
        
        console.log("Web3Modal Fix: инициализация завершена");
    }
    
    // Инициализируем при загрузке страницы
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
})(); 