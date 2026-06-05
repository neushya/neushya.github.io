import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  base: "/", 
  plugins: [
    react(), 
    tailwindcss(),
    VitePWA({
      // 강력한 캐시 파괴를 위해 기존 서비스 워커를 자폭(Self-destroy)시킴
      selfDestroying: true,
      registerType: 'autoUpdate',
      workbox: {
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
      },
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'Zenito Markdown',
        short_name: 'ZenitoMD',
        description: 'Professional Markdown Editor for Web',
        theme_color: '#1e1e1e',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  server: {
    port: 3001,
    strictPort: false,
  },
});
