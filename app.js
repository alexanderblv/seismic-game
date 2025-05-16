// Seismic Transaction Sender App
document.addEventListener('DOMContentLoaded', () => {
    // Initialize the SDK
    const seismic = new SeismicSDK();
    
    // Track transaction history - load from localStorage if available
    let transactionHistory = [];
    
    try {
        const savedHistory = localStorage.getItem('transactionHistory');
        if (savedHistory) {
            transactionHistory = JSON.parse(savedHistory);
            console.log(`Loaded ${transactionHistory.length} transactions from history`);
        }
    } catch (error) {
        console.error('Failed to load transaction history:', error);
        // If there was an error parsing, reset the history
        localStorage.removeItem('transactionHistory');
    }
    
    // Flag to track if wallet connect was initiated
    let walletConnectInitiated = false;
    
    // DOM Elements
    const connectWalletBtn = document.getElementById('connect-wallet');
    const addNetworkBtn = document.getElementById('add-network');
    const walletAddress = document.getElementById('wallet-address');
    const networkBadge = document.getElementById('network-badge');
    const connectionStatus = document.getElementById('connection-status');
    const userAddressInput = document.getElementById('user-address');
    const userBalanceInput = document.getElementById('user-balance');
    const refreshBalanceBtn = document.getElementById('refresh-balance');
    const copyAddressBtn = document.getElementById('copy-address');
    const transactionForm = document.getElementById('transaction-form');
    const recipientAddressInput = document.getElementById('recipient-address');
    const amountInput = document.getElementById('amount');
    const enableEncryptionToggle = document.getElementById('enable-encryption');
    const encryptedDataInput = document.getElementById('encrypted-data');
    const noTransactionsAlert = document.getElementById('no-transactions');
    const transactionHistoryDiv = document.getElementById('transaction-history');
    const transactionList = document.getElementById('transaction-list');
    const loadingOverlay = document.getElementById('loading-overlay');
    const loadingText = document.getElementById('loading-text');
    const transactionModal = new bootstrap.Modal(document.getElementById('transaction-modal'));
    const transactionResult = document.getElementById('transaction-result');
    const txExplorerLink = document.getElementById('tx-explorer-link');
    const clearHistoryBtn = document.getElementById('clear-history');
    
    // Encrypted Types Form Elements
    const encryptedTypeSelect = document.getElementById('encrypted-type');
    const encryptedRecipientAddressInput = document.getElementById('encrypted-recipient-address');
    const suintInputGroup = document.getElementById('suint-input-group');
    const saddressInputGroup = document.getElementById('saddress-input-group');
    const sboolInputGroup = document.getElementById('sbool-input-group');
    const suintValue = document.getElementById('suint-value');
    const saddressValue = document.getElementById('saddress-value');
    const sboolTrueRadio = document.getElementById('sbool-true');
    const sboolFalseRadio = document.getElementById('sbool-false');
    const encryptionResult = document.getElementById('encryption-result');
    const encryptDataBtn = document.getElementById('encrypt-data-btn');
    const sendEncryptedTxBtn = document.getElementById('send-encrypted-tx-btn');
    
    // Current encryption result
    let currentEncryptedData = null;

    // Set up wallet event handlers
    function setupWalletListeners() {
        if (window.walletConnector) {
            // Listen to wallet connected event
            document.addEventListener('walletConnected', (event) => {
                console.log('Wallet connected event:', event.detail);
                
                if (event.detail && event.detail.account) {
                    completeWalletConnection(event.detail.account);
                }
            });
            
            // Listen to account changed event
            document.addEventListener('accountChanged', (event) => {
                console.log('Account changed event:', event.detail);
                
                if (event.detail && event.detail.account) {
                    // Reload the page or update UI as needed
                    window.location.reload();
                }
            });
            
            // Listen to network changed event
            document.addEventListener('networkChanged', (event) => {
                console.log('Network changed event:', event.detail);
                // Reload the page when network changes
                window.location.reload();
            });
            
            // Listen to wallet disconnected event
            document.addEventListener('walletDisconnected', (event) => {
                console.log('Wallet disconnected event');
                // Reload the page when wallet is disconnected
                window.location.reload();
            });
        }
    }
    
    // Complete the wallet connection process with the provided address
    async function completeWalletConnection(address) {
        try {
            if (!seismic.wallet || seismic.wallet.address !== address) {
                loadingOverlay.classList.remove('d-none');
                loadingText.textContent = 'Completing connection...';
                
                // Get provider from walletConnector
                const provider = window.walletConnector ? window.walletConnector.getProvider() : null;
                
                // Complete wallet connection in SDK
                const wallet = await seismic.completeConnection(address, provider);
                
                if (wallet) {
                    // Update UI to show connected state
                    connectWalletBtn.textContent = 'Connected';
                    connectWalletBtn.classList.remove('btn-primary');
                    connectWalletBtn.classList.add('btn-success');
                    
                    // Show user address
                    const shortAddress = `${wallet.address.substring(0, 6)}...${wallet.address.substring(wallet.address.length - 4)}`;
                    walletAddress.textContent = shortAddress;
                    walletAddress.classList.remove('d-none');
                    userAddressInput.value = wallet.address;
                    
                    // Update network status
                    networkBadge.textContent = seismicConfig.network.name;
                    networkBadge.classList.remove('bg-secondary');
                    networkBadge.classList.add('bg-success');
                    
                    // Update connection status
                    connectionStatus.textContent = 'Connected';
                    connectionStatus.classList.remove('bg-secondary');
                    connectionStatus.classList.add('bg-success');
                    
                    // Get and display balance
                    refreshBalance();
                    
                    console.log('Wallet connection completed for:', wallet.address);
                    
                    // Reset the flag since connection is complete
                    walletConnectInitiated = false;
                }
            }
        } catch (error) {
            console.error('Failed to complete wallet connection:', error);
            showError('Failed to complete wallet connection. Please try again.');
            walletConnectInitiated = false;
        } finally {
            loadingOverlay.classList.add('d-none');
            connectWalletBtn.disabled = false;
        }
    }

    // Initialize the SDK
    async function initializeSdk() {
        try {
            await seismic.initialize();
            console.log('Seismic SDK initialized successfully');
            
            // Check if wallet is already connected and automatically initiate connection
            // if walletConnector is already connected
            if (window.walletConnector && window.walletConnector.isConnected()) {
                // Set connection state
                connectWalletBtn.disabled = true;
                loadingOverlay.classList.remove('d-none');
                loadingText.textContent = 'Automatically connecting wallet...';
                
                try {
                    const wallet = await seismic.connect();
                    
                    if (wallet) {
                        // Update UI to show connected state
                        connectWalletBtn.textContent = 'Connected';
                        connectWalletBtn.classList.remove('btn-primary');
                        connectWalletBtn.classList.add('btn-success');
                        
                        // Show user address
                        const shortAddress = `${wallet.address.substring(0, 6)}...${wallet.address.substring(wallet.address.length - 4)}`;
                        walletAddress.textContent = shortAddress;
                        walletAddress.classList.remove('d-none');
                        userAddressInput.value = wallet.address;
                        
                        // Update network status
                        networkBadge.textContent = seismicConfig.network.name;
                        networkBadge.classList.remove('bg-secondary');
                        networkBadge.classList.add('bg-success');
                        
                        // Update connection status
                        connectionStatus.textContent = 'Connected';
                        connectionStatus.classList.remove('bg-secondary');
                        connectionStatus.classList.add('bg-success');
                        
                        // Get and display balance
                        refreshBalance();
                        
                        console.log('Wallet connected automatically:', wallet.address);
                    }
                } catch (error) {
                    console.error('Failed to connect wallet automatically:', error);
                } finally {
                    loadingOverlay.classList.add('d-none');
                    connectWalletBtn.disabled = false;
                }
            }
        } catch (error) {
            console.error('Failed to initialize Seismic SDK:', error);
            showError('Failed to initialize Seismic SDK. Please refresh the page and try again.');
        }
    }

    // Connect wallet button handler
    async function connectWallet() {
        if (walletConnectInitiated) {
            console.log('Wallet connection already in progress');
            return;
        }
        
        if (seismic.wallet) {
            // Already connected - disconnect
            console.log('Disconnecting wallet');
            
            try {
                await seismic.disconnect();
                
                // Reset UI
                connectWalletBtn.textContent = 'Connect Wallet';
                connectWalletBtn.classList.remove('btn-success');
                connectWalletBtn.classList.add('btn-primary');
                
                walletAddress.textContent = 'Connect your wallet';
                walletAddress.classList.add('d-none');
                
                userAddressInput.value = '';
                userBalanceInput.value = '';
                
                // Update network status
                networkBadge.textContent = 'Not Connected';
                networkBadge.classList.remove('bg-success');
                networkBadge.classList.add('bg-secondary');
                
                // Update connection status
                connectionStatus.textContent = 'Not Connected';
                connectionStatus.classList.remove('bg-success');
                connectionStatus.classList.add('bg-secondary');
                
                // Also disconnect Web3Modal if available
                if (window.walletConnector) {
                    await window.walletConnector.disconnect();
                }
                
                console.log('Wallet disconnected');
                
            } catch (error) {
                console.error('Failed to disconnect wallet:', error);
                showError('Failed to disconnect wallet. Please try again.');
            }
            
        } else {
            // Connect new wallet
            console.log('Initiating wallet connection');
            walletConnectInitiated = true;
            
            try {
                // Use Web3Modal for connection
                if (window.walletConnector) {
                    connectWalletBtn.disabled = true;
                    const connected = await window.walletConnector.connect();
                    
                    if (!connected) {
                        walletConnectInitiated = false;
                        connectWalletBtn.disabled = false;
                        console.log('User canceled wallet connection');
                    }
                } else {
                    showError('Wallet connector not found. Please refresh the page and try again.');
                    walletConnectInitiated = false;
                }
            } catch (error) {
                console.error('Failed to connect wallet:', error);
                showError('Failed to connect wallet: ' + (error.message || 'Unknown error'));
                walletConnectInitiated = false;
                connectWalletBtn.disabled = false;
            }
        }
    }
    
    // Add Seismic network to wallet
    async function addNetwork() {
        try {
            if (!window.ethereum) {
                throw new Error('MetaMask is not installed');
            }
            
            await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                    chainId: '0x' + seismicConfig.network.chainId.toString(16),
                    chainName: seismicConfig.network.name,
                    nativeCurrency: {
                        name: 'Ethereum',
                        symbol: seismicConfig.network.symbol,
                        decimals: 18
                    },
                    rpcUrls: [seismicConfig.network.rpcUrl],
                    blockExplorerUrls: [seismicConfig.network.explorer]
                }]
            });
            
            showSuccess('Seismic network added to your wallet successfully!');
        } catch (error) {
            console.error('Failed to add network:', error);
            showError('Failed to add Seismic network to your wallet. Please try again.');
        }
    }
    
    // Get and display user balance
    async function refreshBalance() {
        try {
            if (!seismic.wallet) {
                return;
            }
            
            userBalanceInput.value = 'Loading...';
            
            const balance = await seismic.getBalance(seismic.wallet.address);
            const formattedBalance = ethers.utils.formatEther(balance);
            
            userBalanceInput.value = parseFloat(formattedBalance).toFixed(6);
        } catch (error) {
            console.error('Failed to fetch balance:', error);
            userBalanceInput.value = 'Error';
        }
    }
    
    // Copy address to clipboard
    function copyAddress() {
        const address = userAddressInput.value;
        
        if (address) {
            navigator.clipboard.writeText(address)
                .then(() => {
                    // Change button icon temporarily
                    copyAddressBtn.innerHTML = '<i class="bi bi-check-lg"></i>';
            setTimeout(() => {
                        copyAddressBtn.innerHTML = '<i class="bi bi-clipboard"></i>';
                    }, 1500);
                })
                .catch(err => {
                    console.error('Failed to copy address:', err);
                });
        }
    }
    
    // Send transaction
    async function sendTransaction(event) {
        event.preventDefault();
        
        if (!seismic.wallet) {
            showError('Please connect your wallet first');
            return;
        }
            
        const recipientAddress = recipientAddressInput.value.trim();
        const amount = amountInput.value.trim();
        const useEncryption = enableEncryptionToggle.checked;
        const encryptedData = encryptedDataInput.value.trim();
        
        // Use own wallet address if recipient is empty
        const finalRecipientAddress = recipientAddress || seismic.wallet.address;
        
        // Validate inputs
        if (!ethers.utils.isAddress(finalRecipientAddress)) {
            showError('Please enter a valid Ethereum address');
            return;
        }
            
        if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
            showError('Please enter a valid amount');
            return;
        }
            
        try {
            loadingOverlay.classList.remove('d-none');
            loadingText.textContent = 'Preparing transaction...';
            
            // Convert amount to Wei
            const amountWei = ethers.utils.parseEther(amount);
            
            // Prepare transaction data
            let txData = {
                to: finalRecipientAddress,
                value: amountWei
            };
            
            // If encryption is enabled and user provided data, encrypt it
            if (useEncryption && encryptedData) {
                loadingText.textContent = 'Encrypting data...';
                const encrypted = await seismic.encrypt('suint', encryptedData);
                txData.encryptedData = encrypted;
                
                // For demo purposes, we're not actually sending encrypted data
                // In a real implementation, this would be included in the transaction
                console.log('Encrypted data:', encrypted);
            }
            
            loadingText.textContent = 'Sending transaction...';
            
            // Send transaction
            const tx = await seismic.sendTransaction(txData);
            
            loadingText.textContent = 'Transaction submitted. Waiting for confirmation...';
            
            // Add to transaction history with more details
            const txRecord = {
                hash: tx.hash,
                from: seismic.wallet.address,
                to: finalRecipientAddress,
                value: amount,
                valueWei: amountWei.toString(),
                useEncryption: useEncryption,
                encryptedData: useEncryption && encryptedData ? encryptedData : null,
                isSelfTransaction: finalRecipientAddress === seismic.wallet.address,
                status: 'pending',
                timestamp: Date.now(),
                network: seismicConfig.network.name,
                chainId: seismicConfig.network.chainId
            };
            
            transactionHistory.unshift(txRecord);
            
            // Save to localStorage
            saveTransactionHistory();
            
            // Update UI
            updateTransactionHistory();
            
            // Wait for confirmation
            const receipt = await tx.wait();
            
            // Update transaction status
            const txIndex = transactionHistory.findIndex(t => t.hash === tx.hash);
            if (txIndex !== -1) {
                transactionHistory[txIndex].status = receipt.status === 1 ? 'confirmed' : 'failed';
                transactionHistory[txIndex].blockNumber = receipt.blockNumber;
                transactionHistory[txIndex].gasUsed = receipt.gasUsed.toString();
                
                // Save updated history
                saveTransactionHistory();
                
                // Update UI
                updateTransactionHistory();
            }
            
            // Show success message
            showTransactionResult(tx, receipt);
            
            // Refresh balance
            refreshBalance();
            
            } catch (error) {
            console.error('Failed to send transaction:', error);
            showError('Failed to send transaction. Please check your inputs and try again.');
        } finally {
            loadingOverlay.classList.add('d-none');
        }
    }
    
    // Save transaction history to localStorage
    function saveTransactionHistory() {
        try {
            localStorage.setItem('transactionHistory', JSON.stringify(transactionHistory));
        } catch (error) {
            console.error('Failed to save transaction history:', error);
        }
    }
    
    // Update the transaction history UI
    function updateTransactionHistory() {
        if (transactionHistory.length === 0) {
            noTransactionsAlert.classList.remove('d-none');
            transactionHistoryDiv.classList.add('d-none');
            return;
        }
            
        noTransactionsAlert.classList.add('d-none');
        transactionHistoryDiv.classList.remove('d-none');
        
        // Clear existing list
        transactionList.innerHTML = '';
        
        // Add transactions to the list
        transactionHistory.forEach(tx => {
            const row = document.createElement('tr');
            
            // Status indicator
            let statusBadge;
            if (tx.status === 'pending') {
                statusBadge = '<span class="badge bg-warning">Pending</span>';
            } else if (tx.status === 'confirmed') {
                statusBadge = '<span class="badge bg-success">Confirmed</span>';
            } else {
                statusBadge = '<span class="badge bg-danger">Failed</span>';
            }
            
            // Format addresses
            const shortToAddress = `${tx.to.substring(0, 6)}...${tx.to.substring(tx.to.length - 4)}`;
            
            // Format date
            const txDate = new Date(tx.timestamp);
            const formattedDate = txDate.toLocaleString();
            
            // Build encryption info display
            let encryptionDisplay = tx.useEncryption ? 
                (tx.encryptedType ? 
                    `<span class="badge bg-success">
                        <i class="bi bi-shield-lock me-1"></i>${tx.encryptedType}
                    </span>` : 
                    `<span class="badge bg-success">
                        <i class="bi bi-shield-lock me-1"></i>Encrypted
                    </span>`) : 
                '<span class="badge bg-secondary">None</span>';
            
            // Self transaction indicator
            const addressDisplay = tx.isSelfTransaction ? 
                `${shortToAddress} <i class="bi bi-arrow-repeat text-muted" title="Self Transaction"></i>` : 
                shortToAddress;
            
            // Value display
            const valueDisplay = `${tx.value} ETH`;
            
            // Create row with click handler for details
            row.classList.add('transaction-row');
            row.setAttribute('data-tx-hash', tx.hash);
            row.innerHTML = `
                <td>
                    <a href="${seismicConfig.network.explorer}/tx/${tx.hash}" target="_blank" class="tx-hash">
                        ${tx.hash.substring(0, 10)}...
                    </a>
                </td>
                <td>${addressDisplay}</td>
                <td>${valueDisplay}</td>
                <td>${encryptionDisplay}</td>
                <td>${statusBadge}</td>
                <td>${formattedDate}</td>
                <td>
                    <button class="btn btn-sm btn-outline-info view-details-btn" data-tx-hash="${tx.hash}">
                        <i class="bi bi-info-circle"></i>
                    </button>
                </td>
            `;
            
            transactionList.appendChild(row);
        });
        
        // Add event listeners to the view details buttons
        document.querySelectorAll('.view-details-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const txHash = btn.getAttribute('data-tx-hash');
                showTransactionDetails(txHash);
            });
        });
    }
    
    // Show transaction details in a modal
    function showTransactionDetails(txHash) {
        const tx = transactionHistory.find(t => t.hash === txHash);
        if (!tx) return;
        
        // Format date
        const txDate = new Date(tx.timestamp);
        const formattedDate = txDate.toLocaleString();
        
        // Determine if this is an encrypted transaction and build encrypted data section
        let encryptedSection = '';
        if (tx.useEncryption) {
            encryptedSection = `
                <tr class="table-info">
                    <th colspan="2" class="text-center">Encryption Details</th>
                </tr>
                <tr>
                    <th>Encryption Used</th>
                    <td><span class="badge bg-success">Yes</span></td>
                </tr>
            `;
            
            if (tx.encryptedType) {
                const typeDescription = getEncryptedTypeDescription(tx.encryptedType);
                encryptedSection += `
                    <tr>
                        <th>Encrypted Type</th>
                        <td>
                            <span class="badge bg-info">${tx.encryptedType}</span>
                            <small class="text-muted d-block mt-1">${typeDescription}</small>
                        </td>
                    </tr>
                `;
            }
            
            if (tx.originalValue) {
                encryptedSection += `
                    <tr>
                        <th>Original Value</th>
                        <td><code>${tx.originalValue}</code></td>
                    </tr>
                `;
            }
            
            if (tx.encryptedData) {
                encryptedSection += `
                    <tr>
                        <th>Encrypted Data</th>
                        <td>
                            <div class="input-group">
                                <input type="text" class="form-control font-monospace" value="${tx.encryptedData}" readonly>
                                <button class="btn btn-outline-secondary copy-data-btn" type="button" data-clipboard-text="${tx.encryptedData}">
                                    <i class="bi bi-clipboard"></i>
                                </button>
                            </div>
                            <small class="text-muted d-block mt-1">This data is encrypted and can only be decrypted by authorized parties</small>
                        </td>
                    </tr>
                `;
            }
        }
        
        // Populate modal with transaction details
        const detailsContent = document.getElementById('tx-details-content');
        detailsContent.innerHTML = `
            <div class="table-responsive">
                <table class="table table-striped">
                    <tbody>
                        <tr>
                            <th>Transaction Hash</th>
                            <td>
                                <div class="input-group">
                                    <input type="text" class="form-control font-monospace" value="${tx.hash}" readonly>
                                    <button class="btn btn-outline-secondary copy-data-btn" type="button" data-clipboard-text="${tx.hash}">
                                        <i class="bi bi-clipboard"></i>
                                    </button>
                                    <a href="${seismicConfig.network.explorer}/tx/${tx.hash}" target="_blank" class="btn btn-outline-primary">
                                        <i class="bi bi-box-arrow-up-right"></i>
                                    </a>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <th>Status</th>
                            <td>${getStatusBadge(tx.status)}</td>
                        </tr>
                        <tr>
                            <th>From</th>
                            <td>
                                <div class="input-group">
                                    <input type="text" class="form-control font-monospace" value="${tx.from}" readonly>
                                    <button class="btn btn-outline-secondary copy-data-btn" type="button" data-clipboard-text="${tx.from}">
                                        <i class="bi bi-clipboard"></i>
                                    </button>
                                    <a href="${seismicConfig.network.explorer}/address/${tx.from}" target="_blank" class="btn btn-outline-primary">
                                        <i class="bi bi-box-arrow-up-right"></i>
                                    </a>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <th>To</th>
                            <td>
                                <div class="input-group">
                                    <input type="text" class="form-control font-monospace" value="${tx.to}" readonly>
                                    <button class="btn btn-outline-secondary copy-data-btn" type="button" data-clipboard-text="${tx.to}">
                                        <i class="bi bi-clipboard"></i>
                                    </button>
                                    <a href="${seismicConfig.network.explorer}/address/${tx.to}" target="_blank" class="btn btn-outline-primary">
                                        <i class="bi bi-box-arrow-up-right"></i>
                                    </a>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <th>Value</th>
                            <td>${tx.value} ETH${tx.valueWei ? ` (${tx.valueWei} Wei)` : ''}</td>
                        </tr>
                        <tr>
                            <th>Network</th>
                            <td>${tx.network} (Chain ID: ${tx.chainId})</td>
                        </tr>
                        <tr>
                            <th>Time</th>
                            <td>${formattedDate}</td>
                        </tr>
                        ${tx.blockNumber ? `<tr>
                            <th>Block Number</th>
                            <td>
                                <a href="${seismicConfig.network.explorer}/block/${tx.blockNumber}" target="_blank">
                                    ${tx.blockNumber}
                                </a>
                            </td>
                        </tr>` : ''}
                        ${tx.gasUsed ? `<tr>
                            <th>Gas Used</th>
                            <td>${tx.gasUsed}</td>
                        </tr>` : ''}
                        ${encryptedSection}
                    </tbody>
                </table>
            </div>
        `;
        
        // Add clipboard functionality to copy buttons
        document.querySelectorAll('.copy-data-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const text = btn.getAttribute('data-clipboard-text');
                navigator.clipboard.writeText(text)
                    .then(() => {
                        const originalHtml = btn.innerHTML;
                        btn.innerHTML = '<i class="bi bi-check-lg"></i>';
                        setTimeout(() => {
                            btn.innerHTML = originalHtml;
                        }, 1500);
                    })
                    .catch(err => {
                        console.error('Failed to copy text:', err);
                    });
            });
        });
        
        // Show the modal using Bootstrap
        const txDetailsModal = new bootstrap.Modal(document.getElementById('tx-details-modal'));
        txDetailsModal.show();
    }
    
    // Helper function to get status badge HTML
    function getStatusBadge(status) {
        if (status === 'pending') {
            return '<span class="badge bg-warning">Pending</span>';
        } else if (status === 'confirmed') {
            return '<span class="badge bg-success">Confirmed</span>';
        } else {
            return '<span class="badge bg-danger">Failed</span>';
        }
    }
    
    // Clear transaction history
    function clearTransactionHistory() {
        if (confirm('Are you sure you want to clear your transaction history? This cannot be undone.')) {
            // Clear the array
            transactionHistory = [];
            
            // Remove from localStorage
            localStorage.removeItem('transactionHistory');
            
            // Update UI
            updateTransactionHistory();
            
            showSuccess('Transaction history cleared successfully');
        }
    }
    
    // Toggle input fields based on selected encrypted type
    function toggleEncryptedTypeInputs() {
        const selectedType = encryptedTypeSelect.value;
        
        // Hide all input groups
        suintInputGroup.classList.add('d-none');
        saddressInputGroup.classList.add('d-none');
        sboolInputGroup.classList.add('d-none');
        
        // Show the selected input group
        switch (selectedType) {
            case 'suint':
                suintInputGroup.classList.remove('d-none');
                break;
            case 'saddress':
                saddressInputGroup.classList.remove('d-none');
                break;
            case 'sbool':
                sboolInputGroup.classList.remove('d-none');
                break;
        }
        
        // Reset the encryption result
        encryptionResult.textContent = 'Encrypted value will appear here after encryption';
        currentEncryptedData = null;
        sendEncryptedTxBtn.disabled = true;
    }
    
    // Encrypt data using Seismic SDK
    async function encryptData() {
        if (!seismic.wallet) {
            showError('Please connect your wallet first');
            return;
        }
        
        const type = encryptedTypeSelect.value;
        let value;
        
        // Get the value based on type
        switch (type) {
            case 'suint':
                value = suintValue.value.trim();
                if (!value || isNaN(parseInt(value))) {
                    showError('Please enter a valid integer');
                    return;
                }
                value = parseInt(value);
                break;
            
            case 'saddress':
                value = saddressValue.value.trim();
                if (!ethers.utils.isAddress(value)) {
                    showError('Please enter a valid Ethereum address');
                    return;
                }
                break;
            
            case 'sbool':
                value = sboolTrueRadio.checked;
                break;
        }
        
        try {
            loadingOverlay.classList.remove('d-none');
            loadingText.textContent = 'Encrypting data...';
            
            // Encrypt the data
            const encrypted = await seismic.encrypt(type, value);
            currentEncryptedData = encrypted;
            
            // Display the encrypted result
            encryptionResult.innerHTML = `
                <div class="mb-2"><span class="badge bg-secondary">Type:</span> ${type}</div>
                <div class="mb-2"><span class="badge bg-secondary">Original:</span> ${value.toString()}</div>
                <div><span class="badge bg-success">Encrypted:</span> ${encrypted.encryptedValue}</div>
            `;
            
            // Enable the send button
            sendEncryptedTxBtn.disabled = false;
            
            showSuccess('Data encrypted successfully!');
        } catch (error) {
            console.error('Failed to encrypt data:', error);
            showError('Failed to encrypt data. Please try again.');
        } finally {
            loadingOverlay.classList.add('d-none');
        }
    }
    
    // Send encrypted transaction
    async function sendEncryptedTransaction() {
        if (!seismic.wallet) {
            showError('Please connect your wallet first');
            return;
        }
            
        if (!currentEncryptedData) {
            showError('Please encrypt data first');
            return;
        }
            
        try {
            loadingOverlay.classList.remove('d-none');
            loadingText.textContent = 'Preparing encrypted transaction...';
            
            // Get recipient address from UI or use own address if empty
            const recipientAddress = encryptedRecipientAddressInput.value.trim();
            const finalRecipientAddress = recipientAddress || seismic.wallet.address;
            
            // Validate inputs
            if (!ethers.utils.isAddress(finalRecipientAddress)) {
                showError('Please enter a valid Ethereum address');
                loadingOverlay.classList.add('d-none');
                return;
            }
                
            // Prepare transaction data with encrypted field
            let txData = {
                to: finalRecipientAddress,
                value: ethers.utils.parseEther('0'), // No ETH value for encrypted transactions for simplicity
                encryptedData: currentEncryptedData
            };
                
            loadingText.textContent = 'Sending encrypted transaction...';
                
            // Send transaction
            const tx = await seismic.sendTransaction(txData);
                
            loadingText.textContent = 'Encrypted transaction submitted. Waiting for confirmation...';
            
            // Get the original value and type for record keeping
            const type = encryptedTypeSelect.value;
            let originalValue;
            
            switch (type) {
                case 'suint':
                    originalValue = suintValue.value.trim();
                    break;
                case 'saddress':
                    originalValue = saddressValue.value.trim();
                    break;
                case 'sbool':
                    originalValue = sboolTrueRadio.checked ? 'true' : 'false';
                    break;
            }
            
            // Add to transaction history
            const txRecord = {
                hash: tx.hash,
                from: seismic.wallet.address,
                to: finalRecipientAddress,
                value: '0',
                valueWei: '0',
                useEncryption: true,
                encryptedType: type,
                encryptedData: currentEncryptedData.encryptedValue,
                originalValue: originalValue,
                isSelfTransaction: finalRecipientAddress === seismic.wallet.address,
                status: 'pending',
                timestamp: Date.now(),
                network: seismicConfig.network.name,
                chainId: seismicConfig.network.chainId
            };
            
            transactionHistory.unshift(txRecord);
            
            // Save to localStorage
            saveTransactionHistory();
            
            // Update UI
            updateTransactionHistory();
                
            // Wait for confirmation
            const receipt = await tx.wait();
            
            // Update transaction status
            const txIndex = transactionHistory.findIndex(t => t.hash === tx.hash);
            if (txIndex !== -1) {
                transactionHistory[txIndex].status = receipt.status === 1 ? 'confirmed' : 'failed';
                transactionHistory[txIndex].blockNumber = receipt.blockNumber;
                transactionHistory[txIndex].gasUsed = receipt.gasUsed.toString();
                
                // Save updated history
                saveTransactionHistory();
                
                // Update UI
                updateTransactionHistory();
            }
                
            // Show success message
            showTransactionResult(tx, receipt);
                
            // Reset the form
            resetEncryptedForm();
                
            // Refresh balance
            refreshBalance();
                
        } catch (error) {
            console.error('Failed to send encrypted transaction:', error);
            showError('Failed to send encrypted transaction. Please try again.');
        } finally {
            loadingOverlay.classList.add('d-none');
        }
    }
    
    // Reset encrypted form
    function resetEncryptedForm() {
        encryptionResult.textContent = 'Encrypted value will appear here after encryption';
        currentEncryptedData = null;
        sendEncryptedTxBtn.disabled = true;
        
        // Reset inputs
        suintValue.value = '';
        saddressValue.value = '';
        sboolTrueRadio.checked = true;
    }
    
    // Show transaction result in modal
    function showTransactionResult(tx, receipt) {
        let resultHTML = '';
        
        if (receipt.status === 1) {
            resultHTML = `
                <div class="alert alert-success">
                    <i class="bi bi-check-circle-fill me-2"></i> Transaction confirmed successfully!
                </div>
            `;
                        } else {
            resultHTML = `
                <div class="alert alert-danger">
                    <i class="bi bi-x-circle-fill me-2"></i> Transaction failed!
                </div>
            `;
        }
        
        resultHTML += `
            <div class="tx-details">
                <div class="row mb-2">
                    <div class="col-4 tx-details-label">Transaction Hash:</div>
                    <div class="col-8 tx-hash">${tx.hash}</div>
                </div>
                <div class="row mb-2">
                    <div class="col-4 tx-details-label">Block Number:</div>
                    <div class="col-8">${receipt.blockNumber}</div>
                </div>
                <div class="row mb-2">
                    <div class="col-4 tx-details-label">Gas Used:</div>
                    <div class="col-8">${receipt.gasUsed.toString()}</div>
                </div>
            </div>
        `;
        
        transactionResult.innerHTML = resultHTML;
        
        // Set explorer link
        txExplorerLink.href = `${seismicConfig.network.explorer}/tx/${tx.hash}`;
        
        // Show modal
        transactionModal.show();
    }
    
    // Helper function to show error
    function showError(message) {
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-danger alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3';
        alertDiv.style.zIndex = '9999';
        alertDiv.style.maxWidth = '500px';
        
        alertDiv.innerHTML = `
            <i class="bi bi-exclamation-triangle-fill me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        
        document.body.appendChild(alertDiv);
        
        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            alertDiv.classList.remove('show');
            setTimeout(() => alertDiv.remove(), 300);
        }, 5000);
    }
    
    // Helper function to show success
    function showSuccess(message) {
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-success alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3';
        alertDiv.style.zIndex = '9999';
        alertDiv.style.maxWidth = '500px';
        
        alertDiv.innerHTML = `
            <i class="bi bi-check-circle-fill me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        
        document.body.appendChild(alertDiv);
        
        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            alertDiv.classList.remove('show');
            setTimeout(() => alertDiv.remove(), 300);
        }, 5000);
    }
    
    // Event listeners
    connectWalletBtn.addEventListener('click', connectWallet);
    addNetworkBtn.addEventListener('click', addNetwork);
    refreshBalanceBtn.addEventListener('click', refreshBalance);
    copyAddressBtn.addEventListener('click', copyAddress);
    transactionForm.addEventListener('submit', sendTransaction);
    encryptedTypeSelect.addEventListener('change', toggleEncryptedTypeInputs);
    encryptDataBtn.addEventListener('click', encryptData);
    sendEncryptedTxBtn.addEventListener('click', sendEncryptedTransaction);
    clearHistoryBtn.addEventListener('click', clearTransactionHistory);
    
    // Check if MetaMask is installed
    if (!window.ethereum) {
        showError('This application requires MetaMask. Please install it to continue.');
        connectWalletBtn.disabled = true;
        addNetworkBtn.disabled = true;
    }
    
    // Initialize SDK on page load
    initializeSdk();
    
    // Initialize the encrypted type inputs
    toggleEncryptedTypeInputs();
    
    // Update transaction history UI
    updateTransactionHistory();
});

// Helper function to get description of encrypted type
function getEncryptedTypeDescription(type) {
    switch (type) {
        case 'suint':
            return 'Seismic Unsigned Integer - An encrypted version of a standard uint type';
        case 'saddress':
            return 'Seismic Address - An encrypted version of an Ethereum address';
        case 'sbool':
            return 'Seismic Boolean - An encrypted version of a true/false value';
        default:
            return 'Unknown encrypted type';
    }
} 