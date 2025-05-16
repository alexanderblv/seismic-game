// Simple custom wallet connector implementation
(function() {
    // Global variables
    let provider = null;
    let web3 = null;
    let selectedAccount = null;
    let connecting = false;
    
    // UI elements - we'll get these only after DOM is loaded
    let connectButton;
    let walletAddress;
    let networkBadge;
    let connectionStatus;
    
    // Modal elements
    let modalContainer = null;
    
    // Available wallet providers
    const walletProviders = [
        {
            id: 'metamask',
            name: 'MetaMask',
            logo: 'https://raw.githubusercontent.com/MetaMask/brand-resources/master/SVG/metamask-fox.svg',
            check: () => {
                return window.ethereum && (window.ethereum.isMetaMask || 
                       (window.ethereum.providers && 
                        window.ethereum.providers.some(p => p.isMetaMask)));
            },
            connect: async () => {
                if (!window.ethereum) {
                    throw new Error('No Ethereum provider found');
                }
                
                // If we have multiple providers, try to find MetaMask
                if (window.ethereum.providers) {
                    const metaMaskProvider = window.ethereum.providers.find(p => p.isMetaMask);
                    if (metaMaskProvider) return metaMaskProvider;
                }
                
                // Otherwise use the main provider if it has MetaMask
                if (window.ethereum.isMetaMask) {
                    return window.ethereum;
                }
                
                throw new Error('MetaMask is not installed');
            }
        },
        {
            id: 'rabby',
            name: 'Rabby',
            logo: 'https://rabby.io/assets/rabby-logo.svg',
            check: () => {
                return window.ethereum && (window.ethereum.isRabby || 
                       (window.ethereum.providers && 
                        window.ethereum.providers.some(p => p.isRabby)));
            },
            connect: async () => {
                if (!window.ethereum) {
                    throw new Error('No Ethereum provider found');
                }
                
                // If we have multiple providers, try to find Rabby
                if (window.ethereum.providers) {
                    const rabbyProvider = window.ethereum.providers.find(p => p.isRabby);
                    if (rabbyProvider) return rabbyProvider;
                }
                
                // Otherwise use the main provider if it has Rabby
                if (window.ethereum.isRabby) {
                    return window.ethereum;
                }
                
                throw new Error('Rabby is not installed');
            }
        },
        {
            id: 'coinbase',
            name: 'Coinbase Wallet',
            logo: 'https://avatars.githubusercontent.com/u/18060234',
            check: () => {
                return window.ethereum && (
                    window.ethereum.isCoinbaseWallet || 
                    window.ethereum.isCoinbaseBrowser ||
                    (window.ethereum.providers && 
                     window.ethereum.providers.some(p => p.isCoinbaseWallet || p.isCoinbaseBrowser))
                );
            },
            connect: async () => {
                if (!window.ethereum) {
                    throw new Error('No Ethereum provider found');
                }
                
                // If we have multiple providers, try to find Coinbase
                if (window.ethereum.providers) {
                    const coinbaseProvider = window.ethereum.providers.find(
                        p => p.isCoinbaseWallet || p.isCoinbaseBrowser
                    );
                    if (coinbaseProvider) return coinbaseProvider;
                }
                
                // Otherwise use the main provider if it's Coinbase
                if (window.ethereum.isCoinbaseWallet || window.ethereum.isCoinbaseBrowser) {
                    return window.ethereum;
                }
                
                throw new Error('Coinbase Wallet is not installed');
            }
        },
        {
            id: 'binance',
            name: 'Binance Wallet',
            logo: 'https://public.bnbstatic.com/static/images/common/favicon.ico',
            check: () => {
                return window.ethereum && (
                    window.ethereum.isBinanceChain ||
                    (window.ethereum.providers && 
                     window.ethereum.providers.some(p => p.isBinanceChain))
                );
            },
            connect: async () => {
                if (!window.ethereum) {
                    throw new Error('No Ethereum provider found');
                }
                
                // If we have multiple providers, try to find Binance
                if (window.ethereum.providers) {
                    const binanceProvider = window.ethereum.providers.find(p => p.isBinanceChain);
                    if (binanceProvider) return binanceProvider;
                }
                
                // Otherwise use the main provider if it's Binance
                if (window.ethereum.isBinanceChain) {
                    return window.ethereum;
                }
                
                throw new Error('Binance Wallet is not installed');
            }
        },
        {
            id: 'walletconnect',
            name: 'WalletConnect',
            logo: 'https://avatars.githubusercontent.com/u/37784886',
            check: () => !!window.WalletConnectProvider || window.ethereum?.isWalletConnect,
            connect: async () => {
                try {
                    // First check if WalletConnect is available via injected provider
                    if (window.ethereum && window.ethereum.isWalletConnect) {
                        return window.ethereum;
                    }
                    
                    // If we have multiple providers, try to find WalletConnect 
                    if (window.ethereum && window.ethereum.providers) {
                        const wcProvider = window.ethereum.providers.find(p => p.isWalletConnect);
                        if (wcProvider) return wcProvider;
                    }
                    
                    // Fall back to WalletConnectProvider
                    if (!window.WalletConnectProvider) {
                        throw new Error('WalletConnect provider is not loaded');
                    }
                    
                    const wcProvider = new window.WalletConnectProvider.default({
                        rpc: {
                            5124: 'https://node-2.seismicdev.net/rpc',
                            1: 'https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161'
                        },
                        chainId: 5124
                    });
                    
                    // Enable session
                    await wcProvider.enable();
                    return wcProvider;
                } catch (error) {
                    console.error('WalletConnect error:', error);
                    throw error;
                }
            }
        },
        {
            id: 'generic',
            name: 'Other Ethereum Wallet',
            logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Ethereum-icon-purple.svg/1200px-Ethereum-icon-purple.svg.png',
            check: () => !!window.ethereum,
            connect: async () => {
                if (!window.ethereum) {
                    throw new Error('No Ethereum provider found');
                }
                
                return window.ethereum;
            }
        }
    ];
    
    // Initialize wallet connector
    function init() {
        console.log("Initializing custom wallet connector...");
        
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
            
            // Create wallet selection modal
            createWalletModal();
            
            // Add click event listener to connect button
            connectButton.addEventListener('click', async () => {
                if (selectedAccount) {
                    await disconnect();
                } else {
                    showWalletSelector();
                }
            });
            
            // Log ethereum provider info
            if (window.ethereum) {
                console.log("Ethereum provider found:", window.ethereum);
                console.log("Provider properties:", Object.keys(window.ethereum));
                console.log("isMetaMask:", window.ethereum.isMetaMask);
                console.log("isRabby:", window.ethereum.isRabby);
                
                // Check for multiple providers
                if (window.ethereum.providers) {
                    console.log("Multiple providers found:", window.ethereum.providers);
                    window.ethereum.providers.forEach((p, i) => {
                        console.log(`Provider ${i} properties:`, Object.keys(p));
                        console.log(`Provider ${i} isMetaMask:`, p.isMetaMask);
                        console.log(`Provider ${i} isRabby:`, p.isRabby);
                    });
                }
            } else {
                console.log("No Ethereum provider found in window");
            }
            
            // Check if we're already connected from localStorage
            const savedAccount = localStorage.getItem('connectedAccount');
            if (savedAccount) {
                console.log("Found saved account, attempting to reconnect:", savedAccount);
                
                // Try to reconnect using the saved provider
                const savedProviderId = localStorage.getItem('connectedProvider');
                if (savedProviderId) {
                    const provider = walletProviders.find(p => p.id === savedProviderId);
                    if (provider && provider.check()) {
                        connectWithProvider(provider);
                    }
                }
            }
            
            // Log available providers
            const availableProviders = walletProviders.filter(p => p.check());
            console.log("Available wallet providers:", availableProviders.map(p => p.name));
        } catch (error) {
            console.error("Failed to initialize wallet connector:", error);
        }
    }
    
    // Create wallet selection modal
    function createWalletModal() {
        // Create modal container if it doesn't exist
        if (!modalContainer) {
            modalContainer = document.createElement('div');
            modalContainer.id = 'wallet-modal-container';
            modalContainer.style.display = 'none';
            modalContainer.style.position = 'fixed';
            modalContainer.style.top = '0';
            modalContainer.style.left = '0';
            modalContainer.style.width = '100%';
            modalContainer.style.height = '100%';
            modalContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
            modalContainer.style.zIndex = '9999';
            modalContainer.style.display = 'flex';
            modalContainer.style.justifyContent = 'center';
            modalContainer.style.alignItems = 'center';
            
            // Create modal content
            const modalContent = document.createElement('div');
            modalContent.id = 'wallet-modal-content';
            modalContent.style.backgroundColor = '#fff';
            modalContent.style.borderRadius = '10px';
            modalContent.style.padding = '20px';
            modalContent.style.width = '400px';
            modalContent.style.maxWidth = '90%';
            modalContent.style.maxHeight = '90%';
            modalContent.style.overflow = 'auto';
            modalContent.style.boxShadow = '0 4px 10px rgba(0, 0, 0, 0.3)';
            
            // Create modal header
            const modalHeader = document.createElement('div');
            modalHeader.style.display = 'flex';
            modalHeader.style.justifyContent = 'space-between';
            modalHeader.style.alignItems = 'center';
            modalHeader.style.marginBottom = '20px';
            
            const modalTitle = document.createElement('h3');
            modalTitle.textContent = 'Connect your wallet';
            modalTitle.style.margin = '0';
            
            const closeButton = document.createElement('button');
            closeButton.innerHTML = '&times;';
            closeButton.style.background = 'none';
            closeButton.style.border = 'none';
            closeButton.style.fontSize = '24px';
            closeButton.style.cursor = 'pointer';
            closeButton.onclick = hideWalletSelector;
            
            modalHeader.appendChild(modalTitle);
            modalHeader.appendChild(closeButton);
            
            // Create wallet options container
            const walletOptions = document.createElement('div');
            walletOptions.id = 'wallet-options';
            
            // Add available wallet providers
            walletProviders.forEach(provider => {
                if (provider.check()) {
                    const option = document.createElement('div');
                    option.className = 'wallet-option';
                    option.style.display = 'flex';
                    option.style.alignItems = 'center';
                    option.style.padding = '12px';
                    option.style.margin = '8px 0';
                    option.style.border = '1px solid #ddd';
                    option.style.borderRadius = '8px';
                    option.style.cursor = 'pointer';
                    option.style.transition = 'background-color 0.2s';
                    
                    option.onmouseover = () => {
                        option.style.backgroundColor = '#f5f5f5';
                    };
                    
                    option.onmouseout = () => {
                        option.style.backgroundColor = 'transparent';
                    };
                    
                    option.onclick = () => {
                        connectWithProvider(provider);
                    };
                    
                    const logo = document.createElement('img');
                    logo.src = provider.logo;
                    logo.alt = provider.name;
                    logo.style.width = '24px';
                    logo.style.height = '24px';
                    logo.style.marginRight = '12px';
                    
                    const name = document.createElement('span');
                    name.textContent = provider.name;
                    name.style.fontWeight = '500';
                    
                    option.appendChild(logo);
                    option.appendChild(name);
                    
                    walletOptions.appendChild(option);
                }
            });
            
            // Add all elements to the modal
            modalContent.appendChild(modalHeader);
            modalContent.appendChild(walletOptions);
            
            // Add modal content to container
            modalContainer.appendChild(modalContent);
            
            // Add modal to the document
            document.body.appendChild(modalContainer);
        }
    }
    
    // Show wallet selector modal
    function showWalletSelector() {
        if (modalContainer) {
            modalContainer.style.display = 'flex';
        }
    }
    
    // Hide wallet selector modal
    function hideWalletSelector() {
        if (modalContainer) {
            modalContainer.style.display = 'none';
        }
    }
    
    // Connect with selected provider
    async function connectWithProvider(walletProvider) {
        if (connecting) return;
        connecting = true;
        
        try {
            console.log(`Connecting to ${walletProvider.name}...`);
            hideWalletSelector();
            
            // Get provider instance
            provider = await walletProvider.connect();
            
            if (!provider) {
                throw new Error(`Failed to connect to ${walletProvider.name}`);
            }
            
            console.log(`Connected to ${walletProvider.name}`, provider);
            
            // Setup Web3
            web3 = new Web3(provider);
            
            // Request accounts
            console.log("Requesting accounts...");
            const accounts = await web3.eth.getAccounts();
            
            if (!accounts || accounts.length === 0) {
                // Try directly with provider if web3.eth.getAccounts fails
                try {
                    console.log("Trying alternative method to get accounts...");
                    const accounts = await provider.request({ method: 'eth_requestAccounts' });
                    if (accounts && accounts.length > 0) {
                        selectedAccount = accounts[0];
                        console.log("Selected account (alternative method):", selectedAccount);
                        
                        // Save connected account to localStorage
                        localStorage.setItem('connectedAccount', selectedAccount);
                        localStorage.setItem('connectedProvider', walletProvider.id);
                        
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
                    }
                } catch (innerError) {
                    console.error("Alternative method to get accounts failed:", innerError);
                }
                
                throw new Error("No accounts found - wallet might be locked");
            }
            
            // Set selected account
            selectedAccount = accounts[0];
            console.log("Selected account:", selectedAccount);
            
            // Save connected account to localStorage
            localStorage.setItem('connectedAccount', selectedAccount);
            localStorage.setItem('connectedProvider', walletProvider.id);
            
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
            console.error(`Failed to connect with ${walletProvider.name}:`, error);
            return { success: false, error: error };
        } finally {
            connecting = false;
        }
    }
    
    // Connect to wallet (opens selector)
    async function connect() {
        showWalletSelector();
        
        // Return a promise that resolves when a wallet is connected
        // This is used by the SDK to know when connection is complete
        return new Promise((resolve) => {
            const eventListener = (event) => {
                document.removeEventListener('walletConnected', eventListener);
                resolve({ success: true, account: event.detail.account });
            };
            
            document.addEventListener('walletConnected', eventListener);
            
            // If the modal is closed without connecting, resolve with error
            const checkIfModalClosed = setInterval(() => {
                if (modalContainer && modalContainer.style.display === 'none' && !selectedAccount) {
                    clearInterval(checkIfModalClosed);
                    document.removeEventListener('walletConnected', eventListener);
                    resolve({ success: false, error: new Error('User cancelled wallet selection') });
                }
                
                if (selectedAccount) {
                    clearInterval(checkIfModalClosed);
                }
            }, 500);
        });
    }
    
    // Disconnect wallet
    async function disconnect() {
        console.log("Disconnecting wallet...");
        
        // Close provider if it's WalletConnect
        if (provider && provider.close) {
            try {
                await provider.close();
            } catch (e) {
                console.error("Error closing provider:", e);
            }
        }
        
        // Clear localStorage
        localStorage.removeItem('connectedAccount');
        localStorage.removeItem('connectedProvider');
        
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
            // For standard Ethereum providers
            if (provider.on) {
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
                });
                
                // Handle disconnect
                provider.on('disconnect', (error) => {
                    console.log("Provider disconnected", error);
                    disconnect();
                });
            }
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