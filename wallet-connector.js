/**
 * wallet-connector.js - REAL Privy JS Core SDK wallet connection implementation
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
         * Initialize the Privy connector - REAL PRIVY JS CORE SDK ONLY
         */
        async initialize(config = {}) {
            if (this.initialized) return true;

            try {
                console.log("Initializing REAL Privy JS Core SDK wallet connector...");
                console.log("⚠️ This application uses ONLY REAL Privy wallet connections!");
                console.log("⚠️ MetaMask and other wallet extensions are NOT supported!");
                
                // Wait for REAL Privy JS Core SDK to be available
                this.privy = await window.privySDKPromise;
                
                if (!this.privy) {
                    throw new Error("REAL Privy JS Core SDK not available");
                }
                
                console.log("✅ REAL Privy JS Core SDK initialized successfully");
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
                if (this.privy.isReady) {
                    const user = await this.privy.user.get();
                    if (user && user.user) {
                        this.user = user.user;
                        this.authenticated = true;
                        console.log("👤 User already authenticated:", this.user);
                        
                        // Check for embedded wallet
                        await this._setupWalletFromUser();
                    }
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
                // Look for embedded wallet
                const embeddedWallet = this._getUserEmbeddedWallet(this.user);
                if (embeddedWallet) {
                    this.selectedAccount = embeddedWallet.address;
                    this.wallets = [embeddedWallet];
                    
                    // Get provider for embedded wallet
                    this.provider = await this.privy.embeddedWallet.getProvider(embeddedWallet);
                    console.log("📱 Embedded wallet found:", this.selectedAccount);
                    
                    this._emitEvent('connected', {
                        address: this.selectedAccount,
                        provider: this.provider,
                        user: this.user
                    });
                    
                    return true;
                }
            } catch (error) {
                console.warn("⚠️ Could not setup wallet from user:", error);
            }
            return false;
        }

        /**
         * Helper to get embedded wallet from user
         */
        _getUserEmbeddedWallet(user) {
            if (!user || !user.linked_accounts) return null;
            
            return user.linked_accounts.find(account => 
                account.type === 'wallet' && 
                account.wallet_client === 'privy'
            );
        }

        /**
         * Connect wallet through REAL Privy JS Core SDK
         */
        async connect() {
            if (this.isConnecting) {
                console.log("Connection already in progress...");
                return false;
            }

            try {
                this.isConnecting = true;
                this.lastError = null;

                console.log("🔗 Connecting wallet through REAL Privy JS Core SDK...");
                console.log("✅ This application supports ONLY REAL Privy wallet connections!");

                if (!this.initialized) {
                    await this.initialize();
                }

                // If already authenticated, just setup wallet
                if (this.authenticated && this.user) {
                    const walletSetup = await this._setupWalletFromUser();
                    if (walletSetup) {
                        return true;
                    }
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
         * Connect using REAL Privy JS Core SDK with UI-based authentication
         */
        async _connectPrivy() {
            try {
                console.log("🚀 Starting REAL Privy connection flow...");

                if (!this.privy) {
                    throw new Error("Privy not initialized");
                }

                // Create a UI modal for email input instead of using prompt()
                const email = await this._getEmailFromUser();
                if (!email) {
                    throw new Error('Email is required for Privy login');
                }

                console.log("📧 Sending code to email:", email);
                
                // Send verification code
                await this.privy.auth.email.sendCode(email);
                
                // Get verification code from user via UI
                const code = await this._getCodeFromUser();
                if (!code) {
                    throw new Error('Verification code is required');
                }

                console.log("🔐 Verifying email code...");
                
                // Login with code
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
                    const updatedUser = await this.privy.user.get();
                    this.user = updatedUser.user;
                    embeddedWallet = this._getUserEmbeddedWallet(this.user);
                }

                if (embeddedWallet) {
                    this.selectedAccount = embeddedWallet.address;
                    this.wallets = [embeddedWallet];
                    
                    // Get provider for embedded wallet
                    this.provider = await this.privy.embeddedWallet.getProvider(embeddedWallet);
                    
                    console.log("✅ Wallet connected successfully:", this.selectedAccount);
                    
                    this._emitEvent('connected', {
                        address: this.selectedAccount,
                        provider: this.provider,
                        user: this.user
                    });
                    
                    return true;
                } else {
                    throw new Error("Could not find or create embedded wallet");
                }

            } catch (error) {
                console.error("❌ Privy connection failed:", error);
                this.lastError = error.message || "Privy connection failed";
                throw error;
            }
        }

        /**
         * Get email from user via UI modal instead of prompt
         */
        async _getEmailFromUser() {
            return new Promise((resolve) => {
                // Create a simple modal for email input
                const modal = document.createElement('div');
                modal.className = 'modal fade show';
                modal.style.cssText = 'display: block; background: rgba(0,0,0,0.5); z-index: 10000;';
                modal.innerHTML = `
                    <div class="modal-dialog">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">🌊 Connect with Privy</h5>
                            </div>
                            <div class="modal-body">
                                <p>Enter your email to connect with Privy wallet:</p>
                                <input type="email" id="privy-email-input" class="form-control" placeholder="your@email.com" autofocus>
                                <div class="form-text">We'll send you a verification code</div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove(); resolve(null)">Cancel</button>
                                <button type="button" class="btn btn-primary" id="privy-email-submit">Send Code</button>
                            </div>
                        </div>
                    </div>
                `;
                
                document.body.appendChild(modal);
                
                const emailInput = modal.querySelector('#privy-email-input');
                const submitBtn = modal.querySelector('#privy-email-submit');
                
                submitBtn.onclick = () => {
                    const email = emailInput.value.trim();
                    if (email && email.includes('@')) {
                        modal.remove();
                        resolve(email);
                    } else {
                        emailInput.style.border = '2px solid red';
                        emailInput.focus();
                    }
                };
                
                emailInput.onkeypress = (e) => {
                    if (e.key === 'Enter') {
                        submitBtn.click();
                    }
                };
            });
        }

        /**
         * Get verification code from user via UI modal instead of prompt
         */
        async _getCodeFromUser() {
            return new Promise((resolve) => {
                const modal = document.createElement('div');
                modal.className = 'modal fade show';
                modal.style.cssText = 'display: block; background: rgba(0,0,0,0.5); z-index: 10000;';
                modal.innerHTML = `
                    <div class="modal-dialog">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">📧 Enter Verification Code</h5>
                            </div>
                            <div class="modal-body">
                                <p>Enter the verification code sent to your email:</p>
                                <input type="text" id="privy-code-input" class="form-control" placeholder="123456" maxlength="6" autofocus>
                                <div class="form-text">Check your email for the 6-digit code</div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove(); resolve(null)">Cancel</button>
                                <button type="button" class="btn btn-primary" id="privy-code-submit">Verify</button>
                            </div>
                        </div>
                    </div>
                `;
                
                document.body.appendChild(modal);
                
                const codeInput = modal.querySelector('#privy-code-input');
                const submitBtn = modal.querySelector('#privy-code-submit');
                
                submitBtn.onclick = () => {
                    const code = codeInput.value.trim();
                    if (code && code.length === 6) {
                        modal.remove();
                        resolve(code);
                    } else {
                        codeInput.style.border = '2px solid red';
                        codeInput.focus();
                    }
                };
                
                codeInput.onkeypress = (e) => {
                    if (e.key === 'Enter') {
                        submitBtn.click();
                    }
                };
            });
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
    console.log("REAL Privy JS Core SDK wallet connector created and attached to window.walletConnector");

})(); 