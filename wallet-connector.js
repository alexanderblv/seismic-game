/**
 * wallet-connector.js - Privy wallet connection implementation
 */

(function() {
    class PrivyWalletConnector {
        constructor() {
            this.privy = null;
            this.provider = null;
            this.selectedAccount = null;
            this.chainId = null;
            this.initialized = false;
            this.isConnecting = false;
            this.lastError = null;
            this.walletListeners = [];
            this.authenticated = false;
            this.user = null;
            this.wallets = [];
            this.fallbackMode = false;
        }

        /**
         * Initialize the Privy connector
         */
        async initialize(config = {}) {
            if (this.initialized) return true;

            try {
                console.log("Initializing Privy wallet connector...");
                
                // Wait for Privy SDK check (but expect it to resolve with null)
                console.log("Checking for Privy SDK availability...");
                try {
                    const privySDK = await window.privySDKPromise;
                    
                    if (!privySDK) {
                        console.log("Privy SDK not available, using fallback mode");
                        this.fallbackMode = true;
                        return this._initializeFallback();
                    }
                    
                    // If we somehow got a Privy SDK, try to use it
                    window.PrivySDK = privySDK;
                    console.log("Privy SDK available, attempting to initialize");
                } catch (privyError) {
                    console.warn("Privy SDK promise failed:", privyError);
                    this.fallbackMode = true;
                    return this._initializeFallback();
                }
                
                // Check if Privy SDK is actually available and usable
                if (!window.PrivySDK && !window.Privy) {
                    console.log("No Privy SDK found, using fallback mode");
                    this.fallbackMode = true;
                    return this._initializeFallback();
                }
                
                // At this point, try to initialize with Privy
                try {
                    await this._initializePrivy(config);
                    console.log("Privy wallet connector initialized successfully");
                    return true;
                } catch (privyInitError) {
                    console.warn("Privy initialization failed, falling back:", privyInitError);
                    this.fallbackMode = true;
                    return this._initializeFallback();
                }
                
            } catch (error) {
                console.error("Failed to initialize wallet connector:", error);
                this.lastError = error.message || "Failed to initialize wallet connector";
                
                // Always try fallback mode as a last resort
                this.fallbackMode = true;
                return this._initializeFallback();
            }
        }

        /**
         * Initialize with Privy SDK
         */
        async _initializePrivy(config = {}) {
            // Get Privy configuration
            const privyConfig = window.seismicConfig?.privy || config.privy || {
                appId: "cmbhhu8sr00mojr0l66siei2z",
                config: {
                    loginMethods: ['email', 'wallet', 'sms', 'google', 'github'],
                    appearance: {
                        theme: 'light',
                        accentColor: '#3B82F6',
                    },
                    embeddedWallets: {
                        createOnLogin: 'users-without-wallets',
                        requireUserPasswordOnCreate: false
                    },
                    supportedChains: [5124],
                    defaultChain: 5124
                }
            };

            // Try to initialize Privy with error handling
            const PrivyClass = window.PrivySDK.PrivyProvider || window.PrivySDK || window.Privy;
            
            if (typeof PrivyClass === 'function') {
                this.privy = new PrivyClass(privyConfig.appId, {
                    ...privyConfig.config,
                    onStateChange: (state) => {
                        this._handleStateChange(state);
                    }
                });
            } else if (PrivyClass && typeof PrivyClass.init === 'function') {
                // Alternative initialization method
                this.privy = await PrivyClass.init(privyConfig.appId, privyConfig.config);
            } else {
                throw new Error("Privy SDK constructor not found");
            }

            // Check if user is already authenticated
            if (this.privy && this.privy.authenticated) {
                this.authenticated = true;
                this.user = this.privy.user;
                
                // Get wallets from user
                if (this.user && this.user.linkedAccounts) {
                    this.wallets = this.user.linkedAccounts.filter(account => 
                        account.type === 'wallet' || account.type === 'smart_wallet'
                    );
                    
                    if (this.wallets.length > 0) {
                        this.selectedAccount = this.wallets[0].address;
                        // Set up provider
                        await this._setupProvider();
                    }
                }
            }

            this.initialized = true;
        }

        /**
         * Initialize fallback mode without Privy
         */
        async _initializeFallback() {
            try {
                console.log("Initializing fallback wallet connector (without Privy)...");
                
                // Check if MetaMask or other wallet is available
                if (typeof window.ethereum !== 'undefined') {
                    this.provider = new ethers.providers.Web3Provider(window.ethereum);
                    
                    // Check if already connected
                    try {
                        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                        if (accounts && accounts.length > 0) {
                            this.selectedAccount = accounts[0];
                            const network = await this.provider.getNetwork();
                            this.chainId = network.chainId;
                            this.authenticated = true;
                        }
                    } catch (e) {
                        console.log("No existing connection found");
                    }
                    
                    // Set up event listeners for wallet events
                    window.ethereum.on('accountsChanged', (accounts) => {
                        if (accounts.length > 0) {
                            this.selectedAccount = accounts[0];
                            this._emitEvent('accountsChanged', { account: accounts[0] });
                        } else {
                            this.selectedAccount = null;
                            this.authenticated = false;
                            this._emitEvent('walletDisconnected', {});
                        }
                    });
                    
                    window.ethereum.on('chainChanged', (chainId) => {
                        this.chainId = parseInt(chainId, 16);
                        this._emitEvent('networkChanged', { chainId: this.chainId });
                    });
                    
                    this.initialized = true;
                    console.log("Fallback wallet connector initialized");
                    return true;
                } else {
                    throw new Error("No wallet provider available");
                }
            } catch (error) {
                console.error("Fallback initialization failed:", error);
                this.lastError = "No wallet provider available";
                return false;
            }
        }

        /**
         * Handle Privy state changes
         */
        _handleStateChange(state) {
            console.log("Privy state changed:", state);
            
            this.authenticated = state.authenticated || this.privy.authenticated;
            this.user = state.user || this.privy.user;
            
            if (this.authenticated && this.user && this.user.linkedAccounts) {
                this.wallets = this.user.linkedAccounts.filter(account => 
                    account.type === 'wallet' || account.type === 'smart_wallet'
                );
                
                if (this.wallets.length > 0) {
                    const wallet = this.wallets[0];
                    if (wallet.address !== this.selectedAccount) {
                        this.selectedAccount = wallet.address;
                        this._setupProvider();
                        this._emitEvent('accountsChanged', { account: wallet.address });
                    }
                }
            } else if (!this.authenticated) {
                this.selectedAccount = null;
                this.provider = null;
                this._emitEvent('walletDisconnected', {});
            }
        }

        /**
         * Setup ethers provider
         */
        async _setupProvider() {
            try {
                if (this.wallets.length > 0 && this.privy) {
                    // Get the wallet provider from Privy
                    const wallet = this.wallets[0];
                    const walletProvider = await this.privy.getEthereumProvider();
                    
                    if (walletProvider) {
                        this.provider = new ethers.providers.Web3Provider(walletProvider);
                        const network = await this.provider.getNetwork();
                        this.chainId = network.chainId;
                        console.log("Provider setup complete, chain ID:", this.chainId);
                    }
                }
            } catch (error) {
                console.error("Failed to setup provider:", error);
            }
        }

        /**
         * Connect wallet using Privy or fallback mode
         */
        async connect() {
            if (this.isConnecting) {
                console.log("Connection already in progress");
                return false;
            }

            if (!this.initialized) {
                console.log("Initializing before connect...");
                await this.initialize();
            }

            try {
                this.isConnecting = true;
                this.lastError = null;

                if (this.fallbackMode) {
                    console.log("Starting fallback wallet connection...");
                    return await this._connectFallback();
                } else {
                    console.log("Starting Privy login...");
                    return await this._connectPrivy();
                }
            } catch (error) {
                console.error("Error during wallet connection:", error);
                this.lastError = error.message || "Connection failed";
                return false;
            } finally {
                this.isConnecting = false;
            }
        }

        /**
         * Connect using Privy
         */
        async _connectPrivy() {
            try {
                if (!this.privy) {
                    throw new Error("Privy not initialized");
                }

                // Start Privy login flow
                await this.privy.login();
                
                // After login, check authentication state
                if (this.privy.authenticated) {
                    this.authenticated = true;
                    this.user = this.privy.user;
                    
                    // Get wallets from user
                    if (this.user && this.user.linkedAccounts) {
                        this.wallets = this.user.linkedAccounts.filter(account => 
                            account.type === 'wallet' || account.type === 'smart_wallet'
                        );
                        
                        if (this.wallets.length > 0) {
                            this.selectedAccount = this.wallets[0].address;
                            await this._setupProvider();
                            
                            // Emit account changed event
                            this._emitEvent('accountsChanged', { account: this.selectedAccount });
                            
                            console.log("Wallet connected successfully via Privy:", this.selectedAccount);
                            return true;
                        } else {
                            // No wallets yet, but user is authenticated
                            // Privy will create embedded wallet automatically
                            console.log("User authenticated, waiting for wallet creation...");
                            return true;
                        }
                    }
                } else {
                    console.log("Privy login cancelled or failed");
                    return false;
                }
            } catch (error) {
                console.error("Error during Privy login:", error);
                throw error;
            }
        }

        /**
         * Connect using fallback mode (MetaMask/injected wallet)
         */
        async _connectFallback() {
            try {
                if (!window.ethereum) {
                    throw new Error("No wallet provider found. Please install MetaMask or another wallet.");
                }

                console.log("Requesting wallet connection...");
                
                // Request account access
                const accounts = await window.ethereum.request({ 
                    method: 'eth_requestAccounts' 
                });
                
                if (accounts && accounts.length > 0) {
                    this.selectedAccount = accounts[0];
                    this.authenticated = true;
                    
                    // Update provider and chain info
                    this.provider = new ethers.providers.Web3Provider(window.ethereum);
                    const network = await this.provider.getNetwork();
                    this.chainId = network.chainId;
                    
                    // Emit account changed event
                    this._emitEvent('accountsChanged', { account: this.selectedAccount });
                    
                    console.log("Wallet connected successfully via fallback:", this.selectedAccount);
                    return true;
                } else {
                    throw new Error("No accounts returned from wallet");
                }
            } catch (error) {
                if (error.code === 4001) {
                    throw new Error("User rejected the connection request");
                } else if (error.code === -32002) {
                    throw new Error("Connection request already pending. Please check your wallet.");
                } else {
                    throw error;
                }
            }
        }

        /**
         * Disconnect from wallet (Privy or fallback)
         */
        async disconnect() {
            try {
                console.log("Disconnecting from wallet...");

                if (this.fallbackMode) {
                    // For fallback mode, we can't really "disconnect" from MetaMask
                    // We just clear our internal state
                    console.log("Clearing fallback connection state...");
                } else if (this.privy && this.privy.authenticated) {
                    console.log("Logging out from Privy...");
                    await this.privy.logout();
                }

                // Clear internal state
                this.authenticated = false;
                this.user = null;
                this.wallets = [];
                this.selectedAccount = null;
                this.provider = null;
                this.chainId = null;

                // Emit disconnection event
                this._emitEvent('walletDisconnected', {});

                console.log("Successfully disconnected from wallet");
                return true;
            } catch (error) {
                console.error("Error disconnecting from wallet:", error);
                this.lastError = error.message || "Failed to disconnect";
                return false;
            }
        }

        /**
         * Check if wallet is connected
         */
        isConnected() {
            return this.authenticated && this.selectedAccount !== null;
        }

        /**
         * Get selected account address
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
         * Get ethers provider
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
         * Get user info
         */
        getUser() {
            return this.user;
        }

        /**
         * Get all wallets
         */
        getWallets() {
            return this.wallets;
        }

        /**
         * Add wallet event listener
         */
        addWalletListener(callback) {
            if (typeof callback === 'function') {
                this.walletListeners.push(callback);
                console.log(`Added wallet listener. Total listeners: ${this.walletListeners.length}`);
            }
        }

        /**
         * Remove wallet event listener
         */
        removeWalletListener(callback) {
            const index = this.walletListeners.indexOf(callback);
            if (index > -1) {
                this.walletListeners.splice(index, 1);
                console.log(`Removed wallet listener. Total listeners: ${this.walletListeners.length}`);
            }
        }

        /**
         * Emit event to listeners and DOM
         */
        _emitEvent(eventName, detail = {}) {
            // Call registered listeners
            this.walletListeners.forEach(listener => {
                try {
                    listener(eventName, detail);
                } catch (error) {
                    console.error('Error in wallet listener:', error);
                }
            });

            // Emit DOM event
            const customEvent = new CustomEvent(`wallet:${eventName}`, {
                detail: detail,
                bubbles: true
            });
            document.dispatchEvent(customEvent);
        }

        /**
         * Send transaction using Privy
         */
        async sendTransaction(transactionRequest) {
            if (!this.isConnected()) {
                throw new Error("Wallet not connected");
            }

            try {
                if (this.provider) {
                    const signer = this.provider.getSigner();
                    return await signer.sendTransaction(transactionRequest);
                } else {
                    throw new Error("Provider not available");
                }
            } catch (error) {
                console.error("Transaction failed:", error);
                throw error;
            }
        }

        /**
         * Sign message using Privy
         */
        async signMessage(message) {
            if (!this.isConnected()) {
                throw new Error("Wallet not connected");
            }

            try {
                if (this.provider) {
                    const signer = this.provider.getSigner();
                    return await signer.signMessage(message);
                } else {
                    throw new Error("Provider not available");
                }
            } catch (error) {
                console.error("Message signing failed:", error);
                throw error;
            }
        }
    }

    // Create global instance
    window.walletConnector = new PrivyWalletConnector();
    console.log("Privy wallet connector created and attached to window.walletConnector");

})(); 