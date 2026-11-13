/**
 * English source copy (from design/rivaline). Every UI string lives here; az.ts has the same keys.
 * {name} holes are filled with fill(). Tool and platform names are never translated.
 */
export const en = {
  'list.and': 'and',
  'panel.reading': 'Reading this page...',
  'panel.readAgain': 'Read the page again',
  'panel.idle.title': 'Read a site',
  'panel.idle.text': 'Rivaline reads a page only after you ask it to.',
  'panel.access.title': 'Read this tab?',
  'panel.access.text': 'You switched tabs. Rivaline reads a page only after you ask it to.',
  'panel.access.icon': 'Click the Rivaline icon in the toolbar',
  'panel.access.keys': 'Or press',
  'panel.access.noKeys': 'Or set a keyboard shortcut in Settings',
  'panel.access.note':
    "This is how Chrome's activeTab permission works. Rivaline never gets access to all the sites you visit.",
  'panel.restricted.title': "Rivaline can't read this page",
  'panel.restricted.text':
    'Chrome keeps its own pages closed to extensions. Open any website and click the Rivaline icon.',
  'panel.restricted.worksOn': 'Works on',
  'panel.restricted.web': 'Any website on http or https',
  'panel.restricted.notOn': "Doesn't work on",
  'panel.restricted.chrome': 'Chrome pages like chrome://extensions',
  'panel.restricted.store': 'The Chrome Web Store',
  'panel.restricted.extensions': 'Pages of other extensions',
  'panel.restricted.pdf': 'PDF files opened in Chrome',
  'panel.read.title': 'Page read',
  'panel.read.page': 'Page',
  'panel.read.scripts': 'Scripts',
  'panel.read.requests': 'Requests',
  'panel.read.state': 'Loading',
  'panel.read.loaded': 'Finished',
  'panel.read.loading': 'Still loading',
  'panel.read.note': 'Stack, Ads and Brand come next. Nothing left your browser.',
  'welcome.title': 'Rivaline is ready.',
  'welcome.accent': 'Any site, one click.',
  'welcome.lead':
    'Three steps and you will see what a site runs, where it advertises and how its brand looks.',
  'welcome.free': 'Free',
  'welcome.noAccount': 'No account',
  'welcome.local': 'Nothing leaves your browser',
  'welcome.s1.title': 'Pin Rivaline to the toolbar',
  'welcome.s1.text': 'Click the puzzle icon next to the address bar and pin Rivaline.',
  'welcome.s2.title': 'Open a site, click the icon',
  'welcome.s2.text': 'The side panel opens next to the page. Or press',
  'welcome.s2.noKeys': 'The side panel opens next to the page.',
  'welcome.s3.title': 'Switch between Stack, Ads and Brand',
  'welcome.s3.text': 'Then download everything as one competitor report PDF.',
  'welcome.built': 'Built by Shamistan Isayev',
  'welcome.contact': 'Need a martech audit? Get in touch',
} as const;

export type MessageKey = keyof typeof en;
export type Dictionary = Record<MessageKey, string>;
