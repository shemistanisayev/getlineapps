import type { Rule } from '../types.ts';
import { c, cp, u } from './helpers.ts';

export const AB_TESTING: Rule[] = [
  {
    id: 'optimizely',
    name: 'Optimizely',
    category: 'abtesting',
    script: [u('cdn.optimizely.com', '')],
    global: ['optimizely'],
    ids: [{ from: 'script', pattern: /optimizely\.com\/js\/(\d+)\.js/ }],
  },
  {
    id: 'vwo',
    name: 'VWO',
    category: 'abtesting',
    script: [u('visualwebsiteoptimizer.com', '')],
    global: ['_vwo_code', 'VWO'],
  },
  {
    id: 'abtasty',
    name: 'AB Tasty',
    category: 'abtesting',
    script: [u('try.abtasty.com', '')],
    global: ['ABTasty'],
  },
  {
    id: 'convert',
    name: 'Convert',
    category: 'abtesting',
    script: [u('convertexperiments.com', '')],
    global: ['convert'],
  },
  {
    id: 'kameleoon',
    name: 'Kameleoon',
    category: 'abtesting',
    script: [u('kameleoon.eu', ''), u('kameleoon.io', '')],
    global: ['Kameleoon'],
  },
  {
    id: 'dynamic_yield',
    name: 'Dynamic Yield',
    category: 'abtesting',
    script: [u('cdn.dynamicyield.com', '')],
    global: ['DY'],
  },
];

const ecommerce = 'ecommerce' as const;

/**
 * Platforms and site builders. Order is also the platform priority for the summary line: a
 * WooCommerce store runs on WordPress, but the summary says "WooCommerce store".
 */
