import type { ContrastPair } from '../serpline/contrast.ts';

/**
 * Every text/background pair the Rivaline panel uses (design/rivaline). The preview page shows
 * them and rivaline.test.tsx keeps them at WCAG AA (4.5:1 for text). Translucent colors are given
 * as their mix on the background they sit on.
 */
export const RIVALINE_CONTRAST: ContrastPair[] = [
  { label: 'Report PDF button', fg: '#FFFFFF', bg: '#0E7490' },
  { label: 'Report PDF disabled', fg: '#475467', bg: '#EAE8F0' },
  { label: 'Active tab', fg: '#164E63', bg: '#FFFFFF' },
  { label: 'Inactive tab', fg: '#475467', bg: '#FFFFFF' },
  { label: 'Active tab badge', fg: '#FFFFFF', bg: '#0E7490' },
  { label: 'Tab badge', fg: '#475467', bg: '#EEEDF3' },
  { label: 'Eyebrow', fg: '#667085', bg: '#FFFFFF' },
  { label: 'Hero text (gradient start)', fg: '#FFFFFF', bg: '#0E7490' },
  // rgba(255,255,255,.08) on #0E7490 (the design's .18 is 3.8:1)
  { label: 'Hero "+N" tile', fg: '#FFFFFF', bg: '#217F99' },
  { label: 'Gap strip count', fg: '#B54708', bg: '#FFFAEB' },
  { label: 'Gap strip list', fg: '#93370D', bg: '#FFFAEB' },
  { label: 'Chip', fg: '#344054', bg: '#FFFFFF' },
  { label: 'Chip count', fg: '#667085', bg: '#FFFFFF' },
  { label: 'Chip on', fg: '#FFFFFF', bg: '#101828' },
  { label: 'Chip on count', fg: '#D0D5DD', bg: '#101828' },
  { label: 'Tool ID', fg: '#667085', bg: '#FFFFFF' },
  { label: 'Open tool ID', fg: '#475467', bg: '#ECFEFF' },
  { label: 'Evidence kind', fg: '#475467', bg: '#EEEDF3' },
  { label: 'Evidence value', fg: '#344054', bg: '#ECFEFF' },
  { label: 'Not found eyebrow', fg: '#B54708', bg: '#FFFFFF' },
  { label: 'Gap text', fg: '#475467', bg: '#FFFFFF' },
  { label: 'Lime CTA text', fg: '#1A2E05', bg: '#C6F36B' },
  { label: 'Dark button on lime', fg: '#FFFFFF', bg: '#101828' },
  { label: 'Library description', fg: '#475467', bg: '#FFFFFF' },
  { label: 'Open button icon', fg: '#155E75', bg: '#FFFFFF' },
  { label: 'Search pill', fg: '#344054', bg: '#F7F6FB' },
  { label: 'Swatch HEX', fg: '#475467', bg: '#FFFFFF' },
  { label: 'Segmented (off)', fg: '#475467', bg: '#EEEDF3' },
  { label: 'Code key', fg: '#155E75', bg: '#F7F6FB' },
  { label: 'Code text', fg: '#344054', bg: '#F7F6FB' },
  { label: 'Toast', fg: '#FFFFFF', bg: '#101828' },
  { label: 'Field label', fg: '#344054', bg: '#FFFFFF' },
];
