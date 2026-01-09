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
      '/users': 'http://localhost:10000',
      '/journeys': 'http://localhost:10000',
      '/friends': 'http://localhost:10000',
      '/groups': 'http://localhost:10000',
      '/user-groups': 'http://localhost:10000',
      '/user-journeys': 'http://localhost:10000',
      '/steps': 'http://localhost:10000',
      '/ratings': 'http://localhost:10000',
      '/participations': 'http://localhost:10000',
      '/scores': 'http://localhost:10000'
    }
  },
  build: {
    outDir: 'dist'
  }
});
