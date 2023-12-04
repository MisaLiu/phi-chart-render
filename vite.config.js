import config from './package.json';
import { defineConfig } from 'vite';
import { createHtmlPlugin } from 'vite-plugin-html';
import { VitePWA } from 'vite-plugin-pwa';
import git from 'git-rev-sync';
import path from 'path';

const CurrentVersion = 'v' + config.version + '-' + git.short();

// https://vitejs.dev/config/
export default defineConfig({
  base: '/phi-chart-render/',
  plugins: [
    createHtmlPlugin({
      inject: {
        data: {
          GIT_VERSION: CurrentVersion
        }
      }
    }),
    VitePWA({
      injectRegister: 'auto',
      registerType: 'autoUpdate',
      workbox: {
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: /\/phi-chart-render(.*?)\.(png|ogg|ico|ttf)/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'assets-cache',
            },
          }
        ],
      },
      minify: true,
      manifest: {
        id: 'misaliu-phi-chart-render',
        name: 'phi-chart-render',
        short_name: 'phi-chart-render',
        description: 'A Phigros chart render based on Pixi.js',
        scope: '/phi-chart-render/',
        display: 'standalone',
        orientation: 'landscape',
        background_color: '#000000',
        includeAssets: [ './icons/favicon.ico' ],
        icons: [
          {
            src: './icons/64.png',
            sizes: '64x64',
            type: 'image/png'
          },
          {
            src: './icons/192.png',
            sizes: '192x192',
            type: 'image/png'
          }
        ]
      }
    }),
  ],
  define: {
    GIT_VERSION: JSON.stringify(CurrentVersion)
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    host: '0.0.0.0',
    port: 9000,
    open: true
  },
  build: {
    sourcemap: true
  }
});


