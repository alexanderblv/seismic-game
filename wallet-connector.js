// Web3Modal Wallet Connector for Vercel Deployment
(function() {
    // Global variables
    let provider = null;
    let web3 = null;
    let selectedAccount = null;
    let connecting = false;
    let web3Modal = null;
    
    // UI elements - we'll get these only after DOM is loaded
    let connectButton;
    let walletAddress;
    let networkBadge;
    let connectionStatus;
    
    // Seismic network configuration
    const seismicNetwork = {
        chainId: '0x1404', // 5124 in hex
        chainName: 'Seismic Devnet',
        nativeCurrency: {
            name: 'Ether',
            symbol: 'ETH',
            decimals: 18
        },
        rpcUrls: ['https://rpc-2.seismicdev.net/'],
        blockExplorerUrls: ['https://explorer-2.seismicdev.net/'],
    };

    // Initialize Web3Modal on DOM load
    document.addEventListener('DOMContentLoaded', init);
    
    // Initialize the wallet connector
    function init() {
        // Get UI elements
        connectButton = document.getElementById('connect-wallet');
        walletAddress = document.getElementById('wallet-address');
        networkBadge = document.getElementById('network-badge');
        connectionStatus = document.getElementById('connection-status');
        
        // Initialize Web3Modal with WalletConnect v1
        const providerOptions = {
            walletconnect: {
                package: WalletConnectProvider.default, 
                options: {
                    rpc: {
                        5124: seismicNetwork.rpcUrls[0]
                    }
                }
            }
        };
        
        // Create Web3Modal instance
        web3Modal = new Web3Modal.default({
            cacheProvider: true,
            providerOptions,
            disableInjectedProvider: false,
            theme: "dark"
        });
        
        // Check if user is already connected
        if (web3Modal.cachedProvider) {
            connect();
        }
        
        // Setup event listeners
        setupEventListeners();
        
        // Update UI in disconnected state
        updateUIDisconnected();
    }
    
    // Setup event listeners for UI buttons
    function setupEventListeners() {
        // Connect button
        connectButton.addEventListener('click', async () => {
            if (isConnected()) {
                await disconnect();
            } else {
                await connect();
            }
        });
        
        // Add Seismic Network button
        const addNetworkBtn = document.getElementById('add-network');
        if (addNetworkBtn) {
            addNetworkBtn.addEventListener('click', addSeismicNetwork);
        }
        
        // Refresh balance button
        const refreshBalanceBtn = document.getElementById('refresh-balance');
        if (refreshBalanceBtn) {
            refreshBalanceBtn.addEventListener('click', updateUI);
        }
        
        // Copy address button
        const copyAddressBtn = document.getElementById('copy-address');
        if (copyAddressBtn) {
            copyAddressBtn.addEventListener('click', () => {
                const addressInput = document.getElementById('user-address');
                if (addressInput && addressInput.value) {
                    navigator.clipboard.writeText(addressInput.value);
                    
                    // Visual feedback
                    const originalText = copyAddressBtn.innerHTML;
                    copyAddressBtn.innerHTML = '<i class="bi bi-check"></i>';
                    setTimeout(() => {
                        copyAddressBtn.innerHTML = originalText;
                    }, 1500);
                }
            });
        }
        
        // Form submission handlers
        const transactionForm = document.getElementById('transaction-form');
        if (transactionForm) {
            transactionForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                if (!isConnected()) {
                    alert('Please connect your wallet first');
                    return;
                }
                
                // Handle transaction send (implementation will vary based on your game needs)
                alert('Transaction sending is implemented in the game logic');
            });
        }
        
        // Setup encrypted type selector
        const encryptedTypeSelect = document.getElementById('encrypted-type');
        if (encryptedTypeSelect) {
            encryptedTypeSelect.addEventListener('change', () => {
                // Show/hide appropriate input fields based on selected type
                const selectedType = encryptedTypeSelect.value;
                
                document.getElementById('suint-input-group').classList.add('d-none');
                document.getElementById('saddress-input-group').classList.add('d-none');
                document.getElementById('sbool-input-group').classList.add('d-none');
                
                document.getElementById(`${selectedType}-input-group`).classList.remove('d-none');
            });
        }
    }
    
    // Connect to wallet
    async function connect() {
        try {
            if (connecting) return;
            connecting = true;
            
            // Update UI to show connecting state
            connectButton.innerText = 'Connecting...';
            
            // Open Web3Modal and select provider
            provider = await web3Modal.connect();
            
            // Create Web3 instance
            web3 = new Web3(provider);
            
            // Get connected accounts
            const accounts = await web3.eth.getAccounts();
            selectedAccount = accounts[0];
            
            // Setup provider event listeners
            provider.on('accountsChanged', (accounts) => {
                if (accounts.length === 0) {
                    // User disconnected their wallet
                    disconnect();
                } else {
                    selectedAccount = accounts[0];
                    updateUI();
                    
                    // Dispatch account changed event
                    dispatchEvent('accountChanged', { account: selectedAccount });
                }
            });
            
            provider.on('chainChanged', (chainId) => {
                updateNetworkInfo();
                updateUI();
                
                // Dispatch network changed event
                dispatchEvent('networkChanged', { chainId });
            });
            
            provider.on('disconnect', () => {
                disconnect();
                
                // Dispatch wallet disconnected event
                dispatchEvent('walletDisconnected');
            });
            
            // Update UI for connected state
            updateUI();
            updateNetworkInfo();
            
            // Check if correct network is selected
            const chainId = await web3.eth.getChainId();
            if (chainId !== 5124) {
                // Prompt to switch to Seismic network
                const switchResult = confirm('Would you like to switch to the Seismic Network?');
                if (switchResult) {
                    await addSeismicNetwork();
                }
            }
            
            // Dispatch wallet connected event
            dispatchEvent('walletConnected', { account: selectedAccount });
            
            connecting = false;
            return true;
            
        } catch (error) {
            console.error('Connection error:', error);
            alert('Failed to connect wallet: ' + (error.message || 'Unknown error'));
            connecting = false;
            updateUIDisconnected();
            return false;
        }
    }
    
    // Dispatch custom events
    function dispatchEvent(eventName, detail = {}) {
        const event = new CustomEvent(eventName, { detail });
        document.dispatchEvent(event);
    }
    
    // Disconnect wallet
    async function disconnect() {
        if (provider && provider.close) {
            try {
                await provider.close();
            } catch (e) {
                console.warn("Error closing provider:", e);
            }
        }
        
        // Clear cached provider
        web3Modal.clearCachedProvider();
        
        // Reset state
        provider = null;
        web3 = null;
        selectedAccount = null;
        
        // Update UI
        updateUIDisconnected();
        
        // Dispatch wallet disconnected event
        dispatchEvent('walletDisconnected');
    }
    
    // Update UI for connected state
    async function updateUI() {
        if (!isConnected()) {
            updateUIDisconnected();
            return;
        }
        
        // Update connect button
        connectButton.innerText = 'Disconnect';
        connectButton.classList.remove('btn-primary');
        connectButton.classList.add('btn-outline-danger');
        
        // Update address display
        walletAddress.innerText = `${selectedAccount.substring(0, 6)}...${selectedAccount.substring(selectedAccount.length - 4)}`;
        walletAddress.classList.remove('d-none');
        
        // Update address input
        const addressInput = document.getElementById('user-address');
        if (addressInput) {
            addressInput.value = selectedAccount;
        }
        
        // Update balance
        try {
            const balance = await web3.eth.getBalance(selectedAccount);
            const formattedBalance = web3.utils.fromWei(balance, 'ether');
            
            const balanceInput = document.getElementById('user-balance');
            if (balanceInput) {
                balanceInput.value = parseFloat(formattedBalance).toFixed(4);
            }
        } catch (error) {
            console.error('Error fetching balance:', error);
        }
    }
    
    // Update UI for disconnected state
    function updateUIDisconnected() {
        // Update connect button
        connectButton.innerText = 'Connect Wallet';
        connectButton.classList.remove('btn-outline-danger');
        connectButton.classList.add('btn-primary');
        
        // Update address display
        walletAddress.innerText = 'Connect your wallet';
        
        // Update network badge
        networkBadge.innerText = 'Not Connected';
        networkBadge.classList.remove('bg-success', 'bg-warning', 'bg-danger');
        networkBadge.classList.add('bg-secondary');
        
        // Update connection status
        connectionStatus.innerText = 'Not Connected';
        connectionStatus.classList.remove('bg-success', 'bg-warning', 'bg-danger');
        connectionStatus.classList.add('bg-secondary');
        
        // Clear input fields
        const addressInput = document.getElementById('user-address');
        const balanceInput = document.getElementById('user-balance');
        
        if (addressInput) {
            addressInput.value = '';
        }
        
        if (balanceInput) {
            balanceInput.value = '';
        }
    }
    
    // Update network information
    async function updateNetworkInfo() {
        if (!isConnected()) return;
        
        try {
            const chainId = await web3.eth.getChainId();
            
            // Update network badge
            if (chainId === 5124) {
                // Seismic Devnet
                networkBadge.innerText = 'Seismic Devnet';
                networkBadge.classList.remove('bg-secondary', 'bg-warning', 'bg-danger');
                networkBadge.classList.add('bg-success');
                
                connectionStatus.innerText = 'Connected';
                connectionStatus.classList.remove('bg-secondary', 'bg-warning', 'bg-danger');
                connectionStatus.classList.add('bg-success');
            } else {
                // Other network
                let networkName;
                switch(chainId) {
                    case 1:
                        networkName = 'Ethereum Mainnet';
                        break;
                    case 5:
                        networkName = 'Goerli Testnet';
                        break;
                    case 11155111:
                        networkName = 'Sepolia Testnet';
                        break;
                    case 42161:
                        networkName = 'Arbitrum One';
                        break;
                    case 10:
                        networkName = 'Optimism';
                        break;
                    case 8453:
                        networkName = 'Base';
                        break;
                    case 137:
                        networkName = 'Polygon';
                        break;
                    default:
                        networkName = 'Unknown Network';
                }
                
                networkBadge.innerText = networkName;
                networkBadge.classList.remove('bg-secondary', 'bg-success', 'bg-danger');
                networkBadge.classList.add('bg-warning');
                
                connectionStatus.innerText = 'Wrong Network';
                connectionStatus.classList.remove('bg-secondary', 'bg-success', 'bg-danger');
                connectionStatus.classList.add('bg-warning');
            }
            
        } catch (error) {
            console.error('Error updating network info:', error);
            
            // Show error state
            networkBadge.innerText = 'Error';
            networkBadge.classList.remove('bg-secondary', 'bg-success', 'bg-warning');
            networkBadge.classList.add('bg-danger');
            
            connectionStatus.innerText = 'Error';
            connectionStatus.classList.remove('bg-secondary', 'bg-success', 'bg-warning');
            connectionStatus.classList.add('bg-danger');
        }
    }
    
    // Add Seismic network to wallet
    async function addSeismicNetwork() {
        if (!isConnected()) {
            alert('Please connect your wallet first');
            return;
        }
        
        try {
            // Request network switch first
            try {
                await ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: seismicNetwork.chainId }],
                });
                return true;
            } catch (switchError) {
                // Network doesn't exist, add it
                if (switchError.code === 4902) {
                    try {
                        await ethereum.request({
                            method: 'wallet_addEthereumChain',
                            params: [seismicNetwork],
                        });
                        return true;
                    } catch (addError) {
                        console.error('Error adding network:', addError);
                        alert('Failed to add Seismic network: ' + (addError.message || 'Unknown error'));
                        return false;
                    }
                } else {
                    console.error('Error switching network:', switchError);
                    alert('Failed to switch to Seismic network: ' + (switchError.message || 'Unknown error'));
                    return false;
                }
            }
        } catch (error) {
            console.error('Error adding network:', error);
            alert('Failed to add Seismic network: ' + (error.message || 'Unknown error'));
            return false;
        }
    }
    
    // Helper functions
    function isConnected() {
        return !!selectedAccount;
    }
    
    function getSelectedAccount() {
        return selectedAccount;
    }
    
    function getWeb3() {
        return web3;
    }
    
    function getProvider() {
        return provider;
    }
    
    // Export functions for external use
    window.walletConnector = {
        connect,
        disconnect,
        isConnected,
        getSelectedAccount,
        getWeb3,
        getProvider,
        addSeismicNetwork
    };
})(); 