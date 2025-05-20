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
            this.supportedWallets = [
                {
                    id: 'walletconnect',
                    name: 'WalletConnect',
                    icon: 'https://avatars.githubusercontent.com/u/37784886',
                    mobile: true,
                    desktop: true,
                    installed: false
                },
                {
                    id: 'rabby',
                    name: 'Rabby Wallet',
                    icon: 'https://rabby.io/assets/logo-64.png',
                    mobile: false,
                    desktop: true,
                    installed: false
                },
                {
                    id: 'trust',
                    name: 'Trust Wallet',
                    icon: 'https://trustwallet.com/assets/images/favicon.png',
                    mobile: true,
                    desktop: true,
                    installed: false
                },
                {
                    id: 'metamask',
                    name: 'MetaMask',
                    icon: 'https://avatars.githubusercontent.com/u/11744586',
                    mobile: true,
                    desktop: true,
                    installed: false
                },
                {
                    id: 'coinbase',
                    name: 'Coinbase Wallet',
                    icon: 'https://www.coinbase.com/assets/favicon-32x32.png',
                    mobile: true,
                    desktop: true,
                    installed: false
                }
            ];
        }

        /**
         * Initialize the wallet connector
         */
        async initialize(config = {}) {
            if (this.initialized) return true;

            try {
                console.log("Initializing wallet connector...");
                
                // Check for available wallets
                this._checkInstalledWallets();
                
                // Create wallet dialog element
                this._createWalletDialog();
                
                // Project ID for WalletConnect (required for v2)
                const projectId = config.projectId || window.seismicConfig?.walletConnect?.projectId || "a85ac05209955cfd18fbe7c0fd018f23";
                
                // Get network configuration
                const networkConfig = window.seismicConfig?.network || config.network || {
                    chainId: 1,
                    name: "Ethereum",
                    rpcUrl: "https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161"
                };
                
                // Create Web3Modal instance
                this._initializeWeb3Modal(projectId, networkConfig);
                
                // Initialize ethers provider
                this._initializeEthersProvider();
                
                // Try to reconnect from cached session
                this._attemptReconnect();
                
                this.initialized = true;
                return true;
            } catch (error) {
                console.error("Failed to initialize wallet connector:", error);
                this.lastError = error.message || "Failed to initialize wallet connector";
                return false;
            }
        }
        
        /**
         * Check for installed wallet extensions
         */
        _checkInstalledWallets() {
            // Check if MetaMask is installed
            if (window.ethereum?.isMetaMask) {
                this._setWalletInstalled('metamask', true);
            }
            
            // Check if Coinbase Wallet is installed
            if (window.ethereum?.isCoinbaseWallet || window.coinbaseWalletExtension) {
                this._setWalletInstalled('coinbase', true);
            }
            
            // Check if Trust Wallet is installed
            if (window.ethereum?.isTrust || window.trustWallet) {
                this._setWalletInstalled('trust', true);
            }
            
            // Check if Rabby Wallet is installed
            if (window.ethereum?.isRabby) {
                this._setWalletInstalled('rabby', true);
            }
        }
        
        /**
         * Set wallet installed status
         */
        _setWalletInstalled(walletId, installed) {
            const wallet = this.supportedWallets.find(w => w.id === walletId);
            if (wallet) {
                wallet.installed = installed;
            }
        }
        
        /**
         * Create wallet dialog element
         */
        _createWalletDialog() {
            // Create modal container if it doesn't exist
            let modalContainer = document.getElementById('wallet-modal-container');
            if (!modalContainer) {
                modalContainer = document.createElement('div');
                modalContainer.id = 'wallet-modal-container';
                document.body.appendChild(modalContainer);
                
                // Create modal HTML
                modalContainer.innerHTML = `
                <div class="wallet-modal" id="wallet-modal">
                    <div class="wallet-modal-content">
                        <div class="wallet-modal-header">
                            <h3>Connect Wallet</h3>
                            <button class="wallet-modal-close">&times;</button>
                        </div>
                        <div class="wallet-modal-body">
                            <div class="wallet-list" id="wallet-list"></div>
                            <div class="wallet-footer">
                                <div class="wallet-all-wallets">
                                    <span class="wallet-all-wallets-icon">
                                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M16.6667 5.83333H3.33333C2.8731 5.83333 2.5 6.20643 2.5 6.66667V13.3333C2.5 13.7936 2.8731 14.1667 3.33333 14.1667H16.6667C17.1269 14.1667 17.5 13.7936 17.5 13.3333V6.66667C17.5 6.20643 17.1269 5.83333 16.6667 5.83333Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                                            <path d="M5.83333 8.33333H5.84167" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                                            <path d="M8.33333 8.33333H8.34167" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                                            <path d="M10.8333 8.33333H10.8417" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                                            <path d="M13.3333 8.33333H13.3417" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                                            <path d="M5.83333 11.6667H5.84167" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                                            <path d="M8.33333 11.6667H8.34167" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                                            <path d="M10.8333 11.6667H10.8417" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                                            <path d="M13.3333 11.6667H13.3417" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                                        </svg>
                                    </span>
                                    <span>All Wallets</span>
                                    <span class="wallet-count">40+</span>
                                </div>
                                <div class="wallet-help">
                                    <a href="https://ethereum.org/wallets" target="_blank">Haven't got a wallet?</a>
                                    <a href="#" id="wallet-get-started">Get started</a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                `;
                
                // Add event listeners
                const modal = document.getElementById('wallet-modal');
                const closeBtn = modal.querySelector('.wallet-modal-close');
                closeBtn.addEventListener('click', () => {
                    this.closeWalletModal();
                });
                
                // Close when clicking outside
                window.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        this.closeWalletModal();
                    }
                });
                
                // Get started link
                const getStartedBtn = document.getElementById('wallet-get-started');
                getStartedBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    window.open('https://ethereum.org/wallets', '_blank');
                });
                
                // Add wallet list items
                this._populateWalletList();
            }
        }
        
        /**
         * Populate wallet list
         */
        _populateWalletList() {
            const walletList = document.getElementById('wallet-list');
            if (!walletList) return;
            
            walletList.innerHTML = '';
            
            // Add each wallet to the list
            this.supportedWallets.forEach(wallet => {
                const walletItem = document.createElement('div');
                walletItem.className = 'wallet-item';
                walletItem.dataset.wallet = wallet.id;
                
                walletItem.innerHTML = `
                    <div class="wallet-icon">
                        <img src="${wallet.icon}" alt="${wallet.name}">
                    </div>
                    <div class="wallet-name">${wallet.name}</div>
                    <div class="wallet-status">
                        ${wallet.installed ? '<span class="wallet-installed">INSTALLED</span>' : 
                         wallet.id === 'walletconnect' ? '<span class="wallet-qr-code">QR CODE</span>' : ''}
                    </div>
                `;
                
                // Add click event
                walletItem.addEventListener('click', () => {
                    this._connectToWallet(wallet.id);
                });
                
                walletList.appendChild(walletItem);
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
                                chainId: networkConfig.chainId
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
                    
                    // Create Web3Modal instance
                    this.web3Modal = new window.Web3Modal({
                        cacheProvider: true,
                        providerOptions,
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
         * Attempt to reconnect from cached session
         */
        async _attemptReconnect() {
            // Check if there's a cached provider but don't automatically connect
            // This avoids the issue where user can't choose a different wallet
            if (this.web3Modal && this.web3Modal.cachedProvider) {
                console.log("Found cached provider, but won't reconnect automatically.");
                console.log("User should explicitly choose which wallet to connect.");
                
                // Optional: display some UI indication that there was a previous connection
                // but we're requiring a fresh choice
                return false;
            }
            return false;
        }
        
        /**
         * Connect to a specific wallet
         */
        async _connectToWallet(walletId) {
            console.log(`Connecting to wallet: ${walletId}`);
            
            try {
                // Clear cached provider if Web3Modal is available to ensure fresh connection
                if (this.web3Modal && this.web3Modal.cachedProvider) {
                    console.log(`Clearing cached provider before connecting to ${walletId}`);
                    this.web3Modal.clearCachedProvider();
                }
                
                // Clear any existing provider connections
                if (this.provider) {
                    try {
                        // Attempt to disconnect current provider if possible
                        if (typeof this.provider.disconnect === 'function') {
                            await this.provider.disconnect();
                        }
                        // Reset provider state
                        this.provider = null;
                    } catch (e) {
                        console.warn("Error disconnecting previous provider:", e);
                    }
                }
                
                let provider;
                
                // Handle different wallet connections
                switch (walletId) {
                    case 'metamask':
                        // Connect to MetaMask
                        if (window.ethereum?.isMetaMask) {
                            provider = window.ethereum;
                        } else {
                            window.open('https://metamask.io/download/', '_blank');
                            return;
                        }
                        break;
                    
                    case 'trust':
                        // Connect to Trust Wallet
                        if (window.ethereum?.isTrust || window.trustWallet) {
                            provider = window.ethereum;
                        } else {
                            window.open('https://trustwallet.com/download', '_blank');
                            return;
                        }
                        break;
                    
                    case 'rabby':
                        // Connect to Rabby Wallet
                        if (window.ethereum?.isRabby) {
                            provider = window.ethereum;
                        } else {
                            window.open('https://rabby.io/', '_blank');
                            return;
                        }
                        break;
                    
                    case 'coinbase':
                        // Connect to Coinbase Wallet
                        if (window.ethereum?.isCoinbaseWallet || window.coinbaseWalletExtension) {
                            provider = window.ethereum;
                        } else {
                            window.open('https://www.coinbase.com/wallet/downloads', '_blank');
                            return;
                        }
                        break;
                    
                    case 'walletconnect':
                    default:
                        // Use Web3Modal for WalletConnect or fallback
                        if (this.web3Modal) {
                            // Force show the wallet selection modal
                            provider = await this.web3Modal.connect();
                        } else {
                            throw new Error("Web3Modal not initialized");
                        }
                        break;
                }
                
                // Set provider and register events
                if (provider) {
                    this.provider = provider;
                    this._registerProviderEvents(provider);
                    
                    // Get accounts and chain ID
                    await this._updateAccountsAndChain(provider);
                    
                    // Close modal
                    this.closeWalletModal();
                }
            } catch (error) {
                console.error(`Failed to connect to ${walletId}:`, error);
                this.lastError = error.message || `Failed to connect to ${walletId}`;
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
                        this._emitEvent('walletConnected', { 
                            account: this.selectedAccount,
                            chainId: this.chainId
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
         * Connect to wallet
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
                
                // Always show the wallet selection modal to prevent cached connection issues
                this.showWalletModal();
                this.isConnecting = false;
                return true;
            } catch (error) {
                console.error("Error connecting to wallet:", error);
                this.lastError = error.message || "Failed to connect to wallet";
                this.isConnecting = false;
                return false;
            }
        }
        
        /**
         * Show wallet selection modal
         */
        showWalletModal() {
            // Update wallet list before showing
            this._checkInstalledWallets();
            this._populateWalletList();
            
            // Show modal
            const modal = document.getElementById('wallet-modal');
            if (modal) {
                modal.style.display = 'flex';
                document.body.classList.add('wallet-modal-open');
            }
        }
        
        /**
         * Close wallet selection modal
         */
        closeWalletModal() {
            const modal = document.getElementById('wallet-modal');
            if (modal) {
                modal.style.display = 'none';
                document.body.classList.remove('wallet-modal-open');
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