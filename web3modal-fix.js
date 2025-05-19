/**
 * web3modal-fix.js
 * Этот файл содержит исправления для проблем с подключением Web3Modal на Vercel
 * Основные проблемы:
 * 1. CORS блокировка для ESM модулей
 * 2. Конфликты с существующими провайдерами (ethereum getter)
 */

(function() {
    // Функция для создания безопасного провайдера Ethereum
    function createSafeProvider() {
        // Сохраняем оригинальный ethereum провайдер, если он есть
        const originalEthereum = window.ethereum;
        
        // Создаем прокси для безопасного доступа к ethereum
        let safeProvider = null;
        
        try {
            // Проверяем, существует ли ethereum и является ли он только getter
            if (originalEthereum && !window.hasOwnProperty('ethereum')) {
                // Создаем объект-прокси, который будет использовать существующий ethereum
                safeProvider = {
                    isMetaMask: originalEthereum.isMetaMask,
                    request: originalEthereum.request?.bind(originalEthereum),
                    enable: originalEthereum.enable?.bind(originalEthereum),
                    on: originalEthereum.on?.bind(originalEthereum),
                    removeListener: originalEthereum.removeListener?.bind(originalEthereum),
                    autoRefreshOnNetworkChange: false,
                    chainId: originalEthereum.chainId,
                    networkVersion: originalEthereum.networkVersion,
                    selectedAddress: originalEthereum.selectedAddress,
                    isConnected: originalEthereum.isConnected?.bind(originalEthereum) || function() { return true; }
                };
                
                // Сохраняем новый провайдер в window для доступа из других скриптов
                window.safeEthereumProvider = safeProvider;
                console.log("Создан безопасный Ethereum провайдер");
            } else {
                console.log("Стандартный ethereum провайдер доступен");
                safeProvider = originalEthereum;
            }
        } catch (error) {
            console.error("Ошибка при создании безопасного провайдера:", error);
        }
        
        return safeProvider;
    }
    
    // Функция для инициализации безопасных полифилов
    function initializePolyfills() {
        // Создаем безопасный провайдер
        const safeProvider = createSafeProvider();
        
        // Экспортируем в глобальный скоуп
        window.safeEthereumProvider = safeProvider;
        
        // Безопасные методы для взаимодействия с кошельком без конфликтов с window.ethereum
        window.SafeWallet = {
            // Запрос подключения кошелька
            async connect() {
                try {
                    if (safeProvider && safeProvider.request) {
                        const accounts = await safeProvider.request({ method: 'eth_requestAccounts' });
                        return accounts[0] || null;
                    } else if (window.ethereum && window.ethereum.request) {
                        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
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
                    if (safeProvider && safeProvider.request) {
                        const accounts = await safeProvider.request({ method: 'eth_accounts' });
                        return accounts.length > 0;
                    } else if (window.ethereum && window.ethereum.request) {
                        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
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
                    if (safeProvider && safeProvider.request) {
                        const accounts = await safeProvider.request({ method: 'eth_accounts' });
                        return accounts[0] || null;
                    } else if (window.ethereum && window.ethereum.request) {
                        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                        return accounts[0] || null;
                    }
                    return null;
                } catch (error) {
                    console.error("Ошибка получения адреса:", error);
                    return null;
                }
            },
            
            // Получение провайдера
            getProvider() {
                return safeProvider || window.ethereum || null;
            }
        };
        
        console.log("Web3Modal Fix: полифилы инициализированы");
    }
    
    // Запускаем инициализацию при загрузке страницы
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializePolyfills);
    } else {
        initializePolyfills();
    }
})(); 