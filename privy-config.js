/**
 * Privy Configuration
 * Конфигурация для подключения кошельков через Privy
 */

// Ваши данные Privy
const PRIVY_CONFIG = {
    appId: 'cmbhhu8sr00mojr0l66siei2z',
    appSecret: '2jkthX9UFUeR1966VtWGh91z22e6R9Bjn46e4FCqeNGFXC9HNwt8XpqfiNS6aGba43NMotscpSSFyWAmDTZ9SwqJ',
    
    // Конфигурация подключения
    config: {
        // Методы входа
        loginMethods: [
            'email',     // Вход через email
            'sms',       // Вход через SMS
            'wallet',    // Внешние кошельки (MetaMask, WalletConnect)
            'google',    // Google OAuth
            'github',    // GitHub OAuth
        ],
        
        // Внешний вид
        appearance: {
            theme: 'light',
            accentColor: '#3B82F6',
            logo: null,
        },
        
        // Поддерживаемые сети
        supportedChains: [
            {
                id: 1,
                name: 'Ethereum',
                network: 'homestead',
                nativeCurrency: {
                    decimals: 18,
                    name: 'Ethereum',
                    symbol: 'ETH',
                },
                rpcUrls: {
                    public: { http: ['https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161'] },
                    default: { http: ['https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161'] },
                },
                blockExplorers: {
                    etherscan: { name: 'Etherscan', url: 'https://etherscan.io' },
                    default: { name: 'Etherscan', url: 'https://etherscan.io' },
                },
            },
            {
                id: 137,
                name: 'Polygon',
                network: 'matic',
                nativeCurrency: {
                    decimals: 18,
                    name: 'MATIC',
                    symbol: 'MATIC',
                },
                rpcUrls: {
                    public: { http: ['https://polygon-rpc.com'] },
                    default: { http: ['https://polygon-rpc.com'] },
                },
                blockExplorers: {
                    polygonscan: { name: 'PolygonScan', url: 'https://polygonscan.com' },
                    default: { name: 'PolygonScan', url: 'https://polygonscan.com' },
                },
            },
            {
                id: 11155111,
                name: 'Sepolia',
                network: 'sepolia',
                nativeCurrency: {
                    decimals: 18,
                    name: 'Sepolia Ethereum',
                    symbol: 'SEP',
                },
                rpcUrls: {
                    public: { http: ['https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161'] },
                    default: { http: ['https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161'] },
                },
                blockExplorers: {
                    etherscan: { name: 'Etherscan', url: 'https://sepolia.etherscan.io' },
                    default: { name: 'Etherscan', url: 'https://sepolia.etherscan.io' },
                },
            }
        ],
        
        // Встроенные кошельки
        embeddedWallets: {
            createOnLogin: 'users-without-wallets', // Создавать кошелек автоматически для пользователей без кошелька
            requireUserPasswordOnCreate: false,     // Не требовать пароль при создании
            showWalletUIs: true,                   // Показывать UI кошелька
        },
        
        // Дополнительные настройки
        mfa: {
            noPromptOnMfaRequired: false,
        },
    }
};

// Экспортируем конфигурацию
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PRIVY_CONFIG;
} else {
    window.PRIVY_CONFIG = PRIVY_CONFIG;
} 