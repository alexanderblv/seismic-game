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
        faucet: "https://faucet-2.seismicdev.net/"
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