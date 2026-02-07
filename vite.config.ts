import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const base = env.VITE_BASE_PATH || (mode === 'production' ? '/webCHAT/' : '/');

  return {
    server: {
      port: 5000,
      host: '0.0.0.0',
      allowedHosts: true,
      hmr: {
        clientPort: 443
      }
    },
    base,
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.')
      }
    }
  };
});
