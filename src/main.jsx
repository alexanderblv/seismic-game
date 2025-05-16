import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

import '@rainbow-me/rainbowkit/styles.css'
import {
  getDefaultWallets,
  RainbowKitProvider,
  darkTheme
} from '@rainbow-me/rainbowkit'
import { configureChains, createConfig, WagmiConfig } from 'wagmi'
import { mainnet, sepolia } from 'wagmi/chains'
import { publicProvider } from 'wagmi/providers/public'

// Create a custom Seismic chain configuration
const seismicChain = {
  id: 5124,
  name: 'Seismic Devnet',
  network: 'seismic',
  nativeCurrency: {
    decimals: 18,
    name: 'Ethereum',
    symbol: 'ETH',
  },
  rpcUrls: {
    public: { http: ['https://rpc.seismicdev.net'] },
    default: { http: ['https://rpc.seismicdev.net'] },
  },
  blockExplorers: {
    default: { name: 'Seismic Explorer', url: 'https://explorer.seismicdev.net' },
  },
  testnet: true,
}

const { chains, publicClient } = configureChains(
  [seismicChain, mainnet, sepolia],
  [publicProvider()]
)

const { connectors } = getDefaultWallets({
  appName: 'Seismic Experience',
  projectId: 'YOUR_PROJECT_ID', // You'll need to get this from WalletConnect
  chains
})

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <WagmiConfig config={wagmiConfig}>
      <RainbowKitProvider chains={chains} theme={darkTheme()}>
        <App />
      </RainbowKitProvider>
    </WagmiConfig>
  </React.StrictMode>,
) 