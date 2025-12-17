import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': '/front'
    }
  },
  server: {
    proxy: {
      '/users': 'http://localhost:3000',
      '/journeys': 'http://localhost:3000',
      '/friends': 'http://localhost:3000',
      '/groups': 'http://localhost:3000',
      '/user-groups': 'http://localhost:3000',
      '/user-journeys': 'http://localhost:3000',
      '/steps': 'http://localhost:3000',
      '/ratings': 'http://localhost:3000',
      '/participations': 'http://localhost:3000',
      '/scores': 'http://localhost:3000'
    }
  },
  build: {
    outDir: 'dist'
  }
});
