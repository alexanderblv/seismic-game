/**
 * Seismic App - ТОЛЬКО Privy интеграция
 */

document.addEventListener('DOMContentLoaded', async () => {
    console.log("🚀 Инициализация Seismic App с ТОЛЬКО Privy интеграцией");
    
    // Инициализация Seismic SDK
    const seismic = window.SeismicSDK ? new SeismicSDK() : null;
    
    // История транзакций
    let transactionHistory = [];
    
    // Загружаем историю из localStorage
    try {
        const savedHistory = localStorage.getItem('transactionHistory');
        if (savedHistory) {
            transactionHistory = JSON.parse(savedHistory);
            console.log(`📜 Загружено ${transactionHistory.length} транзакций из истории`);
        }
    } catch (error) {
        console.error('❌ Ошибка загрузки истории транзакций:', error);
        localStorage.removeItem('transactionHistory');
    }
    
    // DOM элементы
    const connectBtn = document.getElementById('connect-wallet');
    const disconnectBtn = document.getElementById('disconnect-wallet');
    const userAddress = document.getElementById('user-address');
    const userBalance = document.getElementById('user-balance');
    const refreshBalanceBtn = document.getElementById('refresh-balance');
    const copyAddressBtn = document.getElementById('copy-address');
    const connectionStatus = document.getElementById('connection-status');
    const networkBadge = document.getElementById('network-badge');
    const userInfo = document.getElementById('user-info');
    const userEmail = document.getElementById('user-email');
    const userPhone = document.getElementById('user-phone');
    const userWallets = document.getElementById('user-wallets');
    const walletAddress = document.getElementById('wallet-address');
    
    // Форма транзакций
    const transactionForm = document.getElementById('transaction-form');
    const recipientAddress = document.getElementById('recipient-address');
    const amount = document.getElementById('amount');
    const sendTransactionBtn = document.getElementById('send-transaction-btn');
    
    // История транзакций
    const noTransactions = document.getElementById('no-transactions');
    const transactionHistoryDiv = document.getElementById('transaction-history');
    const transactionList = document.getElementById('transaction-list');
    const clearHistoryBtn = document.getElementById('clear-history');
    
    // Модальные окна
    const loadingOverlay = document.getElementById('loading-overlay');
    const loadingText = document.getElementById('loading-text');
    const transactionModal = new bootstrap.Modal(document.getElementById('transaction-modal'));
    const transactionResult = document.getElementById('transaction-result');
    const txExplorerLink = document.getElementById('tx-explorer-link');
    
    /**
     * Показать загрузку
     */
    function showLoading(text = 'Загрузка...') {
        loadingText.textContent = text;
        loadingOverlay.classList.remove('d-none');
    }
    
    /**
     * Скрыть загрузку
     */
    function hideLoading() {
        loadingOverlay.classList.add('d-none');
    }
    
    /**
     * Показать успешное сообщение
     */
    function showSuccess(message) {
        const alert = document.createElement('div');
        alert.className = 'alert alert-success alert-dismissible fade show position-fixed';
        alert.style.cssText = 'top: 20px; right: 20px; z-index: 10000; min-width: 300px;';
        alert.innerHTML = `
            <i class="bi bi-check-circle me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        document.body.appendChild(alert);
        
        setTimeout(() => {
            if (alert.parentNode) {
                alert.parentNode.removeChild(alert);
            }
        }, 5000);
    }
    
    /**
     * Показать ошибку
     */
    function showError(message) {
        const alert = document.createElement('div');
        alert.className = 'alert alert-danger alert-dismissible fade show position-fixed';
        alert.style.cssText = 'top: 20px; right: 20px; z-index: 10000; min-width: 300px;';
        alert.innerHTML = `
            <i class="bi bi-exclamation-triangle me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        document.body.appendChild(alert);
        
        setTimeout(() => {
            if (alert.parentNode) {
                alert.parentNode.removeChild(alert);
            }
        }, 7000);
    }
    
    /**
     * Обновление UI при подключении кошелька
     */
    function updateConnectedUI() {
        if (!window.privyWalletConnector.isConnected()) return;
        
        const address = window.privyWalletConnector.getSelectedAccount();
        const userInfo = window.privyWalletConnector.getUserInfo();
        
        if (address) {
            // Обновляем кнопки
            connectBtn.classList.add('d-none');
            disconnectBtn.classList.remove('d-none');
            
            // Обновляем адрес
            const shortAddress = `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
            userAddress.value = address;
            
            // Показываем полный адрес
            if (walletAddress) {
                walletAddress.querySelector('span').textContent = address;
                walletAddress.classList.remove('d-none');
            }
            
            // Включаем кнопки
            copyAddressBtn.disabled = false;
            refreshBalanceBtn.disabled = false;
            sendTransactionBtn.disabled = false;
            
            // Обновляем статус
            connectionStatus.textContent = 'Подключен';
            connectionStatus.className = 'badge bg-success';
            
            // Обновляем сеть
            networkBadge.textContent = 'Ethereum';
            networkBadge.className = 'badge bg-success';
            
            // Показываем информацию о пользователе
            if (userInfo) {
                document.getElementById('user-email').textContent = userInfo.email || '-';
                document.getElementById('user-phone').textContent = userInfo.phone || '-';
                document.getElementById('user-wallets').textContent = userInfo.wallets?.length || 0;
                document.getElementById('user-info').classList.remove('d-none');
            }
            
            // Обновляем баланс
            refreshBalance();
            
            console.log('✅ UI обновлен для подключенного кошелька');
        }
    }
    
    /**
     * Обновление UI при отключении кошелька
     */
    function updateDisconnectedUI() {
        // Обновляем кнопки
        connectBtn.classList.remove('d-none');
        disconnectBtn.classList.add('d-none');
        
        // Очищаем данные
        userAddress.value = '';
        userBalance.value = '';
        
        // Скрываем полный адрес
        if (walletAddress) {
            walletAddress.classList.add('d-none');
        }
        
        // Отключаем кнопки
        copyAddressBtn.disabled = true;
        refreshBalanceBtn.disabled = true;
        sendTransactionBtn.disabled = true;
        
        // Обновляем статус
        connectionStatus.textContent = 'Не подключен';
        connectionStatus.className = 'badge bg-secondary';
        
        // Обновляем сеть
        networkBadge.textContent = 'Не выбрана';
        networkBadge.className = 'badge bg-secondary';
        
        // Скрываем информацию о пользователе
        document.getElementById('user-info').classList.add('d-none');
        
        console.log('🔌 UI обновлен для отключенного кошелька');
    }
    
    /**
     * Подключение кошелька через Privy
     */
    async function connectWallet() {
        try {
            showLoading('Подключение через Privy...');
            
            console.log('🔗 Начинаем подключение через Privy');
            
            const wallet = await window.privyWalletConnector.connect();
            
            if (wallet) {
                console.log('✅ Кошелек подключен:', wallet);
                updateConnectedUI();
                showSuccess('Кошелек успешно подключен через Privy!');
            } else {
                throw new Error('Не удалось получить данные кошелька');
            }
            
        } catch (error) {
            console.error('❌ Ошибка подключения кошелька:', error);
            showError('Ошибка подключения кошелька: ' + error.message);
        } finally {
            hideLoading();
        }
    }
    
    /**
     * Отключение кошелька
     */
    async function disconnectWallet() {
        try {
            showLoading('Отключение кошелька...');
            
            console.log('🔌 Отключение кошелька');
            
            await window.privyWalletConnector.disconnect();
            updateDisconnectedUI();
            showSuccess('Кошелек отключен');
            
        } catch (error) {
            console.error('❌ Ошибка отключения кошелька:', error);
            showError('Ошибка отключения кошелька: ' + error.message);
        } finally {
            hideLoading();
        }
    }
    
    /**
     * Обновление баланса
     */
    async function refreshBalance() {
        try {
            const address = window.privyWalletConnector.getSelectedAccount();
            if (!address) return;
            
            console.log('💰 Обновление баланса для', address);
            
            const balance = await window.privyWalletConnector.getBalance(address);
            userBalance.value = balance + ' ETH';
            
            console.log('✅ Баланс обновлен:', balance);
            
        } catch (error) {
            console.error('❌ Ошибка обновления баланса:', error);
            userBalance.value = 'Ошибка загрузки';
        }
    }
    
    /**
     * Копирование адреса
     */
    function copyAddress() {
        const address = userAddress.value;
        if (address) {
            navigator.clipboard.writeText(address).then(() => {
                showSuccess('Адрес скопирован в буфер обмена');
            }).catch(() => {
                showError('Не удалось скопировать адрес');
            });
        }
    }
    
    /**
     * Отправка транзакции
     */
    async function sendTransaction(event) {
        event.preventDefault();
        
        try {
            if (!window.privyWalletConnector.isConnected()) {
                showError('Сначала подключите кошелек');
                return;
            }
            
            const to = recipientAddress.value.trim();
            const value = amount.value.trim();
            
            if (!to || !value) {
                showError('Заполните все поля');
                return;
            }
            
            if (parseFloat(value) <= 0) {
                showError('Сумма должна быть больше 0');
                return;
            }
            
            showLoading('Отправка транзакции...');
            
            console.log('💸 Отправка транзакции:', { to, value });
            
            // Конвертируем ETH в Wei
            const valueInWei = '0x' + (parseFloat(value) * Math.pow(10, 18)).toString(16);
            
            const txParams = {
                to: to,
                value: valueInWei,
                from: window.privyWalletConnector.getSelectedAccount()
            };
            
            const txHash = await window.privyWalletConnector.sendTransaction(txParams);
            
            console.log('✅ Транзакция отправлена:', txHash);
            
            // Добавляем в историю
            const transaction = {
                hash: txHash,
                to: to,
                value: value,
                timestamp: Date.now(),
                status: 'pending'
            };
            
            transactionHistory.unshift(transaction);
            saveTransactionHistory();
            updateTransactionHistory();
            
            // Показываем результат
            showTransactionResult(txHash, to, value);
            
            // Очищаем форму
            recipientAddress.value = '';
            amount.value = '';
            
            // Обновляем баланс через некоторое время
            setTimeout(refreshBalance, 2000);
            
        } catch (error) {
            console.error('❌ Ошибка отправки транзакции:', error);
            showError('Ошибка отправки транзакции: ' + error.message);
        } finally {
            hideLoading();
        }
    }
    
    /**
     * Показать результат транзакции
     */
    function showTransactionResult(txHash, to, value) {
        transactionResult.innerHTML = `
            <div class="alert alert-success">
                <h6><i class="bi bi-check-circle me-2"></i>Транзакция отправлена!</h6>
                <p class="mb-2"><strong>Hash:</strong> <code>${txHash}</code></p>
                <p class="mb-2"><strong>Получатель:</strong> <code>${to}</code></p>
                <p class="mb-0"><strong>Сумма:</strong> ${value} ETH</p>
            </div>
        `;
        
        // Настраиваем ссылку на explorer
        txExplorerLink.href = `https://etherscan.io/tx/${txHash}`;
        txExplorerLink.classList.remove('d-none');
        
        transactionModal.show();
    }
    
    /**
     * Сохранение истории транзакций
     */
    function saveTransactionHistory() {
        try {
            localStorage.setItem('transactionHistory', JSON.stringify(transactionHistory));
        } catch (error) {
            console.error('❌ Ошибка сохранения истории:', error);
        }
    }
    
    /**
     * Обновление отображения истории транзакций
     */
    function updateTransactionHistory() {
        if (transactionHistory.length === 0) {
            noTransactions.classList.remove('d-none');
            transactionHistoryDiv.classList.add('d-none');
        } else {
            noTransactions.classList.add('d-none');
            transactionHistoryDiv.classList.remove('d-none');
            
            transactionList.innerHTML = transactionHistory.map(tx => `
                <div class="card mb-2">
                    <div class="card-body">
                        <div class="row align-items-center">
                            <div class="col-md-6">
                                <small class="text-muted">Hash:</small><br>
                                <code class="small">${tx.hash.substring(0, 20)}...</code>
                            </div>
                            <div class="col-md-3">
                                <small class="text-muted">Сумма:</small><br>
                                <strong>${tx.value} ETH</strong>
                            </div>
                            <div class="col-md-3">
                                <small class="text-muted">Дата:</small><br>
                                <small>${new Date(tx.timestamp).toLocaleString()}</small>
                            </div>
                        </div>
                        <div class="mt-2">
                            <a href="https://etherscan.io/tx/${tx.hash}" target="_blank" class="btn btn-sm btn-outline-primary">
                                <i class="bi bi-box-arrow-up-right"></i> Explorer
                            </a>
                        </div>
                    </div>
                </div>
            `).join('');
        }
    }
    
    /**
     * Очистка истории транзакций
     */
    function clearTransactionHistory() {
        if (confirm('Вы уверены, что хотите очистить историю транзакций?')) {
            transactionHistory = [];
            saveTransactionHistory();
            updateTransactionHistory();
            showSuccess('История транзакций очищена');
        }
    }
    
    /**
     * Инициализация приложения
     */
    async function initializeApp() {
        try {
            showLoading('Инициализация приложения...');
            
            console.log('🔧 Инициализация Privy Wallet Connector');
            
            // Инициализируем Privy коннектор
            const initialized = await window.privyWalletConnector.initialize();
            
            if (!initialized) {
                throw new Error('Не удалось инициализировать Privy');
            }
            
            // Инициализируем Seismic SDK если доступен
            if (seismic) {
                console.log('🔧 Инициализация Seismic SDK');
                await seismic.initialize({
                    network: window.seismicConfig?.network || {
                        chainId: 1,
                        name: "Ethereum",
                        rpcUrl: "https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161"
                    },
                    encryptionEnabled: true
                });
            }
            
            // Обновляем историю транзакций
            updateTransactionHistory();
            
            console.log('✅ Приложение инициализировано');
            
        } catch (error) {
            console.error('❌ Ошибка инициализации:', error);
            showError('Ошибка инициализации приложения: ' + error.message);
        } finally {
            hideLoading();
        }
    }
    
    // Обработчики событий
    connectBtn.addEventListener('click', connectWallet);
    disconnectBtn.addEventListener('click', disconnectWallet);
    refreshBalanceBtn.addEventListener('click', refreshBalance);
    copyAddressBtn.addEventListener('click', copyAddress);
    transactionForm.addEventListener('submit', sendTransaction);
    clearHistoryBtn.addEventListener('click', clearTransactionHistory);
    
    // Слушаем события от Privy
    document.addEventListener('wallet:connected', (event) => {
        console.log('📡 Событие wallet:connected', event.detail);
        updateConnectedUI();
    });
    
    document.addEventListener('wallet:disconnected', (event) => {
        console.log('📡 Событие wallet:disconnected', event.detail);
        updateDisconnectedUI();
    });
    
    document.addEventListener('wallet:created', (event) => {
        console.log('📡 Событие wallet:created', event.detail);
        showSuccess('Новый кошелек создан через Privy!');
    });
    
    // Инициализируем приложение
    await initializeApp();
    
    console.log('🎉 Seismic App с ТОЛЬКО Privy интеграцией готов к работе!');
}); 