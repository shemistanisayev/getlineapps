/**
 * Structured data checks (docs/serpline-SPEC.md §4.6): each JSON-LD object of a type Google shows
 * as a rich result is checked for the properties Google requires and recommends. A short, readable
 * subset of Google's Search Central rules; it is not a full schema.org validator.
 */

export interface SchemaItem {
  /** schema.org type as written ("Product", "NewsArticle"). */
  type: string;
  /** The rich result it can earn ("Product snippet"), null for types Google shows no result for. */
  result: string | null;
  /** Missing required properties ("offers.price"). Any missing one blocks the rich result. */
  missing: string[];
  /** Missing recommended properties. */
  recommended: string[];
}

type Node = Record<string, unknown>;

interface Rule {
  result: string;
  /** Property paths that must have a value. `a|b` means one of them. */
  required: string[];
  recommended: string[];
  /** Extra checks on nested objects: returns more missing paths. */
  nested?: (n: Node) => { missing: string[]; recommended: string[] };
}

const ARTICLE: Rule = {
  result: 'Article',
  required: [],
  recommended: ['headline', 'image', 'datePublished', 'dateModified', 'author.name'],
};

const LOCAL: Rule = {
  result: 'Local business',
  required: ['name', 'address'],
  recommended: ['telephone', 'url', 'image', 'openingHoursSpecification|openingHours', 'geo'],
};

function asArray(v: unknown): unknown[] {
  return Array.isArray(v) ? v : v === undefined || v === null ? [] : [v];
}

const isObj = (v: unknown): v is Node => !!v && typeof v === 'object' && !Array.isArray(v);

function hasValue(v: unknown): boolean {
  if (v === undefined || v === null) return false;
  if (typeof v === 'string') return v.trim() !== '';
  if (Array.isArray(v)) return v.some(hasValue);
  return true;
}

/** Value at "a.b.c"; arrays on the way pass if any element has it. */
function has(node: Node, path: string): boolean {
  return path.split('|').some((alt) => {
    const [head, ...rest] = alt.split('.');
    const v = node[head!];
    if (!rest.length) return hasValue(v);
    return asArray(v).some((x) => isObj(x) && has(x, rest.join('.')));
  });
}

function offersCheck(n: Node) {
  const missing: string[] = [];
  const recommended: string[] = [];
  for (const o of asArray(n.offers).filter(isObj)) {
    // AggregateOffer carries lowPrice instead of price.
    const agg = asArray(o['@type']).includes('AggregateOffer');
    const price = agg ? 'lowPrice' : 'price|priceSpecification.price';
    if (!has(o, price) && !missing.includes(`offers.${price.split('|')[0]}`))
      missing.push(`offers.${price.split('|')[0]}`);
    if (
      !has(o, 'priceCurrency|priceSpecification.priceCurrency') &&
      !missing.includes('offers.priceCurrency')
    )
      missing.push('offers.priceCurrency');
    if (!agg && !has(o, 'availability') && !recommended.includes('offers.availability'))
      recommended.push('offers.availability');
  }
  for (const r of asArray(n.aggregateRating).filter(isObj)) {
    if (!has(r, 'ratingValue')) missing.push('aggregateRating.ratingValue');
    if (!has(r, 'ratingCount|reviewCount')) missing.push('aggregateRating.ratingCount');
  }
  return { missing, recommended };
}

