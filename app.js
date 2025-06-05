// Seismic Transaction Sender App with Privy Integration

// Provider conflict management
(function() {
    console.log('🔧 Initializing provider conflict management...');
    
    // Detect existing wallet providers
    const detectedProviders = [];
    if (window.ethereum) {
        if (window.ethereum.isMetaMask) detectedProviders.push('MetaMask');
        if (window.ethereum.isCoinbaseWallet) detectedProviders.push('Coinbase');
        if (window.ethereum.isPhantom) detectedProviders.push('Phantom');
    }
    
    if (detectedProviders.length > 0) {
        console.log('🦊 Detected wallet extensions:', detectedProviders.join(', '));
        console.log('ℹ️ Privy SDK will manage wallet connections to prevent conflicts');
    }
    
    // Suppress specific MetaMask warnings
    const originalError = console.error;
    console.error = function(...args) {
        const message = args.join(' ');
        if (message.includes('MetaMask encountered an error setting the global Ethereum provider') ||
            message.includes('Cannot set property ethereum') ||
            message.includes('which has only a getter')) {
            console.log('🔇 MetaMask provider conflict suppressed - using Privy for wallet management');
            return;
        }
        originalError.apply(console, args);
    };
})();

// Debug function to log environment status
function logEnvironmentStatus(title) {
    console.group(title || 'Web3 Environment Status');
    console.log('window.PrivySDK:', window.PrivySDK ? 'Available' : 'Not available');
    console.log('window.ethers:', window.ethers ? 'Available' : 'Not available');
    console.log('window.walletConnector:', window.walletConnector ? 'Available' : 'Not available');
    console.log('window.seismicConfig:', window.seismicConfig ? 'Available' : 'Not available');
    console.groupEnd();
}

// Log environment status when the script loads
logEnvironmentStatus('Initial Web3 Environment');

