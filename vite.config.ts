import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname || '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true'
        ? { clientPort: 3000, path: '/@vite/client' }
        : false,
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      proxy: {
        '/api': 'http://localhost:3000',
      },
    },
  };
});
