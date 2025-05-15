document.addEventListener('DOMContentLoaded', function() {
    // Initialize Seismic Transaction Interface
    initSeismicTransactionInterface();

    // Плавная прокрутка к разделам
    window.scrollToSection = function(sectionId) {
        const section = document.getElementById(sectionId);
        if (section) {
            window.scrollTo({
                top: section.offsetTop - 80,
                behavior: 'smooth'
            });
        }
    };

    // Изменение полей формы в зависимости от типа транзакции
    const txTypeSelect = document.getElementById('tx-type');
    if (txTypeSelect) {
        txTypeSelect.addEventListener('change', function() {
            const paymentFields = document.getElementById('payment-fields');
            const nftFields = document.getElementById('nft-fields');
            const voteFields = document.getElementById('vote-fields');
            
            paymentFields.style.display = 'none';
            nftFields.style.display = 'none';
            voteFields.style.display = 'none';
            
            switch(this.value) {
                case 'payment':
                    paymentFields.style.display = 'block';
                    break;
                case 'nft':
                    nftFields.style.display = 'block';
                    break;
                case 'vote':
                    voteFields.style.display = 'block';
                    break;
            }
        });
    }

    // Обработка кнопки генерации транзакции
    const generateTxBtn = document.getElementById('generate-tx-btn');
    if (generateTxBtn) {
        generateTxBtn.addEventListener('click', generateTransaction);
    }

    // Функция генерации транзакции
    function generateTransaction() {
        const txType = document.getElementById('tx-type').value;
        const useEncryption = document.getElementById('use-encryption').checked;
        
        // Получение значений из формы в зависимости от типа транзакции
        let txData = {};
        switch(txType) {
            case 'payment':
                txData = {
                    recipient: document.getElementById('recipient').value,
                    amount: document.getElementById('amount').value
                };
                break;
            case 'nft':
                txData = {
                    recipient: document.getElementById('nft-recipient').value,
                    tokenId: document.getElementById('token-id').value
                };
                break;
            case 'vote':
                txData = {
                    proposalId: document.getElementById('proposal').value,
                    choice: document.getElementById('vote-choice').value === '1'
                };
                break;
        }
        
        // Генерация и отображение транзакций
        displayPublicTransaction(txType, txData);
        if (useEncryption) {
            displayEncryptedTransaction(txType, txData);
        } else {
            // Очистить зашифрованную транзакцию, если шифрование отключено
            document.getElementById('encrypted-tx-output').textContent = 'Шифрование Seismic отключено';
        }
    }

    // Отображение публичной транзакции
    function displayPublicTransaction(txType, data) {
        const output = document.getElementById('public-tx-output');
        let txContent = '';
        
        switch(txType) {
            case 'payment':
                txContent = generatePaymentTransaction(data, false);
                break;
            case 'nft':
                txContent = generateNftTransaction(data, false);
                break;
            case 'vote':
                txContent = generateVoteTransaction(data, false);
                break;
        }
        
        output.innerHTML = txContent;
    }

    // Отображение зашифрованной транзакции
    function displayEncryptedTransaction(txType, data) {
        const output = document.getElementById('encrypted-tx-output');
        let txContent = '';
        
        switch(txType) {
            case 'payment':
                txContent = generatePaymentTransaction(data, true);
                break;
            case 'nft':
                txContent = generateNftTransaction(data, true);
                break;
            case 'vote':
                txContent = generateVoteTransaction(data, true);
                break;
        }
        
        output.innerHTML = txContent;
    }

    // Генерация транзакции платежа
    function generatePaymentTransaction(data, encrypted) {
        const { recipient, amount } = data;
        
        // Генерация хэша для имитации данных транзакции
        const functionHash = '0x7c26101e'; // Хэш фукнции transfer(address,uint256)
        const functionHashEncrypted = '0x9e8c1a2f'; // Хэш функции transfer(saddress,suint256)
        
        // Публичная транзакция
        if (!encrypted) {
            const recipientPadded = recipient.slice(2).padStart(64, '0');
            const amountHex = parseInt(amount).toString(16).padStart(64, '0');
            
            return `// Публичная транзакция - ВИДИМАЯ ДЛЯ ВСЕХ
{
  "from": "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
  "to": "0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7", // Контракт платежей
  "data": "${functionHash}000000000000000000000000${recipient.slice(2)}${amountHex}",
  "value": "0",
  "gasLimit": "210000",
  "function": "transfer(address to, uint256 amount)",
  "parameters": {
    "to": "${recipient}",
    "amount": "${amount}"
  }
}`;
        } 
        // Зашифрованная транзакция Seismic
        else {
            // Генерируем случайную последовательность для имитации зашифрованных данных
            const encryptedData = generateRandomHex(512);
            
            return `// Зашифрованная транзакция Seismic - ПРИВАТНАЯ
{
  "from": "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
  "to": "0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7", // Контракт платежей
  "data": "${functionHashEncrypted}${encryptedData}",
  "value": "0",
  "gasLimit": "240000",
  "function": "transfer(saddress to, suint256 amount)",
  "parameters": {
    "to": "ЗАШИФРОВАНО", // Значение: ${recipient}
    "amount": "ЗАШИФРОВАНО" // Значение: ${amount}
  },
  "encryptionPubkey": "0x04f3d2b5ce7e65a9d63864be195738b5f76b6ebad2ce93805eda88513bc8a27a74a1e9d17c27e9f9b2c0cc13ad8c7a04f83a3aa4b64a5950c15c1845b51c0be17e"
}`;
        }
    }

    // Генерация транзакции NFT
    function generateNftTransaction(data, encrypted) {
        const { recipient, tokenId } = data;
        
        // Генерация хэша для имитации данных транзакции
        const functionHash = '0x42842e0e'; // Хэш фукнции safeTransferFrom(address,address,uint256)
        const functionHashEncrypted = '0x8737c5ef'; // Хэш функции safeTransferFrom(address,saddress,uint256)
        
        // Публичная транзакция
        if (!encrypted) {
            const senderPadded = '71C7656EC7ab88b098defB751B7401B5f6d8976F'.padStart(64, '0');
            const recipientPadded = recipient.slice(2).padStart(64, '0');
            const tokenIdHex = parseInt(tokenId).toString(16).padStart(64, '0');
            
            return `// Публичная транзакция NFT - ВИДИМАЯ ДЛЯ ВСЕХ
{
  "from": "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
  "to": "0x3B1A05d8B7842bE8E8F6A36a17CB87A191E0b5Ad", // Контракт NFT
  "data": "${functionHash}000000000000000000000000${senderPadded}000000000000000000000000${recipientPadded}${tokenIdHex}",
  "value": "0",
  "gasLimit": "250000",
  "function": "safeTransferFrom(address from, address to, uint256 tokenId)",
  "parameters": {
    "from": "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
    "to": "${recipient}",
    "tokenId": "${tokenId}"
  }
}`;
        } 
        // Зашифрованная транзакция Seismic
        else {
            // Генерируем случайную последовательность для имитации зашифрованных данных
            const encryptedData = generateRandomHex(512);
            
            return `// Зашифрованная транзакция NFT Seismic - ПРИВАТНАЯ
{
  "from": "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
  "to": "0x3B1A05d8B7842bE8E8F6A36a17CB87A191E0b5Ad", // Контракт NFT
  "data": "${functionHashEncrypted}${encryptedData}",
  "value": "0",
  "gasLimit": "290000",
  "function": "safeTransferFrom(address from, saddress to, uint256 tokenId)",
  "parameters": {
    "from": "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
    "to": "ЗАШИФРОВАНО", // Значение: ${recipient}
    "tokenId": "${tokenId}"
  },
  "encryptionPubkey": "0x04f3d2b5ce7e65a9d63864be195738b5f76b6ebad2ce93805eda88513bc8a27a74a1e9d17c27e9f9b2c0cc13ad8c7a04f83a3aa4b64a5950c15c1845b51c0be17e"
}`;
        }
    }

    // Генерация транзакции голосования
    function generateVoteTransaction(data, encrypted) {
        const { proposalId, choice } = data;
        
        // Генерация хэша для имитации данных транзакции
        const functionHash = '0xc9d27afe'; // Хэш фукнции vote(uint256,bool)
        const functionHashEncrypted = '0xe69b5789'; // Хэш функции vote(uint256,sbool)
        
        // Публичная транзакция
        if (!encrypted) {
            const proposalIdHex = parseInt(proposalId).toString(16).padStart(64, '0');
            const choiceHex = choice ? '1'.padStart(64, '0') : '0'.padStart(64, '0');
            
            return `// Публичная транзакция голосования - ВИДИМАЯ ДЛЯ ВСЕХ
{
  "from": "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
  "to": "0xA0D4E5CcB74dC2ad7cA47a176260a741f72CEe4d", // Контракт голосования
  "data": "${functionHash}${proposalIdHex}${choiceHex}",
  "value": "0",
  "gasLimit": "180000",
  "function": "vote(uint256 proposalId, bool choice)",
  "parameters": {
    "proposalId": "${proposalId}",
    "choice": "${choice ? 'true (ЗА)' : 'false (ПРОТИВ)'}"
  }
}`;
        } 
        // Зашифрованная транзакция Seismic
        else {
            // Генерируем случайную последовательность для имитации зашифрованных данных
            const encryptedData = generateRandomHex(512);
            
            return `// Зашифрованная транзакция голосования Seismic - ПРИВАТНАЯ
{
  "from": "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
  "to": "0xA0D4E5CcB74dC2ad7cA47a176260a741f72CEe4d", // Контракт голосования
  "data": "${functionHashEncrypted}${proposalId.padStart(64, '0')}${encryptedData}",
  "value": "0",
  "gasLimit": "200000",
  "function": "vote(uint256 proposalId, sbool choice)",
  "parameters": {
    "proposalId": "${proposalId}",
    "choice": "ЗАШИФРОВАНО" // Значение: ${choice ? 'true (ЗА)' : 'false (ПРОТИВ)'}
  },
  "encryptionPubkey": "0x04f3d2b5ce7e65a9d63864be195738b5f76b6ebad2ce93805eda88513bc8a27a74a1e9d17c27e9f9b2c0cc13ad8c7a04f83a3aa4b64a5950c15c1845b51c0be17e"
}`;
        }
    }

    // Генерация случайной шестнадцатеричной строки
    function generateRandomHex(length) {
        const hexChars = '0123456789abcdef';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += hexChars.charAt(Math.floor(Math.random() * hexChars.length));
        }
        return result;
    }

    // ==================== ИГРОВЫЕ ФУНКЦИИ ====================

    // Защити свои данные - игра
    function initDataProtectionGame() {
        const startBtn = document.getElementById('data-protection-start-btn');
        const restartBtn = document.getElementById('data-protection-restart-btn');
        const startOverlay = document.getElementById('data-protection-start');
        const endOverlay = document.getElementById('data-protection-end');
        const scoreDisplay = document.getElementById('data-protection-score');
        const finalScoreDisplay = document.getElementById('data-protection-final-score');
        const timerDisplay = document.getElementById('data-protection-timer');
        const dataField = document.getElementById('data-field');
        
        if (!startBtn) return; // Выход если элементы не найдены
        
        let score = 0;
        let timer = 60;
        let gameInterval;
        let dataItems = [];
        let hackers = [];
        
        startBtn.addEventListener('click', startGame);
        restartBtn.addEventListener('click', () => {
            endOverlay.style.display = 'none';
            startOverlay.style.display = 'flex';
        });
        
        function startGame() {
            // Сброс игры
            score = 0;
            timer = 60;
            dataItems = [];
            hackers = [];
            dataField.innerHTML = '';
            scoreDisplay.textContent = '0';
            timerDisplay.textContent = '60';
            
            // Скрыть стартовый экран
            startOverlay.style.display = 'none';
            
            // Начать игровой цикл
            gameInterval = setInterval(() => {
                updateGame();
                
                // Уменьшить таймер
                timer--;
                timerDisplay.textContent = timer;
                
                if (timer <= 0) {
                    endGame();
                }
            }, 1000);
            
            // Создавать данные каждые 2 секунды
            setInterval(createData, 2000);
            
            // Создавать хакеров каждые 3 секунды
            setInterval(createHacker, 3000);
        }
        
        function createData() {
            if (timer <= 0) return;
            
            const data = document.createElement('div');
            data.className = 'data-item position-absolute bg-warning p-2 rounded';
            data.style.left = Math.random() * (dataField.offsetWidth - 80) + 'px';
            data.style.top = Math.random() * (dataField.offsetHeight - 40) + 'px';
            
            // Выбрать случайный тип данных
            const dataTypes = ['Адрес', 'Сумма', 'Голос', 'Ставка'];
            const dataType = dataTypes[Math.floor(Math.random() * dataTypes.length)];
            data.innerHTML = dataType;
            data.dataset.encrypted = 'false';
            
            // Добавить функцию шифрования при клике
            data.addEventListener('click', () => {
                if (data.dataset.encrypted === 'false') {
                    data.dataset.encrypted = 'true';
                    data.className = 'data-item position-absolute bg-primary text-white p-2 rounded';
                    data.innerHTML = '🔒 ' + dataType;
                    score += 10;
                    scoreDisplay.textContent = score;
                }
            });
            
            dataField.appendChild(data);
            dataItems.push(data);
        }
        
        function createHacker() {
            if (timer <= 0) return;
            
            const hacker = document.createElement('div');
            hacker.className = 'hacker position-absolute bg-danger text-white p-1 rounded';
            
            // Разместить хакера за пределами поля
            const side = Math.floor(Math.random() * 4); // 0-верх, 1-право, 2-низ, 3-лево
            
            switch(side) {
                case 0: // сверху
                    hacker.style.left = Math.random() * dataField.offsetWidth + 'px';
                    hacker.style.top = '-20px';
                    hacker.dataset.dirX = Math.random() * 2 - 1; // -1 до 1
                    hacker.dataset.dirY = Math.random() * 0.5 + 0.5; // 0.5 до 1
                    break;
                case 1: // справа
                    hacker.style.left = dataField.offsetWidth + 'px';
                    hacker.style.top = Math.random() * dataField.offsetHeight + 'px';
                    hacker.dataset.dirX = -Math.random() * 0.5 - 0.5; // -1 до -0.5
                    hacker.dataset.dirY = Math.random() * 2 - 1; // -1 до 1
                    break;
                case 2: // снизу
                    hacker.style.left = Math.random() * dataField.offsetWidth + 'px';
                    hacker.style.top = dataField.offsetHeight + 'px';
                    hacker.dataset.dirX = Math.random() * 2 - 1; // -1 до 1
                    hacker.dataset.dirY = -Math.random() * 0.5 - 0.5; // -1 до -0.5
                    break;
                case 3: // слева
                    hacker.style.left = '-20px';
                    hacker.style.top = Math.random() * dataField.offsetHeight + 'px';
                    hacker.dataset.dirX = Math.random() * 0.5 + 0.5; // 0.5 до 1
                    hacker.dataset.dirY = Math.random() * 2 - 1; // -1 до 1
                    break;
            }
            
            hacker.innerHTML = '🦹‍♂️';
            dataField.appendChild(hacker);
            hackers.push(hacker);
        }
        
        function updateGame() {
            // Обновление положения хакеров
            hackers.forEach((hacker, index) => {
                const x = parseFloat(hacker.style.left);
                const y = parseFloat(hacker.style.top);
                const dirX = parseFloat(hacker.dataset.dirX);
                const dirY = parseFloat(hacker.dataset.dirY);
                
                // Переместить хакера
                hacker.style.left = (x + dirX * 5) + 'px';
                hacker.style.top = (y + dirY * 5) + 'px';
                
                // Удалить хакера, если он вышел за пределы
                if (x < -30 || x > dataField.offsetWidth + 30 || 
                    y < -30 || y > dataField.offsetHeight + 30) {
                    dataField.removeChild(hacker);
                    hackers.splice(index, 1);
                }
                
                // Проверить столкновение с данными
                dataItems.forEach((data, dataIndex) => {
                    if (isColliding(hacker, data)) {
                        if (data.dataset.encrypted === 'false') {
                            // Данные украдены
                            dataField.removeChild(data);
                            dataItems.splice(dataIndex, 1);
                            score -= 5;
                            if (score < 0) score = 0;
                            scoreDisplay.textContent = score;
                        }
                    }
                });
            });
        }
        
        function isColliding(el1, el2) {
            const rect1 = el1.getBoundingClientRect();
            const rect2 = el2.getBoundingClientRect();
            
            return !(rect1.right < rect2.left || 
                    rect1.left > rect2.right || 
                    rect1.bottom < rect2.top || 
                    rect1.top > rect2.bottom);
        }
        
        function endGame() {
            clearInterval(gameInterval);
            finalScoreDisplay.textContent = score;
            endOverlay.style.display = 'flex';
        }
    }
    
    // Угадай транзакцию - игра
    function initGuessTxGame() {
        const startBtn = document.getElementById('guess-tx-start-btn');
        const restartBtn = document.getElementById('guess-tx-restart-btn');
        const submitBtn = document.getElementById('guess-tx-submit-btn');
        const startOverlay = document.getElementById('guess-tx-start');
        const endOverlay = document.getElementById('guess-tx-end');
        const scoreDisplay = document.getElementById('guess-tx-score');
        const roundDisplay = document.getElementById('guess-tx-round');
        const finalScoreDisplay = document.getElementById('guess-tx-final-score');
        const finalMessage = document.getElementById('guess-tx-final-message');
        const optionLabels = [
            document.getElementById('tx-option-1-label'),
            document.getElementById('tx-option-2-label'),
            document.getElementById('tx-option-3-label')
        ];
        const options = document.querySelectorAll('.tx-option');
        
        if (!startBtn) return; // Выход если элементы не найдены
        
        let score = 0;
        let round = 1;
        let correctOption = 0;
        
        startBtn.addEventListener('click', startGame);
        restartBtn.addEventListener('click', () => {
            endOverlay.style.display = 'none';
            startOverlay.style.display = 'flex';
        });
        
        // Подготовить слушателей для радио-кнопок
        options.forEach(option => {
            option.addEventListener('change', () => {
                submitBtn.disabled = false;
            });
        });
        
        submitBtn.addEventListener('click', () => {
            // Проверить выбранный ответ
            const selectedOption = document.querySelector('input[name="txOption"]:checked');
            if (!selectedOption) return;
            
            if (parseInt(selectedOption.value) === correctOption) {
                score++;
                scoreDisplay.textContent = score;
            }
            
            // Перейти к следующему раунду
            round++;
            if (round > 10) {
                endGame();
            } else {
                roundDisplay.textContent = round;
                setupRound();
                
                // Сбросить выбор
                options.forEach(option => option.checked = false);
                submitBtn.disabled = true;
            }
        });
        
        function startGame() {
            // Сброс игры
            score = 0;
            round = 1;
            scoreDisplay.textContent = '0';
            roundDisplay.textContent = '1';
            
            // Скрыть стартовый экран
            startOverlay.style.display = 'none';
            
            // Подготовить первый раунд
            setupRound();
        }
        
        function setupRound() {
            // Выбрать случайную правильную опцию (1-3)
            correctOption = Math.floor(Math.random() * 3) + 1;
            
            // Подготовить описания транзакций
            const txTypes = ['Платеж', 'NFT Трансфер', 'Голосование', 'Аукцион'];
            const txType = txTypes[Math.floor(Math.random() * txTypes.length)];
            
            // Генерировать содержимое для опций
            for (let i = 0; i < 3; i++) {
                const isCorrect = (i + 1) === correctOption;
                
                // Общая информация в транзакциях
                let txContent = `${txType}: `;
                
                // Транзакция с Seismic-шифрованием
                if (isCorrect) {
                    switch(txType) {
                        case 'Платеж':
                            txContent += `transfer(saddress 0x12ab..., suint256 ${Math.floor(Math.random() * 1000)})`;
                            break;
                        case 'NFT Трансфер':
                            txContent += `safeTransferFrom(address 0x34cd..., saddress 0x56ef..., uint256 ${Math.floor(Math.random() * 100)})`;
                            break;
                        case 'Голосование':
                            txContent += `vote(uint256 ${Math.floor(Math.random() * 10)}, sbool ${Math.random() > 0.5})`;
                            break;
                        case 'Аукцион':
                            txContent += `placeBid(uint256 ${Math.floor(Math.random() * 5)}, suint256 ${Math.floor(Math.random() * 10000)})`;
                            break;
                    }
                }
                // Обычная транзакция
                else {
                    switch(txType) {
                        case 'Платеж':
                            txContent += `transfer(address 0x${generateRandomHex(4)}..., uint256 ${Math.floor(Math.random() * 1000)})`;
                            break;
                        case 'NFT Трансфер':
                            txContent += `safeTransferFrom(address 0x${generateRandomHex(4)}..., address 0x${generateRandomHex(4)}..., uint256 ${Math.floor(Math.random() * 100)})`;
                            break;
                        case 'Голосование':
                            txContent += `vote(uint256 ${Math.floor(Math.random() * 10)}, bool ${Math.random() > 0.5})`;
                            break;
                        case 'Аукцион':
                            txContent += `placeBid(uint256 ${Math.floor(Math.random() * 5)}, uint256 ${Math.floor(Math.random() * 10000)})`;
                            break;
                    }
                }
                
                optionLabels[i].textContent = txContent;
            }
        }
        
        function endGame() {
            // Определить сообщение по результату
            let message = '';
            if (score >= 8) {
                message = 'Отлично! Вы настоящий эксперт по Seismic!';
            } else if (score >= 5) {
                message = 'Хороший результат! Вы разбираетесь в шифровании.';
            } else {
                message = 'Стоит еще почитать о типах данных Seismic.';
            }
            
            finalScoreDisplay.textContent = score;
            finalMessage.textContent = message;
            endOverlay.style.display = 'flex';
        }
    }
    
    // Построй приватный контракт - игра
    function initContractBuilder() {
        const startBtn = document.getElementById('contract-builder-start-btn');
        const restartBtn = document.getElementById('contract-builder-restart-btn');
        const nextBtn = document.getElementById('contract-builder-next-btn');
        const prevBtn = document.getElementById('contract-builder-prev-btn');
        const startOverlay = document.getElementById('contract-builder-start');
        const endOverlay = document.getElementById('contract-builder-end');
        const progress = document.getElementById('contract-builder-progress');
        const contractTypes = document.querySelectorAll('.contract-type');
        const encryptionFields = document.querySelectorAll('.encryption-field');
        const codePreview = document.querySelector('.code-preview');
        
        if (!startBtn) return; // Выход если элементы не найдены
        
        let currentStep = 1;
        let selectedType = '';
        let selectedFields = {
            balance: true,
            transfers: false,
            votes: true,
            voters: false,
            bids: true,
            bidders: false
        };
        
        startBtn.addEventListener('click', startBuilder);
        restartBtn.addEventListener('click', () => {
            endOverlay.style.display = 'none';
            startOverlay.style.display = 'flex';
        });
        
        nextBtn.addEventListener('click', nextStep);
        prevBtn.addEventListener('click', prevStep);
        
        // Слушатели для выбора типа контракта
        contractTypes.forEach(type => {
            type.addEventListener('change', () => {
                selectedType = type.value;
                nextBtn.disabled = false;
                
                // Скрыть все поля шифрования
                document.getElementById('token-fields').style.display = 'none';
                document.getElementById('voting-fields').style.display = 'none';
                document.getElementById('auction-fields').style.display = 'none';
                
                // Показать нужные поля
                switch(selectedType) {
                    case 'token':
                        document.getElementById('token-fields').style.display = 'block';
                        break;
                    case 'voting':
                        document.getElementById('voting-fields').style.display = 'block';
                        break;
                    case 'auction':
                        document.getElementById('auction-fields').style.display = 'block';
                        break;
                }
            });
        });
        
        // Слушатели для полей шифрования
        encryptionFields.forEach(field => {
            field.addEventListener('change', () => {
                selectedFields[field.id.replace('encrypt-', '')] = field.checked;
            });
        });
        
        function startBuilder() {
            // Сброс билдера
            currentStep = 1;
            selectedType = '';
            progress.style.width = '0%';
            progress.textContent = '0%';
            
            // Сбросить выбор
            contractTypes.forEach(type => type.checked = false);
            
            // Установить видимость элементов
            document.getElementById('step-1').style.display = 'block';
            document.getElementById('step-2').style.display = 'none';
            document.getElementById('step-3').style.display = 'none';
            
            // Активировать кнопки
            nextBtn.disabled = true;
            prevBtn.disabled = true;
            
            // Скрыть стартовый экран
            startOverlay.style.display = 'none';
        }
        
        function nextStep() {
            if (currentStep < 3) {
                // Скрыть текущий шаг
                document.getElementById(`step-${currentStep}`).style.display = 'none';
                
                // Перейти к следующему шагу
                currentStep++;
                
                // Показать новый шаг
                document.getElementById(`step-${currentStep}`).style.display = 'block';
                
                // Обновить прогресс
                const progressValue = ((currentStep - 1) / 2 * 100);
                progress.style.width = `${progressValue}%`;
                progress.textContent = `${progressValue}%`;
                
                // Активировать/деактивировать кнопки
                prevBtn.disabled = false;
                
                if (currentStep === 3) {
                    // Генерировать предпросмотр кода
                    generateContractPreview();
                }
            }
        }
        
        function prevStep() {
            if (currentStep > 1) {
                // Скрыть текущий шаг
                document.getElementById(`step-${currentStep}`).style.display = 'none';
                
                // Перейти к предыдущему шагу
                currentStep--;
                
                // Показать новый шаг
                document.getElementById(`step-${currentStep}`).style.display = 'block';
                
                // Обновить прогресс
                const progressValue = ((currentStep - 1) / 2 * 100);
                progress.style.width = `${progressValue}%`;
                progress.textContent = `${progressValue}%`;
                
                // Активировать/деактивировать кнопки
                prevBtn.disabled = (currentStep === 1);
                nextBtn.disabled = false;
            }
        }
        
        function generateContractPreview() {
            let contractCode = '';
            
            switch(selectedType) {
                case 'token':
                    contractCode = generateTokenContract();
                    break;
                case 'voting':
                    contractCode = generateVotingContract();
                    break;
                case 'auction':
                    contractCode = generateAuctionContract();
                    break;
            }
            
            codePreview.innerHTML = contractCode;
            
            // Установить прогресс 100%
            progress.style.width = '100%';
            progress.textContent = '100%';
            
            // Изменить функцию кнопки "Далее"
            nextBtn.textContent = 'Завершить';
            nextBtn.removeEventListener('click', nextStep);
            nextBtn.addEventListener('click', completeBuilder);
        }
        
        function generateTokenContract() {
            const useEncryptedBalances = selectedFields.balance;
            const useEncryptedTransfers = selectedFields.transfers;
            
            return `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract PrivateToken {
    string public name = "SeismicToken";
    string public symbol = "SSMC";
    
    // Маппинг балансов
    mapping(address => ${useEncryptedBalances ? 'suint256' : 'uint256'}) private balances;
    
    // События
    event Transfer(address indexed from, address indexed to);
    
    // Функция перевода токенов
    function transfer(${useEncryptedTransfers ? 'saddress' : 'address'} to, ${useEncryptedBalances ? 'suint256' : 'uint256'} amount) external {
        require(balances[msg.sender] >= amount, "Insufficient balance");
        
        balances[msg.sender] -= amount;
        ${useEncryptedTransfers ? 
            'address recipient = to; // неявное преобразование' : 
            'address recipient = to;'}
        balances[recipient] += amount;
        
        emit Transfer(msg.sender, recipient);
    }
}`;
        }
        
        function generateVotingContract() {
            const useEncryptedVotes = selectedFields.votes;
            const useEncryptedVoters = selectedFields.voters;
            
            return `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract PrivateVoting {
    struct Proposal {
        string description;
        ${useEncryptedVotes ? 'suint256' : 'uint256'} yesVotes;
        ${useEncryptedVotes ? 'suint256' : 'uint256'} noVotes;
        uint256 endTime;
    }
    
    // Маппинг предложений
    mapping(uint256 => Proposal) public proposals;
    
    // Маппинг для отслеживания голосования
    mapping(uint256 => mapping(address => bool)) private hasVoted;
    
    // События
    event ProposalCreated(uint256 indexed proposalId, string description);
    event Voted(uint256 indexed proposalId, address voter);
    
    // Функция голосования
    function vote(uint256 proposalId, ${useEncryptedVotes ? 'sbool' : 'bool'} choice) external {
        require(!hasVoted[proposalId][msg.sender], "Already voted");
        
        Proposal storage proposal = proposals[proposalId];
        
        if (choice) {
            proposal.yesVotes += 1;
        } else {
            proposal.noVotes += 1;
        }
        
        ${useEncryptedVoters ? 
            '// Скрыть личность голосующего\n        bytes32 voterHash = keccak256(abi.encodePacked(msg.sender));\n        hasVoted[proposalId][msg.sender] = true;' : 
            'hasVoted[proposalId][msg.sender] = true;'}
        
        emit Voted(proposalId, msg.sender);
    }
}`;
        }
        
        function generateAuctionContract() {
            const useEncryptedBids = selectedFields.bids;
            const useEncryptedBidders = selectedFields.bidders;
            
            return `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract PrivateAuction {
    struct Auction {
        address seller;
        string itemDescription;
        uint256 endTime;
        bool finalized;
        ${useEncryptedBidders ? 'saddress' : 'address'} highestBidder;
        ${useEncryptedBids ? 'suint256' : 'uint256'} highestBid;
    }
    
    // Маппинг аукционов
    mapping(uint256 => Auction) public auctions;
    
    // Маппинг ставок
    mapping(uint256 => mapping(address => ${useEncryptedBids ? 'suint256' : 'uint256'})) private bids;
    
    // События
    event AuctionCreated(uint256 indexed auctionId, string itemDescription);
    event BidPlaced(uint256 indexed auctionId, address bidder);
    
    // Функция размещения ставки
    function placeBid(uint256 auctionId, ${useEncryptedBids ? 'suint256' : 'uint256'} bidAmount) external {
        Auction storage auction = auctions[auctionId];
        
        require(bidAmount > auction.highestBid, "Bid too low");
        
        bids[auctionId][msg.sender] = bidAmount;
        auction.highestBid = bidAmount;
        ${useEncryptedBidders ? 
            'saddress shieldedBidder = msg.sender; // Шифрование адреса\n        auction.highestBidder = shieldedBidder;' : 
            'auction.highestBidder = msg.sender;'}
        
        emit BidPlaced(auctionId, msg.sender);
    }
}`;
        }
        
        function completeBuilder() {
            endOverlay.style.display = 'flex';
        }
    }
    
    // Квиз по Seismic - игра
    function initQuizGame() {
        const startBtn = document.getElementById('quiz-start-btn');
        const restartBtn = document.getElementById('quiz-restart-btn');
        const submitBtn = document.getElementById('quiz-submit-btn');
        const startOverlay = document.getElementById('quiz-start');
        const endOverlay = document.getElementById('quiz-end');
        const scoreDisplay = document.getElementById('quiz-score');
        const questionDisplay = document.getElementById('quiz-question');
        const questionNumber = document.getElementById('quiz-question-number');
        const finalScoreDisplay = document.getElementById('quiz-final-score');
        const finalMessage = document.getElementById('quiz-final-message');
        const feedbackAlert = document.getElementById('quiz-feedback');
        const optionLabels = [
            document.getElementById('quiz-option-0-label'),
            document.getElementById('quiz-option-1-label'),
            document.getElementById('quiz-option-2-label'),
            document.getElementById('quiz-option-3-label')
        ];
        const options = document.querySelectorAll('.quiz-option');
        
        if (!startBtn) return; // Выход если элементы не найдены
        
        let score = 0;
        let currentQuestion = 0;
        let questions = [
            {
                question: "Что означает префикс 's' в типах данных Seismic?",
                options: [
                    "Статический тип (static)", 
                    "Зашифрованный тип (shielded)", 
                    "Безопасный тип (secure)", 
                    "Подписанный тип (signed)"
                ],
                correct: 1
            },
            {
                question: "Какой тип используется для зашифрованных адресов в Seismic?",
                options: [
                    "secureAddress", 
                    "encryptedAddress", 
                    "saddress", 
                    "privateAddress"
                ],
                correct: 2
            },
            {
                question: "Где выполняются зашифрованные смарт-контракты Seismic?",
                options: [
                    "В обычной EVM", 
                    "В браузере пользователя", 
                    "На серверах Seismic", 
                    "В Trusted Execution Environment (TEE)"
                ],
                correct: 3
            },
            {
                question: "Как проверяются зашифрованные транзакции в блокчейне Seismic?",
                options: [
                    "Они подтверждаются централизованным сервером", 
                    "Они проверяются без раскрытия зашифрованных данных", 
                    "Данные расшифровываются перед проверкой", 
                    "Проверка невозможна из-за шифрования"
                ],
                correct: 1
            },
            {
                question: "Какой из следующих типов данных НЕ является зашифрованным типом в Seismic?",
                options: [
                    "suint256", 
                    "saddress", 
                    "sbool", 
                    "sbytes"
                ],
                correct: 3
            }
        ];
        
        startBtn.addEventListener('click', startQuiz);
        restartBtn.addEventListener('click', () => {
            endOverlay.style.display = 'none';
            startOverlay.style.display = 'flex';
        });
        
        // Подготовить слушателей для радио-кнопок
        options.forEach(option => {
            option.addEventListener('change', () => {
                submitBtn.disabled = false;
            });
        });
        
        submitBtn.addEventListener('click', () => {
            // Проверить выбранный ответ
            const selectedOption = document.querySelector('input[name="quizOption"]:checked');
            if (!selectedOption) return;
            
            const answer = parseInt(selectedOption.value);
            const correct = questions[currentQuestion].correct;
            
            feedbackAlert.style.display = 'block';
            
            if (answer === correct) {
                score++;
                scoreDisplay.textContent = score;
                feedbackAlert.className = 'alert alert-success mt-3';
                feedbackAlert.textContent = 'Правильно!';
            } else {
                feedbackAlert.className = 'alert alert-danger mt-3';
                feedbackAlert.textContent = 'Неверно. Правильный ответ: ' + questions[currentQuestion].options[correct];
            }
            
            // Короткая пауза перед следующим вопросом
            setTimeout(() => {
                feedbackAlert.style.display = 'none';
                
                // Перейти к следующему вопросу
                currentQuestion++;
                if (currentQuestion >= questions.length) {
                    endQuiz();
                } else {
                    questionNumber.textContent = currentQuestion + 1;
                    loadQuestion(currentQuestion);
                    
                    // Сбросить выбор
                    options.forEach(option => option.checked = false);
                    submitBtn.disabled = true;
                }
            }, 1500);
        });
        
        function startQuiz() {
            // Сброс квиза
            score = 0;
            currentQuestion = 0;
            scoreDisplay.textContent = '0';
            questionNumber.textContent = '1';
            
            // Загрузить первый вопрос
            loadQuestion(0);
            
            // Скрыть стартовый экран
            startOverlay.style.display = 'none';
            
            // Сбросить выбор
            options.forEach(option => option.checked = false);
            submitBtn.disabled = true;
        }
        
        function loadQuestion(index) {
            const question = questions[index];
            questionDisplay.textContent = question.question;
            
            // Загрузить варианты ответов
            question.options.forEach((option, i) => {
                optionLabels[i].textContent = option;
            });
        }
        
        function endQuiz() {
            // Определить сообщение по результату
            let message = '';
            if (score === 5) {
                message = 'Отлично! Вы настоящий эксперт по Seismic!';
            } else if (score >= 3) {
                message = 'Хороший результат! Вы разбираетесь в Seismic.';
            } else {
                message = 'Стоит еще почитать документацию Seismic.';
            }
            
            finalScoreDisplay.textContent = score;
            finalMessage.textContent = message;
            endOverlay.style.display = 'flex';
        }
    }
    
    // Функция инициализации игры "Криптографический пазл"
    function initCryptoPuzzleGame() {
        const gameContainer = document.getElementById('crypto-puzzle-game');
        const startOverlay = document.getElementById('crypto-puzzle-start');
        const endOverlay = document.getElementById('crypto-puzzle-end');
        const startBtn = document.getElementById('crypto-puzzle-start-btn');
        const restartBtn = document.getElementById('crypto-puzzle-restart-btn');
        const timerDisplay = document.getElementById('puzzle-timer');
        const levelDisplay = document.getElementById('puzzle-level');
        const finalLevelDisplay = document.getElementById('puzzle-final-level');
        const finalMessageDisplay = document.getElementById('puzzle-final-message');
        const dataContainer = document.getElementById('puzzle-data-container');
        const solutionContainer = document.getElementById('puzzle-solution-container');
        const submitBtn = document.getElementById('puzzle-submit-btn');
        const feedbackDisplay = document.getElementById('puzzle-feedback');
        const descriptionDisplay = document.getElementById('puzzle-description');

        if (!startBtn) return; // Выход если элементы не найдены

        let timer;
        let timeLeft;
        let currentLevel = 1;
        let completedLevels = 0;
        let puzzleItems = [];
        let currentPuzzle = null;

        // Определение уровней головоломки
        const puzzleLevels = [
            {
                description: "Соберите шаги для создания базовой Seismic-транзакции в правильном порядке:",
                items: [
                    { id: 1, text: "1. Создание ключевой пары", order: 1 },
                    { id: 2, text: "2. Шифрование данных", order: 2 },
                    { id: 3, text: "3. Подписание транзакции", order: 3 },
                    { id: 4, text: "4. Отправка в блокчейн", order: 4 }
                ],
                timeLimit: 60
            },
            {
                description: "Соберите компоненты конфиденциальной транзакции Seismic:",
                items: [
                    { id: 1, text: "Приватный ключ отправителя", order: 1 },
                    { id: 2, text: "Homomorphic Encryption", order: 2 },
                    { id: 3, text: "Zero-Knowledge Proof", order: 3 },
                    { id: 4, text: "Валидация без раскрытия данных", order: 4 },
                    { id: 5, text: "Подтверждение в блокчейне", order: 5 }
                ],
                timeLimit: 90
            },
            {
                description: "Соберите последовательность для защиты смарт-контракта с помощью Seismic:",
                items: [
                    { id: 1, text: "Определение приватных данных", order: 1 },
                    { id: 2, text: "Применение FHE-шифрования", order: 2 },
                    { id: 3, text: "Создание ZK-доказательств", order: 3 },
                    { id: 4, text: "Интеграция с блокчейн-сетью", order: 4 },
                    { id: 5, text: "Проверка целостности", order: 5 },
                    { id: 6, text: "Выполнение контракта без доступа к открытым данным", order: 6 }
                ],
                timeLimit: 120
            }
        ];

        // Функция инициализации уровня
        function initLevel(level) {
            currentPuzzle = puzzleLevels[level - 1];
            timeLeft = currentPuzzle.timeLimit;
            timerDisplay.textContent = timeLeft;
            levelDisplay.textContent = level;
            descriptionDisplay.textContent = currentPuzzle.description;
            
            // Очистка контейнеров
            dataContainer.innerHTML = '';
            solutionContainer.innerHTML = '<div class="text-center text-secondary">Перетащите блоки сюда</div>';
            
            // Создание перемешанных блоков данных
            puzzleItems = [...currentPuzzle.items];
            shuffleArray(puzzleItems);
            
            puzzleItems.forEach(item => {
                const element = document.createElement('div');
                element.className = 'puzzle-item bg-white border rounded p-2 m-1 draggable';
                element.textContent = item.text;
                element.dataset.id = item.id;
                element.dataset.order = item.order;
                element.draggable = true;
                
                // Добавление обработчиков перетаскивания
                element.addEventListener('dragstart', handleDragStart);
                dataContainer.appendChild(element);
            });
            
            // Настройка области для перетаскивания
            solutionContainer.addEventListener('dragover', handleDragOver);
            solutionContainer.addEventListener('drop', handleDrop);
            
            // Запуск таймера
            startTimer();
        }
        
        // Обработчики событий перетаскивания
        function handleDragStart(e) {
            e.dataTransfer.setData('text/plain', e.target.dataset.id);
            e.dataTransfer.effectAllowed = 'move';
        }
        
        function handleDragOver(e) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
        }
        
        function handleDrop(e) {
            e.preventDefault();
            const itemId = e.dataTransfer.getData('text/plain');
            const draggedItem = document.querySelector(`.draggable[data-id="${itemId}"]`);
            
            if (draggedItem) {
                // Удаление подсказки при первом элементе
                if (solutionContainer.querySelector('.text-secondary')) {
                    solutionContainer.innerHTML = '';
                }
                
                draggedItem.classList.add('in-solution');
                solutionContainer.appendChild(draggedItem);
            }
        }
        
        // Функция проверки решения
        function checkSolution() {
            const solutionItems = Array.from(solutionContainer.querySelectorAll('.draggable'));
            
            // Проверяем, что все элементы перетащены
            if (solutionItems.length !== currentPuzzle.items.length) {
                showFeedback('Перетащите все блоки в область решения!', 'warning');
                return;
            }
            
            // Проверяем правильность порядка
            let isCorrect = true;
            for (let i = 0; i < solutionItems.length; i++) {
                const expectedOrder = i + 1;
                const actualOrder = parseInt(solutionItems[i].dataset.order);
                
                if (actualOrder !== expectedOrder) {
                    isCorrect = false;
                    break;
                }
            }
            
            if (isCorrect) {
                clearInterval(timer);
                completedLevels++;
                
                if (currentLevel < puzzleLevels.length) {
                    showFeedback('Правильно! Переходим к следующему уровню.', 'success');
                    setTimeout(() => {
                        currentLevel++;
                        initLevel(currentLevel);
                    }, 1500);
                } else {
                    // Завершение игры
                    endGame();
                }
            } else {
                showFeedback('Порядок неверный. Попробуйте еще раз!', 'danger');
            }
        }
        
        // Показать сообщение обратной связи
        function showFeedback(message, type) {
            feedbackDisplay.className = `alert alert-${type} mt-3`;
            feedbackDisplay.textContent = message;
            feedbackDisplay.style.display = 'block';
            
            setTimeout(() => {
                feedbackDisplay.style.display = 'none';
            }, 3000);
        }
        
        // Запуск таймера
        function startTimer() {
            clearInterval(timer);
            timer = setInterval(() => {
                timeLeft--;
                timerDisplay.textContent = timeLeft;
                
                if (timeLeft <= 0) {
                    clearInterval(timer);
                    showFeedback('Время вышло!', 'danger');
                    setTimeout(() => {
                        endGame();
                    }, 1500);
                }
            }, 1000);
        }
        
        // Завершение игры
        function endGame() {
            clearInterval(timer);
            finalLevelDisplay.textContent = completedLevels;
            
            // Сообщение в зависимости от результата
            if (completedLevels === puzzleLevels.length) {
                finalMessageDisplay.textContent = 'Поздравляем! Вы прошли все уровни!';
            } else {
                finalMessageDisplay.textContent = `Вы прошли ${completedLevels} из ${puzzleLevels.length} уровней.`;
            }
            
            endOverlay.style.display = 'flex';
        }
        
        // Перемешивание массива
        function shuffleArray(array) {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]];
            }
            return array;
        }
        
        // Начало игры
        function startGame() {
            startOverlay.style.display = 'none';
            endOverlay.style.display = 'none';
            currentLevel = 1;
            completedLevels = 0;
            initLevel(currentLevel);
        }
        
        // Обработчики событий кнопок
        startBtn.addEventListener('click', startGame);
        restartBtn.addEventListener('click', startGame);
        submitBtn.addEventListener('click', checkSolution);
    }
    
    // Инициализация всех игр
    function initGames() {
        if (document.getElementById('data-protection-game')) {
            initDataProtectionGame();
        }
        
        if (document.getElementById('guess-tx-game')) {
            initGuessTxGame();
        }
        
        if (document.getElementById('contract-builder-game')) {
            initContractBuilder();
        }
        
        if (document.getElementById('quiz-game')) {
            initQuizGame();
        }
        
        if (document.getElementById('crypto-puzzle-game')) {
            initCryptoPuzzleGame();
        }
        
        if (document.getElementById('seismic-explorer-game')) {
            initSeismicExplorer();
        }
    }
    
    // Инициализация Seismic Explorer
    function initSeismicExplorer() {
        // DOM Элементы
        const gameContainer = document.getElementById('seismic-explorer-game');
        const startScreen = document.getElementById('seismic-explorer-start');
        const gameInterface = gameContainer.querySelector('.game-interface');
        const startBtn = document.getElementById('seismic-explorer-start-btn');
        const connectBtn = document.getElementById('seismic-explorer-connect-btn');
        const encryptBtn = document.getElementById('seismic-encrypt-btn');
        const sendTxBtn = document.getElementById('seismic-send-tx-btn');
        const clearLogBtn = document.getElementById('seismic-clear-log-btn');
        const txTypeSelect = document.getElementById('seismic-tx-type');
        const txValueInput = document.getElementById('seismic-tx-value');
        const txLog = document.getElementById('seismic-tx-log');
        const connectionStatus = gameContainer.querySelector('.connection-status');
        const encryptionAnimation = document.getElementById('encryption-animation');
        
        // Состояние
        let isConnected = false;
        let wallet = null;
        let currentEncryption = null;
        
        // Запуск игры
        if (startBtn) {
            startBtn.addEventListener('click', startGame);
        }
        
        // Функция начала игры
        function startGame() {
            startScreen.style.display = 'none';
            gameInterface.style.display = 'block';
            initSeismicConnection();
        }
        
        // Подключение к Seismic
        function initSeismicConnection() {
            connectionStatus.textContent = 'Подключение к Seismic...';
            connectionStatus.className = 'badge bg-warning connection-status';
            
            // Загрузка библиотеки Seismic
            loadSeismicLibrary();
        }
        
        // Загрузка библиотеки Seismic
        function loadSeismicLibrary() {
            addLogEntry('Система', 'Загрузка библиотеки Seismic...');
            
            // Используем SDK для подключения
            if (window.seismicSDK) {
                seismicSDK.initialize()
                    .then(success => {
                        if (success) {
                            addLogEntry('Система', 'Подключено к Seismic Devnet');
                            connectionStatus.textContent = 'Подключено к Devnet';
                            connectionStatus.className = 'badge bg-success connection-status';
                            
                            // Проверяем цепочку
                            addLogEntry('Система', `Цепочка: ${seismicConfig.network.name} (ID: ${seismicConfig.network.chainId})`);
                            addLogEntry('Система', `RPC URL: ${seismicConfig.network.rpcUrl}`);
                            
                            // Подготовка среды визуализации
                            prepareVisualization();
                        } else {
                            addLogEntry('Ошибка', 'Не удалось инициализировать SDK');
                            connectionStatus.textContent = 'Ошибка подключения';
                            connectionStatus.className = 'badge bg-danger connection-status';
                        }
                    })
                    .catch(error => {
                        addLogEntry('Ошибка', 'Ошибка подключения к Seismic: ' + error.message);
                        connectionStatus.textContent = 'Ошибка подключения';
                        connectionStatus.className = 'badge bg-danger connection-status';
                    });
            } else {
                // Если SDK не доступен, используем имитацию (существующий код)
                setTimeout(() => {
                    addLogEntry('Система', 'Библиотека Seismic загружена (имитация)');
                    connectionStatus.textContent = 'Подключено (имитация)';
                    connectionStatus.className = 'badge bg-info connection-status';
                    prepareVisualization();
                }, 1000);
            }
        }
        
        // Подготовка среды визуализации
        function prepareVisualization() {
            // Создаем элементы для визуализации
            encryptionAnimation.innerHTML = `
                <div class="position-relative w-100 h-100">
                    <div class="tee-processor">
                        <i class="bi bi-cpu"></i>
                    </div>
                    <div class="original-data" style="opacity: 0;"></div>
                    <div class="encrypted-data" style="opacity: 0;"></div>
                    <div class="zk-proof">Verified ✓</div>
                    <div class="network-activity"></div>
                </div>
            `;
            
            // Добавляем сейсмическую анимацию волн данных
            if (typeof window.animateSeismicData === 'function') {
                window.animateSeismicData(encryptionAnimation);
            }
            
            // Добавляем обработчики событий
            connectBtn.addEventListener('click', connectWallet);
            encryptBtn.addEventListener('click', encryptData);
            sendTxBtn.addEventListener('click', sendTransaction);
            clearLogBtn.addEventListener('click', clearLog);
        }
        
        // Подключение кошелька
        function connectWallet() {
            if (isConnected) {
                addLogEntry('Система', 'Кошелек уже подключен');
                return;
            }
            
            addLogEntry('Система', 'Подключение кошелька...');
            
            // Используем SDK для подключения кошелька
            if (window.seismicSDK) {
                seismicSDK.connect()
                    .then(connectedWallet => {
                        wallet = connectedWallet;
                        isConnected = true;
                        
                        connectBtn.textContent = 'Кошелек подключен';
                        connectBtn.classList.remove('btn-outline-light');
                        connectBtn.classList.add('btn-success');
                        
                        // Показываем кнопку фаусета
                        const faucetBtn = document.getElementById('seismic-faucet-btn');
                        if (faucetBtn) {
                            faucetBtn.style.display = 'inline-block';
                            faucetBtn.href = `${seismicConfig.network.faucet}?address=${wallet.address}`;
                        }
                        
                        addLogEntry('Система', `Кошелек подключен: ${wallet.address.substring(0, 8)}...`);
                        
                        // Получаем баланс
                        seismicSDK.getBalance()
                            .then(balance => {
                                addLogEntry('Система', `Баланс: ${balance} ETH`);
                                
                                // Предлагаем получить тестовые токены, если баланс близок к нулю
                                if (parseFloat(balance) < 0.01) {
                                    addLogEntry('Система', 'Для отправки транзакций вам потребуются тестовые токены. Используйте кнопку "Получить тестовые токены".');
                                }
                            })
                            .catch(error => {
                                console.error('Ошибка получения баланса:', error);
                            });
                    })
                    .catch(error => {
                        addLogEntry('Ошибка', 'Ошибка подключения кошелька: ' + error.message);
                    });
            } else {
                // Если SDK не доступен, используем имитацию (существующий код)
                setTimeout(() => {
                    wallet = {
                        address: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
                        publicKey: '0x04f3d2b5ce7e65a9d63864be195738b5f76b6ebad2ce93805eda88513bc8a27a74a1e9d17c27e9f9b2c0cc13ad8c7a04f83a3aa4b64a5950c15c1845b51c0be17e'
                    };
                    
                    isConnected = true;
                    connectBtn.textContent = 'Кошелек подключен';
                    connectBtn.classList.remove('btn-outline-light');
                    connectBtn.classList.add('btn-success');
                    
                    // Показываем кнопку фаусета даже в режиме имитации
                    const faucetBtn = document.getElementById('seismic-faucet-btn');
                    if (faucetBtn) {
                        faucetBtn.style.display = 'inline-block';
                        faucetBtn.href = `${seismicConfig.network.faucet}?address=${wallet.address}`;
                    }
                    
                    addLogEntry('Система', `Кошелек подключен: ${wallet.address.substring(0, 8)}...`);
                }, 1000);
            }
        }
        
        // Функция шифрования данных
        function encryptData() {
            // Проверка подключения кошелька
            if (!isConnected) {
                addLogEntry('Ошибка', 'Сначала подключите кошелек');
                return;
            }
            
            // Получение значений из формы
            const dataType = txTypeSelect.value;
            const dataValue = txValueInput.value.trim();
            
            // Валидация ввода
            if (!dataValue) {
                addLogEntry('Ошибка', 'Введите значение для шифрования');
                return;
            }
            
            // Подготовка валидации по типу данных
            let isValid = true;
            let errorMsg = '';
            
            switch (dataType) {
                case 'suint':
                    if (isNaN(dataValue) || parseInt(dataValue) < 0) {
                        isValid = false;
                        errorMsg = 'suint требует положительное целое число';
                    }
                    break;
                case 'saddress':
                    if (!dataValue.startsWith('0x') || dataValue.length !== 42) {
                        isValid = false;
                        errorMsg = 'saddress требует валидный Ethereum адрес (0x...)';
                    }
                    break;
                case 'sbool':
                    if (dataValue !== 'true' && dataValue !== 'false') {
                        isValid = false;
                        errorMsg = 'sbool принимает только значения "true" или "false"';
                    }
                    break;
            }
            
            if (!isValid) {
                addLogEntry('Ошибка', errorMsg);
                return;
            }
            
            // Используем SDK для шифрования или имитируем процесс
            if (window.seismicSDK) {
                addLogEntry('Система', `Шифрование ${dataType}: ${dataValue}`);
                
                // Вызываем шифрование через SDK
                seismicSDK.encrypt(dataType, dataValue)
                    .then(encryptedData => {
                        currentEncryption = encryptedData;
                        
                        // Активируем кнопку отправки транзакции
                        sendTxBtn.disabled = false;
                        
                        // Обновляем анимацию с реальными данными
                        animateEncryption(dataType, dataValue);
                        
                        // Логируем результат - безопасно извлекаем строку для отображения
                        let encryptedString;
                        try {
                            if (typeof encryptedData.encryptedValue === 'string') {
                                encryptedString = encryptedData.encryptedValue.substring(0, 10) + '...';
                            } else if (encryptedData.encryptedValue && encryptedData.encryptedValue.toString) {
                                encryptedString = encryptedData.encryptedValue.toString().substring(0, 10) + '...';
                            } else {
                                encryptedString = JSON.stringify(encryptedData.encryptedValue).substring(0, 10) + '...';
                            }
                        } catch (e) {
                            encryptedString = '[зашифрованные данные]';
                            console.error('Ошибка форматирования зашифрованных данных:', e);
                        }
                            
                        addLogEntry('Шифрование', 
                            `Данные зашифрованы успешно: ${encryptedString}`, 
                            null, 
                            encryptedData);
                            
                        // Добавляем визуальное представление
                        const logEntry = txLog.lastElementChild;
                        if (logEntry) {
                            const encryptedSpan = document.createElement('div');
                            encryptedSpan.className = 'mt-1 text-info';
                            encryptedSpan.innerHTML = `Зашифровано: ${dataType} (${encryptedString})`;
                            logEntry.appendChild(encryptedSpan);
                        }
                    })
                    .catch(error => {
                        addLogEntry('Ошибка', 'Ошибка шифрования: ' + error.message);
                    });
            } else {
                // Существующий код имитации
                // Анимация шифрования
                animateEncryption(dataType, dataValue);
            }
        }
        
        // Анимация процесса шифрования
        function animateEncryption(dataType, dataValue) {
            // Получение элементов анимации
            const teeProcessor = encryptionAnimation.querySelector('.tee-processor');
            const originalData = encryptionAnimation.querySelector('.original-data');
            const encryptedData = encryptionAnimation.querySelector('.encrypted-data');
            const zkProof = encryptionAnimation.querySelector('.zk-proof');
            const networkActivity = encryptionAnimation.querySelector('.network-activity');
            
            // Отображение исходных данных
            originalData.textContent = `${dataType}: ${dataValue}`;
            originalData.style.opacity = '1';
            
            // Добавляем логи до шифрования
            addLogEntry('Шифрование', `Обработка ${dataType} в Trusted Execution Environment`);

            // Используем try-catch для защиты от ошибок
            try {
                // Создание частиц данных для анимации
                for (let i = 0; i < 10; i++) {
                    const particle = document.createElement('div');
                    particle.className = 'data-particle';
                    
                    // Размещение частицы в случайном месте слева
                    const randomTop = 20 + Math.random() * 160;
                    particle.style.left = '30px';
                    particle.style.top = `${randomTop}px`;
                    
                    encryptionAnimation.querySelector('.position-relative').appendChild(particle);
                    
                    // Анимация движения частицы в центр (к TEE)
                    setTimeout(() => {
                        particle.style.transform = 'translate(100px, -10px)';
                    }, 100 + i * 50);
                    
                    // Удаление частицы после завершения анимации
                    setTimeout(() => {
                        particle.remove();
                    }, 2000);
                }
                
                // Активация TEE-процессора
                setTimeout(() => {
                    teeProcessor.classList.add('active');
                    
                    addLogEntry('Шифрование', `Обработка ${dataType} в Trusted Execution Environment`);
                    
                    // Шифрование данных с использованием SDK
                    if (window.seismicSDK) {
                        seismicSDK.encrypt(dataType, dataValue)
                            .then(encryptedValue => {
                                // Сохранение результата шифрования
                                currentEncryption = {
                                    type: dataType,
                                    originalValue: dataValue,
                                    encryptedValue: encryptedValue
                                };
                                
                                // Отображение зашифрованных данных
                                encryptedData.textContent = `${dataType}: ${currentEncryption.encryptedValue.substring(0, 20)}...`;
                                encryptedData.style.opacity = '1';
                                
                                // Активация ZK-доказательства
                                zkProof.classList.add('active');
                                
                                // Деактивация TEE через полсекунды
                                setTimeout(() => {
                                    teeProcessor.classList.remove('active');
                                    
                                    // Активация кнопки отправки транзакции
                                    sendTxBtn.disabled = false;
                                    
                                    addLogEntry('Шифрование', 'Данные успешно зашифрованы с ZK-доказательством');
                                }, 500);
                            })
                            .catch(error => {
                                addLogEntry('Ошибка', 'Ошибка шифрования: ' + error.message);
                                teeProcessor.classList.remove('active');
                            });
                    } else {
                        // Если SDK не доступен, имитируем шифрование
                        setTimeout(() => {
                            // Генерация зашифрованного значения
                            currentEncryption = {
                                type: dataType,
                                originalValue: dataValue,
                                encryptedValue: generateEncryptedValue(dataType, dataValue)
                            };
                            
                            // Отображение зашифрованных данных
                            encryptedData.textContent = `${dataType}: ${currentEncryption.encryptedValue.substring(0, 20)}...`;
                            encryptedData.style.opacity = '1';
                            
                            // Активация ZK-доказательства
                            zkProof.classList.add('active');
                            
                            // Деактивация TEE
                            setTimeout(() => {
                                teeProcessor.classList.remove('active');
                                
                                // Активация кнопки отправки транзакции
                                sendTxBtn.disabled = false;
                                
                                addLogEntry('Шифрование', 'Данные успешно зашифрованы с ZK-доказательством');
                            }, 500);
                        }, 2000);
                    }
                }, 1000);
                
                // Дополнительные проверки и логирование для отладки
                console.log("Состояние после шифрования:", currentEncryption);
                
                // Проверяем, что переменная существует
                if(!currentEncryption) {
                    console.warn("currentEncryption не определен");
                }
            } catch (error) {
                console.error("Ошибка в анимации шифрования:", error);
                addLogEntry('Ошибка', 'Ошибка в анимации: ' + error.message);
            }
        }
        
        // Отправка транзакции в блокчейн
        function sendTransaction() {
            // Проверяем, есть ли зашифрованные данные
            if (!currentEncryption) {
                addLogEntry('Ошибка', 'Сначала зашифруйте данные');
                return;
            }
            
            addLogEntry('Система', 'Отправка транзакции в Seismic...');
            
            // Используем SDK для отправки или имитируем
            if (window.seismicSDK) {
                seismicSDK.sendTransaction(currentEncryption)
                    .then(result => {
                        // Показываем анимацию отправки транзакции
                        displayTransactionAnimation(
                            currentEncryption,
                            result.txHash,
                            result.blockNumber
                        );
                        
                        // Сбрасываем текущее шифрование
                        currentEncryption = null;
                        sendTxBtn.disabled = true;
                        
                        // Логируем успешную транзакцию
                        addLogEntry('Транзакция', 
                            `Транзакция отправлена и подтверждена в блоке #${result.blockNumber}`, 
                            result.txHash);
                            
                        // Добавляем ссылку на эксплорер
                        const txLink = document.createElement('a');
                        txLink.href = `${seismicConfig.network.explorer}/tx/${result.txHash}`;
                        txLink.target = '_blank';
                        txLink.textContent = 'Посмотреть в обозревателе блоков';
                        txLink.className = 'text-info d-block mt-1';
                        
                        // Находим последнюю запись в логе
                        const lastLogEntry = txLog.lastElementChild;
                        if (lastLogEntry) {
                            lastLogEntry.appendChild(txLink);
                        }
                    })
                    .catch(error => {
                        addLogEntry('Ошибка', 'Ошибка отправки транзакции: ' + error.message);
                    });
            } else {
                // Имитация процесса отправки
                setTimeout(() => {
                    // Генерируем фиктивный хеш транзакции и номер блока
                    const txHash = "0x" + Array.from({length: 64}, () => 
                        Math.floor(Math.random() * 16).toString(16)).join('');
                    const blockNumber = Math.floor(Math.random() * 1000000) + 1000000;
                    
                    // Показываем анимацию отправки
                    displayTransactionAnimation(currentEncryption, txHash, blockNumber);
                    
                    // Сбрасываем текущее шифрование
                    currentEncryption = null;
                    sendTxBtn.disabled = true;
                    
                    // Логируем успешную транзакцию
                    addLogEntry('Транзакция', 
                        `Транзакция отправлена и подтверждена в блоке #${blockNumber}`, 
                        txHash);
                }, 2000);
            }
        }
        
        // Функция для анимации отправки транзакции
        function displayTransactionAnimation(encryptedData, txHash, blockNumber) {
            // Получаем элементы для анимации
            const networkActivity = encryptionAnimation.querySelector('.network-activity');
            const blockchainBlock = encryptionAnimation.querySelector('.blockchain-block');
            
            // Активируем индикатор сетевой активности
            if (networkActivity) {
                networkActivity.classList.add('active');
                setTimeout(() => networkActivity.classList.remove('active'), 5000);
            }
            
            // Анимируем блок в блокчейне
            if (blockchainBlock) {
                blockchainBlock.classList.add('active');
                
                // Обновляем информацию в блоке
                const blockNumberElement = blockchainBlock.querySelector('.block-number');
                if (blockNumberElement) {
                    blockNumberElement.textContent = `#${blockNumber}`;
                }
                
                const txData = blockchainBlock.querySelector('.encrypted-value');
                if (txData) {
                    // Безопасно извлекаем строковое представление
                    let encryptedString;
                    try {
                        if (typeof encryptedData.encryptedValue === 'string') {
                            encryptedString = encryptedData.encryptedValue.substring(0, 6) + '...';
                        } else if (encryptedData.encryptedValue && encryptedData.encryptedValue.toString) {
                            encryptedString = encryptedData.encryptedValue.toString().substring(0, 6) + '...';
                        } else {
                            encryptedString = JSON.stringify(encryptedData.encryptedValue).substring(0, 6) + '...';
                        }
                    } catch (e) {
                        encryptedString = '[encrypted]';
                        console.error('Ошибка форматирования зашифрованных данных:', e);
                    }
                    
                    txData.textContent = encryptedString;
                }
                
                setTimeout(() => blockchainBlock.classList.remove('active'), 3000);
            }
            
            // Создаем анимацию движения данных к блокчейну
            const zkProof = encryptionAnimation.querySelector('.zk-proof');
            if (zkProof) {
                zkProof.classList.add('active');
                setTimeout(() => zkProof.classList.remove('active'), 3000);
            }
            
            // Добавляем информацию о транзакции в лог
            const txInfo = document.createElement('div');
            txInfo.className = 'mt-2 text-info';
            txInfo.innerHTML = `TX: <a href="${seismicConfig.network.explorer}/tx/${txHash}" target="_blank">${txHash}</a>`;
            
            // Находим последнюю запись в логе
            const lastLogEntry = txLog.lastElementChild;
            if (lastLogEntry) {
                lastLogEntry.appendChild(txInfo);
            }
        }
        
        // Сброс визуализации
        function resetVisualization() {
            const originalData = encryptionAnimation.querySelector('.original-data');
            const encryptedData = encryptionAnimation.querySelector('.encrypted-data');
            const zkProof = encryptionAnimation.querySelector('.zk-proof');
            
            originalData.style.opacity = '0';
            encryptedData.style.opacity = '0';
            zkProof.classList.remove('active');
            
            sendTxBtn.disabled = true;
        }
        
        // Генерация зашифрованного значения
        function generateEncryptedValue(type, value) {
            // Используем простой алгоритм для демонстрационных целей
            // В реальном приложении здесь было бы использование библиотеки Seismic
            const randomHex = Array.from({length: 64}, () => 
                Math.floor(Math.random() * 16).toString(16)
            ).join('');
            
            return '0x' + randomHex;
        }
        
        // Добавление элемента в лог
        function addLogEntry(category, message, txHash = null, encryptionData = null) {
            const entry = document.createElement('div');
            entry.className = 'log-entry';
            
            const timestamp = new Date().toLocaleTimeString();
            
            let entryHTML = `<span class="timestamp">[${timestamp}]</span> <span class="event-name">${category}:</span> ${message}`;
            
            if (txHash) {
                entryHTML += `<br><span class="tx-hash">TX: ${txHash}</span>`;
            }
            
            if (encryptionData) {
                entryHTML += `<br><span class="encrypted-value">Зашифровано: ${encryptionData.type} (${encryptionData.encryptedValue.substring(0, 14)}...)</span>`;
            }
            
            entry.innerHTML = entryHTML;
            
            // Проверка наличия начального сообщения и удаление его
            const initialMessage = txLog.querySelector('.text-secondary');
            if (initialMessage) {
                txLog.innerHTML = '';
            }
            
            // Добавление новой записи в начало лога
            txLog.insertBefore(entry, txLog.firstChild);
        }
        
        // Очистка лога
        function clearLog() {
            txLog.innerHTML = '<div class="text-secondary">Лог транзакций очищен</div>';
        }
    }
    
    // Вызвать инициализацию игр при загрузке страницы
    initGames();
    
    // Function for the new Seismic Transaction Interface
    function initSeismicTransactionInterface() {
        // Elements
        const connectWalletBtn = document.getElementById('connect-wallet-btn');
        const walletStatus = document.getElementById('wallet-status');
        const walletAddress = document.getElementById('wallet-address');
        const faucetLink = document.getElementById('faucet-link');
        const txType = document.getElementById('tx-type');
        const txValue = document.getElementById('tx-value');
        const encryptBtn = document.getElementById('encrypt-btn');
        const sendTxBtn = document.getElementById('send-tx-btn');
        const txStatus = document.getElementById('tx-status');
        const clearLogBtn = document.getElementById('clear-log-btn');
        const encryptedDataContainer = document.getElementById('encrypted-data-container');
        const encryptedDataPreview = document.getElementById('encrypted-data-preview');
        
        // Current state
        let currentEncryptedData = null;
        
        // Check if all elements exist
        if (!connectWalletBtn || !txStatus) {
            console.warn('Some Seismic Transaction Interface elements not found');
            return;
        }
        
        // Check if SDK is loaded
        function checkSDKLoaded() {
            return typeof window.seismicSDK !== 'undefined';
        }
        
        // Connect wallet
        connectWalletBtn.addEventListener('click', async function() {
            try {
                addToLog('info', 'Подключение к кошельку...');
                
                if (!checkSDKLoaded()) {
                    await loadSeismicSDK();
                }
                
                // First, try to add the Seismic network to MetaMask if it's not already added
                if (window.ethereum) {
                    try {
                        // Try to switch to the Seismic network
                        await window.ethereum.request({
                            method: 'wallet_switchEthereumChain',
                            params: [{ chainId: '0x' + window.seismicConfig.network.chainId.toString(16) }]
                        });
                    } catch (switchError) {
                        // This error code indicates that the chain has not been added to MetaMask
                        if (switchError.code === 4902) {
                            addToLog('info', 'Добавление сети Seismic в MetaMask...');
                            
                            try {
                                await window.ethereum.request({
                                    method: 'wallet_addEthereumChain',
                                    params: [{
                                        chainId: '0x' + window.seismicConfig.network.chainId.toString(16),
                                        chainName: window.seismicConfig.network.name,
                                        nativeCurrency: {
                                            name: 'Ethereum',
                                            symbol: window.seismicConfig.network.symbol,
                                            decimals: 18
                                        },
                                        rpcUrls: [window.seismicConfig.network.rpcUrl],
                                        blockExplorerUrls: [window.seismicConfig.network.explorer]
                                    }]
                                });
                                
                                // Try to switch again after adding
                                await window.ethereum.request({
                                    method: 'wallet_switchEthereumChain',
                                    params: [{ chainId: '0x' + window.seismicConfig.network.chainId.toString(16) }]
                                });
                            } catch (addError) {
                                addToLog('error', 'Ошибка добавления сети: ' + addError.message);
                                throw addError;
                            }
                        } else {
                            addToLog('error', 'Ошибка переключения сети: ' + switchError.message);
                            throw switchError;
                        }
                    }
                }
                
                // Now connect the wallet
                const wallet = await window.seismicSDK.connect();
                
                if (wallet) {
                    // Update UI
                    walletStatus.textContent = 'Кошелек подключен';
                    walletStatus.classList.remove('bg-secondary');
                    walletStatus.classList.add('bg-success');
                    
                    // Show address
                    walletAddress.textContent = formatAddress(wallet.address);
                    
                    // Show faucet link
                    faucetLink.style.display = 'inline-block';
                    
                    // Enable encrypt button
                    encryptBtn.disabled = false;
                    
                    addToLog('success', 'Кошелек успешно подключен: ' + wallet.address);
                    
                    // Try to get and display balance
                    try {
                        const balance = await window.seismicSDK.getBalance();
                        addToLog('info', 'Баланс кошелька: ' + balance + ' ETH');
                    } catch (error) {
                        console.error('Error getting balance:', error);
                    }
                }
            } catch (error) {
                console.error('Error connecting wallet:', error);
                addToLog('error', 'Ошибка подключения кошелька: ' + error.message);
                
                // Show error in UI
                walletStatus.textContent = 'Ошибка подключения';
                walletStatus.classList.remove('bg-secondary');
                walletStatus.classList.add('bg-danger');
            }
        });
        
        // Load Seismic SDK if not already loaded
        async function loadSeismicSDK() {
            return new Promise((resolve, reject) => {
                // Check if SDK is already loaded
                if (checkSDKLoaded()) {
                    resolve(window.seismicSDK);
                    return;
                }
                
                addToLog('info', 'Загрузка Seismic SDK...');
                
                // Load configuration
                if (typeof seismicConfig === 'undefined') {
                    const configScript = document.createElement('script');
                    configScript.src = 'seismic-config.js';
                    configScript.onload = loadSDK;
                    configScript.onerror = () => reject(new Error('Не удалось загрузить конфигурацию'));
                    document.head.appendChild(configScript);
                } else {
                    loadSDK();
                }
                
                function loadSDK() {
                    const sdkScript = document.createElement('script');
                    sdkScript.src = 'seismic-sdk.js';
                    sdkScript.onload = () => {
                        addToLog('success', 'Seismic SDK успешно загружен');
                        resolve(window.seismicSDK);
                    };
                    sdkScript.onerror = () => reject(new Error('Не удалось загрузить Seismic SDK'));
                    document.head.appendChild(sdkScript);
                }
            });
        }
        
        // Encrypt data
        encryptBtn.addEventListener('click', async function() {
            try {
                const type = txType.value;
                const value = txValue.value;
                
                // Validate input
                if (!value) {
                    addToLog('error', 'Введите значение для шифрования');
                    return;
                }
                
                // Validate input based on type
                if (type === 'suint' && !/^\d+$/.test(value)) {
                    addToLog('error', 'Для типа suint значение должно быть числом');
                    return;
                } else if (type === 'saddress' && !/^0x[a-fA-F0-9]{40}$/.test(value)) {
                    addToLog('error', 'Для типа saddress значение должно быть адресом формата 0x...');
                    return;
                } else if (type === 'sbool' && !['true', 'false', '0', '1'].includes(value.toLowerCase())) {
                    addToLog('error', 'Для типа sbool значение должно быть true/false или 1/0');
                    return;
                }
                
                addToLog('info', `Шифрование данных (${type}): ${value}...`);
                
                // Make sure SDK is loaded
                if (!checkSDKLoaded()) {
                    await loadSeismicSDK();
                }
                
                // Format value based on type
                let formattedValue;
                if (type === 'suint') {
                    formattedValue = Number(value);
                } else if (type === 'sbool') {
                    formattedValue = ['true', '1'].includes(value.toLowerCase());
                } else {
                    formattedValue = value;
                }
                
                // Encrypt data
                currentEncryptedData = await window.seismicSDK.encrypt(type, formattedValue);
                
                // Update UI
                encryptedDataContainer.style.display = 'block';
                encryptedDataPreview.innerHTML = `
                    <div>Тип: <span class="text-success">${currentEncryptedData.type}</span></div>
                    <div>Значение: <span class="text-success">${currentEncryptedData.originalValue}</span></div>
                    <div>Зашифрованное значение: <span class="text-warning">${currentEncryptedData.encryptedValue}</span></div>
                `;
                
                // Enable send button
                sendTxBtn.disabled = false;
                
                addToLog('success', 'Данные успешно зашифрованы');
            } catch (error) {
                console.error('Error encrypting data:', error);
                addToLog('error', 'Ошибка шифрования данных: ' + error.message);
            }
        });
        
        // Send transaction
        sendTxBtn.addEventListener('click', async function() {
            try {
                if (!currentEncryptedData) {
                    addToLog('error', 'Сначала зашифруйте данные');
                    return;
                }
                
                addToLog('info', 'Отправка транзакции в Seismic...');
                
                // Make sure SDK is loaded
                if (!checkSDKLoaded()) {
                    await loadSeismicSDK();
                }
                
                // Send transaction
                const result = await window.seismicSDK.sendTransaction(currentEncryptedData);
                
                // Update UI
                addToLog('success', `Транзакция успешно отправлена!`);
                addToLog('info', `Хеш транзакции: ${result.hash || result.txHash}`);
                
                // Add link to explorer
                const txHash = result.hash || result.txHash;
                const explorerLink = document.createElement('a');
                explorerLink.href = `${window.seismicConfig.network.explorer}/tx/${txHash}`;
                explorerLink.target = '_blank';
                explorerLink.textContent = 'Открыть в обозревателе блоков';
                explorerLink.className = 'text-primary';
                
                txStatus.appendChild(document.createElement('br'));
                txStatus.appendChild(explorerLink);
                
                // Reset form
                txValue.value = '';
                currentEncryptedData = null;
                sendTxBtn.disabled = true;
                encryptedDataContainer.style.display = 'none';
            } catch (error) {
                console.error('Error sending transaction:', error);
                addToLog('error', 'Ошибка отправки транзакции: ' + error.message);
            }
        });
        
        // Clear log
        clearLogBtn.addEventListener('click', function() {
            txStatus.innerHTML = '<div class="text-muted">Лог транзакций будет отображаться здесь...</div>';
        });
        
        // Helper function to add message to log
        function addToLog(type, message) {
            const log = document.createElement('div');
            log.className = 'log-entry';
            
            const timestamp = new Date().toLocaleTimeString();
            let icon, color;
            
            switch (type) {
                case 'info':
                    icon = 'bi-info-circle';
                    color = 'text-primary';
                    break;
                case 'success':
                    icon = 'bi-check-circle';
                    color = 'text-success';
                    break;
                case 'error':
                    icon = 'bi-exclamation-triangle';
                    color = 'text-danger';
                    break;
                default:
                    icon = 'bi-circle';
                    color = 'text-muted';
            }
            
            log.innerHTML = `
                <span class="text-muted">[${timestamp}]</span>
                <i class="bi ${icon} ${color}"></i>
                <span class="${color}">${message}</span>
            `;
            
            if (txStatus.firstChild && txStatus.firstChild.classList && txStatus.firstChild.classList.contains('text-muted')) {
                txStatus.innerHTML = '';
            }
            
            txStatus.appendChild(log);
            txStatus.scrollTop = txStatus.scrollHeight;
        }
        
        // Helper function to format address
        function formatAddress(address) {
            if (!address) return '';
            return address.slice(0, 6) + '...' + address.slice(-4);
        }
        
        // Initialize (check if SDK is already loaded)
        if (checkSDKLoaded()) {
            addToLog('info', 'Seismic SDK уже загружен');
        }
    }
}); 