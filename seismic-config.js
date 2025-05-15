// Конфигурация для подключения к Seismic Devnet
const seismicConfig = {
    // Информация о сети Seismic Devnet
    network: {
        name: "Sepolia",
        symbol: "ETH",
        chainId: 11155111,
        rpcUrl: "https://rpc.sepolia.org",
        wsUrl: "wss://rpc.sepolia.org/ws",
        explorer: "https://sepolia.etherscan.io",
        faucet: "https://sepoliafaucet.com/"
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
    }
};

// Экспортируем конфигурацию для использования в других файлах
if (typeof module !== 'undefined') {
    module.exports = seismicConfig;
} else {
    // Для использования в браузере
    window.seismicConfig = seismicConfig;
} 