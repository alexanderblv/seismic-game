// Simple, reliable implementation for wallet connections with Web3Modal
(function() {
    // Global variables
    let web3Modal = null;
    let provider = null;
    let web3 = null;
    let selectedAccount = null;
    let attempting = false;
    
    // UI elements - we'll get these only after DOM is loaded
    let connectButton;
    let walletAddress;
    let networkBadge;
    let connectionStatus;
    
    // Initialize Web3Modal when page loads
    async function init() {
        console.log("Initializing wallet connector...");
        
        try {
            // Get UI elements
            connectButton = document.getElementById('connect-wallet');
            walletAddress = document.getElementById('wallet-address');
            networkBadge = document.getElementById('network-badge');
            connectionStatus = document.getElementById('connection-status');
            
            if (!connectButton) {
                console.error("Connect button not found in the DOM");
                return;
            }
            
            // Make sure Web3Modal is loaded
            if (typeof window.Web3Modal === 'undefined') {
                console.error("Web3Modal not found - make sure to include the library");
                alert("Wallet connection library not loaded. Please refresh the page and try again.");
                return;
            }
            
            console.log("Web3Modal is available:", typeof window.Web3Modal);
            
            // Configure available providers
            const providerOptions = getProviderOptions();
            console.log("Provider options configured with:", Object.keys(providerOptions));
            
            // Create Web3Modal instance
            web3Modal = new window.Web3Modal({
                cacheProvider: true, // remember user's choice
                providerOptions: providerOptions,
                disableInjectedProvider: false, // important: allow MetaMask and other injected providers
                theme: "dark"
            });
            
            console.log("Web3Modal initialized successfully");
            
            // Setup connect button event listener
            connectButton.addEventListener('click', async () => {
                if (attempting) return;
                
                if (selectedAccount) {
                    await disconnect();
                } else {
                    await connect();
                }
            });
            
            // If a provider is cached, connect automatically
            if (web3Modal.cachedProvider) {
                console.log("Found cached provider:", web3Modal.cachedProvider);
                connect();
            }
        } catch (error) {
            console.error("Failed to initialize Web3Modal:", error);
        }
    }
    
    // Get configuration for all available providers
    function getProviderOptions() {
        const providerOptions = {};
        
        // WalletConnect
        if (typeof WalletConnectProvider !== 'undefined') {
            console.log("Adding WalletConnect provider");
            providerOptions.walletconnect = {
                package: WalletConnectProvider,
                options: {
                    infuraId: "27e484dcd9e3efcfd25a83a78777cdf1", // Public infura ID
                    rpc: {
                        5124: "https://node-2.seismicdev.net/rpc"
                    },
                    chainId: 5124
                }
            };
        } else {
            console.warn("WalletConnect provider not available");
        }
        
        // Coinbase Wallet
        if (typeof CoinbaseWalletSDK !== 'undefined') {
            console.log("Adding Coinbase Wallet provider");
            providerOptions.coinbasewallet = {
                package: CoinbaseWalletSDK,
                options: {
                    appName: "Seismic Transaction Sender",
                    rpc: "https://node-2.seismicdev.net/rpc",
                    chainId: 5124
                }
            };
        } else {
            console.warn("Coinbase Wallet SDK not available");
        }
        
        // Fortmatic
        if (typeof Fortmatic !== 'undefined') {
            console.log("Adding Fortmatic provider");
            providerOptions.fortmatic = {
                package: Fortmatic,
                options: {
                    key: "pk_test_391E26A3B43A3350" // Test key
                }
            };
        } else {
            console.warn("Fortmatic not available");
        }
        
        return providerOptions;
    }
    
    // Connect wallet
    async function connect() {
        if (attempting) return;
        attempting = true;
        
        try {
            console.log("Opening Web3Modal for wallet selection...");
            
            // Open Web3Modal
            provider = await web3Modal.connect();
            console.log("Provider connected:", provider);
            
            // Create Web3 instance
            web3 = new Web3(provider);
            console.log("Web3 instance created");
            
            // Get accounts
            const accounts = await web3.eth.getAccounts();
            console.log("Connected accounts:", accounts);
            
            if (!accounts || accounts.length === 0) {
                throw new Error("No accounts found - wallet might be locked");
            }
            
            // Set selected account to first account
            selectedAccount = accounts[0];
            console.log("Selected account:", selectedAccount);
            
            // Update UI
            updateUI();
            
            // Setup provider events
            setupProviderEvents();
            
            // Dispatch wallet connected event
            const connectEvent = new CustomEvent('walletConnected', { 
                detail: { 
                    account: selectedAccount,
                    provider: provider,
                    web3: web3
                } 
            });
            document.dispatchEvent(connectEvent);
            
            return { success: true, account: selectedAccount };
        } catch (error) {
            console.error("Failed to connect wallet:", error);
            
            // Show user-friendly error message
            alert("Failed to connect wallet. Please make sure you have a wallet installed and try again.");
            
            return { success: false, error };
        } finally {
            attempting = false;
        }
    }
    
    // Disconnect wallet
    async function disconnect() {
        console.log("Disconnecting wallet");
        
        // If the provider allows closing, do it
        if (provider && provider.close) {
            try {
                await provider.close();
                console.log("Provider closed");
            } catch (error) {
                console.error("Error closing provider:", error);
            }
        }
        
        // Clear the cached provider
        if (web3Modal) {
            await web3Modal.clearCachedProvider();
            console.log("Provider cache cleared");
        }
        
        // Reset variables
        provider = null;
        web3 = null;
        selectedAccount = null;
        
        // Update UI
        updateUIDisconnected();
        
        // Dispatch disconnected event
        document.dispatchEvent(new Event('walletDisconnected'));
    }
    
    // Setup provider events
    function setupProviderEvents() {
        if (!provider || !provider.on) {
            console.warn("Provider doesn't support events");
            return;
        }
        
        // Listen for account changes
        provider.on("accountsChanged", (accounts) => {
            console.log("Accounts changed:", accounts);
            
            if (accounts.length === 0) {
                // If no accounts, user has disconnected
                disconnect();
            } else {
                // Update selected account
                selectedAccount = accounts[0];
                updateUI();
                
                // Dispatch account changed event
                const event = new CustomEvent('accountChanged', { 
                    detail: { account: selectedAccount } 
                });
                document.dispatchEvent(event);
            }
        });
        
        // Listen for network changes
        provider.on("chainChanged", (chainId) => {
            console.log("Chain changed:", chainId);
            
            // Update network info in UI
            updateNetworkInfo();
            
            // Dispatch network changed event
            const event = new CustomEvent('networkChanged', { 
                detail: { chainId: chainId } 
            });
            document.dispatchEvent(event);
        });
        
        // Listen for disconnection
        provider.on("disconnect", (error) => {
            console.log("Provider disconnected:", error);
            disconnect();
        });
    }
    
    // Update UI when connected
    function updateUI() {
        if (!selectedAccount || !connectButton || !walletAddress) return;
        
        try {
            // Format address for display
            const shortAddress = `${selectedAccount.substring(0, 6)}...${selectedAccount.substring(selectedAccount.length - 4)}`;
            
            // Add wallet icon based on type
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
            
            // Update address with icon
            walletAddress.innerHTML = walletIcon + shortAddress;
            walletAddress.classList.remove('d-none');
            
            // Update connect button to show disconnect
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
    
    // Get provider name
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
    
    // Public API methods
    
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
    
    // Is wallet connected
    function isConnected() {
        return !!selectedAccount;
    }
    
    // Export public API
    window.WalletConnector = {
        init,
        connect,
        disconnect,
        getSelectedAccount,
        getWeb3,
        getProvider,
        isConnected
    };
    
    // Initialize when DOM is loaded
    document.addEventListener('DOMContentLoaded', init);
})(); 