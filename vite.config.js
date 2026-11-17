import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    define: {
      'process.env.REOWN_ID': JSON.stringify(env.REOWN_ID || ''),
      'process.env.BOTCHAIN_MAINNET_RPC': JSON.stringify(env.BOTCHAIN_MAINNET_RPC || env.BOTCHAIN_RPC || 'https://rpc.botchain.ai'),
      'process.env.BOTCHAIN_CHAIN_ID': JSON.stringify(env.BOTCHAIN_CHAIN_ID || '677'),
      'process.env.BOTCHAIN_EXPLORER': JSON.stringify(env.BOTCHAIN_EXPLORER || 'https://scan.botchain.ai/'),
      'process.env.VITE_REGISTRY_ADDRESS': JSON.stringify(env.VITE_REGISTRY_ADDRESS || '0x5D9e60Fd6eF30e58EfC16BD00CFbBFB4C3297c73'),
    },
    server: {
      port: 5173,
      host: true,
    },
  };
});
