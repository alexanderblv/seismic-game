// Конфигурация для подключения к Seismic Devnet
const seismicConfig = {
    // Информация о сети Seismic Devnet
    network: {
        name: "Seismic devnet",
        symbol: "ETH",
        chainId: 5124,
        rpcUrl: "https://node-2.seismicdev.net/rpc",
        wsUrl: "wss://node-2.seismicdev.net/ws",
        explorer: "https://explorer-2.seismicdev.net/",
        faucet: "https://faucet-2.seismicdev.net/",
        // Метаданные для отображения в кошельках
        nativeCurrency: {
            name: "Ether",
            symbol: "ETH",
            decimals: 18
        },
        network: "seismic"
    },
    
    // Конфигурация контракта для демонстрации
    contract: {
        // Здесь можно добавить адрес смарт-контракта, если у вас есть развернутый контракт
        address: "",
        // ABI (интерфейс) контракта
        abi: []
    },
    
    // Параметры конфиденциальности для Seismic
    privacyOptions: {
        enableEncryption: true,
        useTEE: true, // Trusted Execution Environment
        enableZKP: true // Zero-Knowledge Proofs
    },
    
    // Настройки для Privy
    privy: {
        appId: "cmbhhu8sr00mojr0l66siei2z",
        appSecret: "2jkthX9UFUeR1966VtWGh91z22e6R9Bjn46e4FCqeNGFXC9HNwt8XpqfiNS6aGba43NMotscpSSFyWAmDTZ9SwqJ",
        config: {
            loginMethods: ['email', 'wallet', 'sms', 'google', 'github'],
            appearance: {
                theme: 'light',
                accentColor: '#3B82F6',
                logo: 'https://avatars.githubusercontent.com/u/91174481'
            },
            embeddedWallets: {
                createOnLogin: 'users-without-wallets',
                requireUserPasswordOnCreate: false
            },
            supportedChains: [5124], // Seismic devnet chain ID
            defaultChain: 5124
        }
    }
};

// Экспортируем конфигурацию для использования в других файлах
if (typeof module !== 'undefined') {
    module.exports = seismicConfig;
} else {
    // Для использования в браузере
    window.seismicConfig = seismicConfig;
} 