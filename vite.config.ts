/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icone.svg'],
      manifest: {
        name: 'Controle de Estoque',
        short_name: 'Estoque',
        description: 'Controle de estoque simples para pequenos comércios.',
        lang: 'pt-BR',
        display: 'standalone',
        start_url: '.',
        background_color: '#e5e5e5',
        theme_color: '#e5e5e5',
        icons: [
          { src: 'icone-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: 'icone-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: 'src/setupTestes.ts',
  },
});
