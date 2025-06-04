/**
 * Real Privy Wallet Connector - NO STUBS OR SIMULATIONS
 * This connects ONLY to real Privy SDK for production use
 */
class PrivyWalletConnector {
    constructor() {
        this.privy = null;
        this.provider = null;
        this.authenticated = false;
        this.user = null;
        this.selectedAccount = null;
        this.wallets = [];
        this.chainId = null;
        this.lastError = null;
        this.initialized = false;
        this.listeners = new Map();
        
        console.log("🔧 Real Privy wallet connector created");
    }

    /**
     * Initialize the wallet connector with Privy
     */
    async initialize(config = {}) {
        try {
            console.log("Initializing Real Privy wallet connector...");
            console.log("⚠️ This application uses ONLY real Privy wallet connections!");
            console.log("⚠️ No simulations, stubs, or fallbacks are provided!");

            // Load configuration
            const privyConfig = {
                appId: config.appId || window.seismicConfig?.privyAppId || 'cmbhhu8sr00mojr0l66siei2z',
                config: {
                    appearance: {
                        theme: 'dark',
                        accentColor: '#6366f1',
                    },
                    loginMethods: ['wallet', 'email'],
                    embeddedWallets: {
                        createOnLogin: 'users-without-wallets',
                    },
                    ...config
                }
            };

            await this._initializePrivy(privyConfig);
            
            this.initialized = true;
            console.log("✅ Real Privy wallet connector initialization completed");
            
        } catch (error) {
            console.error("❌ Failed to initialize Privy wallet connector:", error);
            this.lastError = error;
            throw error;
        }
    }

    /**
     * Initialize Real Privy SDK - NO FALLBACKS
     */
    async _initializePrivy(privyConfig) {
        try {
            console.log("🔧 Initializing Real Privy SDK with config:", privyConfig.appId);
            
            // Wait for real Privy SDK to load
            const PrivySDK = await window.privySDKPromise;
            
            if (!PrivySDK || !PrivySDK.PrivyProvider) {
                throw new Error("Real Privy SDK not available - no fallbacks provided");
            }

            console.log("✅ Real Privy SDK loaded, creating provider...");
            
            // Create real Privy provider
            this.privy = new PrivySDK.PrivyProvider(privyConfig.appId, {
                ...privyConfig.config,
                onStateChange: (state) => this._handleStateChange(state)
            });

            console.log("✅ Real Privy provider created successfully");

            // Check if user is already authenticated
            if (this.privy.authenticated) {
                console.log("👤 User already authenticated");
                this.authenticated = true;
                this.user = this.privy.user;
                await this._setupWallets();
            }

        } catch (error) {
            console.error("❌ Failed to initialize real Privy SDK:", error);
            throw error;
        }
    }

    /**
     * Handle Real Privy state changes
     */
    _handleStateChange(state) {
        console.log("📱 Real Privy state changed:", state);
        
        this.authenticated = state.authenticated;
        this.user = state.user;

        if (this.authenticated && this.user) {
            this._setupWallets();
            this._emitEvent('accountsChanged', { 
                account: this.selectedAccount,
                user: this.user 
            });
        } else {
            // User logged out
            this.selectedAccount = null;
            this.provider = null;
            this.wallets = [];
            this._emitEvent('walletDisconnected', {});
        }
    }

    /**
     * Set up wallets from authenticated user
     */
    async _setupWallets() {
        try {
            if (this.user && this.user.linkedAccounts) {
                this.wallets = this.user.linkedAccounts.filter(account => 
                    account.type === 'wallet' || account.type === 'smart_wallet'
                );
                
                if (this.wallets.length > 0) {
                    this.selectedAccount = this.wallets[0].address;
                    console.log("📱 Wallet found:", this.selectedAccount);
                    await this._setupProvider();
                }
            }
        } catch (error) {
            console.error("❌ Error setting up wallets:", error);
            this.lastError = error;
        }
    }

    /**
     * Set up real ethers provider from Privy
     */
    async _setupProvider() {
        try {
            if (!this.privy.getEthereumProvider) {
                throw new Error("Real Privy provider does not support getEthereumProvider");
            }

            const privyProvider = await this.privy.getEthereumProvider();
            this.provider = new ethers.providers.Web3Provider(privyProvider);
            
            const network = await this.provider.getNetwork();
            this.chainId = network.chainId;
            
            console.log("✅ Real Privy provider set up successfully");
            console.log("🌐 Connected to network:", network.name, "Chain ID:", this.chainId);
            
        } catch (error) {
            console.error("❌ Failed to setup real provider:", error);
            this.lastError = error;
            throw error;
        }
    }

