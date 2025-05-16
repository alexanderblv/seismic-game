// Simple wallet connection implementation using Web3Modal
(function() {
    // Global variables
    let provider = null;
    let web3 = null;
    let selectedAccount = null;
    let connecting = false;
    let web3Modal = null;
    
    // UI elements - we'll get these only after DOM is loaded
    let connectButton;
    let walletAddress;
    let networkBadge;
    let connectionStatus;
    
    // Initialize wallet connector
    function init() {
        console.log("Initializing Web3Modal wallet connector...");
        
        try {
            // Get UI elements
            connectButton = document.getElementById('connect-wallet');
            walletAddress = document.getElementById('wallet-address');
            networkBadge = document.getElementById('network-badge');
            connectionStatus = document.getElementById('connection-status');
            
            if (!connectButton) {
                console.error("Connect button not found");
                return;
            }
            
            // Initialize Web3Modal
            initWeb3Modal();
            
            // Add click event listener to connect button
            connectButton.addEventListener('click', async () => {
                if (selectedAccount) {
                    await disconnect();
                } else {
                    await connect();
                }
            });
            
            // Check if we're already connected from localStorage
            const savedAccount = localStorage.getItem('connectedAccount');
            if (savedAccount) {
                console.log("Found saved account, attempting to reconnect:", savedAccount);
                connect();
            }
        } catch (error) {
            console.error("Failed to initialize wallet connector:", error);
        }
    }
    
    // Initialize Web3Modal
    function initWeb3Modal() {
        try {
            // Простая проверка - если Web3Modal не доступен, выход
            if (typeof Web3Modal === 'undefined') {
                console.error("Web3Modal не найден, убедитесь что скрипты подключены правильно");
                return;
            }
            
            setupWeb3Modal();
        } catch (error) {
            console.error("Error initializing Web3Modal:", error);
        }
    }
    
    // Setup Web3Modal instance
    function setupWeb3Modal() {
        try {
            const providerOptions = {};
            
            // WalletConnect
            if (window.WalletConnectProvider) {
                console.log("WalletConnect provider found, adding to options");
                providerOptions.walletconnect = {
                    package: window.WalletConnectProvider.default,
                    options: {
                        rpc: {
                            5124: 'https://node-2.seismicdev.net/rpc',
                            1: 'https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161'
                        },
                        chainId: 5124
                    }
                };
            }

            // Отключаем Coinbase, так как он может конфликтовать с другими кошельками
            // Определяем опции Web3Modal, делаем более простыми
            web3Modal = new Web3Modal.default({
                cacheProvider: false,
                providerOptions,
                disableInjectedProvider: false,
                theme: "dark"
            });
            
            // Выведем все доступные провайдеры
            if (web3Modal && web3Modal.providerController) {
                const availableProviders = web3Modal.providerController.providers;
                console.log("Available providers:", availableProviders);
                
                // Перечислим названия доступных провайдеров
                const providerNames = availableProviders.map(p => p.name || p.id || "Unknown");
                console.log("Provider names:", providerNames);
            }
        } catch (error) {
            console.error("Failed to setup Web3Modal:", error);
        }
    }
    
    // Connect wallet
    async function connect() {
        if (connecting) return;
        connecting = true;
        
        try {
            console.log("Connecting wallet with Web3Modal...");
            
            // Make sure Web3Modal is initialized
            if (!web3Modal) {
                console.error("Web3Modal is not initialized");
                throw new Error("Web3Modal not initialized");
            }
            
            console.log("Opening Web3Modal...");
            
            // Open Web3Modal to let user choose a wallet
            provider = await web3Modal.connect()
                .catch(error => {
                    console.log("User rejected modal or connection:", error);
                    connecting = false;
                    throw error; // Перебрасываем ошибку для правильной обработки
                });
            
            if (!provider) {
                console.error("No provider selected from Web3Modal");
                throw new Error("Failed to connect - no provider selected");
            }
            
            console.log("Provider connected successfully:", provider);
            
            // Setup Web3
            web3 = new Web3(provider);
            
            // Get selected account
            console.log("Getting accounts...");
            const accounts = await web3.eth.getAccounts();
            console.log("Accounts received:", accounts);
            
            if (!accounts || accounts.length === 0) {
                console.error("No accounts found");
                throw new Error("No accounts found - wallet might be locked");
            }
            
            // Set selected account
            selectedAccount = accounts[0];
            console.log("Selected account:", selectedAccount);
            
            // Save connected account to localStorage
            localStorage.setItem('connectedAccount', selectedAccount);
            
            // Update UI
            updateUI();
            
            // Setup event listeners
            setupEventListeners();
            
            // Dispatch connected event
            const event = new CustomEvent('walletConnected', {
                detail: { 
                    account: selectedAccount,
                    provider: provider,
                    web3: web3
                }
            });
            document.dispatchEvent(event);
            
            return { success: true, account: selectedAccount };
        } catch (error) {
            console.error("Failed to connect wallet:", error);
            return { success: false, error: error };
        } finally {
            connecting = false;
        }
    }
    
    // Disconnect wallet
    async function disconnect() {
        console.log("Disconnecting wallet...");
        
        // Close provider if it's disconnectable
        if (provider && provider.close) {
            try {
                await provider.close();
            } catch (e) {
                console.error("Error closing provider:", e);
            }
        }
        
        // Clear localStorage
        localStorage.removeItem('connectedAccount');
        
        // Reset variables
        provider = null;
        web3 = null;
        selectedAccount = null;
        
        // Update UI
        updateUIDisconnected();
        
        // Dispatch disconnected event
        document.dispatchEvent(new Event('walletDisconnected'));
        
        return true;
    }
    
    // Setup event listeners for the provider
    function setupEventListeners() {
        if (!provider) return;
        
        try {
            // Handle account changes
            provider.on('accountsChanged', (accounts) => {
                console.log("Accounts changed:", accounts);
                
                if (accounts.length === 0) {
                    // User disconnected their wallet
                    disconnect();
                } else {
                    // Update selected account
                    selectedAccount = accounts[0];
                    
                    // Save to localStorage
                    localStorage.setItem('connectedAccount', selectedAccount);
                    
                    // Update UI
                    updateUI();
                    
                    // Dispatch account changed event
                    const event = new CustomEvent('accountChanged', {
                        detail: { account: selectedAccount }
                    });
                    document.dispatchEvent(event);
                }
            });
            
            // Handle chain/network changes
            provider.on('chainChanged', (chainId) => {
                console.log("Chain changed:", chainId);
                
                // Update network info
                updateNetworkInfo();
                
                // Dispatch chain changed event
                const event = new CustomEvent('networkChanged', {
                    detail: { chainId }
                });
                document.dispatchEvent(event);
                
                // Reload the page to ensure all data is fresh
                // window.location.reload();
            });
            
            // Handle disconnect
            provider.on('disconnect', (error) => {
                console.log("Provider disconnected", error);
                disconnect();
            });
        } catch (error) {
            console.error("Error setting up event listeners:", error);
        }
    }
    
    // Update UI when connected
    function updateUI() {
        if (!selectedAccount || !connectButton || !walletAddress) return;
        
        try {
            // Format address
            const shortAddress = `${selectedAccount.substring(0, 6)}...${selectedAccount.substring(selectedAccount.length - 4)}`;
            
            // Add wallet icon
            const walletIcon = '<i class="bi bi-wallet2 me-1" title="Wallet"></i>';
            
            // Update address display
            walletAddress.innerHTML = walletIcon + shortAddress;
            walletAddress.classList.remove('d-none');
            
            // Update connect button
            connectButton.innerHTML = '<i class="bi bi-wallet2"></i> Disconnect';
            connectButton.classList.remove('btn-primary');
            connectButton.classList.add('btn-danger');
            
            // Update connection status
            if (connectionStatus) {
                connectionStatus.textContent = 'Connected';
                connectionStatus.classList.remove('bg-secondary');
                connectionStatus.classList.add('bg-success');
            }
            
            // Update network info
            updateNetworkInfo();
        } catch (error) {
            console.error("Error updating UI:", error);
        }
    }
    
    // Update UI when disconnected
    function updateUIDisconnected() {
        if (!connectButton || !walletAddress || !connectionStatus || !networkBadge) return;
        
        // Reset connect button
        connectButton.innerHTML = '<i class="bi bi-wallet2"></i> Connect Wallet';
        connectButton.classList.remove('btn-danger');
        connectButton.classList.add('btn-primary');
        
        // Hide address
        walletAddress.textContent = 'Connect your wallet';
        walletAddress.classList.add('d-none');
        
        // Update connection status
        connectionStatus.textContent = 'Not Connected';
        connectionStatus.classList.remove('bg-success');
        connectionStatus.classList.add('bg-secondary');
        
        // Update network badge
        networkBadge.textContent = 'Not Connected';
        networkBadge.classList.remove('bg-success');
        networkBadge.classList.add('bg-secondary');
    }
    
    // Update network information
    async function updateNetworkInfo() {
        if (!web3 || !networkBadge) return;
        
        try {
            // Get network ID
            const chainId = await web3.eth.getChainId();
            console.log("Current chainId:", chainId);
            
            // Set network name and color
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
            console.error("Error getting network info:", error);
            networkBadge.textContent = 'Error';
            networkBadge.classList.remove('bg-success', 'bg-secondary');
            networkBadge.classList.add('bg-danger');
        }
    }
    
    // Add Seismic network to wallet
    async function addSeismicNetwork() {
        try {
            if (!provider) {
                alert("Please connect your wallet first");
                return false;
            }
            
            await provider.request({
                method: 'wallet_addEthereumChain',
                params: [{
                    chainId: '0x1404', // 5124 in hex
                    chainName: 'Seismic Devnet',
                    nativeCurrency: {
                        name: 'ETH',
                        symbol: 'ETH',
                        decimals: 18
                    },
                    rpcUrls: ['https://node-2.seismicdev.net/rpc'],
                    blockExplorerUrls: ['https://explorer-2.seismicdev.net/']
                }]
            });
            
            return true;
        } catch (error) {
            console.error("Error adding Seismic network:", error);
            return false;
        }
    }
    
    // Check if wallet is connected
    function isConnected() {
        return !!selectedAccount;
    }
    
    // Get selected account
    function getSelectedAccount() {
        return selectedAccount;
    }
    
    // Get Web3 instance
    function getWeb3() {
        return web3;
    }
    
    // Get provider
    function getProvider() {
        return provider;
    }
    
    // Export public API
    window.WalletConnector = {
        init,
        connect,
        disconnect,
        addSeismicNetwork,
        isConnected,
        getSelectedAccount,
        getWeb3,
        getProvider
    };
    
    // Initialize when DOM is loaded
    document.addEventListener('DOMContentLoaded', init);
})(); 