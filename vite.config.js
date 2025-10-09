import { sentryVitePlugin } from "@sentry/vite-plugin";
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), sentryVitePlugin({
    org: "polotno",
    project: "polotno-studio"
  })],

  build: {
    sourcemap: true
  },

  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: [
      'snippetly.ro',
      'www.snippetly.ro',
      'localhost',
      '127.0.0.1',
      '79.137.67.72'
    ],
    proxy: {
      '/api': {
        target: 'http://79.137.67.72:8000',
        changeOrigin: true,
        secure: false
      },
      '/webhook-test': {
        target: 'http://79.137.67.72:5678',
        changeOrigin: true,
        secure: false,
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('Webhook proxy error:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('Webhook proxy request to:', proxyReq.getHeader('host'), proxyReq.path);
          });
        }
      }
    }
  }
})