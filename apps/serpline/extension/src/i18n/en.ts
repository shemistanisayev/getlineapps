/**
 * English source copy (from design/serpline). Every UI string lives here; az.ts has the same keys.
 * {name} holes are filled with fill(). Tool, bot, tag and file names are never translated.
 */
export const en = {
  'panel.sections': 'Serpline sections',
  'panel.pdf': 'Audit PDF',
  'panel.settings': 'Settings',
  'tab.summary': 'Summary',
  'tab.headings': 'Headings',
  'tab.links': 'Links',
  'tab.render': 'Render',
  'tab.ai': 'AI',
  'tab.issue': '{n} issue',
  'tab.issues': '{n} issues',
  'cta.help': 'Need help fixing these?',
  'cta.audit': 'Want a full technical SEO audit?',
  'cta.render': 'Want server-side rendering set up for SEO?',
  'cta.ai': 'Want your site to show up in AI answers?',
  'cta.contact': 'Get in touch',
  'panel.checking': 'Reading this page...',
  'panel.checkAgain': 'Check again',
  'panel.idle.title': 'Check a page',
  'panel.idle.text': 'Serpline reads a page only when you ask.',
  'panel.stale.title': 'You opened a new page',
  'panel.stale.text':
    'Serpline reads a page only when you ask, so the results below belong to the previous page.',
  'panel.checkThis': 'Check this page',
  'panel.shortcut.before': 'Or press',
  'panel.shortcut.after': 'on any page',
  'panel.noAccess':
    'Click the Serpline icon in the toolbar, or press Alt+Shift+S, to let Serpline read this page.',
  'panel.restricted.title': "Serpline can't read this page",
  'panel.restricted.text':
    'Chrome does not let extensions read its own pages, the Web Store or PDF files. Open a website and try again.',
  'panel.previous': 'Previous result',
  'panel.read.title': 'Page read',
  'panel.read.rawHtml': 'Raw HTML',
  'panel.read.score': 'Score (core preview)',
  'panel.read.scoreValue': '{score}/100, {high} high, {medium} medium, {low} low',
  'panel.read.robots': 'robots.txt',
  'panel.read.llms': 'llms.txt',
  'panel.read.status': 'HTTP {status}, {size}',
  'panel.read.failed': 'Request failed',
  'panel.read.lines': 'HTTP {status}, {n} lines',
  'panel.read.note': 'Read in your browser. Nothing was sent anywhere.',
  'welcome.title': 'Serpline is ready.',
  'welcome.accent': 'See what Google and AI see.',
  'welcome.lead':
    'Open any page and Serpline shows the SEO basics, the content that needs JavaScript and which AI crawlers are allowed in.',
  'welcome.free': 'Free',
  'welcome.noAccount': 'No account',
  'welcome.local': 'Nothing leaves your browser',
  'welcome.s1.title': 'Pin Serpline to the toolbar',
  'welcome.s1.text': 'Click the puzzle icon next to the address bar and pin Serpline.',
  'welcome.s2.title': 'Open a page, click the icon',
  'welcome.s2.text': 'The side panel opens with the score, the checks and a Google preview.',
  'welcome.s3.title': 'Open the Render and AI tabs',
  'welcome.s3.text':
    'See what needs JavaScript and which AI bots can read the page. Next time press {key}.',
  'welcome.built': 'Built by Shamistan Isayev',
  'welcome.contact': 'Need a technical SEO audit? Get in touch',
} as const;

export type MessageKey = keyof typeof en;
export type Dictionary = Record<MessageKey, string>;
