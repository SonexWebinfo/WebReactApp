import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: '/index.html' // project main HTML
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom'] // explicit dependencies
  }
});
