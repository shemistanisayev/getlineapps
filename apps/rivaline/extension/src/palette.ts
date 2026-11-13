/**
 * PNG palette export (docs/rivaline-SPEC.md §6): 1200 x 400, one swatch per color with its role
 * and HEX, made with OffscreenCanvas in the panel. Nothing leaves the browser.
 */
import type { BrandColor } from '@line/core/rivaline';

export const PALETTE_W = 1200;
export const PALETTE_H = 400;

/** Dark or light text, whichever reads better on the swatch. */
function inkOn(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [n >> 16, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return lum > 0.4 ? '#101828' : '#FFFFFF';
}

export async function palettePng(
  colors: BrandColor[],
  roleLabel: (role: BrandColor['role']) => string,
  title: string,
): Promise<Blob> {
  const canvas = new OffscreenCanvas(PALETTE_W, PALETTE_H);
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, PALETTE_W, PALETTE_H);
  const pad = 40;
  ctx.fillStyle = '#101828';
  ctx.font = '700 28px "Plus Jakarta Sans", Inter, Arial, sans-serif';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(title, pad, 64);
  const n = Math.max(colors.length, 1);
  const gap = 16;
  const w = (PALETTE_W - 2 * pad - (n - 1) * gap) / n;
  const top = 96;
  const h = PALETTE_H - top - pad;
  colors.forEach((c, i) => {
    const x = pad + i * (w + gap);
    ctx.fillStyle = c.hex;
    ctx.beginPath();
    ctx.roundRect(x, top, w, h, 18);
    ctx.fill();
    ctx.strokeStyle = 'rgba(16,24,40,0.1)';
    ctx.lineWidth = 2;
    ctx.stroke();
    const ink = inkOn(c.hex);
    ctx.fillStyle = ink;
    ctx.font = '600 22px Inter, Arial, sans-serif';
    ctx.fillText(roleLabel(c.role), x + 20, top + h - 52);
    ctx.font = '500 20px "JetBrains Mono", ui-monospace, monospace';
    ctx.fillText(c.hex, x + 20, top + h - 22);
  });
  return canvas.convertToBlob({ type: 'image/png' });
}

/** Saves a blob through a temporary link (no `downloads` permission). */
export function downloadBlob(blob: Blob, file: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = file;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
