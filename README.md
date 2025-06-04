# 🌊 Seismic Experience

Приложение для демонстрации возможностей сети Seismic с интеграцией **Privy React Auth SDK** для аутентификации пользователей.

## 🚀 Быстрый старт

### 1. Запустите локальный сервер
```bash
npm start
# или 
npx serve . -p 3000
```

### 2. Откройте тестовую страницу Privy
```
http://localhost:3000/test-privy-react.html
```

### 3. Протестируйте интеграцию
1. 🧪 **Test SDK Loading** - проверка загрузки Privy React Auth SDK
2. 🔐 **Test Login** - тестирование аутентификации
3. 👛 **Test Wallet** - проверка wallet функций
4. 🚪 **Test Logout** - тестирование выхода

## 🔐 Privy Authentication

### Конфигурация
Все настройки находятся в `seismic-config.js`:

```javascript
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
        supportedChains: [5124], // Seismic devnet
        defaultChain: 5124
    }
}
```

### Поддерживаемые методы входа:
- 📧 **Email** - вход через email
- 👛 **Wallet** - подключение MetaMask/WalletConnect
- 📱 **SMS** - вход через номер телефона  
- 🔗 **Google** - вход через Google аккаунт
- 🐙 **GitHub** - вход через GitHub

## 🌐 Seismic Network

### Параметры сети:
- **Name:** Seismic devnet
- **Chain ID:** 5124
- **RPC:** https://node-2.seismicdev.net/rpc
- **Explorer:** https://explorer-2.seismicdev.net/
- **Faucet:** https://faucet-2.seismicdev.net/

### Privacy Features:
- 🔒 **Encryption** - шифрование данных
- 🛡️ **TEE** - Trusted Execution Environment
- 🔐 **ZKP** - Zero-Knowledge Proofs

## 📁 Структура проекта

```
seismic-game/
├── index.html                 # Основное приложение
├── test-privy-react.html     # Тестирование Privy
├── seismic-config.js         # Конфигурация
├── wallet-connector.js       # Wallet connector
├── app.js                    # Логика приложения
├── package.json              # Зависимости
├── vercel.json              # Конфиг Vercel
└── docs/
    ├── PRIVY_MIGRATION.md    # Миграция на Privy React Auth
    └── PRIVY_TROUBLESHOOTING.md # Решение проблем
```

## 🧪 Тестирование

### Автоматические тесты:
```bash
npm run test-privy
```

### Ручное тестирование:
1. Откройте `test-privy-react.html`
2. Проследите за логами в консоли
3. Проверьте каждый этап:
   - ✅ SDK загружается
   - ✅ React компоненты работают
   - ✅ Конфигурация корректна
   - ✅ Authentication работает

### Отладка:
```javascript
// В консоли браузера:
console.log(window.React);          // Проверка React
console.log(window.PrivyReactAuth); // Проверка Privy SDK
console.log(window.seismicConfig);  // Проверка конфигурации
```

## 📦 Зависимости

```json
{
  "dependencies": {
    "@privy-io/react-auth": "^1.69.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0", 
    "ethers": "^6.9.0",
    "serve": "^14.0.0"
  }
}
```

### CDN зависимости:
- React 18 (UMD)
- ReactDOM 18 (UMD)
- Privy React Auth SDK (UMD)
- Ethers.js v5 (для совместимости)

## 🚀 Деплой на Vercel

### 1. Подключите репозиторий к Vercel
```bash
vercel link
```

### 2. Настройте переменные окружения (если нужно)
```bash
# Приватные настройки в Vercel Dashboard
PRIVY_APP_SECRET=your_secret_here
```

### 3. Деплойте
```bash
vercel --prod
```

### Автоматический деплой:
- При push в `main` - автоматический деплой
- При PR - preview деплой
- Все статические файлы обслуживаются Vercel

## 🔧 Разработка

### Локальная разработка:
```bash
git clone <repository>
cd seismic-game
npm install
npm start
```

### Hot reload:
```bash
npx serve . -p 3000 --reload
```

### Environment:
- **Development:** http://localhost:3000
- **Production:** https://your-app.vercel.app

## 🆘 Troubleshooting

### Частые проблемы:

#### 1. Privy SDK не загружается
```bash
# Проверьте доступность CDN
curl -I https://unpkg.com/@privy-io/react-auth@latest/dist/index.umd.js
```

#### 2. React ошибки
```javascript
// Проверьте в консоли
if (!window.React) console.error('React not loaded');
if (!window.ReactDOM) console.error('ReactDOM not loaded');
```

#### 3. Проблемы с сетью
- Проверьте RPC: https://node-2.seismicdev.net/rpc
- Добавьте сеть в MetaMask вручную
- Получите тестовые токены: https://faucet-2.seismicdev.net/

### Полная документация:
- 📋 [PRIVY_MIGRATION.md](PRIVY_MIGRATION.md) - Миграция на Privy React Auth
- 🔧 [PRIVY_TROUBLESHOOTING.md](PRIVY_TROUBLESHOOTING.md) - Решение проблем

## 🔗 Полезные ссылки

- 🌊 [Seismic Network](https://seismic.dev/)
- 🔐 [Privy Documentation](https://docs.privy.io/welcome)  
- 🚀 [Vercel Platform](https://vercel.com/)
- 🦊 [MetaMask](https://metamask.io/)

## 📄 Лицензия

MIT License - см. [LICENSE](LICENSE)

---

**Важно:** Это демо-приложение для тестирования. В продакшене используйте дополнительные меры безопасности. 