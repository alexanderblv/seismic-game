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
    
    // Helper function to detect wallets
    function detectInstalledWallets() {
        const detectedWallets = {
            hasEthereum: false,
            hasProviders: false,
            injectedProviders: []
        };
        
        try {
            // Safely check if ethereum exists and is accessible
            detectedWallets.hasEthereum = typeof window.ethereum !== 'undefined';
            
            if (detectedWallets.hasEthereum) {
                // Check if providers array exists
                detectedWallets.hasProviders = Array.isArray(window.ethereum.providers);
                
                // Check main ethereum object's properties safely
                try {
                    if (window.ethereum.isMetaMask) detectedWallets.injectedProviders.push('metamask');
                } catch (e) {
                    console.warn("Error checking isMetaMask property:", e);
                }
                
                try {
                    if (window.ethereum.isRabby) detectedWallets.injectedProviders.push('rabby');
                } catch (e) {
                    console.warn("Error checking isRabby property:", e);
                }
                
                try {
                    if (window.ethereum.isCoinbaseWallet || window.ethereum.isCoinbaseBrowser) {
                        detectedWallets.injectedProviders.push('coinbase');
                    }
                } catch (e) {
                    console.warn("Error checking Coinbase properties:", e);
                }
                
                try {
                    if (window.ethereum.isBinanceChain) detectedWallets.injectedProviders.push('binance');
                } catch (e) {
                    console.warn("Error checking isBinanceChain property:", e);
                }
                
                try {
                    if (window.ethereum.isWalletConnect) detectedWallets.injectedProviders.push('walletconnect');
                } catch (e) {
                    console.warn("Error checking isWalletConnect property:", e);
                }
                
                // Check Trust Wallet specifically
                try {
                    if (window.ethereum.isTrust || window.ethereum.isTrustWallet) {
                        detectedWallets.injectedProviders.push('trust');
                    }
                } catch (e) {
                    console.warn("Error checking Trust Wallet properties:", e);
                }
                
                // If providers array exists, check each provider safely
                if (detectedWallets.hasProviders) {
                    window.ethereum.providers.forEach((p, i) => {
                        try {
                            if (p.isMetaMask) detectedWallets.injectedProviders.push(`metamask-${i}`);
                            if (p.isRabby) detectedWallets.injectedProviders.push(`rabby-${i}`);
                            if (p.isCoinbaseWallet || p.isCoinbaseBrowser) detectedWallets.injectedProviders.push(`coinbase-${i}`);
                            if (p.isBinanceChain) detectedWallets.injectedProviders.push(`binance-${i}`);
                            if (p.isWalletConnect) detectedWallets.injectedProviders.push(`walletconnect-${i}`);
                            if (p.isTrust || p.isTrustWallet) detectedWallets.injectedProviders.push(`trust-${i}`);
                        } catch (e) {
                            console.warn(`Error checking provider ${i} properties:`, e);
                        }
                    });
                }
            }
        } catch (e) {
            console.error("Error in detectInstalledWallets:", e);
        }
        
        // Check for WalletConnect specifically
        try {
            if (window.WalletConnectProvider) {
                detectedWallets.injectedProviders.push('walletconnect-lib');
            }
        } catch (e) {
            console.warn("Error checking WalletConnectProvider:", e);
        }
        
        return detectedWallets;
    }
    
    // Available wallet providers
    const walletProviders = [
        {
            id: 'metamask',
            name: 'MetaMask',
            logo: 'https://raw.githubusercontent.com/MetaMask/brand-resources/master/SVG/metamask-fox.svg',
            check: () => {
                try {
                    return window.ethereum && (
                        (typeof window.ethereum.isMetaMask !== 'undefined' && window.ethereum.isMetaMask) || 
                        (window.ethereum.providers && 
                         window.ethereum.providers.some(p => p.isMetaMask))
                    );
                } catch (e) {
                    console.warn("Error checking MetaMask:", e);
                    return false;
                }
            },
            connect: async () => {
                if (!window.ethereum) {
                    throw new Error('No Ethereum provider found');
                }
                
                try {
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
                } catch (e) {
                    console.error("Error connecting to MetaMask:", e);
                    throw new Error('MetaMask is not installed or accessible');
                }
            }
        },
        {
            id: 'rabby',
            name: 'Rabby',
            logo: 'https://rabby.io/assets/rabby-logo.svg',
            check: () => {
                try {
                    return window.ethereum && (
                        (typeof window.ethereum.isRabby !== 'undefined' && window.ethereum.isRabby) ||
                        (window.ethereum.providers && 
                         window.ethereum.providers.some(p => typeof p.isRabby !== 'undefined' && p.isRabby))
                    );
                } catch (e) {
                    console.warn("Error checking Rabby:", e);
                    return false;
                }
            },
            connect: async () => {
                if (!window.ethereum) {
                    throw new Error('No Ethereum provider found');
                }
                
                try {
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
                } catch (e) {
                    console.error("Error connecting to Rabby:", e);
                    throw new Error('Rabby is not installed or accessible');
                }
            }
        },
        {
            id: 'trust',
            name: 'Trust Wallet',
            logo: 'https://trustwallet.com/assets/images/favicon.png',
            check: () => {
                try {
                    return window.ethereum && (
                        (typeof window.ethereum.isTrust !== 'undefined' && window.ethereum.isTrust) ||
                        (typeof window.ethereum.isTrustWallet !== 'undefined' && window.ethereum.isTrustWallet) ||
                        (window.ethereum.providers && window.ethereum.providers.some(p => 
                            (typeof p.isTrust !== 'undefined' && p.isTrust) || 
                            (typeof p.isTrustWallet !== 'undefined' && p.isTrustWallet)
                        ))
                    );
                } catch (e) {
                    console.warn("Error checking Trust Wallet:", e);
                    return false;
                }
            },
            connect: async () => {
                if (!window.ethereum) {
                    throw new Error('No Ethereum provider found');
                }
                
                try {
                    // If we have multiple providers, try to find Trust Wallet
                    if (window.ethereum.providers) {
                        const trustProvider = window.ethereum.providers.find(p => 
                            p.isTrust || p.isTrustWallet
                        );
                        if (trustProvider) return trustProvider;
                    }
                    
                    // Otherwise use the main provider if it's Trust Wallet
                    if (window.ethereum.isTrust || window.ethereum.isTrustWallet) {
                        return window.ethereum;
                    }
                    
                    throw new Error('Trust Wallet is not installed');
                } catch (e) {
                    console.error("Error connecting to Trust Wallet:", e);
                    throw new Error('Trust Wallet is not installed or accessible');
                }
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
            
            // Log detailed wallet detection information
            const detectedWallets = detectInstalledWallets();
            console.log("Detected wallets:", detectedWallets);
            
            // Log ethereum provider info safely
            if (detectedWallets.hasEthereum) {
                try {
                    console.log("Ethereum provider found:", window.ethereum);
                    console.log("Provider properties:", Object.keys(window.ethereum));
                    
                    try {
                        console.log("isMetaMask:", window.ethereum.isMetaMask);
                    } catch (e) {
                        console.warn("Could not access isMetaMask property");
                    }
                    
                    try {
                        console.log("isRabby:", window.ethereum.isRabby);
                    } catch (e) {
                        console.warn("Could not access isRabby property");
                    }
                    
                    // Check for multiple providers safely
                    if (detectedWallets.hasProviders) {
                        console.log("Multiple providers found:", window.ethereum.providers);
                        window.ethereum.providers.forEach((p, i) => {
                            try {
                                console.log(`Provider ${i} properties:`, Object.keys(p));
                                console.log(`Provider ${i} isMetaMask:`, p.isMetaMask);
                                console.log(`Provider ${i} isRabby:`, p.isRabby);
                            } catch (e) {
                                console.warn(`Error reading provider ${i} properties:`, e);
                            }
                        });
                    }
                } catch (e) {
                    console.error("Error logging ethereum provider info:", e);
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
        try {
            // Check if modal already exists
            if (modalContainer) {
                return;
            }
            
            // Create modal container
            modalContainer = document.createElement('div');
            modalContainer.className = 'wallet-modal-container hidden';
            modalContainer.innerHTML = `
                <div class="wallet-modal">
                    <div class="wallet-modal-header">
                        <h3>Connect Your Wallet</h3>
                        <button class="wallet-modal-close">&times;</button>
                    </div>
                    <div class="wallet-modal-body">
                        <div class="wallet-options">
                            <!-- Wallet options will be added here dynamically -->
                        </div>
                    </div>
                    <div class="wallet-modal-footer">
                        <button class="wallet-modal-cancel">Cancel</button>
                    </div>
                </div>
            `;
            
            // Add modal styles
            const styleElement = document.createElement('style');
            styleElement.textContent = `
                .wallet-modal-container {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-color: rgba(0, 0, 0, 0.5);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 9999;
                }
                
                .hidden {
                    display: none;
                }
                
                .wallet-modal {
                    background-color: #fff;
                    border-radius: 8px;
                    width: 100%;
                    max-width: 400px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                    overflow: hidden;
                }
                
                .wallet-modal-header {
                    background-color: #f8f9fa;
                    padding: 15px 20px;
                    border-bottom: 1px solid #e9ecef;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                
                .wallet-modal-header h3 {
                    margin: 0;
                    font-size: 18px;
                    color: #212529;
                }
                
                .wallet-modal-close {
                    background: none;
                    border: none;
                    font-size: 24px;
                    cursor: pointer;
                    color: #6c757d;
                }
                
                .wallet-modal-body {
                    padding: 20px;
                }
                
                .wallet-options {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 10px;
                }
                
                .wallet-option {
                    display: flex;
                    align-items: center;
                    padding: 12px 16px;
                    border: 1px solid #dee2e6;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                
                .wallet-option:hover {
                    background-color: #f8f9fa;
                    border-color: #adb5bd;
                }
                
                .wallet-option img {
                    width: 32px;
                    height: 32px;
                    margin-right: 12px;
                    border-radius: 4px;
                }
                
                .wallet-option span {
                    font-size: 16px;
                    color: #212529;
                }
                
                .wallet-modal-footer {
                    padding: 15px 20px;
                    border-top: 1px solid #e9ecef;
                    display: flex;
                    justify-content: flex-end;
                }
                
                .wallet-modal-cancel {
                    background-color: #f8f9fa;
                    border: 1px solid #dee2e6;
                    border-radius: 4px;
                    padding: 8px 16px;
                    cursor: pointer;
                    font-size: 14px;
                    color: #6c757d;
                    transition: all 0.2s;
                }
                
                .wallet-modal-cancel:hover {
                    background-color: #e9ecef;
                }
            `;
            
            // Add modal to document
            document.body.appendChild(modalContainer);
            document.head.appendChild(styleElement);
            
            // Add event listeners
            const closeButton = modalContainer.querySelector('.wallet-modal-close');
            closeButton.addEventListener('click', () => {
                hideWalletSelector();
                if (window.WalletSelector) {
                    window.WalletSelector.reject(new Error("User cancelled wallet selection"));
                }
            });
        } catch (error) {
            console.error("Error creating wallet modal:", error);
        }
    }
    
    // Show wallet selector modal
    function showWalletSelector() {
        try {
            if (!modalContainer) {
                console.error("Modal container not initialized");
                return;
            }
            
            // Get available providers
            const availableProviders = walletProviders.filter(p => {
                try {
                    return p.check();
                } catch (e) {
                    console.warn(`Error checking ${p.name} availability:`, e);
                    return false;
                }
            });
            
            if (availableProviders.length === 0) {
                alert("No compatible wallets detected. Please install a Web3 wallet like MetaMask.");
                if (window.WalletSelector) {
                    window.WalletSelector.reject(new Error("No compatible wallets detected"));
                }
                return;
            }
            
            // Setup provider options
            const walletOptions = document.querySelector('.wallet-options');
            walletOptions.innerHTML = '';
            
            // Create options for each available provider
            availableProviders.forEach(provider => {
                const option = document.createElement('div');
                option.className = 'wallet-option';
                option.innerHTML = `
                    <img src="${provider.logo}" alt="${provider.name}" />
                    <span>${provider.name}</span>
                `;
                option.onclick = async () => {
                    modalContainer.classList.add('hidden');
                    try {
                        const result = await connectWithProvider(provider);
                        if (window.WalletSelector) {
                            window.WalletSelector.resolve(result);
                        }
                    } catch (error) {
                        console.error(`Connection error for ${provider.name}:`, error);
                        if (window.WalletSelector) {
                            window.WalletSelector.reject(error);
                        }
                    }
                };
                walletOptions.appendChild(option);
            });
            
            // Add cancel button
            const cancelButton = document.querySelector('.wallet-modal-cancel');
            cancelButton.onclick = () => {
                modalContainer.classList.add('hidden');
                if (window.WalletSelector) {
                    window.WalletSelector.reject(new Error("User cancelled wallet selection"));
                }
            };
            
            // Show modal
            modalContainer.classList.remove('hidden');
        } catch (error) {
            console.error("Error showing wallet selector:", error);
            if (window.WalletSelector) {
                window.WalletSelector.reject(error);
            }
        }
    }
    
    // Hide wallet selector modal
    function hideWalletSelector() {
        try {
            if (modalContainer) {
                modalContainer.classList.add('hidden');
            }
        } catch (error) {
            console.error("Error hiding wallet selector:", error);
        }
    }
    
    // Connect with selected provider
    async function connectWithProvider(walletProvider) {
        console.log(`Connecting to ${walletProvider.name}...`);
        
        if (connecting) {
            console.log("Connection already in progress");
            throw new Error("Connection already in progress");
        }
        
        connecting = true;
        
        try {
            // Get provider instance
            provider = await walletProvider.connect();
            
            if (!provider) {
                throw new Error(`Failed to connect to ${walletProvider.name}`);
            }
            
            console.log(`Connected to ${walletProvider.name}`, provider);
            
            // Setup Web3
            try {
                web3 = new Web3(provider);
            } catch (error) {
                console.error("Failed to initialize Web3:", error);
                throw new Error(`Failed to initialize Web3: ${error.message}`);
            }
            
            // Request accounts
            console.log("Requesting accounts...");
            let accounts = [];
            
            try {
                // Try multiple methods to get accounts
                const methods = [
                    // Method 1: web3.eth.getAccounts
                    async () => {
                        try {
                            return await web3.eth.getAccounts();
                        } catch (err) {
                            console.warn("Failed to get accounts with web3.eth.getAccounts():", err);
                            return null;
                        }
                    },
                    
                    // Method 2: direct provider.request
                    async () => {
                        try {
                            console.log("Trying eth_requestAccounts method...");
                            return await provider.request({ method: 'eth_requestAccounts' });
                        } catch (err) {
                            console.warn("Failed to get accounts with eth_requestAccounts:", err);
                            return null;
                        }
                    },
                    
                    // Method 3: provider.enable (legacy)
                    async () => {
                        try {
                            console.log("Trying enable method...");
                            return await provider.enable();
                        } catch (enableErr) {
                            console.warn("Failed to get accounts with enable method:", enableErr);
                            return null;
                        }
                    }
                ];
                
                // Try each method until we get accounts
                for (const method of methods) {
                    const result = await method();
                    if (result && result.length > 0) {
                        accounts = result;
                        break;
                    }
                }
            } catch (error) {
                console.error("All methods to get accounts failed:", error);
                throw new Error("Unable to get accounts from wallet");
            }
            
            if (!accounts || accounts.length === 0) {
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
            
            connecting = false;
            return { success: true, account: selectedAccount };
        } catch (error) {
            console.error(`Failed to connect with ${walletProvider.name}:`, error);
            
            // For debugging, log all available wallet providers
            console.log("Checking available providers:");
            try {
                if (window.ethereum) {
                    console.log("Main ethereum object:", window.ethereum);
                    if (window.ethereum.providers) {
                        window.ethereum.providers.forEach((p, i) => {
                            try {
                                console.log(`Provider ${i}:`, p);
                            } catch (e) {
                                console.warn(`Error logging provider ${i}:`, e);
                            }
                        });
                    }
                } else {
                    console.log("No window.ethereum object found");
                }
            } catch (e) {
                console.warn("Error checking providers:", e);
            }
            
            connecting = false;
            throw error;
        }
    }
    
    // Connect to wallet (opens selector)
    async function connect() {
        return new Promise((resolve, reject) => {
            try {
                if (connecting) {
                    console.log("Connection already in progress");
                    reject(new Error("Connection already in progress"));
                    return;
                }
                
                if (selectedAccount) {
                    // Already connected
                    console.log("Already connected to account:", selectedAccount);
                    resolve({ success: true, account: selectedAccount });
                    return;
                }
                
                // Show wallet selector modal
                showWalletSelector();
                
                // Setup promise handlers
                window.WalletSelector = {
                    resolve: (result) => {
                        delete window.WalletSelector;
                        resolve(result);
                    },
                    reject: (error) => {
                        delete window.WalletSelector;
                        reject(error);
                    }
                };
            } catch (error) {
                console.error("Error in connect function:", error);
                reject(error);
            }
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