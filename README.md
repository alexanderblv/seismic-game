# Seismic Transaction Sender

🌊 **Отправка зашифрованных транзакций через Seismic Devnet**

Это приложение позволяет отправлять как обычные, так и зашифрованные транзакции через Seismic blockchain devnet с использованием [Privy](https://privy.io) для аутентификации кошелька.

## ✨ Функционал

### 💼 Управление кошельком
- **Подключение кошелька** через Privy (email + встроенный кошелек)
- **Отображение адреса** и баланса кошелька 
- **Автоматическое добавление** Seismic devnet в кошелек
- **Переключение сетей** автоматически на Seismic devnet

### 💸 Отправка транзакций
- **Обычные транзакции** - стандартные Ethereum-транзакции
- **Зашифрованные транзакции** - с использованием Seismic encryption
- **Проверка баланса** перед отправкой
- **Подтверждение транзакций** с отображением результата

### 🔐 Демо зашифрованных типов
- **suint** - зашифрованные целые числа
- **saddress** - зашифрованные адреса
- **sbool** - зашифрованные булевы значения
- **Интерактивное шифрование** данных
- **Отправка зашифрованных** транзакций в контракты

### 📜 История транзакций
- **Локальное сохранение** истории транзакций
- **Отображение статуса** (Pending/Success/Failed)
- **Ссылки на explorer** для просмотра в блокчейне
- **Очистка истории** транзакций

## 🛠 Технические детали

### Seismic Devnet
- **Chain ID**: 5124
- **RPC URL**: `https://node-2.seismicdev.net/rpc`
- **Explorer**: `https://explorer-2.seismicdev.net/`
- **Faucet**: `https://faucet-2.seismicdev.net/`

### Архитектура
- **Frontend**: Vanilla JavaScript + Bootstrap 5
- **Wallet**: Privy JS Core SDK
- **Blockchain**: Ethers.js v5
- **Encryption**: Seismic privacy features

### Компоненты
- `seismic-config.js` - конфигурация сети и Privy
- `wallet-connector.js` - интеграция с Privy кошельком
- `seismic-sdk.js` - SDK для работы с Seismic blockchain
- `app.js` - основная логика приложения
- `styles.css` - стили интерфейса

## 🚀 Запуск

### Локально
```bash
# Запуск HTTP сервера
python -m http.server 8080

# Или с Node.js
npx serve .

# Откройте http://localhost:8080
```

### Деплой
Приложение можно деплоить на любой статический хостинг:
- Vercel
- Netlify  
- GitHub Pages
- AWS S3

## 📖 Использование

1. **Подключите кошелек** 
   - Нажмите "Connect Wallet"
   - Введите email для Privy аутентификации
   - Подтвердите код из email
   - Создастся встроенный кошелек

2. **Получите тестовые ETH**
   - Используйте faucet: https://faucet-2.seismicdev.net/
   - Введите ваш адрес кошелька

3. **Отправьте транзакцию**
   - Введите адрес получателя
   - Укажите сумму в ETH
   - Опционально включите шифрование
   - Подтвердите транзакцию

4. **Попробуйте зашифрованные типы**
   - Выберите тип данных (suint/saddress/sbool)
   - Введите значение для шифрования
   - Нажмите "Encrypt Data"
   - Отправьте в контракт (если есть адрес)

## 🔗 Ссылки

- [Seismic Documentation](https://docs.seismic.systems/)
- [Privy Documentation](https://docs.privy.io/)
- [Ethers.js Documentation](https://docs.ethers.io/v5/)
- [Seismic Devnet Explorer](https://explorer-2.seismicdev.net/)
- [Seismic Devnet Faucet](https://faucet-2.seismicdev.net/)

## 🛟 Поддержка

Если возникают проблемы:
1. Проверьте подключение к интернету
2. Убедитесь, что используете современный браузер
3. Откройте Developer Tools для просмотра ошибок
4. Проверьте работу Seismic devnet

## 🏗 Разработка

### Требования
- Современный браузер с поддержкой ES6+
- HTTP сервер (для CORS)
- Интернет-подключение

### Структура файлов
```
├── index.html          # Основная страница
├── app.js             # Логика приложения  
├── seismic-config.js  # Конфигурация Seismic
├── wallet-connector.js # Подключение кошелька
├── seismic-sdk.js     # SDK для Seismic
├── styles.css         # Стили
└── README.md          # Документация
```

---

💡 **Tip**: Для первого знакомства с Seismic рекомендуем ознакомиться с [официальной документацией](https://docs.seismic.systems/).

## 🌊 Seismic Game - Privy React Auth Integration

Блокчейн игра с интеграцией официального Privy React Auth SDK для безопасной аутентификации пользователей.

## 🚀 Особенности

- ✅ **React 18** с современным функциональным подходом
- ✅ **Privy React Auth SDK** для wallet-аутентификации
- ✅ **Seismic Devnet** интеграция (Chain ID: 5124)
- ✅ **Webpack** сборка для оптимизации
- ✅ **Vercel** деплой с автоматической сборкой
- ✅ **Безопасность** с CSP заголовками
- ✅ **Адаптивный дизайн** для всех устройств

## 📋 Предварительные требования

- Node.js 18+ 
- npm или yarn
- Аккаунт на [Vercel](https://vercel.com)
- Privy App ID (уже настроен: `cmbhhu8sr00mojr0l66siei2z`)

## 🛠 Локальная разработка

### 1. Установка зависимостей

```bash
npm install
```

### 2. Запуск dev сервера

```bash
npm start
# или
npm run dev
```

Приложение будет доступно по адресу: http://localhost:3000

### 3. Сборка для продакшена

```bash
npm run build
```

## 🌐 Деплой на Vercel

### Автоматический деплой

1. Подключите ваш GitHub репозиторий к Vercel
2. Vercel автоматически определит настройки:
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### Ручной деплой

```bash
npm install -g vercel
vercel --prod
```

## 🔧 Конфигурация

### Privy настройки

В файле `seismic-config.js`:

```javascript
privy: {
    appId: "cmbhhu8sr00mojr0l66siei2z",
    config: {
        appearance: {
            accentColor: "#6A6FF5",
            theme: "#FFFFFF",
            showWalletLoginFirst: false
        },
        loginMethods: ["wallet"],
        supportedChains: [5124],
        defaultChain: 5124
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

## 📁 Структура проекта

```
seismic-game/
├── public/
│   └── index.html          # HTML шаблон для webpack
├── src/
│   ├── index.js           # Точка входа React
│   ├── App.jsx            # Главный компонент
│   └── App.css            # Стили приложения
├── index.html             # Статическая страница-заглушка
├── app.html               # Страница с информацией о приложении
├── seismic-config.js      # Конфигурация Seismic и Privy
├── package.json           # Зависимости и скрипты
├── webpack.config.js      # Конфигурация сборки
├── vercel.json           # Настройки Vercel деплоя
└── .vercelignore         # Исключения для деплоя
```

## 🔗 Основные функции

### Аутентификация

```javascript
import { usePrivy } from '@privy-io/react-auth';

function MyComponent() {
    const { ready, authenticated, user, login, logout } = usePrivy();

    if (!ready) return <div>Загрузка...</div>;

    return authenticated ? (
        <div>
            <p>Добро пожаловать, {user.id}!</p>
            <button onClick={logout}>Выйти</button>
        </div>
    ) : (
        <button onClick={login}>Войти</button>
    );
}
```

### Подключение к Seismic Network

```javascript
// Автоматически настроено в конфигурации
const seismicNetwork = {
    chainId: 5124,
    rpcUrl: "https://node-2.seismicdev.net/rpc"
};
```

## 🛡 Безопасность

Приложение включает следующие меры безопасности:

- **Content Security Policy** заголовки
- **Cross-Origin-Opener-Policy** для wallet popups
- **X-Frame-Options** против clickjacking
- **Secure token handling** через Privy SDK

## 📱 Поддерживаемые кошельки

- 🦊 **MetaMask**
- 🔗 **WalletConnect**
- 📱 **Privy Embedded Wallets**
- 🌟 **Detected Wallets** (автоматически)

## 🔄 Workflow

1. **Пользователь** посещает приложение
2. **Приложение** инициализирует Privy SDK
3. **Пользователь** нажимает "Подключить кошелек"
4. **Privy** показывает модальное окно с опциями
5. **Пользователь** выбирает кошелек и подтверждает
6. **Приложение** получает данные пользователя
7. **Готово** - пользователь аутентифицирован!

## 🐛 Устранение проблем

### Проблема: "MetaMask encountered an error"

**Решение**: Это нормально при наличии нескольких wallet расширений. Приложение использует Privy для управления подключениями.

### Проблема: "Privy SDK failed to load"

**Решение**: 
1. Проверьте интернет подключение
2. Убедитесь, что Privy App ID корректный
3. Проверьте консоль браузера на ошибки

### Проблема: Сборка не работает локально

**Решение**:
```bash
# Очистите node_modules и переустановите
rm -rf node_modules package-lock.json
npm install

# Проверьте версию Node.js
node --version  # должно быть 18+
```

## 📚 Полезные ссылки

- [Privy Documentation](https://docs.privy.io/)
- [Seismic Network Explorer](https://explorer-2.seismicdev.net/)
- [React Documentation](https://react.dev/)
- [Webpack Guide](https://webpack.js.org/)
- [Vercel Deployment](https://vercel.com/docs)

## 📞 Поддержка

Если у вас возникли вопросы или проблемы:

1. Проверьте [документацию Privy](https://docs.privy.io/)
2. Посмотрите [примеры интеграции](https://github.com/privy-io/privy-examples)
3. Проверьте консоль браузера на ошибки

## 📄 Лицензия

MIT License - смотрите файл [LICENSE](LICENSE) для деталей.

---

**Создано с ❤️ для Seismic Network экосистемы** 