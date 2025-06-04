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
        }

        /**
         * Initialize the Privy connector
         */
        async initialize(config = {}) {
            if (this.initialized) return true;

            try {
                console.log("Initializing Privy wallet connector...");
                
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

                // Wait for Privy SDK to be loaded
                await this._ensurePrivyLoaded();

                // Initialize Privy
                this.privy = new window.PrivySDK(privyConfig.appId, {
                    ...privyConfig.config,
                    onStateChange: (state) => {
                        this._handleStateChange(state);
                    }
                });

                await this.privy.initialize();

                // Check if user is already authenticated
                const authState = await this.privy.getAuthState();
                if (authState && authState.authenticated) {
                    this.authenticated = true;
                    this.user = authState.user;
                    this.wallets = authState.wallets || [];
                    
                    if (this.wallets.length > 0) {
                        this.selectedAccount = this.wallets[0].address;
                        // Set up provider
                        await this._setupProvider();
                    }
                }

                this.initialized = true;
                console.log("Privy wallet connector initialized successfully");
                return true;
            } catch (error) {
                console.error("Failed to initialize Privy wallet connector:", error);
                this.lastError = error.message || "Failed to initialize Privy wallet connector";
                return false;
            }
        }

        /**
         * Ensure Privy SDK is loaded
         */
        async _ensurePrivyLoaded() {
            if (window.PrivySDK) {
                console.log("Privy SDK already loaded");
                return true;
            }

            console.log("Loading Privy SDK...");
            
            return new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = 'https://cdn.jsdelivr.net/npm/@privy-io/js-sdk@1.69.0/dist/index.umd.js';
                script.async = true;
                script.onload = () => {
                    console.log("Privy SDK loaded successfully");
                    resolve(true);
                };
                script.onerror = (err) => {
                    console.error("Failed to load Privy SDK:", err);
                    reject(new Error("Failed to load Privy SDK"));
                };
                document.head.appendChild(script);
            });
        }

        /**
         * Handle Privy state changes
         */
        _handleStateChange(state) {
            console.log("Privy state changed:", state);
            
            this.authenticated = state.authenticated;
            this.user = state.user;
            this.wallets = state.wallets || [];
            
            if (this.authenticated && this.wallets.length > 0) {
                const wallet = this.wallets[0];
                if (wallet.address !== this.selectedAccount) {
                    this.selectedAccount = wallet.address;
                    this._setupProvider();
                    this._emitEvent('accountsChanged', { account: wallet.address });
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
                if (this.wallets.length > 0) {
                    // Get the embedded wallet provider from Privy
                    const wallet = this.wallets[0];
                    const walletProvider = await this.privy.getWalletProvider(wallet.id);
                    
                    if (walletProvider) {
                        this.provider = new ethers.providers.Web3Provider(walletProvider);
                        this.chainId = await this.provider.getNetwork().then(n => n.chainId);
                        console.log("Provider setup complete, chain ID:", this.chainId);
                    }
                }
            } catch (error) {
                console.error("Failed to setup provider:", error);
            }
        }

        /**
         * Connect wallet using Privy
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

                console.log("Starting Privy login...");
                
                // Start Privy login flow
                const authResult = await this.privy.login();
                
                if (authResult && authResult.authenticated) {
                    this.authenticated = true;
                    this.user = authResult.user;
                    this.wallets = authResult.wallets || [];
                    
                    if (this.wallets.length > 0) {
                        this.selectedAccount = this.wallets[0].address;
                        await this._setupProvider();
                        
                        // Emit account changed event
                        this._emitEvent('accountsChanged', { account: this.selectedAccount });
                        
                        console.log("Wallet connected successfully:", this.selectedAccount);
                        return true;
                    } else {
                        // No wallets yet, but user is authenticated
                        // Privy will create embedded wallet automatically
                        console.log("User authenticated, waiting for wallet creation...");
                        return true;
                    }
                } else {
                    console.log("Login cancelled or failed");
                    return false;
                }
            } catch (error) {
                console.error("Connection failed:", error);
                this.lastError = error.message || "Failed to connect wallet";
                return false;
            } finally {
                this.isConnecting = false;
            }
        }

        /**
         * Disconnect wallet
         */
        async disconnect() {
            try {
                console.log("Disconnecting wallet...");
                
                if (this.privy && this.authenticated) {
                    await this.privy.logout();
                }
                
                this.authenticated = false;
                this.user = null;
                this.wallets = [];
                this.selectedAccount = null;
                this.provider = null;
                this.chainId = null;
                
                this._emitEvent('walletDisconnected', {});
                
                console.log("Wallet disconnected successfully");
                return true;
            } catch (error) {
                console.error("Failed to disconnect wallet:", error);
                this.lastError = error.message || "Failed to disconnect wallet";
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