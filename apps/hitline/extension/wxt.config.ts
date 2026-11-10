import { readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'wxt';

const here = dirname(fileURLToPath(import.meta.url));
const iconDir = join(here, '../../../packages/ui/icons/hitline');
const fontDir = join(here, '../../../packages/report/fonts');

// Manifest: exactly what docs/hitline-SPEC.md §3 lists. No host_permissions, no network.
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  srcDir: '.',
  outDir: '.output',
  // Store upload: .output/hitline-<version>.zip (copied to store/hitline by the store script).
  zip: { artifactTemplate: 'hitline-{{version}}.zip' },
  // pdf-lib is one large chunk, loaded only when an audit PDF is made.
  vite: () => ({ build: { chunkSizeWarningLimit: 1600 } }),
  manifest: {
    // Store title (max 75): brand first, then what people search for. Toolbar and menus use short_name.
    name: 'Hitline: Tracking Debugger for GA4, Meta, TikTok & More',
    short_name: 'Hitline',
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
      // Fonts for the audit PDF (embedded by pdf-lib, loaded from the extension itself).
      for (const file of readdirSync(fontDir).filter(
        (f) => f.endsWith('.ttf') || f === 'OFL.txt',
      )) {
        assets.push({ absoluteSrc: join(fontDir, file), relativeDest: `fonts/${file}` });
      }
    },
  },
});
