/**
 * Store screenshot captions and promo tile copy per Chrome Web Store language.
 * English goes to store/<tool>/, every other language to store/<tool>/locales/<code>/.
 * Chrome has no Azerbaijani locale, so there is no AZ listing (docs/<tool>/STORE-LISTING-LOCALES.md).
 * pt covers both pt_BR and pt_PT.
 */
import { Resvg } from '@resvg/resvg-js';

export const STORE_LANGS = ['en', 'tr', 'ru', 'ro', 'uk', 'pt', 'nl', 'es', 'fr'] as const;
export type StoreLang = (typeof STORE_LANGS)[number];

export interface PromoCopy {
  /** Headline: line 1, then the accent words and the rest on line 2. */
  line1: string;
  accent: string;
  rest: string;
  /** Small tile subline. */
  small: string;
  /** Marquee sublines. */
  sub1: string;
  sub2: string;
}

export interface HitlineCopy extends PromoCopy {
  captions: [string, string, string, string, string];
  browser: string;
  noValue: string;
}

export interface SerplineCopy extends PromoCopy {
  captions: [string, string, string, string, string];
  score: string;
  issues: string;
  /** Fits, Cut off, JS only, Allowed, Blocked */
  statuses: [string, string, string, string, string];
}

export const HITLINE_COPY: Record<StoreLang, HitlineCopy> = {
  en: {
    captions: [
      'See the tracking setup of any site in one click',
      'Every event from 50 platforms, decoded',
      'Click “Reject all” and see who keeps firing',
      'Find where UTM and gclid get lost',
      'Turn the findings into an audit PDF',
    ],
    line1: 'Is your tracking working?',
    accent: 'Prove it',
    rest: ' in one panel.',
    small: '50 platforms, GTM and consent',
    sub1: 'Free Chrome extension for GA4, Meta, TikTok and 47 more,',
    sub2: 'GTM, server-side GTM and Consent Mode.',
    browser: 'Browser',
    noValue: 'No value',
  },
  tr: {
    captions: [
      'Her sitenin tracking kurulumunu tek tıkla gör',
      '50 platformdan her event, çözülmüş halde',
      '“Tümünü reddet”e tıkla, kimin hâlâ gönderdiğini gör',
      'UTM ve gclid nerede kayboluyor, bul',
      "Bulguları denetim PDF'ine çevir",
    ],
    line1: "Tracking'in çalışıyor mu?",
    accent: 'Kanıtla,',
    rest: ' tek panelde.',
    small: '50 platform, GTM ve consent',
    sub1: 'GA4, Meta, TikTok ve 47 platform için ücretsiz Chrome eklentisi,',
    sub2: 'GTM, server-side GTM ve Consent Mode.',
    browser: 'Tarayıcı',
    noValue: 'Değer yok',
  },
  ru: {
    captions: [
      'Настройка трекинга любого сайта в один клик',
      'Каждое событие из 50 платформ, расшифровано',
      'Нажмите «Отклонить все» и посмотрите, кто продолжает слать данные',
      'Найдите, где теряются UTM и gclid',
      'Превратите находки в PDF-аудит',
    ],
    line1: 'Ваш трекинг работает?',
    accent: 'Докажите',
    rest: ' в одной панели.',
    small: '50 платформ, GTM и согласие',
    sub1: 'Бесплатное расширение Chrome для GA4, Meta, TikTok и ещё 47,',
    sub2: 'GTM, server-side GTM и Consent Mode.',
    browser: 'Браузер',
    noValue: 'Без ценности',
  },
  ro: {
    captions: [
      'Vezi tracking-ul oricărui site dintr-un clic',
      'Fiecare eveniment din 50 de platforme, decodat',
      'Apasă „Respinge tot” și vezi cine trimite în continuare',
      'Află unde se pierd UTM și gclid',
      'Transformă constatările într-un audit PDF',
    ],
    line1: 'Tracking-ul tău funcționează?',
    accent: 'Dovedește-o',
    rest: ' într-un panou.',
    small: '50 de platforme, GTM și consimțământ',
    sub1: 'Extensie Chrome gratuită pentru GA4, Meta, TikTok și încă 47,',
    sub2: 'GTM, server-side GTM și Consent Mode.',
    browser: 'Browser',
    noValue: 'Fără valoare',
  },
  uk: {
    captions: [
      'Налаштування трекінгу будь-якого сайту в один клік',
      'Кожна подія з 50 платформ, розшифрована',
      'Натисніть «Відхилити все» й побачите, хто далі надсилає дані',
      'Знайдіть, де губляться UTM і gclid',
      'Перетворіть знахідки на PDF-аудит',
    ],
    line1: 'Ваш трекінг працює?',
    accent: 'Доведіть це',
    rest: ' в одній панелі.',
    small: '50 платформ, GTM і згода',
    sub1: 'Безкоштовне розширення Chrome для GA4, Meta, TikTok і ще 47,',
    sub2: 'GTM, server-side GTM і Consent Mode.',
    browser: 'Браузер',
    noValue: 'Без цінності',
  },
  pt: {
    captions: [
      'Veja o tracking de qualquer site em um clique',
      'Cada evento de 50 plataformas, decodificado',
      'Clique em “Rejeitar tudo” e veja quem continua disparando',
      'Descubra onde UTM e gclid se perdem',
      'Transforme os achados em um PDF de auditoria',
    ],
    line1: 'O seu tracking funciona?',
    accent: 'Prove',
    rest: ' em um único painel.',
    small: '50 plataformas, GTM e consentimento',
    sub1: 'Extensão gratuita do Chrome para GA4, Meta, TikTok e mais 47,',
    sub2: 'GTM, server-side GTM e Consent Mode.',
    browser: 'Navegador',
    noValue: 'Sem valor',
  },
  nl: {
    captions: [
      'Zie de tracking van elke site in één klik',
      'Elk event van 50 platforms, gedecodeerd',
      'Klik op “Alles weigeren” en zie wie blijft vuren',
      'Vind waar UTM en gclid verloren gaan',
      'Maak van je bevindingen een audit-PDF',
    ],
    line1: 'Werkt je tracking?',
    accent: 'Bewijs het',
    rest: ' in één paneel.',
    small: '50 platforms, GTM en consent',
    sub1: 'Gratis Chrome-extensie voor GA4, Meta, TikTok en 47 andere,',
    sub2: 'GTM, server-side GTM en Consent Mode.',
    browser: 'Browser',
    noValue: 'Geen waarde',
  },
  es: {
    captions: [
      'Ve el tracking de cualquier sitio en un clic',
      'Cada evento de 50 plataformas, decodificado',
      'Pulsa “Rechazar todo” y mira quién sigue enviando',
      'Encuentra dónde se pierden UTM y gclid',
      'Convierte los hallazgos en un PDF de auditoría',
    ],
    line1: '¿Tu tracking funciona?',
    accent: 'Demuéstralo',
    rest: ' en un solo panel.',
    small: '50 plataformas, GTM y consentimiento',
    sub1: 'Extensión gratis de Chrome para GA4, Meta, TikTok y 47 más,',
    sub2: 'GTM, server-side GTM y Consent Mode.',
    browser: 'Navegador',
    noValue: 'Sin valor',
  },
  fr: {
    captions: [
      "Voyez le tracking de n'importe quel site en un clic",
      'Chaque événement de 50 plateformes, décodé',
      "Cliquez sur « Tout refuser » et voyez qui continue d'envoyer",
      'Trouvez où se perdent UTM et gclid',
      "Transformez les constats en PDF d'audit",
    ],
    line1: 'Votre tracking fonctionne ?',
    accent: 'Prouvez-le',
    rest: ' dans un seul panneau.',
    small: '50 plateformes, GTM et consentement',
    sub1: 'Extension Chrome gratuite pour GA4, Meta, TikTok et 47 autres,',
    sub2: 'GTM, server-side GTM et Consent Mode.',
    browser: 'Navigateur',
    noValue: 'Sans valeur',
  },
};

