# Seismic Transaction Sender with RainbowKit

A blockchain transaction app for Seismic Network with wallet connection using RainbowKit.

## Features

- Connect wallet with RainbowKit (supports MetaMask, Coinbase Wallet, WalletConnect, and more)
- Custom Seismic Network configuration
- Transaction sending capability
- Balance display
- Modern React + Vite setup

## Prerequisites

- Node.js 16.x or higher
- npm or yarn

## Installation

1. Clone the repository:
```
git clone <repository-url>
cd seismic-game
```

2. Install dependencies:
```
npm install
```
or
```
yarn
```

3. Get a WalletConnect project ID:
   - Visit [WalletConnect Cloud](https://cloud.walletconnect.com/)
   - Create an account and create a new project
   - Copy your Project ID
   - Replace `YOUR_PROJECT_ID` in `src/main.jsx` with your actual Project ID

## Development

Start the development server:

```
npm run dev
```
or
```
yarn dev
```

This will start the application at http://localhost:3000.

## Building for Production

Build the application:

```
npm run build
```
or
```
yarn build
```

The built files will be in the `dist` directory.

## RainbowKit Configuration

This project uses RainbowKit for wallet connection which offers:

- Beautiful, customizable UI
- Support for 100+ wallets
- Dark/light mode theming
- Mobile responsive design
- Wallet connection state management

## Project Structure

- `src/main.jsx` - Application entry point with RainbowKit and wagmi configuration
- `src/App.jsx` - Main application component
- `src/index.css` - Global styles

## Customization

You can customize the theme and appearance of RainbowKit in `src/main.jsx`:

```jsx
<RainbowKitProvider chains={chains} theme={darkTheme()}>
  <App />
</RainbowKitProvider>
```

Available themes include:
- `darkTheme()`
- `lightTheme()`
- Custom themes 