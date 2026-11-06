import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [],
      manifest: {
        name: 'PickleCity Tournament Manager',
        short_name: 'PickleCity',
        description: 'Tournament management and live scoring for PickleCity.',
        theme_color: '#101827',
        background_color: '#f4f6f8',
        display: 'standalone',
        start_url: '/',
        icons: []
      }
    })
  ]
})