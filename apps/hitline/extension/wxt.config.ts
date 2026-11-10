import { readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'wxt';

const here = dirname(fileURLToPath(import.meta.url));
const iconDir = join(here, '../../../packages/ui/icons/hitline');

// Manifest: exactly what docs/hitline-SPEC.md §3 lists. No host_permissions, no network.
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  srcDir: '.',
  outDir: '.output',
  manifest: {
    name: 'Hitline',
    description:
      'See every GA4, Google Ads, Meta and TikTok event, spot server-side GTM and catch consent leaks in DevTools.',
    permissions: ['activeTab', 'scripting', 'storage'],
    icons: { 16: 'icon-16.png', 32: 'icon-32.png', 48: 'icon-48.png', 128: 'icon-128.png' },
    action: {
      default_title: 'Hitline',
      default_icon: { 16: 'icon-16.png', 32: 'icon-32.png', 48: 'icon-48.png' },
    },
  },
  hooks: {
    // Icons come from @line/ui (generated from the Hitline logo tile in Faza 1).
    'build:publicAssets': (_wxt, assets) => {
      for (const file of readdirSync(iconDir).filter((f) => f.endsWith('.png'))) {
        assets.push({ absoluteSrc: join(iconDir, file), relativeDest: file });
      }
    },
  },
});
