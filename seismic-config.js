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
    
    // Настройки для Privy с новой конфигурацией
    privy: {
        appId: "cmbhhu8sr00mojr0l66siei2z",
        config: {
            "appearance": {
                "accentColor": "#6A6FF5",
                "theme": "#FFFFFF",
                "showWalletLoginFirst": false,
                "logo": "https://auth.privy.io/logos/privy-logo.png",
                "walletChainType": "ethereum-and-solana",
                "walletList": [
                    "detected_wallets",
                    "metamask",
                    "phantom"
                ]
            },
            "loginMethods": [
                "wallet"
            ],
            "fundingMethodConfig": {
                "moonpay": {
                    "useSandbox": true
                }
            },
            "embeddedWallets": {
                "requireUserPasswordOnCreate": false,
                "showWalletUIs": true,
                "ethereum": {
                    "createOnLogin": "users-without-wallets"
                },
                "solana": {
                    "createOnLogin": "users-without-wallets"
                }
            },
            "mfa": {
                "noPromptOnMfaRequired": false
            },
            "externalWallets": {
                "solana": {
                    "connectors": {}
                }
            },
            "supportedChains": [5124], // Seismic devnet chain ID
            "defaultChain": 5124
        }
    }
};

// Экспортируем конфигурацию для использования в браузере
if (typeof window !== 'undefined') {
    window.seismicConfig = seismicConfig;
}

// Экспортируем конфигурацию для использования в ES6 модулях (если требуется)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { seismicConfig };
} 