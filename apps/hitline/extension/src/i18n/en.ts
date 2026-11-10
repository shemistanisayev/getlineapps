/** English source copy (from design/hitline). Every UI string lives here; az.ts has the same keys. */
export const en = {
  'popup.settings': 'Settings',
  'popup.f12Hint': 'Full analysis in DevTools: press F12, open the Hitline tab',
  'panel.tabsLabel': 'Hitline sections',
  'panel.tab.events': 'Events',
  'panel.tab.gtm': 'GTM',
  'panel.tab.consent': 'Consent',
  'panel.tab.attribution': 'Attribution',
  'panel.tab.plan': 'Plan',
  'panel.recording': 'Recording',
  'panel.clear': 'Clear',
  'panel.auditPdf': 'Audit PDF',
  'panel.empty.title': 'Reload the page to start recording',
  'panel.empty.text':
    'Hitline records tracking requests while DevTools is open. Reload once to catch everything the page sends on load, including page_view and consent defaults.',
  'panel.empty.reload': 'Reload page',
  'welcome.title': 'Hitline is ready. Every hit, in plain sight.',
  'welcome.lead':
    'Three steps and you will see every event your site sends, where it goes and whether it respects consent.',
} as const;

export type MessageKey = keyof typeof en;
export type Dictionary = Record<MessageKey, string>;
