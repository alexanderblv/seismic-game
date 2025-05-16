// Modern implementation for Web3Modal v3
(function() {
    // Global variables
    let web3modal;
    let web3modalProvider;
    let selectedAccount;
    let web3;
    
    // UI elements
    const connectButton = document.getElementById('connect-wallet');
    const walletAddress = document.getElementById('wallet-address');
    const networkBadge = document.getElementById('network-badge');
    const connectionStatus = document.getElementById('connection-status');
    
    // Initialize Web3Modal
    async function init() {
        console.log("Initializing Web3Modal v3");
        
        try {
            // Check if Web3Modal library is loaded
            if (typeof window.Web3Modal === 'undefined') {
                console.error("Web3Modal v3 not found. Make sure the library is loaded.");
                return;
            }
            
            // Create Web3Modal instance
            web3modal = new window.Web3Modal.default({
                walletConnectProjectId: "27e484dcd9e3efcfd25a83a78777cdf1",
                chain: {
                    id: 5124,
                    name: "Seismic Devnet",
                    rpcUrl: "https://node-2.seismicdev.net/rpc"
                },
                showQrModal: true,
                themeMode: "dark",
                explorerRecommendedWalletIds: ["c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96", "4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0"]
            });
            
            console.log("Web3Modal initialized");
            
            // Setup event listeners
            web3modal.subscribeModal(state => {
                console.log("Modal state changed:", state.open);
            });
            
            // Setup connect button
            if (connectButton) {
                connectButton.addEventListener('click', () => {
                    if (selectedAccount) {
                        disconnect();
                    } else {
                        connect();
                    }
                });
            }
            
            // Check if we have a cached provider
            if (localStorage.getItem('walletConnected') === 'true') {
                console.log("Found cached connection, attempting to reconnect");
                connect();
            }
            
        } catch (error) {
            console.error("Error initializing Web3Modal:", error);
        }
    }
    
    // Connect to wallet
    async function connect() {
        try {
            console.log("Connecting wallet...");
            
            // Open Web3Modal
            const connection = await web3modal.connect();
            web3modalProvider = connection.provider;
            
            // Create Web3 instance
            web3 = new Web3(web3modalProvider);
            console.log("Web3 instance created:", web3);
            
            // Get accounts
            const accounts = await web3.eth.getAccounts();
            console.log("Connected accounts:", accounts);
            
            if (accounts.length === 0) {
                throw new Error("No accounts found");
            }
            
            selectedAccount = accounts[0];
            console.log("Selected account:", selectedAccount);
            
            // Cache connection
            localStorage.setItem('walletConnected', 'true');
            
            // Update UI
            updateUI();
            
            // Setup provider events
            setupProviderEvents();
            
            // Dispatch connection event
            const connectEvent = new CustomEvent('walletConnected', { 
                detail: { 
                    account: selectedAccount,
                    provider: web3modalProvider,
                    web3: web3
                } 
            });
            document.dispatchEvent(connectEvent);
            
            return true;
        } catch (error) {
            console.error("Error connecting wallet:", error);
            
            // Show user-friendly error
            alert("Failed to connect wallet. Please make sure you have a compatible wallet installed and try again.");
            return false;
        }
    }
    
    // Disconnect wallet
    async function disconnect() {
        try {
            console.log("Disconnecting wallet...");
            
            // Clear cached connection
            localStorage.removeItem('walletConnected');
            
            // If provider has disconnect method, call it
            if (web3modalProvider && typeof web3modalProvider.disconnect === 'function') {
                await web3modalProvider.disconnect();
            }
            
            // Reset variables
            web3modalProvider = null;
            web3 = null;
            selectedAccount = null;
            
            // Update UI
            updateUIDisconnected();
            
            // Dispatch disconnection event
            document.dispatchEvent(new Event('walletDisconnected'));
            
            return true;
        } catch (error) {
            console.error("Error disconnecting wallet:", error);
            return false;
        }
    }
    
    // Setup provider events
    function setupProviderEvents() {
        if (!web3modalProvider || !web3modalProvider.on) {
            console.warn("Provider doesn't support events");
            return;
        }
        
        // Account changed event
        web3modalProvider.on("accountsChanged", (accounts) => {
            console.log("Accounts changed:", accounts);
            
            if (accounts.length === 0) {
                // User disconnected
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
        
        // Chain changed event
        web3modalProvider.on("chainChanged", (chainId) => {
            console.log("Chain changed:", chainId);
            
            // Update network info
            updateNetworkInfo();
            
            // Dispatch network changed event
            const event = new CustomEvent('networkChanged', { 
                detail: { chainId: chainId } 
            });
            document.dispatchEvent(event);
        });
        
        // Disconnect event
        web3modalProvider.on("disconnect", (error) => {
            console.log("Provider disconnected:", error);
            disconnect();
        });
    }
    
    // Update UI when connected
    function updateUI() {
        if (!selectedAccount) return;
        
        try {
            // Show wallet address with icon
            const shortAddress = `${selectedAccount.substring(0, 6)}...${selectedAccount.substring(selectedAccount.length - 4)}`;
            
            // Determine wallet type
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
            
            // Update button to "Disconnect"
            connectButton.innerHTML = '<i class="bi bi-wallet2"></i> Disconnect';
            connectButton.classList.remove('btn-primary');
            connectButton.classList.add('btn-danger');
            
            // Update connection status
            connectionStatus.textContent = 'Connected';
            connectionStatus.classList.remove('bg-secondary');
            connectionStatus.classList.add('bg-success');
            
            // Update network info
            updateNetworkInfo();
            
        } catch (error) {
            console.error("Error updating UI:", error);
        }
    }
    
    // Update UI when disconnected
    function updateUIDisconnected() {
        // Reset button to initial state
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
        if (!web3) return;
        
        try {
            // Get network ID
            const chainId = await web3.eth.getChainId();
            console.log("Current chainId:", chainId);
            
            // Determine network name
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
        if (!web3modalProvider) return 'Unknown';
        
        if (web3modalProvider.isMetaMask) {
            return 'MetaMask';
        } else if (web3modalProvider.isCoinbaseWallet) {
            return 'Coinbase';
        } else if (web3modalProvider.isWalletConnect) {
            return 'WalletConnect';
        } else if (web3modalProvider.isTrust) {
            return 'Trust Wallet';
        } else {
            return 'Web3';
        }
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
        return web3modalProvider;
    }
    
    // Export API
    window.WalletConnector = {
        init,
        connect,
        disconnect,
        getSelectedAccount,
        getWeb3,
        getProvider
    };
    
    // Initialize on page load
    document.addEventListener('DOMContentLoaded', () => {
        console.log("DOM loaded, initializing WalletConnector");
        init();
    });
})(); 