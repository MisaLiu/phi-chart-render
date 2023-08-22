import config from './package.json';
import { defineConfig } from 'vite';
import { createHtmlPlugin } from 'vite-plugin-html';
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
  }
});