const RULES: Record<string, Rule> = {
  Product: {
    result: 'Product snippet',
    required: ['name', 'offers|review|aggregateRating'],
    recommended: [
      'image',
      'description',
      'brand',
      'sku|gtin|gtin13|gtin12|mpn',
      'aggregateRating',
      'review',
    ],
    nested: offersCheck,
  },
  Article: ARTICLE,
  NewsArticle: ARTICLE,
  BlogPosting: ARTICLE,
  BreadcrumbList: {
    result: 'Breadcrumb',
    required: ['itemListElement'],
    recommended: [],
    nested: (n) => {
      const items = asArray(n.itemListElement).filter(isObj);
      const missing: string[] = [];
      items.forEach((it, i) => {
        if (!has(it, 'position') && !missing.includes('itemListElement.position'))
          missing.push('itemListElement.position');
        if (!has(it, 'name|item.name') && !missing.includes('itemListElement.name'))
          missing.push('itemListElement.name');
        // The last crumb may leave out its URL (it is the page itself).
        if (i < items.length - 1 && !has(it, 'item') && !missing.includes('itemListElement.item'))
          missing.push('itemListElement.item');
      });
      return { missing, recommended: [] };
    },
  },
  FAQPage: {
    result: 'FAQ',
    required: ['mainEntity'],
    recommended: [],
    nested: (n) => {
      const missing: string[] = [];
      for (const q of asArray(n.mainEntity).filter(isObj)) {
        if (!has(q, 'name') && !missing.includes('mainEntity.name'))
          missing.push('mainEntity.name');
        if (!has(q, 'acceptedAnswer.text') && !missing.includes('mainEntity.acceptedAnswer.text'))
          missing.push('mainEntity.acceptedAnswer.text');
      }
      return { missing, recommended: [] };
    },
  },
  Organization: {
    result: 'Logo and knowledge panel',
    required: [],
    recommended: ['name', 'url', 'logo', 'sameAs'],
  },
  LocalBusiness: LOCAL,
  Store: LOCAL,
  Restaurant: LOCAL,
  Review: {
    result: 'Review snippet',
    required: ['author', 'itemReviewed', 'reviewRating.ratingValue'],
    recommended: ['datePublished'],
  },
  Event: {
    result: 'Event',
    required: ['name', 'startDate', 'location'],
    recommended: ['endDate', 'image', 'description', 'offers', 'eventStatus', 'organizer'],
  },
  Recipe: {
    result: 'Recipe',
    required: ['name', 'image'],
    recommended: [
      'author',
      'datePublished',
      'description',
      'recipeIngredient',
      'recipeInstructions',
      'totalTime',
      'aggregateRating',
    ],
  },
  VideoObject: {
    result: 'Video',
    required: ['name', 'thumbnailUrl', 'uploadDate'],
    recommended: ['description', 'contentUrl|embedUrl', 'duration'],
  },
  JobPosting: {
    result: 'Job posting',
    required: [
      'title',
      'description',
      'datePosted',
      'hiringOrganization',
      'jobLocation|jobLocationType',
    ],
    recommended: ['validThrough', 'baseSalary', 'employmentType'],
  },
  SoftwareApplication: {
    result: 'Software app',
    required: ['name', 'offers.price', 'aggregateRating|review'],
    recommended: ['applicationCategory', 'operatingSystem'],
  },
};

/** Rich result types Serpline knows (for docs and tests). */
export const SCHEMA_TYPES = Object.keys(RULES);

/** Check every JSON-LD node; nodes of types without a rule are listed with result null. */
export function checkSchema(nodes: Record<string, unknown>[]): SchemaItem[] {
  const out: SchemaItem[] = [];
  for (const node of nodes) {
    const types = asArray(node['@type']).filter((t): t is string => typeof t === 'string');
    const type = types.find((t) => RULES[t]) ?? types[0];
    if (!type) continue;
    const rule = RULES[type];
    if (!rule) {
      out.push({ type, result: null, missing: [], recommended: [] });
      continue;
    }
    const missing = rule.required.filter((p) => !has(node, p)).map((p) => p.split('|')[0]!);
    const recommended = rule.recommended.filter((p) => !has(node, p)).map((p) => p.split('|')[0]!);
    if (rule.nested) {
      const n = rule.nested(node);
      for (const m of n.missing) if (!missing.includes(m)) missing.push(m);
      for (const m of n.recommended) if (!recommended.includes(m)) recommended.push(m);
    }
    out.push({ type, result: rule.result, missing, recommended });
  }
  return out;
}
