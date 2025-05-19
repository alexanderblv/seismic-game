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
    
    // Настройки для Web3Modal и WalletConnect
    walletConnect: {
        projectId: "a85ac05209955cfd18fbe7c0fd018f23", // Заменить на актуальный projectId от cloud.walletconnect.com
        infuraId: "9aa3d95b3bc440fa88ea12eaa4456161", // Public Infura ID for WalletConnect v1
        name: "Seismic Transaction Sender",
        description: "Приложение для отправки транзакций в сети Seismic",
        url: "https://seismic.systems",
        icons: ["https://avatars.githubusercontent.com/u/91174481"]
    }
};

// Экспортируем конфигурацию для использования в других файлах
if (typeof module !== 'undefined') {
    module.exports = seismicConfig;
} else {
    // Для использования в браузере
    window.seismicConfig = seismicConfig;
} 