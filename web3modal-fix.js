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
            const ethereumDescriptor = Object.getOwnPropertyDescriptor(window, 'ethereum');
            const isEthereumGetter = ethereumDescriptor && ethereumDescriptor.get && !ethereumDescriptor.set;
            
            if (originalEthereum && isEthereumGetter) {
                console.log("Обнаружен ethereum только с getter, создаем прокси");
                
                // Патчим Object.defineProperty чтобы игнорировать попытки установить ethereum
                const originalDefineProperty = Object.defineProperty;
                Object.defineProperty = function(obj, prop, descriptor) {
                    // Если это попытка установить window.ethereum, игнорируем
                    if (obj === window && prop === 'ethereum') {
                        console.log("Попытка переопределить window.ethereum - предотвращено");
                        return obj;
                    }
                    return originalDefineProperty.call(this, obj, prop, descriptor);
                };
                
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
                
                // Заменим getter для ethereum на наш сейфер
                try {
                    // Создаем новый геттер, который будет возвращать наш сейфер
                    Object.defineProperty(window, '_safeEthereumProxy', {
                        value: safeProvider,
                        writable: false,
                        configurable: true
                    });
                    
                    // Глобальная переменная для отслеживания попыток установки
                    window.__ethereumSetAttempts = 0;
                    
                    // Вместо прямой замены ethereum, мы добавим специальную обработку
                    if (!window.__ethereumPatched) {
                        window.__ethereumPatched = true;
                        console.log("Применяем патч для ethereum конфликтов");
                    }
                } catch (e) {
                    console.error("Ошибка при патче ethereum:", e);
                }
                
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
        
        // Перехват скриптов, пытающихся установить ethereum
        const originalAppendChild = Node.prototype.appendChild;
        Node.prototype.appendChild = function(child) {
            if (child.tagName === 'SCRIPT') {
                // Модифицируем скрипт для патча конфликтующих функций
                const originalOnload = child.onload;
                child.onload = function() {
                    // Проверяем, есть ли проблемные скрипты inpage.js или requestProvider.js
                    if (child.src && (child.src.includes('inpage.js') || child.src.includes('requestProvider.js'))) {
                        console.log("Обнаружен проблемный скрипт, применяем патч:", child.src);
                        
                        // Сбрасываем Object.defineProperty к оригинальной версии
                        if (window.__originalDefineProperty) {
                            Object.defineProperty = window.__originalDefineProperty;
                        }
                    }
                    
                    // Вызываем оригинальный onload
                    if (originalOnload) {
                        originalOnload.call(this);
                    }
                };
            }
            return originalAppendChild.call(this, child);
        };
        
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