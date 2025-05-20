/**
 * wallet-connector.js - Modern wallet connection implementation using Web3Modal
 */

(function() {
    class WalletConnector {
        constructor() {
            this.web3Modal = null;
            this.provider = null;
            this.selectedAccount = null;
            this.chainId = null;
            this.initialized = false;
            this.isConnecting = false;
            this.lastError = null;
            this.walletListeners = [];
            this.loadingPromise = null;
            this.isWeb3ModalConnection = false;
        }

        /**
         * Initialize the wallet connector
         */
        async initialize(config = {}) {
            if (this.initialized) return true;

            try {
                console.log("Initializing wallet connector...");
                
                // Wait a moment for any provider injections to complete
                await new Promise(resolve => setTimeout(resolve, 500));
                
                // Project ID for WalletConnect (required for v2)
                const projectId = config.projectId || window.seismicConfig?.walletConnect?.projectId || "a85ac05209955cfd18fbe7c0fd018f23";
                
                // Get network configuration
                const networkConfig = window.seismicConfig?.network || config.network || {
                    chainId: 1,
                    name: "Ethereum",
                    rpcUrl: "https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161"
                };
                
                // Ensure Web3Modal is loaded
                const web3ModalLoaded = await this._ensureWeb3ModalLoaded();
                if (!web3ModalLoaded) {
                    console.warn("Failed to load Web3Modal, falling back to direct provider");
                    // Even if Web3Modal failed to load, we can still try to use the injected provider
                    this._initializeEthersProvider();
                    this.initialized = true;
                    return true;
                }
                
                // Create Web3Modal instance
                this._initializeWeb3Modal(projectId, networkConfig);
                
                // Initialize ethers provider
                this._initializeEthersProvider();
                
                this.initialized = true;
                return true;
            } catch (error) {
                console.error("Failed to initialize wallet connector:", error);
                this.lastError = error.message || "Failed to initialize wallet connector";
                return false;
            }
        }
        
        /**
         * Ensure Web3Modal is loaded by dynamically importing it if needed
         */
        async _ensureWeb3ModalLoaded() {
            if (typeof window.Web3Modal === 'function') {
                console.log("Web3Modal already loaded");
                return true;
            }
            
            // Prevent multiple loading attempts
            if (this.loadingPromise) {
                return this.loadingPromise;
            }
            
            console.log("Web3Modal not found, attempting to load it dynamically");
            
            this.loadingPromise = new Promise(async (resolve) => {
                try {
                    // Check if the scripts were already loaded in the HTML
                    if (document.querySelector('script[src*="web3modal"]')) {
                        console.log("Web3Modal script tag already exists, waiting for it to load");
                        // Wait a moment for the script to initialize
                        await new Promise(resolve => setTimeout(resolve, 1500));
                        
                        if (typeof window.Web3Modal === 'function') {
                            console.log("Web3Modal loaded via existing script tag");
                            resolve(true);
                            return;
                        }
                    }
                    
                    // Check if we have safe references to the providers
                    if (window.__walletConnectProviders && typeof window.__walletConnectProviders.Web3Modal === 'function') {
                        console.log("Using existing Web3Modal from safe reference");
                        window.Web3Modal = window.__walletConnectProviders.Web3Modal;
                        resolve(true);
                        return;
                    }
                    
                    // Load required scripts if they aren't already loaded
                    if (!window.WalletConnectProvider) {
                        await this._loadScript('https://unpkg.com/@walletconnect/web3-provider@1.8.0/dist/umd/index.min.js');
                        console.log("Loaded WalletConnectProvider dynamically");
                    }
                    
                    // Load Web3Modal using a CDN that's more reliable
                    if (typeof window.Web3Modal !== 'function') {
                        await this._loadScript('https://unpkg.com/web3modal@1.9.9/dist/index.min.js');
                        console.log("Loaded Web3Modal dynamically");
                    }
                    
                    // Give it a moment to initialize
                    await new Promise(resolve => setTimeout(resolve, 500));
                    
                    // Check if loading was successful
                    if (typeof window.Web3Modal !== 'function') {
                        console.warn("Failed to load Web3Modal, wallet connection may not work properly");
                        resolve(false);
                    } else {
                        console.log("Successfully loaded Web3Modal dynamically");
                        resolve(true);
                    }
                } catch (error) {
                    console.error("Error loading Web3Modal:", error);
                    resolve(false);
                }
            });
            
            return this.loadingPromise;
        }
        
        /**
         * Helper to load a script dynamically
         */
        _loadScript(src) {
            return new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = src;
                script.async = true;
                script.onload = resolve;
                script.onerror = (err) => reject(new Error(`Failed to load script: ${src}`));
                document.head.appendChild(script);
            });
        }
        
        /**
         * Initialize Web3Modal
         */
        _initializeWeb3Modal(projectId, networkConfig) {
            // Check if Web3Modal is available
            if (typeof window.Web3Modal !== 'function') {
                console.warn("Web3Modal not available, will try to load it dynamically");
                return false;
            }
            
            try {
                // Configure provider options
                const providerOptions = {};
                
                // Add WalletConnect if available
                if (window.WalletConnectProvider) {
                    providerOptions.walletconnect = {
                        package: window.WalletConnectProvider,
                        options: {
                            projectId: projectId,
                            rpc: {
                                [networkConfig.chainId]: networkConfig.rpcUrl
                            },
                            chainId: networkConfig.chainId,
                            bridge: "https://bridge.walletconnect.org",
                            qrcode: true,
                            pollingInterval: 15000
                        }
                    };
                    console.log("Added WalletConnect provider option");
                } else {
                    console.warn("WalletConnectProvider not available");
                }
                
                // Add Coinbase Wallet if available
                if (window.CoinbaseWalletSDK) {
                    providerOptions.coinbasewallet = {
                        package: window.CoinbaseWalletSDK,
                        options: {
                            appName: "Seismic",
                            rpc: networkConfig.rpcUrl,
                            chainId: networkConfig.chainId
                        }
                    };
                    console.log("Added Coinbase Wallet provider option");
                }
                
                // Create Web3Modal instance with safer options
                const web3ModalOptions = {
                    cacheProvider: false, // Disabled to prevent auto-connecting
                    providerOptions,
                    disableInjectedProvider: false, // Allow access to injected providers
                    theme: "dark"
                };
                
                // Log the options we're using
                console.log("Initializing Web3Modal with options:", web3ModalOptions);
                
                try {
                    // Try creating Web3Modal with timeout to ensure it's fully loaded
                    setTimeout(() => {
                        try {
                            if (!this.web3Modal && typeof window.Web3Modal === 'function') {
                                this.web3Modal = new window.Web3Modal(web3ModalOptions);
                                console.log("Web3Modal initialized successfully with timeout");
                            }
                        } catch (delayedError) {
                            console.error("Failed to create Web3Modal instance with timeout:", delayedError);
                        }
                    }, 1000);
                    
                    // Also try immediately for faster execution when possible
                    this.web3Modal = new window.Web3Modal(web3ModalOptions);
                    console.log("Web3Modal initialized successfully");
                    return true;
                } catch (innerError) {
                    console.error("Failed to create Web3Modal instance:", innerError);
                    return false;
                }
            } catch (error) {
                console.error("Failed to initialize Web3Modal:", error);
                return false;
            }
        }
        
        /**
         * Initialize ethers provider
         */
        _initializeEthersProvider() {
            // Initialize ethers if available
            if (typeof window.ethers !== 'undefined') {
                console.log("Ethers library found");
            } else {
                console.warn("Ethers library not found");
            }
        }
        
        /**
         * Connect to wallet using Web3Modal
         */
        async connect() {
            if (this.isConnecting) {
                console.log("Connection process already started");
                return false;
            }
            
            try {
                this.isConnecting = true;
                this.lastError = null;
                
                // Initialize if needed
                if (!this.initialized) {
                    const initialized = await this.initialize();
                    if (!initialized) {
                        throw new Error("Failed to initialize wallet connector");
                    }
                }
                
                // Перед подключением очистим прошлые соединения, чтобы избежать конфликтов
                if (this.provider) {
                    try {
                        if (typeof this.provider.disconnect === 'function') {
                            await this.provider.disconnect();
                        }
                        console.log("Disconnected previous provider");
                    } catch (e) {
                        console.warn("Failed to disconnect previous provider:", e);
                    }
                    this.provider = null;
                }
                
                let provider = null;
                let isWeb3ModalConnection = false;
                
                // Принудительно пробуем сначала использовать Web3Modal, даже если есть window.ethereum
                if (typeof window.Web3Modal === 'function') {
                    // На случай если Web3Modal было загружено после инициализации
                    if (!this.web3Modal) {
                        const networkConfig = window.seismicConfig?.network || {
                            chainId: 1,
                            name: "Ethereum",
                            rpcUrl: "https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161"
                        };
                        const projectId = window.seismicConfig?.walletConnect?.projectId || "a85ac05209955cfd18fbe7c0fd018f23";
                        this._initializeWeb3Modal(projectId, networkConfig);
                    }
                    
                    if (this.web3Modal) {
                        console.log("Attempting to connect using Web3Modal");
                        try {
                            // Always clear cached provider to avoid auto-connecting to previous wallet
                            if (this.web3Modal.clearCachedProvider) {
                                try {
                                    this.web3Modal.clearCachedProvider();
                                } catch (clearError) {
                                    console.warn("Failed to clear cached provider:", clearError);
                                }
                            }
                            
                            // Connect using Web3Modal which will show the standard wallet selection
                            console.log("Opening Web3Modal for wallet selection");
                            provider = await this.web3Modal.connect();
                            console.log("Web3Modal connection successful");
                            isWeb3ModalConnection = true;
                        } catch (modalError) {
                            console.log("Web3Modal connection failed:", modalError);
                            provider = null;
                        }
                    }
                } else {
                    console.warn("Web3Modal not available, falling back to direct provider");
                }
                
                // Fallback to direct provider if Web3Modal failed or is not available
                if (!provider) {
                    console.log("Attempting to connect using direct provider");
                    
                    // Try to use the saved ethereum provider or the current window.ethereum
                    provider = window._safeEthereumProvider || window.ethereum;
                    
                    if (!provider) {
                        throw new Error("No Web3 provider detected. Please install MetaMask or another wallet.");
                    }
                    
                    try {
                        // Request accounts directly
                        const accounts = await provider.request({ method: 'eth_requestAccounts' });
                        if (!accounts || accounts.length === 0) {
                            throw new Error("No accounts returned from wallet");
                        }
                        console.log("Direct provider connection successful");
                    } catch (directError) {
                        console.error("Direct provider connection failed:", directError);
                        throw new Error("Failed to connect with direct provider: " + (directError.message || "Unknown error"));
                    }
                }
                
                // Update the provider reference
                this.provider = provider;
                
                // Set up event listeners for this provider
                this._registerProviderEvents(provider);
                
                // Update accounts and chain ID
                await this._updateAccountsAndChain(provider);
                
                // Store connection type for future reference
                this.isWeb3ModalConnection = isWeb3ModalConnection;
                
                return true;
            } catch (error) {
                console.error("Error connecting to wallet:", error);
                this.lastError = error.message || "Unknown connection error";
                this._emitEvent('wallet:error', { error: this.lastError });
                return false;
            } finally {
                this.isConnecting = false;
            }
        }
        
        /**
         * Update accounts and chain ID
         */
        async _updateAccountsAndChain(provider) {
            try {
                let accounts = [];
                
                // Different provider implementations have different methods
                if (typeof provider.request === 'function') {
                    accounts = await provider.request({ method: 'eth_requestAccounts' });
                } else if (typeof provider.enable === 'function') {
                    accounts = await provider.enable();
                } else if (provider.accounts) {
                    accounts = provider.accounts;
                }
                
                if (accounts && accounts.length > 0) {
                    this.selectedAccount = accounts[0];
                    
                    // Get chain ID
                    try {
                        if (typeof provider.request === 'function') {
                            this.chainId = await provider.request({ method: 'eth_chainId' });
                        } else if (provider.chainId) {
                            this.chainId = provider.chainId;
                        }
                        
                        // Convert hex to decimal if needed
                        if (typeof this.chainId === 'string' && this.chainId.startsWith('0x')) {
                            this.chainId = parseInt(this.chainId, 16);
                        }
                    } catch (e) {
                        console.warn("Failed to get chain ID:", e);
                    }
                    
                    // Emit connection event
                    this._emitEvent('walletConnected', { 
                        account: this.selectedAccount,
                        chainId: this.chainId
                    });
                    
                    return true;
                }
            } catch (error) {
                console.error("Failed to get accounts:", error);
                throw error;
            }
            
            return false;
        }
        
        /**
         * Register provider events
         */
        _registerProviderEvents(provider) {
            if (!provider) return;
            
            try {
                // Handle different event registration patterns
                const registerMethod = (event, handler) => {
                    if (typeof provider.on === 'function') {
                        provider.on(event, handler);
                    } else if (provider.connector && typeof provider.connector.on === 'function') {
                        provider.connector.on(event, handler);
                    } else {
                        console.warn(`Provider doesn't support event: ${event}`);
                    }
                };
                
                // Subscribe to accounts change
                registerMethod("accountsChanged", (accounts) => {
                    console.log("accountsChanged event:", accounts);
                    if (accounts && accounts.length > 0) {
                        this.selectedAccount = accounts[0];
                        this._emitEvent('accountsChanged', { 
                            account: this.selectedAccount
                        });
                    } else {
                        this.selectedAccount = null;
                        this._emitEvent('walletDisconnected');
                    }
                });
                
                // Subscribe to chainId change
                registerMethod("chainChanged", (chainId) => {
                    console.log("chainChanged event:", chainId);
                    
                    // Convert hex to decimal if needed
                    if (typeof chainId === 'string' && chainId.startsWith('0x')) {
                        chainId = parseInt(chainId, 16);
                    }
                    
                    this.chainId = chainId;
                    this._emitEvent('networkChanged', { chainId: this.chainId });
                });
                
                // Subscribe to provider disconnection
                registerMethod("disconnect", (error) => {
                    console.log("disconnect event:", error);
                    this.selectedAccount = null;
                    this.chainId = null;
                    this._emitEvent('walletDisconnected');
                });
            } catch (e) {
                console.warn("Error registering event handlers:", e);
            }
        }
        
        /**
         * Disconnect wallet
         */
        async disconnect() {
            try {
                // Clear cached provider if Web3Modal is available
                if (this.web3Modal) {
                    this.web3Modal.clearCachedProvider();
                }
                
                // Close provider connection if possible
                if (this.provider && typeof this.provider.disconnect === 'function') {
                    await this.provider.disconnect();
                }
                
                // Reset state
                this.provider = null;
                this.selectedAccount = null;
                this.chainId = null;
                
                // Emit event
                this._emitEvent('walletDisconnected');
                
                return true;
            } catch (error) {
                console.error("Error disconnecting wallet:", error);
                return false;
            }
        }
        
        /**
         * Check if wallet is connected
         */
        isConnected() {
            return !!this.selectedAccount;
        }
        
        /**
         * Get selected account
         */
        getSelectedAccount() {
            return this.selectedAccount;
        }
        
        /**
         * Get current chain ID
         */
        getChainId() {
            return this.chainId;
        }
        
        /**
         * Get provider
         */
        getProvider() {
            return this.provider;
        }
        
        /**
         * Get last error
         */
        getLastError() {
            return this.lastError;
        }
        
        /**
         * Add wallet event listener
         */
        addWalletListener(callback) {
            if (typeof callback === 'function') {
                this.walletListeners.push(callback);
                return true;
            }
            return false;
        }
        
        /**
         * Remove wallet event listener
         */
        removeWalletListener(callback) {
            const index = this.walletListeners.indexOf(callback);
            if (index !== -1) {
                this.walletListeners.splice(index, 1);
                return true;
            }
            return false;
        }
        
        /**
         * Emit event to listeners
         */
        _emitEvent(eventName, detail = {}) {
            // Dispatch custom event
            const event = new CustomEvent('wallet:' + eventName, {
                detail: detail,
                bubbles: true,
                cancelable: true
            });
            
            document.dispatchEvent(event);
            
            // Call listeners
            this.walletListeners.forEach(listener => {
                try {
                    listener(eventName, detail);
                } catch (e) {
                    console.error("Error in wallet listener:", e);
                }
            });
        }
    }

    // Register global instance
    window.walletConnector = new WalletConnector();
})(); 