document.addEventListener('DOMContentLoaded', () => {
    // Log environment status again when DOM is loaded
    logEnvironmentStatus('DOM Loaded Web3 Environment');
    
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
    const disconnectWalletBtn = document.getElementById('disconnect-wallet');
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
            // Listen to wallet connected event (comes from accountsChanged in the new implementation)
            document.addEventListener('wallet:accountsChanged', (event) => {
                console.log('Account changed event:', event.detail);
                
                if (event.detail && event.detail.account) {
                    completeWalletConnection(event.detail.account);
                }
            });
            
            // Listen to network changed event
            document.addEventListener('wallet:networkChanged', (event) => {
                console.log('Network changed event:', event.detail);
                // Reload the page when network changes
                window.location.reload();
            });
            
            // Listen to wallet disconnected event
            document.addEventListener('wallet:walletDisconnected', (event) => {
                console.log('Wallet disconnected event');
                handleWalletDisconnected();
            });
        }
    }

    // Handle wallet disconnection
    function handleWalletDisconnected() {
        // Show not connected alert and hide connected section
        document.getElementById('wallet-not-connected').classList.remove('d-none');
        document.getElementById('wallet-connected').classList.add('d-none');
        
        // Update UI to show disconnected state
        connectWalletBtn.classList.remove('d-none');
        disconnectWalletBtn.classList.add('d-none');
        
        // Update wallet status badges
        document.getElementById('wallet-type').textContent = 'Not Connected';
        document.getElementById('wallet-type').classList.remove('bg-success');
        document.getElementById('wallet-type').classList.add('bg-secondary');
        
        document.getElementById('network-status').textContent = 'Seismic devnet';
        document.getElementById('network-status').classList.remove('bg-success');
        document.getElementById('network-status').classList.add('bg-secondary');
        
        // Clear wallet display
        walletAddress.classList.add('d-none');
        walletAddress.textContent = '';
        userAddressInput.value = '';
        userBalanceInput.value = '';
        
        // Update old network status (if exists)
        if (networkBadge) {
            networkBadge.textContent = 'Seismic devnet';
            networkBadge.classList.remove('bg-success');
            networkBadge.classList.add('bg-secondary');
        }
        
        // Update old connection status (if exists)
        if (connectionStatus) {
            connectionStatus.textContent = 'Disconnected';
            connectionStatus.classList.remove('bg-success');
            connectionStatus.classList.add('bg-secondary');
        }
        
        // Disable form elements
        const submitBtn = transactionForm.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = true;
        }
        copyAddressBtn.disabled = true;
        refreshBalanceBtn.disabled = true;
        
        console.log('Wallet disconnected and UI updated');
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
                    // Hide not connected alert and show connected section
                    document.getElementById('wallet-not-connected').classList.add('d-none');
                    document.getElementById('wallet-connected').classList.remove('d-none');
                    
                    // Update UI to show connected state
                    connectWalletBtn.classList.add('d-none');
                    disconnectWalletBtn.classList.remove('d-none');
                    
                    // Update wallet status badges
                    document.getElementById('wallet-type').textContent = 'Privy Connected';
                    document.getElementById('wallet-type').classList.remove('bg-secondary');
                    document.getElementById('wallet-type').classList.add('bg-success');
                    
                    document.getElementById('network-status').textContent = seismicConfig.network.name;
                    document.getElementById('network-status').classList.remove('bg-secondary');
                    document.getElementById('network-status').classList.add('bg-success');
                    
                    // Show user address
                    const shortAddress = `${wallet.address.substring(0, 6)}...${wallet.address.substring(wallet.address.length - 4)}`;
                    walletAddress.textContent = shortAddress;
                    walletAddress.classList.remove('d-none');
                    userAddressInput.value = wallet.address;
                    
                    // Update old network badge (if exists)
                    if (networkBadge) {
                        networkBadge.textContent = seismicConfig.network.name;
                        networkBadge.classList.remove('bg-secondary');
                        networkBadge.classList.add('bg-success');
                    }
                    
                    // Update old connection status (if exists)
                    if (connectionStatus) {
                        connectionStatus.textContent = 'Connected';
                        connectionStatus.classList.remove('bg-secondary');
                        connectionStatus.classList.add('bg-success');
                    }
                    
                    // Enable form elements
                    const submitBtn = transactionForm.querySelector('button[type="submit"]');
                    if (submitBtn) {
                        submitBtn.disabled = false;
                    }
                    copyAddressBtn.disabled = false;
                    refreshBalanceBtn.disabled = false;
                    
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

    // Initialize Seismic SDK and wallet connector
    async function initializeSdk() {
        try {
            loadingOverlay.classList.remove('d-none');
            loadingText.textContent = '🌊 Загрузка Seismic Game. Инициализация React приложения с Privy SDK...';
            
            console.log('🚀 Начало инициализации приложения...');
            
            // Wait for ethers to be available with timeout
            if (typeof window.ethers === 'undefined') {
                console.error('❌ Ethers.js недоступен');
                throw new Error('Ethers.js требуется, но не загружен');
            }
            
            // Initialize the Seismic SDK
            console.log('🔧 Инициализация Seismic SDK...');
            loadingText.textContent = 'Инициализация Seismic SDK...';
            
            await seismic.initialize({
                network: seismicConfig.network,
                rpcUrl: seismicConfig.network.rpcUrl,
                encryptionEnabled: true
            });
            
            console.log('✅ Seismic SDK инициализирован');
            
            // Wait for DOM to be fully loaded
            await new Promise(resolve => {
                if (document.readyState === 'complete') {
                    resolve();
                } else {
                    window.addEventListener('load', resolve);
                }
            });

            // Initialize wallet connector with improved timeout and error handling
            loadingText.textContent = 'Подключение к кошельку...';
            
            try {
                console.log('🔗 Инициализация wallet connector...');
                
                // Check if walletConnector is available
                if (!window.walletConnector) {
                    throw new Error('WalletConnector недоступен');
                }
                
                // Add timeout to prevent infinite loading
                const initTimeout = new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Таймаут инициализации wallet connector')), 20000)
                );
                
                const initResult = await Promise.race([
                    window.walletConnector.initialize(),
                    initTimeout
                ]);
                
                if (initResult) {
                    console.log('✅ Wallet connector инициализирован успешно');
                    
                    // Set up event listeners
                    setupWalletListeners();
                    
                    console.log('✅ Приложение работает с Privy SDK');
                } else {
                    console.warn('⚠️ Wallet connector инициализирован с ограничениями');
                }
                
            } catch (connectorError) {
                console.error('❌ Wallet connector не смог инициализироваться:', connectorError);
                let errorMessage = 'Не удалось инициализировать подключение к кошельку.';
                
                if (connectorError.message) {
                    if (connectorError.message.includes('timeout') || connectorError.message.includes('таймаут')) {
                        errorMessage = 'Истекло время ожидания загрузки сервиса кошелька. Проверьте подключение к интернету и обновите страницу.';
                    } else if (connectorError.message.includes('Privy SDK not found') || 
                        connectorError.message.includes('Privy SDK failed to load') ||
                        connectorError.message.includes('Приvy SDK')) {
                        errorMessage = 'Не удалось загрузить сервис кошелька. Проверьте подключение к интернету и обновите страницу.';
                    } else {
                        errorMessage = `Ошибка инициализации кошелька: ${connectorError.message}`;
                    }
                }
                
                showError(errorMessage);
                // Don't throw error here to allow app to continue with limited functionality
                console.warn('⚠️ Приложение продолжит работу с ограниченной функциональностью');
                console.warn('⚠️ Вы сможете попробовать подключить кошелек позже');
            }
            
        } catch (error) {
            console.error('❌ Не удалось инициализировать SDK:', error);
            showError('Не удалось инициализировать приложение. Пожалуйста, обновите страницу.');
        } finally {
            // Always hide loading overlay
            setTimeout(() => {
                loadingOverlay.classList.add('d-none');
                console.log('✅ Инициализация завершена');
            }, 1000);
        }
    }

    // Connect wallet using Privy
    async function connectWallet() {
        if (walletConnectInitiated) {
            console.log('Wallet connection already in progress');
            return;
        }

        try {
            walletConnectInitiated = true;
            
            // Update connect button to show loading state
            connectWalletBtn.disabled = true;
            connectWalletBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status"></span>Connecting...';
            
            loadingOverlay.classList.remove('d-none');
            loadingText.textContent = 'Connecting wallet with Privy...';

            console.log('Starting wallet connection...');

            // Use Privy to connect
            const connected = await window.walletConnector.connect();
            
            if (connected) {
                console.log('Wallet connected successfully');
                loadingText.textContent = 'Setting up wallet...';
                // completeWalletConnection will be called by the event listener
            } else {
                console.log('Wallet connection failed or cancelled');
                showError('Wallet connection failed. Please try again.');
                walletConnectInitiated = false;
            }
        } catch (error) {
            console.error('Error connecting wallet:', error);
            let errorMessage = 'Failed to connect wallet.';
            
            if (error.message) {
                if (error.message.includes('User rejected') || error.message.includes('cancelled')) {
                    errorMessage = 'Connection cancelled. Please try again when ready.';
                } else if (error.message.includes('Privy not initialized')) {
                    errorMessage = 'Wallet service not ready. Please refresh the page and try again.';
                } else if (error.message.includes('No Ethereum provider available')) {
                    errorMessage = 'No wallet provider found. Please install a wallet or enable embedded wallet features.';
                } else {
                    errorMessage = `Connection failed: ${error.message}`;
                }
            }
            
            showError(errorMessage);
            walletConnectInitiated = false;
        } finally {
            loadingOverlay.classList.add('d-none');
            
            // Reset connect button
            connectWalletBtn.disabled = false;
            connectWalletBtn.innerHTML = '<i class="bi bi-wallet2"></i> Connect Wallet';
        }
    }

    // Disconnect wallet
    async function disconnectWallet() {
        try {
            loadingOverlay.classList.remove('d-none');
            loadingText.textContent = 'Disconnecting...';

            // Disconnect using Privy
            await window.walletConnector.disconnect();
            
            // Clear SDK connection
            await seismic.disconnect();
            
            console.log('Wallet disconnected successfully');
        } catch (error) {
            console.error('Error disconnecting wallet:', error);
            showError('Failed to disconnect wallet properly.');
        } finally {
            loadingOverlay.classList.add('d-none');
        }
    }

    // Add Seismic network to wallet
    async function addNetwork() {
        try {
            const provider = window.walletConnector.getProvider();
            if (!provider) {
                showError('Please connect your wallet first.');
                return;
            }

            const networkConfig = seismicConfig.network;
            
            await provider.send('wallet_addEthereumChain', [{
                chainId: `0x${networkConfig.chainId.toString(16)}`,
                chainName: networkConfig.name,
                rpcUrls: [networkConfig.rpcUrl],
                nativeCurrency: networkConfig.nativeCurrency,
                blockExplorerUrls: [networkConfig.explorer]
            }]);
            
            showSuccess('Seismic network added to your wallet successfully!');
        } catch (error) {
            console.error('Failed to add network:', error);
            if (error.code === 4902) {
                showError('This network is already added to your wallet.');
            } else {
                showError('Failed to add network. Please add it manually.');
            }
        }
    }

    // Refresh balance
    async function refreshBalance() {
        try {
            refreshBalanceBtn.disabled = true;
            refreshBalanceBtn.innerHTML = '<i class="bi bi-arrow-clockwise spin"></i>';
            
            if (seismic.wallet) {
                const balance = await seismic.getBalance();
                userBalanceInput.value = balance;
                console.log('Balance updated:', balance);
            }
        } catch (error) {
            console.error('Failed to refresh balance:', error);
            showError('Failed to refresh balance.');
        } finally {
            refreshBalanceBtn.disabled = false;
            refreshBalanceBtn.innerHTML = '<i class="bi bi-arrow-clockwise"></i>';
        }
    }

    // Copy address to clipboard
    function copyAddress() {
        const address = userAddressInput.value;
        if (address) {
            navigator.clipboard.writeText(address).then(() => {
                showSuccess('Address copied to clipboard!');
            }).catch(() => {
                // Fallback for older browsers
                userAddressInput.select();
                document.execCommand('copy');
                showSuccess('Address copied to clipboard!');
            });
        }
    }

    // Send transaction
    async function sendTransaction(event) {
        event.preventDefault();
        
        if (!seismic.wallet) {
            showError('Please connect your wallet first.');
            return;
        }

        const recipient = recipientAddressInput.value.trim();
        const amount = parseFloat(amountInput.value);
        const enableEncryption = enableEncryptionToggle.checked;
        const encryptedData = encryptedDataInput.value.trim();

        // Validation
        if (!recipient) {
            showError('Please enter a recipient address.');
            recipientAddressInput.focus();
            return;
        }

        if (!window.ethers.utils.isAddress(recipient)) {
            showError('Please enter a valid Ethereum address.');
            recipientAddressInput.focus();
            return;
        }

        if (isNaN(amount) || amount <= 0) {
            showError('Please enter a valid amount greater than 0.');
            amountInput.focus();
            return;
        }

        try {
            loadingOverlay.classList.remove('d-none');
            loadingText.textContent = 'Sending transaction...';

            console.log('Sending transaction:', { recipient, amount, enableEncryption, encryptedData });

            // Prepare transaction data
            const txData = {
                to: recipient,
                value: window.ethers.utils.parseEther(amount.toString()),
                data: enableEncryption ? encryptedData : null
            };

            let tx, receipt;

            if (enableEncryption && seismic.encryptionEnabled) {
                // Send encrypted transaction
                tx = await seismic.sendEncryptedTransaction(txData);
            } else {
                // Send regular transaction
                tx = await seismic.sendTransaction(txData);
            }

            console.log('Transaction sent:', tx.hash);
            
            // Wait for confirmation
            loadingText.textContent = 'Waiting for confirmation...';
            receipt = await tx.wait();
            
            console.log('Transaction confirmed:', receipt);

            // Add to history
            const historyEntry = {
                hash: tx.hash,
                from: seismic.wallet.address,
                to: recipient,
                value: amount,
                encrypted: enableEncryption,
                encryptedData: encryptedData || null,
                status: 'confirmed',
                timestamp: Date.now(),
                blockNumber: receipt.blockNumber,
                gasUsed: receipt.gasUsed.toString()
            };

            transactionHistory.unshift(historyEntry);
            saveTransactionHistory();
            updateTransactionHistory();

            // Show success
            showTransactionResult(tx, receipt);
            
            // Reset form
            transactionForm.reset();
            
            // Refresh balance
            refreshBalance();

        } catch (error) {
            console.error('Transaction failed:', error);
            
            let errorMessage = 'Transaction failed. Please try again.';
            if (error.message) {
                if (error.message.includes('insufficient funds')) {
                    errorMessage = 'Insufficient funds for this transaction.';
                } else if (error.message.includes('user rejected')) {
                    errorMessage = 'Transaction cancelled by user.';
                } else if (error.message.includes('gas')) {
                    errorMessage = 'Transaction failed due to gas issues. Please try again.';
                }
            }
            
            showError(errorMessage);
        } finally {
            loadingOverlay.classList.add('d-none');
        }
    }

    // Save transaction history to localStorage
    function saveTransactionHistory() {
        try {
            localStorage.setItem('transactionHistory', JSON.stringify(transactionHistory));
            console.log('Transaction history saved');
        } catch (error) {
            console.error('Failed to save transaction history:', error);
        }
    }

    // Update transaction history display
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

        // Add transactions
        transactionHistory.forEach((tx, index) => {
            const txElement = document.createElement('div');
            txElement.className = 'card mb-2';
            
            const shortHash = `${tx.hash.substring(0, 10)}...${tx.hash.substring(tx.hash.length - 8)}`;
            const shortTo = `${tx.to.substring(0, 6)}...${tx.to.substring(tx.to.length - 4)}`;
            const date = new Date(tx.timestamp).toLocaleString();
            
            txElement.innerHTML = `
                <div class="card-body py-2">
                    <div class="row align-items-center">
                        <div class="col-md-3">
                            <small class="text-muted">Hash</small>
                            <div class="font-monospace small">${shortHash}</div>
                        </div>
                        <div class="col-md-2">
                            <small class="text-muted">To</small>
                            <div class="font-monospace small">${shortTo}</div>
                        </div>
                        <div class="col-md-2">
                            <small class="text-muted">Value</small>
                            <div>${tx.value} ETH</div>
                        </div>
                        <div class="col-md-2">
                            <small class="text-muted">Status</small>
                            <div>${getStatusBadge(tx.status)}</div>
                        </div>
                        <div class="col-md-2">
                            <small class="text-muted">Date</small>
                            <div class="small">${date}</div>
                        </div>
                        <div class="col-md-1">
                            <a href="${seismicConfig.network.explorer}tx/${tx.hash}" target="_blank" class="btn btn-sm btn-outline-primary">
                                <i class="bi bi-box-arrow-up-right"></i>
                            </a>
                        </div>
                    </div>
                    ${tx.encrypted ? '<div class="mt-1"><span class="badge bg-success"><i class="bi bi-shield-lock"></i> Encrypted</span></div>' : ''}
                </div>
            `;
            
            transactionList.appendChild(txElement);
        });
    }

    // Get status badge HTML
    function getStatusBadge(status) {
        const statusMap = {
            'pending': '<span class="badge bg-warning">Pending</span>',
            'confirmed': '<span class="badge bg-success">Confirmed</span>',
            'failed': '<span class="badge bg-danger">Failed</span>'
        };
        return statusMap[status] || '<span class="badge bg-secondary">Unknown</span>';
    }

    // Clear transaction history
    function clearTransactionHistory() {
        if (confirm('Are you sure you want to clear all transaction history?')) {
            transactionHistory = [];
            saveTransactionHistory();
            updateTransactionHistory();
            showSuccess('Transaction history cleared.');
        }
    }

    // Toggle encrypted type inputs
    function toggleEncryptedTypeInputs() {
        const selectedType = encryptedTypeSelect.value;
        
        // Hide all input groups
        suintInputGroup.style.display = 'none';
        saddressInputGroup.style.display = 'none';
        sboolInputGroup.style.display = 'none';
        
        // Show relevant input group
        if (selectedType.startsWith('suint')) {
            suintInputGroup.style.display = 'block';
        } else if (selectedType === 'saddress') {
            saddressInputGroup.style.display = 'block';
        } else if (selectedType === 'sbool') {
            sboolInputGroup.style.display = 'block';
        }
        
        // Enable/disable encrypt button
        encryptDataBtn.disabled = !selectedType;
    }

    // Encrypt data using Seismic
    async function encryptData() {
        const selectedType = encryptedTypeSelect.value;
        if (!selectedType) {
            showError('Please select an encrypted type.');
            return;
        }

        if (!seismic.encryptionEnabled) {
            showError('Encryption is not enabled in the SDK.');
            return;
        }

        try {
            let value;
            
            // Get value based on type
            if (selectedType.startsWith('suint')) {
                value = parseInt(suintValue.value);
                if (isNaN(value)) {
                    showError('Please enter a valid integer value.');
                    return;
                }
            } else if (selectedType === 'saddress') {
                value = saddressValue.value.trim();
                if (!window.ethers.utils.isAddress(value)) {
                    showError('Please enter a valid Ethereum address.');
                    return;
                }
            } else if (selectedType === 'sbool') {
                if (!sboolTrueRadio.checked && !sboolFalseRadio.checked) {
                    showError('Please select a boolean value.');
                    return;
                }
                value = sboolTrueRadio.checked;
            }

            console.log('Encrypting value:', value, 'as type:', selectedType);

            // Encrypt the data
            currentEncryptedData = await seismic.encryptData(selectedType, value);
            
            // Show result
            const encryptedOutput = document.getElementById('encrypted-output');
            if (encryptedOutput) {
                encryptedOutput.textContent = currentEncryptedData;
            }
            encryptionResult.style.display = 'block';
            
            // Enable send button
            sendEncryptedTxBtn.disabled = false;

            showSuccess('Data encrypted successfully!');
        } catch (error) {
            console.error('Encryption failed:', error);
            showError('Failed to encrypt data. Please try again.');
        }
    }

    // Send encrypted transaction
    async function sendEncryptedTransaction() {
        const recipientAddress = encryptedRecipientAddressInput.value.trim();
        
        if (!recipientAddress) {
            showError('Please enter a contract address.');
            return;
        }

        if (!window.ethers.utils.isAddress(recipientAddress)) {
            showError('Please enter a valid contract address.');
            return;
        }

        if (!currentEncryptedData) {
            showError('Please encrypt data first.');
            return;
        }

        if (!seismic.wallet) {
            showError('Please connect your wallet first.');
            return;
        }

        try {
            loadingOverlay.classList.remove('d-none');
            loadingText.textContent = 'Sending encrypted transaction...';

            console.log('Sending encrypted transaction to:', recipientAddress);

            const txData = {
                to: recipientAddress,
                value: window.ethers.utils.parseEther('0'), // No ETH value for data transaction
                data: currentEncryptedData
            };

            const tx = await seismic.sendEncryptedTransaction(txData);
            console.log('Encrypted transaction sent:', tx.hash);

            // Wait for confirmation
            loadingText.textContent = 'Waiting for confirmation...';
            const receipt = await tx.wait();
            console.log('Encrypted transaction confirmed:', receipt);

            // Add to history
            const historyEntry = {
                hash: tx.hash,
                from: seismic.wallet.address,
                to: recipientAddress,
                value: 0,
                encrypted: true,
                encryptedData: currentEncryptedData,
                status: 'confirmed',
                timestamp: Date.now(),
                blockNumber: receipt.blockNumber,
                gasUsed: receipt.gasUsed.toString()
            };

            transactionHistory.unshift(historyEntry);
            saveTransactionHistory();
            updateTransactionHistory();

            // Show success
            showTransactionResult(tx, receipt);
            
            // Reset form
            resetEncryptedForm();
            
            // Refresh balance
            refreshBalance();

        } catch (error) {
            console.error('Encrypted transaction failed:', error);
            showError('Encrypted transaction failed. Please try again.');
        } finally {
            loadingOverlay.classList.add('d-none');
        }
    }

    // Reset encrypted form
    function resetEncryptedForm() {
        encryptedTypeSelect.value = '';
        encryptedRecipientAddressInput.value = '';
        suintValue.value = '';
        saddressValue.value = '';
        sboolTrueRadio.checked = false;
        sboolFalseRadio.checked = false;
        encryptionResult.style.display = 'none';
        currentEncryptedData = null;
        toggleEncryptedTypeInputs();
    }

    // Show transaction result modal
    function showTransactionResult(tx, receipt) {
        const resultHtml = `
            <div class="alert alert-success">
                <h6><i class="bi bi-check-circle"></i> Transaction Successful!</h6>
                <p class="mb-0">Your transaction has been confirmed on the blockchain.</p>
            </div>
            <div class="row">
                <div class="col-md-6">
                    <strong>Transaction Hash:</strong><br>
                    <code class="small">${tx.hash}</code>
                </div>
                <div class="col-md-6">
                    <strong>Block Number:</strong><br>
                    ${receipt.blockNumber}
                </div>
                <div class="col-md-6 mt-2">
                    <strong>Gas Used:</strong><br>
                    ${receipt.gasUsed.toString()}
                </div>
                <div class="col-md-6 mt-2">
                    <strong>Status:</strong><br>
                    <span class="badge bg-success">Confirmed</span>
                </div>
            </div>
        `;
        
        transactionResult.innerHTML = resultHtml;
        txExplorerLink.href = `${seismicConfig.network.explorer}tx/${tx.hash}`;
        transactionModal.show();
    }

    // Show error message
    function showError(message) {
        // Create or update error alert
        let errorAlert = document.getElementById('error-alert');
        if (!errorAlert) {
            errorAlert = document.createElement('div');
            errorAlert.id = 'error-alert';
            errorAlert.className = 'alert alert-danger alert-dismissible fade show position-fixed';
            errorAlert.style.cssText = 'top: 20px; right: 20px; z-index: 9999; max-width: 400px;';
            document.body.appendChild(errorAlert);
        }
        
        errorAlert.innerHTML = `
            <i class="bi bi-exclamation-triangle"></i> ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        // Auto hide after 5 seconds
        setTimeout(() => {
            if (errorAlert && errorAlert.parentNode) {
                errorAlert.remove();
            }
        }, 5000);
    }

    // Show success message
    function showSuccess(message) {
        // Create or update success alert
        let successAlert = document.getElementById('success-alert');
        if (!successAlert) {
            successAlert = document.createElement('div');
            successAlert.id = 'success-alert';
            successAlert.className = 'alert alert-success alert-dismissible fade show position-fixed';
            successAlert.style.cssText = 'top: 20px; right: 20px; z-index: 9999; max-width: 400px;';
            document.body.appendChild(successAlert);
        }
        
        successAlert.innerHTML = `
            <i class="bi bi-check-circle"></i> ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        // Auto hide after 3 seconds
        setTimeout(() => {
            if (successAlert && successAlert.parentNode) {
                successAlert.remove();
            }
        }, 3000);
    }

    // Event Listeners
    connectWalletBtn.addEventListener('click', connectWallet);
    disconnectWalletBtn.addEventListener('click', disconnectWallet);
    addNetworkBtn.addEventListener('click', addNetwork);
    refreshBalanceBtn.addEventListener('click', refreshBalance);
    copyAddressBtn.addEventListener('click', copyAddress);
    transactionForm.addEventListener('submit', sendTransaction);
    clearHistoryBtn.addEventListener('click', clearTransactionHistory);
    encryptedTypeSelect.addEventListener('change', toggleEncryptedTypeInputs);
    encryptDataBtn.addEventListener('click', encryptData);
    sendEncryptedTxBtn.addEventListener('click', sendEncryptedTransaction);

    // Show/hide encrypted data input based on encryption toggle
    enableEncryptionToggle.addEventListener('change', (e) => {
        const encryptedDataGroup = document.getElementById('encrypted-data-group');
        if (encryptedDataGroup) {
            encryptedDataGroup.style.display = e.target.checked ? 'block' : 'none';
        }
    });

    // Initialize the application
    initializeSdk().then(() => {
        console.log('Application initialized successfully');
        
        // Update transaction history display
        updateTransactionHistory();
        
        // Initialize encrypted type inputs
        toggleEncryptedTypeInputs();
    }).catch(error => {
        console.error('Failed to initialize application:', error);
        showError('Failed to initialize application. Please refresh the page.');
    });
}); 