import { readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'wxt';

const here = dirname(fileURLToPath(import.meta.url));
const iconDir = join(here, '../../../packages/ui/icons/rivaline');
const fontDir = join(here, '../../../packages/report/fonts');

// Manifest: exactly what docs/rivaline-SPEC.md §3 lists. No host_permissions, no content scripts.
// Shortcut Alt+Shift+V: Chrome 157 does not give Alt+Shift+R to extensions (docs/rivaline/PLAN.md).
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  srcDir: '.',
  outDir: '.output',
  zip: { artifactTemplate: 'rivaline-{{version}}.zip' },
  // pdf-lib is one large chunk, loaded only when a report PDF is made.
  vite: () => ({ build: { chunkSizeWarningLimit: 1600 } }),
  manifest: {
    // Store title (max 75): brand first, then what people search for. Toolbar and menus use short_name.
    name: 'Rivaline: Competitor Research for Meta, Google, TikTok Ads & More',
    short_name: 'Rivaline',
    description:
      "See any site's martech stack, open its ads in 4 ad libraries and copy its brand colors and fonts. Free, no account.",
    minimum_chrome_version: '116',
    permissions: ['activeTab', 'scripting', 'storage', 'sidePanel'],
    icons: { 16: 'icon-16.png', 32: 'icon-32.png', 48: 'icon-48.png', 128: 'icon-128.png' },
    action: {
      default_title: 'Rivaline',
      default_icon: { 16: 'icon-16.png', 32: 'icon-32.png', 48: 'icon-48.png' },
    },
    commands: {
      // Fires action.onClicked, so the shortcut also grants activeTab.
      _execute_action: { suggested_key: { default: 'Alt+Shift+V' } },
    },
  },
  hooks: {
    // Icons come from @line/ui (generated from the Rivaline logo tile in Faza 1).
    'build:publicAssets': (_wxt, assets) => {
      for (const file of readdirSync(iconDir).filter((f) => f.endsWith('.png'))) {
        assets.push({ absoluteSrc: join(iconDir, file), relativeDest: file });
      }
      // Fonts for the report PDF (embedded by pdf-lib, loaded from the extension itself).
      for (const file of readdirSync(fontDir).filter(
        (f) => f.endsWith('.ttf') || f === 'OFL.txt',
      )) {
        assets.push({ absoluteSrc: join(fontDir, file), relativeDest: `fonts/${file}` });
      }
    },
  },
});
