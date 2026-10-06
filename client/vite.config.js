import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite Dev Server Proxy & Network Host Configuration
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Expose on all network interfaces (localhost + 192.168.0.131)
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
      '/uploads': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:3000',
        ws: true,
      },
    },
  },
});