    /**
     * Connect wallet through Real Privy
     */
    async connect() {
        try {
            console.log("🔗 Connecting wallet through Real Privy...");
            console.log("✅ This application supports ONLY real Privy wallet connections!");

            if (!this.initialized) {
                throw new Error("Connector not initialized");
            }

            if (!this.privy) {
                throw new Error("Real Privy not available");
            }

            return await this._connectPrivy();

        } catch (error) {
            console.error("❌ Wallet connection failed:", error);
            this.lastError = error;
            throw error;
        }
    }

    /**
     * Connect through Real Privy
     */
    async _connectPrivy() {
        try {
            console.log("🚀 Starting Real Privy connection flow...");

            // Use real Privy login
            const user = await this.privy.login();
            
            console.log("✅ Real Privy login successful:", user);

            this.authenticated = true;
            this.user = user;
            
            await this._setupWallets();

            if (!this.selectedAccount) {
                throw new Error("No wallet found after Privy login");
            }

            console.log("📱 Selected wallet address:", this.selectedAccount);
            console.log("✅ Real wallet connected successfully via Privy:", this.selectedAccount);

            this._emitEvent('walletConnected', {
                address: this.selectedAccount,
                user: this.user,
                provider: this.provider
            });

            return {
                address: this.selectedAccount,
                user: this.user,
                provider: this.provider
            };

        } catch (error) {
            console.error("❌ Real Privy connection failed:", error);
            this.lastError = error;
            throw error;
        }
    }

    /**
     * Disconnect wallet
     */
    async disconnect() {
        try {
            console.log("🔌 Disconnecting wallet...");

            if (this.privy && this.privy.logout) {
                await this.privy.logout();
            }

            this.authenticated = false;
            this.user = null;
            this.selectedAccount = null;
            this.provider = null;
            this.wallets = [];
            this.chainId = null;
            this.lastError = null;

            this._emitEvent('walletDisconnected', {});
            console.log("✅ Wallet disconnected successfully");

        } catch (error) {
            console.error("❌ Error disconnecting wallet:", error);
            this.lastError = error;
            throw error;
        }
    }

    /**
     * Check if wallet is connected
     */
    isConnected() {
        return this.authenticated && !!this.selectedAccount;
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
     * Get Privy user
     */
    getUser() {
        return this.user;
    }

    /**
     * Get available wallets
     */
    getWallets() {
        return this.wallets;
    }

    /**
     * Add event listener
     */
    addWalletListener(callback) {
        const id = Date.now() + Math.random();
        this.listeners.set(id, callback);
        return id;
    }

    /**
     * Remove event listener
     */
    removeWalletListener(id) {
        return this.listeners.delete(id);
    }

    /**
     * Emit event to all listeners
     */
    _emitEvent(eventName, detail = {}) {
        console.log(`📡 Emitting event: ${eventName}`, detail);
        
        this.listeners.forEach(callback => {
            try {
                callback({ type: eventName, detail });
            } catch (error) {
                console.error("Error in event listener:", error);
            }
        });
    }

    /**
     * Send transaction using real provider
     */
    async sendTransaction(transactionRequest) {
        try {
            if (!this.provider) {
                throw new Error("No provider available");
            }

            const signer = this.provider.getSigner();
            const tx = await signer.sendTransaction(transactionRequest);
            
            console.log("📤 Transaction sent:", tx.hash);
            return tx;

        } catch (error) {
            console.error("❌ Transaction failed:", error);
            this.lastError = error;
            throw error;
        }
    }

    /**
     * Sign message using real provider
     */
    async signMessage(message) {
        try {
            if (!this.provider) {
                throw new Error("No provider available");
            }

            const signer = this.provider.getSigner();
            const signature = await signer.signMessage(message);
            
            console.log("✍️ Message signed");
            return signature;

        } catch (error) {
            console.error("❌ Message signing failed:", error);
            this.lastError = error;
            throw error;
        }
    }
}

// Create and attach to window for global access
window.walletConnector = new PrivyWalletConnector();
console.log("Real Privy wallet connector created and attached to window.walletConnector"); 