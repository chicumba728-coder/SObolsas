import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Em desenvolvimento, os pedidos /api vão para o servidor Node (pnpm dev:api, porta 3001).
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': { target: `http://localhost:${process.env.API_PORT || 3001}`, changeOrigin: false },
    },
  },
});
