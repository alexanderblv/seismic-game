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
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // Project ID for WalletConnect (required for v2)
                const projectId = config.projectId || window.seismicConfig?.walletConnect?.projectId || "a85ac05209955cfd18fbe7c0fd018f23";
                
                // Get network configuration
                const networkConfig = window.seismicConfig?.network || config.network || {
                    chainId: 1,
                    name: "Ethereum",
                    rpcUrl: "https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161"
                };
                
                // Get the safe provider reference
                this._setupSafeProviderReference();
                
                // Ensure Web3Modal is loaded
                let web3ModalLoaded = false;
                try {
                    web3ModalLoaded = await this._ensureWeb3ModalLoaded();
                } catch (e) {
                    console.warn("Error loading Web3Modal:", e);
                }
                
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
                // Even if initialization fails, we can still try to use the injected provider
                if (!this.provider && window._safeEthereumProvider) {
                    try {
                        this.provider = new ethers.providers.Web3Provider(window._safeEthereumProvider);
                        this.initialized = true;
                    } catch (e) {
                        console.error("Failed to create fallback provider:", e);
                    }
                }
                return this.initialized;
            }
        }
        
        /**
         * Setup safe provider reference
         */
        _setupSafeProviderReference() {
            // Create a safe reference without modifying the original ethereum object
            // This avoids conflicts with wallets that prevent overriding ethereum
            if (!window._safeEthereumProvider && window.ethereum) {
                // Simply store a reference without trying to modify or proxy the object
                window._safeEthereumProvider = window.ethereum;
                console.log("Created safe provider reference to window.ethereum");
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
                    // First, load WalletConnect provider which is required by Web3Modal
                    if (!window.WalletConnectProvider) {
                        console.log("Loading WalletConnectProvider first (required for Web3Modal)");
                        try {
                            await this._loadScript('https://cdn.jsdelivr.net/npm/@walletconnect/web3-provider@1.8.0/dist/umd/index.min.js');
                            console.log("Loaded WalletConnectProvider from CDN");
                            
                            // Give it a moment to initialize
                            await new Promise(resolve => setTimeout(resolve, 300));
                        } catch (e) {
                            console.error("Failed to load WalletConnectProvider from primary CDN, trying alternative...");
                            try {
                                await this._loadScript('https://unpkg.com/@walletconnect/web3-provider@1.8.0/dist/umd/index.min.js');
                                console.log("Loaded WalletConnectProvider from alternative CDN");
                                await new Promise(resolve => setTimeout(resolve, 300));
                            } catch (err) {
                                console.error("Failed to load WalletConnectProvider from any source:", err);
                                // Continue anyway as we'll try to use Web3Modal standalone
                            }
                        }
                    } else {
                        console.log("WalletConnectProvider already loaded");
                    }
                    
                    // Now load Web3Modal
                    console.log("Loading Web3Modal after provider prep");
                    try {
                        await this._loadScript('https://cdn.jsdelivr.net/npm/web3modal@1.9.12/dist/index.min.js');
                        console.log("Loaded Web3Modal v1.9.12 from CDN");
                    } catch (e) {
                        console.error("Failed to load Web3Modal v1.9.12, trying alternative version...");
                        try {
                            await this._loadScript('https://unpkg.com/web3modal@1.9.9/dist/index.min.js');
                            console.log("Loaded Web3Modal v1.9.9 from alternative CDN");
                        } catch (err) {
                            console.error("Failed to load Web3Modal from any source:", err);
                            resolve(false);
                            return;
                        }
                    }
                    
                    // Give some time for Web3Modal to initialize
                    await new Promise(resolve => setTimeout(resolve, 800));
                    
                    // Check if we have Web3Modal loaded
                    if (typeof window.Web3Modal !== 'function') {
                        console.error("Web3Modal failed to initialize properly");
                        resolve(false);
                        return;
                    }
                    
                    console.log("Successfully loaded and initialized Web3Modal");
                    resolve(true);
                } catch (error) {
                    console.error("Error in Web3Modal loading process:", error);
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
                console.error("Web3Modal not available despite loading attempt");
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
                
                // CRITICAL: Create Web3Modal with forced UI selection
                const web3ModalOptions = {
                    cacheProvider: false, // NEVER cache to avoid auto-connecting
                    providerOptions,
                    disableInjectedProvider: false,
                    theme: "dark",
                    showInjectedOption: true // Always show injected wallets like MetaMask
                };
                
                console.log("Initializing Web3Modal with selection-focused options:", web3ModalOptions);
                
                try {
                    // Create Web3Modal instance
                    this.web3Modal = new window.Web3Modal(web3ModalOptions);
                    console.log("Web3Modal initialized successfully");
                    
                    // Ensure modal always shows - override internal methods
                    const originalConnect = this.web3Modal.connect.bind(this.web3Modal);
                    this.web3Modal.connect = async () => {
                        // Force modal to open
                        this.web3Modal.toggleModal();
                        // Return connection result 
                        return originalConnect();
                    };
                    
                    console.log("Web3Modal connect method overridden to force wallet selection");
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
            try {
                // Check if ethers is available
                if (typeof ethers !== 'undefined') {
                    console.log("Ethers library found");
                    
                    // Use the safe reference to ethereum provider
                    const providerToUse = window._safeEthereumProvider;
                    
                    if (providerToUse) {
                        // Create ethers provider from ethereum but don't connect yet
                        this.provider = new ethers.providers.Web3Provider(providerToUse);
                        console.log("Created ethers provider (not connected)");
                        
                        // Only register events - DO NOT check for accounts/permissions here
                        // to avoid triggering MetaMask popup without user action
                        this._registerProviderEvents(providerToUse);
                    }
                }
            } catch (error) {
                console.error("Failed to initialize Ethers provider:", error);
            }
        }
        
        /**
         * Connect to wallet
         */
        async connect() {
            if (this.isConnecting) {
                console.log('Connection already in progress');
                return false;
            }
            
            // Disconnect any existing connection first
            if (this.isConnected()) {
                console.log('Disconnecting previous connection first');
                await this.disconnect();
            }
            
            this.isConnecting = true;
            this.lastError = null;
            
            try {
                let provider = null;
                
                // First try using Web3Modal if available
                if (this.web3Modal) {
                    try {
                        console.log('Opening Web3Modal wallet selector...');
                        provider = await this.web3Modal.connect();
                        this.isWeb3ModalConnection = true;
                        console.log('User selected wallet via Web3Modal');
                    } catch (e) {
                        // Don't throw here - this could just be user rejecting the modal
                        console.warn('Web3Modal error or user cancelled:', e.message || e);
                        
                        // Check if this was user cancellation (common error)
                        if (e.message && (
                            e.message.includes('User closed modal') || 
                            e.message.includes('User rejected') ||
                            e.message.includes('User denied'))
                        ) {
                            throw new Error('Wallet connection cancelled by user. Please try again.');
                        }
                        
                        // For other errors, fall back to direct provider
                        console.log('Falling back to direct provider connection');
                    }
                }
                
                // Fall back to direct provider if Web3Modal failed or isn't available
                if (!provider && window.ethereum) {
                    console.log('Using direct injected provider connection');
                    provider = window.ethereum;
                    this.isWeb3ModalConnection = false;
                }
                
                // If we still don't have a provider, we can't proceed
                if (!provider) {
                    throw new Error('No wallet provider detected. Please install MetaMask or another Web3 wallet.');
                }
                
                console.log('Provider obtained:', provider);
                
                // Update the provider instance and request accounts
                this.provider = new ethers.providers.Web3Provider(provider);
                
                // Register event listeners
                this._registerProviderEvents(provider);
                
                // Request accounts - this will prompt the user to connect if not already connected
                try {
                    console.log('Requesting accounts from wallet...');
                    const accounts = await provider.request({ method: 'eth_requestAccounts' });
                    
                    if (!accounts || accounts.length === 0) {
                        throw new Error('No accounts returned from wallet. Please make sure your wallet is unlocked.');
                    }
                    
                    this.selectedAccount = accounts[0];
                    console.log('Connected to account:', this.selectedAccount);
                    
                    // Get chain ID
                    this.chainId = await provider.request({ method: 'eth_chainId' });
                    if (typeof this.chainId === 'string' && this.chainId.startsWith('0x')) {
                        this.chainId = parseInt(this.chainId, 16);
                    }
                    
                    // Emit connection event
                    this._emitEvent('accountsChanged', { account: this.selectedAccount });
                    
                    return true;
                } catch (requestError) {
                    // Handle user rejection
                    if (requestError.code === 4001) {
                        throw new Error('You rejected the connection request. Please try again and confirm the connection in your wallet.');
                    }
                    // Handle already pending
                    else if (requestError.code === -32002) {
                        throw new Error('Connection request already pending. Please check your wallet and approve the connection.');
                    }
                    // Other errors
                    throw requestError;
                }
            } catch (error) {
                console.error('Error connecting wallet:', error);
                this.lastError = error.message || 'Unknown wallet connection error';
                this.isConnecting = false;
                throw error;
            } finally {
                this.isConnecting = false;
            }
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