import { createAppKit } from '@reown/appkit/react';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { defineChain } from 'viem';

// BOT Chain Mainnet specification (Chain ID: 677)
export const botchainMainnet = defineChain({
  id: 677,
  name: 'BOT Chain',
  nativeCurrency: {
    name: 'BOT',
    symbol: 'BOT',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [process.env.BOTCHAIN_MAINNET_RPC || 'https://rpc.botchain.ai'],
    },
    public: {
      http: [process.env.BOTCHAIN_MAINNET_RPC || 'https://rpc.botchain.ai'],
    },
  },
  blockExplorers: {
    default: {
      name: 'BOTScan',
      url: process.env.BOTCHAIN_EXPLORER || 'https://scan.botchain.ai/',
    },
  },
  testnet: false,
});

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
      http: ['https://rpc.bohr.life'],
    },
    public: {
      http: ['https://rpc.bohr.life'],
    },
  },
  blockExplorers: {
    default: {
      name: 'BOTScan Testnet',
      url: 'https://scan.bohr.life/',
    },
  },
  testnet: true,
});

export const projectId = process.env.REOWN_ID || 'd9690df1851903b53a4f8c440127edec';

export const networks = [botchainMainnet, botchainTestnet];

export const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks,
});

export const metadata = {
  name: 'NonceWatch',
  description: 'Wallet Nonce Inspector & Sequencing Diagnoser on BOT Chain',
  url: 'https://noncewatch.vercel.app',
  icons: ['https://scan.botchain.ai/favicon.ico'],
};

// Initialize AppKit modal
createAppKit({
  adapters: [wagmiAdapter],
  networks: [botchainMainnet, botchainTestnet],
  defaultNetwork: botchainMainnet,
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
