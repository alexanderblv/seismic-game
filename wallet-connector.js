// Простая и надежная реализация подключения кошельков через Web3Modal
(function() {
    // Содержит инстанс Web3Modal
    let web3Modal;
    
    // Содержит выбранный провайдер и интерфейс Web3
    let provider;
    let web3;
    let selectedAccount;
    
    // Настройка UI элементов
    const connectButton = document.getElementById('connect-wallet');
    const walletAddress = document.getElementById('wallet-address');
    const networkBadge = document.getElementById('network-badge');
    const connectionStatus = document.getElementById('connection-status');
    
    // Инициализирует Web3Modal при загрузке
    async function init() {
        console.log("Инициализация Web3Modal");
        
        try {
            // Проверяем доступность Web3Modal
            if (typeof Web3Modal === 'undefined') {
                console.error("Web3Modal не найден. Убедитесь, что библиотека подключена.");
                return;
            }
            
            // Настраиваем доступные провайдеры
            const providerOptions = getProviderOptions();
            console.log("Доступные провайдеры:", Object.keys(providerOptions));
            
            // Создаем экземпляр Web3Modal
            web3Modal = new Web3Modal({
                cacheProvider: true, // Запоминаем выбор пользователя
                providerOptions: providerOptions,
                disableInjectedProvider: false, // Важно: не отключать инжектированные провайдеры
                theme: "dark",
            });
            
            console.log("Web3Modal инициализирован:", web3Modal);
            
            // Если есть кешированный провайдер, подключаемся автоматически
            if (web3Modal.cachedProvider) {
                console.log("Обнаружен кешированный провайдер:", web3Modal.cachedProvider);
                connect();
            }
        } catch (error) {
            console.error("Ошибка инициализации Web3Modal:", error);
        }
    }
    
    // Получает конфигурацию доступных провайдеров
    function getProviderOptions() {
        const providerOptions = {};
        
        // WalletConnect
        if (typeof WalletConnectProvider !== 'undefined') {
            console.log("WalletConnectProvider доступен, добавляем его в options");
            providerOptions.walletconnect = {
                package: WalletConnectProvider,
                options: {
                    infuraId: "27e484dcd9e3efcfd25a83a78777cdf1", // Используем публичный ключ
                    rpc: {
                        5124: "https://node-2.seismicdev.net/rpc"
                    },
                    chainId: 5124
                }
            };
        } else {
            console.warn("WalletConnectProvider недоступен");
        }
        
        // Coinbase Wallet
        if (typeof CoinbaseWalletSDK !== 'undefined') {
            console.log("CoinbaseWalletSDK доступен, добавляем его в options");
            providerOptions.coinbasewallet = {
                package: CoinbaseWalletSDK,
                options: {
                    appName: "Seismic Transaction Sender",
                    rpc: "https://node-2.seismicdev.net/rpc",
                    chainId: 5124
                }
            };
        } else {
            console.warn("CoinbaseWalletSDK недоступен");
        }
        
        // Fortmatic
        if (typeof Fortmatic !== 'undefined') {
            console.log("Fortmatic доступен, добавляем его в options");
            providerOptions.fortmatic = {
                package: Fortmatic,
                options: {
                    key: "pk_test_391E26A3B43A3350"
                }
            };
        } else {
            console.warn("Fortmatic недоступен");
        }
        
        return providerOptions;
    }
    
    // Функция подключения кошелька
    async function connect() {
        console.log("Запуск подключения к кошельку");
        try {
            provider = await web3Modal.connect();
            console.log("Провайдер подключен:", provider);
            
            // Создаем экземпляр Web3 с полученным провайдером
            web3 = new Web3(provider);
            console.log("Web3 инициализирован:", web3);
            
            // Получаем список аккаунтов
            const accounts = await web3.eth.getAccounts();
            console.log("Доступные аккаунты:", accounts);
            
            if (accounts.length === 0) {
                console.error("Аккаунты не найдены");
                return;
            }
            
            selectedAccount = accounts[0];
            console.log("Выбран аккаунт:", selectedAccount);
            
            // Обновляем интерфейс
            updateUI();
            
            // Подписываемся на события провайдера
            setupProviderEvents();
            
            // Отправляем событие подключения
            const connectEvent = new CustomEvent('walletConnected', { 
                detail: { 
                    account: selectedAccount,
                    provider: provider,
                    web3: web3
                } 
            });
            document.dispatchEvent(connectEvent);
            
        } catch (error) {
            console.error("Ошибка подключения кошелька:", error);
        }
    }
    
    // Функция отключения кошелька
    async function disconnect() {
        console.log("Отключение кошелька");
        
        // Если провайдер поддерживает метод отключения
        if (provider && provider.close) {
            try {
                await provider.close();
                console.log("Провайдер закрыт");
            } catch (e) {
                console.error("Ошибка закрытия провайдера:", e);
            }
        }
        
        // Очищаем кеш провайдера
        await web3Modal.clearCachedProvider();
        console.log("Кеш провайдера очищен");
        
        // Сбрасываем переменные
        provider = null;
        web3 = null;
        selectedAccount = null;
        
        // Обновляем интерфейс
        updateUIDisconnected();
        
        // Отправляем событие отключения
        document.dispatchEvent(new Event('walletDisconnected'));
    }
    
    // Настройка обработчиков событий для провайдера
    function setupProviderEvents() {
        if (!provider || !provider.on) {
            console.warn("Провайдер не поддерживает события");
            return;
        }
        
        // Обработка смены аккаунта
        provider.on("accountsChanged", (accounts) => {
            console.log("Аккаунты изменены:", accounts);
            if (accounts.length === 0) {
                // Если аккаунты пусты, пользователь отключился
                disconnect();
            } else {
                // Обновляем выбранный аккаунт
                selectedAccount = accounts[0];
                updateUI();
                
                // Отправляем событие изменения аккаунта
                const event = new CustomEvent('accountChanged', { 
                    detail: { account: selectedAccount } 
                });
                document.dispatchEvent(event);
            }
        });
        
        // Обработка смены сети
        provider.on("chainChanged", (chainId) => {
            console.log("Сеть изменена:", chainId);
            // Обновляем UI с новой информацией о сети
            updateNetworkInfo();
            
            // Отправляем событие смены сети
            const event = new CustomEvent('networkChanged', { 
                detail: { chainId: chainId } 
            });
            document.dispatchEvent(event);
        });
        
        // Обработка отключения
        provider.on("disconnect", (error) => {
            console.log("Провайдер отключен:", error);
            disconnect();
        });
    }
    
    // Обновление интерфейса при подключении
    async function updateUI() {
        if (!selectedAccount) return;
        
        try {
            // Показываем адрес кошелька
            const shortAddress = `${selectedAccount.substring(0, 6)}...${selectedAccount.substring(selectedAccount.length - 4)}`;
            
            // Определяем тип кошелька и добавляем соответствующую иконку
            let walletIcon = '';
            const providerName = getProviderName();
            
            switch (providerName) {
                case 'MetaMask':
                    walletIcon = '<i class="bi bi-browser-chrome text-warning me-1" title="MetaMask"></i>';
                    break;
                case 'Coinbase':
                    walletIcon = '<i class="bi bi-currency-bitcoin text-primary me-1" title="Coinbase Wallet"></i>';
                    break;
                case 'WalletConnect':
                    walletIcon = '<i class="bi bi-phone text-info me-1" title="WalletConnect"></i>';
                    break;
                default:
                    walletIcon = '<i class="bi bi-wallet2 me-1" title="Web3 Wallet"></i>';
            }
            
            // Обновляем адрес с иконкой
            walletAddress.innerHTML = walletIcon + shortAddress;
            walletAddress.classList.remove('d-none');
            
            // Обновляем кнопку на "Отключить"
            connectButton.innerHTML = '<i class="bi bi-wallet2"></i> Disconnect';
            connectButton.classList.remove('btn-primary');
            connectButton.classList.add('btn-danger');
            connectButton.onclick = disconnect;
            
            // Обновляем статус подключения
            connectionStatus.textContent = 'Connected';
            connectionStatus.classList.remove('bg-secondary');
            connectionStatus.classList.add('bg-success');
            
            // Обновляем информацию о сети
            updateNetworkInfo();
            
        } catch (error) {
            console.error("Ошибка обновления UI:", error);
        }
    }
    
    // Обновление интерфейса при отключении
    function updateUIDisconnected() {
        // Сбрасываем кнопку на исходное состояние
        connectButton.innerHTML = '<i class="bi bi-wallet2"></i> Connect Wallet';
        connectButton.classList.remove('btn-danger');
        connectButton.classList.add('btn-primary');
        connectButton.onclick = connect;
        
        // Скрываем адрес
        walletAddress.textContent = 'Connect your wallet';
        walletAddress.classList.add('d-none');
        
        // Обновляем статус подключения
        connectionStatus.textContent = 'Not Connected';
        connectionStatus.classList.remove('bg-success');
        connectionStatus.classList.add('bg-secondary');
        
        // Обновляем badge сети
        networkBadge.textContent = 'Not Connected';
        networkBadge.classList.remove('bg-success');
        networkBadge.classList.add('bg-secondary');
    }
    
    // Обновление информации о сети
    async function updateNetworkInfo() {
        if (!web3) return;
        
        try {
            // Получаем ID сети
            const chainId = await web3.eth.getChainId();
            console.log("Текущий chainId:", chainId);
            
            // Определяем название сети
            let networkName;
            if (chainId === 5124) {
                networkName = "Seismic devnet";
                networkBadge.classList.remove('bg-secondary', 'bg-warning');
                networkBadge.classList.add('bg-success');
            } else {
                networkName = `Chain ID: ${chainId}`;
                networkBadge.classList.remove('bg-secondary', 'bg-success');
                networkBadge.classList.add('bg-warning');
            }
            
            networkBadge.textContent = networkName;
        } catch (error) {
            console.error("Ошибка получения информации о сети:", error);
            networkBadge.textContent = 'Error';
            networkBadge.classList.remove('bg-success', 'bg-secondary');
            networkBadge.classList.add('bg-danger');
        }
    }
    
    // Определение типа провайдера
    function getProviderName() {
        if (!provider) return 'Unknown';
        
        if (provider.isMetaMask) {
            return 'MetaMask';
        } else if (provider.isCoinbaseWallet) {
            return 'Coinbase';
        } else if (provider.isWalletConnect) {
            return 'WalletConnect';
        } else if (provider.isTrust) {
            return 'Trust Wallet';
        } else if (window.ethereum && window.ethereum.isFortmatic) {
            return 'Fortmatic';
        } else {
            return 'Web3';
        }
    }
    
    // Получение текущего подключенного аккаунта
    function getSelectedAccount() {
        return selectedAccount;
    }
    
    // Получение текущего веб3 провайдера
    function getWeb3() {
        return web3;
    }
    
    // Получение текущего провайдера
    function getProvider() {
        return provider;
    }
    
    // Экспортируем API для использования в других частях приложения
    window.WalletConnector = {
        init,
        connect,
        disconnect,
        getSelectedAccount,
        getWeb3,
        getProvider
    };
    
    // Инициализируем при загрузке страницы
    document.addEventListener('DOMContentLoaded', () => {
        console.log("DOM загружен, инициализация WalletConnector");
        
        // Устанавливаем обработчик для кнопки подключения
        if (connectButton) {
            connectButton.addEventListener('click', () => {
                if (selectedAccount) {
                    disconnect();
                } else {
                    connect();
                }
            });
        } else {
            console.error("Кнопка подключения не найдена!");
        }
        
        // Инициализируем Web3Modal
        init();
    });
})(); 