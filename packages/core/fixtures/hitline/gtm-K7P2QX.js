/* eslint-disable */
// Fake GTM container for the Lumo fixture. Same shape as the "resource" block of a public gtm.js
// (quoted JSON keys, so keep this file out of Prettier). It only defines data; it loads nothing and
// sends nothing. The 8 tags are the ones in design/hitline/Gtm.dc.html.
var data = {
  "resource": {
    "version": "42",
    "macros": [
      { "function": "__e" },
      { "function": "__v", "vtp_name": "ecommerce.value" },
      { "function": "__v", "vtp_name": "ecommerce.currency" },
      { "function": "__v", "vtp_name": "ecommerce.items" },
      { "function": "__c", "vtp_value": "G-4LMX82PQ1S" },
      { "function": "__u", "vtp_component": "URL" }
    ],
    "tags": [
      { "function": "__googtag", "vtp_tagId": "G-4LMX82PQ1S", "tag_id": 1 },
      { "function": "__gaawe", "vtp_eventName": "add_to_cart", "tag_id": 2 },
      { "function": "__awct", "vtp_conversionId": "987654321", "consent": ["list", "ad_storage"], "tag_id": 3 },
      {
        "function": "__html",
        "vtp_html": "<script>!function(f,b,e,v){f.fbq=f.fbq||function(){};}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','1234567890123456');fbq('track','PageView');</script>",
        "consent": ["list", "ad_storage"],
        "tag_id": 4
      },
      {
        "function": "__html",
        "vtp_html": "<script>fbq('track','AddToCart',{content_ids:['LUMO-PRO-X'],content_type:'product'});</script>",
        "consent": ["list", "ad_storage"],
        "tag_id": 5
      },
      {
        "function": "__html",
        "vtp_html": "<script>!function(w,d,t){w[t]=w[t]||[];ttq.load('CTLUMO12345');ttq.page();}(window,document,'ttq');</script>",
        "tag_id": 6
      },
      {
        "function": "__html",
        "vtp_html": "<script>(function(h,o,t,j){h.hjid=3712345;var a='https://static.hotjar.com/c/hotjar-3712345.js?sv=6';})(window,document);</script>",
        "consent": ["list", "analytics_storage", "personalization_storage"],
        "tag_id": 7
      },
      { "function": "__gaawe", "vtp_eventName": "purchase", "tag_id": 8 }
    ],
    "predicates": [
      { "function": "_eq", "arg0": ["macro", 0], "arg1": "gtm.js" },
      { "function": "_eq", "arg0": ["macro", 0], "arg1": "add_to_cart" },
      { "function": "_eq", "arg0": ["macro", 0], "arg1": "purchase" }
    ],
    "rules": [
      [["if", 0], ["add", 0, 3, 5, 6]],
      [["if", 1], ["add", 1, 2, 4]],
      [["if", 2], ["add", 7]]
    ]
  },
  "runtime": []
};
