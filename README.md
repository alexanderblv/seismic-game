# 🌊 Seismic Game - Privy React Auth

Блокчейн игра с официальным Privy React Auth SDK для сети Seismic.

## ✨ Особенности

- ✅ **Официальный Privy React SDK** - Используем [@privy-io/react-auth](https://www.npmjs.com/package/@privy-io/react-auth)
- 🔐 **Безопасная аутентификация** - Поддержка кошельков и email
- 🌐 **Seismic Network** - Интеграция с Seismic devnet
- 📱 **Адаптивный дизайн** - Работает на всех устройствах
- 🚀 **Современный стек** - React 18 + Privy + CSS3

## 🔧 Технические решения

### Проблемы, которые были решены:

1. **MetaMask конфликты** - Убраны конфликты с глобальным Ethereum provider
2. **UMD bundle проблемы** - Переход на официальный React SDK вместо ванильного JS
3. **Загрузка SDK** - Правильная последовательность загрузки зависимостей
4. **Настройка сети** - Корректная конфигурация Seismic network

### Архитектура:

```
index.html (CDN версия)
├── React 18 (через CDN)
├── Babel Standalone (для JSX)
├── Privy React Auth SDK (через CDN)
└── Seismic Game App
    ├── PrivyProvider (конфигурация)
    ├── AppContent (основная логика)
    └── UI компоненты
```

## 🚀 Быстрый запуск

### Вариант 1: CDN версия (рекомендуется)

Просто откройте `index.html` в браузере или разверните на Vercel:

```bash
# Клонируйте репозиторий
git clone <repository-url>
cd seismic-game

# Откройте index.html в браузере
# ИЛИ разверните на Vercel
vercel deploy
```

### Вариант 2: Local development (требует Node.js)

```bash
# Установите зависимости
npm install

# Запустите dev сервер
npm start
```

## 🔑 Приватная конфигурация

Приложение использует следующую конфигурацию:

```javascript
// App ID (уже настроен)
const PRIVY_APP_ID = "cmbhhu8sr00mojr0l66siei2z"

// Seismic Network
const seismicNetwork = {
  id: 5124,
  name: 'Seismic devnet',
  rpcUrl: 'https://node-2.seismicdev.net/rpc',
  explorer: 'https://explorer-2.seismicdev.net/',
}
```

## 🎮 Использование

1. **Откройте приложение** в браузере
2. **Нажмите "Подключить кошелек"** 
3. **Выберите способ входа:**
   - 📧 Email аутентификация
   - 👛 Внешний кошелек (MetaMask, etc.)
   - 🔐 Встроенный кошелек Privy
4. **Наслаждайтесь игрой!**

## 🌐 Деплой на Vercel

Проект готов для деплоя на Vercel:

```bash
# Деплой
vercel deploy

# Или для production
vercel --prod
```

### Настройки Vercel:

- **Framework Preset**: Other
- **Build Command**: (оставить пустым)
- **Output Directory**: (оставить пустым)
- **Install Command**: (оставить пустым)

Vercel автоматически будет использовать статический `index.html` файл.

## 🛠 Разработка

### Структура проекта:

```
seismic-game/
├── index.html              # 🚀 Главный файл (CDN версия)
├── src/                    # 📁 React компоненты (для npm версии)
│   ├── App.js
│   ├── App.css
│   └── index.js
├── public/                 # 📁 Статические файлы
│   └── index.html
├── package.json            # 📦 NPM зависимости
├── webpack.config.js       # ⚙️ Webpack конфигурация
├── vercel.json            # 🌐 Vercel настройки
└── README.md              # 📖 Этот файл
```

### Основные компоненты:

- **App** - Главный компонент с PrivyProvider
- **AppContent** - Контент приложения с usePrivy hook
- **Конфигурация** - Настройки сети и Privy

## 🔍 Отладка

### Логи в консоли:

```javascript
// Проверка загрузки SDK
console.log('✅ Privy React Auth SDK загружен успешно')

// Информация о пользователе
console.log('User:', user)
console.log('User wallets:', user?.linkedAccounts)
```

### Частые проблемы:

1. **SDK не загружается** - Проверьте подключение к интернету
2. **MetaMask конфликты** - Отключены автоматически
3. **Сеть не поддерживается** - Используйте Seismic devnet

## 📚 Документация Privy

- [Privy React Auth Docs](https://docs.privy.io/guide/react)
- [Configuration Guide](https://docs.privy.io/guide/react/configuration)
- [Supported Chains](https://docs.privy.io/guide/react/configuration/chains)

## 📄 Лицензия

MIT License - см. [LICENSE](LICENSE) файл.

## 🤝 Поддержка

Для вопросов и поддержки:
- 📧 Email: support@seismic.game
- 🌐 Website: [seismic.game](https://seismic.game)
- 📱 Discord: [Seismic Community](https://discord.gg/seismic)

---

**🌊 Добро пожаловать в мир Seismic Game!** 