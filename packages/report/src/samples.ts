import { contactUrl } from '@line/core/site';
import type { LineReportConfig, ReportFonts } from './types.ts';

/**
 * Demo content from design/hitline/Report.dc.html and design/rivaline/Report.dc.html.
 * Used by the snapshot tests and `pnpm --filter @line/report sample`. example.com and Kova are fictional.
 */
export function hitlineSample(fonts: ReportFonts): LineReportConfig {
  return {
    tool: 'hitline',
    fonts,
    date: new Date(2026, 10, 6, 10, 43),
    dateLabel: 'Nov 6, 2026, 10:43',
    fileStem: 'hitline-audit',
    eyebrow: 'Tracking audit',
    host: 'example.com',
    subline: 'Pages checked: product, cart, payment, order confirmation',
    tiles: [
      { value: 4, label: 'platforms' },
      { value: 14, label: 'events' },
      { value: 3, label: 'high priority', tone: 'high' },
      { value: 3, label: 'medium priority', tone: 'medium' },
    ],
    keyValue: {
      type: 'kv',
      title: 'Setup',
      rows: [
        { k: 'GTM', v: 'GTM-K7P2QX, 24 tags' },
        { k: 'Server-side', v: 'GA4 through data.example.com, Meta and TikTok from the browser' },
        { k: 'Consent Mode v2', v: 'Correct on Google tags, missing on Meta and TikTok' },
        { k: 'Tracking plan', v: '4 of 8 events match' },
      ],
    },
    severity: {
      type: 'severity',
      title: 'Issues and fixes',
      items: [
        {
          level: 'high',
          lead: 'Meta Pixel fires before consent.',
          text: 'Add an ad_storage consent check in GTM.',
        },
        {
          level: 'high',
          lead: 'TikTok Pixel fires after rejection.',
          text: 'The TikTok tag needs the same consent check.',
        },
        {
          level: 'high',
          lead: 'Sales are credited to the payment site.',
          text: 'Add pay.example.net to “Unwanted referrals” in GA4.',
        },
        {
          level: 'medium',
          lead: 'Meta AddToCart has no value or currency.',
          text: 'Pass value and currency from the dataLayer to the tag.',
        },
        {
          level: 'medium',
          lead: 'generate_lead and begin_checkout never arrive.',
          text: 'The form and the checkout button have no trigger.',
        },
        {
          level: 'medium',
          lead: 'sign_up has an empty method.',
          text: 'Write the sign-up method to the dataLayer.',
        },
      ],
    },
    cta: {
      title: 'Need help fixing these issues?',
      sub: 'Shamistan Isayev, analytics and server-side tracking',
      label: 'shamistanisayev.com',
      href: contactUrl({ source: 'hitline', medium: 'extension', campaign: 'pdf_footer' }),
    },
  };
}

export function rivalineSample(fonts: ReportFonts): LineReportConfig {
  return {
    tool: 'rivaline',
    fonts,
    date: new Date(2026, 10, 7, 11, 52),
    dateLabel: 'Nov 7, 2026, 11:52',
    fileStem: 'rivaline-report',
    eyebrow: 'Competitor report',
    host: 'example.com',
    subline: 'Page read: home page. Brand name used for ad searches: Kova',
    tiles: [
      { value: 13, label: 'tools' },
      { value: 8, label: 'categories' },
      { value: 4, label: 'ad pixels' },
      { value: 3, label: 'gaps', tone: 'warning' },
    ],
    keyValue: {
      type: 'kv',
      title: 'Stack',
      rows: [
        {
          k: 'Advertising',
          v: 'Meta Pixel, TikTok Pixel, Google Ads (AW-11284956), Pinterest Tag',
        },
        { k: 'Analytics', v: 'Google Analytics 4 (G-8XK2LM4QPZ), Hotjar' },
        { k: 'Tag management', v: 'Google Tag Manager (GTM-N4KV8R)' },
        { k: 'Email', v: 'Mailchimp' },
        { k: 'Chat', v: 'Intercom' },
        { k: 'E-commerce', v: 'Shopify' },
        { k: 'Reviews', v: 'Trustpilot' },
        { k: 'Payments', v: 'Klarna, PayPal' },
      ],
    },
    severity: {
      type: 'severity',
      title: 'Gaps and opportunities',
      items: [
        {
          level: 'high',
          lead: 'No server-side tracking.',
          text: 'All 4 ad pixels send from the browser, so blocked requests never reach the ad platforms.',
        },
        {
          level: 'high',
          lead: 'No consent banner.',
          text: 'Ad pixels load for every visitor before any choice is made.',
        },
        {
          level: 'medium',
          lead: 'No CRM on the site.',
          text: 'Mailchimp collects emails, but chat and quiz leads are not tied to one customer record.',
        },
      ],
    },
    extras: [
      {
        type: 'columns',
        columns: [
          {
            type: 'swatches',
            title: 'Brand kit',
            colors: ['#2F5D46', '#1E2B24', '#F6F1EA', '#EBC56B', '#DCE5D8'],
            note: 'Fraunces 600 for headings, DM Sans 400 for body. Main button #2F5D46, fully rounded.',
          },
          {
            type: 'links',
            title: 'Ad libraries',
            rows: [
              {
                label: 'Meta Ad Library',
                linkText: 'Kova',
                href: 'https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=ALL&q=Kova',
              },
              {
                label: 'Google Ads Transparency Center',
                linkText: 'example.com',
                href: 'https://adstransparency.google.com/?domain=example.com',
              },
              {
                label: 'TikTok Ad Library',
                linkText: 'Kova',
                href: 'https://library.tiktok.com/ads?query=Kova',
              },
              {
                label: 'LinkedIn Ad Library',
                linkText: 'Kova',
                href: 'https://www.linkedin.com/ad-library/search?keyword=Kova',
              },
            ],
          },
        ],
      },
    ],
    cta: {
      title: 'Need help closing gaps like these?',
      sub: 'Shamistan Isayev, analytics and server-side tracking',
      label: 'shamistanisayev.com',
      href: contactUrl({ source: 'rivaline', medium: 'extension', campaign: 'pdf_footer' }),
    },
  };
}
