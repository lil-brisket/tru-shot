import { createHash } from 'node:crypto';
import { readdirSync } from 'node:fs';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';
import { buildServiceWorker, precacheList } from './src/offline/serviceWorker';

function offlineCache(): Plugin {
  let publicDir = '';
  return {
    name: 'true-shot-offline-cache',
    apply: 'build',
    enforce: 'post',
    configResolved(config) {
      publicDir = config.publicDir;
    },
    generateBundle(_options, bundle) {
      const files = precacheList(Object.keys(bundle), readdirSync(publicDir));
      const version = createHash('sha256').update(files.join('\n')).digest('hex').slice(0, 12);
      this.emitFile({
        type: 'asset',
        fileName: 'sw.js',
        source: buildServiceWorker(files, version),
      });
    },
  };
}

export default defineConfig({ plugins: [react(), offlineCache()] });
