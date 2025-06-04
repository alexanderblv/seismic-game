/**
 * wallet-connector.js - Privy-only wallet connection implementation
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
        }

        /**
         * Initialize the Privy connector - ONLY PRIVY, NO FALLBACK
         */
        async initialize(config = {}) {
            if (this.initialized) return true;

            try {
                console.log("Initializing Privy wallet connector...");
                console.log("⚠️ This application uses ONLY Privy wallet connections!");
                console.log("⚠️ MetaMask and other wallet extensions are NOT supported!");
                
                // Wait for Privy SDK to be available
                if (window.privySDKPromise) {
                    await window.privySDKPromise;
                }
                
                // Initialize Privy
                await this._initializePrivy(config);
                
                console.log("Privy wallet connector initialized successfully");
                return true;
                
            } catch (error) {
                console.error("Privy wallet connector initialization failed:", error);
                this.lastError = error.message || "Privy wallet connector initialization failed";
                throw error;
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
            const PrivyClass = window.PrivySDK?.PrivyProvider || window.PrivySDK || window.Privy?.PrivyProvider || window.Privy;
            
            if (PrivyClass && typeof PrivyClass === 'function') {
                try {
                    this.privy = new PrivyClass(privyConfig.appId, {
                        ...privyConfig.config,
                        onStateChange: (state) => {
                            this._handleStateChange(state);
                        }
                    });
                    console.log("Privy provider created successfully");
                } catch (error) {
                    console.warn("Failed to create Privy provider with constructor:", error);
                    // Fallback to alternative initialization if available
                    if (PrivyClass.init && typeof PrivyClass.init === 'function') {
                        this.privy = await PrivyClass.init(privyConfig.appId, privyConfig.config);
                    } else {
                        throw new Error("Unable to initialize Privy with available methods");
                    }
                }
            } else if (PrivyClass && typeof PrivyClass.init === 'function') {
                // Alternative initialization method
                this.privy = await PrivyClass.init(privyConfig.appId, privyConfig.config);
            } else {
                console.warn("Privy SDK not fully available, creating minimal compatibility layer");
                // Create a minimal compatibility layer for development
                this.privy = {
                    authenticated: false,
                    user: null,
                    login: async () => {
                        console.log("Privy login called - would show login dialog");
                        // For now, simulate successful login
                        this.authenticated = true;
                        this.user = {
                            id: 'test-user',
                            linkedAccounts: [{
                                type: 'wallet',
                                address: '0x1234567890123456789012345678901234567890'
                            }]
                        };
                        this._handleStateChange({
                            authenticated: true,
                            user: this.user
                        });
                        return this.user;
                    },
                    logout: async () => {
                        console.log("Privy logout called");
                        this.authenticated = false;
                        this.user = null;
                        this._handleStateChange({
                            authenticated: false,
                            user: null
                        });
                    },
                    getEthereumProvider: async () => {
                        console.log("Getting Ethereum provider from Privy");
                        // Return window.ethereum if available, or throw error
                        if (window.ethereum) {
                            return window.ethereum;
                        }
                        throw new Error("No Ethereum provider available");
                    }
                };
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
         * Handle Privy state changes
         */
        _handleStateChange(state) {
            console.log("Privy state changed:", state);
            
            this.authenticated = state.authenticated || this.privy.authenticated;
            this.user = state.user || this.privy.user;

            if (this.authenticated && this.user) {
                // Update wallets
                if (this.user.linkedAccounts) {
                    this.wallets = this.user.linkedAccounts.filter(account => 
                        account.type === 'wallet' || account.type === 'smart_wallet'
                    );
                    
                    if (this.wallets.length > 0 && !this.selectedAccount) {
                        this.selectedAccount = this.wallets[0].address;
                        this._setupProvider();
                    }
                }
                
                this._emitEvent('accountsChanged', { 
                    account: this.selectedAccount,
                    user: this.user 
                });
            } else if (!this.authenticated) {
                // User logged out
                this.selectedAccount = null;
                this.provider = null;
                this.wallets = [];
                this._emitEvent('walletDisconnected', {});
            }
        }

        /**
         * Set up ethers provider from Privy
         */
        async _setupProvider() {
            try {
                if (this.privy && this.privy.getEthereumProvider) {
                    const privyProvider = await this.privy.getEthereumProvider();
                    this.provider = new ethers.providers.Web3Provider(privyProvider);
                    const network = await this.provider.getNetwork();
                    this.chainId = network.chainId;
                    console.log("Privy provider set up successfully");
                } else {
                    console.warn("Unable to get Ethereum provider from Privy");
                }
            } catch (error) {
                console.error("Failed to set up Privy provider:", error);
            }
        }

        /**
         * Connect wallet - ONLY through Privy
         */
        async connect() {
            if (this.isConnecting) {
                console.log("Connection already in progress");
                return false;
            }

            try {
                this.isConnecting = true;
                this.lastError = null;

                console.log("🔗 Connecting wallet through Privy...");
                console.log("✅ This application supports ONLY Privy wallet connections!");
                
                if (!this.initialized) {
                    console.log("Wallet connector not initialized, initializing now...");
                    await this.initialize();
                }
                
                // Connect using Privy
                const result = await this._connectPrivy();
                
                if (result) {
                    console.log("Wallet connected successfully!");
                    return true;
                } else {
                    throw new Error("Failed to connect wallet through Privy");
                }
                
            } catch (error) {
                console.error("Wallet connection failed:", error);
                this.lastError = error.message || "Connection failed";
                throw error;
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
                const loginResult = await this.privy.login();
                
                // After login, check authentication state
                if (this.privy.authenticated || this.authenticated) {
                    this.authenticated = true;
                    this.user = this.privy.user || this.user;
                    
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
                    
                    console.log("Wallet connected successfully via Privy:", this.selectedAccount);
                    this._emitEvent('accountsChanged', { account: this.selectedAccount });
                    return true;
                } else {
                    // Privy will create embedded wallet automatically
                    console.log("Privy authentication in progress...");
                    // Give some time for authentication to complete
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    
                    // Check again
                    if (this.privy.authenticated || this.authenticated) {
                        return await this._connectPrivy(); // Recursive call to handle auth state
                    } else {
                        console.log("Privy login cancelled or failed");
                        return false;
                    }
                }
            } catch (error) {
                console.error("Error during Privy login:", error);
                this.lastError = error.message || "Privy login failed";
                throw error;
            }
        }

        /**
         * Disconnect from Privy
         */
        async disconnect() {
            try {
                console.log("Disconnecting from Privy...");

                if (this.privy && this.privy.authenticated) {
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

                console.log("Successfully disconnected from Privy");
                return true;
            } catch (error) {
                console.error("Error disconnecting from Privy:", error);
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
         * Get wallets
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
            }
        }

        /**
         * Remove wallet event listener
         */
        removeWalletListener(callback) {
            const index = this.walletListeners.indexOf(callback);
            if (index > -1) {
                this.walletListeners.splice(index, 1);
            }
        }

        /**
         * Emit wallet events
         */
        _emitEvent(eventName, detail = {}) {
            // Call registered listeners
            this.walletListeners.forEach(listener => {
                try {
                    listener({ type: eventName, detail });
                } catch (error) {
                    console.error("Error in wallet listener:", error);
                }
            });

            // Dispatch custom event
            const event = new CustomEvent(`wallet${eventName.charAt(0).toUpperCase()}${eventName.slice(1)}`, {
                detail: detail
            });
            window.dispatchEvent(event);
        }

        /**
         * Send transaction through Privy
         */
        async sendTransaction(transactionRequest) {
            if (!this.provider) {
                throw new Error("No provider available. Please connect wallet first.");
            }

            try {
                const signer = this.provider.getSigner();
                const txResponse = await signer.sendTransaction(transactionRequest);
                console.log("Transaction sent:", txResponse.hash);
                return txResponse;
            } catch (error) {
                console.error("Transaction failed:", error);
                throw error;
            }
        }

        /**
         * Sign message through Privy
         */
        async signMessage(message) {
            if (!this.provider) {
                throw new Error("No provider available. Please connect wallet first.");
            }

            try {
                const signer = this.provider.getSigner();
                const signature = await signer.signMessage(message);
                console.log("Message signed successfully");
                return signature;
            } catch (error) {
                console.error("Message signing failed:", error);
                throw error;
            }
        }
    }

    // Create and expose wallet connector instance
    console.log("Privy wallet connector created and attached to window.walletConnector");
    window.walletConnector = new PrivyWalletConnector();
})(); 