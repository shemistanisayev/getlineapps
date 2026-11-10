// Extension icons 16, 32, 48, 128 from each tool's logo tile (light theme), plus the hub tile.
// Output is committed: icons/<slug>/icon-<size>.png and icons/<slug>/icon.svg.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';
import { createServer } from 'vite';

const here = dirname(fileURLToPath(import.meta.url));
// Load the TypeScript brand module through Vite so the SVG comes from the same source as the UI.
const server = await createServer({
  root: join(here, '..'),
  logLevel: 'error',
  server: { middlewareMode: true },
});
const brand = await server.ssrLoadModule('/src/brand.ts');
await server.close();

const SIZES = [16, 32, 48, 128];
const render = (svg, size) =>
  new Resvg(svg, { fitTo: { mode: 'width', value: size } }).render().asPng();

for (const slug of [...brand.HUB_ORDER, 'hub']) {
  const dir = join(here, '..', 'icons', slug);
  mkdirSync(dir, { recursive: true });
  // Draw at 128 and scale down, so small sizes keep the logo proportions.
  const svg = slug === 'hub' ? brand.hubLogoTileSvg(128) : brand.logoTileSvg(slug, 128);
  writeFileSync(join(dir, 'icon.svg'), svg + '\n');
  for (const size of SIZES) writeFileSync(join(dir, `icon-${size}.png`), render(svg, size));
}
console.log('icons written');
