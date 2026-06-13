import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/icon-192.png', 'icons/icon-512.png'],
      manifest: {
        name: 'Grammercy Compliance Dashboard',
        short_name: 'Grammercy',
        description: 'Compliance Management System by Kesari Infrabuild Pvt. Ltd.',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            // Never cache auth/session, realtime, or storage responses — caching
            // identity/session payloads is a credential-hygiene problem and can
            // serve a stale session (audit H5).
            urlPattern: /^https:\/\/.*\.supabase\.co\/(auth|realtime|storage)\/.*/i,
            handler: 'NetworkOnly',
          },
          {
            // Cache only successful REST reads. The cache is cleared on sign-out
            // (see AuthContext.signOut) so one user's data is not served to the
            // next user on a shared device (audit H4).
            urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/.*/i,
            handler: 'NetworkFirst',
            method: 'GET',
            options: {
              cacheName: 'supabase-cache',
              cacheableResponse: { statuses: [200] },
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60,
              },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: (id: string) => {
          if (id.includes('node_modules')) {
            if (id.includes('@supabase')) return 'supabase'
            if (id.includes('recharts')) return 'charts'
            if (id.includes('react')) return 'vendor'
          }
        },
      },
    },
  },
})
