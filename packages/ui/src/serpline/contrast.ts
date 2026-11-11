/**
 * Every text/background pair the Serpline panel uses (design/serpline). The preview page shows
 * them and serpline.test.ts keeps them at WCAG AA (4.5:1 for text). Translucent colors are given
 * as their mix on the background they sit on.
 */
export interface ContrastPair {
  label: string;
  fg: string;
  bg: string;
}

export const SERPLINE_CONTRAST: ContrastPair[] = [
  { label: 'Audit PDF button', fg: '#FFFFFF', bg: '#2563EB' },
  { label: 'Active tab', fg: '#1E40AF', bg: '#FFFFFF' },
  { label: 'Inactive tab', fg: '#475467', bg: '#FFFFFF' },
  { label: 'Issue badge', fg: '#B42318', bg: '#FEF3F2' },
  { label: 'Active tab badge', fg: '#FFFFFF', bg: '#2563EB' },
  { label: 'Path in page row', fg: '#667085', bg: '#FFFFFF' },
  { label: 'Eyebrow', fg: '#667085', bg: '#FFFFFF' },
  { label: 'Hero text (gradient start)', fg: '#FFFFFF', bg: '#2563EB' },
  // rgba(255,255,255,.92) on #2563EB (the design's .88 is 4.37:1)
  { label: 'Hero soft text', fg: '#EEF3FD', bg: '#2563EB' },
  { label: 'Level chip H1', fg: '#FFFFFF', bg: '#2563EB' },
  { label: 'Level chip H2', fg: '#1E40AF', bg: '#DBEAFE' },
  { label: 'Level chip H3', fg: '#1D4ED8', bg: '#EFF6FF' },
  { label: 'Level chip H4', fg: '#1D4ED8', bg: '#FFFFFF' },
  { label: 'Count tile label', fg: '#475467', bg: '#F7F6FB' },
  { label: 'Problem tile', fg: '#B42318', bg: '#FEF3F2' },
  { label: 'Segmented (off)', fg: '#475467', bg: '#EEEDF3' },
  { label: 'Blocked robots line', fg: '#B42318', bg: '#FFFBFA' },
  { label: 'Bot "shown as"', fg: '#667085', bg: '#FFFFFF' },
  { label: 'CC badge', fg: '#344054', bg: '#EEEDF3' },
  { label: 'Dark footer text', fg: '#D0D5DD', bg: '#101828' },
  { label: 'Lime button', fg: '#1A2E05', bg: '#C6F36B' },
  { label: 'Dark button on lime', fg: '#FFFFFF', bg: '#101828' },
  { label: 'Google title', fg: '#1A0DAB', bg: '#FFFFFF' },
  { label: 'Google URL and snippet', fg: '#4D5156', bg: '#FFFFFF' },
];