export const ECOMMERCE: Rule[] = [
  {
    id: 'shopify',
    name: 'Shopify',
    category: ecommerce,
    mark: 'shopify',
    kind: 'store',
    script: [u('cdn.shopify.com', ''), /\/cdn\/shop\//],
    global: ['Shopify'],
    cookie: [c('_shopify_y'), c('_shopify_s')],
    ids: [{ from: 'value', path: 'Shopify.theme.name', pattern: /^(.{1,40})$/ }],
  },
  {
    id: 'woocommerce',
    name: 'WooCommerce',
    category: ecommerce,
    mark: 'woocommerce',
    script: [/\/wp-content\/plugins\/woocommerce\//i],
    global: ['woocommerce_params', 'wc_add_to_cart_params'],
    cookie: [cp('wp_woocommerce_session_')],
  },
  {
    id: 'adobe_commerce',
    name: 'Adobe Commerce',
    category: ecommerce,
    // Versioned static paths (/static/version1712/frontend/...) or Magento's own module files.
    // A plain /static/frontend/ path is not enough (theguardian.com serves fonts from one).
    script: [/\/static\/version\d+\/frontend\//, /\/Magento_[A-Za-z]+\//],
    cookie: [c('mage-cache-sessid'), c('form_key')],
  },
  {
    id: 'bigcommerce',
    name: 'BigCommerce',
    category: ecommerce,
    mark: 'bigcommerce',
    script: [u('bigcommerce.com', '')],
    global: ['BCData'],
  },
  {
    id: 'salesforce_commerce',
    name: 'Salesforce Commerce Cloud',
    category: ecommerce,
    script: [/\/demandware\.static\//],
  },
  {
    id: 'prestashop',
    name: 'PrestaShop',
    category: ecommerce,
    global: ['prestashop'],
    meta: [{ name: 'generator', pattern: /PrestaShop/i }],
  },
  {
    id: 'ecwid',
    name: 'Ecwid',
    category: ecommerce,
    script: [u('app.ecwid.com', '')],
    global: ['Ecwid'],
  },
  {
    id: 'wix',
    name: 'Wix',
    category: ecommerce,
    mark: 'wix',
    script: [u('parastorage.com', ''), u('wixstatic.com', '')],
    meta: [{ name: 'generator', pattern: /Wix\.com/i }],
  },
  {
    id: 'squarespace',
    name: 'Squarespace',
    category: ecommerce,
    mark: 'squarespace',
    script: [u('squarespace.com', ''), u('squarespace-cdn.com', '')],
    global: ['Squarespace'],
  },
  {
    id: 'webflow',
    name: 'Webflow',
    category: ecommerce,
    mark: 'webflow',
    script: [u('website-files.com', ''), u('webflow.com', '')],
    global: ['Webflow'],
    meta: [{ name: 'generator', pattern: /Webflow/i }],
  },
  {
    id: 'tilda',
    name: 'Tilda',
    category: ecommerce,
    mark: 'tilda',
    script: [u('tildacdn.com', ''), u('tildacdn.one', '')],
  },
  {
    id: 'wordpress',
    name: 'WordPress',
    category: ecommerce,
    mark: 'wordpress',
    script: [/\/wp-(content|includes)\//i],
    meta: [{ name: 'generator', pattern: /^WordPress/i }],
  },
];

const reviews = 'reviews' as const;

export const REVIEWS: Rule[] = [
  {
    id: 'trustpilot',
    name: 'Trustpilot',
    category: reviews,
    mark: 'trustpilot',
    kind: 'widget',
    script: [u('widget.trustpilot.com', '')],
    global: ['Trustpilot'],
    selector: ['.trustpilot-widget'],
  },
  {
    id: 'yotpo',
    name: 'Yotpo',
    category: reviews,
    kind: 'widget',
    script: [u('yotpo.com', '')],
    global: ['yotpo'],
  },
  {
    id: 'judgeme',
    name: 'Judge.me',
    category: reviews,
    kind: 'widget',
    script: [u('judge.me', '')],
    global: ['jdgm'],
  },
  {
    id: 'okendo',
    name: 'Okendo',
    category: reviews,
    kind: 'widget',
    script: [u('okendo.io', '')],
    global: ['okeWidgetApi'],
  },
  {
    id: 'reviewsio',
    name: 'Reviews.io',
    category: reviews,
    kind: 'widget',
    script: [u('reviews.io', ''), u('reviews.co.uk', '')],
  },
  {
    id: 'bazaarvoice',
    name: 'Bazaarvoice',
    category: reviews,
    kind: 'widget',
    script: [u('bazaarvoice.com', '')],
    global: ['$BV'],
  },
  {
    id: 'feefo',
    name: 'Feefo',
    category: reviews,
    kind: 'widget',
    script: [u('feefo.com', '')],
  },
  {
    id: 'stamped',
    name: 'Stamped',
    category: reviews,
    kind: 'widget',
    script: [u('stamped.io', '')],
  },
  {
    id: 'loox',
    name: 'Loox',
    category: reviews,
    kind: 'widget',
    script: [u('loox.io', '')],
  },
];

const payments = 'payments' as const;

export const PAYMENTS: Rule[] = [
  {
    id: 'stripe',
    name: 'Stripe',
    category: payments,
    mark: 'stripe',
    script: [u('js.stripe.com', '')],
    global: ['Stripe'],
  },
  {
    id: 'klarna',
    name: 'Klarna',
    category: payments,
    mark: 'klarna',
    kind: 'messaging',
    script: [u('js.klarna.com', ''), u('klarnacdn.net', ''), u('klarnaservices.com', '')],
    global: ['Klarna'],
    selector: ['klarna-placement'],
  },
  {
    id: 'paypal',
    name: 'PayPal',
    category: payments,
    mark: 'paypal',
    kind: 'messaging',
    script: [u('paypal.com', 'sdk/js'), u('paypalobjects.com', '')],
    global: ['paypal'],
    selector: ['[data-pp-message]'],
  },
  {
    id: 'afterpay',
    name: 'Afterpay',
    category: payments,
    mark: 'afterpay',
    kind: 'messaging',
    script: [u('js.afterpay.com', ''), u('static.afterpay.com', '')],
    global: ['Afterpay'],
    selector: ['afterpay-placement'],
  },
  {
    id: 'shop_pay',
    name: 'Shop Pay',
    category: payments,
    selector: ['shop-pay-button', 'shopify-payment-terms'],
  },
  {
    id: 'affirm',
    name: 'Affirm',
    category: payments,
    script: [u('affirm.com', '')],
    global: ['affirm'],
  },
  {
    id: 'sezzle',
    name: 'Sezzle',
    category: payments,
    script: [u('widget.sezzle.com', '')],
  },
  {
    id: 'adyen',
    name: 'Adyen',
    category: payments,
    script: [u('adyen.com', '')],
    global: ['AdyenCheckout'],
  },
  {
    id: 'braintree',
    name: 'Braintree',
    category: payments,
    script: [u('braintreegateway.com', '')],
  },
  {
    id: 'square',
    name: 'Square',
    category: payments,
    script: [u('squarecdn.com', '')],
  },
];

const affiliate = 'affiliate' as const;

export const AFFILIATE: Rule[] = [
  {
    id: 'impact',
    name: 'Impact',
    category: affiliate,
    script: [u('impactcdn.com', ''), u('impactradius-event.com', '')],
    global: ['ire'],
  },
  {
    id: 'awin',
    name: 'Awin',
    category: affiliate,
    script: [u('dwin1.com', '')],
    global: ['AWIN'],
  },
  {
    id: 'rakuten',
    name: 'Rakuten Advertising',
    category: affiliate,
    mark: 'rakuten',
    script: [u('tag.rmp.rakuten.com', ''), u('linksynergy.com', '')],
  },
  {
    id: 'partnerstack',
    name: 'PartnerStack',
    category: affiliate,
    script: [u('partnerlinks.io', '')],
    global: ['growsumo'],
  },
  {
    id: 'cj',
    name: 'CJ Affiliate',
    category: affiliate,
    script: [u('emjcd.com', '')],
  },
  {
    id: 'refersion',
    name: 'Refersion',
    category: affiliate,
    script: [u('refersion.com', '')],
  },
  {
    id: 'tapfiliate',
    name: 'Tapfiliate',
    category: affiliate,
    script: [u('tapfiliate.com', '')],
  },
  {
    id: 'shareasale',
    name: 'ShareASale',
    category: affiliate,
    script: [u('shareasale-analytics.com', '')],
  },
  {
    id: 'partnerize',
    name: 'Partnerize',
    category: affiliate,
    script: [u('prf.hn', '')],
  },
];
