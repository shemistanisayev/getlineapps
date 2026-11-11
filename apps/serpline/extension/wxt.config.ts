import { readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'wxt';

const here = dirname(fileURLToPath(import.meta.url));
const iconDir = join(here, '../../../packages/ui/icons/serpline');
const fontDir = join(here, '../../../packages/report/fonts');

// Manifest: exactly what docs/serpline-SPEC.md §3 lists. No host_permissions, no content scripts.
// Site access is optional and asked for one site at a time (docs/serpline/PLAN.md, spike).
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  srcDir: '.',
  outDir: '.output',
  zip: { artifactTemplate: 'serpline-{{version}}.zip' },
  // pdf-lib is one large chunk, loaded only when an audit PDF is made.
  vite: () => ({ build: { chunkSizeWarningLimit: 1600 } }),
  manifest: {
    // Store title (max 75): brand first, then what people search for. Toolbar and menus use short_name.
    name: 'Serpline: SEO Checker & AI Crawler Audit for Google, ChatGPT & More',
    short_name: 'Serpline',
    description:
      "Technical SEO, JavaScript render and AI crawler checks for the page you're on. Free, no data collected.",
    permissions: ['activeTab', 'scripting', 'sidePanel', 'storage'],
    optional_host_permissions: ['https://*/*', 'http://*/*'],
    icons: { 16: 'icon-16.png', 32: 'icon-32.png', 48: 'icon-48.png', 128: 'icon-128.png' },
    action: {
      default_title: 'Serpline',
      default_icon: { 16: 'icon-16.png', 32: 'icon-32.png', 48: 'icon-48.png' },
    },
    commands: {
      // Fires action.onClicked, so the shortcut also grants activeTab.
      _execute_action: { suggested_key: { default: 'Alt+Shift+S' } },
    },
  },
  hooks: {
    // Icons come from @line/ui (generated from the Serpline logo tile in Faza 1).
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
