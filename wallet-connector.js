/**
 * wallet-connector.js - REAL Privy JS SDK Core wallet connection implementation
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
         * Initialize the Privy connector - REAL PRIVY JS SDK CORE ONLY
         */
        async initialize(config = {}) {
            if (this.initialized) return true;

            try {
                console.log("Initializing REAL Privy JS SDK Core wallet connector...");
                console.log("⚠️ This application uses ONLY REAL Privy wallet connections!");
                console.log("⚠️ MetaMask and other wallet extensions are NOT supported!");
                
                // Wait for REAL Privy JS SDK Core to be available
                this.privy = await window.privySDKPromise;
                
                if (!this.privy) {
                    throw new Error("REAL Privy JS SDK Core not available");
                }
                
                console.log("✅ REAL Privy JS SDK Core initialized successfully");
                this.initialized = true;
                
                // Check if user is already authenticated
                await this._checkAuthState();
                
                console.log("✅ Privy wallet connector initialization completed");
                return true;
                
            } catch (error) {
                console.error("❌ Privy wallet connector initialization failed:", error);
                this.lastError = error.message || "Privy wallet connector initialization failed";
                throw error;
            }
        }

        /**
         * Check current authentication state
         */
        async _checkAuthState() {
            try {
                // Get user from Privy JS SDK Core
                const userResult = await this.privy.user.get();
                if (userResult && userResult.user) {
                    this.user = userResult.user;
                    this.authenticated = true;
                    console.log("👤 User already authenticated:", this.user);
                    
                    // Check for embedded wallet
                    await this._setupWalletFromUser();
                }
            } catch (error) {
                console.log("ℹ️ No existing authentication found");
            }
        }

        /**
         * Setup wallet from authenticated user
         */
        async _setupWalletFromUser() {
            if (!this.user) return;

            try {
                // Look for embedded wallet in user's linked accounts
                const embeddedWallet = this._getUserEmbeddedWallet(this.user);
                if (embeddedWallet) {
                    this.selectedAccount = embeddedWallet.address;
                    this.wallets = [embeddedWallet];
                    
                    // Get provider from Privy JS SDK Core
                    try {
                        this.provider = await this.privy.embeddedWallet.getProvider(embeddedWallet);
                        console.log("📱 Embedded wallet provider obtained:", this.selectedAccount);
                    } catch (providerError) {
                        console.warn("⚠️ Could not get wallet provider:", providerError);
                    }
                    
                    console.log("📱 Embedded wallet found:", this.selectedAccount);
                    
                    this._emitEvent('connected', {
                        address: this.selectedAccount,
                        provider: this.provider,
                        user: this.user
                    });
                }
            } catch (error) {
                console.warn("⚠️ Could not setup wallet from user:", error);
            }
        }

        /**
         * Helper to get embedded wallet from user (using getUserEmbeddedWallet if available)
         */
        _getUserEmbeddedWallet(user) {
            if (!user || !user.linked_accounts) return null;
            
            // Try to use the built-in function if available
            if (window.PrivyJSSDKCore && window.PrivyJSSDKCore.getUserEmbeddedWallet) {
                try {
                    return window.PrivyJSSDKCore.getUserEmbeddedWallet(user);
                } catch (error) {
                    console.warn("Could not use getUserEmbeddedWallet, falling back to manual search");
                }
            }
            
            // Manual search
            return user.linked_accounts.find(account => 
                account.type === 'wallet' && 
                account.wallet_client === 'privy'
            );
        }

        /**
         * Connect wallet through REAL Privy JS SDK Core
         */
        async connect() {
            if (this.isConnecting) {
                console.log("Connection already in progress...");
                return false;
            }

            try {
                this.isConnecting = true;
                this.lastError = null;

                console.log("🔗 Connecting wallet through REAL Privy JS SDK Core...");
                console.log("✅ This application supports ONLY REAL Privy wallet connections!");

                if (!this.initialized) {
                    await this.initialize();
                }

                return await this._connectPrivy();

            } catch (error) {
                console.error("❌ Wallet connection failed:", error);
                this.lastError = error.message || "Wallet connection failed";
                throw error;
            } finally {
                this.isConnecting = false;
            }
        }

        /**
         * Connect using REAL Privy JS SDK Core
         */
        async _connectPrivy() {
            try {
                console.log("🚀 Starting REAL Privy connection flow...");

                if (!this.privy) {
                    throw new Error("Privy not initialized");
                }

                // Check if already authenticated
                const userResult = await this.privy.user.get();
                if (userResult && userResult.user) {
                    console.log("✅ User already authenticated, setting up wallet...");
                    this.user = userResult.user;
                    this.authenticated = true;
                    await this._setupWalletFromUser();
                    return true;
                }

                // Try email login (simplest method for JS SDK Core)
                const email = prompt('Enter your email for Privy login:');
                if (!email) {
                    throw new Error('Email is required for Privy login');
                }

                console.log("📧 Sending code to email:", email);
                
                // Send verification code using JS SDK Core
                await this.privy.auth.email.sendCode(email);
                
                const code = prompt('Enter the verification code sent to your email:');
                if (!code) {
                    throw new Error('Verification code is required');
                }

                console.log("🔐 Verifying email code...");
                
                // Login with code using JS SDK Core
                const { user, is_new_user } = await this.privy.auth.email.loginWithCode(email, code);
                
                if (!user) {
                    throw new Error("Privy authentication failed");
                }

                console.log("✅ REAL Privy authentication successful:", user);
                this.user = user;
                this.authenticated = true;

                // Check if user has embedded wallet
                let embeddedWallet = this._getUserEmbeddedWallet(user);
                
                if (!embeddedWallet) {
                    console.log("🔧 Creating embedded wallet...");
                    const walletResult = await this.privy.embeddedWallet.create();
                    
                    // Refresh user data to get the new wallet
                    const updatedUserResult = await this.privy.user.get();
                    this.user = updatedUserResult.user;
                    embeddedWallet = this._getUserEmbeddedWallet(this.user);
                }

                if (embeddedWallet) {
                    this.selectedAccount = embeddedWallet.address;
                    this.wallets = [embeddedWallet];
                    
                    // Get provider
                    try {
                        this.provider = await this.privy.embeddedWallet.getProvider(embeddedWallet);
                    } catch (providerError) {
                        console.warn("⚠️ Could not get wallet provider:", providerError);
                    }
                    
                    console.log("✅ Wallet connected successfully via REAL Privy JS SDK Core:", this.selectedAccount);
                    
                    // Emit success event
                    this._emitEvent('connected', {
                        address: this.selectedAccount,
                        provider: this.provider,
                        user: this.user
                    });

                    return true;
                } else {
                    throw new Error("Failed to create or access embedded wallet");
                }

            } catch (error) {
                console.error("❌ Privy connection failed:", error);
                throw new Error("Privy connection failed: " + error.message);
            }
        }

        /**
         * Disconnect wallet
         */
        async disconnect() {
            try {
                console.log("🚪 Disconnecting REAL Privy wallet...");

                if (this.privy && this.authenticated) {
                    await this.privy.logout();
                }

                // Reset state
                this.authenticated = false;
                this.user = null;
                this.selectedAccount = null;
                this.provider = null;
                this.wallets = [];

                // Emit disconnect event
                this._emitEvent('disconnected', {});

                console.log("✅ Wallet disconnected successfully");
                return true;

            } catch (error) {
                console.error("❌ Disconnect failed:", error);
                this.lastError = error.message || "Disconnect failed";
                return false;
            }
        }

        /**
         * Check if wallet is connected
         */
        isConnected() {
            return this.authenticated && this.selectedAccount && this.provider;
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
         * Get Ethereum provider
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
         * Get current user
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
         * Emit wallet event
         */
        _emitEvent(eventName, detail = {}) {
            // Call wallet listeners
            this.walletListeners.forEach(callback => {
                try {
                    callback({ type: eventName, detail });
                } catch (error) {
                    console.error("Wallet listener error:", error);
                }
            });

            // Dispatch custom event
            const event = new CustomEvent(`privy-wallet-${eventName}`, { detail });
            window.dispatchEvent(event);
        }

        /**
         * Send transaction
         */
        async sendTransaction(transactionRequest) {
            if (!this.provider) {
                throw new Error("Provider not available");
            }

            try {
                console.log("📤 Sending transaction via REAL Privy...", transactionRequest);
                
                const txHash = await this.provider.request({
                    method: 'eth_sendTransaction',
                    params: [transactionRequest]
                });
                
                console.log("✅ Transaction sent:", txHash);
                return txHash;
                
            } catch (error) {
                console.error("❌ Transaction failed:", error);
                throw error;
            }
        }

        /**
         * Sign message
         */
        async signMessage(message) {
            if (!this.provider || !this.selectedAccount) {
                throw new Error("Wallet not connected");
            }

            try {
                console.log("✍️ Signing message via REAL Privy...", message);
                
                const signature = await this.provider.request({
                    method: 'personal_sign',
                    params: [message, this.selectedAccount]
                });
                
                console.log("✅ Message signed");
                return signature;
                
            } catch (error) {
                console.error("❌ Message signing failed:", error);
                throw error;
            }
        }
    }

    // Create and attach wallet connector to window
    window.walletConnector = new PrivyWalletConnector();
    console.log("REAL Privy JS SDK Core wallet connector created and attached to window.walletConnector");

})(); 