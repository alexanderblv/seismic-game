// Onboard.js Integration
// This module assumes Onboard.js is loaded via script tags in the HTML

// Create a module for Onboard integration
const OnboardService = (function() {
    let instance = {
        onboard: null,
        wallet: null,
        provider: null,
        signer: null,
        ethersProvider: null,
        
        // Initialize Onboard.js
        async initialize(networkConfig) {
            try {
                if (!window.Onboard) {
                    console.error("Onboard.js not loaded");
                    return false;
                }
                
                // Create an Onboard instance
                this.onboard = window.Onboard({
                    wallets: [window.injectedModule(), window.walletConnectModule()],
                    chains: [{
                        id: '0x' + networkConfig.chainId.toString(16),
                        token: networkConfig.symbol,
                        label: networkConfig.name,
                        rpcUrl: networkConfig.rpcUrl,
                        blockExplorerUrl: networkConfig.explorer
                    }],
                    appMetadata: {
                        name: 'Seismic Experience',
                        icon: './seismic-logo.png', // Update with actual logo path
                        description: 'Seismic blockchain transaction app'
                    }
                });
                
                console.log("Onboard.js initialized successfully");
                return true;
            } catch (error) {
                console.error("Error initializing Onboard.js:", error);
                return false;
            }
        },
        
        // Connect wallet
        async connectWallet() {
            try {
                if (!this.onboard) {
                    throw new Error("Onboard.js not initialized");
                }
                
                // Prompt user to connect
                const wallets = await this.onboard.connectWallet();
                
                if (wallets.length === 0) {
                    throw new Error("No wallet connected");
                }
                
                this.wallet = wallets[0];
                
                // Create ethers provider from wallet connection
                this.provider = this.wallet.provider;
                this.ethersProvider = new ethers.providers.Web3Provider(this.provider);
                this.signer = this.ethersProvider.getSigner();
                
                // Return wallet info
                return {
                    address: this.wallet.accounts[0].address,
                    provider: this.ethersProvider,
                    signer: this.signer,
                    network: await this.ethersProvider.getNetwork(),
                    label: this.wallet.label
                };
            } catch (error) {
                console.error("Error connecting wallet with Onboard.js:", error);
                throw error;
            }
        },
        
        // Get connected wallet
        getWallet() {
            if (!this.wallet) {
                return null;
            }
            
            return {
                address: this.wallet.accounts[0].address,
                provider: this.ethersProvider,
                signer: this.signer,
                label: this.wallet.label
            };
        },
        
        // Disconnect wallet
        async disconnectWallet() {
            try {
                if (!this.onboard || !this.wallet) {
                    return true;
                }
                
                await this.onboard.disconnectWallet({ label: this.wallet.label });
                this.wallet = null;
                this.provider = null;
                this.ethersProvider = null;
                this.signer = null;
                
                return true;
            } catch (error) {
                console.error("Error disconnecting wallet:", error);
                return false;
            }
        },
        
        // Set chain (network)
        async setChain(chainId) {
            try {
                if (!this.onboard || !this.wallet) {
                    throw new Error("No wallet connected");
                }
                
                const success = await this.onboard.setChain({ chainId: chainId });
                return success;
            } catch (error) {
                console.error("Error setting chain:", error);
                return false;
            }
        }
    };
    
    return instance;
})();

// Make it available globally
window.OnboardService = OnboardService; 