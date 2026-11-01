import { createAppKit } from '@reown/appkit/react';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { defineChain } from 'viem';

// BOT Chain Testnet specification (Chain ID: 968)
export const botchainTestnet = defineChain({
  id: 968,
  name: 'BOT Chain Testnet',
  nativeCurrency: {
    name: 'BOT',
    symbol: 'BOT',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [process.env.BOTCHAIN_TESTNET_RPC || 'https://rpc.bohr.life'],
    },
    public: {
      http: [process.env.BOTCHAIN_TESTNET_RPC || 'https://rpc.bohr.life'],
    },
  },
  blockExplorers: {
    default: {
      name: 'BOTScan',
      url: process.env.BOTCHAIN_EXPLORER || 'https://scan.bohr.life/',
    },
  },
  testnet: true,
});

// AppKit Project ID - Retrieved securely from REOWN_ID in .env
// Defaults to a fallback id if empty so the app remains resilient
export const projectId = process.env.REOWN_ID || '3a8170812b534d0ff9d794f168faebe4';

export const networks = [botchainTestnet];

export const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks,
});

export const metadata = {
  name: 'NonceWatch',
  description: 'Wallet Nonce Inspector & Sequencing Diagnoser on BOT Chain Testnet',
  url: 'https://noncewatch.bohr.life',
  icons: ['https://scan.bohr.life/favicon.ico'],
};

// Initialize AppKit modal
createAppKit({
  adapters: [wagmiAdapter],
  networks: [botchainTestnet],
  defaultNetwork: botchainTestnet,
  projectId,
  metadata,
  themeMode: 'light',
  themeVariables: {
    '--w3m-accent': '#1e3a8a',
    '--w3m-color-mix': '#0f1c32',
    '--w3m-color-mix-strength': 10,
    '--w3m-border-radius-master': '8px',
  },
  features: {
    analytics: false,
    email: false,
    socials: false,
  },
});

