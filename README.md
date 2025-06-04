# 🌊 Seismic Transaction Sender - Powered by Privy

Современное Web3 приложение для отправки транзакций в сети Seismic с интеграцией Privy для упрощенного подключения кошелька.

## 🚀 Ключевые возможности

### 💼 Подключение кошелька через Privy
- **📧 Email** - вход через email с кодом подтверждения
- **📱 SMS** - вход через номер телефона  
- **🌐 Социальные сети** - Google, GitHub
- **👛 Внешние кошельки** - MetaMask, WalletConnect и другие
- **🔒 Встроенные кошельки** - автоматически создаются безопасные кошельки

### 🔐 Seismic Features
- **📤 Отправка транзакций** в сети Seismic devnet
- **🛡️ Зашифрованные транзакции** с использованием Seismic privacy features
- **🔢 Encrypted Types** - suint, saddress, sbool
- **📊 История транзакций** с детальной информацией
- **⚡ Real-time баланс** и статус сети

### 🎨 Пользовательский интерфейс
- **🌟 Современный дизайн** с Bootstrap
- **📱 Адаптивный интерфейс** для всех устройств  
- **🔄 Анимации** и плавные переходы
- **⚠️ Умные уведомления** об ошибках и успехах

## 🛠️ Технологии

- **Frontend**: Vanilla JavaScript, Bootstrap 5, CSS3
- **Web3**: Ethers.js 6.9.0
- **Wallet**: Privy SDK 1.69.0  
- **Network**: Seismic Devnet (Chain ID: 5124)
- **Encryption**: Seismic Privacy Features

## 🚀 Быстрый старт

### 1. Клонирование репозитория
```bash
git clone https://github.com/your-repo/seismic-transaction-sender.git
cd seismic-transaction-sender
```

### 2. Запуск проекта
```bash
# Установка зависимостей (опционально)
npm install

# Запуск локального сервера
npm start
# или просто откройте index.html в браузере
```

### 3. Подключение кошелька
1. Откройте приложение в браузере
2. Нажмите "Connect Wallet"  
3. Выберите способ входа:
   - Email/SMS для новых пользователей
   - Внешний кошелек для опытных пользователей

## 🔧 Конфигурация

### Privy Settings
```javascript
// seismic-config.js
privy: {
    appId: "cmbhhu8sr00mojr0l66siei2z",
    config: {
        loginMethods: ['email', 'wallet', 'sms', 'google', 'github'],
        appearance: {
            theme: 'light',
            accentColor: '#3B82F6'
        },
        embeddedWallets: {
            createOnLogin: 'users-without-wallets'
        },
        supportedChains: [5124] // Seismic devnet
    }
}
```

### Seismic Network
```javascript
network: {
    name: "Seismic devnet",
    chainId: 5124,
    rpcUrl: "https://node-2.seismicdev.net/rpc",
    explorer: "https://explorer-2.seismicdev.net/",
    faucet: "https://faucet-2.seismicdev.net/"
}
```

## 📋 Использование

### Отправка обычной транзакции
1. Подключите кошелек
2. Введите адрес получателя
3. Укажите сумму в ETH
4. Нажмите "Send Transaction"

### Отправка зашифрованной транзакции  
1. Включите "Enable Seismic Encryption"
2. Заполните данные транзакции
3. Добавьте зашифрованные данные (опционально)
4. Отправьте транзакцию

### Работа с Encrypted Types
1. Перейдите в раздел "Encrypted Types Demo"
2. Выберите тип данных (suint, saddress, sbool)
3. Введите значение
4. Нажмите "Encrypt Data"
5. Отправьте зашифрованную транзакцию

## 🔐 Безопасность

- **🛡️ Privy Security**: SOC 2 Type II сертификация
- **🔒 TEE**: Trusted Execution Environment для ключей
- **🌐 Distributed**: Распределенное хранение ключей
- **🔍 Audited**: Множественные аудиты безопасности

## 📊 Структура проекта

```
seismic-game/
├── index.html              # Главная страница
├── app.js                  # Основная логика приложения  
├── wallet-connector.js     # Privy интеграция
├── seismic-sdk.js         # Seismic SDK
├── seismic-config.js      # Конфигурация сети и Privy
├── style.css              # Стили приложения
├── seismic-animation.js   # Анимации
└── package.json           # Зависимости проекта
```

## 🌐 Сети

### Seismic Devnet
- **Chain ID**: 5124
- **RPC**: https://node-2.seismicdev.net/rpc
- **Explorer**: https://explorer-2.seismicdev.net/
- **Faucet**: https://faucet-2.seismicdev.net/

## 🤝 Поддержка

- **📚 Документация**: [Seismic Docs](https://docs.seismic.systems/)
- **🔍 Explorer**: [Seismic Explorer](https://explorer-2.seismicdev.net/)
- **💧 Faucet**: [Test ETH Faucet](https://faucet-2.seismicdev.net/)
- **🔗 Privy**: [Privy Documentation](https://docs.privy.io/)

## 📄 Лицензия

MIT License - см. файл [LICENSE](LICENSE)

---

**🌊 Seismic**: The first encrypted blockchain with EVM compatibility  
**🔐 Privy**: Modern wallet infrastructure for Web3 