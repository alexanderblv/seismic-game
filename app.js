// Seismic Transaction Sender App
document.addEventListener('DOMContentLoaded', () => {
    // Initialize the SDK
    const seismic = new SeismicSDK();
    
    // Track transaction history
    const transactionHistory = [];
    
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
    
    // Encrypted Types Form Elements
    const encryptedTypeSelect = document.getElementById('encrypted-type');
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

    // Initialize the SDK
    async function initializeSdk() {
        try {
            await seismic.initialize();
            console.log('Seismic SDK initialized successfully');
            
            // Check if already connected to MetaMask
            if (window.ethereum && window.ethereum.selectedAddress) {
                connectWallet();
            }
        } catch (error) {
            console.error('Failed to initialize Seismic SDK:', error);
            showError('Failed to initialize the Seismic SDK. Please try again later.');
        }
    }

    // Connect wallet
    async function connectWallet() {
        try {
            loadingOverlay.classList.remove('d-none');
            loadingText.textContent = 'Connecting wallet...';
            
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
                
                console.log('Wallet connected successfully:', wallet.address);
            }
        } catch (error) {
            console.error('Failed to connect wallet:', error);
            showError('Failed to connect wallet. Please make sure you have MetaMask installed and try again.');
        } finally {
            loadingOverlay.classList.add('d-none');
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
        
        // Validate inputs
        if (!ethers.utils.isAddress(recipientAddress)) {
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
                to: recipientAddress,
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
            
            // Add to transaction history
            const txRecord = {
                hash: tx.hash,
                to: recipientAddress,
                value: amount,
                status: 'pending',
                timestamp: Date.now()
            };
            
            transactionHistory.unshift(txRecord);
            updateTransactionHistory();
            
            // Wait for confirmation
            const receipt = await tx.wait();
            
            // Update transaction status
            const txIndex = transactionHistory.findIndex(t => t.hash === tx.hash);
            if (txIndex !== -1) {
                transactionHistory[txIndex].status = receipt.status === 1 ? 'confirmed' : 'failed';
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
            
            // Format address
            const shortAddress = `${tx.to.substring(0, 6)}...${tx.to.substring(tx.to.length - 4)}`;
            
            // Create row
            row.innerHTML = `
                <td>
                    <a href="${seismicConfig.network.explorer}/tx/${tx.hash}" target="_blank" class="tx-hash">
                        ${tx.hash.substring(0, 10)}...
                    </a>
                </td>
                <td>${shortAddress}</td>
                <td>${tx.value} ETH</td>
                <td>${statusBadge}</td>
            `;
            
            transactionList.appendChild(row);
        });
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
            
            // For demo purposes, we're sending to a demo contract address
            // In a real implementation, you would deploy a contract that accepts encrypted data
            const demoContractAddress = seismic.wallet.address; // Using user's address for demo
            
            // Prepare transaction data
            const txData = {
                to: demoContractAddress,
                value: ethers.utils.parseEther("0.0001"), // Minimal amount for demo
                encryptedData: currentEncryptedData
            };
            
            loadingText.textContent = 'Sending encrypted transaction...';
            
            // Send transaction
            const tx = await seismic.sendTransaction(txData);
            
            loadingText.textContent = 'Transaction submitted. Waiting for confirmation...';
            
            // Add to transaction history with a special tag for encrypted data
            const txRecord = {
                hash: tx.hash,
                to: demoContractAddress,
                value: "0.0001",
                status: 'pending',
                timestamp: Date.now(),
                encrypted: true,
                encryptedType: currentEncryptedData.type
            };
            
            transactionHistory.unshift(txRecord);
            updateTransactionHistory();
            
            // Wait for confirmation
            const receipt = await tx.wait();
            
            // Update transaction status
            const txIndex = transactionHistory.findIndex(t => t.hash === tx.hash);
            if (txIndex !== -1) {
                transactionHistory[txIndex].status = receipt.status === 1 ? 'confirmed' : 'failed';
                updateTransactionHistory();
            }
            
            // Show success message
            showTransactionResult(tx, receipt);
            
            // Refresh balance
            refreshBalance();
            
            // Reset form
            resetEncryptedForm();
            
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
    
    // Encrypted types form event listeners
    encryptedTypeSelect.addEventListener('change', toggleEncryptedTypeInputs);
    encryptDataBtn.addEventListener('click', encryptData);
    sendEncryptedTxBtn.addEventListener('click', sendEncryptedTransaction);
    
    // Check if MetaMask is installed
    if (!window.ethereum) {
        showError('This application requires MetaMask. Please install it to continue.');
        connectWalletBtn.disabled = true;
        addNetworkBtn.disabled = true;
    }
    
    // Initialize SDK on page load
    initializeSdk();
    
    // Handle network changes
    if (window.ethereum) {
        window.ethereum.on('chainChanged', (chainId) => {
            console.log('Network changed:', chainId);
            // Reload the page when network changes
            window.location.reload();
        });
        
        window.ethereum.on('accountsChanged', (accounts) => {
            console.log('Accounts changed:', accounts);
            // Reload the page when account changes
            window.location.reload();
        });
    }
}); 