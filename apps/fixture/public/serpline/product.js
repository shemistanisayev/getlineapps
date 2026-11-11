// Lumo, Serpline scenario: everything a crawler without JavaScript misses (docs/serpline-SPEC.md §10).
// Under /seo/... (the SPEC paths on the Hitline fixture) internal links keep that prefix.
(function () {
  var P = location.pathname.indexOf('/seo/') === 0 ? '/seo' : '';
  var PRODUCT = P + '/products/wireless-headphones-pro-x';

  function html(id, markup) {
    var el = document.getElementById(id);
    if (el)
      el.innerHTML = markup
        .replace(/href="\//g, 'href="' + P + '/')
        .replace(/src="\//g, 'src="' + P + '/');
  }

  html('product-title', '<h1>Wireless Headphones Pro X</h1>');

  html(
    'product-summary',
    '<a class="seo-stars" href="#reviews">4.6 out of 5, 128 reviews</a>' +
      '<p class="desc">Active noise cancelling, 30-hour battery and fast charging. Bluetooth 5.3 connects to two devices at once.</p>',
  );

  html(
    'product-more',
    '<section id="details" class="seo-section">' +
      '<h2>Product details</h2>' +
      '<p>Pro X is our quietest pair yet. Six microphones listen to the room around you and cancel steady noise such as engines, air conditioning and traffic, while voices stay clear when you switch to transparency mode with one tap on the left ear cup.</p>' +
      '<h3>Noise cancelling</h3>' +
      '<p>Adaptive noise cancelling checks the sound around you many times per second and adjusts on its own, so a busy train and a quiet office both feel calm. Wind noise reduction keeps calls clear when you walk outside, and a dedicated mode for flights lowers the deep hum of the engines.</p>' +
      '<h3>Battery and charging</h3>' +
      '<p>One charge lasts up to 30 hours with noise cancelling on and up to 40 hours with it off. Ten minutes on the cable gives about five hours of music, and the headphones go to sleep when you take them off, so the battery is ready when you need it again.</p>' +
      '<h2>Specifications</h2>' +
      '<h4>Bluetooth 5.3</h4>' +
      '<ul class="seo-specs">' +
      '<li>Connects to two devices at once, for example a laptop and a phone</li>' +
      '<li>Codecs: AAC, SBC and LDAC for high resolution audio</li>' +
      '<li>Range up to 10 metres without walls in between</li>' +
      '<li>Weight 250 grams, folds flat into the hard case</li>' +
      '<li>USB-C cable and 3.5 mm audio cable included</li>' +
      '</ul>' +
      '<p class="seo-more-links"><a href="/help/pro-x-manual">Read the manual</a> <a href="/help/size-and-fit">Size and fit guide</a></p>' +
      '</section>' +
      '<section id="reviews" class="seo-section">' +
      '<h2>Reviews (128)</h2>' +
      '<p class="seo-filters">' +
      '<a href="' +
      PRODUCT.slice(P.length) +
      '/reviews?stars=5">5 stars</a> ' +
      '<a href="' +
      PRODUCT.slice(P.length) +
      '/reviews?stars=4">4 stars</a> ' +
      '<a href="' +
      PRODUCT.slice(P.length) +
      '/reviews?stars=3">3 stars</a> ' +
      '<a href="' +
      PRODUCT.slice(P.length) +
      '/reviews?stars=2">2 stars</a> ' +
      '<a href="' +
      PRODUCT.slice(P.length) +
      '/reviews?stars=1">1 star</a>' +
      '</p>' +
      '<article class="seo-review"><h3>Great sound for the price</h3>' +
      '<p>Clear highs, deep bass and the noise cancelling works on my daily bus ride. Pairing with my phone and laptop took a minute.</p>' +
      '<p class="seo-by"><a href="/reviews/by/anna-k">Anna K.</a> <a href="https://video.example.net/anna-k/pro-x" rel="ugc nofollow">Watch her video review</a></p></article>' +
      '<article class="seo-review"><h3>Comfortable on long flights</h3>' +
      '<p>Wore them for a nine hour flight without sore ears. The case is a bit big for a small bag.</p>' +
      '<p class="seo-by"><a href="/reviews/by/tom-r">Tom R.</a> <a href="https://video.example.net/tom-r/pro-x" rel="ugc nofollow">Watch his video review</a></p></article>' +
      '<nav aria-label="Review pages" class="seo-pages">' +
      '<a href="' +
      PRODUCT.slice(P.length) +
      '/reviews?page=2">2</a> ' +
      '<a href="' +
      PRODUCT.slice(P.length) +
      '/reviews?page=3">3</a> ' +
      '<a href="' +
      PRODUCT.slice(P.length) +
      '/reviews?page=4">4</a> ' +
      '<a href="' +
      PRODUCT.slice(P.length) +
      '/reviews?page=5">5</a> ' +
      '<a href="' +
      PRODUCT.slice(P.length) +
      '/reviews?page=6">6</a> ' +
      '<a href="' +
      PRODUCT.slice(P.length) +
      '/reviews?page=7">7</a> ' +
      '<a href="' +
      PRODUCT.slice(P.length) +
      '/reviews?page=8">8</a> ' +
      '<a href="' +
      PRODUCT.slice(P.length) +
      '/reviews?page=9">9</a>' +
      '</nav>' +
      '<p><a href="' +
      PRODUCT.slice(P.length) +
      '/reviews">Read all reviews</a> <a href="/reviews/new?product=pro-x">Write a review</a> <a href="https://reviews.example.net/lumo" rel="nofollow">Verified reviews</a></p>' +
      '</section>' +
      '<section id="related" class="seo-section">' +
      '<h2>You may also like</h2>' +
      '<div class="seo-cards">' +
      '<div class="seo-card"><img src="/img/earbuds-mini.jpg" alt="Earbuds Mini in the charging case" width="160" height="120" /><h3><a href="/products/earbuds-mini-old">Earbuds Mini</a></h3><span>$49.90</span></div>' +
      '<div class="seo-card"><img src="/img/studio-2.jpg" alt="Blue studio headphones" width="160" height="120" /><b><a href="/products/studio-headphones-2">Studio Headphones 2</a></b><span>$129.00</span></div>' +
      '<div class="seo-card"><img src="/img/sport-earbuds.jpg" alt="Sport earbuds with ear hooks" width="160" height="120" /><b><a href="/products/sport-earbuds">Sport Earbuds</a></b><span>$59.90</span></div>' +
      '<div class="seo-card"><img src="/img/travel-case.jpg" alt="Hard travel case" width="160" height="120" /><b><a href="/products/travel-case">Travel Case</a></b><span>$19.90</span></div>' +
      '</div>' +
      '<p><a href="/electronics/headphones">See all headphones</a></p>' +
      '</section>',
  );

  html(
    'footer-links',
    '<div class="seo-cols">' +
      '<div><p class="seo-col">Shop</p><a href="/electronics/headphones">Headphones</a><a href="/electronics/speakers">Speakers</a><a href="/electronics/earbuds">Earbuds</a><a href="/gift-cards">Gift cards</a><a href="/sale">Sale</a></div>' +
      '<div><p class="seo-col">Help</p><a href="/help/shipping">Shipping</a><a href="/help/returns">Returns</a><a href="/help/warranty">Warranty</a><a href="/help/payment">Payment</a><a href="/help/contact">Contact</a><a href="mailto:help@example.com">help@example.com</a><a href="tel:+15550100200">+1 555 0100 200</a></div>' +
      '<div><p class="seo-col">Lumo</p><a href="/about">About</a><a href="/stores">Stores</a><a href="/privacy">Privacy</a><a href="/careers">Careers</a><a href="/terms">Terms</a><a href="/cookies">Cookies</a></div>' +
      '</div>',
  );

  var ld = document.createElement('script');
  ld.type = 'application/ld+json';
  ld.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: 'Wireless Headphones Pro X',
    brand: { '@type': 'Brand', name: 'Lumo Audio' },
    image: location.origin + P + '/img/pro-x-front.jpg',
    offers: {
      '@type': 'Offer',
      price: '89.90',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    },
    aggregateRating: { '@type': 'AggregateRating', ratingValue: '4.6', reviewCount: '128' },
  });
  document.head.appendChild(ld);
})();
