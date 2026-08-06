import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

const BRAND_THEME_COLOR = '#401E13'
const BRAND_BACKGROUND_COLOR = '#FDF8F3'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.svg',
        'favicon-16x16.png',
        'favicon-32x32.png',
        'apple-touch-icon.png',
        'pwa-192x192.png',
        'pwa-512x512.png',
        'brand/nannai-brand-full.webp',
        'brand/nannai-brand-full.png',
        'brand/nannai-icon.webp',
        'icons/icon-16.png',
        'icons/icon-32.png',
        'icons/icon-64.png',
        'icons/icon-180.png',
        'icons/icon-192.png',
        'icons/icon-256.png',
        'icons/icon-512.png',
      ],
      manifest: {
        name: 'NANNAI — Food Operations Management System',
        short_name: 'NANNAI',
        description:
          'Sistema de Gestão Operacional para Alimentos & Bebidas — Confeitaria e Padaria',
        lang: 'pt-BR',
        start_url: '/?v=1.7.0',
        scope: '/',
        id: '/?v=1.7.0',
        display: 'standalone',
        orientation: 'portrait-primary',
        theme_color: BRAND_THEME_COLOR,
        background_color: BRAND_BACKGROUND_COLOR,
        categories: ['business', 'productivity'],
        icons: [
          { src: '/icons/icon-16.png', sizes: '16x16', type: 'image/png' },
          { src: '/icons/icon-32.png', sizes: '32x32', type: 'image/png' },
          { src: '/icons/icon-64.png', sizes: '64x64', type: 'image/png' },
          { src: '/icons/icon-180.png', sizes: '180x180', type: 'image/png' },
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-256.png', sizes: '256x256', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff2,docx,xlsx}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'nannai-pages',
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 8, maxAgeSeconds: 60 * 60 * 24 },
            },
          },
          {
            urlPattern: /\/documents\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'nannai-documents',
              networkTimeoutSeconds: 10,
              expiration: { maxEntries: 32, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          {
            urlPattern: /\/api\/uploads\//,
            handler: 'NetworkOnly',
          },
          {
            urlPattern: /\/api\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'nannai-api-cache',
              networkTimeoutSeconds: 8,
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 5 },
            },
          },
        ],
      },
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/framer-motion')) {
            return 'vendor-motion'
          }
          if (id.includes('node_modules/recharts')) {
            return 'vendor-charts'
          }
          if (id.includes('node_modules/@tanstack/react-query')) {
            return 'vendor-query'
          }
          if (id.includes('node_modules/xlsx')) {
            return 'xlsx'
          }
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3333',
        changeOrigin: true,
      },
    },
  },
})