export const SERPLINE_COPY: Record<StoreLang, SerplineCopy> = {
  en: {
    captions: [
      'SEO checks and a score for the page you are on',
      'See what only shows up after JavaScript',
      'Which AI crawlers can read the site',
      'Core Web Vitals, images and mobile checks',
      'Turn the findings into an audit PDF',
    ],
    line1: 'See your page the way',
    accent: 'Google and AI',
    rest: ' do.',
    small: 'SEO, JavaScript render and AI crawler checks',
    sub1: 'Free Chrome extension: technical SEO, JavaScript rendering',
    sub2: 'and AI crawler access, in one side panel.',
    score: 'SEO score: needs work',
    issues: '2 high, 6 medium, 2 low priority issues',
    statuses: ['Fits', 'Cut off', 'JS only', 'Allowed', 'Blocked'],
  },
  tr: {
    captions: [
      'Açık olan sayfa için SEO kontrolleri ve skor',
      "Yalnızca JavaScript'ten sonra görüneni gör",
      'Hangi AI tarayıcıları siteyi okuyabilir',
      'Core Web Vitals, görseller ve mobil kontroller',
      "Bulguları denetim PDF'ine çevir",
    ],
    line1: 'Sayfanı',
    accent: 'Google ve AI',
    rest: ' gibi gör.',
    small: 'SEO, JavaScript render ve AI tarayıcı kontrolleri',
    sub1: 'Ücretsiz Chrome eklentisi: teknik SEO, JavaScript render',
    sub2: 've AI tarayıcı erişimi, tek bir yan panelde.',
    score: 'SEO skoru: geliştirilmeli',
    issues: '2 yüksek, 6 orta, 2 düşük öncelikli sorun',
    statuses: ['Sığıyor', 'Kesiliyor', 'Sadece JS', 'İzinli', 'Engelli'],
  },
  ru: {
    captions: [
      'SEO-проверки и оценка для открытой страницы',
      'Что появляется только после JavaScript',
      'Какие AI-краулеры могут читать сайт',
      'Core Web Vitals, изображения и мобильные проверки',
      'Превратите находки в PDF-аудит',
    ],
    line1: 'Смотрите на страницу',
    accent: 'глазами Google и ИИ',
    rest: '.',
    small: 'SEO, рендер JavaScript и AI-краулеры',
    sub1: 'Бесплатное расширение Chrome: технический SEO, рендер JavaScript',
    sub2: 'и доступ AI-краулеров в одной боковой панели.',
    score: 'SEO-оценка: нужна работа',
    issues: '2 высоких, 6 средних, 2 низких приоритета',
    statuses: ['Влезает', 'Обрезан', 'Только JS', 'Разрешён', 'Заблокирован'],
  },
  ro: {
    captions: [
      'Verificări SEO și un scor pentru pagina deschisă',
      'Vezi ce apare doar după JavaScript',
      'Ce crawleri AI pot citi site-ul',
      'Core Web Vitals, imagini și verificări pentru mobil',
      'Transformă constatările într-un audit PDF',
    ],
    line1: 'Vezi pagina așa cum o văd',
    accent: 'Google și AI',
    rest: '.',
    small: 'SEO, randare JavaScript și crawleri AI',
    sub1: 'Extensie Chrome gratuită: SEO tehnic, randare JavaScript',
    sub2: 'și accesul crawlerilor AI, într-un singur panou lateral.',
    score: 'Scor SEO: necesită lucru',
    issues: '2 probleme mari, 6 medii, 2 mici',
    statuses: ['Încape', 'Tăiat', 'Doar JS', 'Permis', 'Blocat'],
  },
  uk: {
    captions: [
      'SEO-перевірки й оцінка для відкритої сторінки',
      "Що з'являється лише після JavaScript",
      'Які AI-краулери можуть читати сайт',
      'Core Web Vitals, зображення й мобільні перевірки',
      'Перетворіть знахідки на PDF-аудит',
    ],
    line1: 'Дивіться на сторінку',
    accent: 'очима Google і ШІ',
    rest: '.',
    small: 'SEO, рендер JavaScript і AI-краулери',
    sub1: 'Безкоштовне розширення Chrome: технічне SEO, рендер JavaScript',
    sub2: 'і доступ AI-краулерів в одній бічній панелі.',
    score: 'SEO-оцінка: потрібна робота',
    issues: '2 високих, 6 середніх, 2 низьких пріоритети',
    statuses: ['Вміщається', 'Обрізано', 'Лише JS', 'Дозволено', 'Заблоковано'],
  },
  pt: {
    captions: [
      'Verificações de SEO e uma nota para a página aberta',
      'Veja o que só aparece depois do JavaScript',
      'Quais rastreadores de IA podem ler o site',
      'Core Web Vitals, imagens e verificações para celular',
      'Transforme os achados em um PDF de auditoria',
    ],
    line1: 'Veja a sua página como',
    accent: 'o Google e a IA',
    rest: ' a veem.',
    small: 'SEO, renderização JavaScript e rastreadores de IA',
    sub1: 'Extensão gratuita do Chrome: SEO técnico, renderização JavaScript',
    sub2: 'e acesso de rastreadores de IA, em um painel lateral.',
    score: 'Nota de SEO: precisa melhorar',
    issues: '2 problemas altos, 6 médios, 2 baixos',
    statuses: ['Cabe', 'Cortada', 'Só JS', 'Permitido', 'Bloqueado'],
  },
  nl: {
    captions: [
      'SEO-checks en een score voor de pagina die je bekijkt',
      'Zie wat pas na JavaScript verschijnt',
      'Welke AI-crawlers de site mogen lezen',
      'Core Web Vitals, afbeeldingen en mobiele checks',
      'Maak van je bevindingen een audit-PDF',
    ],
    line1: 'Zie je pagina zoals',
    accent: 'Google en AI',
    rest: ' hem zien.',
    small: 'SEO, JavaScript-rendering en AI-crawlers',
    sub1: 'Gratis Chrome-extensie: technische SEO, JavaScript-rendering',
    sub2: 'en toegang voor AI-crawlers, in één zijpaneel.',
    score: 'SEO-score: kan beter',
    issues: '2 hoge, 6 middel, 2 lage prioriteit',
    statuses: ['Past', 'Afgekapt', 'Alleen JS', 'Toegestaan', 'Geblokkeerd'],
  },
  es: {
    captions: [
      'Revisiones SEO y una puntuación para la página abierta',
      'Mira lo que solo aparece después de JavaScript',
      'Qué rastreadores de IA pueden leer el sitio',
      'Core Web Vitals, imágenes y revisiones móviles',
      'Convierte los hallazgos en un PDF de auditoría',
    ],
    line1: 'Mira tu página como',
    accent: 'la ven Google y la IA',
    rest: '.',
    small: 'SEO, renderizado JavaScript y rastreadores de IA',
    sub1: 'Extensión gratis de Chrome: SEO técnico, renderizado JavaScript',
    sub2: 'y acceso de rastreadores de IA, en un panel lateral.',
    score: 'Puntuación SEO: mejorable',
    issues: '2 problemas altos, 6 medios, 2 bajos',
    statuses: ['Cabe', 'Cortada', 'Solo JS', 'Permitido', 'Bloqueado'],
  },
  fr: {
    captions: [
      'Contrôles SEO et score pour la page ouverte',
      "Voyez ce qui n'apparaît qu'après JavaScript",
      "Quels robots d'IA peuvent lire le site",
      'Core Web Vitals, images et contrôles mobiles',
      "Transformez les constats en PDF d'audit",
    ],
    line1: 'Voyez votre page comme',
    accent: "Google et l'IA",
    rest: ' la voient.',
    small: "SEO, rendu JavaScript et robots d'IA",
    sub1: 'Extension Chrome gratuite : SEO technique, rendu JavaScript',
    sub2: "et accès des robots d'IA, dans un seul panneau latéral.",
    score: 'Score SEO : à améliorer',
    issues: '2 priorités hautes, 6 moyennes, 2 basses',
    statuses: ['Tient', 'Coupée', 'JS seul', 'Autorisé', 'Bloqué'],
  },
};

