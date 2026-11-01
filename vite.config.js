import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    define: {
      // Safely inject REOWN_ID without exposing it as a VITE_ prefix
      'process.env.REOWN_ID': JSON.stringify(env.REOWN_ID || ''),
      'process.env.BOTCHAIN_TESTNET_RPC': JSON.stringify(env.BOTCHAIN_TESTNET_RPC || 'https://rpc.bohr.life'),
      'process.env.BOTCHAIN_CHAIN_ID': JSON.stringify(env.BOTCHAIN_CHAIN_ID || '968'),
      'process.env.BOTCHAIN_EXPLORER': JSON.stringify(env.BOTCHAIN_EXPLORER || 'https://scan.bohr.life/'),
      'process.env.VITE_REGISTRY_ADDRESS': JSON.stringify(env.VITE_REGISTRY_ADDRESS || ''),
    },
    server: {
      port: 5173,
      host: true,
    },
  };
});

