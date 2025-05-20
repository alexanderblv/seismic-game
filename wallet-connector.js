/**
 * wallet-connector.js - Modern wallet connection implementation with support for multiple wallets
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
        }

        /**
         * Initialize the wallet connector
         */
        async initialize(config = {}) {
            if (this.initialized) return true;

            try {
                console.log("Initializing wallet connector...");
                
                // Project ID for WalletConnect (required for v2)
                const projectId = config.projectId || window.seismicConfig?.walletConnect?.projectId || "a85ac05209955cfd18fbe7c0fd018f23";
                
                // Get network configuration
                const networkConfig = window.seismicConfig?.network || config.network || {
                    chainId: 1,
                    name: "Ethereum",
                    rpcUrl: "https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161"
                };
                
                // Ensure Web3Modal is loaded
                await this._ensureWeb3ModalLoaded();
                
                // Create Web3Modal instance
                this._initializeWeb3Modal(projectId, networkConfig);
                
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
                return;
            }
            
            console.log("Web3Modal not found, attempting to load it dynamically");
            
            try {
                // Load required scripts
                await this._loadScript('https://unpkg.com/@walletconnect/web3-provider@1.8.0/dist/umd/index.min.js');
                await this._loadScript('https://cdn.jsdelivr.net/npm/web3modal@1.9.9/dist/index.min.js');
                
                // Check if loading was successful
                if (typeof window.Web3Modal !== 'function') {
                    console.warn("Failed to load Web3Modal, wallet connection may not work properly");
                } else {
                    console.log("Successfully loaded Web3Modal dynamically");
                }
            } catch (error) {
                console.error("Error loading Web3Modal:", error);
                throw new Error("Could not load Web3Modal. Wallet connection may not work properly.");
            }
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
            if (typeof window.Web3Modal === 'function') {
                try {
                    // Configure provider options
                    const providerOptions = {
                        walletconnect: {
                            package: window.WalletConnectProvider?.default || window.WalletConnectProvider,
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
                        }
                    };
                    
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
                    }
                    
                    // Create Web3Modal instance with safer options
                    this.web3Modal = new window.Web3Modal({
                        cacheProvider: false, // Disabled to prevent auto-connecting
                        providerOptions,
                        disableInjectedProvider: false, // Allow access to injected providers
                        theme: "dark"
                    });
                    
                    console.log("Web3Modal initialized successfully");
                } catch (error) {
                    console.error("Failed to initialize Web3Modal:", error);
                }
            } else {
                console.warn("Web3Modal not available");
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
                    await this.initialize();
                }
                
                if (!this.web3Modal) {
                    throw new Error("Web3Modal not initialized");
                }
                
                // Clear cached provider to prevent automatically connecting to the last used provider
                this.web3Modal.clearCachedProvider();
                
                // Disconnect existing provider if any
                if (this.provider) {
                    this._cleanupProvider();
                }
                
                // Connect using Web3Modal
                console.log("Opening Web3Modal to select wallet...");
                const provider = await this.web3Modal.connect();
                
                if (provider) {
                    this.provider = provider;
                    
                    // Register provider event listeners
                    this._registerProviderEvents(provider);
                    
                    // Update accounts and chain ID
                    const connected = await this._updateAccountsAndChain(provider);
                    
                    if (connected) {
                        console.log(`Successfully connected to wallet with address ${this.selectedAccount}`);
                    } else {
                        console.warn("Failed to get accounts from provider");
                    }
                } else {
                    console.warn("Provider is null after connection");
                }
                
                this.isConnecting = false;
                return !!this.selectedAccount;
            } catch (error) {
                console.error("Error connecting wallet:", error);
                this.lastError = error.message || "Failed to connect to wallet";
                this.isConnecting = false;
                return false;
            }
        }
        
        /**
         * Clean up existing provider
         */
        async _cleanupProvider() {
            if (!this.provider) return;
            
            try {
                // Attempt to disconnect current provider if possible
                if (typeof this.provider.disconnect === 'function') {
                    await this.provider.disconnect();
                }
                
                // Reset provider state
                this.provider = null;
                this.selectedAccount = null;
                this.chainId = null;
            } catch (e) {
                console.warn("Error cleaning up previous provider:", e);
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
                    
                    // Emit both events to ensure compatibility
                    this._emitEvent('walletConnected', { 
                        account: this.selectedAccount,
                        chainId: this.chainId
                    });
                    
                    this._emitEvent('accountsChanged', { 
                        account: this.selectedAccount
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
                
                // Clean up the provider
                await this._cleanupProvider();
                
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