/** Output folder for a language: English at the root, the rest under locales/<code>. */
export const langDir = (out: string, lang: StoreLang) =>
  lang === 'en' ? out : `${out}/locales/${lang}`;

/**
 * Returns fitSize(text, base, width, family?, weight?, spacing?): the largest font size up to
 * `base` at which `text` stays inside `width` px, measured with resvg and the given fonts.
 */
export function makeFit(fontFiles: string[]) {
  return (
    text: string,
    base: number,
    width: number,
    family = 'Plus Jakarta Sans',
    weight = 800,
    spacing = 0,
  ): number => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="4000" height="200"><text x="0" y="100" font-family="${family}" font-weight="${weight}" font-size="${base}" letter-spacing="${spacing}">${esc(text)}</text></svg>`;
    const box = new Resvg(svg, {
      font: { loadSystemFonts: false, fontFiles, defaultFontFamily: 'Inter' },
    }).getBBox();
    const w = box?.width ?? 0;
    return w <= width ? base : Math.floor((base * width) / w);
  };
}

/**
 * Headline font for SVG tiles. Plus Jakarta Sans has no Cyrillic and resvg falls back to Inter
 * Regular per glyph, so Russian and Ukrainian headlines use Inter (Bold) as a whole.
 */
export const displayFont = (lang: StoreLang) =>
  lang === 'ru' || lang === 'uk' ? 'Inter' : 'Plus Jakarta Sans';

/** Escape text for SVG and HTML. */
export const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Font faces for HTML frames: Latin, Latin Extended (TR, RO) and Inter's Cyrillic (RU, UK; Plus Jakarta Sans has none). */
export function frameFontCss(readB64: (rel: string) => string): string {
  // Fontsource subset ranges: each file only has its own glyphs.
  const LATIN =
    'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD';
  const LATIN_EXT =
    'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF';
  const woff = (fam: string, w: string, f: string, range: string) =>
    `@font-face{font-family:'${fam}';font-weight:${w};unicode-range:${range};src:url(data:font/woff2;base64,${readB64(`packages/ui/fonts/${f}`)}) format('woff2')}`;
  return [
    woff('Plus Jakarta Sans', '200 800', 'plus-jakarta-sans-latin-wght-normal.woff2', LATIN),
    woff(
      'Plus Jakarta Sans',
      '200 800',
      'plus-jakarta-sans-latin-ext-wght-normal.woff2',
      LATIN_EXT,
    ),
    woff('Inter', '100 900', 'inter-latin-wght-normal.woff2', LATIN),
    woff('Inter', '100 900', 'inter-latin-ext-wght-normal.woff2', LATIN_EXT),
    woff(
      'Inter',
      '100 900',
      'inter-cyrillic-wght-normal.woff2',
      'U+0301,U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116',
    ),
  ].join('\n');
}
