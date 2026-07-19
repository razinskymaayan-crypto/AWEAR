// ---- i18n: locale + strings, loaded synchronously BEFORE any render function runs ----
  // Deliberately synchronous (XHR, not fetch) so LOCALE/STRINGS/t() are fully ready
  // before renderHome()/showOnboarding() etc. execute later in this same script block.
  // This sidesteps the exact load-order/TDZ bug class from the 2026-06-17 postmortem:
  // an async fetch here would let render functions run against an empty STRINGS object.
  // International app: default to English unless the user explicitly picked a locale
  // via the toggle (persisted in localStorage). Hebrew is opt-in, not the default.
  let LOCALE = (localStorage.getItem('awear_locale') || 'en');
  if (LOCALE !== 'he' && LOCALE !== 'en') LOCALE = 'en';
  let STRINGS = {};
  function loadStrings(locale) {
    try {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', `/static/i18n/${locale}.json`, false); // false = synchronous
      xhr.send(null);
      if (xhr.status >= 200 && xhr.status < 300) {
        STRINGS = JSON.parse(xhr.responseText);
      }
    } catch (e) {
      console.error('loadStrings failed', e);
    }
  }
  loadStrings(LOCALE);

  function t(key, vars) {
    const val = key.split('.').reduce((o,k) => (o && o[k] !== undefined) ? o[k] : undefined, STRINGS);
    let s = (val !== undefined) ? val : key; // loud fallback: show the key, never blank
    if (vars) Object.entries(vars).forEach(([k,v]) => { s = String(s).replace(`{${k}}`, v); });
    return s;
  }

  function applyDocumentDirection() {
    document.documentElement.lang = LOCALE;
    document.documentElement.dir = (LOCALE === 'he') ? 'rtl' : 'ltr';
  }
  applyDocumentDirection();

  // Walks every element with a data-i18n attribute and sets its textContent from t().
  // Used for static markup (nav, onboarding chrome) that exists before any JS render
  // call — the JS-rendered screens (home, onboarding slides) call t() directly instead.
  function applyStaticI18n() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      el.textContent = t(el.dataset.i18n);
    });
  }
  applyStaticI18n();

  function setLocale(locale) {
    if (locale !== 'he' && locale !== 'en') return;
    if (locale === LOCALE) return;
    LOCALE = locale;
    localStorage.setItem('awear_locale', locale);
    loadStrings(LOCALE);
    applyDocumentDirection();
    applyStaticI18n();
    renderHome();
    if (typeof renderOnbSlide === 'function' && document.getElementById('onboarding') &&
        document.getElementById('onboarding').style.display !== 'none') {
      renderOnbSlide();
    }
    document.querySelectorAll('[data-lang-opt]').forEach(b =>
      b.classList.toggle('sel', b.dataset.langOpt === LOCALE));
  }

  const fileInput  = document.getElementById('file-input');
  const closetBody = document.getElementById('closet-body');
  const modal      = document.getElementById('purchase-modal');
  const modalCard  = document.getElementById('modal-card');
  const mainEl     = document.getElementById('main');
  // Backdrop tap closes the purchase modal (no X button — keep existing inner close buttons)
  if (modal) modal.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('show'); });

  // ---- header section name map: view-id -> founder-facing label shown next to "awear" ----
  // declared before showView() (~line 2733) so the router can read it TDZ-safe.
  const VIEW_TITLES = {
    home: 'home', feed: 'feed', marketplace: 'marketplace', outfits: 'AI stylist',
    chat: 'Abigail', dm: 'messages', closet: 'profile', explore: 'explore', analytics: 'wrapped',
    wishlist: 'wishlist', stylists: 'stylists', shopping: 'shopping', rewards: 'rewards',
    wallet: 'wallet', sustainability: 'sustainability', publicclosets: 'closets',
    seasonal: 'seasonal', compare: 'compare', admin: 'admin', agents: 'agents',
    'user-profile': 'profile'
  };

  // ---- icon system: clean inline line-art SVGs (Lucide/Phosphor style) ----
  // every path uses currentColor so the icon inherits its parent's text color.
  const ICONS = {
    user:'<path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"/><path d="M5 20a7 7 0 0 1 14 0"/>',
    play:'<path d="M7 5.5v13l11-6.5-11-6.5Z" stroke-linejoin="round"/>',
    grid:'<rect x="4" y="4" width="6.5" height="6.5" rx="1.4"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.4"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.4"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.4"/>',
    plus:'<path d="M12 5v14M5 12h14"/>',
    camera:'<path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h1.8l1.1-1.7A1 1 0 0 1 10.2 5h3.6a1 1 0 0 1 .8.3L15.7 7h2.8A1.5 1.5 0 0 1 20 8.5v9A1.5 1.5 0 0 1 18.5 19h-13A1.5 1.5 0 0 1 4 17.5v-9Z"/><circle cx="12" cy="13" r="3.2"/>',
    heart:'<path d="M12 20.5 4.3 13a4.6 4.6 0 0 1 6.5-6.5l1.2 1.2 1.2-1.2A4.6 4.6 0 0 1 19.7 13L12 20.5Z" stroke-linejoin="round"/>',
    heartFill:'<path d="M12 20.5 4.3 13a4.6 4.6 0 0 1 6.5-6.5l1.2 1.2 1.2-1.2A4.6 4.6 0 0 1 19.7 13L12 20.5Z" fill="currentColor" stroke="none"/>',
    bookmark:'<path d="M6 4.5A1.5 1.5 0 0 1 7.5 3h9A1.5 1.5 0 0 1 18 4.5V21l-6-3.6L6 21V4.5Z" stroke-linejoin="round"/>',
    bookmarkFill:'<path d="M6 4.5A1.5 1.5 0 0 1 7.5 3h9A1.5 1.5 0 0 1 18 4.5V21l-6-3.6L6 21V4.5Z" fill="currentColor" stroke="none"/>',
    share:'<path d="M14 4h6v6M20 4l-8.5 8.5"/><path d="M18 14v4.5A1.5 1.5 0 0 1 16.5 20h-9A1.5 1.5 0 0 1 6 18.5v-9A1.5 1.5 0 0 1 7.5 8H12"/>',
    bag:'<path d="M6 8h12l-.9 11a1 1 0 0 1-1 .9H7.9a1 1 0 0 1-1-.9L6 8Z" stroke-linejoin="round"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/>',
    flame:'<path d="M12 3s5 3.5 5 8.5a5 5 0 0 1-10 0c0-1.6.8-2.9 1.6-3.7C8.7 9 9 11 11 11c0-2 .5-5 1-8Z" stroke-linejoin="round"/>',
    sparkle:'<path d="M12 3l1.7 4.8L18.5 9.5l-4.8 1.7L12 16l-1.7-4.8L5.5 9.5l4.8-1.7L12 3Z" stroke-linejoin="round"/><path d="M18.5 15l.7 2 .8 2-2-.7-2-.8 2-.7.5-1.8Z" stroke-linejoin="round"/>',
    hanger:'<path d="M12 6.2a2 2 0 1 1 1.4 1.9c-.5.2-.9.6-.9 1.2v.8"/><path d="M12 10.5 4.5 16a1 1 0 0 0 .6 1.8h13.8A1 1 0 0 0 19.5 16L12 10.5Z" stroke-linejoin="round"/>',
    tag:'<path d="M4 11.5V5.5A1.5 1.5 0 0 1 5.5 4h6l8 8a1.4 1.4 0 0 1 0 2l-5.5 5.5a1.4 1.4 0 0 1-2 0l-8-8Z" stroke-linejoin="round"/><circle cx="8.5" cy="8.5" r="1.2" fill="currentColor" stroke="none"/>',
    coins:'<ellipse cx="9" cy="7" rx="5" ry="2.4"/><path d="M4 7v4c0 1.3 2.2 2.4 5 2.4s5-1.1 5-2.4V7"/><path d="M10 14.6c.6 1 2.5 1.8 5 1.8 2.8 0 5-1.1 5-2.4v-4c0-1-1.3-1.9-3.3-2.2"/>',
    door:'<rect x="5" y="3.5" width="14" height="17" rx="1.5"/><path d="M9 3.5v17"/><circle cx="6.6" cy="12" r=".9" fill="currentColor" stroke="none"/>',
    image:'<rect x="4" y="5" width="16" height="14" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="m5 17 4.5-4.5L13 16l2.5-2.5L20 18" stroke-linejoin="round"/>',
    check:'<path d="m5 12.5 4.5 4.5L19 7" stroke-linejoin="round"/>',
    checkCircle:'<circle cx="12" cy="12" r="8.5"/><path d="m8.5 12 2.5 2.5L15.5 9.5" stroke-linejoin="round"/>',
    receipt:'<path d="M6 3.5h12v17l-2-1.3-2 1.3-2-1.3-2 1.3-2-1.3-2 1.3v-17Z" stroke-linejoin="round"/><path d="M9 8h6M9 12h6"/>',
    cash:'<rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="2.6"/><path d="M6 9.5v.01M18 14.5v.01"/>',
    search:'<circle cx="11" cy="11" r="6.5"/><path d="m20 20-3.6-3.6"/>',
    arrowUp:'<path d="M12 19V5M6 11l6-6 6 6" stroke-linejoin="round"/>',
    arrowOut:'<path d="M14 4h6v6M20 4l-9 9M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4"/>',
    diamond:'<path d="M5 9h14l-7 11L5 9Z" stroke-linejoin="round"/><path d="M8 4.5h8l3 4.5H5l3-4.5Z" stroke-linejoin="round"/><path d="M9 9 12 20 15 9" /><path d="M8 4.5 5 9M16 4.5 19 9"/>',
    point:'<path d="M9 11V5.5a1.5 1.5 0 0 1 3 0V10l3.3.6a2 2 0 0 1 1.6 2.4l-.8 3.6A2 2 0 0 1 14.2 20H10a2 2 0 0 1-1.6-.8L5 14.5a1.6 1.6 0 0 1 2.4-2.1L9 13.8" stroke-linejoin="round"/>',
    shirt:'<path d="M8 4 4.5 7 7 10l1-1v10h8V9l1 1 2.5-3L16 4l-1.5 1a3 3 0 0 1-5 0L8 4Z" stroke-linejoin="round"/>',
    box:'<path d="M3.5 7 12 3l8.5 4-8.5 4-8.5-4Z" stroke-linejoin="round"/><path d="M3.5 7v10l8.5 4 8.5-4V7M12 11v10"/>',
    alert:'<path d="M12 3 1.5 21h21L12 3Z" stroke-linejoin="round"/><path d="M12 9v5M12 17.5v.01"/>',
    trophy:'<path d="M8 4h8v3a4 4 0 0 1-8 0V4Z" stroke-linejoin="round"/><path d="M8 5H5.5A1.5 1.5 0 0 0 4 6.5 3.5 3.5 0 0 0 7.5 10M16 5h2.5A1.5 1.5 0 0 1 20 6.5 3.5 3.5 0 0 1 16.5 10"/><path d="M12 11v3M9 20h6M10 17h4v3h-4v-3Z" stroke-linejoin="round"/>',
    leaf:'<path d="M19 5c-7 0-13 4-13 11 0 1.5.3 2.5.3 2.5S7 12 19 5Z" stroke-linejoin="round"/><path d="M6.3 18.5C9 14 13 9.5 19 5"/>',
    mapPin:'<path d="M12 21s7-5.7 7-11a7 7 0 1 0-14 0c0 5.3 7 11 7 11Z" stroke-linejoin="round"/><circle cx="12" cy="10" r="2.5"/>',
    crown:'<path d="M4 18h16l-1.3-8-3.2 3.5L12 8l-3.5 5.5L5.3 10 4 18Z" stroke-linejoin="round"/><path d="M4 18h16v2H4v-2Z"/>',
    users:'<circle cx="9" cy="8" r="3"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0"/><circle cx="17" cy="9" r="2.4"/><path d="M14.8 12.2A4 4 0 0 1 20.5 16"/>',
    briefcase:'<rect x="3.5" y="8" width="17" height="11" rx="1.5"/><path d="M8.5 8V6a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v2"/><path d="M3.5 13h17"/>',
    plane:'<path d="M12 2v8.5L4 14v2l8-2.5V19l-2.5 1.8V22l3.5-1 3.5 1v-1.2L13 19v-5.5l8 2.5v-2l-8-3.5V2h-1Z" stroke-linejoin="round"/>',
    gift:'<rect x="4" y="9" width="16" height="11" rx="1.5"/><path d="M4 13h16M12 9v11"/><path d="M9 9c-1.5 0-2.5-1-2.5-2.2C6.5 5.5 7.5 5 8.5 5c1.5 0 3 1.5 3.5 4M15 9c1.5 0 2.5-1 2.5-2.2 0-1.3-1-1.8-2-1.8-1.5 0-3 1.5-3.5 4" stroke-linejoin="round"/>',
    coffee:'<path d="M5 9h12v6a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V9Z" stroke-linejoin="round"/><path d="M17 10.5h1.5a2 2 0 0 1 0 4H17"/><path d="M8 4.5c0 1-1 1-1 2M12 4.5c0 1-1 1-1 2"/>',
    dumbbell:'<rect x="2.5" y="10" width="3" height="4" rx="1"/><rect x="18.5" y="10" width="3" height="4" rx="1"/><path d="M5.5 12h13"/><rect x="5" y="8.5" width="2" height="7" rx="0.8"/><rect x="17" y="8.5" width="2" height="7" rx="0.8"/>',
    wave:'<path d="M2 14c2 0 3-2 5-2s3 2 5 2 3-2 5-2 3 2 5 2"/><path d="M2 18c2 0 3-2 5-2s3 2 5 2 3-2 5-2 3 2 5 2"/>',
    flag:'<path d="M6 21V4"/><path d="M6 4.5h11l-2.8 3.5L17 11.5H6" stroke-linejoin="round"/>',
    hoodie:'<path d="M8.5 5.2A4 4 0 0 1 12 3.2a4 4 0 0 1 3.5 2" stroke-linejoin="round"/><path d="M5 9.2c0-2.6 1.6-4.6 3.5-5l.6 2.4a2.2 2.2 0 0 0 2.9 1.6 2.2 2.2 0 0 0 1.4-1.6l.6-2.4c1.9.4 3.5 2.4 3.5 5l3 3a1 1 0 0 1-.3 1.6l-2.7 1.3V20a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1v-5l-2.7-1.3a1 1 0 0 1-.3-1.6l3-3Z" stroke-linejoin="round"/>',
    flower:'<circle cx="12" cy="12" r="2.1"/><path d="M12 9.7a2.4 2.4 0 1 1 0-4.8 2.4 2.4 0 0 1 0 4.8ZM12 19.1a2.4 2.4 0 1 1 0-4.8 2.4 2.4 0 0 1 0 4.8ZM9.7 12a2.4 2.4 0 1 1-4.8 0 2.4 2.4 0 0 1 4.8 0ZM19.1 12a2.4 2.4 0 1 1-4.8 0 2.4 2.4 0 0 1 4.8 0Z" stroke-linejoin="round"/>',
    minimal:'<circle cx="12" cy="12" r="7.5"/><path d="M8.2 12h7.6"/>',
    globe:'<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.4 2.3 3.7 5.4 3.7 8.5s-1.3 6.2-3.7 8.5c-2.4-2.3-3.7-5.4-3.7-8.5s1.3-6.2 3.7-8.5Z" stroke-linejoin="round"/>',
    lock:'<rect x="5" y="10.5" width="14" height="9.5" rx="2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/><circle cx="12" cy="15" r="1.2" fill="currentColor" stroke="none"/>',
    book:'<path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H19v15H6.5A1.5 1.5 0 0 0 5 19.5V4.5Z" stroke-linejoin="round"/><path d="M5 19.5A1.5 1.5 0 0 0 6.5 21H19v-3M9 7h6M9 10.5h6"/>',
    chevronRight:'<path d="m9 6 6 6-6 6" stroke-linejoin="round"/>',
    storefront:'<path d="M4 9.5 5 4h14l1 5.5" stroke-linejoin="round"/><path d="M4 9.5a2.2 2.2 0 0 0 4.4.3 2.2 2.2 0 0 0 4.4 0 2.2 2.2 0 0 0 4.4 0 2.2 2.2 0 0 0 4.4-.3" stroke-linejoin="round"/><path d="M5.5 9.8V20h13V9.8"/><path d="M10 20v-5.5h4V20"/>',
    more:'<circle cx="5" cy="12" r="1.6" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.6" fill="currentColor" stroke="none"/>',
    trash:'<path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-12"/>',
    blockUser:'<circle cx="12" cy="12" r="8.5"/><path d="M6.5 17.5 17.5 6.5" stroke-linecap="round"/>',
    calendar:'<rect x="4" y="5" width="16" height="16" rx="2"/><path d="M16 3v4M8 3v4M4 11h16"/>',
    video:'<path d="M15 10l4.5-3v10L15 14v-4z" stroke-linejoin="round"/><rect x="3" y="8" width="12" height="8" rx="2"/>',
    barChart:'<path d="M4 18V10M9 18V6M14 18V12M19 18V8" stroke-linecap="round"/>',
    list:'<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
    scale:'<path d="M12 3v18M5 21h14M3 7h6M15 7h6M3 7l3 6a3 3 0 0 0 6 0L9 7M15 7l3 6a3 3 0 0 0 6 0L21 7" stroke-linejoin="round"/>',
    award:'<circle cx="12" cy="9" r="6"/><path d="M8.5 14.5 7 21l5-2 5 2-1.5-6.5" stroke-linejoin="round"/>',
    target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/>',
    cart:'<path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13l-1.4 6.5h12.8M7 13 5.4 5M10 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2ZM17 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" stroke-linejoin="round"/>',
    chat:'<path d="M14 9a3 3 0 0 1-3 3H6l-4 4V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v4Z" stroke-linejoin="round"/>',
    bell:'<path d="M6 10a6 6 0 0 1 12 0v3.5l1.5 2.5H4.5L6 13.5V10Z" stroke-linejoin="round"/><path d="M10 19a2 2 0 0 0 4 0"/>',
    x:'<path d="M6 6l12 12M18 6 6 18"/>',
    arrowRight:'<path d="M5 12h14M13 6l6 6-6 6" stroke-linejoin="round"/>',
    arrowLeft:'<path d="M19 12H5M11 6l-6 6 6 6" stroke-linejoin="round"/>',
    send:'<path d="M21 3 10.5 13.5M21 3l-6.5 18-4-8-8-4L21 3Z" stroke-linejoin="round"/>',
    messageCircle:'<path d="M4 12a8 8 0 1 1 3.2 6.4L3 20l1.3-4A7.9 7.9 0 0 1 4 12Z" stroke-linejoin="round"/>',
    refresh:'<path d="M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3M20 6v5h-5M4 18v-5h5"/>',
    clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2" stroke-linecap="round" stroke-linejoin="round"/>',
    sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>',
    filter:'<path d="M4 6h16M7 12h10M10 18h4"/>',
    star:'<path d="M12 3l2.4 5.3 5.6.8-4 4.2 1 5.7L12 16l-5 2.9 1-5.7-4-4.2 5.6-.8L12 3Z" stroke-linejoin="round"/>',
    pants:'<path d="M5 4h14v7l-3.5 9H12l-.5-5.5-.5 5.5H7.5L4 11V4Z" stroke-linejoin="round"/>',
    shoe:'<path d="M2 18h20v-1a1 1 0 0 0-1-1h-4l-1.5-4.5H9.5L8 14.5H4a2 2 0 0 0-2 2v1.5Z" stroke-linejoin="round"/>',
    dress:'<path d="M9 3h6l2.5 6.5L15 21H9L6.5 9.5 9 3Z" stroke-linejoin="round"/><path d="M6.5 9.5h11"/>',
    cap:'<path d="M5 15a7 5 0 0 1 14 0"/><rect x="4" y="15" width="16" height="3" rx="1.5"/><path d="M20 16.5h2.5"/>',
    skirt:'<path d="M8 3h8v4L20 21H4L8 7V3Z" stroke-linejoin="round"/><path d="M8 7h8"/>',
    watch:'<rect x="8.5" y="7" width="7" height="10" rx="2.5"/><path d="M11 7V5h2v2M11 17v2h2v-2"/><path d="M8.5 12h7"/>',
  };
  function icon(name, size){
    const s = size || 20;
    const p = ICONS[name] || ICONS.tag;
    return `<span class="ic-svg" style="width:${s}px;height:${s}px" aria-hidden="true">`+
      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">${p}</svg></span>`;
  }
  // category -> garment icon (used as image fallback + listing thumbs)
  const CAT_ICON = {
    top:'shirt', shirt:'shirt', tshirt:'shirt', blouse:'shirt', tank:'shirt', crop:'shirt',
    bottoms:'pants', pants:'pants', jeans:'pants', trousers:'pants', shorts:'pants', leggings:'pants',
    skirt:'skirt',
    dress:'dress', gown:'dress', jumpsuit:'dress',
    outerwear:'hoodie', jacket:'hoodie', coat:'hoodie', hoodie:'hoodie', blazer:'hoodie', cardigan:'hoodie', vest:'hoodie',
    shoes:'shoe', sneakers:'shoe', boots:'shoe', heels:'shoe', sandals:'shoe', footwear:'shoe', loafers:'shoe',
    bag:'bag', handbag:'bag', purse:'bag', backpack:'bag', tote:'bag', clutch:'bag',
    hat:'cap', cap:'cap', beanie:'cap', headwear:'cap',
    accessory:'sparkle', accessories:'sparkle', scarf:'sparkle', belt:'sparkle', sunglasses:'sparkle', gloves:'sparkle',
    jewelry:'diamond', necklace:'diamond', earrings:'diamond', bracelet:'diamond', ring:'diamond', watch:'watch',
  };
  function catIcon(cat){ return CAT_ICON[(cat||'').toLowerCase()] || 'hanger'; }
  const CAT_LABEL = { top:'Top', dress:'Dress', bottoms:'Bottoms', outerwear:'Outerwear',
                      shoes:'Shoes', bag:'Bag', accessory:'Accessory', jewelry:'Jewelry', hat:'Hat' };
  function catLabel(cat){ return CAT_LABEL[(cat||'').toLowerCase()] || 'Item'; }

  // ---- real product images (Pollinations, no key) with graceful SVG fallback ----
  // onerror -> imgFallback() swaps the broken <img> for a line-art garment icon,
  // so the demo never shows a broken-image glyph.
  function imgFallback(img){
    const cat = img.getAttribute('data-cat') || '';
    const span = document.createElement('span');
    span.className = 'img-fallback';
    span.innerHTML = icon(catIcon(cat), 40);
    img.replaceWith(span);
  }
  // Avatars come from external CDNs (randomuser.me, user uploads). If one fails to load,
  // swap the broken <img> for an initials circle so the demo never shows a broken-avatar
  // glyph. Reads the name from data-name, falling back to alt. (A6 demo reliability.)
  function avatarFallback(img){
    const name = (img.getAttribute('data-name') || img.getAttribute('alt') || '').trim();
    const initials = name.split(/[ .@]/).filter(Boolean).slice(0,2).map(w=>w[0]).join('').toUpperCase() || '?';
    // A broken img with width:100% can report offsetWidth 0 — fall back to the
    // sized parent so the feed avatar circle matches its container exactly.
    const parent = img.parentElement;
    const w = img.offsetWidth || (parent && parent.offsetWidth) || parseInt(img.style.width, 10) || 40;
    const h = img.offsetHeight || (parent && parent.offsetHeight) || parseInt(img.style.height, 10) || w;
    const span = document.createElement('span');
    span.className = 'avatar-fallback';
    span.textContent = initials;
    span.style.width = w + 'px';
    span.style.height = h + 'px';
    span.style.fontSize = Math.max(11, Math.round(w * 0.4)) + 'px';
    img.replaceWith(span);
  }
  // Map category → loremflickr keywords for relevant fashion photos
  const _CAT_KW = {
    tops:'shirt,fashion', top:'shirt,fashion',
    bottoms:'pants,fashion', jeans:'jeans,denim',
    shorts:'shorts,fashion', trousers:'trousers,fashion',
    outerwear:'jacket,coat', jacket:'jacket,fashion',
    coat:'coat,fashion', shoes:'shoes,footwear',
    sneakers:'sneakers,shoes', boots:'boots,shoes',
    sandals:'sandals,shoes', accessories:'accessories,fashion',
    hat:'hat,cap', hats:'hat,fashion',
    bag:'handbag,fashion', dress:'dress,fashion',
    watches:'watch,fashion', jewelry:'jewelry,fashion',
  };
  function _productImgUrl(it) {
    if (it && it.image_url && (it.image_url.startsWith('http') || it.image_url.startsWith('/'))) return it.image_url;
    const cat = (it && (it.subcategory || it.category || '')).toLowerCase().replace(/[^a-z]/g,'');
    const kw  = _CAT_KW[cat] || 'clothing,fashion';
    const seed = (it && (it.id || it.name) || 'x').split('').reduce((a,c)=>a+c.charCodeAt(0),0);
    return `https://loremflickr.com/400/500/${kw}/all?lock=${seed}`;
  }
  function productImage(it, cls){
    const url = _productImgUrl(it);
    return `<img class="pi-img ${cls||''}" src="${attr(url)}" alt="${attr((it&&it.name)||'')}" loading="lazy" `+
      `data-cat="${attr((it&&it.category)||'')}" onload="this.classList.add('loaded')" onerror="this.onerror=null;imgFallback(this)">`;
  }
  // ---- real editorial/lifestyle photos (same Pollinations source + fallback contract as
  // productImage(), but a cinematic editorial prompt instead of a white-cutout product shot --
  // used for full-bleed hero imagery like onboarding, never for garment thumbnails). ----
  function editorialImage(q, alt, cls){
    const url = '/api/product-image?q=' + encodeURIComponent(q || 'fashion editorial');
    // data-cat intentionally omitted -- imgFallback()/catIcon() default to a clean
    // hanger glyph when no garment category applies (this is a lifestyle photo, not a product shot).
    return `<img class="pi-img ${cls||''}" src="${attr(url)}" alt="${attr(alt||'')}" loading="lazy" `+
      `onload="this.classList.add('loaded')" onerror="this.onerror=null;imgFallback(this)">`;
  }

  function esc(s)  { const d = document.createElement('div'); d.textContent = s ?? ''; return d.innerHTML; }
  function attr(s) { return String(s ?? '').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;'); }
  function fmtN(n) { n=Number(n)||0; return n>=1000?(n/1000).toFixed(1).replace('.0','')+'K':''+n; }
  // 1–2 UPPERCASE initials from a name; returns '?' when nothing usable (module-scope so renderCloset + wallet share it)
  function initials(name) {
    return (name||'?').split(/[ ._@]/).filter(Boolean).slice(0,2).map(s=>(s[0]||'')).join('').toUpperCase().slice(0,2) || '?';
  }

  // ---- navigation ----
  document.querySelectorAll('nav button[data-view]').forEach(b =>
    b.addEventListener('click', () => showView(b.dataset.view)));

  function showView(name) {
    document.querySelectorAll('nav button[data-view]').forEach(x =>
      x.classList.toggle('active', x.dataset.view === name));
    document.querySelectorAll('.view').forEach(v =>
      v.classList.toggle('active', v.id === name));
    mainEl.classList.toggle('feed-mode', name === 'feed');
    mainEl.classList.toggle('chat-mode', name === 'chat' || name === 'dm');
    // Hide the bottom tab bar in a full conversation (Abigail chat). The DM tab
    // decides per-screen below: list keeps the nav, an open thread hides it.
    document.querySelector('nav')?.classList.toggle('conv-nav-hidden', name === 'chat');
    if (name === 'home')      renderHome();
    if (name === 'closet')    renderCloset();
    if (name === 'feed')      renderFeed();
    if (name === 'explore')   initExplore();
    if (name === 'analytics') renderAnalytics();
    if (name === 'outfits')       initOutfitGen();
    if (name === 'rewards')        renderRewards();
    if (name === 'wallet')         renderWallet();
    if (name === 'agents')         renderAgents();
    if (name === 'sustainability') renderSustainability();
    if (name === 'marketplace')   renderMarketplace();
    if (name === 'publicclosets') renderPublicClosets();
    if (name === 'seasonal')      renderSeasonalReport();
    if (name === 'season-recap')  renderSeasonRecap(getActiveSeason());
    if (name === 'compare')       initCompare();
    if (name === 'shopping')      initShoppingFeed();
    if (name === 'admin')         renderAdminDashboard();
    if (name === 'stylists')      renderStylistMarketplace();
    if (name === 'wishlist')  renderWishlist();
    if (name === 'chat')      initChat();
    if (name === 'dm')        renderDM();
    if (name === 'user-profile') renderUserProfile();
    const hsn = document.getElementById('header-section-name');
    if (hsn) hsn.textContent = VIEW_TITLES[name] || name;
  }

  document.getElementById('capture-btn')?.addEventListener('click', () => {
    profileTab = 'closet'; showView('closet'); fileInput.click();
  });

  // ---- bottom sheet ----
  const sheetOverlay = document.getElementById('sheet-overlay');
  const buySheet     = document.getElementById('buy-sheet');
  const sheetBody    = document.getElementById('sheet-body');
  const sheetFooter  = document.getElementById('sheet-footer');

  // Brand wordmark SVGs for the "Where it sells" rows — instantly-recognizable,
  // monochrome (#111 on the white chip), tight viewBox so the mark fills 32px.
  // These are simple original lettermark renderings, not vendor logo files.
  // Unknown retailers fall back to an escaped 3-char text monogram (see storeLogo).
  // All marks normalized to one optical scale: WORDMARKS render ~10px tall
  // (shared cap-height) so ZARA/asos/H&M/MANGO/SHEIN read as equal-volume
  // strips; GLYPH marks (Nike/adidas/Depop "d"/Google bag) sit ~16-18px.
  // Long wordmarks (PULL&BEAR, BERSHKA) turn to mush at 28px width, so they
  // intentionally fall back to the text monogram instead (no SVG entry).
  const STORE_SVGS = {
    'ZARA': `<svg viewBox="0 0 100 30" width="28" height="10" aria-hidden="true" fill="#111"><text x="50" y="25" text-anchor="middle" font-family="Georgia,'Times New Roman',serif" font-size="30" font-weight="700" letter-spacing="2">ZARA</text></svg>`,
    'ASOS': `<svg viewBox="0 0 100 30" width="27" height="10" aria-hidden="true" fill="#111"><text x="50" y="25" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-size="30" font-weight="800" letter-spacing="-.5">asos</text></svg>`,
    'H&M':  `<svg viewBox="0 0 100 30" width="26" height="10" aria-hidden="true" fill="#111"><text x="50" y="25" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-size="30" font-weight="800" letter-spacing="-1">H&amp;M</text></svg>`,
    'Mango':`<svg viewBox="0 0 116 30" width="29" height="9.5" aria-hidden="true" fill="#111"><text x="58" y="25" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-size="27" font-weight="700" letter-spacing="3">MANGO</text></svg>`,
    'SHEIN':`<svg viewBox="0 0 116 30" width="29" height="9.5" aria-hidden="true" fill="#111"><text x="58" y="25" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-size="28" font-weight="800" letter-spacing="-.5">SHEIN</text></svg>`,
    'Nike': `<svg viewBox="0 0 100 40" width="26" height="10.4" aria-hidden="true" fill="#111"><path d="M9 26.5 92 .5C72 14 36 30 18 34.5c-5 1.2-8 1-9.6-1-1.9-2.4-.4-5 .6-7Z"/></svg>`,
    'adidas':`<svg viewBox="0 0 60 40" width="24" height="16" aria-hidden="true" fill="#111"><path d="M2 38 22 2l6 0L8 38Zm14 0L34 6l6 0L22 38Zm14 0L46 12l6 0L36 38Z"/></svg>`,
    'Depop':`<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="#111"><path d="M14 3h3.4v18H14v-1.5A5 5 0 0 1 9.6 21a6 6 0 0 1 0-12 5 5 0 0 1 4.4 2.5Zm-4 8.6a3.4 3.4 0 1 0 0 6.8 3.4 3.4 0 0 0 0-6.8Z"/></svg>`,
  };
  const STORE_LOGOS = {
    'ASOS':'ASOS', 'Zara':'Zara', 'H&M':'H&M', 'SHEIN':'SHN',
    'Depop':'DEP', 'adidas':'ADI', 'Nike':'NK', 'Mango':'MNG',
    'Pull&Bear':'P&B', 'Bershka':'BSK',
  };
  // Returns ready-to-inject SAFE HTML: a raw inline-SVG wordmark for known
  // retailers, or an esc()'d text monogram for anything else (XSS-safe).
  function storeLogo(name){
    const key = name || '';
    if(STORE_SVGS[key]) return STORE_SVGS[key];
    // case/spacing-insensitive match (e.g. 'Zara' vs 'ZARA')
    const norm = key.trim().toLowerCase();
    for(const k in STORE_SVGS){ if(k.toLowerCase() === norm) return STORE_SVGS[k]; }
    const txt = STORE_LOGOS[key] || key.slice(0,3).toUpperCase();
    return esc(txt);
  }
  function scopeLabel(s){
    if(s==='global') return 'Ships internationally';
    if(s==='il')     return 'Ships to Israel';
    return s || '';
  }

  // In-app sourcing row (informational, NOT an outbound link). Purchase happens
  // through AWEAR's own Buy button; this just names where the piece is sourced from.
  function storeRowHTML(opt){
    return `<div class="store-row" aria-label="Sourced from ${attr(opt.retailer)}">
      <div class="store-logo">${storeLogo(opt.retailer)}</div>
      <div style="flex:1;min-width:0">
        <div class="store-name">${esc(opt.retailer||'Store')}</div>
        <div class="store-scope">${esc(scopeLabel(opt.scope))}</div>
      </div>
    </div>`;
  }

  // Every purchase is in-app (Carmel: "every purchase through OUR app"). We no longer
  // send the buyer to any external retailer / shopping aggregator. For NEW retail the
  // user feels in-app; behind the scenes the backend fulfils via dropshipping/affiliate.
  // itemStores() is kept only to power the informational "Where it sells" sourcing rows
  // (no external navigation) — partner retailers, never Google.
  const AFF_RETAILERS=['ASOS','Depop','ZARA'];
  function buildBuyOptions(query){
    if(!query) return [];
    // No url -> the row is informational only (in-app), never an outbound link.
    return AFF_RETAILERS.map(retailer=>({retailer,scope:''}));
  }
  // an item always resolves to source stores (informational): use API buy_options,
  // else derive from its name/query. These NO LONGER carry external buy links.
  function itemStores(it){
    if(it.buy_options&&it.buy_options.length) return it.buy_options;
    return buildBuyOptions(it.search_query||it.q||it.name);
  }
  // Stable idempotency key for a Buy tap — same product within a 4s window dedups
  // server-side (POST /api/orders client_ref) so double-taps never double-order.
  function buyClientRef(it){
    const id = (it && (it.id || it.name || 'item')) || 'item';
    return String(id) + '_' + Math.floor(Date.now()/4000);
  }

  function openSheetSingle(it, earnAmt, influencerUser){
    logAdminEvent('buy_intent', 'Opened sheet: ' + (it.name||'item'));
    const earnLine = (earnAmt && influencerUser)
      ? `<p style="display:flex;align-items:center;justify-content:center;gap:5px;font-size:11.5px;color:var(--success,#52c97a);font-weight:700;margin-top:8px;text-align:center">
           ${icon('diamond',14)} @${esc(influencerUser)} earns a creator credit on this purchase
         </p>` : '';
    const wardrobe4compat = JSON.parse(localStorage.getItem('awear_wardrobe') || '[]');
    const csHTML = wardrobe4compat.length ? compatScoreHTML(it, wardrobe4compat) : '';

    sheetBody.innerHTML = `
      ${csHTML}
      <div class="sheet-hero">
        <div class="sheet-hero-img">${productImage(it)}</div>
        <div class="sheet-hero-info">
          <div class="sheet-hero-name">${esc(it.name)}</div>
          <div class="sheet-hero-brand">${esc(it.brand_vibe||'')}</div>
          <div class="sheet-hero-price">$${esc(it.price_estimate_usd)}</div>
        </div>
      </div>
      ${earnLine}
      <div style="height:16px"></div>`;

    // Resolve in-app purchase kind (preloved vs retail) once, so handleCheckout sends
    // the right kind + seller_key to /api/orders. Caller-supplied kind wins.
    _checkoutCtx = {it: {...it, kind: it.kind||itemKind(it), seller_key: it.seller_key||it.seller||''}, influencerUser: influencerUser || null};
    sheetFooter.innerHTML = it.price_estimate_usd
      ? `<button class="sheet-buy" data-action="checkout" aria-label="Buy ${attr(it.name)}">
           ${icon('bag',18)} Buy
           <span class="sheet-buy-price">$${esc(it.price_estimate_usd)}</span>
         </button>`
      : `<div style="text-align:center;color:var(--muted,#8a8498);font-size:var(--t-small,13px);padding:10px 0">Price not available for this item</div>`;

    showSheet();
    applyBuyRoute(it);   // hybrid buy routing via /api/resolve-product
  }

  // Ask the backend how to buy this item, then adapt the sheet:
  //  exact   -> keep in-app checkout, note the source store
  //  similar -> show "shop similar" alternatives (discontinued-item handling)
  //  archive -> own-it / resell message (never a dead end)
  // On any failure the default sheet is left untouched.
  async function applyBuyRoute(it){
    try{
      const p = new URLSearchParams({q: it.search_query||it.name||'', category: it.category||'', color: it.color||'', brand: it.brand_vibe||''});
      const res = await fetch('/api/resolve-product?'+p.toString()); if(!res.ok) return;
      const r = await res.json();
      if(r.status==='exact'){
        sheetBody.insertAdjacentHTML('beforeend',
          `<div style="display:flex;align-items:center;gap:6px;justify-content:center;color:var(--muted,#8a8498);font-size:12px;margin-top:-8px">${icon('check',13)} Sourced from ${esc(r.retailer||'partner store')}${r.checkout==='in_app'?' · in-app':''}</div>`);
      } else if(r.status==='similar' && (r.alternatives||[]).length){
        // In-app "shop similar": each alternative re-opens the AWEAR sheet for that
        // piece (data-buy-alt) — never an outbound redirect. Buy stays in-app.
        const alts=r.alternatives.slice(0,3);
        sheetBody.insertAdjacentHTML('beforeend',
          `<div style="margin-top:4px"><div style="font-weight:800;font-size:13px;margin-bottom:8px">Not sold new — shop similar</div><div style="display:flex;gap:8px;overflow-x:auto;scrollbar-width:none">${alts.map(a=>`<button type="button" class="buy-alt-card" data-buy-alt="${attr(JSON.stringify({name:a.brand,brand_vibe:a.brand,category:it.category||'',price_estimate_usd:a.price_usd,image_url:a.image_url,search_query:a.brand}))}" style="flex:0 0 100px;text-align:left;background:none;border:none;padding:0;cursor:pointer;font-family:inherit"><div style="aspect-ratio:3/4;border-radius:10px;overflow:hidden;background:var(--surface,#f3f1ec)"><img src="${attr(a.image_url)}" loading="lazy" data-cat="${attr(it.category||'')}" style="width:100%;height:100%;object-fit:cover" onerror="this.onerror=null;imgFallback(this)"></div><div style="font-size:11px;font-weight:700;color:var(--fg,#f0ecf5);margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(a.brand)}</div><div style="font-size:11px;color:var(--muted,#8a8498)">$${esc(a.price_usd)}</div></button>`).join('')}</div></div>`);
        sheetFooter.innerHTML = `<div style="text-align:center;color:var(--muted,#8a8498);font-size:13px;padding:8px 0">Pick a similar piece above — or keep it in your closet</div>`;
      } else if(r.status==='archive'){
        sheetFooter.innerHTML = `<div style="text-align:center;color:var(--muted,#8a8498);font-size:13px;padding:10px 0;line-height:1.5">${esc(r.message||'Not sold new anymore — style it from your closet or list it for resale.')}</div>`;
      }
    }catch(e){ /* keep default sheet */ }
  }

  // ---- AI stylist heuristic: build outfit combos from the user's closet ----
  // For a tapped item, pick complementary categories and prefer closet pieces that
  // share style_tags / color with it. Returns up to 3 combos, each = [item, ...closetPieces].
  const COMPLEMENTS = {
    top:       ['bottoms','shoes','bag','accessory','outerwear'],
    bottoms:   ['top','shoes','outerwear','bag'],
    dress:     ['shoes','bag','outerwear','accessory'],
    outerwear: ['top','bottoms','shoes','dress'],
    shoes:     ['top','bottoms','dress','bag'],
    bag:       ['top','dress','shoes','bottoms'],
    accessory: ['top','dress','bottoms','outerwear'],
    jewelry:   ['top','dress','outerwear'],
    hat:       ['top','dress','outerwear'],
  };
  const COMBO_CAPTIONS = ['Pairs with','Evening look','Everyday casual','A look from your closet'];
  function itemTagSet(it){
    const s=new Set();((it&&it.style_tags)||[]).forEach(t=>s.add(String(t).toLowerCase()));
    if(it&&it.color) s.add(String(it.color).toLowerCase());
    return s;
  }
  // score a closet piece by tag/color overlap with the source item (higher = better match)
  function affinity(src,cand){
    const a=itemTagSet(src), b=itemTagSet(cand); let score=0;
    b.forEach(t=>{if(a.has(t))score++;});
    if(src.color&&cand.color&&String(src.color).toLowerCase()===String(cand.color).toLowerCase())score+=1;
    return score;
  }
  function closetCombos(item, fallbackPool){
    const wardrobe=loadWardrobe();
    const cat=(item.category||'').toLowerCase();
    const order=COMPLEMENTS[cat]||['top','bottoms','shoes'];
    // group closet by category, each list sorted by affinity to the source item
    const byCat={};
    wardrobe.forEach(it=>{
      const c=(it.category||'').toLowerCase();
      if(!c||c===cat&&it.name===item.name) return; // don't pair an item with itself
      (byCat[c]=byCat[c]||[]).push(it);
    });
    Object.keys(byCat).forEach(c=>byCat[c].sort((x,y)=>affinity(item,y)-affinity(item,x)));
    const used=new Set();
    const take=cands=>{
      for(const it of (cands||[])){const k=it.name+'|'+it.category; if(!used.has(k)){used.add(k);return it;}}
      return null;
    };
    const combos=[];
    // primary combos from the closet: each pairs the item with 1-2 complementary pieces
    for(let i=0;i<order.length&&combos.length<3;i++){
      const c=order[i];
      const first=take(byCat[c]); if(!first)continue;
      const pieces=[first];
      // try to add a second complementary piece from a different category
      for(let j=0;j<order.length;j++){
        if(order[j]===c)continue;
        const second=take(byCat[order[j]]);
        if(second){pieces.push(second);break;}
      }
      combos.push({caption:COMBO_CAPTIONS[Math.min(combos.length,COMBO_CAPTIONS.length-1)],pieces});
    }
    // fallback: complement with other items from the same post (different category),
    // so a sparse/empty closet still shows at least one styled combination
    if(combos.length<2 && fallbackPool && fallbackPool.length){
      const others=fallbackPool.filter(x=>x.name!==item.name && (x.category||'').toLowerCase()!==cat
        && !used.has(x.name+'|'+x.category));
      if(others.length){
        combos.push({caption:'From this look',pieces:others.slice(0,2),fromPost:true});
      }
    }
    return combos;
  }

  function comboHTML(item,combo){
    // Flat-lay collage: this item (hero) styled with its complementary closet pieces,
    // then a quiet legend naming each piece so the look stays shoppable/scannable.
    const lookItems=[item, ...combo.pieces];
    const collage=flatLayCollageHTML(lookItems, { heroOf:(x)=>x===item });
    const legend=lookItems.map((p,i)=>
      `<span class="combo-leg${i===0?' is-this':''}">${esc(p.name)}</span>`
    ).join('');
    return `<div class="combo">
      <div class="combo-cap"><span class="dot"></span>${esc(combo.caption)}</div>
      ${collage}
      <div class="combo-legend">${legend}</div>
    </div>`;
  }

  // ---- Whering-style flat-lay collage (reusable; used in item sheet + Build Look) ----
  // Arranges garment images by category ZONE inside a fixed-aspect canvas (not a flat grid):
  //   outerwear/top → upper-centre · dress → centre · bottoms/skirt → lower-centre ·
  //   shoes → bottom · bag → lower side · hat/accessory/jewelry → upper side.
  // Real product photo via productImage(); line-art catIcon fallback baked in by imgFallback().
  function flatLayZone(cat){
    const c=(cat||'').toLowerCase();
    const ic=CAT_ICON[c]||'hanger';
    if(ic==='hoodie') return 'zone-outer';                       // jackets/coats/blazers
    if(ic==='shirt') return 'zone-top';
    if(ic==='dress') return 'zone-dress';
    if(ic==='pants'||ic==='skirt') return 'zone-bottom';
    if(ic==='shoe') return 'zone-shoes';
    if(ic==='bag') return 'zone-bag';
    if(ic==='cap') return 'zone-hat';
    if(ic==='diamond'||ic==='watch'||ic==='sparkle') return 'zone-accessory';
    return 'zone-extra';
  }
  // items: array of garment objects ({category,name,image_url,...}). Optional opts.zoneOf(item)->className
  // lets callers force a zone (e.g. mark "this" item). Returns one .flatlay block.
  function flatLayCollageHTML(items, opts){
    const list=(items||[]).filter(Boolean).slice(0,6);
    if(!list.length){
      return `<div class="flatlay flatlay-empty"><div class="fl-empty">${icon('hanger',30)}</div></div>`;
    }
    const used={};
    const cells=list.map(it=>{
      let zone=(opts&&opts.zoneOf&&opts.zoneOf(it))||flatLayZone(it.category);
      // de-collide: if a zone is already taken, demote to the generic side slot so nothing overlaps
      if(used[zone]) zone='zone-extra'+(used['zone-extra']?'-b':'');
      used[zone]=(used[zone]||0)+1;
      const isHero=opts&&opts.heroOf&&opts.heroOf(it);
      const img=(opts&&opts.imgOf&&opts.imgOf(it))||productImage(it);
      const overlay=(opts&&opts.overlayOf&&opts.overlayOf(it))||'';
      const attrs=(opts&&opts.cellAttrsOf&&opts.cellAttrsOf(it))||'';
      const cls=(opts&&opts.cellClassOf&&opts.cellClassOf(it))||'';
      return `<div class="fl-cell ${zone}${isHero?' fl-hero':''}${cls?' '+cls:''}"${attrs?' '+attrs:''}>
        <div class="fl-img">${img}</div>${overlay}
      </div>`;
    }).join('');
    return `<div class="flatlay">${cells}</div>`;
  }

  // Hero match band: prominent "% match to your closet" directly under the item image.
  // Uses calcCompatScore() {pct, matches:[closetItemNames]} — tier colors the NUMBER + chip borders only.
  function matchBandHTML(it, wardrobe){
    // Empty closet → inviting state, NOT 0%. Same band footprint.
    if(!wardrobe.length){
      return `<div class="match-band match-band-empty">
        <span class="match-band-icon">${icon('hanger',22)}</span>
        <div class="match-band-empty-copy">
          <div class="match-band-empty-title">Add clothes to see your match</div>
          <div class="match-band-label">We compare every piece to what you already own</div>
        </div>
        <button class="match-band-cta" onclick="closeSheet();showView('closet')">Build your closet</button>
      </div>`;
    }
    const {pct, matches} = calcCompatScore(it, wardrobe);
    const tier = pct>=80 ? 'high' : pct>=60 ? 'mid' : 'low';
    const tierColor = pct>=80 ? 'var(--success,#52c97a)' : pct>=60 ? 'var(--accent2,#c4855a)' : 'var(--accent,#e8526a)';
    // Plain-English reason
    let reason;
    if(matches.length>0){
      if(matches.length===1) reason = `Pairs with your ${esc(matches[0])}.`;
      else if(matches.length===2) reason = `Pairs with your ${esc(matches[0])} and ${esc(matches[1])}.`;
      else reason = `Pairs with ${matches.length} pieces you already own.`;
    } else {
      reason = 'A fresh direction for your closet.';
    }
    const chips = matches.slice(0,3)
      .map(m=>`<span class="match-chip" style="border-color:${tierColor}">${esc(m)}</span>`)
      .join('');
    // Progress ring: r=34 → circumference ≈ 213.6. animateMatchBand() fills it on open.
    const R = 34, LEN = +(2 * Math.PI * R).toFixed(2);
    return `<div class="match-band match-band-${tier}">
      <div class="match-band-ring">
        <svg width="92" height="92" viewBox="0 0 92 92" aria-hidden="true">
          <circle class="match-band-ring-track" cx="46" cy="46" r="${R}" fill="none"
            stroke="var(--line,#2e2836)" stroke-width="6"/>
          <circle class="match-band-ring-fill" cx="46" cy="46" r="${R}" fill="none"
            stroke="${tierColor}" stroke-width="6" stroke-linecap="round"
            data-target="${pct}" data-len="${LEN}"
            style="stroke-dasharray:${LEN};stroke-dashoffset:${LEN};transform:rotate(-90deg);transform-origin:46px 46px"/>
        </svg>
        <div class="match-band-num" data-target="${pct}" style="color:${tierColor}">0<span class="match-band-pct">%</span></div>
      </div>
      <div class="match-band-label">match to your closet</div>
      <div class="match-band-reason">${reason}</div>
      ${chips?`<div class="match-band-chips">${chips}</div>`:''}
    </div>`;
  }

  // full item detail sheet: real photo -> match% -> closet combos (AI stylist) -> buy
  function openSheetItem(item, fallbackPool){
    const it=item||{};
    logAdminEvent('buy_intent', 'Opened sheet: ' + (it.name||'item'));
    const stores=itemStores(it);
    const wardrobe=loadWardrobe();
    const hasCloset=wardrobe.length>0;
    const matchBand = matchBandHTML(it, wardrobe);
    const combos=closetCombos(it,fallbackPool);
    const combosHTML = combos.length
      ? combos.map(c=>comboHTML(it,c)).join('')
      : `<div class="combo-empty">${icon('hanger',32)}<div>Snap more items into your closet<br/>so the stylist can build looks from clothes you already own.</div></div>`;

    // chunk 3 — "Where it sells": editorial price headline + real retailers + one resale signal row.
    const basePrice = Number(it.price_estimate_usd||it.price||0);
    // retail rows reuse storeRowHTML; Depop is excluded here so it appears only as the resale row below.
    // give each retail row an HONEST scope subtitle when empty so every row is two-line (keeps the
    // resale row in the same rhythm) — "Shop new" states a real fact (new vs resale), not a fake
    // inventory claim like "In stock" that we can't actually back (survey trust flag, ayalon).
    const retailRows = stores.filter(o=>o&&o.retailer!=='Depop').map(o=>storeRowHTML({...o, scope:o.scope||'Shop new'})).join('');
    // resale = canonical RESALE_SUGGESTION_PCT (app.py:242 = 0.5). Omit row entirely when price is unknown.
    const resale = Math.round(basePrice * 0.5);
    const resaleRow = basePrice ? storeRowHTML({
      retailer:'Depop',
      url:'https://www.depop.com/search/?q='+encodeURIComponent(it.search_query||it.name||''),
      scope:'Resale est. $'+resale
    }) : '';
    const whereHTML = `
      <div class="stylist-h2" style="margin-top:var(--space-6,24px)">${icon('tag',16)} Where it sells</div>
      ${basePrice ? `<div class="wis-from">From $${esc(basePrice)}</div>` : ''}
      <div class="sheet-stores">${retailRows}${resaleRow}</div>`;

    const priceVal = it.price_estimate_usd||it.price||0;
    sheetBody.innerHTML = `
      <div class="item-hero">
        <span class="item-hero-cat">${icon(catIcon(it.category),14)} ${esc(catLabel(it.category))}</span>
        ${productImage(it)}
      </div>
      <div class="pdp-head">
        ${it.brand_vibe?`<div class="pdp-brand">${esc(it.brand_vibe)}</div>`:''}
        <div class="pdp-title">${esc(it.name)}</div>
        <div class="pdp-pricerow">
          <span class="pdp-price">$${esc(priceVal)}</span>
          <span class="pdp-cat">${icon(catIcon(it.category),13)} ${esc(catLabel(it.category))}</span>
        </div>
      </div>
      ${matchBand}
      <div class="stylist-h2">${icon('sparkle',16)} Stylist picks</div>
      <div class="stylist-sub">Looks that pair this item with clothes from your closet</div>
      ${combosHTML}
      ${whereHTML}
      <div style="height:8px"></div>`;

    // In-app Buy — purchase happens through AWEAR, never a redirect to an external store.
    _checkoutCtx = { it: {...it, kind: itemKind(it), seller_key: it.seller_key||it.seller||''}, influencerUser: null };
    sheetFooter.innerHTML = priceVal
      ? `<button class="sheet-buy" data-action="checkout" aria-label="Buy ${attr(it.name)}">
           ${icon('bag',18)} Buy
           <span class="sheet-buy-price">$${esc(priceVal)}</span>
         </button>`
      : `<div style="text-align:center;color:var(--muted);font-size:var(--t-small);padding:10px 0">Price not available for this item yet</div>`;

    showSheet();
  }
  // A buy is preloved (P2P second-hand, 8% AWEAR commission) when the item is a
  // community/resale listing — flagged by isNew===false, a seller handle, or a
  // condition grade. Everything else is retail (in-app dropshipping/affiliate facade).
  function itemKind(it){
    if(!it) return 'retail';
    if(it.kind==='preloved'||it.kind==='retail') return it.kind;
    const preloved = it.isNew===false || !!it.seller || !!it.seller_key ||
                     !!it.condGrade || !!it.condition || it.preloved===true;
    return preloved ? 'preloved' : 'retail';
  }

  function openSheetLook(label, items, totalPrice, earnAmt, influencerUser){
    const list = items||[];
    // BE-002: the displayed "Look total" must equal the sum of the rows shown below.
    // Derive it from the items themselves; only trust the caller's number if none are priced.
    const itemsSum = list.reduce((s,it)=>s+(Number(it.price_estimate_usd||it.price)||0),0);
    totalPrice = itemsSum>0 ? itemsSum : (Number(totalPrice)||0);
    const rows = list.map(it => {
      return `<div class="sheet-look-row">
        <div class="sheet-look-emoji">${productImage(it)}</div>
        <div class="sheet-look-name">${esc(it.name)}</div>
        <div class="sheet-look-price">$${esc(it.price_estimate_usd||it.price||0)}</div>
      </div>`;
    }).join('');
    const earnLine = (earnAmt && influencerUser)
      ? `<p style="display:flex;align-items:center;justify-content:center;gap:5px;font-size:11.5px;color:var(--success,#52c97a);font-weight:700;margin-top:4px;text-align:center">
           ${icon('diamond',14)} @${esc(influencerUser)} earns a creator credit on this purchase
         </p>` : '';

    sheetBody.innerHTML = `
      <div style="font-weight:900;font-size:var(--t-h3,15px);margin-bottom:14px;letter-spacing:-.2px">
        ${esc(label)} · ${list.length} items
      </div>
      <div class="sheet-look-list">${rows}</div>
      <div class="sheet-total">
        <span class="sheet-total-label">Look total</span>
        <span class="sheet-total-amt">$${esc(totalPrice)}</span>
      </div>
      ${earnLine}
      <div style="height:8px"></div>`;

    _checkoutCtx = {items: list, influencerUser: influencerUser || null, totalPrice};
    sheetFooter.innerHTML = totalPrice
      ? `<button class="sheet-buy" data-action="checkout-look" aria-label="Buy this look">
           ${icon('bag',18)} Buy This Look
           <span class="sheet-buy-price">$${esc(totalPrice)}</span>
         </button>`
      : `<div style="text-align:center;color:var(--muted,#8a8498);font-size:var(--t-small,13px);padding:8px 0">Explore items above</div>`;

    showSheet();
  }

  function showSheet(){
    sheetOverlay.classList.add('show');
    buySheet.classList.add('show');
    buySheet.setAttribute('aria-hidden','false');
    // lock page scroll behind the sheet (the .sheet-scroll handles its own scroll)
    document.body.classList.add('sheet-open');
    const sb = document.getElementById('sheet-body');
    if(sb) sb.scrollTop = 0;
    // animate the match% reveal once the sheet is on screen
    requestAnimationFrame(()=> animateMatchBand());
    // focus trap — focus on first focusable element inside sheet
    requestAnimationFrame(()=>{
      const first = buySheet.querySelector('button, a');
      if(first) first.focus();
    });
  }
  function closeSheet(){
    sheetOverlay.classList.remove('show');
    buySheet.classList.remove('show');
    buySheet.setAttribute('aria-hidden','true');
    // ALWAYS restore page scroll + clear any in-flight drag transform/transition
    document.body.classList.remove('sheet-open');
    buySheet.style.transition = '';
    buySheet.style.transform = '';
  }
  sheetOverlay.addEventListener('click', closeSheet);

  // PULL-TO-DISMISS on the WHOLE sheet (like every native bottom sheet): drag down anywhere to
  // close. Gated on the content being scrolled to the top, so mid-content scrolling still works.
  // This is the primary, reliable close — it does NOT depend on the tiny X being on-screen (which
  // could sit behind the iOS status bar). Works with pointer + touch.
  {
    let sy = null, dragging = false;
    const scroller = () => document.getElementById('sheet-body');
    const start = (y, target) => {
      if (target && target.closest && target.closest('button, a, input, .sheet-buy')) { sy = null; return; }
      const sc = scroller();
      if (sc && sc.scrollTop > 0) { sy = null; return; }   // let content scroll first
      sy = y; dragging = false;
    };
    const move = (y, ev) => {
      if (sy === null) return;
      const dy = y - sy;
      const sc = scroller();
      if (dy > 4 && (!sc || sc.scrollTop <= 0)) {
        dragging = true;
        buySheet.style.transition = 'none';
        buySheet.style.transform = `translateY(${Math.max(0, dy)}px)`;
        if (ev && ev.cancelable) { try { ev.preventDefault(); } catch(_){} }
      }
    };
    const end = (y) => {
      if (sy === null) return;
      const dy = (y || 0) - sy; sy = null;
      buySheet.style.transition = '';
      buySheet.style.transform = '';
      if (dragging && dy > 90) closeSheet();
      dragging = false;
    };
    buySheet.addEventListener('pointerdown',  e => start(e.clientY, e.target));
    buySheet.addEventListener('pointermove',  e => move(e.clientY, e), { passive: false });
    buySheet.addEventListener('pointerup',    e => end(e.clientY));
    buySheet.addEventListener('pointercancel',() => end(null));
    // touch fallback for iOS WebViews where pointer events are flaky
    buySheet.addEventListener('touchstart', e => start(e.touches[0].clientY, e.target), { passive: true });
    buySheet.addEventListener('touchmove',  e => move(e.touches[0].clientY, e),        { passive: false });
    buySheet.addEventListener('touchend',   e => end((e.changedTouches[0]||{}).clientY));
  }
  // BULLETPROOF CLOSE — a capture-phase listener on document fires BEFORE any grab/drag logic
  // or async re-render, so the X (or its child svg/path) ALWAYS dismisses the sheet. This is the
  // deterministic fix for the flaky "sheet opens but won't close" bug (it depended on animation
  // timing + pointer capture). Guarded to the X only, so nothing else is affected.
  const _closeIfX = (e) => {
    const x = e.target && e.target.closest && e.target.closest('#sheet-close');
    if (x) { e.stopPropagation(); closeSheet(); }
  };
  document.addEventListener('touchend',   (e) => _closeIfX(e, 'touchend'),   true);
  document.addEventListener('click',      (e) => _closeIfX(e, 'click'),      true);
  document.addEventListener('pointerdown',(e) => _closeIfX(e, 'pointerdown'),true);

  // Count up the hero match% from 0 → target on sheet open (≤600ms).
  // Respects prefers-reduced-motion (jumps straight to the value).
  function animateMatchBand(){
    const numEl = buySheet.querySelector('.match-band-num[data-target]');
    if(!numEl) return;
    const target = parseInt(numEl.getAttribute('data-target'), 10) || 0;
    const pctSpan = numEl.querySelector('.match-band-pct');
    const pctHTML = pctSpan ? pctSpan.outerHTML : '';
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ring = buySheet.querySelector('.match-band-ring-fill[data-target]');
    if(ring){
      const len = parseFloat(ring.getAttribute('data-len')) || 0;
      ring.style.strokeDashoffset = String(len - (len * target / 100));
    }
    if(reduce || target <= 0){
      numEl.firstChild && (numEl.firstChild.nodeValue = String(target));
      return;
    }
    const dur = 600, start = performance.now();
    function step(now){
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      const val = Math.round(target * eased);
      numEl.innerHTML = val + pctHTML;
      if(p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  // ---- In-App Checkout ----
  function handleCheckout() {
    if (!_checkoutCtx || !_checkoutCtx.it) return;
    const {it, influencerUser} = _checkoutCtx;
    sheetFooter.innerHTML = `<div class="checkout-processing"><div class="co-spin"></div><div class="co-label">Placing your order…</div></div>`;
    // In-app order via POST /api/orders. kind=preloved (8% AWEAR commission, P2P) vs
    // retail (dropshipping/affiliate facade). client_ref makes double-taps idempotent.
    const price = Number(it.price_estimate_usd||it.price||0);
    fetch('/api/orders', {method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({product_name: it.name||'', product_id: it.id||'',
        amount_usd: price, price: price, kind: it.kind||'retail', seller_key: it.seller_key||'',
        client_ref: buyClientRef(it), influencer_id: influencerUser||'', post_id:''})
    }).then(r=>{ if(!r.ok) throw new Error('order http '+r.status); })
      .catch(err=>{ // never fail silently — surface to logs/admin (optimistic UI already shown)
        console.error('[orders] POST failed', err);
        logAdminEvent('order_error', 'Order POST failed: '+(it.name||'item')); });
    setTimeout(() => {
      const w = loadWardrobe();
      if (!w.find(x => x.name === it.name)) {
        w.unshift({name:it.name, category:it.category||'', price_estimate_usd:it.price_estimate_usd||0,
          search_query:it.search_query||it.name, style_tags:it.style_tags||[],
          image_url:it.image_url||'', brand_vibe:it.brand_vibe||it.brand||'', id:it.id||('p_'+Date.now()),
          ts:Date.now(), from_purchase:true});
        saveWardrobe(w);
      }
      if (influencerUser) {
        try {
          const credits = JSON.parse(localStorage.getItem(CREDITS_KEY)||'[]');
          credits.unshift({id:'c_'+Date.now(), from:influencerUser, item:it.name,
            amount:+((it.price_estimate_usd||0)*0.05).toFixed(2), ts:Date.now()});
          localStorage.setItem(CREDITS_KEY, JSON.stringify(credits));
        } catch(e){}
      }
      const creditLine = influencerUser
        ? `<div class="co-credit">${icon('diamond',12)} @${esc(influencerUser)} earned a creator credit</div>` : '';
      sheetFooter.innerHTML = `<div class="checkout-success">
        <div class="co-check">${icon('checkCircle',24)}</div>
        <div class="co-title">Order confirmed!</div>
        <div class="co-sub">${esc(it.name)} added to your closet</div>
        ${creditLine}
        <button class="co-goto-btn" data-action="goto-closet">View in Closet</button>
      </div>`;
      logAdminEvent('purchase', 'Bought: '+(it.name||'item')+(influencerUser?' via @'+influencerUser:''));
      showToast('Added to your closet');
    }, 1800);
  }

  function handleLookCheckout() {
    if (!_checkoutCtx || !_checkoutCtx.items) return;
    const {items, influencerUser, totalPrice} = _checkoutCtx;
    sheetFooter.innerHTML = `<div class="checkout-processing"><div class="co-spin"></div><div class="co-label">Placing your order…</div></div>`;
    // In-app order — the whole look as a single retail order. client_ref (item count +
    // total in a 4s window) makes double-taps idempotent server-side.
    fetch('/api/orders', {method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({product_name: items.length+'-item look', product_id:'',
        amount_usd: totalPrice||0, price: totalPrice||0, kind:'retail', seller_key:'',
        client_ref: buyClientRef({id:'look_'+items.length+'_'+(totalPrice||0)}),
        influencer_id: influencerUser||'', post_id:''})
    }).then(r=>{ if(!r.ok) throw new Error('order http '+r.status); })
      .catch(err=>{ console.error('[orders] look POST failed', err);
        logAdminEvent('order_error', 'Look order POST failed ('+items.length+' items)'); });
    setTimeout(() => {
      const w = loadWardrobe();
      items.forEach((it,i) => {
        if (!w.find(x => x.name === it.name)) {
          w.unshift({name:it.name, category:it.category||'', price_estimate_usd:it.price_estimate_usd||0,
            search_query:it.search_query||it.name, style_tags:it.style_tags||[],
            image_url:it.image_url||'', brand_vibe:it.brand_vibe||it.brand||'', id:it.id||('p_'+Date.now()+'_'+i),
            ts:Date.now(), from_purchase:true});
        }
      });
      saveWardrobe(w);
      if (influencerUser) {
        try {
          const credits = JSON.parse(localStorage.getItem(CREDITS_KEY)||'[]');
          credits.unshift({id:'c_'+Date.now(), from:influencerUser, item:`${items.length}-item look`,
            amount:+((totalPrice||0)*0.05).toFixed(2), ts:Date.now()});
          localStorage.setItem(CREDITS_KEY, JSON.stringify(credits));
        } catch(e){}
      }
      const creditLine = influencerUser
        ? `<div class="co-credit">${icon('diamond',12)} @${esc(influencerUser)} earned a creator credit</div>` : '';
      sheetFooter.innerHTML = `<div class="checkout-success">
        <div class="co-check">${icon('checkCircle',24)}</div>
        <div class="co-title">Look ordered!</div>
        <div class="co-sub">${items.length} items added to your closet</div>
        ${creditLine}
        <button class="co-goto-btn" data-action="goto-closet">View in Closet</button>
      </div>`;
      logAdminEvent('purchase', `Bought look: ${items.length} items`+(influencerUser?' via @'+influencerUser:''));
      showToast(`${items.length} items added to your closet`);
    }, 1800);
  }

  sheetFooter.addEventListener('click', e => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    if (btn.dataset.action === 'checkout') handleCheckout();
    if (btn.dataset.action === 'checkout-look') handleLookCheckout();
    if (btn.dataset.action === 'goto-closet') { closeSheet(); showView('closet'); }
    if (btn.dataset.action === 'view-seller-profile') {
      if (!_mpSheetStore) return;
      closeSheet();
      openUserProfile(_mpSheetStore);
    }
  });

  // In-app "shop similar" alternatives — re-open the AWEAR sheet for the chosen
  // piece (never an external redirect). Buy stays inside the app.
  sheetBody.addEventListener('click', e => {
    const alt = e.target.closest('[data-buy-alt]');
    if (!alt) return;
    try { openSheetSingle(JSON.parse(alt.dataset.buyAlt), 0, ''); } catch(err){}
  });

  document.querySelector('main').addEventListener('click', e => {
    const profileTap = e.target.closest('[data-open-profile]');
    if (profileTap && profileTap.dataset.openProfile) {
      openUserProfile(profileTap.dataset.openProfile);
      return;
    }
    const buyBtn = e.target.closest('[data-buy]');
    if (buyBtn && !buyBtn.classList.contains('buy-action')) {
      // "Shop the look" button (shop-look) — try to use wardrobe items for look sheet
      const label = buyBtn.dataset.label || 'the look';
      const price = buyBtn.dataset.price;
      const wardrobe = loadWardrobe();
      const meta = loadMeta();
      if (wardrobe.length && meta.look_total_usd != null) {
        openSheetLook(label, wardrobe, price, 0, '');
      } else {
        // single synthetic item fallback
        const synth = { name: label, brand_vibe: 'Awear', category: 'top',
                        price_estimate_usd: price, buy_options: [] };
        openSheetSingle(synth, 0, '');
      }
      return;
    }
    const buyAction = e.target.closest('.buy-action');
    if (buyAction) {
      const post = feedPostById(buyAction.closest('[data-id]')?.dataset.id);
      if (!shopPostItems(post, buyAction.dataset.label, buyAction.dataset.price, buyAction.dataset.earn, buyAction.dataset.user)) {
        const synth = {name:buyAction.dataset.label, category:'top', price_estimate_usd:buyAction.dataset.price, buy_options:[]};
        openSheetSingle(synth, buyAction.dataset.earn, buyAction.dataset.user);
      }
      return;
    }
  });

  // ".pbuy" buttons inside .ptile tiles (closet shelves) — intercept before main listener
  document.getElementById('closet-body').addEventListener('click', e => {
    const pbuy = e.target.closest('.pbuy[data-buy]');
    if (!pbuy) return;
    e.stopPropagation(); // prevent main listener from also firing
    const label  = pbuy.dataset.label;
    const price  = pbuy.dataset.price;
    const wardrobe = loadWardrobe();
    const it = wardrobe.find(x => x.name === label) || {
      name: label, brand_vibe: '', category: 'top',
      price_estimate_usd: price, buy_options: []
    };
    openSheetSingle(it, 0, '');
  }, true); // capture phase — runs before main's bubble listener

  // ---- analyze ----
  function readDataURL(file) {
    return new Promise(res => { const r=new FileReader(); r.onload=()=>res(r.result); r.onerror=()=>res(null); r.readAsDataURL(file); });
  }

  // A6 demo reliability: client-side fallback used when /api/analyze is unreachable.
  // Mirrors _DEMO_OUTFITS in app.py — 3 realistic outfits with real retailer image_urls.
  const _SCAN_DEMO_OUTFITS = [
    {
      items: [
        {category:'top', name:'White Ribbed Crop Top', color:'white', brand_vibe:'Zara',
         style_tags:['minimal','y2k'], search_query:'white ribbed cropped sleeveless tank top women',
         price_estimate_usd:25, image_url:'https://image.hm.com/assets/hm/59/12/591234ce7947b24f9bbb9ce0abf536e0d0551563.jpg'},
        {category:'bottoms', name:'Barrel-Leg Light Wash Denim', color:'light blue', brand_vibe:"Levi's",
         style_tags:['denim','y2k','casual'], search_query:'barrel leg light wash jeans women',
         price_estimate_usd:80, image_url:'https://n.nordstrommedia.com/it/15963ac9-5f3f-4207-b119-a021e1db52e7.jpeg?h=368&w=240&dpr=2'},
        {category:'shoes', name:'Adidas Samba OG White', color:'white/black', brand_vibe:'Adidas',
         style_tags:['retro','sporty','iconic'], search_query:'adidas samba og white black sneakers',
         price_estimate_usd:120, image_url:'https://assets.adidas.com/images/w_1880,f_auto,q_auto/c68f09963c6e47dcad68ac010115a208_9366/Stan_Smith_Shoes_White_FX5500_01_standard.jpg'},
      ],
      overall_style:'Y2K Minimal', occasion:'Everyday / Coffee shop', trend_score:91,
      summary:'Clean Y2K-inspired look — white crop with barrel denim and Sambas. Effortless and on-trend.',
      stylist_tip:'Add a slim gold chain and a mini shoulder bag to elevate this look from casual to polished.',
    },
    {
      items: [
        {category:'outerwear', name:'Oversized Camel Blazer', color:'camel', brand_vibe:'& Other Stories',
         style_tags:['preppy','minimal','smart-casual'], search_query:'oversized camel blazer women wool',
         price_estimate_usd:150, image_url:'https://static.zara.net/assets/public/9885/e922/a0be46659e56/661cb395b150/08769916400-p/08769916400-p.jpg'},
        {category:'bottoms', name:'Straight-Leg Black Trousers', color:'black', brand_vibe:'COS',
         style_tags:['minimal','office','classic'], search_query:'straight leg black tailored trousers women',
         price_estimate_usd:70, image_url:'https://n.nordstrommedia.com/it/742c046e-df5e-4844-95b4-61e1096c97ed.jpeg?crop=pad&pad_color=FFF&format=jpeg&trim=color&trimcolor=FFF&w=780&h=1196'},
        {category:'shoes', name:'Pointed-Toe Leather Mules', color:'black', brand_vibe:'Mango',
         style_tags:['minimal','elegant'], search_query:'pointed toe black leather mules women',
         price_estimate_usd:60, image_url:'https://cdn.shopify.com/s/files/1/0610/1440/9428/files/10MM18-VENICE-20118-CASTAN.jpg'},
      ],
      overall_style:'Minimal Chic', occasion:'Office / Dinner', trend_score:88,
      summary:'Sharp minimal look — camel blazer over black trousers reads confident and effortless.',
      stylist_tip:'Try a simple white tee under the blazer instead of nothing — softens the look for daytime.',
    },
    {
      items: [
        {category:'top', name:'Vintage Band Graphic Tee', color:'black', brand_vibe:'vintage',
         style_tags:['streetwear','vintage','grunge'], search_query:'vintage black band graphic tee oversized',
         price_estimate_usd:35, image_url:'https://images.urbndata.com/is/image/UrbanOutfitters/89759898_049_b?$xlarge$&fit=constrain&qlt=80&wid=614'},
        {category:'bottoms', name:'Baggy Cargo Pants Khaki', color:'khaki', brand_vibe:'Carhartt',
         style_tags:['streetwear','utility','y2k'], search_query:'baggy cargo pants khaki women utility',
         price_estimate_usd:90, image_url:'https://is4.revolveassets.com/images/p4/n/uv/RTAR-WJ45_V1.jpg'},
        {category:'shoes', name:'New Balance 550 White Cream', color:'white/cream', brand_vibe:'New Balance',
         style_tags:['retro','sporty','streetwear'], search_query:'new balance 550 white cream sneakers',
         price_estimate_usd:110, image_url:'https://assets.adidas.com/images/w_1880,f_auto,q_auto/7f58eea8063344908fafb96773b13a1e_9366/Superstar_Shoes_White_EG4958_01_standard.jpg'},
        {category:'bag', name:'Mini Crossbody Black Canvas', color:'black', brand_vibe:'streetwear',
         style_tags:['streetwear','everyday'], search_query:'mini black canvas crossbody bag streetwear',
         price_estimate_usd:30, image_url:'https://shop.mango.com/assets/rcs/pics/static/T8/fotos/S/87046714_CU_B.jpg?ts=1714729382668'},
      ],
      overall_style:'Urban Streetwear', occasion:'Weekend / Street', trend_score:94,
      summary:'Strong streetwear moment — vintage tee, cargo utility, NB550s. Authentic and well-layered.',
      stylist_tip:'Tuck the front of the tee halfway into the cargos for more shape — it balances the baggy silhouette.',
    },
  ];

  fileInput.addEventListener('change', async () => {
    const file=fileInput.files[0]; if(!file) return;
    closetBody.innerHTML='<div class="loading"><div class="spinner"></div><p>AI is identifying your items…</p></div>';
    const photoP=readDataURL(file), fd=new FormData(); fd.append('photo',file);
    const uid=getOrCreateUserId();
    const ctrl=new AbortController(), timer=setTimeout(()=>ctrl.abort(),30000);
    try {
      const res=await fetch('/api/analyze?user_id='+encodeURIComponent(uid),{method:'POST',body:fd,signal:ctrl.signal});
      if(!res.ok){const e=await res.json().catch(()=>({}));throw new Error(e.detail||'Error '+res.status);}
      const data=await res.json(); data.photo=await photoP; showScanConfirm(data,uid);
    } catch(_err) {
      const pick=_SCAN_DEMO_OUTFITS[Math.floor(_SCAN_DEMO_OUTFITS.length*0.9999*Math.random())];
      const demo=JSON.parse(JSON.stringify(pick));
      const ts=Date.now();
      demo.items.forEach((it,i)=>{if(!it.id)it.id='demo_'+ts+'_'+i;});
      demo.look_total_usd=demo.items.reduce((s,it)=>s+(it.price_estimate_usd||0),0);
      demo.photo=await photoP;
      demo.mode='demo';
      showScanConfirm(demo,uid);
    } finally { clearTimeout(timer); }
    fileInput.value='';
  });

  // ---- persistence ----
  const WARDROBE_KEY='awear_wardrobe',META_KEY='awear_meta',SHELF_KEY='awear_shelf',
        FEED_KEY='awear_feed',LASTSCAN_KEY='awear_lastscan',PROFILE_KEY='awear_profile',
        CREDITS_KEY='awear_credits';
  let _checkoutCtx = null;
  let _mpSheetStore = null; // seller's user id for the open marketplace item sheet (View profile target)
  const ls={load:k=>{try{return JSON.parse(localStorage.getItem(k))||null;}catch(e){return null;}},
            save:(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}}};
  const loadProfile=()=>ls.load(PROFILE_KEY)||{name:'My Style',handle:'me',city:'',bio:'',photo:null};
  const saveProfile=v=>ls.save(PROFILE_KEY,v);
  const loadWardrobe=()=>ls.load(WARDROBE_KEY)||[];
  const saveWardrobe=v=>ls.save(WARDROBE_KEY,v);
  const loadMeta=()=>ls.load(META_KEY)||{};
  const saveMeta=v=>ls.save(META_KEY,v);
  const loadShelf=()=>ls.load(SHELF_KEY)||[];
  const saveShelf=v=>ls.save(SHELF_KEY,v);
  const loadFeedPosts=()=>ls.load(FEED_KEY)||[];
  const saveFeedPosts=v=>ls.save(FEED_KEY,v);
  const loadLastScan=()=>ls.load(LASTSCAN_KEY);
  const saveLastScan=v=>ls.save(LASTSCAN_KEY,v);
  function addListing(it){const s=loadShelf();s.unshift({name:it.name,price:it.price,category:it.category,ts:Date.now()});saveShelf(s);}
  function removeListing(ts){saveShelf(loadShelf().filter(x=>x.ts!==ts));renderCloset();}

  // ---- Dolce closet / profile ----
  const SHELF_GROUPS=[
    {cats:['top'],                       title:'Tops',          icon:'shirt'},
    {cats:['dress'],                     title:'Dresses',       icon:'hanger'},
    {cats:['bottoms'],                   title:'Bottoms',       icon:'shirt'},
    {cats:['outerwear'],                 title:'Outerwear',     icon:'hanger'},
    {cats:['shoes'],                     title:'Shoes',         icon:'bag'},
    {cats:['bag'],                       title:'Bags',          icon:'bag'},
    {cats:['accessory','jewelry','hat'], title:'Accessories',   icon:'sparkle'},
  ];
  let profileTab='looks';

  function productTile(it){return `<div class="ptile" onclick="openWardrobeItemDetail('${attr(it.name)}')">
    <div class="pimg">${productImage(it)}</div>
    <div class="pname">${esc(it.name)}</div><div class="pbrand">${esc(it.brand_vibe||'')}</div>
    <div class="pprice">$${esc(it.price_estimate_usd)}</div>
    <div class="pacts">
      <button class="pbuy" data-buy="1" data-label="${attr(it.name)}" data-price="${attr(it.price_estimate_usd)}" onclick="event.stopPropagation()">Shop</button>
    </div></div>`;}

  function openWardrobeItemDetail(name) {
    const wardrobe = loadWardrobe();
    const it = wardrobe.find(i => i.name === name);
    if (!it) return;
    const modal = document.getElementById('purchase-modal');
    const card  = document.getElementById('modal-card');
    const tags = (it.style_tags || []).slice(0, 5);
    const compat = wardrobe.length > 1 ? calcCompatScore(it, wardrobe.filter(i => i.name !== it.name)) : null;
    card.innerHTML = `
      <div style="position:relative;padding:18px 20px 0">
        <div style="height:140px;border-radius:16px;overflow:hidden;background:var(--card);margin-bottom:8px">${productImage(it)}</div>
        <div style="font-size: var(--t-h2,18px);font-weight:900;text-align:center">${esc(it.name)}</div>
        <div style="font-size:var(--t-caption);color:var(--muted);text-align:center;margin-top:4px">${esc(it.brand_vibe||'')}${it.category ? ' · ' + esc(it.category) : ''}</div>
        ${compat ? `<div style="text-align:center;margin-top:8px"><span style="background:rgba(139,92,246,.15);color:var(--accent);font-size:var(--t-micro);font-weight:700;padding:3px 10px;border-radius:20px">${compat.pct}% wardrobe match</span></div>` : ''}
        ${tags.length ? `<div style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin-top:10px">
          ${tags.map(t => `<span style="background:var(--card);border:1px solid var(--line);border-radius:20px;font-size:var(--t-micro);font-weight:700;padding:3px 10px">${esc(t)}</span>`).join('')}
        </div>` : ''}
        <div style="font-size: var(--t-h1,22px);font-weight:900;text-align:center;margin-top:12px;color:var(--accent)">$${it.price_estimate_usd || '—'}</div>
      </div>
      <div style="display:flex;flex-direction:column;gap:8px;padding:14px 20px 20px">
        <button onclick="openAbigailWithItem('${attr(it.name)}')" style="width:100%;padding:13px;background:linear-gradient(135deg,var(--accent),var(--accent2));border:none;border-radius:14px;font-family:inherit;font-size:var(--t-body);font-weight:900;color:#fff;cursor:pointer;min-height:44px">Ask Abigail what to wear</button>
        <button onclick="openSellFormWithItem('${attr(JSON.stringify(it))}')" style="width:100%;padding:13px;background:var(--card);border:1.5px solid var(--accent,#e8526a);border-radius:14px;font-family:inherit;font-size:var(--t-body);font-weight:800;color:var(--accent,#e8526a);cursor:pointer;display:flex;align-items:center;justify-content:center;gap:7px;min-height:44px">${icon('tag',16)} List for sale in My Store</button>
        <div style="display:flex;gap:8px">
          <button onclick="addToWishlistFromSeed('${attr(it.name)}')" style="flex:1;padding:11px;background:var(--card);border:1px solid var(--line);border-radius:14px;font-family:inherit;font-size:var(--t-small);font-weight:700;cursor:pointer;min-height:44px">Wishlist</button>
          <button onclick="document.getElementById('purchase-modal').classList.remove('show')" style="flex:1;padding:11px;background:var(--card);border:1px solid var(--line);border-radius:14px;font-family:inherit;font-size:var(--t-small);font-weight:700;cursor:pointer;min-height:44px">Close</button>
        </div>
      </div>`;
    modal.classList.add('show');
  }

  function openAbigailWithItem(name) {
    document.getElementById('purchase-modal').classList.remove('show');
    showView('chat');
    setTimeout(() => {
      const inp = document.getElementById('chat-input');
      if (inp) { inp.value = 'What can I wear with ' + name + '?'; inp.focus(); }
    }, 300);
  }


  function closetShelvesHTML(wardrobe){
    if(!wardrobe.length) return `<div class="hint"><div class="big" style="display:flex;justify-content:center;color:var(--accent2)">${icon('door',60)}</div><h2>Your closet is still empty</h2>
      <p>Snap an outfit and AI will sort every item<br/>onto the right shelf in your closet.</p>
      <div class="cta" style="display:inline-flex;align-items:center;gap:5px">Tap ${icon('plus',15)} below to get started</div></div>`;
    const byCat={};
    wardrobe.forEach(it=>{const c=(it.category||'').toLowerCase();(byCat[c]=byCat[c]||[]).push(it);});
    const known=new Set(SHELF_GROUPS.flatMap(g=>g.cats));
    const shelf=(ic,title,items)=>`<div class="shelf">
      <div class="shelf-title">${icon(ic,15)} ${esc(title)} <span class="cnt">· ${items.length}</span></div>
      <div class="shelf-row">${items.map(productTile).join('')}</div>
      <div class="shelf-ledge"></div></div>`;
    let html=SHELF_GROUPS.map(g=>{const items=g.cats.flatMap(c=>byCat[c]||[]);return items.length?shelf(g.icon,g.title,items):'';}).join('');
    const others=wardrobe.filter(it=>!known.has((it.category||'').toLowerCase()));
    if(others.length) html+=shelf('hanger','Other',others);
    return html;
  }

  function looksGridHTML(){
    const feed=loadFeedPosts();
    if(!feed.length) return `<div class="shelf-empty"><div class="big" style="display:flex;justify-content:center;color:var(--accent2)">${icon('image',44)}</div>You haven't shared any looks yet.<br/>Snap an outfit and share it to the feed<br/>so it shows up here on your profile.</div>`;
    return `<div class="looks-grid">${feed.map(p=>`<div class="look-cell" data-goto-feed="1">
      ${p.photo?`<img src="${attr(p.photo)}" alt="">`:''}
      <div class="lc-meta">${esc(p.item_count||0)} items${p.look_total_usd?' · $'+esc(p.look_total_usd):''}</div>
    </div>`).join('')}</div>`;}

  function forSaleHTML(){
    const wardrobe = loadWardrobe();
    const shelf = loadShelf();
    const shelfTotal = shelf.reduce((s,it) => s + (Number(it.price)||0), 0);
    const earnings = Math.round(shelfTotal * 0.85);

    // L3 Smart Sell Suggestions — items with lowest wear_count not already listed
    const alreadyListed = new Set(shelf.map(s => s.name));
    const suggestions = wardrobe
      .filter(it => !alreadyListed.has(it.name))
      .sort((a, b) => (a.wear_count || 0) - (b.wear_count || 0))
      .filter(it => (it.wear_count || 0) <= 7)
      .slice(0, 5);

    function ssSellLabel(it) {
      const w = it.wear_count || 0;
      if (w === 0) return 'Never worn';
      if (w === 1) return 'Worn only once';
      if (w <= 3) return `Only ${w} wears`;
      return `Lightly worn · ${w}×`;
    }

    const suggestHTML = suggestions.length ? `
      <div class="ss-wrap">
        <div class="ss-header">${icon('sparkle',15)} Smart sell suggestions</div>
        <div class="ss-header-sub">Items you rarely reach for — earn on them</div>
        <div class="ss-list">
          ${suggestions.map(it => {
            const resalePrice = Math.round((it.price_estimate_usd || 100) * 0.5);
            return `<div class="ss-card">
              <div class="ss-card-img">${productImage(it)}</div>
              <div class="ss-card-body">
                <div class="ss-card-name">${esc(it.name)}</div>
                <div class="ss-card-wear">${ssSellLabel(it)}</div>
                <div class="ss-card-prices">
                  <span class="ss-price-suggest">$${resalePrice}</span>
                  <span class="ss-price-orig">$${esc(it.price_estimate_usd||'—')}</span>
                </div>
                <button class="ss-list-btn" data-ss-sell="${attr(it.name)}">${icon('tag',13)} List for sale</button>
              </div>
            </div>`;
          }).join('')}
        </div>
      </div>` : '';

    const earnCard = shelf.length ? `<div class="earn"><div class="top"><span class="big-num">$${earnings.toLocaleString()}</span><span class="ttl">earnings potential</span></div>
      <p>${shelf.length} items for sale · worth $${shelfTotal.toLocaleString()} · net after AWEAR's 15% fee</p></div>` : '';
    const listings = shelf.length
      ? shelf.map(it => `<div class="listing"><div class="ic">${productImage(it)}</div>
          <div class="info"><div class="nm">${esc(it.name)}</div><div class="sub">AI-priced based on resale market demand</div></div>
          <div class="ask"><div class="p">$${esc(it.price)}</div><div class="live">Active</div></div>
          <button class="rm" data-rm="${attr(it.ts)}" title="Remove">×</button></div>`).join('')
      : `<div class="shelf-empty"><div class="big" style="display:flex;justify-content:center;color:var(--success,#52c97a)">${icon('cash',44)}</div>No items listed for sale yet.<br/>Open an item in your closet and tap "List for sale".</div>`;
    return suggestHTML + earnCard + listings;
  }

  function renderCloset(){
    const wardrobe=loadWardrobe(),meta=loadMeta(),feed=loadFeedPosts();
    const closetValue=wardrobe.reduce((s,it)=>s+(Number(it.price_estimate_usd)||0),0);
    let body;
    if(profileTab==='looks') body=looksGridHTML();
    else if(profileTab==='forsale') body=forSaleHTML();
    else body=`
      ${!wardrobe.length ? `
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px 24px;text-align:center;gap:12px">
          <div style="color:var(--accent2)">${icon('hanger', 60)}</div>
          <div style="font-size: var(--t-h2,18px);font-weight:900;letter-spacing:-.3px">Your closet is waiting</div>
          <div style="font-size:var(--t-small);color:var(--muted);font-weight:600;line-height:1.6;max-width:240px">Scan your first look — AI will detect the pieces and build your personal closet</div>
          <button onclick="document.getElementById('file-input').click()" style="margin-top:8px;padding:14px 32px;background:linear-gradient(135deg,var(--accent),var(--accent2));border:0;border-radius:16px;font-family:inherit;font-size:var(--t-body);font-weight:900;color:#fff;cursor:pointer;display:inline-flex;align-items:center;gap:8px">${icon('camera', 18)} Scan first look</button>
        </div>` : `
      ${meta.mode==='demo'?`<div style="margin:0 18px 12px;padding:9px 14px;background:color-mix(in srgb,var(--warning,#e8a84a) 10%,transparent);border:1px solid color-mix(in srgb,var(--warning,#e8a84a) 30%,transparent);border-radius:14px;font-size:var(--t-small);font-weight:700;color:var(--warning,#e8a84a);display:flex;align-items:center;gap:6px">${icon('alertTriangle',14)} Demo scan — AI was unavailable, these are example items</div>`:''}
      ${meta.stylist_tip?`<div class="stylist"><div class="stylist-h" style="display:flex;align-items:center;gap:5px">${icon('sparkle',15)} AI Stylist · Style tip</div><p>${esc(meta.stylist_tip)}</p></div>`:''}
      <button class="shop-look share-look" id="share-look">${icon('arrowUp',18)} Share look to feed</button>
      ${closetShelvesHTML(wardrobe)}`}`;


    const prof=loadProfile();
    const profInitials=prof.name?initials(prof.name):'';
    const profPhotoHTML=prof.photo
      ?`<img class="ig-ava-photo" src="${attr(prof.photo)}" alt="">`
      :(profInitials
        ?`<span class="ig-ava-initials">${esc(profInitials)}</span>`
        :`<span class="ava-ico">${icon('user',38)}</span>`);
    // Avatar-row counts: Followers · Following · Looks · Items
    const followingCount=Object.values(followState).filter(Boolean).length;
    const followersCount=1240+feed.length*53+wardrobe.length*17;
    const season=getActiveSeason();
    closetBody.innerHTML=`
      <div class="ig-head">
        <div class="ig-avacol">
          <div class="ig-ava">${profPhotoHTML}</div>
          <div class="ig-nameblock">
            <div class="ig-name">${esc(prof.name||'My Style')}</div>
            ${prof.bio?`<div class="ig-name-bio">${esc(prof.bio)}</div>`:''}
          </div>
          <span class="ig-edit" id="edit-profile-btn">Edit profile</span>
        </div>
        <div class="ig-headmain">
          <div class="ig-headstats">
            <div><b>${fmtN(followersCount)}</b><span>Followers</span></div>
            <div><b>${fmtN(followingCount)}</b><span>Following</span></div>
            <div><b>${feed.length}</b><span>Looks</span></div>
            <div><b>${wardrobe.length}</b><span>Items</span></div>
          </div>
        </div>
      </div>
      ${(() => {
        const s = season;
        return `<div class="season-entry-card" id="season-entry-card" role="button" tabindex="0" aria-label="View ${s.name} ${s.year} season recap">
          <div class="season-entry-left">
            <div class="season-entry-row">
              <span class="season-entry-icon">${icon(s.icon, 20)}</span>
              <span class="season-entry-title">Your ${esc(s.name)} ${s.year}</span>
            </div>
            <div class="season-entry-sub">Tap to see your season recap</div>
          </div>
          <span class="season-entry-arrow">${icon('arrowRight', 20)}</span>
        </div>`;
      })()}
      <div class="seg">
        <button data-seg="looks"  class="${profileTab==='looks'?'on':''}">${icon('grid',15)} Looks</button>
        <button data-seg="closet" class="${profileTab==='closet'?'on':''}">${icon('hanger',15)} Closet</button>
      </div>${body}`;

    document.getElementById('share-look')?.addEventListener('click',shareLookToFeed);
    document.getElementById('edit-profile-btn')?.addEventListener('click',openEditProfile);
    document.getElementById('season-entry-card')?.addEventListener('click',()=>showView('season-recap'));
    closetBody.querySelectorAll('[data-seg]').forEach(b=>b.addEventListener('click',()=>{profileTab=b.dataset.seg;renderCloset();}));
    closetBody.querySelectorAll('[data-rm]').forEach(btn=>btn.addEventListener('click',()=>removeListing(Number(btn.dataset.rm))));
    closetBody.querySelectorAll('[data-goto-feed]').forEach(cell=>cell.addEventListener('click',()=>showView('feed')));
    closetBody.querySelectorAll('[data-ss-sell]').forEach(btn=>btn.addEventListener('click',()=>{
      const it=loadWardrobe().find(i=>i.name===btn.dataset.ssSell);
      if(it) openSellForm(it);
    }));
  }

  function addScan(data){
    const newItems=data.items||[];
    saveWardrobe(newItems.concat(loadWardrobe()));
    const meta={overall_style:data.overall_style,occasion:data.occasion,trend_score:data.trend_score,
      summary:data.summary,stylist_tip:data.stylist_tip,look_total_usd:data.look_total_usd,mode:data.mode||'live'};
    saveMeta(meta); saveLastScan({photo:data.photo||null,items:newItems,meta});
    if(newItems.length) logAdminEvent('scan', 'Scanned ' + newItems.length + ' items — ' + (newItems[0]?.name||''));
    renderCloset();
    if(newItems.length){
      const base=(newItems[0]?.name||'Item') + ' added to your closet';
      showToast(data.mode==='demo' ? base + ' (demo — AI unavailable)' : base);
    }
  }

  function getOrCreateUserId(){
    const KEY='awear_uid';
    let uid=localStorage.getItem(KEY);
    if(!uid){uid=([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g,c=>(c^crypto.getRandomValues(new Uint8Array(1))[0]&15>>c/4).toString(16));localStorage.setItem(KEY,uid);}
    return uid;
  }

  function wardrobeTagSet(){
    const set=new Set();
    loadWardrobe().forEach(it=>{(it.style_tags||[]).forEach(t=>set.add(String(t).toLowerCase()));if(it.category)set.add(String(it.category).toLowerCase());});
    return set;
  }
  function shareLookToFeed(){
    const scan=loadLastScan();if(!scan){showToast('Scan a look first to share it');return;}
    const meta=scan.meta||{};
    const post={ts:Date.now(),id:'mine_'+Date.now(),photo:scan.photo||null,
      caption:meta.overall_style||'My look',occasion:meta.occasion||'',
      item_count:(scan.items||[]).length,look_total_usd:meta.look_total_usd||0,
      items:(scan.items||[]).map(it=>({category:it.category,name:it.name,price_estimate_usd:it.price_estimate_usd,buy_options:it.buy_options||[],search_query:it.search_query})),
      tags:(scan.items||[]).reduce((acc,it)=>{(it.style_tags||[]).forEach(t=>acc.push(t));if(it.category)acc.push(it.category);return acc;},[])};
    const feed=loadFeedPosts();feed.unshift(post);saveFeedPosts(feed);
    showToast('Look shared to the feed');showView('feed');
  }

  // ---- Scan Confirm Sheet ----
  let _scData=null,_scUid=null,_scItems=[];
  function showScanConfirm(data,uid){
    _scData=data; _scUid=uid;
    _scItems=(data.items||[]).map(it=>({ai:{...it},final:{name:it.name,category:it.category||'',color:it.color||'',brand:it.brand_vibe||'',price:it.price_estimate_usd||0,source_url:''},accepted:true,editing:false}));
    _renderScConfirm();
    const ov=document.getElementById('sc-overlay'),sh=document.getElementById('sc-sheet');
    ov.setAttribute('aria-hidden','false'); sh.setAttribute('aria-hidden','false');
    ov.classList.add('show'); sh.classList.add('show');
    showView('closet');
  }
  function closeScanConfirm(){
    const ov=document.getElementById('sc-overlay'),sh=document.getElementById('sc-sheet');
    ov.setAttribute('aria-hidden','true'); sh.setAttribute('aria-hidden','true');
    ov.classList.remove('show'); sh.classList.remove('show');
  }
  function _renderScConfirm(){
    const hdr=document.getElementById('sc-header-el'),body=document.getElementById('sc-body'),ftr=document.getElementById('sc-footer-el');
    if(!hdr||!body||!ftr) return;
    const isDemo=_scData&&_scData.mode==='demo';
    const cnt=_scItems.filter(i=>i.accepted).length;
    hdr.innerHTML=`<div class="sc-header"><div class="sc-header-title">${icon('check',18)} Did we get it right?</div><div class="sc-header-sub">${_scItems.length} item${_scItems.length!==1?'s':''} found${isDemo?' (demo)':''}</div><button class="sc-close" onclick="closeScanConfirm()" aria-label="Close">${icon('x',16)}</button></div>`;
    body.innerHTML=_scItems.map((si,idx)=>{
      const it=si.final, isLow=si.ai.confidence==='low';
      return `<div class="sc-card${si.accepted?'':' sc-rejected'}" id="sc-card-${idx}">
        ${isLow?`<div class="sc-low-badge">${icon('alertTriangle',12)} Low confidence — please refine</div>`:''}
        <div class="sc-card-name">${esc(it.name)}</div>
        <div class="sc-card-meta">${esc(it.category)}${it.brand?' · '+esc(it.brand):''}${it.price?' · $'+it.price:''}</div>
        <div class="sc-card-actions">
          <button class="sc-btn sc-accept${si.accepted?' active':''}" onclick="scSetAccepted(${idx},true)">${icon('check',14)}</button>
          <button class="sc-btn sc-edit${si.editing?' active':''}" onclick="scToggleEdit(${idx})">${icon('edit',14)}</button>
          <button class="sc-btn sc-reject${!si.accepted?' active':''}" onclick="scSetAccepted(${idx},false)">${icon('x',14)}</button>
        </div>
        ${si.editing?`<div class="sc-edit-form">
          <input class="sc-field" value="${attr(it.name)}" placeholder="Name" oninput="scUpdateField(${idx},'name',this.value)">
          <input class="sc-field" value="${attr(it.category)}" placeholder="Category" oninput="scUpdateField(${idx},'category',this.value)">
          <input class="sc-field" value="${attr(it.brand)}" placeholder="Brand" oninput="scUpdateField(${idx},'brand',this.value)">
          <input class="sc-field" type="number" value="${attr(''+it.price)}" placeholder="Price USD" oninput="scUpdateField(${idx},'price',+this.value)">
          <input class="sc-field" value="${attr(it.source_url)}" placeholder="Source link (optional)" oninput="scUpdateField(${idx},'source_url',this.value)">
        </div>`:''}
      </div>`;
    }).join('');
    ftr.innerHTML=`<div class="sc-footer"><button class="sc-cta" id="sc-confirm-btn" onclick="scConfirm()"${cnt===0?' disabled':''}>${icon('plus',16)} Add ${cnt} item${cnt!==1?'s':''} to Closet</button></div>`;
  }
  function scSetAccepted(idx,val){_scItems[idx].accepted=val;if(!val)_scItems[idx].editing=false;_renderScConfirm();}
  function scToggleEdit(idx){_scItems[idx].editing=!_scItems[idx].editing;if(_scItems[idx].editing)_scItems[idx].accepted=true;_renderScConfirm();}
  function scUpdateField(idx,field,val){
    _scItems[idx].final[field]=val;
    const card=document.getElementById('sc-card-'+idx);
    if(!card) return;
    const nm=card.querySelector('.sc-card-name'),mt=card.querySelector('.sc-card-meta');
    if(nm&&field==='name') nm.textContent=val;
    if(mt){const f=_scItems[idx].final;mt.textContent=(f.category||'')+(f.brand?' · '+f.brand:'')+(f.price?' · $'+f.price:'');}
  }
  async function scConfirm(){
    const btn=document.getElementById('sc-confirm-btn');
    if(btn){btn.disabled=true;btn.innerHTML=icon('check',16)+' Adding…';}
    const clientRef='scan_'+Date.now()+'_'+Math.floor(Math.random()*1e6);
    const accepted=_scItems.filter(i=>i.accepted), rejected=_scItems.filter(i=>!i.accepted);
    const payload={user_id:_scUid,client_ref:clientRef,items:[
      ...accepted.map(si=>({accepted:true,ai:si.ai,final:{...si.final,name:si.final.name||si.ai.name,category:si.final.category||si.ai.category}})),
      ...rejected.map(si=>({accepted:false,ai:si.ai,final:si.ai}))
    ]};
    try{ await fetch('/api/closet/confirm',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}); }catch(_){}
    const acceptedItems=accepted.map(si=>({...si.ai,name:si.final.name||si.ai.name,category:si.final.category||si.ai.category,brand_vibe:si.final.brand||si.ai.brand_vibe,price_estimate_usd:si.final.price||si.ai.price_estimate_usd,source_url:si.final.source_url||null}));
    const meta={overall_style:_scData.overall_style,occasion:_scData.occasion,trend_score:_scData.trend_score,summary:_scData.summary,stylist_tip:_scData.stylist_tip,look_total_usd:_scData.look_total_usd,mode:_scData.mode||'live'};
    saveWardrobe(acceptedItems.concat(loadWardrobe()));
    saveMeta(meta); saveLastScan({photo:_scData.photo||null,items:acceptedItems,meta});
    if(acceptedItems.length) logAdminEvent('scan','Confirmed '+acceptedItems.length+' items — '+(acceptedItems[0]?.name||''));
    closeScanConfirm(); renderCloset();
    const base=acceptedItems.length+' item'+(acceptedItems.length!==1?'s':'')+' added to your closet';
    showToast(_scData.mode==='demo'?base+' (demo)':base);
  }

  // ---- Feed ----
  let SEED_POSTS=[
    {id:'s1',userId:'u1',user:'tamar', name:'Tamar',verified:true, caption:'Yellow halter & baggy denim',      tags:['y2k','casual','minimal'],   price:149,look_total_usd:149,img:'/static/img/users/tamar/look1.jpg',grad:'linear-gradient(160deg,#ff9a8b,#ff6a88,#ff99ac)',likes:2400,trend:91,earn:15,mtags:['y2k','casual','minimal','top','dress'],items:[{category:'top',name:'White cropped tee',price_estimate_usd:79,q:'white cropped tee'},{category:'bottoms',name:'Beige baker trousers',price_estimate_usd:159,q:'beige baker trousers'},{category:'shoes',name:'White sneakers',price_estimate_usd:220,q:'white leather sneakers'},{category:'accessory',name:'Sunglasses',price_estimate_usd:89,q:'trendy sunglasses'}]},
    {id:'s2',userId:'u2',user:'carmel', name:'Carmel', verified:false,caption:'Street casual fit',           tags:['streetwear','utility'],      price:219,look_total_usd:219,img:'/static/img/users/carmel/look1.jpg',grad:'linear-gradient(160deg,#a18cd1,#fbc2eb)',         likes:5100,trend:96,earn:22,mtags:['streetwear','utility','bottoms','sneakers','shoes'],items:[{category:'top',name:'Oversized tee',price_estimate_usd:99,q:'oversized graphic tee'},{category:'bottoms',name:'Parachute cargos',price_estimate_usd:159,q:'parachute cargo pants'},{category:'shoes',name:'Adidas Samba',price_estimate_usd:449,q:'adidas samba'},{category:'accessory',name:'Baseball cap',price_estimate_usd:69,q:'baseball cap'}]},
    {id:'s3',userId:'u3',user:'maayan',name:'Maayan',verified:true, caption:'Minimal menswear',     tags:['secondhand','vintage'],      price:89,look_total_usd:89, img:'/static/img/users/maayan/look1.jpg',                 grad:'linear-gradient(160deg,#84fab0,#8fd3f4)',         likes:1800,trend:82,earn:9, mtags:['secondhand','vintage','everyday','top','bag'],items:[{category:'top',name:'Vintage shirt',price_estimate_usd:45,q:'vintage shirt'},{category:'bottoms',name:'Mom jeans',price_estimate_usd:89,q:'vintage mom jeans'},{category:'bag',name:'Shoulder bag',price_estimate_usd:60,q:'vintage shoulder bag'}]},
    {id:'s4',userId:'u4',user:'shir.daily', name:'Shir', verified:false,caption:'Sunday outfit',        tags:['minimal','ootd'],            price:179,look_total_usd:179,img:null,                 grad:'linear-gradient(160deg,#fccb90,#d57eeb)',         likes:3300,trend:88,earn:18,mtags:['minimal','everyday','ootd','dress','shoes'],items:[{category:'dress',name:'Midi dress',price_estimate_usd:179,q:'midi slip dress'},{category:'shoes',name:'Ballet flats',price_estimate_usd:120,q:'ballet flats'},{category:'bag',name:'Mini bag',price_estimate_usd:95,q:'mini bag'}]},
    {id:'s5',userId:'u5',user:'agam.x',     name:'Agam', verified:true, caption:'Vintage vibes',            tags:['vintage','retro'],           price:259,look_total_usd:259,img:null,                 grad:'linear-gradient(160deg,#5ee7df,#b490ca)',         likes:4000,trend:94,earn:26,mtags:['vintage','retro','thrifted','accessory','outerwear'],items:[{category:'outerwear',name:'Denim jacket',price_estimate_usd:199,q:'vintage denim jacket'},{category:'accessory',name:'Retro sunglasses',price_estimate_usd:79,q:'retro sunglasses'},{category:'shoes',name:'Cowboy boots',price_estimate_usd:259,q:'cowboy boots'}]},
    {id:'s6',userId:'u6',user:'dana.edit',  name:'Dana', verified:false,caption:'Office but make it cute',  tags:['minimal','ootd'],            price:320,look_total_usd:320,img:null,                 grad:'linear-gradient(160deg,#f8ceec,#a29bfe)',         likes:6200,trend:97,earn:32,mtags:['minimal','business','dress','shoes','bag'],items:[{category:'dress',name:'Blazer dress',price_estimate_usd:320,q:'blazer dress'},{category:'shoes',name:'Loafers',price_estimate_usd:199,q:'leather loafers'},{category:'bag',name:'Structured bag',price_estimate_usd:240,q:'structured work bag'}]},
    {id:'s7',userId:'u1',user:'tamar',name:'Tamar', verified:true, caption:'Elevator mirror moment',           tags:['casual','y2k'],              price:120,look_total_usd:120,img:'/static/img/users/tamar/look2.jpg',                 grad:'linear-gradient(160deg,#89f7fe,#66a6ff)',         likes:3800,trend:89,earn:12,mtags:['casual','summer','y2k','top','bottoms'],items:[{category:'top',name:'Bikini top',price_estimate_usd:69,q:'bikini top'},{category:'bottoms',name:'Linen pants',price_estimate_usd:120,q:'linen beach pants'},{category:'accessory',name:'Straw hat',price_estimate_usd:79,q:'straw hat'}]},
    {id:'s8',user:'emma.edit',  name:'Emma',verified:true, caption:'Business casual done right',   tags:['minimal','ootd','business'], price:340,look_total_usd:340,img:null,                 grad:'linear-gradient(160deg,#89f7fe,#66a6ff)',         likes:4100,trend:93,earn:20,mtags:['business','minimal','dress','shoes'],items:[{category:'dress',name:'Blazer dress',price_estimate_usd:280,q:'blazer dress work'},{category:'shoes',name:'Pointed toe heels',price_estimate_usd:199,q:'pointed toe heels beige'},{category:'bag',name:'Croc tote',price_estimate_usd:320,q:'croc leather tote bag'}]},
    {id:'s9',user:'zara.fits',  name:'Zara', verified:false,caption:'Quiet luxury era',            tags:['minimal','luxury'],          price:580,look_total_usd:580,img:null,                 grad:'linear-gradient(160deg,#e0c3fc,#8ec5fc)',         likes:7200,trend:98,earn:36,mtags:['minimal','luxury','outerwear','shoes'],items:[{category:'outerwear',name:'Camel wool coat',price_estimate_usd:580,q:'camel cashmere coat'},{category:'bottoms',name:'Wide leg trousers',price_estimate_usd:220,q:'tailored wide leg trousers cream'},{category:'shoes',name:'Ballet flats',price_estimate_usd:180,q:'satin ballet flats beige'}]},
    {id:'s10',user:'sport.mia', name:'Mia', verified:false,caption:'Gym to brunch vibes',          tags:['athleisure','casual'],       price:180,look_total_usd:180,img:null,                 grad:'linear-gradient(160deg,#43e97b,#38f9d7)',         likes:2900,trend:85,earn:14,mtags:['athleisure','sport','casual'],items:[{category:'top',name:'Sports bra',price_estimate_usd:78,q:'sports bra lululemon'},{category:'bottoms',name:'Flare leggings',price_estimate_usd:128,q:'flare yoga leggings'},{category:'outerwear',name:'Cropped hoodie',price_estimate_usd:89,q:'cropped zip hoodie'}]},
    {id:'s11',user:'thrift.ada',name:'Ada', verified:true, caption:'$40 thrift haul total',        tags:['vintage','secondhand'],      price:40,look_total_usd:40, img:null,                 grad:'linear-gradient(160deg,#fddb92,#d1fdff)',         likes:5500,trend:95,earn:27,mtags:['vintage','thrifted','secondhand'],items:[{category:'top',name:'90s band tee',price_estimate_usd:12,q:'vintage band tee'},{category:'bottoms',name:'High waist denim',price_estimate_usd:18,q:'vintage high waist jeans'},{category:'shoes',name:'Platform sandals',price_estimate_usd:9,q:'platform sandals thrift'}]},
    {id:'s12',user:'boho.sara', name:'Sara', verified:false,caption:'Festival ready',              tags:['vintage','casual','boho'],   price:195,look_total_usd:195,img:null,                 grad:'linear-gradient(160deg,#f093fb,#f5576c)',         likes:3200,trend:87,earn:16,mtags:['boho','vintage','festival'],items:[{category:'top',name:'Crochet top',price_estimate_usd:65,q:'crochet top boho'},{category:'bottoms',name:'Maxi skirt',price_estimate_usd:89,q:'flowy maxi skirt floral'},{category:'accessory',name:'Layered necklaces',price_estimate_usd:40,q:'layered gold necklaces'}]},
    {id:'s13',user:'dark.nina', name:'Nina', verified:true, caption:'Dark academia aesthetic',     tags:['minimal','vintage'],         price:275,look_total_usd:275,img:null,                 grad:'linear-gradient(160deg,#2d2d2d,#5a5a5a)',         likes:6800,trend:96,earn:34,mtags:['dark','academia','vintage','minimal'],items:[{category:'outerwear',name:'Plaid blazer',price_estimate_usd:180,q:'plaid oversized blazer'},{category:'top',name:'Turtleneck',price_estimate_usd:69,q:'ribbed turtleneck black'},{category:'bottoms',name:'Plaid mini skirt',price_estimate_usd:95,q:'plaid mini skirt brown'}]},
    {id:'s14',user:'glam.iris', name:'Iris', verified:true, caption:'Going out era',               tags:['y2k','casual'],              price:220,look_total_usd:220,img:null,                 grad:'linear-gradient(160deg,#f77062,#fe5196)',         likes:4600,trend:92,earn:23,mtags:['y2k','going-out','night'],items:[{category:'top',name:'Sequin crop top',price_estimate_usd:89,q:'sequin crop top'},{category:'bottoms',name:'Mini skirt',price_estimate_usd:69,q:'satin mini skirt'},{category:'shoes',name:'Strappy heels',price_estimate_usd:149,q:'strappy heeled sandals'}]},
    {id:'s15',user:'maya.home', name:'Maya', verified:false,caption:'WFH but make it cute',        tags:['minimal','casual'],          price:140,look_total_usd:140,img:null,                 grad:'linear-gradient(160deg,#a1c4fd,#c2e9fb)',         likes:3400,trend:88,earn:17,mtags:['minimal','casual','everyday'],items:[{category:'top',name:'Knit crop',price_estimate_usd:65,q:'knit crop top soft'},{category:'bottoms',name:'Linen shorts',price_estimate_usd:49,q:'linen shorts white'},{category:'accessory',name:'Reading glasses',price_estimate_usd:29,q:'trendy reading glasses'}]},
    {id:'s16',user:'coquette.b',name:'Bella',verified:true, caption:'Coquette everything',         tags:['y2k','casual'],              price:165,look_total_usd:165,img:null,                 grad:'linear-gradient(160deg,#ffecd2,#fcb69f)',         likes:8100,trend:99,earn:40,mtags:['coquette','y2k','soft'],items:[{category:'top',name:'Bow crop cardigan',price_estimate_usd:79,q:'bow detail cardigan pink'},{category:'bottoms',name:'Ballet mini',price_estimate_usd:89,q:'ballet core mini skirt'},{category:'accessory',name:'Pearl headband',price_estimate_usd:25,q:'pearl satin headband'}]},
    {id:'s17',user:'fit.leila', name:'Leila',verified:false,caption:'Running my best life',        tags:['athleisure'],                price:210,look_total_usd:210,img:null,                 grad:'linear-gradient(160deg,#5ee7df,#b490ca)',         likes:2100,trend:81,earn:10,mtags:['sport','athleisure','running'],items:[{category:'top',name:'Racing tank',price_estimate_usd:55,q:'running tank top'},{category:'bottoms',name:'2-in-1 shorts',price_estimate_usd:65,q:'running shorts built-in liner'},{category:'shoes',name:'Carbon plate racer',price_estimate_usd:190,q:'carbon plate running shoes'}]},
    {id:'s18',user:'work.claire',name:'Claire',verified:true,caption:'Power dressing works',       tags:['minimal','ootd','business'], price:450,look_total_usd:450,img:null,                 grad:'linear-gradient(160deg,#667eea,#764ba2)',         likes:5900,trend:94,earn:29,mtags:['business','formal','power'],items:[{category:'outerwear',name:'Structured blazer',price_estimate_usd:280,q:'structured blazer charcoal'},{category:'bottoms',name:'Tailored trousers',price_estimate_usd:165,q:'tailored suit trousers'},{category:'shoes',name:'Block heel pumps',price_estimate_usd:175,q:'block heel pumps black'}]},
    {id:'s19',user:'maxi.rosy', name:'Rosy',verified:false,caption:'Effortless summer',            tags:['casual','vintage'],          price:135,look_total_usd:135,img:null,                 grad:'linear-gradient(160deg,#f6d365,#fda085)',         likes:2800,trend:84,earn:14,mtags:['casual','boho','summer'],items:[{category:'dress',name:'Maxi dress',price_estimate_usd:99,q:'floral maxi dress summer'},{category:'shoes',name:'Espadrilles',price_estimate_usd:69,q:'espadrille wedges natural'},{category:'accessory',name:'Raffia bag',price_estimate_usd:55,q:'raffia tote bag summer'}]},
    {id:'s20',user:'luxe.ines', name:'Ines',verified:true, caption:'Investment pieces only',       tags:['minimal','luxury'],          price:1200,look_total_usd:1200,img:null,                grad:'linear-gradient(160deg,#d4d4d4,#f5f5f5)',         likes:9400,trend:99,earn:47,mtags:['luxury','minimal','designer'],items:[{category:'bag',name:'Classic flap bag',price_estimate_usd:5200,q:'classic quilted bag black'},{category:'outerwear',name:'Camel coat',price_estimate_usd:1200,q:'designer camel overcoat'},{category:'shoes',name:'Leather loafers',price_estimate_usd:750,q:'designer leather loafers'}]},
    {id:'s21',user:'varsity.kt',name:'Kate',verified:false,caption:'Varsity season is here',       tags:['streetwear','y2k'],          price:185,look_total_usd:185,img:null,                 grad:'linear-gradient(160deg,#f8ceec,#a29bfe)',         likes:3700,trend:90,earn:18,mtags:['streetwear','y2k','preppy'],items:[{category:'outerwear',name:'Letter jacket',price_estimate_usd:189,q:'varsity letter jacket'},{category:'bottoms',name:'Pleated mini',price_estimate_usd:79,q:'pleated mini skirt'},{category:'shoes',name:'Platform loafers',price_estimate_usd:129,q:'chunky platform loafers'}]},
    {id:'s22',user:'eco.freya', name:'Freya',verified:true,caption:'100% secondhand fit',          tags:['vintage','secondhand'],      price:65,look_total_usd:65, img:null,                 grad:'linear-gradient(160deg,#84fab0,#8fd3f4)',         likes:4200,trend:91,earn:21,mtags:['sustainable','secondhand','eco'],items:[{category:'top',name:'Upcycled denim jacket',price_estimate_usd:25,q:'upcycled denim jacket vintage'},{category:'dress',name:'Slip dress thrifted',price_estimate_usd:18,q:'silk slip dress thrift'},{category:'shoes',name:'Vintage boots',price_estimate_usd:22,q:'vintage ankle boots brown'}]},
    {id:'s23',user:'glam.tiff', name:'Tiffany',verified:false,caption:'Met Gala energy every day', tags:['y2k','streetwear'],         price:490,look_total_usd:490,img:null,                 grad:'linear-gradient(160deg,#ff9a8b,#ff6a88,#ff99ac)', likes:6300,trend:97,earn:31,mtags:['maximalist','glam','event'],items:[{category:'dress',name:'Feather trim dress',price_estimate_usd:340,q:'feather trim mini dress'},{category:'shoes',name:'Platform boots',price_estimate_usd:299,q:'platform knee high boots'},{category:'accessory',name:'Crystal clutch',price_estimate_usd:120,q:'crystal embellished clutch'}]},
    {id:'s24',user:'soft.jess', name:'Jessica',verified:false,caption:'Everyday softness',         tags:['minimal','casual'],          price:95,look_total_usd:95, img:null,                 grad:'linear-gradient(160deg,#a8edea,#fed6e3)',         likes:1900,trend:80,earn:9, mtags:['minimal','casual','soft'],items:[{category:'top',name:'Bamboo tee',price_estimate_usd:45,q:'bamboo cotton tee neutral'},{category:'bottoms',name:'Linen trousers',price_estimate_usd:75,q:'wide leg linen trousers beige'},{category:'shoes',name:'Birkenstock Arizona',price_estimate_usd:110,q:'birkenstock arizona sandals'}]},
    {id:'s25',user:'street.kai',name:'Kai',verified:true, caption:'NYC energy no off button',      tags:['streetwear','utility'],      price:280,look_total_usd:280,img:null,                 grad:'linear-gradient(160deg,#2d2d2d,#434343)',         likes:7700,trend:98,earn:38,mtags:['streetwear','utility','nyc'],items:[{category:'outerwear',name:'Tech jacket',price_estimate_usd:320,q:'tech shell jacket black'},{category:'bottoms',name:'Utility cargos',price_estimate_usd:145,q:'utility cargo pants black'},{category:'shoes',name:'New Balance 9060',price_estimate_usd:130,q:'new balance 9060 grey'}]},
    {id:'s26',user:'mod.pita',  name:'Pita',verified:false,caption:'Modest fashion is elevated',   tags:['minimal','ootd'],            price:230,look_total_usd:230,img:null,                 grad:'linear-gradient(160deg,#667eea,#764ba2)',         likes:4800,trend:93,earn:24,mtags:['modest','minimal','formal'],items:[{category:'outerwear',name:'Abaya coat',price_estimate_usd:180,q:'longline abaya coat neutral'},{category:'bottoms',name:'Wide palazzo',price_estimate_usd:95,q:'wide leg palazzo trousers'},{category:'accessory',name:'Silk scarf',price_estimate_usd:89,q:'silk head scarf neutral tones'}]},
    {id:'s27',user:'plus.nova', name:'Nova',verified:true, caption:'Curves and confidence',         tags:['casual','y2k'],              price:175,look_total_usd:175,img:null,                 grad:'linear-gradient(160deg,#f8ceec,#a29bfe)',         likes:5100,trend:94,earn:25,mtags:['plus-size','casual','y2k'],items:[{category:'dress',name:'Wrap midi dress',price_estimate_usd:99,q:'wrap midi dress plus size'},{category:'shoes',name:'Block heels',price_estimate_usd:89,q:'block heel shoes wide fit'},{category:'accessory',name:'Gold hoops',price_estimate_usd:35,q:'oversized gold hoop earrings'}]},
  ];

  // ---- Data loaders (products.json / profiles.json / posts.json) ----
  // loadFeedData: maps posts.json + profiles.json → SEED_POSTS schema
  // On fetch failure → returns null → fallback to hardcoded SEED_POSTS above
  async function loadFeedData() {
    try {
      const [profilesRes, postsRes, productsRes] = await Promise.all([
        fetch('/api/profiles?limit=20'),
        fetch('/api/posts?limit=40'),
        fetch('/api/products?limit=300')
      ]);
      if (!profilesRes.ok || !postsRes.ok) return null;
      const profilesData = await profilesRes.json();
      const postsData    = await postsRes.json();
      const productsData = productsRes.ok ? await productsRes.json() : {items:[]};
      const profiles = profilesData.items || profilesData;
      const posts    = postsData.items    || postsData;
      const products = productsData.items  || productsData || [];

      const profileMap = {};
      profiles.forEach(p => { profileMap[p.id] = p; });
      const productMap = {};
      (products || []).forEach(p => { productMap[p.id] = p; });

      const GRADS = [
        'linear-gradient(160deg,#ff9a8b,#ff6a88,#ff99ac)',
        'linear-gradient(160deg,#a18cd1,#fbc2eb)',
        'linear-gradient(160deg,#84fab0,#8fd3f4)',
        'linear-gradient(160deg,#fccb90,#d57eeb)',
        'linear-gradient(160deg,#5ee7df,#b490ca)',
        'linear-gradient(160deg,#f8ceec,#a29bfe)',
        'linear-gradient(160deg,#89f7fe,#66a6ff)',
        'linear-gradient(160deg,#fddb92,#d1fdff)',
        'linear-gradient(160deg,#e0c3fc,#8ec5fc)',
        'linear-gradient(160deg,#f093fb,#f5576c)',
      ];

      return posts.map((post, idx) => {
        const user = profileMap[post.user_id] || {};
        const tags = (user.style_tags || []).map(t => t.toLowerCase());
        return {
          id:       post.id,
          user:     user.username   || ('user_' + idx),
          name:     user.display_name || user.username || 'Unknown',
          avatar:   user.avatar_url || null,
          verified: user.verified   || false,
          caption:  post.caption    || '',
          tags:     tags,
          mtags:    tags,
          price:    post.likes ? Math.round(post.likes / 20) * 10 : 120,
          img:      post.image_url  || null,
          grad:     GRADS[idx % GRADS.length],
          likes:    post.likes      || 0,
          trend:    Math.min(99, 70 + (post.likes ? Math.floor(post.likes / 50) : 0)),
          earn:     Math.round((post.likes || 100) / 80),
          items:    (post.items_tagged || []).slice(0, 4).map(pid => {
            const prod = productMap[pid];
            // Fail loud, not silently: an unresolved tag must never leak a raw
            // product id (e.g. "prod_015") into the UI as a garment name. Drop
            // the pill entirely and log so a data mismatch is visible, not fake.
            if (!prod || !prod.name) {
              console.warn('[AWEAR] feed item tag did not resolve to a product:', pid, '(post', post.id + ')');
              return null;
            }
            return {
              category: prod.category || 'top',
              name:     prod.name,
              brand_vibe: prod.brand  || '',
              price_estimate_usd: prod.price_estimate_usd || 0,
              image_url: prod.image_url || null,
              q:        prod.name
            };
          }).filter(Boolean)
        };
      });
    } catch(e) {
      console.warn('[AWEAR] loadFeedData failed:', e.message);
      return null;
    }
  }

  // loadProducts: reads static/data/products.json directly (bypasses server RAM cache)
  // On fetch failure → returns null → fallback to hardcoded SHOP_SEED below
  async function loadProducts() {
    try {
      const res = await fetch('/static/data/products.json');
      if (!res.ok) return null;
      const products = await res.json();
      if (!Array.isArray(products) || !products.length) return null;

      return products.map((p, idx) => ({
        id:         p.id,
        name:       p.name,
        brand:      p.brand  || '',
        store:      p.brand  || '',
        category:   p.category,
        image_url:  p.image_url || null,
        color:      p.color  || '',
        price:      p.price_estimate_usd,
        orig:       p.price_estimate_usd,
        price_estimate_usd: p.price_estimate_usd,
        style_tags: p.tags   || [],
        in_stock:   p.in_stock !== false,
        search_query: p.search_query || p.name,
        badge:      p.in_stock ? 'New' : 'Sold out',
        score:      80 + (idx % 20),
      }));
    } catch(e) {
      console.warn('[AWEAR] loadProducts failed:', e.message);
      return null;
    }
  }

  function loadSet(k){try{return new Set(JSON.parse(localStorage.getItem(k))||[]);}catch(e){return new Set();}}
  function saveSet(k,s){localStorage.setItem(k,JSON.stringify([...s]));}
  let LIKES=loadSet('awear_likes'), SAVED=loadSet('awear_saved');

  let activeFilters=(()=>{try{const a=JSON.parse(localStorage.getItem('awear_feed_style_filter'));return a&&a.length?new Set(a):new Set(['all']);}catch(e){return new Set(['all']);}})();
  document.querySelectorAll('#feed-filters .ff').forEach(b=>b.classList.toggle('active',activeFilters.has(b.dataset.filter)));
  document.getElementById('feed-filters').addEventListener('click',e=>{
    const btn=e.target.closest('.ff');if(!btn)return;
    const f=btn.dataset.filter;
    if(f==='all'){activeFilters=new Set(['all']);}
    else{activeFilters.delete('all');if(activeFilters.has(f))activeFilters.delete(f);else activeFilters.add(f);if(activeFilters.size===0)activeFilters.add('all');}
    localStorage.setItem('awear_feed_style_filter',JSON.stringify([...activeFilters]));
    document.querySelectorAll('#feed-filters .ff').forEach(b=>b.classList.toggle('active',activeFilters.has(b.dataset.filter)));
    renderFeed();
  });

  // BE-002: the look total = sum of the post's priced items (single source of truth),
  // so the feed-card button, the sheet rows, and the "Look total" can never disagree.
  // Falls back to the post's look_total_usd only when no item carries a price.
  function lookTotalOf(post){
    const items=post&&post.items;
    if(items&&items.length){
      const sum=items.reduce((s,x)=>s+(Number(x.price_estimate_usd||x.price)||0),0);
      if(sum>0) return sum;
    }
    return (post&&Number(post.look_total_usd))||0;
  }

  function feedCardHTML(post,isMine){
    const tags=post.tags||[],mtags=post.mtags||tags;
    const liked=LIKES.has(post.id),saved=SAVED.has(post.id);
    const bgImg=post.img?`<img class="feed-img" src="${attr(post.img)}" alt="" onerror="this.style.display='none'">` :'';
    const tagPills=tags.map(t=>`<span class="ftag">#${esc(t)}</span>`).join('');
    const earnLine=(!isMine&&post.earn)?`<div class="fc-earn">${icon('diamond',13)} @${esc(post.user)} earns $${esc(post.earn)} on every purchase</div>`:'';
    const lbl=post.name?post.name+"'s look":(post.caption||'the look');
    const lookTot=lookTotalOf(post);
    const _ownWardrobe=JSON.parse(localStorage.getItem('awear_wardrobe')||'[]');
    const _ownScore=_ownWardrobe.length?calcCompatScore({style_tags:tags},_ownWardrobe):{pct:0,matches:[]};
    const ownBadge=_ownWardrobe.length?`<div class="fc-own-badge">${icon('hanger',12)} ${esc(_ownScore.pct)}% already in your closet</div>`:'';

    // Avatar — use seed user avatar or initials
    const seedUser=!isMine?SEED_USERS.find(u=>u.id===post.userId):null;
    const displayName=isMine?'You':(post.name||post.user||'U');
    const initials=displayName.split(/[ .@]/).filter(Boolean).slice(0,2).map(w=>w[0]).join('').toUpperCase()||'?';
    const avatarSrc=(!isMine && post.avatar) || seedUser?.avatar;
    const avatarHtml=avatarSrc
      ?`<img src="${attr(avatarSrc)}" alt="" data-name="${attr(displayName)}" style="width:100%;height:100%;object-fit:cover;object-position:center top;border-radius:50%" onerror="this.onerror=null;avatarFallback(this)">`
      :esc(initials);
    const timeHint=post.trend>=92?'45m':post.trend>=85?'2h':post.trend>=75?'5h':'1d';

    // Item pills (right side on image)
    const pillItems=(post.items||[]).slice(0,4);
    const pillsHTML=pillItems.map((it,i)=>`
      <button class="fc-pill" data-shop="${attr(post.id||'')}" data-item="${i}" aria-label="${attr(it.name)}">
        <span class="ic-svg" style="width:17px;height:17px" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">${ICONS[catIcon(it.category)]||ICONS.hanger}</svg>
        </span>
      </button>`).join('');

    const followKey=post.userId||post.user||'';
    const isFollowing=followKey&&followState[followKey];
    const likeCount=fmtN((post.likes||0)+(liked?1:0));

    return `<div class="feed-card-full${isMine?' is-mine':''}" data-id="${attr(post.id||'')}">

      <div class="fc-header">
        <div class="fc-hdr-avatar">${avatarHtml}</div>
        <div class="fc-hdr-info">
          <div class="fc-hdr-user">
            ${!isMine
              ?`<button class="fc-username-tap" data-open-profile="${attr(post.userId||post.user||'')}">@${esc(post.user||'user')}</button>${post.verified?`<span class="fc-verified">${icon('checkCircle',12)}</span>`:''}`
              :`<span>@you</span>${icon('sparkle',12)}`}
          </div>
          <div class="fc-hdr-time">${timeHint}</div>
        </div>
        ${(!isMine&&followKey)
          ?`<button class="fc-follow-btn${isFollowing?' following':''}" data-follow-uid="${attr(followKey)}">${isFollowing?'Following':'+ Follow'}</button>`
          :isMine?`<span class="mine-tag">${icon('sparkle',12)} Your look</span>`:''}
        ${!isMine?`<button class="fc-more-btn" data-more-user="${attr(post.user||'')}" aria-label="More options">${icon('more',18)}</button>`:''}
      </div>

      <div class="fc-image-wrap">
        <div class="fcbg" style="background:${attr(post.grad||'linear-gradient(160deg,#a18cd1,#fbc2eb)')}">${bgImg}</div>
        <div class="heart-burst">${icon('heartFill',100)}</div>
      </div>

      <div class="fc-below">
        ${pillsHTML?`<div class="fc-item-pills">${pillsHTML}</div>`:''}
        <div class="fc-action-bar">
          <button class="fca-btn${liked?' liked':''}" data-action="like" data-id="${attr(post.id||'')}">
            <div class="fca-ico">${icon(liked?'heartFill':'heart',26)}</div>
          </button>
          <button class="fca-btn${saved?' saved':''}" data-action="save" data-id="${attr(post.id||'')}">
            <div class="fca-ico">${icon(saved?'bookmarkFill':'bookmark',24)}</div>
          </button>
          <button class="fca-btn" data-action="comment" data-id="${attr(post.id||'')}" aria-label="Comments">
            <div class="fca-ico">${icon('messageCircle',26)}</div>
            ${(()=>{const cc=getPostComments(post.id||'').length;return cc?`<span class="fca-count">${esc(String(cc))}</span>`:'';})()}
          </button>
          <button class="fca-btn" data-action="share">
            <div class="fca-ico">${icon('share',24)}</div>
          </button>
          <div class="fca-spacer"></div>
          ${lookTot?`<button class="fca-btn buy-btn buy-action"
              data-label="${attr(lbl)}" data-price="${attr(lookTot)}"
              data-earn="${attr(post.earn||0)}" data-user="${attr(post.user||'')}">
            <div class="fca-ico">${icon('bag',24)}</div>
            <span>$${esc(String(lookTot))}</span>
          </button>`:''}
          <button class="fca-btn" data-action="report" data-id="${attr(post.id||'')}" aria-label="Report" style="color:var(--muted,#8a8498)">
            <div class="fca-ico">${icon('flag',20)}</div>
          </button>
        </div>
        <div class="fc-likes">${likeCount} likes</div>
        <div class="fc-caption-blk">
          ${!isMine?`<button class="fc-username-tap fc-caption-uname" data-open-profile="${attr(post.userId||post.user||'')}">@${esc(post.user||'user')}</button>`:`<span class="fc-caption-uname">@you</span>`}
          <span class="fc-caption">${esc(post.caption||'')}</span>
        </div>
        <div class="fc-tags">${tagPills}</div>
        ${_ownWardrobe.length?`<span class="fc-match">${icon('hanger',11)} ${_ownScore.pct}% match to your closet</span>`:''}
        ${ownBadge}${earnLine}
      </div>
    </div>`;
  }

  function renderFeed(){
    const host=document.getElementById('feed-scroll');if(!host)return;
    LIKES=loadSet('awear_likes');SAVED=loadSet('awear_saved');
    host.innerHTML='';
    loadFeedPosts().forEach(p=>{
      const wrap=document.createElement('div');
      wrap.innerHTML=feedCardHTML({...p,id:p.id||'mine_'+p.ts,user:'you',
        grad:p.photo?null:'linear-gradient(160deg,#a18cd1,#fbc2eb)',img:p.photo||null,tags:p.tags||[],trend:95},true);
      host.appendChild(wrap.firstElementChild);
    });
    let seeds=SEED_POSTS.filter(p=>!isBlocked(p.user));
    if(!activeFilters.has('all')) seeds=seeds.filter(p=>(p.tags||[]).some(t=>activeFilters.has(t)));
    if(!seeds.length&&!loadFeedPosts().length){
      host.innerHTML=`<div class="feed-empty"><div class="big" style="display:flex;justify-content:center">${icon('search',50)}</div><p>No looks in this style yet</p></div>`;return;
    }
    seeds.forEach(post=>{const wrap=document.createElement('div');wrap.innerHTML=feedCardHTML(post,false);host.appendChild(wrap.firstElementChild);});
    bindFeedMoreMenu(host);
  }

  // ---- feed interactions ----
  function burstHeart(card){
    const h=card.querySelector('.heart-burst');if(!h)return;
    h.classList.remove('go');void h.offsetWidth;h.classList.add('go');
  }

  const feedScroll=document.getElementById('feed-scroll');
  // resolve a post (seed or the user's own shared look) by its id
  function feedPostById(id){
    return SEED_POSTS.find(p=>p.id===id) || loadFeedPosts().find(p=>(p.id||'mine_'+p.ts)===id) || null;
  }
  function shopPostItems(post,fallbackLabel,price,earn,user){
    if(post && post.items && post.items.length){
      const total=lookTotalOf(post);
      openSheetLook(post.name?(post.name+"'s look"):(post.caption||fallbackLabel||'The look'),
        post.items, total||price||post.look_total_usd, earn||post.earn||0, user||post.user||'');
      return true;
    }
    return false;
  }

  // ---- like API integration ----
  // Called after optimistic UI update. Syncs with /api/posts/{id}/like and updates count from server.
  // Fail loud: any API error is shown to user — no silent failure (Oren principle).
  async function togglePostLike(postId,btn){
    if(!postId)return;
    try{
      const res=await fetch(`/api/posts/${encodeURIComponent(postId)}/like`,{method:'POST'});
      if(!res.ok){
        // server rejected — revert optimistic state and inform user
        const errText=await res.text().catch(()=>'server error');
        showToast(`Couldn't like (${res.status})`);
        console.error('[like] API error',res.status,errText);
        // revert: flip the like state back
        const isNowLiked=btn.classList.contains('liked');
        if(isNowLiked){LIKES.delete(postId);}else{LIKES.add(postId);}
        saveSet('awear_likes',LIKES);
        const ico=btn.querySelector('.fca-ico');
        const revOn=LIKES.has(postId);
        ico.innerHTML=icon(revOn?'heartFill':'heart',22);
        btn.classList.toggle('liked',revOn);
        return;
      }
      const data=await res.json();
      // sync count from server (authoritative)
      const cnt=btn.querySelector('span');
      if(cnt&&typeof data.likes==='number')cnt.textContent=fmtN(data.likes);
    }catch(err){
      showToast("Can't reach the server");
      console.error('[like] fetch failed',err);
    }
  }

  feedScroll.addEventListener('click',e=>{
    // item pill — open item detail sheet
    const pill=e.target.closest('.fc-pill');
    if(pill){
      const post=feedPostById(pill.dataset.shop);
      const idx=Number(pill.dataset.item);
      const item=post&&post.items&&post.items[idx];
      if(item){
        const enriched={...item, style_tags:(item.style_tags&&item.style_tags.length)?item.style_tags:(post.tags||[])};
        openSheetItem(enriched, post.items);
      }
      return;
    }
    // follow button on feed card
    const followBtn=e.target.closest('.fc-follow-btn');
    if(followBtn){
      const uid=followBtn.dataset.followUid;if(!uid)return;
      followState[uid]=!followState[uid];
      localStorage.setItem('awear_follows',JSON.stringify(followState));
      followBtn.textContent=followState[uid]?'Following':'+ Follow';
      followBtn.classList.toggle('following',!!followState[uid]);
      showToast(followState[uid]?'Now following':'Unfollowed');
      return;
    }
    // bottom action bar buttons
    const action=e.target.closest('.fca-btn');if(!action)return;
    if(action.classList.contains('buy-action')||action.classList.contains('buy-btn')){
      // buy handled by main listener below
      return;
    }
    const type=action.dataset.action,id=action.dataset.id;
    if(type==='like'){
      const on=!LIKES.has(id);
      if(on)LIKES.add(id);else LIKES.delete(id);
      saveSet('awear_likes',LIKES);
      const ico=action.querySelector('.fca-ico');
      const post=SEED_POSTS.find(p=>p.id===id)||{likes:0};
      const newCount=fmtN((post.likes||0)+(on?1:0));
      ico.innerHTML=icon(on?'heartFill':'heart',26);
      action.classList.toggle('liked',on);
      const card=action.closest('.feed-card-full');
      const likesEl=card?.querySelector('.fc-likes');
      if(likesEl)likesEl.textContent=newCount+' likes';
      if(on&&card)burstHeart(card);
      togglePostLike(id,action);
    }
    if(type==='save'){
      const on=!SAVED.has(id);
      if(on)SAVED.add(id);else SAVED.delete(id);
      saveSet('awear_saved',SAVED);
      const ico=action.querySelector('.fca-ico'),cnt=action.querySelector('span');
      ico.innerHTML=icon(on?'bookmarkFill':'bookmark',24);
      action.classList.toggle('saved',on);
      if(cnt)cnt.textContent=on?'Saved':'Save';
      showToast(on?'Saved to your wishlist':'Removed from saved');
    }
    if(type==='share')showToast('Link copied');
    if(type==='comment'){
      e.stopPropagation();
      openCommentsSheet(id);
    }
    if(type==='report'){
      const post=feedPostById(id);
      reportContent('post', id, post?(post.caption||post.name||''):'');
    }
  });

  let lastTap=0,lastCard=null;
  feedScroll.addEventListener('pointerup',e=>{
    if(e.target.closest('.fca-btn')||e.target.closest('.fc-pill'))return;
    const card=e.target.closest('.feed-card-full');if(!card)return;
    const now=Date.now();
    if(now-lastTap<320&&lastCard===card){
      const id=card.dataset.id;LIKES.add(id);saveSet('awear_likes',LIKES);
      const btn=card.querySelector('[data-action="like"]');
      if(btn){const ico=btn.querySelector('.fca-ico');if(ico)ico.innerHTML=icon('heartFill',26);btn.classList.add('liked');}
      burstHeart(card);lastTap=0;
    } else {lastTap=now;lastCard=card;}
  });

  // ---- toast ----
  function showToast(msg){
    let t=document.getElementById('toast');
    if(!t){t=document.createElement('div');t.id='toast';t.className='toast';document.querySelector('.phone').appendChild(t);}
    t.textContent=msg;t.classList.add('show');clearTimeout(showToast._t);
    showToast._t=setTimeout(()=>t.classList.remove('show'),2400);
  }

  // ---- Reusable global create chooser (works from any header's + button) ----
  function openCreateMenu(){
    const ov = document.getElementById('create-overlay');
    if(!ov) return;
    // inject icons (icon() returns SVG string; safe innerHTML)
    const is = document.getElementById('create-ico-scan');
    const ic = document.getElementById('create-ico-checkin');
    if(is) is.innerHTML = icon('camera', 22);
    if(ic) ic.innerHTML = icon('calendar', 22);
    ov.classList.add('show');
    ov.setAttribute('aria-hidden','false');
  }
  function closeCreateMenu(){
    const ov = document.getElementById('create-overlay');
    if(!ov) return;
    ov.classList.remove('show');
    ov.setAttribute('aria-hidden','true');
  }
  (function wireCreateMenu(){
    const scan = document.getElementById('create-opt-scan');
    const checkin = document.getElementById('create-opt-checkin');
    if(scan) scan.addEventListener('click', ()=>{ closeCreateMenu(); document.getElementById('file-input').click(); });
    if(checkin) checkin.addEventListener('click', ()=>{ closeCreateMenu(); showDiaryModal(); });
  })();

  // ---- static UI icons (nav bar) ----
  document.getElementById('nav-ico-feed').innerHTML    = icon('play', 24);
  document.getElementById('nav-ico-shop').innerHTML    = icon('shoppingBag', 24);
  document.getElementById('nav-ico-ai').innerHTML      = icon('sparkle', 24);
  document.getElementById('nav-ico-dm').innerHTML      = icon('messageCircle', 24);
  document.getElementById('nav-ico-profile').innerHTML = icon('user', 24);

  // ---- global "+" create buttons in static-HTML headers: fill icon once (icon() is JS-only, DS-008) ----
  document.querySelectorAll('.app-create-btn').forEach(b => { if (!b.querySelector('svg')) b.innerHTML = icon('plus', 22); });

  // ---- header city pin — global-first: no hardcoded city, reflects user's own profile ----
  function updateHeaderCityPin() {
    const pin = document.getElementById('header-city-pin');
    if (!pin) return; // #header-city-pin removed from global header — no-op cleanly
    const city = loadProfile().city;
    pin.textContent = city ? `· ${city}` : '';
  }
  updateHeaderCityPin();

  // ---- Rewards & Gamification (hoisted above renderHome — TDZ fix) ----
  const RW_KEY = 'awear_rewards';
  const LEVELS = [
    {name:'Beginner', icon:'leaf', min:0, color:'var(--success)'},
    {name:'Stylist', icon:'sparkle', min:100, color:'var(--accent2)'},
    {name:'Trendsetter', icon:'flame', min:300, color:'var(--accent)'},
    {name:'Fashion Icon', icon:'crown', min:600, color:'#f59e0b'},
  ];
  const PERKS = [
    {name:'1 month Premium', desc:'Ad-free + advanced AI insights', pts:500, icon:'diamond'},
    {name:'Stylist consult', desc:'30 minutes with a human stylist', pts:300, icon:'sparkle'},
    {name:'Free shipping', desc:'On a Marketplace purchase', pts:150, icon:'box'},
    {name:'0% selling fee', desc:'One item, no commission', pts:100, icon:'tag'},
  ];
  const RW_ACTIONS = [
    {key:'scan', name:'Scan a look', icon:'camera', pts:10, desc:'Every new scan'},
    {key:'wore', name:'Wore it', icon:'hanger', pts:5, desc:'Daily wear log'},
    {key:'sell', name:'Sold an item', icon:'cash', pts:25, desc:'Sale on Marketplace'},
    {key:'refer', name:'Referred a friend', icon:'users', pts:50, desc:'Friend joined'},
  ];

  // ---- Daily Diary + Streak keys — declared BEFORE renderHome() reads them (TDZ-safe, per Iron Rule #9) ----
  const DIARY_KEY = 'awear_diary';
  const STREAK_KEY = 'awear_streak';
  const TASTE_KEY = 'awear_taste';

  // ---- Demo Seed — pre-populates closet + streak on first launch so the app looks full out-of-the-box ----
  const _DEMO_SEED_KEY = 'awear_demo_seeded_v1';
  const _DEMO_CLOSET_ITEMS = [
    {id:'ds1', category:'top',       name:'White Ribbed Crop Top',        color:'white',    brand_vibe:'Zara',            style_tags:['minimal','y2k'],        price_estimate_usd:25,  wear_count:12, search_query:'white ribbed cropped sleeveless tank top women',   image_url:'/static/img/closet/ds1.jpg'},
    {id:'ds2', category:'top',       name:'Vintage Band Graphic Tee',     color:'black',    brand_vibe:'vintage',         style_tags:['streetwear','vintage'], price_estimate_usd:35,  wear_count:9,  search_query:'vintage black band graphic tee oversized women',   image_url:'/static/img/closet/ds2.jpg'},
    {id:'ds3', category:'top',       name:'Black Ribbed Knit Turtleneck', color:'black',    brand_vibe:'COS',             style_tags:['minimal','classic'],    price_estimate_usd:48,  wear_count:7,  search_query:'black ribbed knit turtleneck women fitted', image_url:'/static/img/closet/ds3.jpg'},
    {id:'ds4', category:'bottoms',   name:'Barrel-Leg Light Wash Denim',  color:'light blue',brand_vibe:"Levi's",         style_tags:['denim','y2k'],          price_estimate_usd:80,  wear_count:21, search_query:'barrel leg light wash jeans women',               image_url:'/static/img/closet/ds4.jpg'},
    {id:'ds5', category:'bottoms',   name:'Straight-Leg Black Trousers',  color:'black',    brand_vibe:'COS',             style_tags:['minimal','office'],     price_estimate_usd:70,  wear_count:14, search_query:'straight leg black tailored trousers women',      image_url:'/static/img/closet/ds5.jpg'},
    {id:'ds6', category:'bottoms',   name:'Baggy Cargo Pants Khaki',      color:'khaki',    brand_vibe:'Carhartt',        style_tags:['streetwear','utility'], price_estimate_usd:90,  wear_count:0,  search_query:'baggy cargo pants khaki women utility',           image_url:'/static/img/closet/ds6.jpg'},
    {id:'ds7', category:'shoes',     name:'Adidas Samba OG White',        color:'white',    brand_vibe:'Adidas',          style_tags:['retro','sporty'],       price_estimate_usd:120, wear_count:18, search_query:'adidas samba og white black sneakers women',      image_url:'/static/img/closet/ds7.jpg'},
    {id:'ds8', category:'shoes',     name:'Pointed-Toe Leather Mules',    color:'black',    brand_vibe:'Mango',           style_tags:['elegant','minimal'],    price_estimate_usd:60,  wear_count:0,  search_query:'pointed toe black leather mules women',           image_url:'/static/img/closet/ds8.jpg'},
    {id:'ds9', category:'shoes',     name:'New Balance 550 White Cream',  color:'white',    brand_vibe:'New Balance',     style_tags:['retro','casual'],       price_estimate_usd:110, wear_count:11, search_query:'new balance 550 white cream sneakers women',      image_url:'/static/img/closet/ds9.jpg'},
    {id:'ds10',category:'outerwear', name:'Oversized Camel Blazer',       color:'camel',    brand_vibe:'& Other Stories', style_tags:['preppy','minimal'],     price_estimate_usd:150, wear_count:0,  search_query:'oversized camel blazer women wool',               image_url:'/static/img/closet/ds10.jpg'},
    {id:'ds11',category:'bag',       name:'Mini Crossbody Black Canvas',  color:'black',    brand_vibe:'streetwear',      style_tags:['streetwear','everyday'],price_estimate_usd:30,  wear_count:22, search_query:'mini black canvas crossbody bag streetwear',      image_url:'/static/img/closet/ds11.jpg'},
    {id:'ds12',category:'dress',     name:'Slip Satin Midi Dress',        color:'champagne',brand_vibe:'Reformation',     style_tags:['elegant','evening'],    price_estimate_usd:145, wear_count:2,  search_query:'slip satin midi dress champagne women', image_url:'/static/img/closet/ds12.jpg'},
    {id:'ds13',category:'jewelry',   name:'Gold Layered Necklace',        color:'gold',     brand_vibe:'Mejuri',          style_tags:['minimal','gold'],       price_estimate_usd:48,  wear_count:26, search_query:'gold layered necklace women minimal delicate', image_url:'/static/img/closet/ds13.jpg'},
  ];
  function _seedDemoCloset() {
    if (localStorage.getItem(_DEMO_SEED_KEY)) return;
    if (!loadWardrobe().length) {
      saveWardrobe(_DEMO_CLOSET_ITEMS);
      const p = loadProfile();
      if (!p.name || p.name === 'My Style') {
        saveProfile(Object.assign({}, p, {name:'Carmel Pikarsky', handle:'carmel', city:'Tel Aviv', bio:'Minimal / Y2K / streetwear'}));
      }
      // Show a 7-day streak so the home screen looks like an active user
      if (!loadStreak().count) {
        const prev = new Date(); prev.setDate(prev.getDate() - 1);
        const yd = prev.getFullYear() + '-' + String(prev.getMonth()+1).padStart(2,'0') + '-' + String(prev.getDate()).padStart(2,'0');
        saveStreak({count:7, lastDate:yd, best:7});
      }
      // Seed 3 demo looks so the Looks tab shows content on first launch
      if (!loadFeedPosts().length) {
        const now = Date.now();
        saveFeedPosts([
          {ts:now-4*86400000, id:'demo_post_1', photo:'/static/feed/1.jpg',
           caption:'Y2K Minimal', occasion:'Everyday / Coffee shop',
           item_count:3, look_total_usd:225,
           items:[
             {category:'top',name:'White Ribbed Crop Top',price_estimate_usd:25,search_query:'white ribbed cropped sleeveless tank top women'},
             {category:'bottoms',name:'Barrel-Leg Light Wash Denim',price_estimate_usd:80,search_query:'barrel leg light wash jeans women'},
             {category:'shoes',name:'Adidas Samba OG White',price_estimate_usd:120,search_query:'adidas samba og white black sneakers'},
           ],
           tags:['minimal','y2k','top','bottoms','shoes']},
          {ts:now-2*86400000, id:'demo_post_2', photo:'/static/feed/2.jpg',
           caption:'Urban Streetwear', occasion:'Weekend / Street',
           item_count:4, look_total_usd:255,
           items:[
             {category:'top',name:'Vintage Band Graphic Tee',price_estimate_usd:35,search_query:'vintage black band graphic tee oversized'},
             {category:'bottoms',name:'Baggy Cargo Pants Khaki',price_estimate_usd:90,search_query:'baggy cargo pants khaki women utility'},
             {category:'shoes',name:'New Balance 550 White Cream',price_estimate_usd:110,search_query:'new balance 550 white cream sneakers'},
             {category:'bag',name:'Mini Crossbody Black Canvas',price_estimate_usd:30,search_query:'mini black canvas crossbody bag streetwear'},
           ],
           tags:['streetwear','vintage','utility','top','bottoms','shoes','bag']},
          {ts:now-86400000, id:'demo_post_3', photo:'/static/feed/100_1072.JPG',
           caption:'Minimal Chic', occasion:'Office / Dinner',
           item_count:3, look_total_usd:280,
           items:[
             {category:'outerwear',name:'Oversized Camel Blazer',price_estimate_usd:150,search_query:'oversized camel blazer women wool'},
             {category:'bottoms',name:'Straight-Leg Black Trousers',price_estimate_usd:70,search_query:'straight leg black tailored trousers women'},
             {category:'shoes',name:'Pointed-Toe Leather Mules',price_estimate_usd:60,search_query:'pointed toe black leather mules women'},
           ],
           tags:['minimal','office','outerwear','bottoms','shoes']},
        ]);
      }
    }
    localStorage.setItem(_DEMO_SEED_KEY, '1');
  }
  _seedDemoCloset();

  // One-time: set the profile owner's name (runs once per flag version; bump version to force a re-apply)
  (function _setProfileOwner(){
    const KEY='awear_profile_owner_v3';
    if(localStorage.getItem(KEY)) return;
    const p=loadProfile();
    saveProfile(Object.assign({},p,{
      name:'Carmel Pikarsky',
      handle:(!p.handle||p.handle==='me'||p.handle==='noavibes'||p.handle==='carmel')?'carmel':p.handle,
      photo: p.photo || '/static/img/users/carmel/avatar.jpg'
    }));
    localStorage.setItem(KEY,'1');
  })();

  // Auto-render feed on load (default tab) — deferred so followState + all late-inits are ready
  requestAnimationFrame(() => showView('feed'));
  // Wire marketplace filter sheet (overlay + apply + reset) — runs once after DOM ready
  requestAnimationFrame(initMPFilterSheet);

  // ---- Home Screen ----

  function todayStr() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
  }
  function loadDiary()  { return JSON.parse(localStorage.getItem(DIARY_KEY)  || '[]'); }
  function saveDiary(d) { localStorage.setItem(DIARY_KEY, JSON.stringify(d)); }
  function loadStreak() { return JSON.parse(localStorage.getItem(STREAK_KEY) || '{"count":0,"lastDate":"","best":0}'); }
  function saveStreak(s){ localStorage.setItem(STREAK_KEY, JSON.stringify(s)); }

  function isDiaryLoggedToday() {
    const today = todayStr();
    return loadDiary().some(function(e){ return e.date === today; });
  }

  function computeAndSaveStreak() {
    const today = todayStr();
    const s = loadStreak();
    if (s.lastDate === today) return s;
    const prev = new Date(); prev.setDate(prev.getDate() - 1);
    const yStr = prev.getFullYear() + '-' + String(prev.getMonth()+1).padStart(2,'0') + '-' + String(prev.getDate()).padStart(2,'0');
    s.count = (s.lastDate === yStr) ? (s.count || 0) + 1 : 1;
    s.lastDate = today;
    s.best = Math.max(s.best || 0, s.count);
    saveStreak(s);
    return s;
  }

  function showDiaryModal() {
    var existing = document.getElementById('diary-overlay');
    if (existing) existing.remove();
    var wardrobe = JSON.parse(localStorage.getItem('awear_wardrobe') || '[]');
    var today = todayStr();
    var diaryEntry = loadDiary().find(function(e){ return e.date === today; });
    var alreadySel = new Set((diaryEntry ? diaryEntry.items : []).map(function(i){ return i.id; }));
    var selectedIds = new Set(alreadySel);

    var itemsHtml = wardrobe.length ? wardrobe.map(function(it){
      return '<div class="diary-item' + (selectedIds.has(it.id) ? ' selected' : '') + '" data-id="' + attr(it.id) + '">' +
        productImage(it, 'diary-pimg') +
        '<div class="diary-item-name">' + esc(it.name || catLabel(it.category)) + '</div>' +
        '<div class="diary-item-check">' + icon('check', 12) + '</div>' +
      '</div>';
    }).join('') :
    '<div class="diary-empty">' + icon('hanger', 32) + '<span>Add items to your closet first</span></div>';

    var overlay = document.createElement('div');
    overlay.id = 'diary-overlay';
    overlay.className = 'diary-overlay';
    overlay.innerHTML =
      '<div class="diary-sheet">' +
        '<div class="diary-handle"></div>' +
        '<div class="diary-head-row">' +
          '<div class="diary-title">' + icon('calendar', 18) + ' What did you wear today?</div>' +
          '<button class="mp-fsheet-x diary-x-close" aria-label="Close"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button>' +
        '</div>' +
        '<div class="diary-sub">Tap the items you wore. Abigail learns your style with every entry.</div>' +
        '<div class="diary-grid" id="diary-grid">' + itemsHtml + '</div>' +
        '<div class="diary-extra">' +
          '<textarea class="diary-note" id="diary-note" rows="2" maxlength="280" placeholder="Add a note — how did it feel? (optional)">' + esc(diaryEntry && diaryEntry.note ? diaryEntry.note : '') + '</textarea>' +
          '<button class="diary-private" id="diary-private" type="button" aria-pressed="' + (diaryEntry && diaryEntry.private === false ? 'false' : 'true') + '">' +
            '<span class="diary-private-ico" id="diary-private-ico"></span>' +
            '<span class="diary-private-txt"><span class="diary-private-label" id="diary-private-label"></span><span class="diary-private-sub" id="diary-private-sub"></span></span>' +
          '</button>' +
        '</div>' +
        '<div class="diary-footer">' +
          '<button class="diary-submit" id="diary-submit"' + (wardrobe.length ? '' : ' disabled') + '>' +
            icon('check', 16) + ' Log outfit' +
          '</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(overlay);
    requestAnimationFrame(function(){ overlay.classList.add('show'); });
    overlay.querySelector('.diary-x-close')?.addEventListener('click', function(){ closeDiaryModal(overlay); });

    var grid = overlay.querySelector('#diary-grid');
    var submitBtn = overlay.querySelector('#diary-submit');
    var noteEl = overlay.querySelector('#diary-note');
    var privBtn = overlay.querySelector('#diary-private');
    // Private by default (true). Restore prior choice if the user already logged today.
    var isPrivate = !(diaryEntry && diaryEntry.private === false);

    function refreshPrivacy() {
      privBtn.classList.toggle('on', isPrivate);
      privBtn.setAttribute('aria-pressed', isPrivate ? 'true' : 'false');
      overlay.querySelector('#diary-private-ico').innerHTML = icon(isPrivate ? 'lock' : 'globe', 16);
      overlay.querySelector('#diary-private-label').textContent = isPrivate ? 'Private journal' : 'Shared on profile';
      overlay.querySelector('#diary-private-sub').textContent = isPrivate ? 'Only you can see this entry' : 'Visible to people who view your profile';
    }
    refreshPrivacy();
    privBtn.addEventListener('click', function(){ isPrivate = !isPrivate; refreshPrivacy(); });

    function refreshBtn() {
      submitBtn.innerHTML = icon('check', 16) + ' Log outfit' +
        (selectedIds.size ? ' (' + selectedIds.size + ' item' + (selectedIds.size > 1 ? 's' : '') + ')' : '');
    }

    grid.addEventListener('click', function(e) {
      var item = e.target.closest('.diary-item[data-id]');
      if (!item) return;
      var id = item.dataset.id;
      if (selectedIds.has(id)) { selectedIds.delete(id); item.classList.remove('selected'); }
      else { selectedIds.add(id); item.classList.add('selected'); }
      refreshBtn();
    });

    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) closeDiaryModal(overlay);
    });

    submitBtn.addEventListener('click', function() {
      var note = (noteEl.value || '').trim();
      var diary = loadDiary().filter(function(e){ return e.date !== today; });
      var items = wardrobe.filter(function(it){ return selectedIds.has(it.id); })
        .map(function(it){ return {id: it.id, name: it.name || '', category: it.category || ''}; });
      diary.push({date: today, items: items, note: note, private: isPrivate, ts: Date.now()});
      saveDiary(diary);
      // Local streak first = instant feedback / offline-safe cache.
      var s = computeAndSaveStreak();
      closeDiaryModal(overlay);
      renderHome();
      var milestones = {3: '3-day streak! You\'re building a habit.', 7: 'Week streak! Abigail knows your style.', 30: '30-day streak! You\'re AWEAR\'s top stylist.'};
      showToast(milestones[s.count] || ('Outfit logged · ' + s.count + '-day streak'));
      // Server = source of truth: sync in the background, reconcile the streak when it returns.
      dailyLogSync(today, items, note, isPrivate);
    });
  }

  function closeDiaryModal(overlay) {
    overlay.classList.remove('show');
    setTimeout(function(){ if (overlay.parentNode) overlay.remove(); }, 260);
  }

  // ---- Daily-log backend sync (server = source of truth, localStorage = fast cache/fallback) ----
  const SERVER_STREAK_KEY = 'awear_server_streak';   // last server streak snapshot {current_streak,best_streak,logged_today}
  const REMINDER_KEY      = 'awear_reminder_time';   // "HH:MM" or "" (off)
  const REMINDER_SHOWN_KEY = 'awear_reminder_shown'; // date string — banner already shown today

  function loadServerStreak(){ try { return JSON.parse(localStorage.getItem(SERVER_STREAK_KEY) || 'null'); } catch(e){ return null; } }
  function saveServerStreak(s){ if (s) localStorage.setItem(SERVER_STREAK_KEY, JSON.stringify(s)); }

  // Map server streak shape -> local streak cache so existing widgets stay consistent.
  function reconcileLocalStreak(server){
    if (!server) return;
    var s = loadStreak();
    s.count = (typeof server.current_streak === 'number') ? server.current_streak : s.count;
    s.best  = Math.max(s.best || 0, server.best_streak || 0, s.count || 0);
    if (server.logged_today) s.lastDate = todayStr();
    saveStreak(s);
  }

  // POST today's check-in. Graceful: any failure leaves the local cache intact (already saved).
  async function dailyLogSync(date, items, note, isPrivate){
    try {
      const res = await fetch('/api/daily-log', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ date: date, items: items, note: note || '', private: isPrivate !== false })
      });
      if (!res.ok) { console.warn('[daily-log] POST', res.status); return; }
      const data = await res.json();
      if (data && data.streak) { saveServerStreak(data.streak); reconcileLocalStreak(data.streak); }
      renderStreakPanel();
      renderJournalPreview();
    } catch(err){ console.warn('[daily-log] POST failed — local cache kept', err); }
  }

  // GET the authoritative streak; reconcile + refresh the AI-section panel.
  async function refreshServerStreak(){
    try {
      const res = await fetch('/api/daily-log/streak');
      if (!res.ok) return null;
      const s = await res.json();
      saveServerStreak(s); reconcileLocalStreak(s);
      renderStreakPanel();
      return s;
    } catch(err){ return null; }
  }

  // GET the private journal (newest first). Returns [] on any failure (caller falls back to local).
  async function fetchJournal(){
    try {
      const res = await fetch('/api/daily-log');
      if (!res.ok) return null;
      const data = await res.json();
      return (data && Array.isArray(data.items)) ? data.items : [];
    } catch(err){ return null; }
  }

  // ---- In-app daily reminder (lightweight, no web-push) ----
  function loadReminderTime(){ return localStorage.getItem(REMINDER_KEY) || ''; }
  function saveReminderTime(v){ if (v) localStorage.setItem(REMINDER_KEY, v); else localStorage.removeItem(REMINDER_KEY); }

  // On app load: if a reminder time is set, it has passed, and today isn't logged → show a dismissible banner once/day.
  async function maybeShowReminderBanner(){
    const rt = loadReminderTime();
    if (!rt) return;
    const today = todayStr();
    if (localStorage.getItem(REMINDER_SHOWN_KEY) === today) return;
    const now = new Date();
    const cur = String(now.getHours()).padStart(2,'0') + ':' + String(now.getMinutes()).padStart(2,'0');
    if (cur < rt) return; // reminder time not reached yet
    // Prefer server truth for logged_today; fall back to local diary.
    let loggedToday = isDiaryLoggedToday();
    const srv = loadServerStreak();
    if (srv && typeof srv.logged_today === 'boolean') loggedToday = srv.logged_today;
    if (loggedToday) return;
    showReminderBanner();
  }

  function showReminderBanner(){
    if (document.getElementById('checkin-reminder')) return;
    localStorage.setItem(REMINDER_SHOWN_KEY, todayStr());
    const bar = document.createElement('div');
    bar.id = 'checkin-reminder';
    bar.className = 'checkin-reminder';
    bar.innerHTML =
      '<span class="cr-ico">' + icon('flame', 18) + '</span>' +
      '<span class="cr-txt">Keep your streak alive — log what you wore today.</span>' +
      '<button class="cr-cta" id="cr-cta">Check in</button>' +
      '<button class="cr-x" id="cr-x" aria-label="Dismiss">' + icon('x', 16) + '</button>';
    document.body.appendChild(bar);
    requestAnimationFrame(function(){ bar.classList.add('show'); });
    function dismiss(){ bar.classList.remove('show'); setTimeout(function(){ if (bar.parentNode) bar.remove(); }, 240); }
    bar.querySelector('#cr-x').addEventListener('click', dismiss);
    bar.querySelector('#cr-cta').addEventListener('click', function(){ dismiss(); showDiaryModal(); });
    setTimeout(function(){ if (bar.parentNode) dismiss(); }, 8000);
  }

  // Kick off server reconcile + reminder check once the app is up (deferred, non-blocking).
  requestAnimationFrame(function(){ refreshServerStreak().then(maybeShowReminderBanner); });

  // ---- Shared occasion engine (home "Today's Look" + AI Stylist daily hero) ----
  // Single source of truth for the time+day → occasion mapping. Both renderHome()
  // and the AI Stylist "Today's Look" hero call pickOccasionForNow() — do NOT duplicate.
  const OCC_POOL = [
    {label:'Date Night',    icon:'heartFill', tags:['elegant','evening','minimal'],       tip:'Elevate with your gold necklace for the final touch.'},
    {label:'Work Ready',    icon:'briefcase', tags:['office','minimal','classic'],         tip:'Polished, confident, and investment-piece ready.'},
    {label:'Street Style',  icon:'flame',     tags:['streetwear','urban','vintage','y2k'], tip:'Let your sneakers anchor the whole look.'},
    {label:'Casual Day',    icon:'coffee',    tags:['casual','retro','sporty','denim'],    tip:'Your most comfortable fit that still turns heads.'},
    {label:'Weekend Vibes', icon:'wave',      tags:['casual','y2k','streetwear'],          tip:'Off-duty energy with just the right amount of style.'},
    {label:'Editorial',     icon:'sparkle',   tags:['minimal','clean','classic'],          tip:'Clean lines, quiet confidence — the AWEAR signature.'},
  ];
  // Ranked occasion list for "now" — the first entry is the primary pick for the moment.
  function occasionRankForNow(now) {
    now = now || new Date();
    const hr = now.getHours();
    const dow = now.getDay();
    const order = [];
    if (hr >= 18) order.push(0);                                  // evening → Date Night
    else if (dow >= 1 && dow <= 4 && hr >= 8) order.push(1);      // weekday daytime → Work Ready
    else if (dow === 0 || dow === 6) order.push(4);               // weekend → Weekend Vibes
    else order.push(3);                                          // default → Casual Day
    [2, 5, 3, 4, 0, 1].forEach(function(idx){ if (order.indexOf(idx) === -1) order.push(idx); });
    return order.map(function(idx){ return OCC_POOL[idx]; });
  }
  function _timeOfDayLabel(hr) {
    return hr < 5 ? 'late night' : hr < 12 ? 'morning' : hr < 17 ? 'afternoon' : 'evening';
  }
  // Returns {occ, dayLabel, timeLabel, eyebrow} for the current moment.
  function pickOccasionForNow(now) {
    now = now || new Date();
    const occ = occasionRankForNow(now)[0];
    const dateLocale = (typeof LOCALE !== 'undefined' && LOCALE === 'he') ? 'he-IL' : 'en-US';
    const dayLabel = now.toLocaleDateString(dateLocale, {weekday:'long'});
    const timeLabel = _timeOfDayLabel(now.getHours());
    return { occ, dayLabel, timeLabel, eyebrow: dayLabel + ' ' + timeLabel + ' · ' + occ.label };
  }

  function renderHome() {
    const prof = loadProfile();
    const wardrobe = JSON.parse(localStorage.getItem('awear_wardrobe') || '[]');
    const now = new Date();
    const hour = now.getHours();
    const greet = hour < 5 ? t('home.greeting_night') : hour < 12 ? t('home.greeting_morning') : hour < 17 ? t('home.greeting_noon') : t('home.greeting_evening');
    const name = prof.name ? prof.name.split(' ')[0] : t('home.greeting_name_fallback');
    const dateLocale = LOCALE === 'he' ? 'he-IL' : 'en-US';
    const dateStr = now.toLocaleDateString(dateLocale, {weekday:'long', day:'numeric', month:'long'});

    const tops    = wardrobe.filter(i => i.category === 'top');
    const bottoms = wardrobe.filter(i => i.category === 'bottoms' || i.category === 'dress');
    const shoes   = wardrobe.filter(i => i.category === 'shoes');
    const hasOutfits = tops.length > 0 && bottoms.length > 0;

    // L4(a) — proactive occasion picks: context-aware outfit suggestions by time + day.
    // Uses the shared occasion engine (occasionRankForNow) — same source as the AI Stylist hero.
    const _occ3 = occasionRankForNow(now).slice(0, 3);
    function _tagScore(item, occTags) {
      var itTags = (item.style_tags || []).map(function(t){ return t.toLowerCase(); });
      return occTags.filter(function(t){ return itTags.indexOf(t) !== -1; }).length;
    }
    function _bestFor(items, occTags) {
      if (!items.length) return null;
      return items.slice().sort(function(a, b){ return _tagScore(b, occTags) - _tagScore(a, occTags); })[0];
    }
    const outfits = [];
    if (hasOutfits) {
      const count = Math.min(3, Math.max(tops.length, bottoms.length));
      for (let i = 0; i < count; i++) {
        const occ = _occ3[i % _occ3.length];
        outfits.push({
          top:    _bestFor(tops, occ.tags) || tops[i % tops.length],
          bottom: _bestFor(bottoms, occ.tags) || bottoms[i % bottoms.length],
          shoe:   shoes.length ? (_bestFor(shoes, occ.tags) || shoes[i % shoes.length]) : null,
          occ,
        });
      }
    }

    const totalItems = wardrobe.length;
    const totalValue = wardrobe.reduce((s,i) => s + (i.price_estimate_usd||0), 0);
    const totalWears = wardrobe.reduce((s,i) => s + (i.wear_count||0), 0);

    document.getElementById('home-wrap').innerHTML = `
      <div class="home-greeting-section">
        <div class="home-greeting">${esc(greet)}, <em>${esc(name)}</em></div>
        <div class="home-date">${esc(dateStr)}</div>
      </div>

      ${hasOutfits ? `
      <div class="home-sec-label">${t('home.outfit_today')}</div>
      <div class="home-outfit-row" id="ho-row">
        ${outfits.map((o,i) => {
          const names = [o.top.name, o.bottom.name, o.shoe?.name].filter(Boolean).slice(0,2).join(' + ');
          return `<div class="ho-card${i===0?' sel':''}" data-idx="${i}">
            <div class="ho-top">
              ${productImage(o.top, 'ho-top-img ho-hero-img')}
              ${o.bottom ? `<div class="ho-swatch">${productImage(o.bottom, 'ho-top-img ho-swatch-img')}</div>` : ''}
            </div>
            <div class="ho-info">
              <div class="ho-occasion-badge">${icon(o.occ.icon,10)} ${esc(o.occ.label)}</div>
              <div class="ho-sub">${esc(names)}</div>
              <div class="ho-tip">${esc(o.occ.tip)}</div>
            </div>
          </div>`;
        }).join('')}
      </div>
      <div class="home-actions">
        <button class="ha-btn ha-primary" id="ha-wore">${icon('check',16)} ${t('home.wore_it')}</button>
        <button class="ha-btn ha-secondary" onclick="showView('closet')">${t('home.my_closet_btn')}</button>
      </div>
      ` : `
      <div class="home-scan-prompt" id="hsp" onclick="document.getElementById('file-input').click()">
        <div class="hsp-icon">${icon('camera',22)}</div>
        <div class="hsp-title">${t('home.scan_title')}</div>
        <div class="hsp-sub">${t('home.scan_sub')}</div>
      </div>
      `}

      <div class="home-sec-label">${t('home.wardrobe_section')}</div>
      <div class="home-stats-row">
        <div class="hs-stat" onclick="showView('analytics')">
          <div class="hs-num">${totalItems}</div>
          <div class="hs-label">${t('home.stat_items')}</div>
        </div>
        <div class="hs-stat" onclick="showView('analytics')">
          <div class="hs-num">${totalValue > 999 ? '$'+(totalValue/1000).toFixed(1)+'K' : totalValue ? '$'+totalValue : '—'}</div>
          <div class="hs-label">${t('home.stat_value')}</div>
        </div>
        <div class="hs-stat" onclick="showView('analytics')">
          <div class="hs-num">${totalWears}</div>
          <div class="hs-label">${t('home.stat_wears')}</div>
        </div>
      </div>

      ${(() => {
        const st = loadStreak();
        const logged = isDiaryLoggedToday();
        const dotCount = Math.min(st.count, 7);
        const dots = Array.from({length: 7}, (_, i) =>
          '<div class="streak-dot' + (i < dotCount ? ' done' : '') + '"></div>'
        ).join('');
        return '<div class="streak-widget">' +
          '<div class="streak-fire">' + icon('flame', 22) + '</div>' +
          '<div class="streak-info">' +
            '<div class="streak-count">' + st.count + '</div>' +
            '<div class="streak-label">day streak' + (st.count !== 1 ? 's' : '') + '</div>' +
            (st.best > 1 ? '<div class="streak-best">Best: ' + st.best + ' days</div>' : '') +
            '<div class="streak-dots">' + dots + '</div>' +
          '</div>' +
          (logged
            ? '<div class="streak-logged-badge">' + icon('check', 14) + ' Logged</div>'
            : '<button class="streak-log-btn" onclick="showDiaryModal()">' + icon('plus', 14) + ' Log today</button>') +
        '</div>';
      })()}

      ${(() => {
        // Profile completeness card
        const onboarded = !!localStorage.getItem('awear_onboarded');
        const hasName = !!(prof.name);
        const hasPhoto = !!(prof.photo);
        const hasFeed = loadFeedPosts().length > 0;
        const steps = [
          {done: wardrobe.length > 0, label: t('home.step_scan_item'), action: "document.getElementById('file-input').click()", pts: 25},
          {done: onboarded, label: t('home.step_style_quiz'), action: "showOnboarding()", pts: 25},
          {done: hasName, label: t('home.step_add_name'), action: "showView('closet')", pts: 20},
          {done: hasPhoto, label: t('home.step_add_photo'), action: "showView('closet')", pts: 15},
          {done: hasFeed, label: t('home.step_share_feed'), action: "showView('feed')", pts: 15},
        ];
        const donePts = steps.filter(s => s.done).reduce((a,s) => a + s.pts, 0);
        const totalPts = steps.reduce((a,s) => a + s.pts, 0);
        const completePct = Math.round((donePts / totalPts) * 100);
        const nextStep = steps.find(s => !s.done);
        if (completePct < 100) {
          return `
          <div class="home-sec-label">${t('home.profile_pct_title', {pct: completePct})}</div>
          <div onclick="${nextStep ? nextStep.action : ''}" style="margin:0 16px 16px;background:var(--card);border:1px solid rgba(255,255,255,.06);border-radius:16px;padding:16px;cursor:pointer;box-shadow:0 2px 16px rgba(0,0,0,.24)">
            <div style="height:6px;background:var(--line);border-radius:3px;overflow:hidden;margin-bottom:12px">
              <div style="height:100%;width:${completePct}%;background:linear-gradient(90deg,var(--accent),var(--accent2));border-radius:3px;transition:width .4s ease"></div>
            </div>
            ${nextStep ? `<div style="display:flex;align-items:center;gap:12px">
              <div style="color:var(--accent)">${icon('sparkle',22)}</div>
              <div style="flex:1">
                <div style="font-size:var(--t-small,13px);font-weight:800">${esc(t('home.next_step_label', {step: nextStep.label}))}</div>
                <div style="font-size:var(--t-micro,11px);color:var(--accent);font-weight:700;margin-top:4px">+${nextStep.pts} ${t('home.points_suffix')}</div>
              </div>
              <div style="font-size:var(--t-h3,15px);color:var(--muted)">›</div>
            </div>` : ''}
          </div>`;
        }
        return '';
      })()}

      ${(() => {
        const rw = JSON.parse(localStorage.getItem(RW_KEY) || '{"points":0}');
        const pts = rw.points || 0;
        const nextLevel = LEVELS.find(l => l.min > pts) || LEVELS[LEVELS.length-1];
        const curLevel  = [...LEVELS].reverse().find(l => pts >= l.min) || LEVELS[0];
        const pct = nextLevel.min > curLevel.min ? Math.round(((pts - curLevel.min) / (nextLevel.min - curLevel.min)) * 100) : 100;
        const DAILY = [
          {icon:'camera', text:'Scan a new item to your closet', pts:20},
          {icon:'sparkle', text:'Create a look with AI', pts:15},
          {icon:'chat', text:'Ask Abigail something', pts:10},
          {icon:'cart', text:'List an item for sale', pts:25},
        ];
        const todayChallenge = DAILY[new Date().getDay() % DAILY.length];
        return `
        <div class="home-sec-label">${t('home.challenge_section')}</div>
        <div style="margin:0 16px 16px;background:linear-gradient(135deg,rgba(123,92,255,.12),rgba(255,61,119,.08));border:1px solid rgba(123,92,255,.2);border-radius:16px;padding:16px;">
          <div style="display:flex;align-items:center;gap:12px;">
            <div style="color:var(--accent2)">${icon(todayChallenge.icon, 28)}</div>
            <div style="flex:1">
              <div style="font-size:var(--t-small,13px);font-weight:800">${esc(todayChallenge.text)}</div>
              <div style="font-size:var(--t-micro,11px);color:var(--accent2);font-weight:700;margin-top:4px">+${todayChallenge.pts} points</div>
            </div>
          </div>
          <div style="margin-top:12px;">
            <div style="display:flex;justify-content:space-between;font-size:var(--t-micro,11px);font-weight:700;color:var(--muted);margin-bottom:6px">
              <span style="display:inline-flex;align-items:center;gap:4px">${icon(curLevel.icon,12)} ${esc(curLevel.name)} · ${pts} pts</span>
              <span>${esc(nextLevel.name)} ${nextLevel.min} pts</span>
            </div>
            <div style="height:6px;background:var(--line);border-radius:3px;overflow:hidden">
              <div style="height:100%;width:${pct}%;background:linear-gradient(90deg,var(--accent),var(--accent2));border-radius:3px;transition:width .4s ease"></div>
            </div>
          </div>
        </div>`;
      })()}

      <div class="home-sec-label">${t('home.quick_actions')}</div>
      <div class="home-quick" style="overflow-x:auto;scrollbar-width:none;flex-wrap:nowrap;padding-bottom:4px">
        <button class="hq-btn" style="flex-shrink:0" onclick="showView('outfits')"><span class="hq-icon">${icon('sparkle', 20)}</span>Outfit AI</button>
        <button class="hq-btn" style="flex-shrink:0" onclick="showView('shopping')"><span class="hq-icon">${icon('bag', 20)}</span>Shopping</button>
        <button class="hq-btn" style="flex-shrink:0" onclick="showView('chat')"><span class="hq-icon">${icon('chat', 20)}</span>Abigail</button>
        <button class="hq-btn" style="flex-shrink:0" onclick="showView('stylists')"><span class="hq-icon">${icon('user', 20)}</span>Stylists</button>
        <button class="hq-btn" style="flex-shrink:0" onclick="showView('analytics')"><span class="hq-icon">${icon('barChart', 20)}</span>Analytics</button>
        <button class="hq-btn" style="flex-shrink:0" onclick="showView('wishlist')"><span class="hq-icon">${icon('bookmark', 20)}</span>Wishlist</button>
        <button class="hq-btn" style="flex-shrink:0" onclick="showView('marketplace')"><span class="hq-icon">${icon('cart', 20)}</span>Marketplace</button>
        <button class="hq-btn" style="flex-shrink:0" onclick="showView('compare')"><span class="hq-icon">${icon('scale', 20)}</span>Compare</button>
        <button class="hq-btn" style="flex-shrink:0" onclick="showView('rewards')"><span class="hq-icon">${icon('award', 20)}</span>Rewards</button>
        <button class="hq-btn" style="flex-shrink:0" onclick="showView('wallet')"><span class="hq-icon">${icon('coins', 20)}</span>Wallet</button>
        <button class="hq-btn" style="flex-shrink:0" onclick="showView('agents')"><span class="hq-icon">${icon('users', 20)}</span>Agent Team</button>
        <button class="hq-btn" style="flex-shrink:0" onclick="showView('sustainability')"><span class="hq-icon">${icon('leaf', 20)}</span>Eco</button>
        <button class="hq-btn" style="flex-shrink:0" onclick="showView('season-recap')"><span class="hq-icon">${icon('sparkle', 20)}</span>My Season</button>
      </div>
    `;

    // Outfit card selection
    const hoRow = document.getElementById('ho-row');
    if (hoRow) {
      hoRow.querySelectorAll('.ho-card').forEach(card => {
        card.addEventListener('click', () => {
          hoRow.querySelectorAll('.ho-card').forEach(c => c.classList.remove('sel'));
          card.classList.add('sel');
        });
      });
    }

    // "Wore it" button
    const haWore = document.getElementById('ha-wore');
    if (haWore) {
      haWore.addEventListener('click', () => {
        const selIdx = Number(document.querySelector('.ho-card.sel')?.dataset.idx ?? 0);
        const outfit = outfits[selIdx];
        if (outfit) {
          const wardrobe2 = JSON.parse(localStorage.getItem('awear_wardrobe') || '[]');
          [outfit.top, outfit.bottom, outfit.shoe].filter(Boolean).forEach(item => {
            const match = wardrobe2.find(w => w.name === item.name);
            if (match) match.wear_count = (match.wear_count || 0) + 1;
          });
          localStorage.setItem('awear_wardrobe', JSON.stringify(wardrobe2));
          showToast('Logged! Look saved');
          haWore.textContent = 'Saved';
          haWore.disabled = true;
        }
      });
    }

  }

  // ---- Native share (Web Share API on iOS / Capacitor WKWebView; clipboard fallback on desktop) ----
  function shareStyleCard(title, text) {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title, text, url }).catch(() => {});
    } else if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text + ' ' + url)
        .then(() => showToast('Copied — paste it anywhere to share'),
              () => showToast('Sharing not available here'));
    } else {
      showToast('Sharing not available here');
    }
  }

  // ---- Season Report ----
  // ---- Seasonal Recap (Valentino — Commerce & Intelligence) ----
  function getActiveSeason() {
    const m = new Date().getMonth(); // 0-11
    const y = new Date().getFullYear();
    // Summer: April(3) – September(8)
    if (m >= 3 && m <= 8) return { name: 'Summer', year: y, icon: 'sun', start: new Date(y,3,1), end: new Date(y,8,30) };
    // Winter: October(9) – March(2)
    const winterYear = m >= 9 ? y : y - 1;
    return { name: 'Winter', year: winterYear + 1, icon: 'sparkle', start: new Date(winterYear,9,1), end: new Date(winterYear+1,2,31) };
  }

  function renderSeasonRecap(season) {
    season = season || getActiveSeason();
    const wrap = document.getElementById('season-recap-wrap');
    if (!wrap) return;

    // Derive wardrobe data or use seeds
    let itemsCount = 24, outfitsLogged = 42, seasonScore = 71, deadItems = 8, deadValue = 340;
    let champData = [
      { name: 'Black Blazer', wears: 14, cat: 'outerwear' },
      { name: 'White Sneakers', wears: 11, cat: 'shoes' },
      { name: 'Linen Shirt', wears: 8, cat: 'top' },
    ];
    let identityLabel = 'The Quiet Minimalist';
    let identityTags = ['Monochrome', 'Clean Lines', 'Effortless'];
    let items = [];
    try {
      const raw = localStorage.getItem('awear_wardrobe');
      items = raw ? JSON.parse(raw) : [];
      if (items.length > 0) {
        itemsCount = items.length;
        const wornItems = items.filter(i => (i.wear_count||0) > 0);
        outfitsLogged = wornItems.reduce((s,i) => s + (i.wear_count||0), 0) || 42;
        const neverWorn = items.filter(i => !(i.wear_count||0));
        deadItems = neverWorn.length || 8;
        deadValue = Math.round(neverWorn.reduce((s,i) => s + (i.price_estimate_usd||0), 0)) || 340;
        seasonScore = itemsCount > 0 ? Math.min(99, Math.round((wornItems.length / itemsCount) * 100 + 12)) : 71;
        const sorted = [...items].sort((a,b) => (b.wear_count||0) - (a.wear_count||0));
        if (sorted[0]) champData = sorted.slice(0,3).map(i => ({ name: i.name||'Item', wears: i.wear_count||1, cat: i.category||'top' }));
        const tags = items.flatMap(i => i.tags || []);
        const tagFreq = {};
        tags.forEach(t => { tagFreq[t] = (tagFreq[t]||0)+1; });
        const topTags = Object.entries(tagFreq).sort((a,b)=>b[1]-a[1]).slice(0,3).map(e=>e[0]);
        if (topTags.length) {
          identityTags = topTags;
          const dominated = topTags[0]?.toLowerCase() || '';
          if (dominated.includes('vintage') || dominated.includes('retro')) identityLabel = 'The Vintage Collector';
          else if (dominated.includes('street') || dominated.includes('urban')) identityLabel = 'The Streetwear Pioneer';
          else if (dominated.includes('bold') || dominated.includes('color')) identityLabel = 'The Bold Maximalist';
          else identityLabel = 'The Quiet Minimalist';
        }
      }
    } catch(e) {}

    // Extended analytics — derived from hoisted items array
    const _COLOR_MAP={
      black:'#1a1a1a',white:'#f5f0ea',cream:'#f5f0ea',ivory:'#f5f0ea',beige:'#d4b896',
      navy:'#1d2d44',blue:'#2563eb',cobalt:'#0047ab',
      red:'#e8526a',rose:'#e8526a',pink:'#f472b6',coral:'#f87171',
      orange:'#fb923c',terracotta:'#c2523c',rust:'#b45309',
      yellow:'#fbbf24',gold:'#d97706',camel:'#c4855a',tan:'#c4855a',sand:'#d4b896',
      green:'#16a34a',sage:'#7fb069',olive:'#84714b',khaki:'#9ca382',
      purple:'#7a6af0',lavender:'#a78bfa',mauve:'#9661c0',violet:'#8b5cf6',
      brown:'#8b5e3c',burgundy:'#800020',wine:'#722f37',
      grey:'#9ca3af',gray:'#9ca3af',charcoal:'#4b5563',silver:'#e2e8f0',
      teal:'#0d9488',mint:'#a7f3d0',turquoise:'#06b6d4',
    };
    function _srHex(name){
      const n=(name||'').toLowerCase().replace(/[\s\-_]/g,'');
      for(const[k,v]of Object.entries(_COLOR_MAP)){if(n.includes(k))return v;}
      return '#9ca3af';
    }
    const COLOR_SEEDS=[
      {name:'Noir',hex:'#1a1a1a',pct:32},{name:'Ivory',hex:'#f5f0ea',pct:24},
      {name:'Terracotta',hex:'#e8526a',pct:18},{name:'Camel',hex:'#c4855a',pct:16},
      {name:'Mauve',hex:'#7a6af0',pct:10},
    ];
    const colorFreqMap={};
    items.forEach(i=>{const c=(i.color||'').toLowerCase().trim();if(c&&c.length>1)colorFreqMap[c]=(colorFreqMap[c]||0)+Math.max(i.wear_count||0,1);});
    const colorEntries=Object.entries(colorFreqMap).sort((a,b)=>b[1]-a[1]).slice(0,5);
    const totalCW=colorEntries.reduce((s,[,v])=>s+v,0)||1;
    const paletteData=colorEntries.length>=2
      ?colorEntries.map(([name,count])=>({name:name.charAt(0).toUpperCase()+name.slice(1),hex:_srHex(name),pct:Math.round(count/totalCW*100)}))
      :COLOR_SEEDS;
    const maxSwatchPct=Math.max(...paletteData.map(c=>c.pct),1);

    const catBuckets={};
    items.forEach(i=>{
      const cat=(i.category||'other').toLowerCase();
      if(!catBuckets[cat])catBuckets[cat]={total:0,worn:0,wears:0,value:0};
      catBuckets[cat].total++;catBuckets[cat].wears+=(i.wear_count||0);catBuckets[cat].value+=(i.price_estimate_usd||0);
      if((i.wear_count||0)>0)catBuckets[cat].worn++;
    });
    const CAT_SEEDS=[
      {label:'Tops',util:72},{label:'Shoes',util:80},{label:'Bottoms',util:58},
      {label:'Outerwear',util:33},{label:'Bags',util:45},{label:'Dresses',util:25},
    ];
    const catRows=Object.entries(catBuckets).sort((a,b)=>b[1].wears-a[1].wears).slice(0,6)
      .map(([cat,d])=>({label:cat.charAt(0).toUpperCase()+cat.slice(1),util:d.total>0?Math.round(d.worn/d.total*100):0}));
    const catDisplay=catRows.length>=2?catRows:CAT_SEEDS;
    const isSummer = season.name === 'Summer';
    const SR_FILLS = isSummer
      ? ['var(--summer-blue,#34b3e0)','var(--summer-1,#f5c84b)','var(--summer-blue2,#1f8fc4)','var(--summer-2,#e89a2c)','var(--summer-blue,#34b3e0)','var(--summer-1,#f5c84b)']
      : ['var(--accent,#e8526a)','var(--accent2,#c4855a)','var(--accent3,#7a6af0)','var(--success,#52c97a)','var(--warning,#e8a84a)','var(--muted,#8a8498)'];

    const brandBuckets={};
    items.forEach(i=>{const b=(i.brand||'').trim();if(b)brandBuckets[b]=(brandBuckets[b]||0)+1;});
    const brandEntries=Object.entries(brandBuckets).sort((a,b)=>b[1]-a[1]).slice(0,5);
    const BRAND_SEEDS=[['Zara',7],['H&M',5],['Nike',4],['Vintage',3]];
    const brandsDisplay=brandEntries.length>=2?brandEntries:BRAND_SEEDS;
    const maxBrand=Math.max(...brandsDisplay.map(([,v])=>v),1);

    const cpwByCat=Object.entries(catBuckets)
      .filter(([,d])=>d.wears>0&&d.value>0)
      .map(([cat,d])=>({label:cat.charAt(0).toUpperCase()+cat.slice(1),cpw:+(d.value/d.wears).toFixed(0)}))
      .sort((a,b)=>a.cpw-b.cpw).slice(0,5);
    const CPW_SEEDS=[{label:'Shoes',cpw:8},{label:'Tops',cpw:12},{label:'Bags',cpw:19},{label:'Bottoms',cpw:24},{label:'Outerwear',cpw:67}];
    const cpwData=cpwByCat.length>=2?cpwByCat:CPW_SEEDS;
    const maxCpwVal=Math.max(...cpwData.map(c=>c.cpw),1);

    const avgPriceByCat=Object.entries(catBuckets)
      .filter(([,d])=>d.total>0&&d.value>0)
      .map(([cat,d])=>({label:cat.charAt(0).toUpperCase()+cat.slice(1),avg:+(d.value/d.total).toFixed(0)}))
      .sort((a,b)=>b.avg-a.avg).slice(0,6);
    const AVG_PRICE_SEEDS=[{label:'Outerwear',avg:148},{label:'Shoes',avg:92},{label:'Bags',avg:78},{label:'Dresses',avg:65},{label:'Bottoms',avg:48},{label:'Tops',avg:34}];
    const avgPriceData=avgPriceByCat.length>=2?avgPriceByCat:AVG_PRICE_SEEDS;
    const maxAvgPrice=Math.max(...avgPriceData.map(c=>c.avg),1);

    const activeRatio=itemsCount>0?Math.round(((itemsCount-deadItems)/itemsCount)*100):66;

    const moodClass = season.name === 'Summer' ? 'season-mood-summer' : 'season-mood-winter';
    const recapSection = document.getElementById('season-recap');
    if (recapSection) {
      recapSection.classList.remove('season-mood-summer','season-mood-winter');
      recapSection.classList.add(moodClass);
    }

    const scoreBg = `var(--card,#1e1a22)`;
    const scoreColor = `var(--accent,#e8526a)`;
    const circumference = 2 * Math.PI * 46; // r=46
    const scoreOffset = circumference - (seasonScore / 100) * circumference;

    wrap.innerHTML = `
      <!-- Hero -->
      <div class="sr-hero">
        <button class="sr-back-btn" onclick="history.back()||showView('closet')" aria-label="Back">
          ${icon('arrowRight',16)} Back
        </button>
        <div class="sr-hero-season">${esc(season.name)}</div>
        <div class="sr-hero-year">${season.year}</div>
        <div class="sr-hero-sub">Your ${esc(season.name)} ${season.year} in Style</div>
      </div>

      <!-- Numbers -->
      <div class="sr-stats-row">
        <div class="sr-stat-cell"><div class="sr-stat-num">${itemsCount}</div><div class="sr-stat-lbl">Items this season</div></div>
        <div class="sr-stat-cell"><div class="sr-stat-num">${outfitsLogged}</div><div class="sr-stat-lbl">Outfits logged</div></div>
        <div class="sr-stat-cell"><div class="sr-stat-num">${seasonScore}</div><div class="sr-stat-lbl">Season score</div></div>
      </div>

      <!-- Style Identity -->
      <div class="sr-section">
        <div class="sr-section-title">${icon('sparkle',16)} Your Style Identity</div>
        <div class="sr-identity-card">
          <div class="sr-identity-label">${esc(identityLabel)}</div>
          <div class="sr-identity-tags">
            ${identityTags.map(t => `<span class="sr-tag">${esc(t)}</span>`).join('')}
          </div>
        </div>
      </div>

      <!-- Color Story -->
      <div class="sr-section">
        <div class="sr-section-title">${icon('sparkle',16)} Your Color Story</div>
        <div class="sr-insight">Your wardrobe speaks in color. These shades defined your ${esc(season.name)} ${season.year}.</div>
        <div class="sr-palette-wrap">
          <div class="sr-palette-cols">
            ${paletteData.map(c=>`<div class="sr-palette-col"><div class="sr-palette-pct">${c.pct}%</div><div class="sr-palette-swatch" style="background:${c.hex};height:${Math.round(20+(c.pct/maxSwatchPct)*56)}px" aria-label="${c.name}"></div><div class="sr-palette-name">${c.name}</div></div>`).join('')}
          </div>
        </div>
      </div>

      <!-- Active Wardrobe -->
      <div class="sr-section">
        <div class="sr-active-card">
          <div class="sr-active-num">${activeRatio}%</div>
          <div class="sr-active-body">
            <div class="sr-active-headline">${activeRatio>=70?'Closet Champion':activeRatio>=50?'Solid Foundation':'Room to Grow'}</div>
            <div class="sr-active-sub">of your wardrobe worn this ${esc(season.name)}. ${activeRatio<50?deadItems+' items still waiting for their moment.':"You're putting your closet to work."}</div>
          </div>
        </div>
      </div>

      <!-- Wear Champions -->
      <div class="sr-section">
        <div class="sr-section-title">${icon('flame',16)} What You Loved This ${esc(season.name)}</div>
        <div class="sr-champ-row">
          ${champData.map(c => `
            <div class="sr-champ-item">
              <div class="sr-champ-icon">${icon(catIcon(c.cat)||'hanger',22)}</div>
              <div class="sr-champ-name">${esc(c.name)}</div>
              <div class="sr-champ-wears">${c.wears} wears</div>
            </div>`).join('')}
        </div>
      </div>

      <!-- Category Utilization -->
      <div class="sr-section">
        <div class="sr-section-title">${icon('barChart',16)} How Each Category Performed</div>
        <div class="sr-insight">The percentage of items in each category you actually wore this ${esc(season.name)}.</div>
        <div class="sr-bar-list">
          ${catDisplay.map((c,i)=>`<div class="sr-bar-row"><div class="sr-bar-lbl">${c.label}</div><div class="sr-bar-track"><div class="sr-bar-fill" style="width:${c.util}%;background:${SR_FILLS[i]||SR_FILLS[0]}"></div></div><div class="sr-bar-val">${c.util}%</div></div>`).join('')}
        </div>
      </div>

      <!-- Brand Universe -->
      <div class="sr-section">
        <div class="sr-section-title">${icon('tag',16)} Your Brand Universe</div>
        <div class="sr-insight">The labels making up your closet this season.</div>
        <div class="sr-bar-list">
          ${brandsDisplay.map(([brand,count])=>`<div class="sr-brand-row"><div class="sr-bar-lbl">${brand}</div><div class="sr-bar-track"><div class="sr-bar-fill" style="width:${Math.round(count/maxBrand*100)}%;background:${isSummer?'var(--summer-1,#f5c84b)':'var(--accent2,#c4855a)'}"></div></div><div class="sr-bar-val">${count}</div></div>`).join('')}
        </div>
      </div>

      <!-- CPW by Category -->
      <div class="sr-section">
        <div class="sr-section-title">${icon('coins',16)} Cost Per Wear</div>
        <div class="sr-insight">${cpwData[0]?'Your '+cpwData[0].label+' are your best investment at $'+cpwData[0].cpw+'/wear.':'Log more wears to unlock your cost-per-wear breakdown.'}</div>
        <div class="sr-cpw-wrap">
          <div class="sr-bar-list">
            ${cpwData.map((c,i)=>`<div class="sr-bar-row"><div class="sr-bar-lbl">${c.label}</div><div class="sr-bar-track"><div class="sr-bar-fill" style="width:${Math.round(c.cpw/maxCpwVal*100)}%;background:${isSummer?(i===0?'var(--summer-blue,#34b3e0)':'var(--summer-1,#f5c84b)'):(i===0?'var(--success,#52c97a)':'var(--accent,#e8526a)')}"></div></div><div class="sr-bar-val">$${c.cpw}</div></div>`).join('')}
          </div>
        </div>
      </div>

      <!-- Average Price by Category -->
      <div class="sr-section">
        <div class="sr-section-title">${icon('receipt',16)} Average Item Price by Category</div>
        <div class="sr-insight">${avgPriceData[0]?'You invest the most in '+avgPriceData[0].label.toLowerCase()+' — $'+avgPriceData[0].avg+' on average per item.':'Based on your wardrobe values.'}</div>
        <div class="sr-bar-list">
          ${avgPriceData.map(c=>`<div class="sr-bar-row"><div class="sr-bar-lbl">${c.label}</div><div class="sr-bar-track"><div class="sr-bar-fill" style="width:${Math.round(c.avg/maxAvgPrice*100)}%;background:${isSummer?'var(--summer-blue,#34b3e0)':'var(--accent2,#c4855a)'}"></div></div><div class="sr-bar-val">$${c.avg}</div></div>`).join('')}
        </div>
      </div>

      <!-- Dead Zone -->
      <div class="sr-section">
        <div class="sr-dead-zone">
          <div class="sr-dead-title">${icon('alertTriangle',16)} Unworn this season</div>
          <div class="sr-dead-value">${deadItems} items sitting idle · estimated $${deadValue} value</div>
          <button class="sr-dead-cta" onclick="mpTab='sell';showView('marketplace')" aria-label="List unworn items for sale">
            ${icon('tag',16)} List in My Store
          </button>
        </div>
      </div>

      <!-- Season Score Ring + Share -->
      <div class="sr-score-section">
        <div class="sr-section-title" style="margin-bottom:0">${icon('award',16)} Your Season Score</div>
        <div class="sr-score-ring" aria-label="Season score ${seasonScore}">
          <svg width="120" height="120" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="46" fill="none" stroke="var(--card,#1e1a22)" stroke-width="10"/>
            <circle cx="60" cy="60" r="46" fill="none" stroke="var(--accent,#e8526a)" stroke-width="10"
              stroke-dasharray="${circumference.toFixed(1)}" stroke-dashoffset="${scoreOffset.toFixed(1)}"
              stroke-linecap="round"/>
          </svg>
          <span class="sr-score-ring-num">${seasonScore}</span>
        </div>
        <div class="sr-score-compare">Community avg: 52 &middot; <strong>You: ${seasonScore}</strong></div>
        <button class="sr-share-btn" id="sr-share-btn" aria-label="Share your season recap">
          ${icon('share',18)} Share Your Season
        </button>
      </div>
    `;

    document.getElementById('sr-share-btn')?.addEventListener('click', () => {
      shareStyleCard(
        `My ${season.name} ${season.year} Style Recap`,
        `I scored ${seasonScore} on my ${season.name} style recap on AWEAR. Check yours!`
      );
    });
  }

  // ---- Analytics ----
  function renderAnalytics() {
    const wardrobe = JSON.parse(localStorage.getItem('awear_wardrobe') || '[]');
    const el = document.getElementById('analytics-wrap');

    if (!wardrobe.length) {
      el.innerHTML = `
        <div class="an-header" style="display:flex;align-items:center;gap:8px">${icon('barChart',20)} Analytics</div>
        <div class="an-empty">
          ${icon('hanger',36)}
          <br>Your closet is empty
          <br><span style="font-size:var(--t-caption,12px);font-weight:500;opacity:.6">Add your first item to see insights</span>
          <br><button class="ha-btn ha-primary" style="margin-top:20px;display:inline-flex;align-items:center;gap:8px" onclick="showView('closet')">${icon('plus',16)} Add your first item</button>
        </div>`;
      return;
    }

    // ---- Data calculations ----
    const totalItems = wardrobe.length;
    const totalWears = wardrobe.reduce((s,i) => s + (i.wear_count||0), 0);
    const totalValue = wardrobe.reduce((s,i) => s + (i.price_estimate_usd||0), 0);

    // Single source of truth: seed fallbacks ONLY when there is no real wear data.
    const hasWearData = totalWears > 0;

    // Utilization: items worn at least once / total (seed 34% only if no wear data)
    const wornItems = wardrobe.filter(i => (i.wear_count||0) > 0);
    const utilizationPct = hasWearData ? Math.round((wornItems.length / totalItems) * 100) : 34;

    // Active (worn 3+) and never worn — all derived from the same source, so worn% + never% = 100
    const activeItems = wardrobe.filter(i => (i.wear_count||0) >= 3);
    const activePct = hasWearData ? Math.round((activeItems.length / totalItems) * 100) : 42;
    const neverWorn = wardrobe.filter(i => (i.wear_count||0) === 0);
    const neverPct = hasWearData ? Math.round((neverWorn.length / totalItems) * 100) : 18;

    // Cost per wear
    const itemsWithCPW = wardrobe.filter(i => i.price_estimate_usd > 0 && (i.wear_count||0) > 0);
    const avgCPW = itemsWithCPW.length > 0
      ? (itemsWithCPW.reduce((s,i) => s + i.price_estimate_usd / i.wear_count, 0) / itemsWithCPW.length).toFixed(2)
      : '8.40';

    // Wear champion & hidden cost
    const sortedByWear = [...wardrobe].sort((a,b) => (b.wear_count||0) - (a.wear_count||0));
    const champion = sortedByWear.find(i => (i.wear_count||0) > 0);
    // Hidden Cost = the real item with the worst cost-per-wear (price ÷ max(1, wears)).
    // Always a genuine wardrobe item; null only when there is no wear/price data.
    const hiddenCost = hasWearData
      ? ([...wardrobe]
          .filter(i => (i.price_estimate_usd||0) > 0 && (i.wear_count||0) >= 1)
          .sort((a,b) => (b.price_estimate_usd/Math.max(1,b.wear_count||0)) - (a.price_estimate_usd/Math.max(1,a.wear_count||0)))[0] || null)
      : null;

    // Sustainability score (rewear ratio vs community 52%)
    // Real rewear = share of wardrobe worn MORE THAN ONCE (worn >= 2). NOT utilization (worn >= 1).
    const rewornItems = wardrobe.filter(i => (i.wear_count||0) >= 2);
    const rewearScore = hasWearData ? Math.round((rewornItems.length / totalItems) * 100) : 30;
    const scoreColor = rewearScore >= 50
      ? 'var(--success, #52c97a)'
      : rewearScore >= 30
        ? 'var(--warning, #e8a84a)'
        : 'var(--danger, #e05252)';

    // Composite Closet Health Score (0-100): utilization 40% + active-wear 30% + rewear 30%
    const healthScore = Math.min(100, Math.round(utilizationPct * 0.4 + activePct * 0.3 + rewearScore * 0.3));
    const healthGrade = healthScore >= 80 ? 'A' : healthScore >= 60 ? 'B' : healthScore >= 40 ? 'C' : 'D';
    const healthColor = healthScore >= 80 ? 'var(--success,#52c97a)' : healthScore >= 60 ? 'var(--accent2,#c4855a)' : healthScore >= 40 ? 'var(--warning,#e8a84a)' : 'var(--danger,#e05252)';
    const healthDesc = healthScore >= 80 ? 'Your wardrobe is thriving.' : healthScore >= 60 ? 'Good habits — keep it up.' : healthScore >= 40 ? 'Getting there — wear more to climb.' : 'Time to refresh your wardrobe habits.';
    // Coach, not report card: name the single weakest weighted lever and the next grade up.
    const nextGrade = { D: 'C', C: 'B', B: 'A', A: 'A' }[healthGrade] || healthGrade;
    // Weighted contributions — same weights as healthScore (util .4, active .3, rewear .3).
    const _contrib = [
      { key: 'util', val: utilizationPct * 0.4 },
      { key: 'active', val: activePct * 0.3 },
      { key: 'rewear', val: rewearScore * 0.3 },
    ];
    const _weakest = _contrib.sort((a, b) => a.val - b.val)[0].key;
    let _coachHint;
    if (neverWorn.length > 0 && (_weakest === 'util' || _weakest === 'active')) {
      _coachHint = `Wear ${neverWorn.length} never-worn item${neverWorn.length === 1 ? '' : 's'} to climb toward Grade ${nextGrade}.`;
    } else if (_weakest === 'rewear') {
      _coachHint = `Re-wear a few favorites again to reach Grade ${nextGrade}.`;
    } else {
      _coachHint = `Wear a wider range of your closet to reach Grade ${nextGrade}.`;
    }
    const healthHint = healthScore >= 80
      ? `${activePct}% actively worn · ${rewearScore}% rewear rate`
      : _coachHint;

    // Style identity — derive from tags or seed
    const allTags = wardrobe.flatMap(i => i.style_tags || []);
    const tagCount = {};
    allTags.forEach(t => { tagCount[t] = (tagCount[t]||0)+1; });
    const topTags = Object.entries(tagCount).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([t])=>t);
    const identityTags = topTags.length >= 2 ? topTags : ['minimal', 'vintage', 'Y2K'];
    const STYLE_ARCHETYPES = {
      minimal: 'The Quiet Minimalist',
      vintage: 'The Vintage Collector',
      streetwear: 'The Street Auteur',
      y2k: 'The Y2K Revivalist',
      boho: 'The Free Spirit',
      office: 'The Power Dresser',
      coastal: 'The Coastal Romantic',
      cottagecore: 'The Cottagecore Dreamer',
    };
    const primaryTag = (identityTags[0]||'minimal').toLowerCase();
    const archetype = STYLE_ARCHETYPES[primaryTag] || 'The Quiet Minimalist';
    // Honest "range" line — only when the shown tags span more than the primary family,
    // so a clean archetype name above mixed pills reads as range, not a system error.
    const _coreWord = primaryTag.charAt(0).toUpperCase() + primaryTag.slice(1);
    const _rangeTags = identityTags.slice(1)
      .filter(t => (t||'').toLowerCase() !== primaryTag)
      .map(t => (t||'').toLowerCase());
    const identityRange = _rangeTags.length
      ? `${_coreWord} core, with ${_rangeTags.join(' + ')} range`
      : '';

    // Dead zone: real least-worn items. Prefer truly never-worn; else infer from lowest wear counts.
    const deadItems = neverWorn.length > 0
      ? neverWorn
      : [...wardrobe].sort((a,b) => (a.wear_count||0) - (b.wear_count||0)).slice(0, 3);
    const deadCount = deadItems.length;
    const deadValue = Math.round(deadItems.reduce((s,i) => s + (i.price_estimate_usd||0), 0)) || 340;
    // Truthful copy: real "never worn in 60+ days" only when items are genuinely never-worn.
    const deadCopy = neverWorn.length > 0 ? "haven't been worn in 60+ days" : 'are barely worn';
    // Store for openDeadZoneListSheet() — updated each time analytics renders.
    _deadZoneItems = deadItems;

    // Color distribution (kept for category bars)
    const catMap = {};
    wardrobe.forEach(i => { const c = i.category||'other'; catMap[c] = (catMap[c]||0)+1; });
    const topCats = Object.entries(catMap).sort((a,b)=>b[1]-a[1]).slice(0,4);

    // ---- Render ----
    el.innerHTML = `
      <div class="an-header" style="display:flex;align-items:center;gap:8px">${icon('barChart',20)} Analytics</div>

      <!-- 0. Closet Health Score — composite single metric -->
      <div class="an-hs-card" style="border:1.5px solid color-mix(in srgb,${healthColor} 28%,transparent)">
        <div class="an-hs-top">
          <div class="an-hs-kicker">Closet Health Score</div>
          <div class="an-hs-grade" style="color:${healthColor};border-color:${healthColor};background:color-mix(in srgb,${healthColor} 12%,transparent)">${healthGrade}</div>
        </div>
        <div class="an-hs-body">
          <div class="an-hs-ring" style="background:conic-gradient(${healthColor} ${healthScore}%, var(--line,#2e2836) 0);color:${healthColor}">
            <div class="an-hs-num">${healthScore}</div>
            <div class="an-hs-denom">/ 100</div>
          </div>
          <div class="an-hs-info">
            <div class="an-hs-desc">${esc(healthDesc)}</div>
            <div class="an-hs-hint">${esc(healthHint)}</div>
          </div>
        </div>
      </div>

      <!-- 1. Hero Stats Bar -->
      <div class="an-hero">
        <div class="an-box"><div class="an-box-num">${totalItems}</div><div class="an-box-label">items</div></div>
        <div class="an-box"><div class="an-box-num">${utilizationPct}%</div><div class="an-box-label">utilization</div></div>
        <div class="an-box"><div class="an-box-num">$${avgCPW}</div><div class="an-box-label">avg cost/wear</div></div>
      </div>

      <!-- 2. Style Identity Card -->
      <div class="an-identity-card">
        <button class="an-identity-share" id="an-identity-share-btn" aria-label="Share style identity">${icon('share',18)}</button>
        <div class="an-identity-kicker">Your Style Identity</div>
        <div class="an-identity-name">${esc(archetype)}</div>
        <div class="an-identity-tags">
          ${identityTags.map(t => `<span class="an-identity-pill">${esc(t)}</span>`).join('')}
        </div>
        ${identityRange ? `<div class="an-identity-range">${esc(identityRange)}</div>` : ''}
      </div>

      <!-- 3. Cost Per Wear Mini-Grid -->
      <div class="an-cpw-grid">
        <div class="an-cpw-card">
          <div class="an-cpw-label champion">${icon('flame',12)} Wear Champion</div>
          <div class="an-cpw-value">${champion ? esc(champion.name) : 'Black Blazer'}</div>
          <div class="an-cpw-sub">${champion
            ? `${champion.wear_count} wears · $${Math.round(champion.price_estimate_usd/champion.wear_count)||2}/wear`
            : '47 wears · $2.30/wear'
          }</div>
        </div>
        <div class="an-cpw-card"${hiddenCost ? ` style="cursor:pointer" onclick="openSellFormWithItem('${attr(JSON.stringify(hiddenCost))}')"` : ''}>
          <div class="an-cpw-label hidden-cost">${icon('alert',12)} Hidden Cost</div>
          <div class="an-cpw-value">${hiddenCost ? esc(hiddenCost.name) : 'Satin Skirt'}</div>
          <div class="an-cpw-sub">${hiddenCost
            ? `bought $${hiddenCost.price_estimate_usd} · ${hiddenCost.wear_count||0} wear${(hiddenCost.wear_count||0)===1?'':'s'} · $${Math.round(hiddenCost.price_estimate_usd/Math.max(1,hiddenCost.wear_count||0))}/wear`
            : 'bought $180 · worn 1 time'
          }</div>
          ${hiddenCost ? `<div class="an-cpw-recover">${icon('tag',11)} Recover ~$${Math.round(hiddenCost.price_estimate_usd*0.5)} — tap to list</div>` : ''}
        </div>
      </div>

      <!-- 4. Wardrobe Health -->
      <div class="an-section" style="padding-bottom:0">
        <div class="an-sec-title" style="display:inline-flex;align-items:center;gap:6px">${icon('target',16)} Wardrobe Health</div>
      </div>
      <div class="an-health-section">
        <div class="an-health-row">
          <div class="an-health-meta">
            <span class="an-health-lbl">Utilization · worn 1+×</span>
            <span class="an-health-pct" style="color:var(--success,#52c97a)">${utilizationPct}%</span>
          </div>
          <div class="an-health-bar"><div class="an-health-fill" style="width:${utilizationPct}%;background:var(--success,#52c97a)"></div></div>
        </div>
        <div class="an-health-row">
          <div class="an-health-meta">
            <span class="an-health-lbl">Active Items (3+ wears)</span>
            <span class="an-health-pct" style="color:var(--accent2,#c4855a)">${activePct}%</span>
          </div>
          <div class="an-health-bar"><div class="an-health-fill" style="width:${activePct}%;background:var(--accent2,#c4855a)"></div></div>
        </div>
        <div class="an-health-row">
          <div class="an-health-meta">
            <span class="an-health-lbl">Never Worn</span>
            <span class="an-health-pct" style="color:var(--danger,#e05252)">${neverPct}%</span>
          </div>
          <div class="an-health-bar"><div class="an-health-fill" style="width:${neverPct}%;background:var(--danger,#e05252)"></div></div>
        </div>
      </div>

      <!-- 5. Dead Zone Alert -->
      <div class="an-alert-card">
        <div class="an-alert-title">${icon('alert',16)} ${deadCount} item${deadCount!==1?'s':''} ${deadCopy}</div>
        <div class="an-alert-sub">~$${deadValue} tied up · sell and earn <strong style="color:var(--success,#52c97a);font-weight:800">~$${Math.round(deadValue*0.5)}</strong></div>
        <div class="an-alert-actions">
          <button class="an-alert-btn primary" onclick="showToast('Challenge accepted — pick one this week!')">Wear one this week</button>
          <button class="an-alert-btn" onclick="openDeadZoneListSheet()">List in My Store</button>
        </div>
      </div>

      <!-- 6. Sustainability Score -->
      <div class="an-section" style="padding-bottom:0">
        <div class="an-sec-title" style="display:inline-flex;align-items:center;gap:6px">${icon('leaf',16)} Sustainability</div>
      </div>
      <div class="an-score-section">
        <div class="an-score-ring" style="background:conic-gradient(${scoreColor} ${rewearScore}%, var(--line,#2e2836) 0);color:${scoreColor}">
          <div class="an-score-number">${rewearScore}</div>
          <div class="an-score-unit">/ 100</div>
        </div>
        <div class="an-score-info">
          <div class="an-score-title">Rewear Score</div>
          <div class="an-score-sub">You re-wear ${rewearScore}% of items 2+ times — your true favorites.<br>Community avg: 52%</div>
        </div>
      </div>

      <!-- Category bars (kept from v1) -->
      ${topCats.length > 1 ? `
      <div class="an-section">
        <div class="an-sec-title" style="display:inline-flex;align-items:center;gap:6px">${icon('hanger',16)} By category</div>
        ${topCats.map(([cat, count]) => {
          const pct = Math.round((count/totalItems)*100);
          return `<div class="an-bar-row">
            <div class="an-bar-lbl">${esc(catLabel(cat))}</div>
            <div class="an-bar-track"><div class="an-bar-fill" style="width:${pct}%"></div></div>
            <div class="an-bar-pct">${pct}%</div>
          </div>`;
        }).join('')}
      </div>` : ''}

      <!-- Smart Declutter CTA -->
      <div class="an-section">
        <button class="ha-btn ha-primary" style="width:100%;display:inline-flex;align-items:center;justify-content:center;gap:8px" onclick="runDeclutter()">${icon('sparkle',16)} Smart Declutter — let AI clean your closet</button>
      </div>

      <!-- 7. Season Style Report — entry card -->
      ${(() => {
        const s = getActiveSeason();
        return `<div class="an-wrapped-teaser season-entry-analytics" style="cursor:pointer" onclick="showView('season-recap')" role="button" tabindex="0" aria-label="Open ${s.name} ${s.year} recap">
          <div class="an-wrapped-year">AWEAR · ${s.year}</div>
          <div class="an-wrapped-title">Your ${esc(s.name)} ${s.year} in Style</div>
          <div class="an-wrapped-actions">
            <button class="an-wrapped-cta" onclick="event.stopPropagation();showView('season-recap')" aria-label="See full season report" style="min-height:44px">
              ${icon('barChart', 16)} See Full Recap
            </button>
            <button class="an-wrapped-share" id="an-wrapped-share-btn" aria-label="Share season report" style="min-height:44px;min-width:44px">
              ${icon('share', 18)}
            </button>
          </div>
        </div>`;
      })()}
    `;

    document.getElementById('an-identity-share-btn')?.addEventListener('click', () => {
      shareStyleCard(
        `My Style Identity: ${archetype}`,
        `My AWEAR style identity is "${archetype}" — ${identityTags.join(', ')}. What's yours?`
      );
    });
    document.getElementById('an-wrapped-share-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      const s = getActiveSeason();
      shareStyleCard(
        `My ${s.name} ${s.year} in Style`,
        `Check out my ${s.name} ${s.year} style report on AWEAR.`
      );
    });
  }

  // ---- Outfit Generator ----
  const OG_SCENARIOS = [
    {icon:'heartFill',label:'Date tonight'},
    {icon:'briefcase',label:'Job interview'},
    {icon:'plane',label:'Trip to Europe'},
    {icon:'gift',label:'Birthday party'},
    {icon:'coffee',label:'Casual morning out'},
    {icon:'dumbbell',label:'Workout'},
    {icon:'diamond',label:'Formal event'},
    {icon:'wave',label:'Beach day'},
  ];

  let ogLoading = false;

  function initOutfitGen() {
    renderDailyLook();
    renderStreakPanel();
    renderOgEntries();
    renderJournalPreview();
    refreshServerStreak(); // reconcile streak with server each time the AI tab opens
    const scenariosEl = document.getElementById('og-scenarios');
    scenariosEl.innerHTML = OG_SCENARIOS.map(s =>
      `<button class="og-chip" data-q="${attr(s.label)}">${icon(s.icon,14)} ${esc(s.label)}</button>`
    ).join('');
    scenariosEl.querySelectorAll('.og-chip').forEach(btn =>
      btn.addEventListener('click', () => runOutfitGen(btn.dataset.q))
    );

    const goBtn = document.getElementById('og-go');
    const input = document.getElementById('og-input');
    if (!goBtn._bound) {
      goBtn._bound = true;
      goBtn.addEventListener('click', () => { const q = input.value.trim(); if(q) runOutfitGen(q); });
      input.addEventListener('keydown', e => { if(e.key==='Enter'){const q=input.value.trim();if(q)runOutfitGen(q);} });
    }
    _updateTasteBanner();
  }

  // ---- "Today's Look" daily hero — headline of the AI Stylist tab ----
  // Adapts to real day-of-week + hour via the shared pickOccasionForNow() engine,
  // and builds the look from the user's OWN closet via buildFallbackOutfits().
  function renderDailyLook() {
    const el = document.getElementById('og-daily');
    if (!el) return;
    const wardrobe = JSON.parse(localStorage.getItem('awear_wardrobe') || '[]');
    const ctx = pickOccasionForNow();

    // Empty closet → tasteful prompt to scan, never a broken card.
    if (!wardrobe.length) {
      el.innerHTML = `
        <div class="og-daily og-daily-empty">
          <div class="ogd-eyebrow">${icon('sparkle',12)} <span>${esc(ctx.eyebrow)}</span></div>
          <div class="ogd-empty-title">Your stylist is ready</div>
          <div class="ogd-empty-sub">Add a few pieces and I'll build your look for ${esc(ctx.dayLabel + ' ' + ctx.timeLabel)} every day.</div>
          <button class="ogd-cta" data-action="ogd-scan">${icon('camera',16)} Scan your first item</button>
        </div>`;
      const scan = el.querySelector('[data-action="ogd-scan"]');
      if (scan) scan.addEventListener('click', () => { const f = document.getElementById('file-input'); if (f) f.click(); });
      return;
    }

    // Build today's look from the user's own closet (reuse the combo builder).
    const looks = buildFallbackOutfits(ctx.occ.label, wardrobe);
    const look = looks[0];
    const items = (look.items || []).filter(it => it && !it._missing);
    const hero = items[0] || (look.items || [])[0];
    const pairLabels = items.slice(1, 3).map(it => it.name).filter(Boolean);

    el.innerHTML = `
      <div class="og-daily">
        <div class="ogd-media">
          ${hero ? productImage(hero, 'ogd-hero-img') : `<div class="img-fallback">${icon('hanger',32)}</div>`}
          ${items[1] ? `<div class="ogd-swatch">${productImage(items[1], 'ogd-swatch-img')}</div>` : ''}
        </div>
        <div class="ogd-body">
          <div class="ogd-eyebrow">${icon(ctx.occ.icon,12)} <span>${esc(ctx.eyebrow)}</span></div>
          <div class="ogd-name">${esc(look.name || ctx.occ.label)}</div>
          ${pairLabels.length ? `<div class="ogd-pairs">${esc(pairLabels.join(' · '))}</div>` : ''}
          <button class="ogd-cta" data-action="ogd-wear">See the full look ${icon('arrowRight',16)}</button>
        </div>
      </div>`;
    const wearBtn = el.querySelector('[data-action="ogd-wear"]');
    if (wearBtn) wearBtn.addEventListener('click', () => runOutfitGen(ctx.occ.label));
  }

  // ---- Secondary entry points (must NOT compete with the hero) ----
  function renderOgEntries() {
    const el = document.getElementById('og-entries');
    if (!el) return;
    el.innerHTML = `
      <div class="og-entries">
        <button class="og-entry" data-action="og-chat">
          <span class="og-entry-ico">${icon('chat',16)}</span>
          <span class="og-entry-txt"><span class="og-entry-title">Chat with Abigail</span><span class="og-entry-sub">Ask your stylist</span></span>
        </button>
        <button class="og-entry" data-action="og-swipe">
          <span class="og-entry-ico">${icon('sparkle',16)}</span>
          <span class="og-entry-txt"><span class="og-entry-title">Style Swipe</span><span class="og-entry-sub">Train your taste</span></span>
        </button>
      </div>`;
    const chat = el.querySelector('[data-action="og-chat"]');
    const swipe = el.querySelector('[data-action="og-swipe"]');
    if (chat) chat.addEventListener('click', () => showView('chat'));
    if (swipe) swipe.addEventListener('click', () => showStyleSwipe());
  }

  // ---- Daily check-in: Duolingo-style streak panel in the AI Stylist tab ----
  // Server streak (cached) is preferred; local streak is the offline fallback.
  function renderStreakPanel() {
    const el = document.getElementById('og-streak-panel');
    if (!el) return;
    const local = loadStreak();
    const server = loadServerStreak();
    const current = server ? server.current_streak : local.count;
    const best = server ? Math.max(server.best_streak || 0, local.best || 0) : (local.best || 0);
    const loggedToday = server && typeof server.logged_today === 'boolean' ? server.logged_today : isDiaryLoggedToday();
    const dotCount = Math.min(current, 7);
    const dots = Array.from({length: 7}, (_, i) =>
      `<span class="ogs-dot${i < dotCount ? ' done' : ''}"></span>`).join('');
    el.innerHTML = `
      <div class="og-streak">
        <div class="ogs-flame">${icon('flame',24)}</div>
        <div class="ogs-info">
          <div class="ogs-headline"><span class="ogs-num">${current}</span><span class="ogs-unit">day${current===1?'':'s'}</span><span class="ogs-best">${best>1?'· best '+best:''}</span></div>
          <div class="ogs-dots">${dots}</div>
        </div>
        ${loggedToday
          ? `<div class="ogs-done">${icon('check',14)} Logged today</div>`
          : `<button class="ogs-cta" data-action="ogs-checkin">${icon('plus',14)} Check in</button>`}
      </div>`;
    const cta = el.querySelector('[data-action="ogs-checkin"]');
    if (cta) cta.addEventListener('click', () => showDiaryModal());
  }

  // ---- Private journal: preview card linking to the full journal ----
  function renderJournalPreview() {
    const el = document.getElementById('og-journal-card');
    if (!el) return;
    const local = loadDiary();
    const count = local.length;
    const last = local.slice().sort((a,b)=>(b.ts||0)-(a.ts||0))[0];
    const sub = count
      ? (last ? `${count} entr${count===1?'y':'ies'} · last ${esc(prettyDate(last.date))}` : `${count} entries`)
      : 'Private by default — only you can see it';
    el.innerHTML = `
      <button class="og-journal" data-action="og-journal">
        <span class="ogj-ico">${icon('book',18)}</span>
        <span class="ogj-txt"><span class="ogj-title">Your style journal</span><span class="ogj-sub">${sub}</span></span>
        <span class="ogj-arrow">${icon('chevronRight',18)}</span>
      </button>`;
    const btn = el.querySelector('[data-action="og-journal"]');
    if (btn) btn.addEventListener('click', () => showJournalModal());
  }

  // Short human date for journal rows ("Jul 1" / "Today" / "Yesterday").
  function prettyDate(dateStr) {
    if (!dateStr) return '';
    const today = todayStr();
    if (dateStr === today) return 'Today';
    const y = new Date(); y.setDate(y.getDate()-1);
    const yStr = y.getFullYear()+'-'+String(y.getMonth()+1).padStart(2,'0')+'-'+String(y.getDate()).padStart(2,'0');
    if (dateStr === yStr) return 'Yesterday';
    const parts = dateStr.split('-');
    const d = new Date(Number(parts[0]), Number(parts[1])-1, Number(parts[2]));
    return d.toLocaleDateString(undefined, {month:'short', day:'numeric'});
  }

  // ---- Full private journal modal (server list, falls back to local) ----
  async function showJournalModal() {
    const existing = document.getElementById('journal-overlay');
    if (existing) existing.remove();
    const overlay = document.createElement('div');
    overlay.id = 'journal-overlay';
    overlay.className = 'diary-overlay';
    overlay.innerHTML =
      '<div class="diary-sheet journal-sheet">' +
        '<div class="diary-handle"></div>' +
        '<div class="diary-head-row">' +
          '<div class="diary-title">' + icon('book',18) + ' Your style journal</div>' +
          '<button class="mp-fsheet-x diary-x-close" aria-label="Close"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button>' +
        '</div>' +
        '<div class="diary-sub">Private by default. Every check-in trains Abigail on your taste.</div>' +
        '<div class="journal-tools">' +
          '<label class="journal-remind"><span class="jr-label">' + icon('bell',15) + ' Daily reminder</span>' +
            '<input type="time" id="journal-remind-time" class="jr-input" value="' + attr(loadReminderTime()) + '"></label>' +
        '</div>' +
        '<div class="journal-list" id="journal-list"><div class="journal-loading">Loading…</div></div>' +
      '</div>';
    document.body.appendChild(overlay);
    requestAnimationFrame(function(){ overlay.classList.add('show'); });
    overlay.addEventListener('click', function(e){ if (e.target === overlay) closeDiaryModal(overlay); });
    overlay.querySelector('.diary-x-close')?.addEventListener('click', function(){ closeDiaryModal(overlay); });

    const timeEl = overlay.querySelector('#journal-remind-time');
    timeEl.addEventListener('change', function(){
      saveReminderTime(timeEl.value || '');
      showToast(timeEl.value ? ('Reminder set for ' + timeEl.value) : 'Reminder turned off');
    });

    // Server is source of truth; fall back to local diary if the fetch fails.
    let entries = await fetchJournal();
    if (entries === null) {
      entries = loadDiary().slice().sort((a,b)=>(b.ts||0)-(a.ts||0)).map(function(e){
        return { date:e.date, items:e.items||[], note:e.note||'', private:e.private!==false };
      });
    }
    const listEl = overlay.querySelector('#journal-list');
    if (!entries.length) {
      listEl.innerHTML = '<div class="journal-empty">' + icon('calendar',32) +
        '<span>No check-ins yet</span><span class="je-sub">Log your first outfit to start your journal.</span>' +
        '<button class="ogs-cta je-cta" id="journal-first">' + icon('plus',14) + ' Check in now</button></div>';
      const fb = listEl.querySelector('#journal-first');
      if (fb) fb.addEventListener('click', function(){ closeDiaryModal(overlay); showDiaryModal(); });
      return;
    }
    listEl.innerHTML = entries.map(function(e){
      const items = (e.items || []);
      const names = items.map(function(i){ return esc(i.name || catLabel(i.category) || 'Item'); }).filter(Boolean);
      const thumbs = items.slice(0,4).map(function(i){ return '<span class="jr-thumb">' + productImage(i, 'jr-thumb-img') + '</span>'; }).join('');
      const more = items.length > 4 ? '<span class="jr-more">+' + (items.length-4) + '</span>' : '';
      return '<div class="journal-row">' +
        '<div class="jr-head"><span class="jr-date">' + esc(prettyDate(e.date)) + '</span>' +
          (e.private !== false ? '<span class="jr-private">' + icon('lock',12) + ' Private</span>' : '<span class="jr-shared">' + icon('globe',12) + ' Shared</span>') + '</div>' +
        '<div class="jr-thumbs">' + (thumbs || '<span class="jr-noitems">No items tagged</span>') + more + '</div>' +
        (names.length ? '<div class="jr-items">' + esc(names.join(' · ')) + '</div>' : '') +
        (e.note ? '<div class="jr-note">' + esc(e.note) + '</div>' : '') +
      '</div>';
    }).join('');
  }

  // ---- Style Swipe / Taste Training (L4-d) ----
  const STYLE_LOOKS = [
    {id:'sl1', name:'Minimal Chic',      tags:['minimal','monochrome','clean'],      q:'minimal fashion white outfit woman editorial'},
    {id:'sl2', name:'Y2K Nostalgia',     tags:['Y2K','colorful','playful'],          q:'y2k fashion colorful crop top low waist outfit woman'},
    {id:'sl3', name:'Street Edge',       tags:['streetwear','urban','bold'],          q:'streetwear urban fashion woman oversized jacket'},
    {id:'sl4', name:'Boho Spirit',       tags:['boho','earthy','flowy'],             q:'bohemian fashion flowy dress earth tones woman outdoor'},
    {id:'sl5', name:'Power Office',      tags:['business','structured','polished'],  q:'business fashion woman blazer professional editorial'},
    {id:'sl6', name:'Dark Romance',      tags:['dark','edgy','dramatic'],            q:'dark fashion editorial woman moody dramatic tones'},
    {id:'sl7', name:'Coastal Breeze',    tags:['coastal','casual','light'],          q:'coastal summer fashion woman white linen beach'},
    {id:'sl8', name:'Vintage Collector', tags:['vintage','retro','classic'],         q:'vintage retro 70s fashion woman editorial timeless'},
    {id:'sl9', name:'Athleisure Pro',    tags:['athleisure','sporty','cool'],        q:'athleisure fashion woman stylish sport chic'},
    {id:'sl10',name:'Cottagecore Dream', tags:['cottagecore','floral','soft'],       q:'cottagecore fashion floral dress woman nature soft'},
  ];

  const TASTE_PERSONALITIES = {
    minimal:    {label:'Minimal Chic',    desc:'Clean lines, neutral palettes, effortless sophistication.'},
    monochrome: {label:'Minimal Chic',    desc:'Clean lines, neutral palettes, effortless sophistication.'},
    clean:      {label:'Minimal Chic',    desc:'Clean lines, neutral palettes, effortless sophistication.'},
    Y2K:        {label:'Y2K Revival',     desc:'Playful, nostalgic, unapologetically fun — you live for trends.'},
    colorful:   {label:'Color Maximalist',desc:'Bold, vibrant, and unapologetically expressive — all eyes on you.'},
    playful:    {label:'Color Maximalist',desc:'Bold, vibrant, and unapologetically expressive — all eyes on you.'},
    streetwear: {label:'Street Edge',     desc:'Urban confidence and bold statements define your look.'},
    urban:      {label:'Street Edge',     desc:'Urban confidence and bold statements define your look.'},
    bold:       {label:'Street Edge',     desc:'Urban confidence and bold statements define your look.'},
    boho:       {label:'Free Spirit',     desc:'Earthy tones, flowing fabrics — your style tells a story.'},
    earthy:     {label:'Free Spirit',     desc:'Earthy tones, flowing fabrics — your style tells a story.'},
    flowy:      {label:'Free Spirit',     desc:'Earthy tones, flowing fabrics — your style tells a story.'},
    business:   {label:'Power Dresser',   desc:'Sharp, polished, and always put together — you mean business.'},
    structured: {label:'Power Dresser',   desc:'Sharp, polished, and always put together — you mean business.'},
    polished:   {label:'Power Dresser',   desc:'Sharp, polished, and always put together — you mean business.'},
    dark:       {label:'Dark Romantic',   desc:'Dramatic, mysterious, and intentionally moody. You own every room.'},
    edgy:       {label:'Dark Romantic',   desc:'Dramatic, mysterious, and intentionally moody. You own every room.'},
    dramatic:   {label:'Dark Romantic',   desc:'Dramatic, mysterious, and intentionally moody. You own every room.'},
    coastal:    {label:'Coastal Cool',    desc:'Breezy, bright, effortlessly chic — summer is your season.'},
    casual:     {label:'Coastal Cool',    desc:'Breezy, bright, effortlessly chic — summer is your season.'},
    vintage:    {label:'Vintage Curator', desc:'Timeless pieces with a story — your style transcends seasons.'},
    retro:      {label:'Vintage Curator', desc:'Timeless pieces with a story — your style transcends seasons.'},
    classic:    {label:'Vintage Curator', desc:'Timeless pieces with a story — your style transcends seasons.'},
    athleisure: {label:'Athleisure Pro',  desc:'Comfort meets style — you look great whether at the gym or brunch.'},
    sporty:     {label:'Athleisure Pro',  desc:'Comfort meets style — you look great whether at the gym or brunch.'},
    cottagecore:{label:'Cottagecore',     desc:'Soft, romantic, and nature-inspired — your style is a poem.'},
    floral:     {label:'Cottagecore',     desc:'Soft, romantic, and nature-inspired — your style is a poem.'},
    soft:       {label:'Cottagecore',     desc:'Soft, romantic, and nature-inspired — your style is a poem.'},
  };

  function loadTaste() { try { return JSON.parse(localStorage.getItem(TASTE_KEY) || '{}'); } catch(_) { return {}; } }
  function saveTaste(t) { localStorage.setItem(TASTE_KEY, JSON.stringify(t)); }
  function tastePersonality() {
    const tags = loadTaste().tags || {};
    const top = Object.entries(tags).sort((a,b) => b[1]-a[1]).map(([k]) => k);
    return TASTE_PERSONALITIES[top[0]] || {label:'Eclectic Style', desc:'You have a unique eye and love mixing styles your way.'};
  }

  let _swIdx = 0, _swLooks = [];

  function showStyleSwipe() {
    _swIdx = 0;
    _swLooks = [...STYLE_LOOKS].sort(() => Math.random() - .5).slice(0, 8);
    let ov = document.getElementById('sw-overlay');
    if (!ov) { ov = document.createElement('div'); ov.id = 'sw-overlay'; ov.className = 'sw-overlay'; document.body.appendChild(ov); }
    _renderSwCard(ov);
    ov.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }

  function _swDotsHTML() {
    return _swLooks.map((_, i) =>
      `<div class="sw-dot${i < _swIdx ? ' sw-done' : i === _swIdx ? ' sw-cur' : ''}"></div>`
    ).join('');
  }

  function _renderSwCard(ov) {
    if (_swIdx >= _swLooks.length) { _swipeDone(ov); return; }
    const look = _swLooks[_swIdx];
    ov.onclick = null;
    ov.innerHTML = `
      <div class="sw-top">
        <div class="sw-label">${icon('sparkle',13)} Train your taste · ${_swIdx+1}/${_swLooks.length}</div>
        <div class="sw-dots">${_swDotsHTML()}</div>
        <button class="sw-close-btn" data-action="sw-close" aria-label="Close">${icon('x',18)}</button>
      </div>
      <div class="sw-deck">
        <div class="sw-card">
          ${editorialImage(look.q, look.name, 'sw-card-img')}
          <div class="sw-card-info">
            <div class="sw-card-name">${esc(look.name)}</div>
            <div class="sw-tags">${look.tags.map(t => `<span class="sw-tag">${esc(t)}</span>`).join('')}</div>
          </div>
        </div>
      </div>
      <div class="sw-hint">Love it or leave it?</div>
      <div class="sw-actions">
        <button class="sw-skip-btn" data-action="sw-skip" aria-label="Skip">${icon('x',22)}</button>
        <button class="sw-like-btn" data-action="sw-like" aria-label="Love this look">${icon('heartFill',26)}</button>
      </div>`;
    ov.onclick = _swHandler;
  }

  function _swHandler(e) {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const act = btn.dataset.action;
    if (act === 'sw-close') { _closeSwipe(); return; }
    const look = _swLooks[_swIdx];
    const taste = loadTaste();
    if (!taste.likes) taste.likes = [];
    if (!taste.skips) taste.skips = [];
    if (!taste.tags) taste.tags = {};
    if (act === 'sw-like') {
      if (!taste.likes.includes(look.id)) taste.likes.push(look.id);
      look.tags.forEach(t => { taste.tags[t] = (taste.tags[t] || 0) + 1; });
    } else if (act === 'sw-skip') {
      if (!taste.skips.includes(look.id)) taste.skips.push(look.id);
      look.tags.forEach(t => { taste.tags[t] = Math.max(-2, (taste.tags[t] || 0) - 0.5); });
    }
    saveTaste(taste);
    _swIdx++;
    _renderSwCard(document.getElementById('sw-overlay'));
  }

  function _closeSwipe() {
    const ov = document.getElementById('sw-overlay');
    if (ov) { ov.style.display = 'none'; ov.onclick = null; }
    document.body.style.overflow = '';
    _updateTasteBanner();
  }

  function _swipeDone(ov) {
    const p = tastePersonality();
    ov.onclick = null;
    ov.innerHTML = `
      <div class="sw-done-wrap">
        <div style="width:72px;height:72px;border-radius:50%;background:linear-gradient(135deg,var(--accent,#e8526a),var(--accent2,#c4855a));display:flex;align-items:center;justify-content:center;color:#fff">
          ${icon('sparkle',32)}
        </div>
        <div style="font-size:var(--t-title,20px);font-weight:900;letter-spacing:-.3px">Your style: ${esc(p.label)}</div>
        <div style="font-size:var(--t-body,14px);color:var(--muted,#8a8498);line-height:1.6;max-width:280px">${esc(p.desc)}</div>
        <button data-action="sw-done" style="margin-top:4px;padding:14px 28px;background:linear-gradient(135deg,var(--accent,#e8526a),var(--accent2,#c4855a));border:0;border-radius:var(--r-pill,999px);font-family:inherit;font-size:var(--t-body,14px);font-weight:900;color:#fff;cursor:pointer;min-height:44px;display:inline-flex;align-items:center;gap:8px">
          ${icon('sparkle',16)} See my personalized looks
        </button>
        <button data-action="sw-close" style="font-size:var(--t-caption,12px);font-weight:700;color:var(--muted,#8a8498);background:0;border:0;cursor:pointer;padding:12px;font-family:inherit">Maybe later</button>
      </div>`;
    ov.onclick = e => {
      const act = e.target.closest('[data-action]')?.dataset.action;
      if (act === 'sw-done') { _closeSwipe(); runOutfitGen(p.label + ' look'); }
      else if (act === 'sw-close') { _closeSwipe(); }
    };
  }

  function _updateTasteBanner() {
    const banner = document.getElementById('og-taste-banner');
    if (!banner) return;
    const taste = loadTaste();
    const trained = Object.keys(taste.tags || {}).length > 0;
    const p = trained ? tastePersonality() : null;
    banner.innerHTML = `
      <div class="sw-cta${trained ? ' sw-trained' : ''}">
        <div class="sw-cta-icon">${trained ? icon('heartFill',18) : icon('sparkle',18)}</div>
        <div class="sw-cta-text">
          <div style="font-size:var(--t-body,14px);font-weight:900;line-height:1.2">${trained ? esc(p.label) : 'Train your taste'}</div>
          <div style="font-size:var(--t-caption,12px);color:var(--muted,#8a8498);margin-top:2px">${trained ? 'Personalized · retrain anytime' : 'Swipe 8 looks → AI learns your style'}</div>
        </div>
        <button class="sw-cta-btn" data-action="sw-start" aria-label="${trained ? 'Retrain taste' : 'Start taste training'}">${trained ? icon('refresh',16) : icon('arrowRight',16)}</button>
      </div>`;
    banner.querySelector('[data-action="sw-start"]').addEventListener('click', showStyleSwipe);
  }

  async function runOutfitGen(occasion) {
    if (ogLoading) return;
    ogLoading = true;
    document.getElementById('og-input').value = occasion;
    const resultEl = document.getElementById('og-result');
    resultEl.innerHTML = `<div class="og-loading"><div class="spinner" style="margin:0 auto"></div><div style="margin-top:12px;font-size:var(--t-body);font-weight:700;color:var(--muted)">Building looks...</div></div>`;

    const wardrobe = JSON.parse(localStorage.getItem('awear_wardrobe') || '[]');
    const prof = loadProfile();

    try {
      const res = await fetch('/api/outfit/generate', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          occasion,
          wardrobe: wardrobe.map(i => ({name:i.name,category:i.category,color:i.color,style_tags:i.style_tags,brand_vibe:i.brand_vibe})),
          style_vibes: prof.styleVibes || [],
          taste_tags: Object.entries(loadTaste().tags || {}).filter(([,v]) => v > 0).sort((a,b) => b[1]-a[1]).map(([k]) => k).slice(0,5),
        }),
      });
      const data = await res.json();
      ogLoading = false;
      renderOutfitResults(data.outfits || [], occasion);
    } catch(_) {
      ogLoading = false;
      const fallbackOutfits = buildFallbackOutfits(occasion, wardrobe);
      renderOutfitResults(fallbackOutfits, occasion);
    }
  }

  function buildFallbackOutfits(occasion, wardrobe) {
    const tops    = wardrobe.filter(i => i.category === 'top');
    const bottoms = wardrobe.filter(i => i.category === 'bottoms' || i.category === 'dress');
    const shoes   = wardrobe.filter(i => i.category === 'shoes');
    const bags    = wardrobe.filter(i => i.category === 'bag');

    const presets = {
      'date': [
        {name:'Romantic look', tip:'Add gold earrings and a light perfume — the details win.', items:[
          tops[0]||{name:'Sheer blouse',category:'top',_missing:true},
          bottoms[0]||{name:'Midi skirt',category:'dress',_missing:true},
          shoes[0]||{name:'Low heel',category:'shoes',_missing:true},
        ]},
        {name:'Urban look', tip:'A denim jacket adds edge — perfect for a casual date.', items:[
          tops[1]||tops[0]||{name:'Basic tee',category:'top',_missing:true},
          bottoms[1]||bottoms[0]||{name:'Slim jeans',category:'bottoms',_missing:true},
          shoes[0]||{name:'White sneakers',category:'shoes',_missing:true},
        ]},
      ],
      'interview': [
        {name:'Business Professional', tip:'Details: a delicate necklace, clean nails. Less is more.', items:[
          tops[0]||{name:'White shirt',category:'top',_missing:true},
          bottoms[0]||{name:'Straight black trousers',category:'bottoms',_missing:true},
          shoes[0]||{name:'Classic heel',category:'shoes',_missing:true},
          bags[0]||{name:'Professional bag',category:'bag',_missing:true},
        ]},
      ],
      'workout': [
        {name:'Sport Chic', tip:'A small towel + a matching water bottle complete the look.', items:[
          tops[0]||{name:'Sporty crop top',category:'top',_missing:true},
          bottoms[0]||{name:'Leggings',category:'bottoms',_missing:true},
          shoes[0]||{name:'Training sneakers',category:'shoes',_missing:true},
        ]},
      ],
    };

    const occLower = (occasion||'').toLowerCase();
    const key = Object.keys(presets).find(k => occLower.includes(k));
    return presets[key] || [{
      name: 'Perfect look for ' + occasion,
      tip: 'Mix neutral colors with one statement piece — that\'s the secret.',
      items: [
        tops[0]||{name:'Basic top',category:'top',_missing:true},
        bottoms[0]||{name:'Matching bottoms',category:'bottoms',_missing:true},
        shoes[0]||{name:'Matching shoes',category:'shoes',_missing:true},
      ],
    }];
  }

  function findShopMatch(category, outfitTags) {
    const tags = (outfitTags || []).map(t => t.toLowerCase());
    const catMap = {dress:['dress'],top:['top'],bottoms:['bottoms'],shoes:['shoes'],bag:['bag'],outerwear:['outerwear'],accessory:['accessory','jewelry'],jewelry:['jewelry','accessory'],hat:['hat']};
    const matchCats = catMap[category] || [category];
    let best = null, bestScore = -1;
    for (const p of SHOP_SEED) {
      if (!matchCats.includes(p.category)) continue;
      const pTags = (p.style_tags || []).map(t => t.toLowerCase());
      const overlap = tags.filter(t => pTags.includes(t)).length;
      const score = overlap * 10 + (p.score || 70) + ((p.image_url || p.product_url) ? 5 : 0);
      if (score > bestScore) { bestScore = score; best = p; }
    }
    return best || SHOP_SEED.find(p => matchCats.includes(p.category)) || null;
  }

  function renderOutfitResults(outfits, occasion) {
    const el = document.getElementById('og-result');
    if (!outfits.length) {
      el.innerHTML = `<div class="og-empty"><div class="og-empty-icon" style="color:var(--muted)">${icon('hanger',36)}</div><div class="og-empty-text">Couldn't build a look</div><div class="og-empty-sub">Try scanning more items into your closet</div></div>`;
      return;
    }
    el.innerHTML = `
      <div style="padding:0 18px 10px;font-size:var(--t-micro);font-weight:800;color:var(--muted);letter-spacing:.5px;text-transform:uppercase">Looks for ${esc(occasion)}</div>
      <div class="og-result-section">
        ${outfits.map((o,i) => {
          // Resolve each slot to a real garment + a state (owned | shop | missing) so the
          // flat-lay collage can carry the right badge / clickability per cell.
          const resolved = (o.items||[]).slice(0,6).map(item => {
            if (item._missing) {
              const sp = findShopMatch(item.category, o.style_tags);
              if (sp) return { item: sp, state:'shop', shopId: sp.id, category: sp.category || item.category };
              return { item, state:'missing', category: item.category };
            }
            return { item, state:'owned', category: item.category };
          });
          // flat-lay over the garments (zone by category); per-cell badge + shop click via opts.
          // Tag each collage item with a stable _flIdx so opts can recover its resolved state
          // (owned/shop/missing) regardless of whether the underlying garment carries an id.
          const flItems = resolved.map((r,ri) => ({ ...r.item, category: r.category, _flIdx: ri }));
          const collage = flatLayCollageHTML(flItems, {
            cellClassOf: (it) => { const r = resolved[it._flIdx]; return r && r.state==='shop' ? 'og-fl-shop' : ''; },
            cellAttrsOf: (it) => { const r = resolved[it._flIdx]; return r && r.state==='shop' ? `data-action="og-fl-shop" data-shop-id="${attr(r.shopId)}"` : ''; },
            overlayOf: (it) => {
              const r = resolved[it._flIdx];
              if (!r) return '';
              if (r.state==='shop') return `<div class="og-fl-badge shop">${icon('shoppingBag',10)} Shop</div>`;
              if (r.state==='owned') return `<div class="og-fl-badge owned">${icon('check',9)} Yours</div>`;
              return '';
            }
          });
          return `
          <div class="og-outfit-card">
            <div class="og-outfit-header">
              <div class="og-outfit-num">${i+1}</div>
              <div class="og-outfit-name">${esc(o.name||'Look '+(i+1))}</div>
              ${o.match_pct ? `<div class="og-outfit-score">${o.match_pct}% match</div>` : ''}
            </div>
            <div class="og-flatlay-wrap">${collage}</div>
            ${o.tip ? `<div class="og-outfit-tip">${icon('sparkle',13)} ${esc(o.tip)}</div>` : ''}
            <button class="og-wear-btn" data-wear-idx="${i}">${icon('check',18)} Wear this look today</button>
          </div>`;
        }).join('')}
      </div>`;
    el.querySelectorAll('[data-action="og-fl-shop"]').forEach(cell =>
      cell.addEventListener('click', () => openShopItem(cell.dataset.shopId))
    );
    el.querySelectorAll('.og-wear-btn').forEach(btn =>
      btn.addEventListener('click', () => showDiaryModal())
    );
  }

  // ---- Compatibility Score ----
  function calcCompatScore(newItem, wardrobe) {
    if (!wardrobe.length) return {pct: 70, matches: []};
    const newTags = new Set((newItem.style_tags || []).map(t => t.toLowerCase()));
    const newColor = (newItem.color || '').toLowerCase();

    let tagMatches = 0, colorMatches = 0;
    const matchingItems = [];
    wardrobe.forEach(w => {
      const wTags = (w.style_tags || []).map(t => t.toLowerCase());
      const tagHits = wTags.filter(t => newTags.has(t)).length;
      if (tagHits > 0) { tagMatches += tagHits; matchingItems.push(w.name); }
      if (w.color && newColor && w.color.toLowerCase().includes(newColor.slice(0,3))) colorMatches++;
    });

    const tagScore  = Math.min(50, (tagMatches  / Math.max(newTags.size, 1)) * 40);
    const colorScore = Math.min(20, colorMatches * 8);
    const baseScore = 40;
    const pct = Math.min(99, Math.round(baseScore + tagScore + colorScore));
    return {pct, matches: matchingItems.slice(0,4)};
  }

  function compatScoreHTML(item, wardrobe) {
    const {pct, matches} = calcCompatScore(item, wardrobe);
    const color = pct >= 80 ? 'var(--success)' : pct >= 60 ? 'var(--accent2)' : 'var(--accent)';
    const label = pct >= 80 ? 'Perfect for your closet!' : pct >= 60 ? 'Good match' : 'Partial match';
    return `
      <div class="compat-score-bar">
        <div class="cs-label-row">
          <span class="cs-label">COMPATIBILITY SCORE</span>
          <span class="cs-pct" style="color:${color}">${pct}%</span>
        </div>
        <div class="cs-track"><div class="cs-fill" style="width:${pct}%;background:${color}"></div></div>
        <div style="font-size:var(--t-micro);font-weight:700;color:${color};margin-top:5px">${label}</div>
        ${matches.length ? `<div class="cs-matches">${matches.map(m=>`<span class="cs-match-tag">${esc(m)}</span>`).join('')}</div>` : ''}
      </div>`;
  }

  // ---- Rewards & Gamification ----
  // Constants (RW_KEY, LEVELS, PERKS, RW_ACTIONS) hoisted above renderHome() — see TDZ fix.
  function loadRewards() { return JSON.parse(localStorage.getItem(RW_KEY) || '{"points":0,"actions":{}}'); }
  function saveRewards(rw) { localStorage.setItem(RW_KEY, JSON.stringify(rw)); }

  function renderRewards() {
    const wardrobe = JSON.parse(localStorage.getItem('awear_wardrobe') || '[]');
    const scans = wardrobe.length;
    const rw = loadRewards();
    // Auto-credit scan points from wardrobe
    const expectedPts = scans * 10 + (rw.actions.wore||0)*5 + (rw.actions.sell||0)*25;
    if (rw.points < expectedPts) { rw.points = expectedPts; saveRewards(rw); }

    const pts = rw.points;
    const levelIdx = LEVELS.reduce((best, l, i) => pts >= l.min ? i : best, 0);
    const level = LEVELS[levelIdx];
    const nextLevel = LEVELS[levelIdx + 1];
    const progress = nextLevel
      ? Math.round(((pts - level.min) / (nextLevel.min - level.min)) * 100)
      : 100;

    const el = document.getElementById('rw-wrap');
    el.innerHTML = `
      <div class="rw-header"><div class="rw-title" style="display:flex;align-items:center;gap:7px">${icon('trophy',20)} Rewards</div></div>
      <div class="rw-points-card">
        <div class="rw-pts-num">${pts.toLocaleString()}</div>
        <div class="rw-pts-label">AWEAR points</div>
        <div class="rw-level-row">
          <div class="rw-level-badge" style="background:color-mix(in srgb, ${level.color} 15%, transparent);color:${level.color};display:inline-flex;align-items:center;gap:5px">${icon(level.icon,14)} ${esc(level.name)}</div>
          <div class="rw-level-track"><div class="rw-level-fill" style="width:${progress}%"></div></div>
          <div class="rw-level-next" style="display:inline-flex;align-items:center;gap:3px">${nextLevel ? nextLevel.min+' to '+icon(nextLevel.icon,12) : icon('crown',12)+' Max!'}</div>
        </div>
      </div>

      <div style="padding:0 18px 10px;font-size:var(--t-micro);font-weight:800;color:var(--muted);letter-spacing:.6px;text-transform:uppercase">How to earn</div>
      <div class="rw-actions-grid">
        ${RW_ACTIONS.map(a => `
          <div class="rw-action">
            <div class="rw-action-icon">${icon(a.icon,22)}</div>
            <div class="rw-action-name">${esc(a.name)}</div>
            <div class="rw-action-pts">+${a.pts} points</div>
            <div class="rw-action-done">${rw.actions[a.key]||0} times</div>
          </div>`).join('')}
      </div>

      <div style="padding:4px 18px 10px;font-size:var(--t-micro);font-weight:800;color:var(--muted);letter-spacing:.6px;text-transform:uppercase">Perks</div>
      <div class="rw-perks-list">
        ${PERKS.map(p => {
          const canRedeem = pts >= p.pts;
          return `<div class="rw-perk">
            <div class="rw-perk-icon">${icon(p.icon,22)}</div>
            <div class="rw-perk-info">
              <div class="rw-perk-name">${esc(p.name)}</div>
              <div class="rw-perk-desc">${esc(p.desc)}</div>
            </div>
            <button class="rw-perk-btn ${canRedeem?'unlocked':'locked'}" data-pts="${p.pts}" style="display:inline-flex;align-items:center;gap:4px">
              ${canRedeem ? 'Redeem' : p.pts+''+icon('sparkle',11)}
            </button>
          </div>`;
        }).join('')}
      </div>`;

    el.querySelectorAll('.rw-perk-btn.unlocked').forEach(btn => {
      btn.addEventListener('click', () => {
        const cost = Number(btn.dataset.pts);
        const rw2 = loadRewards();
        if (rw2.points < cost) { showToast('Not enough points'); return; }
        rw2.points -= cost;
        saveRewards(rw2);
        showToast('Perk redeemed!');
        renderRewards();
      });
    });
  }

  // ---- Creator Wallet ----
  function renderWallet() {
    const el = document.getElementById('wallet-inner');
    if (!el) return;

    const SEED_FLAG = 'awear_wallet_seeded';
    if (!localStorage.getItem(SEED_FLAG)) {
      const existing = JSON.parse(localStorage.getItem(CREDITS_KEY) || '[]');
      if (existing.length === 0) {
        const now = Date.now();
        localStorage.setItem(CREDITS_KEY, JSON.stringify([
          {id:'c_s1', from:'sofia.style',  item:'Linen blazer',        amount:4.50, ts: now - 3*86400000},
          {id:'c_s2', from:'maya_looks',   item:'2-item summer look',  amount:7.25, ts: now - 7*86400000},
          {id:'c_s3', from:'zara.vibes',   item:'Slip midi dress',     amount:3.10, ts: now - 14*86400000},
        ]));
      }
      localStorage.setItem(SEED_FLAG, '1');
    }

    const credits = JSON.parse(localStorage.getItem(CREDITS_KEY) || '[]');
    const total = credits.reduce((s, c) => s + (c.amount || 0), 0);

    function fmtDate(ts) {
      return new Date(ts).toLocaleDateString('en-US', {month:'short', day:'numeric'});
    }

    const creditRows = credits.length > 0
      ? credits.map(c => `
        <div class="wa-credit-row">
          <div class="wa-credit-avatar">${initials(c.from||'?')}</div>
          <div class="wa-credit-info">
            <div class="wa-credit-from">@${esc(c.from||'creator')}</div>
            <div class="wa-credit-item">${esc(c.item||'purchase')}</div>
          </div>
          <div class="wa-credit-right">
            <div class="wa-credit-amt">+$${(c.amount||0).toFixed(2)}</div>
            <div class="wa-credit-date">${fmtDate(c.ts||Date.now())}</div>
          </div>
        </div>`).join('')
      : `<div class="wa-empty">
          ${icon('coins',40)}
          <div class="wa-empty-title">No credits yet</div>
          <div class="wa-empty-sub">Share your looks to the feed. When someone buys via your post, you earn 5% as a creator credit.</div>
        </div>`;

    el.innerHTML = `
      <div class="wa-header">
        <div class="wa-title">${icon('coins',20)} Creator Wallet</div>
      </div>
      <div class="wa-hero">
        <div class="wa-bal-amt">$${total.toFixed(2)}</div>
        <div class="wa-bal-label">Total credits earned</div>
        <div class="wa-pending-row">
          <div class="wa-pending-amt">$${total.toFixed(2)}</div>
          <div class="wa-pending-label">Pending payout</div>
          <button class="wa-withdraw-btn" id="wa-withdraw">Withdraw</button>
        </div>
      </div>
      <div class="wa-section-label">Credits history</div>
      <div class="wa-credit-list">${creditRows}</div>
      <div class="wa-section-label" style="margin-top:16px">How it works</div>
      <div class="wa-how-list">
        <div class="wa-how-row">
          <div class="wa-how-icon">${icon('share',16)}</div>
          <div><div class="wa-how-copy">Share a look to the feed</div><div class="wa-how-sub">Tag items from your closet or AWEAR's catalog</div></div>
        </div>
        <div class="wa-how-row">
          <div class="wa-how-icon">${icon('bag',16)}</div>
          <div><div class="wa-how-copy">Someone buys via your post</div><div class="wa-how-sub">Every in-app purchase through your look earns you 5%</div></div>
        </div>
        <div class="wa-how-row">
          <div class="wa-how-icon">${icon('cash',16)}</div>
          <div><div class="wa-how-copy">Cash out when ready</div><div class="wa-how-sub">Minimum $10 — Stripe Connect available post-launch</div></div>
        </div>
      </div>`;

    el.querySelector('#wa-withdraw')?.addEventListener('click', () => {
      if (total < 10) { showToast('Minimum withdrawal is $10'); return; }
      showToast('Withdrawal requested — processing in 2–5 business days');
    });
  }

  // ---- Built by Agents Dashboard ----
  function renderAgents() {
    const el = document.getElementById('agents-wrap');
    if (!el) return;

    const AGENT_TEAM = [
      {name:'Jeff',      role:'CEO',         desc:'Company strategy, board sync, merge authority',       icon:'briefcase'},
      {name:'Steve',     role:'CTO',         desc:'Architecture, iOS infra, security, code quality',     icon:'barChart'},
      {name:'Dolce',     role:'Design Lead', desc:'UI implementation across all 5 product layers',      icon:'sparkle'},
      {name:'Sam',       role:'Backend',     desc:'FastAPI, SQLite schema, Claude API integration',      icon:'box'},
      {name:'Valentino', role:'Commerce',    desc:'Marketplace, checkout flow, analytics screens',       icon:'bag'},
      {name:'Oren',      role:'Integration', desc:'Cross-layer wiring, security, privacy',               icon:'globe'},
      {name:'Shira',     role:'Social Eng.', desc:'Comments, reactions, block/report, moderation',      icon:'heart'},
      {name:'Gabbana',   role:'Design QA',   desc:'Quality gate — every PR reviewed to 8+ standard',   icon:'award'},
    ];

    const AGENT_ACTIVITY = [
      {date:'Jun 26', agent:'Oren',      desc:'Fixed look total as single source of truth — no contradictions at "Buy this look"'},
      {date:'Jun 26', agent:'Sam',       desc:'Made all 27 feed posts shoppable — For You feed is fully commerce-ready'},
      {date:'Jun 25', agent:'Sam',       desc:'AI chat reliable fallback + removed emoji from stylist responses'},
      {date:'Jun 25', agent:'Sam',       desc:'Native share on Style Identity and Season report — real iOS share sheet'},
      {date:'Jun 25', agent:'Sam',       desc:'Smart Sell: 5 least-worn items surfaced with 50% resale price in closet'},
      {date:'Jun 24', agent:'Oren',      desc:'In-app checkout preserves catalog images — closet stays clean after purchase'},
    ];

    el.innerHTML = `
      <div class="ag-header">
        <div class="ag-header-title">${icon('users',18)} Built by Agents</div>
      </div>

      <div class="ag-hero">
        <div class="ag-hero-headline">This entire app was built by AI agents.</div>
        <div class="ag-hero-sub">What takes a $2M engineering team — AWEAR built agentically for $80K in under 3 weeks. The technology that powers our product is also our competitive moat.</div>
        <div class="ag-stats-row">
          <div class="ag-stat">
            <div class="ag-stat-num">18+</div>
            <div class="ag-stat-label">Screens</div>
          </div>
          <div class="ag-stat">
            <div class="ag-stat-num">9</div>
            <div class="ag-stat-label">AI Agents</div>
          </div>
          <div class="ag-stat">
            <div class="ag-stat-num">3wk</div>
            <div class="ag-stat-label">Build time</div>
          </div>
        </div>
      </div>

      <div class="ag-section-label">The Agent Team</div>
      <div class="ag-team-grid">
        ${AGENT_TEAM.map(a => `
          <div class="ag-card">
            <div class="ag-card-top">
              <div class="ag-card-icon">${icon(a.icon,16)}</div>
              <div>
                <div class="ag-card-name">${esc(a.name)}</div>
                <div class="ag-card-role">${esc(a.role)}</div>
              </div>
            </div>
            <div class="ag-card-desc">${esc(a.desc)}</div>
          </div>
        `).join('')}
      </div>

      <div class="ag-section-label">Live Build Activity</div>
      <div class="ag-timeline">
        ${AGENT_ACTIVITY.map((e, i) => `
          <div class="ag-tl-row">
            <div class="ag-tl-dot-wrap">
              <div class="ag-tl-dot"></div>
              ${i < AGENT_ACTIVITY.length - 1 ? '<div class="ag-tl-line"></div>' : ''}
            </div>
            <div class="ag-tl-body">
              <div class="ag-tl-meta">
                <span class="ag-tl-agent">${esc(e.agent)}</span>
                <span class="ag-tl-date">${esc(e.date)}</span>
              </div>
              <div class="ag-tl-desc">${esc(e.desc)}</div>
            </div>
          </div>
        `).join('')}
      </div>

      <div class="ag-quote">
        <div class="ag-quote-text">"The wardrobe is the profile. Fashion is identity. And for the first time — a fashion company built by agents, for the world."</div>
        <div class="ag-quote-source">— AWEAR founding team</div>
      </div>

      <button class="ag-invest-btn" onclick="showToast('Investor deck available — contact us at awear.app')">${icon('sparkle',16)} View Investor Deck</button>
    `;
  }

  // ---- Sustainability Score ----
  function renderSustainability() {
    const wardrobe = JSON.parse(localStorage.getItem('awear_wardrobe') || '[]');
    const mp = JSON.parse(localStorage.getItem(MP_KEY) || '[]');
    const el = document.getElementById('sus-wrap');

    const totalItems = wardrobe.length;
    const totalWears = wardrobe.reduce((s,i) => s + (i.wear_count||0), 0);
    const unworn = wardrobe.filter(i => (i.wear_count||0) === 0).length;
    const reuseRate = totalItems > 0 ? Math.round(((totalItems - unworn) / totalItems) * 100) : 0;
    const soldItems = mp.length;

    // Score formula: 40% reuse rate + 30% CPW efficiency + 30% sales (circular)
    const avgCPW = totalWears > 0 ? wardrobe.reduce((s,i)=>s+(i.price_estimate_usd||0),0) / totalWears : 0;
    const cpwScore = avgCPW > 0 ? Math.min(30, 30 * (50 / avgCPW)) : 0;
    const reuseScore = (reuseRate / 100) * 40;
    const circularScore = Math.min(30, soldItems * 6);
    const total = Math.round(reuseScore + cpwScore + circularScore);

    const grade = total >= 80 ? 'A — Excellent' : total >= 60 ? 'B — Good' : total >= 40 ? 'C — Average' : 'D — Needs work';
    const gradeColor = total >= 80 ? 'var(--success)' : total >= 60 ? 'var(--success)' : total >= 40 ? 'var(--warning)' : 'var(--danger)';
    const gradeBg = `color-mix(in srgb, ${gradeColor} 12%, transparent)`;

    const tips = [];
    if (reuseRate < 70) tips.push(`${unworn} items have never been worn — wear them or sell them`);
    if (avgCPW > 50) tips.push(`High cost per wear — wear what's already in your closet more often`);
    if (soldItems === 0) tips.push(`Sell items on the Marketplace to boost your Sustainability Score`);
    if (total >= 70) tips.push(`Your closet is well used — you're on the right track!`);

    el.innerHTML = `
      <div class="sus-header" style="display:flex;align-items:center;gap:8px">${icon('leaf',20)} Sustainability Score</div>
      <div class="sus-score-card">
        <div class="sus-score-num" style="color:${gradeColor}">${total}</div>
        <div class="sus-score-label">Sustainability score</div>
        <div class="sus-score-grade" style="background:${gradeBg};color:${gradeColor}">${grade}</div>
      </div>

      ${tips.map(t => `<div class="sus-tip">${icon('sparkle',14)} ${esc(t)}</div>`).join('')}

      <div style="padding:4px 18px 14px">
        <div style="font-size:var(--t-small);font-weight:900;margin-bottom:12px">Metrics</div>
        ${[
          {icon:'leaf', name:'Closet usage', sub:`${totalItems-unworn}/${totalItems} items worn`, val: reuseRate+'%'},
          {icon:'heart', name:'Secondhand', sub:`${soldItems} items sold on Marketplace`, val: soldItems+''},
          {icon:'barChart', name:'Cost Per Wear', sub:`Average $${Math.round(avgCPW)||0} per wear`, val: avgCPW < 30 ? 'Excellent' : '↑'},
          {icon:'globe', name:'Carbon saved', sub:`vs buying new`, val: Math.round(soldItems*2.4+reuseRate*0.3)+'kg'},
        ].map(m => `
          <div class="sus-metric">
            <div class="sus-metric-icon">${icon(m.icon, 20)}</div>
            <div class="sus-metric-info">
              <div class="sus-metric-name">${esc(m.name)}</div>
              <div class="sus-metric-sub">${esc(m.sub)}</div>
            </div>
            <div class="sus-metric-val" style="color:${gradeColor}">${esc(m.val)}</div>
          </div>`).join('')}
      </div>`;
  }

  // ---- Marketplace ----
  const MP_KEY = 'awear_marketplace';
  const MP_SEED = [
    {id:'mp1', name:'Barrel Jeans Light Wash', search_query:'barrel jeans light wash denim', category:'bottoms', size:'M', price:180, orig:450, condition:'like-new', condGrade:'A', seller:'@noalevi', seller_rating:4.9, seller_sales:38, seller_badge:'Top Seller', listed_days:2, style_tags:['y2k','denim'], color:'Blue', occasion:'casual', material:'denim', city:'Tel Aviv', lat:32.0853, lng:34.7818},
    {id:'mp2', name:'Black Vintage Leather Jacket', search_query:'black vintage leather jacket', category:'outerwear', size:'S', price:320, orig:800, condition:'used', condGrade:'B', seller:'@mayacohen', seller_rating:4.7, seller_sales:12, seller_badge:'Fast Shipper', listed_days:5, style_tags:['streetwear','vintage'], color:'Black', occasion:'casual', material:'synthetic', city:'Ramat Gan', lat:32.0684, lng:34.8248},
    {id:'mp3', name:'Adidas Samba White Sneakers', search_query:'Adidas Samba white sneakers', category:'shoes', size:'38', price:390, orig:560, condition:'new', condGrade:'A', seller:'@shirastyle', seller_rating:5.0, seller_sales:61, seller_badge:'Top Seller', listed_days:1, style_tags:['retro','iconic'], color:'White', occasion:'casual', material:'synthetic', city:'Herzliya', lat:32.1624, lng:34.8443},
    {id:'mp4', name:'Black Mini Crossbody Bag', search_query:'black mini bag crossbody', category:'bag', price:95, orig:220, condition:'like-new', condGrade:'A', seller:'@danakatz', seller_rating:4.8, seller_sales:23, seller_badge:'Fast Shipper', listed_days:3, style_tags:['minimal','everyday'], color:'Black', occasion:'casual', city:'Tel Aviv', lat:32.0739, lng:34.7925},
    {id:'mp5', name:'Cream Rib Knit Crop Top', search_query:'cream rib knit crop top', category:'top', size:'XS', price:45, orig:120, condition:'used', condGrade:'B', seller:'@ronigold', seller_rating:4.5, seller_sales:7, seller_badge:'New Seller', listed_days:8, style_tags:['minimal','y2k'], color:'Cream', occasion:'casual', material:'cotton', city:'Jerusalem', lat:31.7683, lng:35.2137},
    {id:'mp6', name:'Green Satin Midi Skirt', search_query:'green satin midi skirt formal', category:'dress', size:'S', price:160, orig:380, condition:'like-new', condGrade:'A', seller:'@liorsade', seller_rating:4.9, seller_sales:44, seller_badge:'Top Seller', listed_days:4, style_tags:['formal','romantic'], color:'Green', occasion:'evening', material:'silk', city:'Ramat Gan', lat:32.0809, lng:34.8140},
    {id:'mp7', name:'Black Baseball Cap', search_query:'black baseball cap streetwear', category:'hat', price:60, orig:150, condition:'used', condGrade:'C', seller:'@noalevi', seller_rating:4.9, seller_sales:38, seller_badge:'Top Seller', listed_days:14, style_tags:['streetwear','casual'], color:'Black', occasion:'sport', city:'Haifa', lat:32.7940, lng:34.9896},
    {id:'mp8', name:'Beige Cargo Pants', search_query:'beige cargo pants utility', category:'bottoms', size:'L', price:140, orig:320, condition:'like-new', condGrade:'B', seller:'@mayacohen', seller_rating:4.7, seller_sales:12, seller_badge:'Fast Shipper', listed_days:6, style_tags:['streetwear','utility'], color:'Beige', occasion:'casual', material:'cotton', city:'Tel Aviv', lat:32.0617, lng:34.7700},
    {id:'mp9', name:'Ivory Linen Blazer', search_query:'ivory linen blazer oversized vintage', category:'outerwear', size:'M', price:85, orig:200, condition:'like-new', condGrade:'A', seller:'@shirastyle', seller_rating:5.0, seller_sales:61, seller_badge:'Top Seller', listed_days:2, style_tags:['chic','minimal'], color:'Cream', occasion:'work', material:'linen', city:'Herzliya', lat:32.1556, lng:34.8532},
    {id:'mp10', name:'Vintage Silk Slip Dress', search_query:'vintage silk slip dress 90s minimal', category:'dress', size:'S', price:120, orig:280, condition:'used', condGrade:'B', seller:'@danakatz', seller_rating:4.8, seller_sales:23, seller_badge:'Fast Shipper', listed_days:10, style_tags:['vintage','romantic'], color:'Beige', occasion:'evening', material:'silk', city:'Beer Sheva', lat:31.2518, lng:34.7913},
    {id:'mp11', name:'Chunky Knit Wool Sweater', search_query:'chunky knit wool sweater oversized cozy', category:'top', size:'L', price:65, orig:180, condition:'like-new', condGrade:'A', seller:'@ronigold', seller_rating:4.5, seller_sales:7, seller_badge:'New Seller', listed_days:3, style_tags:['cozy','minimal'], color:'Grey', occasion:'casual', material:'wool', city:'Jerusalem', lat:31.7857, lng:35.2007},
    {id:'mp12', name:'Black Wide-Leg Trousers', search_query:'black wide leg trousers tailored minimal', category:'bottoms', size:'M', price:95, orig:240, condition:'like-new', condGrade:'A', seller:'@liorsade', seller_rating:4.9, seller_sales:44, seller_badge:'Top Seller', listed_days:7, style_tags:['office','minimal'], color:'Black', occasion:'work', material:'synthetic', city:'Tel Aviv', lat:32.0908, lng:34.7806},
  ];
  const MP_NEW_SEED = [
    {id:'n1', name:'Wide Leg Trousers', search_query:'zara wide leg black trousers fashion', category:'bottoms', size:'M', price:59, brand:'Zara', style_tags:['minimal','chic'], isNew:true, occasion:'work', arrived_days:3},
    {id:'n2', name:'Linen Blazer', search_query:'hm premium linen blazer cream oversized', category:'outerwear', size:'S', price:79, brand:'H&M', style_tags:['chic','office'], isNew:true, occasion:'work', arrived_days:5},
    {id:'n3', name:'Satin Slip Dress', search_query:'asos satin slip midi dress green', category:'dress', size:'XS', price:45, brand:'ASOS', style_tags:['romantic','evening'], isNew:true, occasion:'evening', arrived_days:2},
    {id:'n4', name:'Air Force 1', search_query:'nike air force 1 white sneakers', category:'shoes', size:'39', price:199, brand:'Nike', style_tags:['retro','casual'], isNew:true, occasion:'sport', arrived_days:1},
    {id:'n5', name:'Oversized Linen Shirt', search_query:'cos linen white shirt oversized minimal', category:'top', size:'M', price:65, brand:'COS', style_tags:['minimal','summer'], isNew:true, occasion:'casual', arrived_days:6},
    {id:'n6', name:'Leather Belt Bag', search_query:'mango leather belt bag brown crossbody', category:'bag', price:49, brand:'Mango', style_tags:['everyday','utility'], isNew:true, occasion:'casual', arrived_days:4},
    {id:'n7', name:'Ribbed Mini Skirt', search_query:'ribbed mini skirt beige y2k fashion', category:'dress', size:'S', price:35, brand:'ASOS', style_tags:['y2k','casual'], isNew:true, occasion:'casual', arrived_days:1},
    {id:'n8', name:'Cargo Utility Jacket', search_query:'cargo utility jacket green oversized streetwear', category:'outerwear', size:'L', price:89, brand:'H&M', style_tags:['streetwear','utility'], isNew:true, occasion:'casual', arrived_days:2},
  ];
  let mpTab = 'sell', mpFilter = 'all', mpCondFilter = 'new'; // default landing = My Store (Carmel/Razi)
  let mpAssistQuery = '', mpAssistMsg = '', mpAssistIds = null; // null = no filter, array = filtered ids
  let mpClosetFilter = false; // true = show only items with compat score >= 50%
  let mpSizeFilter = localStorage.getItem('awear_mp_size') || 'all';
  let mpPrelovedOnly = localStorage.getItem('awear_mp_preloved') === 'true';
  // Extended filter state (TDZ-safe: declared before renderMarketplace)
  let mpCategoryFilter = 'all';
  let mpColorFilter = 'all';
  let mpPriceMin = 0, mpPriceMax = 9999;
  let mpBrandFilter = 'all';
  let mpSortBy = 'default';    // default | price-asc | price-desc | compat-desc | newest
  let mpConditionFilter = 'all'; // all | like-new | good | fair
  let mpCloseMatchOnly = false; // true = compat >= 60%
  let mpSearchQuery = ''; // live search bar in header
  let mpOccasionFilter = 'all'; // all | casual | work | evening | sport | formal
  let mpMaterialFilter = 'all'; // all | cotton | linen | denim | synthetic | wool | silk
  // Pending filter values while sheet is open (applied on "Show Results")
  let _mpPendingSort = 'default', _mpPendingColor = 'all', _mpPendingBrand = 'all';
  let _mpPendingCondition = 'all', _mpPendingPriceMin = 0, _mpPendingPriceMax = 9999;
  let _mpPendingCloseMatch = false;
  let _mpPendingOccasion = 'all', _mpPendingMaterial = 'all', _mpPendingSize = 'all';
  let _deadZoneItems = [];
  let msViewMode = 'today'; // My Store viewers stat: today | month | all (cyclical button)
  // Community tab (preloved) — view mode + selected store (TDZ-safe: before renderMarketplace)
  let mpCommunityView = 'stores'; // 'stores' = store pages | 'items' = item grid (reuses mp* filters)
  let mpCommunityScope = 'following'; // 'following' = stores you follow | 'discover' = stores you don't (default foregrounds people you follow, Carmel)
  let mpStore = null; // selected store user id when drilled into a single store page

  // ---- Local / radius ("Near me") for pre-loved listings (item 18, Carmel: buy second-hand near home) ----
  // Client-side only — pre-loved seeds carry demo lat/lng/city. No backend geo.
  const MP_DEFAULT_COORDS = { lat: 32.0853, lng: 34.7818, city: 'Tel Aviv' }; // fallback center when geolocation denied/unavailable
  const MP_RADII = [5, 15, 50]; // km chips; 'any' (null) disables distance filtering
  let mpNearMe = localStorage.getItem('awear_mp_nearme') === 'true';
  let mpRadius = (() => {
    const r = localStorage.getItem('awear_mp_radius');
    if (r === 'any' || r === null || r === '') return 'any';
    const n = parseInt(r, 10);
    return MP_RADII.includes(n) ? n : 15;
  })();
  let mpUserCoords = null;    // {lat,lng} once resolved (geolocation or default)
  let mpUsingDefaultLoc = false; // true = we fell back to MP_DEFAULT_COORDS (denied/unavailable) → quiet note
  let mpGeoPending = false;   // true while awaiting getCurrentPosition

  // Haversine great-circle distance in km between two {lat,lng} points.
  function haversineKm(lat1, lng1, lat2, lng2) {
    const toRad = d => d * Math.PI / 180;
    const R = 6371; // earth radius km
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat/2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng/2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  // Distance (km, rounded) from active user coords to a listing, or null if not computable.
  function mpListingDistanceKm(item) {
    if (!mpUserCoords || typeof item.lat !== 'number' || typeof item.lng !== 'number') return null;
    return haversineKm(mpUserCoords.lat, mpUserCoords.lng, item.lat, item.lng);
  }

  // Apply the active "Near me" radius filter to a pre-loved item list. 'any' = no distance filtering.
  function mpApplyRadiusFilter(list) {
    if (!mpNearMe || !mpUserCoords || mpRadius === 'any') return list;
    return list.filter(it => {
      const d = mpListingDistanceKm(it);
      return d !== null && d <= mpRadius;
    });
  }

  // Request geolocation (opt-in). On success → real coords; on denial/error/unsupported → default center + quiet note.
  // Never throws/crashes; re-renders the marketplace when resolved.
  function mpRequestGeolocation() {
    mpNearMe = true;
    localStorage.setItem('awear_mp_nearme', 'true');
    const fallback = (usedDefault) => {
      mpUserCoords = { lat: MP_DEFAULT_COORDS.lat, lng: MP_DEFAULT_COORDS.lng };
      mpUsingDefaultLoc = !!usedDefault;
      mpGeoPending = false;
      renderMarketplace();
    };
    if (!('geolocation' in navigator)) { fallback(true); return; }
    mpGeoPending = true;
    renderMarketplace();
    try {
      navigator.geolocation.getCurrentPosition(
        pos => {
          mpUserCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          mpUsingDefaultLoc = false;
          mpGeoPending = false;
          renderMarketplace();
        },
        () => { fallback(true); }, // denial or error → graceful default, no crash
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 600000 }
      );
    } catch (_e) {
      fallback(true);
    }
  }

  function loadMPListings() {
    const user = JSON.parse(localStorage.getItem(MP_KEY) || '[]');
    return [...user, ...MP_NEW_SEED, ...MP_SEED];
  }

  function renderMarketplace() {
    const wardrobe = JSON.parse(localStorage.getItem('awear_wardrobe') || '[]');

    const allListings = loadMPListings();
    let filtered = allListings;
    if (mpCondFilter === 'new') filtered = filtered.filter(i => i.isNew);
    if (mpCondFilter === 'preloved') filtered = filtered.filter(i => !i.isNew);
    if (mpFilter !== 'all') filtered = filtered.filter(i => i.category === mpFilter);
    if (mpAssistIds !== null) filtered = filtered.filter(i => mpAssistIds.includes(i.id));
    if (mpPrelovedOnly) filtered = filtered.filter(i => !i.isNew);
    if (mpSizeFilter !== 'all') filtered = filtered.filter(i => !i.size || i.size === mpSizeFilter);
    if (mpClosetFilter) {
      const closetItems = JSON.parse(localStorage.getItem('awear_wardrobe') || '[]');
      if (closetItems.length > 0) {
        filtered = filtered.filter(item => {
          const compat = calcCompatScore(item, closetItems);
          return compat && compat.pct >= 50;
        });
      }
    }
    // Live search
    if (mpSearchQuery) {
      const q = mpSearchQuery.toLowerCase();
      filtered = filtered.filter(i =>
        (i.name||'').toLowerCase().includes(q) ||
        (i.brand||'').toLowerCase().includes(q) ||
        (i.seller||'').toLowerCase().includes(q) ||
        (i.color||'').toLowerCase().includes(q)
      );
    }
    // Extended filters
    if (mpCategoryFilter !== 'all') filtered = filtered.filter(i => i.category === mpCategoryFilter);
    if (mpColorFilter !== 'all') filtered = filtered.filter(i => (i.color||'').toLowerCase().includes(mpColorFilter));
    if (mpBrandFilter !== 'all') filtered = filtered.filter(i => i.brand === mpBrandFilter);
    if (mpConditionFilter !== 'all') filtered = filtered.filter(i => (i.condition||'').toLowerCase() === mpConditionFilter);
    if (mpOccasionFilter !== 'all') filtered = filtered.filter(i => (i.occasion||'') === mpOccasionFilter);
    if (mpMaterialFilter !== 'all') filtered = filtered.filter(i => (i.material||'') === mpMaterialFilter);
    filtered = filtered.filter(i => i.price >= mpPriceMin && i.price <= mpPriceMax);
    if (mpCloseMatchOnly) {
      const wItems = JSON.parse(localStorage.getItem('awear_wardrobe') || '[]');
      if (wItems.length > 0) filtered = filtered.filter(i => { const c = calcCompatScore(i, wItems); return c && c.pct >= 60; });
    }
    // Sort
    if (mpSortBy === 'price-asc') filtered = [...filtered].sort((a,b) => a.price - b.price);
    else if (mpSortBy === 'price-desc') filtered = [...filtered].sort((a,b) => b.price - a.price);
    else if (mpSortBy === 'compat-desc') filtered = [...filtered].sort((a,b) => (b.compat||0) - (a.compat||0));
    else if (mpSortBy === 'newest') filtered = [...filtered].sort((a,b) => (b.id > a.id ? 1 : -1));

    const el = document.getElementById('mp-wrap');
    el.innerHTML = `
      <div class="mp-segment">
        <button class="mp-seg-btn${mpTab==='sell'?' active-sell':''}" data-tab="sell">My&nbsp;store</button>
        <button class="mp-seg-btn${mpTab==='shop'&&mpCondFilter==='preloved'?' active-community':''}" data-tab="shop" data-cond="preloved">Community</button>
        <button class="mp-seg-btn${mpTab==='shop'&&mpCondFilter==='new'?' active-shop':''}" data-tab="shop" data-cond="new">Browse</button>
      </div>
      ${mpTab === 'shop' && mpCondFilter === 'new' ? `
      <div class="mp-search-bar">
        <div class="mp-search-inner">
          ${icon('search', 15)}
          <input class="mp-search-input" id="mp-search-input" type="search" placeholder="Search items, brands, sellers…" value="${esc(mpSearchQuery||'')}" autocomplete="off" />
          ${mpSearchQuery ? `<button class="mp-search-clear" id="mp-search-clear" aria-label="Clear search">×</button>` : ''}
        </div>
      </div>
      <div class="mp-assist-bar">
        <div class="mp-assist-input-row">
          ${icon('sparkle', 16)}
          <input class="mp-assist-input" id="mp-assist-input" placeholder="Try: 'vintage denim under $50' or 'quiet luxury blazer'" value="${mpAssistQuery||''}" />
          ${mpAssistQuery ? `<button class="mp-assist-clear" id="mp-assist-clear">×</button>` : ''}
          <button class="mp-assist-btn" id="mp-assist-submit">${icon('arrowRight', 16)}</button>
        </div>
        ${mpAssistMsg ? `<div class="mp-assist-msg">${esc(mpAssistMsg)}</div>` : ''}
      </div>` : ''}
      ${mpTab === 'shop'
        ? (mpCondFilter === 'preloved'
            ? renderMPCommunity(filtered, wardrobe)
            : renderMPShopGrid(filtered, wardrobe))
        : renderMySells()}
    `;

    // Top-level tabs: Shop / Community / My Listings
    el.querySelectorAll('.mp-seg-btn').forEach(btn => btn.addEventListener('click', () => {
      mpTab = btn.dataset.tab || 'shop';
      if (mpTab === 'shop' && btn.dataset.cond) mpCondFilter = btn.dataset.cond;
      else if (mpTab === 'sell') mpCondFilter = 'new'; // preserve shop default on return
      mpFilter = 'all';
      mpAssistQuery = ''; mpAssistMsg = ''; mpAssistIds = null; mpClosetFilter = false;
      // Reset extended filter/sort so Browse and My Store keep separate sessions
      mpCategoryFilter = 'all'; mpColorFilter = 'all'; mpBrandFilter = 'all'; mpConditionFilter = 'all';
      mpOccasionFilter = 'all'; mpMaterialFilter = 'all'; mpSizeFilter = 'all';
      mpPriceMin = 0; mpPriceMax = 9999; mpSortBy = 'default'; mpCloseMatchOnly = false;
      // Reset Community sub-state so leaving/returning to Community is clean
      mpCommunityView = 'stores'; mpStore = null;
      renderMarketplace();
    }));

    // ---- Community tab handlers (preloved) ----
    if (mpTab === 'shop' && mpCondFilter === 'preloved') {
      // Store-page card tap → drill into that store's page
      el.querySelectorAll('[data-action="mp-store-open"]').forEach(card => card.addEventListener('click', e => {
        if (e.target.closest('[data-action="mp-store-follow"]')) return;
        mpStore = card.dataset.uid; mpCommunityView = 'stores'; renderMarketplace();
      }));
      // Follow toggle (store-page cards)
      el.querySelectorAll('[data-action="mp-store-follow"]').forEach(btn => btn.addEventListener('click', e => {
        e.stopPropagation();
        const uid = btn.dataset.uid;
        followState[uid] = !followState[uid];
        localStorage.setItem('awear_follows', JSON.stringify(followState));
        showToast(followState[uid] ? 'Now following' : 'Unfollowed');
        renderMarketplace();
      }));
      // View-mode toggle: Store pages ⟷ View by items
      el.querySelectorAll('[data-action="mp-comm-view"]').forEach(btn => btn.addEventListener('click', () => {
        mpCommunityView = btn.dataset.view || 'stores';
        if (mpCommunityView === 'items') mpStore = null;
        renderMarketplace();
      }));
      // Scope toggle: Following ⟷ Discover (store-pages list)
      el.querySelectorAll('[data-action="mp-comm-scope"]').forEach(btn => btn.addEventListener('click', () => {
        mpCommunityScope = btn.dataset.scope || 'following';
        mpStore = null; // leaving the list scope resets any drilled store
        renderMarketplace();
      }));
      // Visit store (open in-tab store page)
      el.querySelectorAll('[data-action="mp-store-visit"]').forEach(btn => btn.addEventListener('click', e => {
        e.stopPropagation();
        mpStore = btn.dataset.uid; mpCommunityView = 'stores'; renderMarketplace();
      }));
      // Back from single store page → store list
      el.querySelector('[data-action="mp-store-back"]')?.addEventListener('click', () => {
        mpStore = null; renderMarketplace();
      });
      // "Near me" enable → geolocation opt-in (graceful denial inside)
      el.querySelector('[data-action="mp-near-enable"]')?.addEventListener('click', () => {
        mpRequestGeolocation();
      });
      // "Near me" disable → back to all listings
      el.querySelector('[data-action="mp-near-disable"]')?.addEventListener('click', () => {
        mpNearMe = false;
        localStorage.setItem('awear_mp_nearme', 'false');
        renderMarketplace();
      });
      // Radius chips (5 / 15 / 50 / Any) — persisted
      el.querySelectorAll('[data-action="mp-radius"]').forEach(btn => btn.addEventListener('click', () => {
        const raw = btn.dataset.radius;
        mpRadius = (raw === 'any') ? 'any' : parseInt(raw, 10);
        localStorage.setItem('awear_mp_radius', String(mpRadius));
        renderMarketplace();
      }));
    }

    // Condition chips (closet chip is toggle, others are exclusive)
    el.querySelectorAll('.mp-cond-chip').forEach(btn => btn.addEventListener('click', () => {
      if (btn.dataset.filter === 'closet') {
        mpClosetFilter = !mpClosetFilter;
      } else {
        mpCondFilter = btn.dataset.cond || 'all';
      }
      renderMarketplace();
    }));


    // Category filters
    el.querySelectorAll('.mp-filter').forEach(btn => btn.addEventListener('click', () => {
      mpFilter = btn.dataset.cat; renderMarketplace();
    }));

    // Search bar — live filter
    el.querySelector('#mp-search-input')?.addEventListener('input', e => {
      mpSearchQuery = e.target.value.trim();
      renderMarketplace();
    });
    el.querySelector('#mp-search-clear')?.addEventListener('click', () => {
      mpSearchQuery = '';
      renderMarketplace();
    });

    // Quick sort chips
    el.querySelectorAll('[data-action="mp-quick-sort"]').forEach(btn => btn.addEventListener('click', () => {
      mpSortBy = btn.dataset.sort || 'default';
      renderMarketplace();
    }));

    // Delegated handlers live on #mp-wrap, which is STATIC HTML (never recreated),
    // so bind them ONCE. Re-binding every render accumulated duplicate listeners
    // that fired openMPItemSheet / handlers N times per click.
    if (!el.dataset.mpDelegated) {
      el.dataset.mpDelegated = '1';
    // Filter & Sort sheet open
    el.addEventListener('click', e => {
      if (e.target.closest('[data-action="mp-filter-open"]')) { openMPFilterSheet(); return; }
      // Remove individual active chip
      const chip = e.target.closest('[data-action="mp-chip-remove"]');
      if (chip) {
        const key = chip.dataset.key;
        if (key === 'color') mpColorFilter = 'all';
        else if (key === 'brand') mpBrandFilter = 'all';
        else if (key === 'condition') mpConditionFilter = 'all';
        else if (key === 'sort') mpSortBy = 'default';
        else if (key === 'price') { mpPriceMin = 0; mpPriceMax = 9999; }
        else if (key === 'closematch') mpCloseMatchOnly = false;
        else if (key === 'occasion') mpOccasionFilter = 'all';
        else if (key === 'material') mpMaterialFilter = 'all';
        else if (key === 'size') { mpSizeFilter = 'all'; localStorage.setItem('awear_mp_size', 'all'); }
        renderMarketplace();
        return;
      }
      // Make Offer
      if (e.target.closest('[data-action="make-offer"]')) {
        showToast('Offer sent! The seller will respond shortly.');
        return;
      }
      // Empty state: clear all filters
      if (e.target.closest('[data-action="mp-filters-reset"]')) { resetMPFilters(); return; }
      // Empty state: focus AI assist
      if (e.target.closest('[data-action="mp-assist-focus"]')) {
        document.getElementById('mp-assist-input')?.focus();
        return;
      }
    });

    // Seller name tap → open that store's page; card tap → product detail sheet.
    el.addEventListener('click', e => {
      const sellerEl = e.target.closest('[data-action="seller-profile"]');
      if (sellerEl) {
        e.stopPropagation();
        const seller = SEED_USERS.find(u => u.handle === sellerEl.dataset.seller);
        if (seller) openUserProfile(seller.id);
        return;
      }
      // Tap anywhere on a resale card (not a button) → product detail sheet
      if (e.target.closest('.mp-buy-btn, .mp-offer-btn, [data-action="compat-overlay"], .mp-delete-btn')) return;
      const card = e.target.closest('.mp-item.resale');
      if (!card) return;
      e.stopPropagation();
      const item = (loadMPListings().find(i => i.id === card.dataset.id)) || MP_SEED.find(i => i.id === card.dataset.id);
      if (item) openMPItemSheet(item);
    });

    // Buy button — event delegation via data-id on parent card
    el.addEventListener('click', e => {
      const btn = e.target.closest('.mp-buy-btn');
      if (!btn) return;
      e.stopPropagation();
      const card = btn.closest('.mp-item');
      if (!card) return;
      handleMPBuy(card.dataset.id, card.dataset.isnew === 'true');
    });

    // Delete listing button — event delegation
    el.addEventListener('click', e => {
      const del = e.target.closest('.mp-delete-btn');
      if (del) { deleteMySell(del.dataset.id); }
    });
    } // end bind-once delegated handlers

    // Sell button
    el.querySelector('#ms-list-btn')?.addEventListener('click', openSellForm);
    el.querySelector('#ms-filter-btn')?.addEventListener('click', openMPFilterSheet);
    el.querySelector('#ms-insight-btn')?.addEventListener('click', openStoreInsight);
    el.querySelector('#ms-clear-filters')?.addEventListener('click', () => {
      mpCategoryFilter = 'all'; mpColorFilter = 'all'; mpBrandFilter = 'all'; mpConditionFilter = 'all';
      mpOccasionFilter = 'all'; mpMaterialFilter = 'all'; mpSizeFilter = 'all';
      mpPriceMin = 0; mpPriceMax = 9999; mpSortBy = 'default';
      renderMarketplace();
    });
    el.querySelector('#ms-share-btn')?.addEventListener('click', () => showToast('Store link copied!'));
    // Cyclical viewers stat: today → 30d → all-time → today
    el.querySelector('#ms-views-btn')?.addEventListener('click', () => {
      msViewMode = msViewMode === 'today' ? 'month' : msViewMode === 'month' ? 'all' : 'today';
      renderMarketplace();
    });

    // AI assist bar
    el.querySelector('#mp-assist-submit')?.addEventListener('click', runMPAssist);
    el.querySelector('#mp-assist-input')?.addEventListener('keydown', e => { if (e.key === 'Enter') runMPAssist(); });
    el.querySelector('#mp-assist-clear')?.addEventListener('click', () => {
      mpAssistQuery = ''; mpAssistMsg = ''; mpAssistIds = null; renderMarketplace();
    });

    // Suggest-card event delegation (replaces inline onclick)
    el.addEventListener('click', e => {
      const sc = e.target.closest('.mp-suggest-card');
      if (sc) { try { openSellFormWithItem(JSON.stringify(JSON.parse(sc.dataset.item))); } catch(err){} }
    });

    // Compat overlay badge — replaces inline onclick
    el.addEventListener('click', e => {
      const compatBtn = e.target.closest('[data-action="compat-overlay"]');
      if (compatBtn) { e.stopPropagation(); openCompatOverlay(compatBtn.dataset.id); return; }

      const closeModal = e.target.closest('[data-action="close-modal"]');
      if (closeModal) { document.getElementById('purchase-modal')?.classList.remove('show'); return; }

      const goWardrobe = e.target.closest('[data-action="go-wardrobe"]');
      if (goWardrobe) { showView('closet'); return; }
    });
  }

  function renderMPShopGrid(items, wardrobe) {
    const categories = ['all','top','bottoms','shoes','bag','outerwear','dress'];
    const catLabels = {all:'All',top:'Tops',bottoms:'Bottoms',shoes:'Shoes',bag:'Bags',outerwear:'Outerwear',dress:'Dresses'};
    const wardrobeForEmpty = JSON.parse(localStorage.getItem('awear_wardrobe') || '[]');
    const allListingsForCount = loadMPListings();

    // P0-E: count per category from all listings (before category filter, after condition/size/etc)
    const catCounts = {};
    categories.forEach(c => {
      if (c === 'all') { catCounts[c] = allListingsForCount.length; return; }
      catCounts[c] = allListingsForCount.filter(i => i.category === c).length;
    });

    // P1-D: Pre-loved toggle


    const catFiltersHtml = `
      <div class="mp-filters">
        ${categories.map(c => `<button class="mp-filter${mpFilter===c?' active':''}" data-cat="${c}">${catLabels[c]}${catCounts[c] ? ` <span style="font-size:var(--t-micro,11px);opacity:.7">(${catCounts[c]})</span>` : ''}</button>`).join('')}
      </div>`;

    // Quick sort chips (inline, above grid)
    const quickSortChips = [
      {key:'default', label:'Best Match'},
      {key:'newest', label:'Newest'},
      {key:'price-asc', label:'Lowest Price'},
      {key:'compat-desc', label:'Trending'},
    ];
    const quickSortHtml = `
      <div class="mp-quick-sort">
        ${quickSortChips.map(s => `<button class="mp-qs-chip${mpSortBy===s.key?' active':''}" data-action="mp-quick-sort" data-sort="${s.key}">${s.label}</button>`).join('')}
      </div>`;

    // Filter & Sort toolbar + active chips
    const activeFiltersCount = [
      mpColorFilter !== 'all', mpBrandFilter !== 'all', mpConditionFilter !== 'all',
      mpOccasionFilter !== 'all', mpMaterialFilter !== 'all', mpSizeFilter !== 'all',
      mpPriceMin > 0, mpPriceMax < 9999, mpCloseMatchOnly
    ].filter(Boolean).length;
    const activeChipsHtml = (() => {
      const chips = [];
      if (mpSizeFilter !== 'all') chips.push({label: mpSizeFilter, key: 'size'});
      if (mpColorFilter !== 'all') chips.push({label: mpColorFilter, key: 'color'});
      if (mpBrandFilter !== 'all') chips.push({label: mpBrandFilter, key: 'brand'});
      if (mpConditionFilter !== 'all') chips.push({label: mpConditionFilter, key: 'condition'});
      if (mpOccasionFilter !== 'all') chips.push({label: mpOccasionFilter, key: 'occasion'});
      if (mpMaterialFilter !== 'all') chips.push({label: mpMaterialFilter, key: 'material'});
      if (mpPriceMin > 0 || mpPriceMax < 9999) chips.push({label:`$${mpPriceMin}–$${mpPriceMax < 9999 ? mpPriceMax : '∞'}`, key:'price'});
      if (mpCloseMatchOnly) chips.push({label:'60%+ Match', key:'closematch'});
      if (!chips.length) return '';
      return chips.map(c => `<button class="mp-active-chip" data-action="mp-chip-remove" data-key="${c.key}">${c.label} <span class="mp-active-chip-x">×</span></button>`).join('');
    })();
    const toolbarHtml = `
      <div class="mp-toolbar">
        <button class="mp-filter-btn${activeFiltersCount > 0 ? ' has-active' : ''}" data-action="mp-filter-open">
          ${icon('filter',14)} Filter &amp; Sort
          ${activeFiltersCount > 0 ? `<span class="mp-filter-count">${activeFiltersCount}</span>` : ''}
        </button>
        <button class="mp-cond-chip mp-closet-chip${mpClosetFilter?' active':''}" data-filter="closet">${icon('sparkle', 12)} Matches My Closet</button>
        ${activeChipsHtml ? `<div class="mp-active-chips">${activeChipsHtml}</div>` : ''}
      </div>`;

    const filtersBlock = catFiltersHtml + toolbarHtml + quickSortHtml;

    if (!items.length) {
      let emptyHtml;
      const hasExtendedFilters = activeFiltersCount > 0 || mpFilter !== 'all' || mpClosetFilter;
      if (mpClosetFilter && wardrobeForEmpty.length === 0) {
        emptyHtml = `<div class="mp-empty">
          ${icon('wardrobe', 36)}
          <div>Add items to your closet to unlock Closet Match</div>
          <button class="mp-empty-cta" data-action="go-wardrobe">Open Wardrobe</button>
        </div>`;
      } else if (hasExtendedFilters) {
        emptyHtml = `<div class="mp-empty-filters">
          ${icon('search', 40)}
          <div class="mp-empty-filters-title">No items match your filters</div>
          <div class="mp-empty-filters-sub">Try adjusting your filters or let AI find something for you</div>
          <div class="mp-empty-filters-ctas">
            <button class="mp-empty-filters-clear" data-action="mp-filters-reset">Clear filters</button>
            <button class="mp-empty-filters-ai" data-action="mp-assist-focus">${icon('sparkle',12)} Ask AI Stylist</button>
          </div>
        </div>`;
      } else if (mpCondFilter === 'preloved') {
        emptyHtml = `<div class="mp-empty">
          ${icon('heart', 40)}
          <div style="font-size:var(--t-body,14px);font-weight:800;color:var(--fg,#f0ecf5)">No pre-loved items yet</div>
          <div style="font-size:var(--t-caption,12px);color:var(--muted,#8a8498)">Be the first to sell from your closet!</div>
          <button class="mp-empty-cta" onclick="mpTab='sell';renderMarketplace()">Start Selling</button>
        </div>`;
      } else {
        emptyHtml = `<div style="text-align:center;padding:48px 20px;color:var(--muted)">
          <div style="margin-bottom:12px">${icon('search',36)}</div>
          <div style="font-size:var(--t-body);font-weight:700;color:var(--fg)">No items in this category</div>
          <div style="font-size:var(--t-caption);margin-top:6px">Try a different filter</div>
        </div>`;
      }
      return filtersBlock + emptyHtml;
    }

    return filtersBlock + `
      <div class="mp-grid">
        ${renderMPCards(items, wardrobe)}
      </div>`;
  }

  // Shared product-card markup for marketplace grids (Browse + Community).
  // Self-contained: holds its own grade/co2/listed-ago config so it can be
  // called from renderMPShopGrid (Browse) and renderMPGridBare (store page).
  function renderMPCards(items, wardrobe) {
    const co2Map = {shoes:1.8, outerwear:3.2, top:1.2, bottoms:1.6, bag:0.9, dress:1.4};
    const gradeColors = {A:'var(--success,#52c97a)', B:'var(--accent3,#7a6af0)', C:'var(--accent2,#c4855a)'};
    const gradeLabels = {A:'Like New', B:'Good', C:'Fair'};
    const _listedAgo = (days) => {
      if (!days) return '';
      if (days <= 1) return '1 day ago';
      if (days < 7) return `${days} days ago`;
      if (days < 14) return '1 week ago';
      return `${Math.floor(days/7)} weeks ago`;
    };
    return items.map(item => {
          const isRetail = !!item.isNew;
          const compat = (!isRetail && wardrobe.length) ? calcCompatScore(item, wardrobe) : null;
          const co2Kg = !isRetail ? (co2Map[item.category] || 1.5) : null;
          const cardClass = isRetail ? 'mp-item retail' : 'mp-item resale';
          const badgeClass = isRetail ? 'brand-new' : 'preloved';
          const isNewArrival = isRetail && (item.arrived_days || 0) <= 7;
          const badgeText = isNewArrival ? 'New Arrival' : (isRetail ? 'Brand New' : 'Pre-loved');
          const btnClass = isRetail ? 'mp-buy-btn retail-btn' : 'mp-buy-btn resale-btn';
          // Single in-app "Buy" for both — purchase happens through AWEAR, no external store.
          const btnLabel = 'Buy';
          // Condition grade for resale
          const grade = item.condGrade || '';
          const gradeColor = gradeColors[grade] || 'var(--muted,#8a8498)';
          const gradeLabel = gradeLabels[grade] || '';
          // Seller rating stars
          const ratingStr = item.seller_rating ? `${item.seller_rating.toFixed(1)} · ${item.seller_sales} sales` : '';
          // Size badge for retail
          const sizeBadge = isRetail && item.size ? `<span class="mp-size-badge">${esc(item.size)}</span>` : '';
          return `<div class="${cardClass}" data-id="${item.id}" data-isnew="${!!item.isNew}">
            <div class="mp-item-img">
              ${productImage(item)}
              <div class="mp-item-badge ${badgeClass}">${esc(badgeText)}</div>
              ${sizeBadge}
            </div>
            <div class="mp-item-info">
              ${compat ? `<div class="mp-compat-pill" data-action="compat-overlay" data-id="${item.id}">${icon('sparkle',11)} ${compat.pct}% match</div>` : ''}
              <div class="mp-item-name">${esc(item.name)}</div>
              ${isRetail
                ? `<div class="mp-item-brand">${esc(item.brand||'')}</div>`
                : `<div class="mp-seller-row">
                    <span class="mp-seller-avatar">${(item.seller||'?').replace('@','').slice(0,2).toUpperCase()}</span>
                    <span class="mp-item-seller" data-action="seller-profile" data-seller="${esc(item.seller||'')}">
                      ${esc(item.seller||'')}
                      ${item.seller_badge ? `<span class="mp-seller-badge">${esc(item.seller_badge)}</span>` : ''}
                    </span>
                  </div>
                  ${ratingStr ? `<div class="mp-seller-rating">${icon('star',10)} ${esc(ratingStr)}</div>` : ''}
                  ${(() => {
                    if (!item.city) return '';
                    const d = (typeof mpListingDistanceKm === 'function') ? mpListingDistanceKm(item) : null;
                    const distStr = (mpNearMe && d !== null)
                      ? ` · ${d < 1 ? '<1' : Math.round(d)} km away`
                      : '';
                    return `<div class="mp-loc-row">${icon('mapPin',10)} ${esc(item.city)}${distStr}</div>`;
                  })()}
                  <div class="mp-cond-grade-row">
                    <span class="mp-cond-grade" style="background:color-mix(in srgb,${gradeColor} 18%,transparent);color:${gradeColor};border-color:color-mix(in srgb,${gradeColor} 35%,transparent)">${grade} — ${gradeLabel}</span>
                    ${item.listed_days ? `<span class="mp-listed-time">${_listedAgo(item.listed_days)}</span>` : ''}
                  </div>`
              }
              ${co2Kg ? `<div class="mp-co2-badge">${icon('leaf',10)} ~${co2Kg}kg CO₂ saved</div>` : ''}
              <div class="mp-item-price">$${item.price}${!isRetail && item.orig ? ` <span style="font-size:var(--t-micro);color:var(--muted);text-decoration:line-through">$${item.orig}</span>` : ''}</div>
              <div class="${isRetail ? '' : 'mp-buy-row'}">
                <button class="${btnClass}">${btnLabel}</button>
                ${!isRetail ? `<button class="mp-offer-btn" data-action="make-offer" data-id="${item.id}">Make Offer</button>` : ''}
              </div>
            </div>
          </div>`;
        }).join('');
  }

  // "Near me" local/radius control for the pre-loved item grid (item 18).
  // Reuses .ff chip language. Off state = one compact opt-in button. On state = status line + radius chips.
  function mpNearMeControlHtml() {
    if (!mpNearMe) {
      return `<div class="mp-near">
        <button class="mp-near-btn" data-action="mp-near-enable">${icon('mapPin',15)} Shop near me</button>
        <span class="mp-near-hint">Find pre-loved pieces close to home</span>
      </div>`;
    }
    if (mpGeoPending) {
      return `<div class="mp-near">
        <button class="mp-near-btn active" data-action="mp-near-disable">${icon('mapPin',15)} Locating…</button>
      </div>`;
    }
    const locLabel = mpUsingDefaultLoc ? MP_DEFAULT_COORDS.city : 'your location';
    const chips = [...MP_RADII.map(r => ({ v: r, label: `${r} km` })), { v: 'any', label: 'Any' }];
    const chipsHtml = chips.map(c =>
      `<button class="ff${(mpRadius===c.v)?' active':''}" data-action="mp-radius" data-radius="${c.v}" aria-pressed="${mpRadius===c.v}">${esc(c.label)}</button>`
    ).join('');
    return `<div class="mp-near">
      <div class="mp-near-row">
        <button class="mp-near-btn active" data-action="mp-near-disable" aria-label="Turn off near me">${icon('mapPin',15)} Near me</button>
        <span class="mp-near-loc">${esc(locLabel)}</span>
      </div>
      ${mpUsingDefaultLoc ? `<div class="mp-near-note">Location off — showing pre-loved around ${esc(MP_DEFAULT_COORDS.city)}. Enable location for true distances.</div>` : ''}
      <div class="mp-near-radii" role="group" aria-label="Distance radius">${chipsHtml}</div>
    </div>`;
  }

  // ---- Community tab (preloved) ----
  // items = already-filtered preloved listings (respects all mp* filters + search).
  // Layout: store strip → view toggle → (store pages | item grid).
  function renderMPCommunity(items, wardrobe) {
    const sellerItems = (handle) => MP_SEED.filter(i => i.seller === handle);
    const storeData = SEED_USERS
      .filter(u => !isBlocked(u.id))
      .map(u => {
        const its = sellerItems(u.handle);
        return { u, items: its, count: its.length, following: !!(followState[u.id] ?? u.following) };
      });

    // ---- View toggle (always shown) ----
    const toggleHtml = `
      <div class="mp-comm-toggle" role="tablist">
        <button class="mp-comm-tgl${mpCommunityView==='stores'?' active':''}" data-action="mp-comm-view" data-view="stores" role="tab" aria-selected="${mpCommunityView==='stores'}">${icon('users',14)} Store pages</button>
        <button class="mp-comm-tgl${mpCommunityView==='items'?' active':''}" data-action="mp-comm-view" data-view="items" role="tab" aria-selected="${mpCommunityView==='items'}">${icon('grid',14)} View by items</button>
      </div>`;

    // ---- Search bar (kept) — sits BELOW the selection (strip + toggle), above content ----
    const searchHtml = `
      <div class="mp-search-bar">
        <div class="mp-search-inner">
          ${icon('search', 15)}
          <input class="mp-search-input" id="mp-search-input" type="search" placeholder="Search items, brands, sellers…" value="${esc(mpSearchQuery||'')}" autocomplete="off" />
          ${mpSearchQuery ? `<button class="mp-search-clear" id="mp-search-clear" aria-label="Clear search">×</button>` : ''}
        </div>
      </div>`;

    // Selection (view toggle) → then the remaining search → then content.
    const selectionHtml = `${toggleHtml}${searchHtml}`;

    // ---- Mode B: View by items → reuse existing shop grid (filters/sort/chips) ----
    // + local/radius "Near me" control (item 18): pre-loved is bought near home.
    if (mpCommunityView === 'items') {
      const geoItems = mpApplyRadiusFilter(items);
      const nearHtml = mpNearMeControlHtml();
      // Empty state specific to radius (nudge to widen) — only when Near me trimmed everything out.
      if (mpNearMe && mpUserCoords && mpRadius !== 'any' && !geoItems.length && items.length) {
        const here = mpUsingDefaultLoc ? MP_DEFAULT_COORDS.city : 'your location';
        const radiusEmpty = `<div class="mp-empty">
          ${icon('mapPin', 36)}
          <div style="font-size:var(--t-body,14px);font-weight:800;color:var(--fg,#f0ecf5)">Nothing within ${mpRadius} km</div>
          <div style="font-size:var(--t-caption,12px);color:var(--muted,#8a8498)">No pre-loved listings near ${esc(here)} yet — widen the radius to see more.</div>
          <button class="mp-empty-cta" data-action="mp-radius" data-radius="any">Show any distance</button>
        </div>`;
        return `${selectionHtml}${nearHtml}${radiusEmpty}`;
      }
      return `${selectionHtml}${nearHtml}${renderMPShopGrid(geoItems, wardrobe)}`;
    }

    // ---- Mode A: Store pages ----
    // Single selected store → expanded page with its item grid + back affordance.
    if (mpStore) {
      const sd = storeData.find(s => s.u.id === mpStore);
      if (sd) return `${selectionHtml}${storePageExpanded(sd, wardrobe)}`;
      mpStore = null; // store no longer available
    }

    // Store-page cards list — explicit Following | Discover scope (default Following, Carmel).
    const followingCount = storeData.filter(s => s.following).length;
    const discoverCount = storeData.length - followingCount;
    const scopeHtml = `
      <div class="mp-comm-scope" role="tablist" aria-label="Store scope">
        <button class="ff${mpCommunityScope==='following'?' active':''}" data-action="mp-comm-scope" data-scope="following" role="tab" aria-selected="${mpCommunityScope==='following'}">${icon('heart',13)} Following${followingCount?` <span class="mp-scope-n">${followingCount}</span>`:''}</button>
        <button class="ff${mpCommunityScope==='discover'?' active':''}" data-action="mp-comm-scope" data-scope="discover" role="tab" aria-selected="${mpCommunityScope==='discover'}">${icon('sparkle',13)} Discover${discoverCount?` <span class="mp-scope-n">${discoverCount}</span>`:''}</button>
      </div>`;

    const inScope = storeData.filter(s => mpCommunityScope==='discover' ? !s.following : s.following);
    // Within Following, freshest-following feel; Discover ordered by inventory depth so there's something to browse.
    const ordered = mpCommunityScope==='discover'
      ? [...inScope].sort((a,b) => b.count - a.count)
      : [...inScope];

    if (!ordered.length) {
      const empty = mpCommunityScope==='following'
        ? `<div class="mp-empty">${icon('heart',36)}
            <div style="font-size:var(--t-body,14px);font-weight:800;color:var(--fg,#f0ecf5)">You're not following any stores yet</div>
            <div style="font-size:var(--t-caption,12px);color:var(--muted,#8a8498)">Switch to Discover to find sellers whose taste matches yours</div></div>`
        : `<div class="mp-empty">${icon('sparkle',36)}
            <div style="font-size:var(--t-body,14px);font-weight:800;color:var(--fg,#f0ecf5)">You already follow everyone here</div>
            <div style="font-size:var(--t-caption,12px);color:var(--muted,#8a8498)">Nice taste — check Following to shop their listings</div></div>`;
      return `${selectionHtml}${scopeHtml}${empty}`;
    }
    const cardsHtml = ordered.map(sd => storePageCard(sd)).join('');
    return `${selectionHtml}${scopeHtml}
      <div class="mp-store-pages">${cardsHtml}</div>`;
  }

  // Compact store-page preview card (used in the store-pages list).
  function storePageCard(sd) {
    const u = sd.u;
    const thumbs = sd.items.slice(0, 3).map(it => `
      <div class="mp-sp-thumb">${productImage(it)}</div>`).join('')
      || `<div class="mp-sp-thumb-empty">${icon('tag',16)}</div>`;
    return `<div class="mp-sp-card" data-action="mp-store-open" data-uid="${u.id}">
      <div class="mp-sp-head">
        <div class="mp-sp-av">
          <img src="${attr(u.avatar)}" alt="" data-name="${attr(u.name)}" loading="lazy" onerror="this.onerror=null;avatarFallback(this)">
        </div>
        <div class="mp-sp-meta">
          <div class="mp-sp-name">${esc(u.name)}</div>
          <div class="mp-sp-handle">${esc(u.handle)} · ${sd.count} ${sd.count===1?'item':'items'}</div>
          <div class="mp-sp-vibe">${icon('tag',10)} ${esc(u.vibe)}</div>
        </div>
        <button class="mp-sp-follow${sd.following?' following':''}" data-action="mp-store-follow" data-uid="${u.id}">${sd.following?'Following':'+ Follow'}</button>
      </div>
      <div class="mp-sp-thumbs">${thumbs}</div>
      <button class="mp-sp-visit" data-action="mp-store-visit" data-uid="${u.id}">Visit store ${icon('arrowRight',13)}</button>
    </div>`;
  }

  // Expanded single-store page: header + that seller's item grid.
  function storePageExpanded(sd, wardrobe) {
    const u = sd.u;
    return `
      <div class="mp-sp-detail">
        <button class="mp-sp-back" data-action="mp-store-back">${icon('arrowLeft',14)} All stores</button>
        <div class="mp-sp-cover">
          <div class="mp-sp-cover-av">
            <img src="${attr(u.avatar)}" alt="" data-name="${attr(u.name)}" loading="lazy" onerror="this.onerror=null;avatarFallback(this)">
          </div>
          <div class="mp-sp-cover-meta">
            <div class="mp-sp-name">${esc(u.name)}</div>
            <div class="mp-sp-handle">${esc(u.handle)}</div>
            <div class="mp-sp-vibe">${icon('tag',10)} ${esc(u.vibe)} · ${sd.count} ${sd.count===1?'item':'items'}</div>
          </div>
          <button class="mp-sp-follow${sd.following?' following':''}" data-action="mp-store-follow" data-uid="${u.id}">${sd.following?'Following':'+ Follow'}</button>
        </div>
      </div>
      ${sd.items.length ? renderMPGridBare(sd.items, wardrobe) : `
        <div class="mp-empty">
          ${icon('tag',36)}
          <div style="font-size:var(--t-body,14px);font-weight:800;color:var(--fg,#f0ecf5)">No items listed yet</div>
          <div style="font-size:var(--t-caption,12px);color:var(--muted,#8a8498)">Follow to get notified when ${esc(u.name.split(' ')[0])} lists something</div>
        </div>`}`;
  }

  // Item grid WITHOUT the filter toolbar (used inside a single store page).
  // Reuses the exact card markup from renderMPShopGrid via renderMPCards.
  function renderMPGridBare(items, wardrobe) {
    return `<div class="mp-grid">${renderMPCards(items, wardrobe)}</div>`;
  }

  // Synthesize a readable product description from listing attributes (MP_SEED has no description field).
  function mpItemDescription(item) {
    const condWord = ({A:'like-new', B:'good', C:'fair'})[item.condGrade] || (item.condition || 'pre-loved');
    const attrs = [item.color, item.material, item.category].filter(Boolean).join(' ');
    const bits = [];
    bits.push(`A ${condWord} condition ${attrs || 'piece'}${item.size ? `, size ${item.size}` : ''}.`);
    if ((item.style_tags || []).length) bits.push(`Style: ${item.style_tags.join(', ')}.`);
    if (item.occasion) bits.push(`Made for ${item.occasion} looks.`);
    if (item.orig && item.orig > item.price) bits.push(`Originally $${item.orig} — now $${item.price}.`);
    const rating = item.seller_rating ? ` (${item.seller_rating.toFixed(1)} rating, ${item.seller_sales} sales)` : '';
    if (item.seller) bits.push(`Listed by ${item.seller}${rating}.`);
    return bits.join(' ');
  }

  // Marketplace product detail sheet: photo + seller + description, then Buy + View profile.
  function openMPItemSheet(item) {
    logAdminEvent('buy_intent', 'Opened MP item: ' + (item.name || 'item'));
    const store = SEED_USERS.find(u => u.handle === item.seller) || null;
    _mpSheetStore = store ? store.id : null;
    // Community listing = preloved (P2P second-hand) → 8% AWEAR commission, record seller.
    _checkoutCtx = { it: {
      id: item.id, name: item.name, category: item.category, color: item.color,
      brand_vibe: item.seller, price_estimate_usd: item.price,
      search_query: item.name, style_tags: item.style_tags || [],
      kind: 'preloved', seller_key: item.seller || '',
    }, influencerUser: null };

    const storeName = store ? store.name : (item.seller || '');
    const origStrike = (item.orig && item.orig > item.price)
      ? ` <span style="font-size:var(--t-small,13px);color:var(--muted,#8a8498);text-decoration:line-through">$${esc(item.orig)}</span>` : '';

    sheetBody.innerHTML = `
      <div class="sheet-hero">
        <div class="sheet-hero-img">${productImage(item)}</div>
        <div class="sheet-hero-info">
          <div class="sheet-hero-name">${esc(item.name)}</div>
          ${storeName ? `<span class="mp-sheet-store">${icon('user',13)} Sold by ${esc(storeName)}</span>` : ''}
          <div class="sheet-hero-price">$${esc(item.price)}${origStrike}</div>
        </div>
      </div>
      <div class="mp-sheet-desc-label">Description</div>
      <div class="mp-sheet-desc">${esc(mpItemDescription(item))}</div>
      <div style="height:8px"></div>`;

    sheetFooter.innerHTML = `
      <div class="mp-sheet-actions">
        ${store ? `<button class="sheet-buy-secondary" data-action="view-seller-profile" aria-label="View ${attr(storeName)} profile">${icon('user',16)} View profile</button>` : ''}
        <button class="sheet-buy" data-action="checkout" aria-label="Buy ${attr(item.name)}">
          ${icon('bag',18)} Buy <span class="sheet-buy-price">$${esc(item.price)}</span>
        </button>
      </div>`;
    showSheet();
  }

  function handleMPBuy(id, isNew) {
    if (isNew === 'true') {
      // Retail (brand-new) — feels in-app; backend fulfils via dropshipping/affiliate.
      // No external "Opening store" redirect — open the AWEAR Buy sheet (kind=retail).
      const item = MP_NEW_SEED.find(i => i.id === id);
      if (!item) return;
      openSheetSingle({
        id: item.id, name: item.name, category: item.category, color: item.color,
        brand_vibe: item.brand, price_estimate_usd: item.price,
        search_query: item.name, style_tags: item.style_tags || [],
        kind: 'retail', seller_key: '',
      }, null, null);
    } else {
      // Community listing — preloved (P2P), 8% AWEAR commission, record seller.
      const item = loadMPListings().find(i => i.id === id);
      if (!item) return;
      openSheetSingle({
        id: item.id, name: item.name, category: item.category, color: item.color,
        brand_vibe: item.seller, price_estimate_usd: item.price,
        search_query: item.name, style_tags: item.style_tags || [],
        kind: 'preloved', seller_key: item.seller || '',
      }, null, null);
    }
  }

  function openCompatOverlay(itemId) {
    const item = loadMPListings().find(i => i.id === itemId);
    const wardrobe = JSON.parse(localStorage.getItem('awear_wardrobe') || '[]');
    if (!item || !wardrobe.length) return;
    const compat = calcCompatScore(item, wardrobe);
    const top3 = compat?.matches?.slice(0,3) || wardrobe.slice(0,3);

    const modal = document.getElementById('purchase-modal');
    const card = document.getElementById('modal-card');
    card.innerHTML = `
      <div style="padding:20px">
        <div style="font-size:var(--t-h3);font-weight:900;margin-bottom:4px">${icon('sparkle',16)} ${compat?.pct||'?'}% Closet Match</div>
        <div style="font-size:var(--t-caption);color:var(--muted);margin-bottom:16px">This pairs with ${top3.length} items you already own</div>
        <div style="display:grid;grid-template-columns:repeat(${Math.min(top3.length+1,4)},1fr);gap:8px;margin-bottom:16px">
          ${top3.map(w=>`<div style="border-radius:var(--r-md);overflow:hidden;aspect-ratio:1;background:var(--card)">
            ${productImage(w)}
            <div style="padding:4px 6px;font-size:var(--t-micro);font-weight:700;color:var(--muted)">${esc(w.name||'')}</div>
          </div>`).join('')}
          <div style="border-radius:var(--r-md);overflow:hidden;aspect-ratio:1;background:var(--card);border:2px solid var(--accent)">
            ${productImage(item)}
            <div style="padding:4px 6px;font-size:var(--t-micro);font-weight:800;color:var(--accent)">This item</div>
          </div>
        </div>
        <button class="mp-buy-btn" data-action="close-modal">Got it!</button>
      </div>`;
    modal.classList.add('show');
  }

  // ---- Marketplace Filter Sheet ----
  function _buildFilterSheetContent() {
    const colors = ['black','white','navy','red','green','camel','grey','pink'];
    const colorLabels = {black:'Black',white:'White',navy:'Navy',red:'Red',green:'Green',camel:'Camel',grey:'Grey',pink:'Pink'};
    const conditions = ['new-with-tags','like-new','very-good','good','fair'];
    const condLabels = {'new-with-tags':'New with tags','like-new':'Like New','very-good':'Very Good','good':'Good','fair':'Fair'};
    const brands = [...new Set(loadMPListings().map(i => i.brand).filter(Boolean))].sort();
    const occasions = ['casual','work','evening','sport','formal'];
    const occasionLabels = {casual:'Casual',work:'Work',evening:'Evening',sport:'Sport',formal:'Formal'};
    const materials = ['cotton','linen','denim','synthetic','wool','silk'];
    const materialLabels = {cotton:'Cotton',linen:'Linen',denim:'Denim',synthetic:'Synthetic',wool:'Wool',silk:'Silk'};
    const clothingSizes = ['XS','S','M','L','XL','XXL'];
    const shoeSizes = ['36','37','38','39','40','41','42'];
    const allSheetSizes = clothingSizes.concat(shoeSizes);
    const sortOpts = [
      {key:'default', label:'Recommended'},
      {key:'price-asc', label:'Price: Low to High'},
      {key:'price-desc', label:'Price: High to Low'},
      {key:'compat-desc', label:'Best Closet Match'},
      {key:'newest', label:'Newest First'},
    ];

    const isCommunity = mpCondFilter === 'preloved';

    const sortSection = `
      <div class="mp-fsheet-section">
        <div class="mp-fsheet-label">Sort by</div>
        <div class="mp-sort-row">
          ${sortOpts.map(o => `
            <div class="mp-sort-opt${_mpPendingSort===o.key?' active':''}" data-action="mp-sort-pick" data-sort="${o.key}">
              <span>${o.label}</span>
              <span class="mp-sort-check">${_mpPendingSort===o.key ? icon('check',10) : ''}</span>
            </div>`).join('')}
        </div>
      </div>`;

    const priceSection = `
      <div class="mp-fsheet-divider"></div>
      <div class="mp-fsheet-section">
        <div class="mp-fsheet-label">Price range</div>
        <div class="mp-fsheet-price-row">
          <input class="mp-fsheet-price-input" id="mp-price-min" type="number" min="0" placeholder="$ Min" value="${_mpPendingPriceMin > 0 ? _mpPendingPriceMin : ''}" />
          <span class="mp-fsheet-price-sep">—</span>
          <input class="mp-fsheet-price-input" id="mp-price-max" type="number" min="0" placeholder="$ Max" value="${_mpPendingPriceMax < 9999 ? _mpPendingPriceMax : ''}" />
        </div>
      </div>`;

    const colorSection = `
      <div class="mp-fsheet-divider"></div>
      <div class="mp-fsheet-section">
        <div class="mp-fsheet-label">Color</div>
        <div class="mp-fsheet-chips">
          <button class="mp-fsheet-chip${_mpPendingColor==='all'?' active':''}" data-action="mp-fcolor" data-color="all">All</button>
          ${colors.map(c => `<button class="mp-fsheet-chip${_mpPendingColor===c?' active-camel':''}" data-action="mp-fcolor" data-color="${c}">${colorLabels[c]}</button>`).join('')}
        </div>
      </div>`;

    const brandSection = `
      <div class="mp-fsheet-divider"></div>
      <div class="mp-fsheet-section">
        <div class="mp-fsheet-label">Brand</div>
        <div class="mp-fsheet-chips">
          <button class="mp-fsheet-chip${_mpPendingBrand==='all'?' active':''}" data-action="mp-fbrand" data-brand="all">All Brands</button>
          ${brands.map(b => `<button class="mp-fsheet-chip${_mpPendingBrand===b?' active':''}" data-action="mp-fbrand" data-brand="${b}">${b}</button>`).join('')}
        </div>
      </div>`;

    const occasionSection = `
      <div class="mp-fsheet-divider"></div>
      <div class="mp-fsheet-section">
        <div class="mp-fsheet-label">Occasion</div>
        <div class="mp-fsheet-chips">
          <button class="mp-fsheet-chip${_mpPendingOccasion==='all'?' active':''}" data-action="mp-foccasion" data-occ="all">All</button>
          ${occasions.map(o => `<button class="mp-fsheet-chip${_mpPendingOccasion===o?' active':''}" data-action="mp-foccasion" data-occ="${o}">${occasionLabels[o]}</button>`).join('')}
        </div>
      </div>`;

    const sizeSection = `
      <div class="mp-fsheet-divider"></div>
      <div class="mp-fsheet-section">
        <div class="mp-fsheet-label">Size</div>
        <div class="mp-fsheet-chips">
          <button class="mp-fsheet-chip${_mpPendingSize==='all'?' active':''}" data-action="mp-fsize" data-sz="all">All Sizes</button>
          ${allSheetSizes.map(s => `<button class="mp-fsheet-chip${_mpPendingSize===s?' active':''}" data-action="mp-fsize" data-sz="${s}">${s}</button>`).join('')}
        </div>
      </div>`;

    const materialSection = isCommunity ? `
      <div class="mp-fsheet-divider"></div>
      <div class="mp-fsheet-section">
        <div class="mp-fsheet-label">Material</div>
        <div class="mp-fsheet-chips">
          <button class="mp-fsheet-chip${_mpPendingMaterial==='all'?' active':''}" data-action="mp-fmaterial" data-mat="all">All</button>
          ${materials.map(m => `<button class="mp-fsheet-chip${_mpPendingMaterial===m?' active':''}" data-action="mp-fmaterial" data-mat="${m}">${materialLabels[m]}</button>`).join('')}
        </div>
      </div>` : '';

    if (isCommunity) {
      // Community (pre-loved): Condition, Material, Occasion, Sort, Size, Price, Brand, Color, Closet Match
      return `
        <div class="mp-fsheet-section">
          <div class="mp-fsheet-label">Condition</div>
          <div class="mp-fsheet-chips">
            <button class="mp-fsheet-chip${_mpPendingCondition==='all'?' active':''}" data-action="mp-fcond" data-cond="all">All</button>
            ${conditions.map(c => `<button class="mp-fsheet-chip${_mpPendingCondition===c?' active':''}" data-action="mp-fcond" data-cond="${c}">${condLabels[c]}</button>`).join('')}
          </div>
        </div>
        ${materialSection}
        ${occasionSection}
        <div class="mp-fsheet-divider"></div>
        ${sortSection}
        ${sizeSection}
        ${priceSection}
        ${brandSection}
        ${colorSection}
        <div class="mp-fsheet-divider"></div>
        <div class="mp-fsheet-section">
          <div class="mp-fsheet-label">Closet Match</div>
          <div class="mp-fsheet-chips">
            <button class="mp-fsheet-chip${!_mpPendingCloseMatch?' active':''}" data-action="mp-fclosematch" data-val="false">All Items</button>
            <button class="mp-fsheet-chip${_mpPendingCloseMatch?' active':''}" data-action="mp-fclosematch" data-val="true">${icon('sparkle',12)} 60%+ Match Only</button>
          </div>
        </div>`;
    } else {
      // Shop (retail): Sort, Size, Price, Occasion, Color, Brand
      return `
        ${sortSection}
        ${sizeSection}
        ${priceSection}
        ${occasionSection}
        ${colorSection}
        ${brandSection}`;
    }
  }

  // ---- Store Insight: extensive store analytics sheet ----
  function _buildStoreInsight() {
    const mine = JSON.parse(localStorage.getItem(MP_KEY) || '[]');
    const listings = mine.length;
    if (!listings) {
      return `<div class="ms-empty" style="padding:32px 24px">
        <div class="ms-empty-icon">${icon('barChart',28)}</div>
        <div style="font-size:var(--t-body,14px);font-weight:800;color:var(--fg,#f0ecf5)">No store activity yet</div>
        <div style="font-size:var(--t-caption,12px);color:var(--muted,#8a8498);margin-top:5px">List an item to start seeing insights</div>
      </div>`;
    }
    // ----- shared demo metrics (consistent with rest of file) -----
    const totalValue = mine.reduce((s,i) => s + (Number(i.price)||0), 0);
    const avgPrice = Math.round(totalValue / listings) || 0;
    const soldCount = Math.floor(listings * 0.6) + 2;
    const storeViews = listings * 47 + 83;
    const revenue = Math.round(soldCount * avgPrice);
    const saves = Math.round(storeViews * 0.18);
    const conv = storeViews ? (soldCount / storeViews * 100) : 0;
    const saveRate = storeViews ? (saves / storeViews) : 0;       // saves per view
    const sellThrough = saves ? (soldCount / saves) : 0;          // sales per save

    // ----- age proxy: parse ms-epoch from id, else fall back to array index -----
    const ageDaysOf = (item, idx) => {
      const digits = parseInt(String(item.id || '').replace(/\D/g,''), 10);
      if (digits && digits > 1e12) {
        return Math.floor((Date.now() - digits) / 86400000);
      }
      // index proxy: index 0 = newest (unshifted). compress so older items cross 30d.
      return idx * 12;
    };

    // ----- completeness: 7 fields, image||image_url counts as one -----
    const COMPLETE_FIELDS = ['brand','color','size','material','condition','occasion'];
    const completenessOf = (item) => {
      let filled = 0;
      COMPLETE_FIELDS.forEach(f => { if (item[f] != null && String(item[f]).trim() !== '') filled++; });
      if ((item.image && String(item.image).trim()) || (item.image_url && String(item.image_url).trim())) filled++;
      return filled / 7; // 0..1
    };
    const missingFieldsOf = (item) => {
      const miss = [];
      COMPLETE_FIELDS.forEach(f => { if (item[f] == null || String(item[f]).trim() === '') miss.push(f); });
      if (!((item.image && String(item.image).trim()) || (item.image_url && String(item.image_url).trim()))) miss.push('photo');
      return miss;
    };

    // ====== MODULE 1: stale listings (ageDays > 30) ======
    const staleItems = mine
      .map((it, idx) => ({ it, idx, age: ageDaysOf(it, idx) }))
      .filter(x => x.age > 30)
      .sort((a,b) => b.age - a.age); // oldest first

    // ====== MODULE 2: incomplete listings (<70% complete) ======
    const incompleteItems = mine
      .map((it, idx) => ({ it, idx, score: completenessOf(it) }))
      .filter(x => x.score < 0.70)
      .sort((a,b) => a.score - b.score); // worst first

    // ====== MODULE 3: pricing outliers (per-category median, cats with >=3) ======
    const byCat = {};
    mine.forEach(it => { const c = it.category || 'other'; (byCat[c] = byCat[c] || []).push(it); });
    const median = (arr) => {
      const s = arr.slice().sort((a,b) => a - b);
      const m = Math.floor(s.length / 2);
      return s.length % 2 ? s[m] : (s[m-1] + s[m]) / 2;
    };
    const outliers = [];
    Object.entries(byCat).forEach(([cat, items]) => {
      if (items.length < 3) return;
      const med = median(items.map(i => Number(i.price)||0).filter(p => p > 0));
      if (!med) return;
      items.forEach(it => {
        const p = Number(it.price)||0;
        if (!p) return;
        if (p > med * 1.6 || p < med * 0.5) outliers.push({ it, cat, med: Math.round(med) });
      });
    });

    // ====== MODULE 4: list-next (wardrobe wear_count<=2 not yet listed) ======
    let wardrobe = [];
    try { wardrobe = JSON.parse(localStorage.getItem('awear_wardrobe') || '[]'); } catch(e) { wardrobe = []; }
    const listedNames = new Set(mine.map(i => String(i.name||'').trim().toLowerCase()));
    const listCandidates = wardrobe
      .filter(w => (Number(w.wear_count)||0) <= 2 && !listedNames.has(String(w.name||'').trim().toLowerCase()))
      .sort((a,b) => (Number(a.wear_count)||0) - (Number(b.wear_count)||0));

    // ====== HEALTH SCORE ======
    let score = 100;
    score -= Math.min(staleItems.length * 8, 24);
    score -= Math.min(incompleteItems.length * 6, 24);
    score -= Math.min(outliers.length * 6, 18);
    if (saveRate < 0.15) score -= 10;
    score = Math.max(40, Math.round(score));
    const verdict = score >= 85 ? 'Your store is in great shape'
      : score >= 70 ? 'Healthy — a few quick wins below'
      : score >= 55 ? 'Some easy fixes will lift sales'
      : "Let's tune up your store";

    // ====== build recommendation cards (highest impact first, cap 4) ======
    const recCard = ({ tier, ic, title, action, cta }) => `
      <div class="ms-in-rec ${tier}">
        <div class="ms-in-rec-ic">${icon(ic, 18)}</div>
        <div class="ms-in-rec-body">
          <div class="ms-in-rec-title">${title}</div>
          <div class="ms-in-rec-action">${action}</div>
        </div>
        ${cta || ''}
      </div>`;

    const recs = [];

    if (staleItems.length) {
      const shown = Math.min(staleItems.length, 3);
      recs.push(recCard({
        tier: 'is-warn', ic: 'clock',
        title: `${staleItems.length} listing${staleItems.length>1?'s are':' is'} going quiet`,
        action: 'Older listings drop in search — refresh to get seen again.',
        cta: `<button class="ms-in-rec-cta" id="ms-in-refresh">Refresh</button>`
      }));
    }

    if (incompleteItems.length) {
      const worst = incompleteItems[0];
      const miss = missingFieldsOf(worst.it).slice(0,2).join(', ');
      recs.push(recCard({
        tier: 'is-priority', ic: 'list',
        title: `Add details to ${incompleteItems.length} listing${incompleteItems.length>1?'s':''} to get found`,
        action: `Missing ${esc(miss || 'details')} — buyers filter by these.`,
        cta: ''
      }));
    }

    if (outliers.length) {
      const o = outliers[0];
      const p = Number(o.it.price)||0;
      const dir = p > o.med ? 'high' : 'low';
      recs.push(recCard({
        tier: 'is-warn', ic: 'cash',
        title: `${outliers.length} item${outliers.length>1?'s':''} may be priced off`,
        action: `Your ${esc(o.it.name||'item')} is $${p.toLocaleString()} — similar ${esc(o.cat)} here sell ~$${o.med.toLocaleString()}.`,
        cta: ''
      }));
    }

    if (listCandidates.length) {
      const pick = listCandidates[0];
      recs.push(recCard({
        tier: 'is-suggest', ic: 'sparkle',
        title: `${listCandidates.length} closet item${listCandidates.length>1?'s are':' is'} ready to sell`,
        action: 'Turn unworn pieces into earnings.',
        cta: `<button class="ms-in-rec-cta" onclick="closeStoreInsight();openSellFormWithItem('${attr(JSON.stringify(pick))}')">List</button>`
      }));
    }

    const recHTML = recs.length
      ? recs.slice(0,4).join('')
      : `<div class="ms-in-rec is-suggest">
          <div class="ms-in-rec-ic">${icon('check',18)}</div>
          <div class="ms-in-rec-body">
            <div class="ms-in-rec-title">Nothing needs attention</div>
            <div class="ms-in-rec-action">Your listings are fresh, complete and well priced.</div>
          </div></div>`;

    // ====== conversion funnel ======
    const funnelMax = Math.max(storeViews, 1);
    const funnelBar = (label, n) => `<div class="ms-in-bar-row">
      <div class="ms-in-bar-label">${label}</div>
      <div class="ms-in-bar-track"><div class="ms-in-bar-fill" style="width:${Math.round(n/funnelMax*100)}%"></div></div>
      <div class="ms-in-bar-n">${n.toLocaleString()}</div></div>`;
    const diag = saveRate < 0.15
      ? "Buyers look but don't save — stronger cover photos help."
      : sellThrough < 0.40
      ? "Buyers save but don't buy — try a small price drop."
      : 'Healthy funnel — keep listing.';

    // ====== weekly momentum goal ======
    const goal = Math.max(soldCount + 2, 5);
    const goalPct = Math.min(100, Math.round(soldCount / goal * 100));
    const goalGap = Math.max(0, goal - soldCount);

    // ====== assemble ======
    return `
      <div class="ms-in-health">
        <div class="ms-in-health-score">${score}<span> / 100</span></div>
        <div class="ms-in-health-verdict">${verdict}</div>
        <div class="ms-in-health-sub">${icon('arrowUp',12)} Fixes below raise your score</div>
        <div class="ms-in-snap">
          <div><div class="ms-in-snap-val">$${revenue.toLocaleString()}</div><div class="ms-in-snap-label">Revenue</div></div>
          <div><div class="ms-in-snap-val">${conv.toFixed(1)}%</div><div class="ms-in-snap-label">Conversion</div></div>
          <div><div class="ms-in-snap-val">${saves.toLocaleString()}</div><div class="ms-in-snap-label">Saves</div></div>
        </div>
      </div>
      <div class="ms-in-sec-title" style="padding:0 20px">Do next</div>
      <div class="ms-in-rec-wrap">${recHTML}</div>
      <div class="ms-in-sec" style="margin-top:6px">
        <div class="ms-in-sec-title">Conversion funnel</div>
        ${funnelBar('Views', storeViews)}
        ${funnelBar('Saves', saves)}
        ${funnelBar('Sales', soldCount)}
        <div class="ms-in-diag" style="padding:0">${diag}</div>
      </div>
      <div class="ms-in-sec-title" style="padding:0 20px">This week</div>
      <div class="ms-in-goal">
        <div class="ms-in-goal-top">
          <div class="ms-in-goal-label">Weekly sales goal</div>
          <div class="ms-in-goal-n">${soldCount} / ${goal}</div>
        </div>
        <div class="ms-in-bar-track"><div class="ms-in-bar-fill" style="width:${goalPct}%"></div></div>
        <div class="ms-in-diag" style="padding:8px 0 0">You're ${goalGap} sale${goalGap===1?'':'s'} from your best week.</div>
      </div>
      <div class="ms-in-note">Revenue, views and conversion are estimated from your listings until live sales tracking is connected.</div>
    `;
  }

  // Render sheet body + (re)bind the per-render CTAs (recreated on each innerHTML set)
  function _renderStoreInsight() {
    const scroll = document.getElementById('ms-insight-scroll');
    if (!scroll) return;
    scroll.innerHTML = _buildStoreInsight();
    // Refresh CTA: relist the oldest stale item to the top of the store
    scroll.querySelector('#ms-in-refresh')?.addEventListener('click', () => {
      let mine = [];
      try { mine = JSON.parse(localStorage.getItem(MP_KEY) || '[]'); } catch(e) { mine = []; }
      if (!mine.length) return;
      // recompute oldest stale (same age proxy as _buildStoreInsight)
      const ageDaysOf = (item, idx) => {
        const digits = parseInt(String(item.id || '').replace(/\D/g,''), 10);
        if (digits && digits > 1e12) return Math.floor((Date.now() - digits) / 86400000);
        return idx * 12;
      };
      let oldestIdx = -1, oldestAge = 30;
      mine.forEach((it, idx) => { const a = ageDaysOf(it, idx); if (a > oldestAge) { oldestAge = a; oldestIdx = idx; } });
      if (oldestIdx < 0) return;
      const item = mine.splice(oldestIdx, 1)[0];
      item.id = 'u' + Date.now();
      mine.unshift(item); // back to the top (newest)
      localStorage.setItem(MP_KEY, JSON.stringify(mine));
      _renderStoreInsight(); // re-render + rebind
      showToast('Listing refreshed — back to the top');
    });
  }

  function openStoreInsight() {
    const overlay = document.getElementById('ms-insight-overlay');
    const sheet = document.getElementById('ms-insight-sheet');
    const scroll = document.getElementById('ms-insight-scroll');
    if (!overlay || !sheet || !scroll) return;
    _renderStoreInsight();
    overlay.classList.add('show');
    sheet.classList.add('show');
    overlay.setAttribute('aria-hidden','false');
    if (!overlay._bound) {
      overlay.addEventListener('click', closeStoreInsight);
      document.getElementById('ms-insight-close')?.addEventListener('click', closeStoreInsight);
      const scroll = document.getElementById('ms-insight-scroll');
      _addSheetDragDismiss(sheet, scroll, closeStoreInsight);
      overlay._bound = true;
    }
  }

  function closeStoreInsight() {
    const overlay = document.getElementById('ms-insight-overlay');
    const sheet = document.getElementById('ms-insight-sheet');
    if (overlay) { overlay.classList.remove('show'); overlay.setAttribute('aria-hidden','true'); }
    if (sheet) sheet.classList.remove('show');
  }

  // Shared pull-to-dismiss for bottom sheets — copy of buy-sheet pattern (see buy-sheet block).
  // sheetEl: the sliding panel; scrollEl: the inner scroller (null if none); closeFn: called on dismiss.
  function _addSheetDragDismiss(sheetEl, scrollEl, closeFn) {
    let sy = null, dragging = false;
    const start = (y, target) => {
      if (target && target.closest && target.closest('button,a,input,select,textarea')) { sy = null; return; }
      if (scrollEl && scrollEl.scrollTop > 0) { sy = null; return; }
      sy = y; dragging = false;
    };
    const move = (y, ev) => {
      if (sy === null) return;
      const dy = y - sy;
      if (dy > 4 && (!scrollEl || scrollEl.scrollTop <= 0)) {
        dragging = true;
        sheetEl.style.transition = 'none';
        sheetEl.style.transform = `translateY(${Math.max(0, dy)}px)`;
        if (ev && ev.cancelable) { try { ev.preventDefault(); } catch (_) {} }
      }
    };
    const end = (y) => {
      if (sy === null) return;
      const dy = (y || 0) - sy; sy = null;
      sheetEl.style.transition = '';
      sheetEl.style.transform = '';
      if (dragging && dy > 90) closeFn();
      dragging = false;
    };
    sheetEl.addEventListener('pointerdown',   e => start(e.clientY, e.target));
    sheetEl.addEventListener('pointermove',   e => move(e.clientY, e), { passive: false });
    sheetEl.addEventListener('pointerup',     e => end(e.clientY));
    sheetEl.addEventListener('pointercancel', () => end(null));
    sheetEl.addEventListener('touchstart', e => start(e.touches[0].clientY, e.target), { passive: true });
    sheetEl.addEventListener('touchmove',  e => move(e.touches[0].clientY, e),          { passive: false });
    sheetEl.addEventListener('touchend',   e => end((e.changedTouches[0] || {}).clientY));
  }

  function openMPFilterSheet() {
    // Sync pending state from current active state
    _mpPendingSort = mpSortBy;
    _mpPendingColor = mpColorFilter;
    _mpPendingBrand = mpBrandFilter;
    _mpPendingCondition = mpConditionFilter;
    _mpPendingPriceMin = mpPriceMin;
    _mpPendingPriceMax = mpPriceMax;
    _mpPendingCloseMatch = mpCloseMatchOnly;
    _mpPendingOccasion = mpOccasionFilter;
    _mpPendingMaterial = mpMaterialFilter;
    _mpPendingSize = mpSizeFilter;

    const overlay = document.getElementById('mp-fsheet-overlay');
    const sheet = document.getElementById('mp-fsheet');
    const scroll = document.getElementById('mp-fsheet-scroll');
    if (!overlay || !sheet || !scroll) return;
    scroll.innerHTML = _buildFilterSheetContent();
    overlay.classList.add('show');
    sheet.classList.add('show');
    overlay.setAttribute('aria-hidden','false');
    _bindFilterSheetEvents(sheet, scroll);
  }

  function closeMPFilterSheet() {
    const overlay = document.getElementById('mp-fsheet-overlay');
    const sheet = document.getElementById('mp-fsheet');
    if (!overlay || !sheet) return;
    overlay.classList.remove('show');
    sheet.classList.remove('show');
    overlay.setAttribute('aria-hidden','true');
  }

  function _bindFilterSheetEvents(sheet, scroll) {
    // Sort pick
    scroll.querySelectorAll('[data-action="mp-sort-pick"]').forEach(el => el.addEventListener('click', () => {
      _mpPendingSort = el.dataset.sort;
      scroll.innerHTML = _buildFilterSheetContent();
      _bindFilterSheetEvents(sheet, scroll);
    }));
    // Color pick
    scroll.querySelectorAll('[data-action="mp-fcolor"]').forEach(el => el.addEventListener('click', () => {
      _mpPendingColor = el.dataset.color;
      scroll.innerHTML = _buildFilterSheetContent();
      _bindFilterSheetEvents(sheet, scroll);
    }));
    // Condition pick
    scroll.querySelectorAll('[data-action="mp-fcond"]').forEach(el => el.addEventListener('click', () => {
      _mpPendingCondition = el.dataset.cond;
      scroll.innerHTML = _buildFilterSheetContent();
      _bindFilterSheetEvents(sheet, scroll);
    }));
    // Brand pick
    scroll.querySelectorAll('[data-action="mp-fbrand"]').forEach(el => el.addEventListener('click', () => {
      _mpPendingBrand = el.dataset.brand;
      scroll.innerHTML = _buildFilterSheetContent();
      _bindFilterSheetEvents(sheet, scroll);
    }));
    // Close match toggle
    scroll.querySelectorAll('[data-action="mp-fclosematch"]').forEach(el => el.addEventListener('click', () => {
      _mpPendingCloseMatch = el.dataset.val === 'true';
      scroll.innerHTML = _buildFilterSheetContent();
      _bindFilterSheetEvents(sheet, scroll);
    }));
    // Occasion pick
    scroll.querySelectorAll('[data-action="mp-foccasion"]').forEach(el => el.addEventListener('click', () => {
      _mpPendingOccasion = el.dataset.occ;
      scroll.innerHTML = _buildFilterSheetContent();
      _bindFilterSheetEvents(sheet, scroll);
    }));
    // Material pick
    scroll.querySelectorAll('[data-action="mp-fmaterial"]').forEach(el => el.addEventListener('click', () => {
      _mpPendingMaterial = el.dataset.mat;
      scroll.innerHTML = _buildFilterSheetContent();
      _bindFilterSheetEvents(sheet, scroll);
    }));
    // Size pick
    scroll.querySelectorAll('[data-action="mp-fsize"]').forEach(el => el.addEventListener('click', () => {
      _mpPendingSize = el.dataset.sz || 'all';
      scroll.innerHTML = _buildFilterSheetContent();
      _bindFilterSheetEvents(sheet, scroll);
    }));
  }

  function applyMPFilters() {
    const minVal = parseInt(document.getElementById('mp-price-min')?.value || '0', 10);
    const maxVal = parseInt(document.getElementById('mp-price-max')?.value || '9999', 10);
    mpSortBy = _mpPendingSort;
    mpColorFilter = _mpPendingColor;
    mpBrandFilter = _mpPendingBrand;
    mpConditionFilter = _mpPendingCondition;
    mpPriceMin = isNaN(minVal) ? 0 : minVal;
    mpPriceMax = isNaN(maxVal) || maxVal === 0 ? 9999 : maxVal;
    mpCloseMatchOnly = _mpPendingCloseMatch;
    mpOccasionFilter = _mpPendingOccasion;
    mpMaterialFilter = _mpPendingMaterial;
    mpSizeFilter = _mpPendingSize;
    localStorage.setItem('awear_mp_size', mpSizeFilter);
    closeMPFilterSheet();
    renderMarketplace();
  }

  function resetMPFilters() {
    mpSortBy = 'default'; mpColorFilter = 'all'; mpBrandFilter = 'all';
    mpConditionFilter = 'all'; mpPriceMin = 0; mpPriceMax = 9999; mpCloseMatchOnly = false;
    mpOccasionFilter = 'all'; mpMaterialFilter = 'all';
    _mpPendingSort = 'default'; _mpPendingColor = 'all'; _mpPendingBrand = 'all';
    _mpPendingCondition = 'all'; _mpPendingPriceMin = 0; _mpPendingPriceMax = 9999;
    _mpPendingCloseMatch = false; _mpPendingOccasion = 'all'; _mpPendingMaterial = 'all'; _mpPendingSize = 'all';
    mpSizeFilter = 'all'; localStorage.setItem('awear_mp_size', 'all');
    closeMPFilterSheet();
    renderMarketplace();
  }

  // Initialise filter sheet overlay/button bindings (called once at init time)
  function initMPFilterSheet() {
    const overlay = document.getElementById('mp-fsheet-overlay');
    const applyBtn = document.getElementById('mp-fsheet-apply');
    const resetBtn = document.getElementById('mp-fsheet-reset');
    const closeBtn = document.getElementById('mp-fsheet-close');
    const sheet    = document.getElementById('mp-fsheet');
    const scroll   = document.getElementById('mp-fsheet-scroll');
    if (overlay)  overlay.addEventListener('click', closeMPFilterSheet);
    if (applyBtn) applyBtn.addEventListener('click', applyMPFilters);
    if (resetBtn) resetBtn.addEventListener('click', resetMPFilters);
    if (closeBtn) closeBtn.addEventListener('click', closeMPFilterSheet);
    if (sheet)    _addSheetDragDismiss(sheet, scroll, closeMPFilterSheet);
  }

  async function runMPAssist() {
    const q = document.getElementById('mp-assist-input')?.value?.trim();
    if (!q) return;
    mpAssistQuery = q;
    mpAssistMsg = 'Searching…';
    mpAssistIds = null;
    renderMarketplace();

    const wardrobe = JSON.parse(localStorage.getItem('awear_wardrobe') || '[]');
    const items = loadMPListings();

    try {
      const res = await fetch('/api/marketplace/assist', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ query: q, wardrobe: wardrobe.slice(0,10), items })
      });
      const data = await res.json();
      mpAssistIds = (data.matches || []).filter(m => m.score > 30).map(m => m.id);
      mpAssistMsg = data.message || `Found ${mpAssistIds.length} items for you`;
    } catch {
      // client-side fallback
      const kw = q.toLowerCase();
      mpAssistIds = items.filter(i =>
        (i.style_tags||[]).some(t => kw.includes(t)) ||
        kw.includes(i.category||'') ||
        (i.name||'').toLowerCase().split(' ').some(w => kw.includes(w))
      ).map(i => i.id);
      mpAssistMsg = `Found ${mpAssistIds.length} items matching your request`;
    }
    renderMarketplace();
  }

  function renderMySells() {
    const profile = loadProfile();
    const mine = JSON.parse(localStorage.getItem(MP_KEY) || '[]');
    const wardrobe = JSON.parse(localStorage.getItem('awear_wardrobe') || '[]');

    const storeName = profile.name || 'My Store';
    const initials = storeName.split(' ').filter(Boolean).slice(0,2).map(w=>w[0]).join('').toUpperCase() || 'MS';
    const totalValue = mine.reduce((s,i) => s + (Number(i.price)||0), 0);
    const soldCount = mine.length > 0 ? Math.floor(mine.length * 0.6) + 2 : 0;
    const storeViews = mine.length > 0 ? mine.length * 47 + 83 : 0;
    const avgPrice = mine.length ? Math.round(totalValue / mine.length) : 0;
    const profit = Math.round(soldCount * avgPrice);
    // Compact money for the narrow stat tiles so 5-digit values never clip ($12,400 → $12.4k)
    const fmtMoney = n => n >= 10000 ? '$' + (n/1000).toFixed(n >= 100000 ? 0 : 1).replace(/\.0$/,'') + 'k' : '$' + n.toLocaleString();
    // Store avatar: dedicated store pic if set, else the user's profile photo, else initials
    const storePhoto = ls.load('awear_store_avatar') || profile.photo || null;
    // Cyclical viewers stat — tap to switch window
    const viewWindows = {
      today: { v: Math.round(storeViews * 0.06), l: 'Today' },
      month: { v: Math.round(storeViews * 0.42), l: '30d' },
      all:   { v: storeViews,                    l: 'All-time' },
    };
    const vw = viewWindows[msViewMode] || viewWindows.today;

    const listedIds = new Set(mine.map(i => i.id));
    const suggestions = wardrobe
      .filter(i => !listedIds.has(i.id) && !(i.wear_count > 0))
      .slice(0, 3);

    // Filter & sort applies to MY listings (stats above stay on the full store)
    const msActiveCount = [
      mpCategoryFilter !== 'all', mpColorFilter !== 'all', mpBrandFilter !== 'all',
      mpConditionFilter !== 'all', mpOccasionFilter !== 'all', mpMaterialFilter !== 'all',
      mpSizeFilter !== 'all', mpPriceMin > 0, mpPriceMax < 9999, mpSortBy !== 'default'
    ].filter(Boolean).length;
    let shown = mine;
    if (mpCategoryFilter !== 'all') shown = shown.filter(i => i.category === mpCategoryFilter);
    if (mpColorFilter !== 'all') shown = shown.filter(i => (i.color||'').toLowerCase().includes(mpColorFilter));
    if (mpBrandFilter !== 'all') shown = shown.filter(i => i.brand === mpBrandFilter);
    if (mpConditionFilter !== 'all') shown = shown.filter(i => (i.condition||'').toLowerCase() === mpConditionFilter);
    if (mpOccasionFilter !== 'all') shown = shown.filter(i => (i.occasion||'') === mpOccasionFilter);
    if (mpMaterialFilter !== 'all') shown = shown.filter(i => (i.material||'') === mpMaterialFilter);
    if (mpSizeFilter !== 'all') shown = shown.filter(i => !i.size || i.size === mpSizeFilter);
    shown = shown.filter(i => { const p = Number(i.price)||0; return p >= mpPriceMin && p <= mpPriceMax; });
    if (mpSortBy === 'price-asc') shown = [...shown].sort((a,b) => (Number(a.price)||0) - (Number(b.price)||0));
    else if (mpSortBy === 'price-desc') shown = [...shown].sort((a,b) => (Number(b.price)||0) - (Number(a.price)||0));
    else if (mpSortBy === 'newest') shown = [...shown].sort((a,b) => (b.id > a.id ? 1 : -1));

    return `
      <div class="ms-head">
        <div class="ms-head-row">
          <div class="ms-statstrip">
            <div class="ms-sx"><div class="ms-sx-val">${mine.length}</div><div class="ms-sx-label">Listed</div></div>
            <div class="ms-sx"><div class="ms-sx-val">${soldCount}</div><div class="ms-sx-label">Sold</div></div>
            <div class="ms-sx"><div class="ms-sx-val">${fmtMoney(avgPrice)}</div><div class="ms-sx-label">Avg</div></div>
            <div class="ms-sx ms-sx-profit"><div class="ms-sx-val">${fmtMoney(profit)}</div><div class="ms-sx-label">Profit</div></div>
            <button class="ms-sx ms-sx-btn" id="ms-views-btn" aria-label="Views — tap to cycle today, 30 days, all-time">
              <div class="ms-sx-val">${vw.v.toLocaleString()}</div>
              <div class="ms-sx-label">${icon('refresh',9)} ${vw.l}</div>
            </button>
          </div>
          <div class="ms-store-pic-wrap">
            ${storePhoto
              ? `<img class="ms-store-pic" src="${attr(storePhoto)}" alt="${attr(storeName)}" data-name="${attr(storeName)}" style="width:64px;height:64px" onerror="this.onerror=null;avatarFallback(this)">`
              : `<div class="ms-store-pic ms-store-pic-initials">${esc(initials)}</div>`}
          </div>
        </div>
      </div>

      <div class="ms-actions">
        <button class="ms-act-btn" id="ms-insight-btn">${icon('barChart',14)} Insight</button>
        <button class="ms-act-btn" id="ms-filter-btn">${icon('filter',14)} Filter &amp; sort</button>
        <button class="ms-act-btn" id="ms-list-btn">${icon('tag',14)} List an item</button>
      </div>

      ${mine.length === 0 ? `
        <div class="ms-empty">
          <div class="ms-empty-icon">${icon('storefront',28)}</div>
          <div style="font-size:var(--t-body,14px);font-weight:800;color:var(--fg,#f0ecf5)">Your store is ready</div>
          <div style="font-size:var(--t-caption,12px);color:var(--muted,#8a8498);margin-top:5px">List your first item and start earning</div>
        </div>
      ` : `
        <div class="ms-section-hd">
          <div class="ms-section-title">Active Listings <span style="color:var(--muted,#8a8498);font-weight:600">${msActiveCount ? `${shown.length} of ${mine.length}` : mine.length}</span></div>
          ${msActiveCount
            ? `<button class="ms-clear-filters" id="ms-clear-filters">Show all</button>`
            : `<div class="ms-section-sub">Visible in marketplace</div>`}
        </div>
        ${shown.length ? `
        <div class="mp-grid" style="margin-bottom:8px">${shown.map(item => `
          <div class="mp-item" style="position:relative">
            <div class="mp-item-img">${productImage(item)}
              <span class="ms-live-badge">Live</span>
            </div>
            <div class="mp-item-info">
              <div class="mp-item-name">${esc(item.name)}</div>
              <div class="mp-item-price">$${item.price}</div>
              <div style="margin-top:6px">
                <button class="mp-delete-btn" data-id="${item.id}" style="width:100%;background:color-mix(in srgb,var(--danger,#e05252) 10%,transparent);border:1px solid color-mix(in srgb,var(--danger,#e05252) 25%,transparent);border-radius:var(--r-sm,10px);min-height:32px;font-size:var(--t-micro,11px);font-weight:700;color:var(--danger,#e05252);cursor:pointer;font-family:inherit">Remove</button>
              </div>
            </div>
          </div>`).join('')}</div>
        ` : `
        <div class="ms-empty" style="padding:24px 20px 8px">
          <div style="font-size:var(--t-small,13px);font-weight:800;color:var(--fg,#f0ecf5)">No items match these filters</div>
          <div style="font-size:var(--t-caption,12px);color:var(--muted,#8a8498);margin-top:5px">Adjust Filter &amp; sort or clear it</div>
        </div>
        `}
      `}

      ${suggestions.length ? `
        <div style="padding:${mine.length ? '6px' : '0'} 16px 8px">
          <div class="ms-suggest-hd">
            ${icon('sparkle',14)} Unworn in your closet
            <span class="ms-suggest-sub">Worth selling?</span>
          </div>
          ${suggestions.map(item => `
            <div class="ms-suggest-card mp-suggest-card" data-item='${attr(JSON.stringify(item))}'>
              <div class="ms-suggest-img">${productImage(item)}</div>
              <div style="flex:1;min-width:0">
                <div style="font-size:var(--t-small,13px);font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(item.name||'Item')}</div>
                <div style="font-size:var(--t-micro,11px);color:var(--muted,#8a8498);margin-top:2px">Suggested: $${Math.round((item.price_estimate_usd||120)*0.5)}</div>
              </div>
              <div class="ms-suggest-sell">+ Sell</div>
            </div>`).join('')}
        </div>
      ` : ''}
    `;
  }

  function deleteMySell(id) {
    const mine = JSON.parse(localStorage.getItem(MP_KEY) || '[]');
    const updated = mine.filter(i => i.id !== id);
    localStorage.setItem(MP_KEY, JSON.stringify(updated));
    renderMarketplace();
    showToast('Item removed from sale');
  }

  function openDeadZoneListSheet() {
    const items = _deadZoneItems;
    if (!items.length) { mpTab='sell'; showView('marketplace'); return; }
    const modal = document.getElementById('purchase-modal');
    const card  = document.getElementById('modal-card');
    const totalEarn = Math.round(items.reduce((s,i) => s + (i.price_estimate_usd||0) * 0.5, 0));
    card.innerHTML = `
      <div style="padding:18px 20px 6px;display:flex;align-items:center;justify-content:space-between">
        <span style="font-size:var(--t-lead,17px);font-weight:900;display:flex;align-items:center;gap:8px">${icon('tag',18)} List in My Store</span>
        <button style="background:none;border:none;color:var(--muted,#8a8498);cursor:pointer;padding:4px;display:flex" onclick="document.getElementById('purchase-modal').classList.remove('show')">${icon('x',18)}</button>
      </div>
      <div style="padding:0 20px 14px;font-size:var(--t-small,13px);color:var(--muted,#8a8498)">
        ${items.length} item${items.length!==1?'s':''} barely worn — sell all and earn <strong style="color:var(--success,#52c97a)">~$${totalEarn}</strong>
      </div>
      <div style="border-top:1px solid var(--line,#2e2836)">
        ${items.map((it,i) => {
          const earn = Math.round((it.price_estimate_usd||0) * 0.5);
          return `<div style="display:flex;align-items:center;gap:12px;padding:12px 20px;border-bottom:1px solid var(--line,#2e2836)">
            <div style="width:52px;height:52px;border-radius:var(--r-sm,10px);overflow:hidden;flex-shrink:0;background:var(--card,#1e1a22)">${productImage(it)}</div>
            <div style="flex:1;min-width:0">
              <div style="font-size:var(--t-body,14px);font-weight:700;color:var(--fg,#f0ecf5);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(it.name)}</div>
              <div style="font-size:var(--t-caption,12px);color:var(--muted,#8a8498);margin-top:2px">${earn>0?`~$${earn} · 50% of retail`:'Ready to list'}</div>
            </div>
            <button class="dz-list-btn" data-dz-idx="${i}" style="min-height:44px;padding:0 16px;background:var(--accent,#e8526a);border:none;border-radius:var(--r-pill,999px);font-family:inherit;font-size:var(--t-caption,12px);font-weight:800;color:#fff;cursor:pointer;flex-shrink:0;white-space:nowrap">List</button>
          </div>`;
        }).join('')}
      </div>
      <div style="padding:16px 20px 20px">
        <button id="dz-list-first-btn" style="width:100%;min-height:44px;display:inline-flex;align-items:center;justify-content:center;gap:8px;background:linear-gradient(135deg,var(--accent,#e8526a),var(--accent2,#c4855a));border:none;border-radius:var(--r-md,14px);font-family:inherit;font-size:var(--t-body,14px);font-weight:800;color:#fff;cursor:pointer">
          ${icon('tag',16)} Start listing · earn ~$${totalEarn}
        </button>
      </div>`;
    modal.classList.add('show');
    card.querySelectorAll('.dz-list-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = +btn.dataset.dzIdx;
        modal.classList.remove('show');
        openSellForm(_deadZoneItems[idx]);
      });
    });
    document.getElementById('dz-list-first-btn')?.addEventListener('click', () => {
      modal.classList.remove('show');
      openSellForm(_deadZoneItems[0]);
    });
  }

  function openSellFormWithItem(jsonStr) {
    const item = JSON.parse(jsonStr);
    openSellForm(item);
  }

  function openSellForm(prefill) {
    const modal = document.getElementById('purchase-modal');
    const card  = document.getElementById('modal-card');
    const prefillName = prefill ? (prefill.name || '') : '';
    const prefillPrice = prefill ? Math.round((prefill.price_estimate_usd || 200) * 0.5) : '';
    const prefillCat = prefill ? (prefill.category || 'other') : 'other';

    card.innerHTML = `
      <div style="padding:18px 20px 6px;font-size: var(--t-lead,17px);font-weight:900;display:flex;align-items:center;gap:8px">${icon('tag',18)} Sell an item</div>
      <div class="mp-sell-form">
        ${prefill ? `<div style="display:flex;align-items:center;gap:10px;background:rgba(139,92,246,.1);border-radius:12px;padding:10px 14px;margin-bottom:4px">
          <div style="color:var(--accent2)">${icon(catIcon(prefillCat), 28)}</div>
          <div style="font-size:12px;font-weight:700;color:var(--accent);display:flex;align-items:center;gap:4px">${icon('check',12)} Pre-filled from your closet</div>
        </div>` : ''}
        <div>
          <div class="mp-form-label">Item name</div>
          <input class="mp-form-input" id="sf-name" placeholder='e.g. Blue Zara jeans' value="${attr(prefillName)}" />
        </div>
        <div>
          <div class="mp-form-label">Category</div>
          <select class="mp-form-input" id="sf-cat">
            ${[['top','Tops'],['bottoms','Bottoms'],['shoes','Shoes'],['bag','Bags'],['outerwear','Outerwear'],['dress','Dresses'],['hat','Hats'],['other','Other']].map(([k,v]) => `<option value="${k}" ${k===prefillCat?'selected':''}>${v}</option>`).join('')}
          </select>
        </div>
        <div class="mp-price-row">
          <div style="flex:1">
            <div class="mp-form-label">Price ($)</div>
            <input class="mp-form-input" id="sf-price" type="number" placeholder="150" value="${prefillPrice}" />
          </div>
          <button class="mp-ai-price" id="sf-ai-price">AI pricing</button>
        </div>
        <div>
          <div class="mp-form-label">Condition</div>
          <select class="mp-form-input" id="sf-condition">
            <option value="new">New</option>
            <option value="like-new" selected>Like new</option>
            <option value="used">Used</option>
          </select>
        </div>
        <div style="display:flex;gap:8px">
          <button class="ha-btn ha-primary" style="flex:1" id="sf-submit">${icon('tag',16)} List for sale</button>
          <button class="ha-btn ha-secondary" style="flex:1" onclick="document.getElementById('purchase-modal').classList.remove('show')">Cancel</button>
        </div>
      </div>`;
    modal.classList.add('show');

    document.getElementById('sf-ai-price').addEventListener('click', () => {
      const name = document.getElementById('sf-name').value;
      if (!name) { showToast('Enter an item name first'); return; }
      const wardrobe = JSON.parse(localStorage.getItem('awear_wardrobe') || '[]');
      const match = wardrobe.find(i => i.name && name && i.name.includes(name.slice(0,4)));
      const suggested = match ? Math.round((match.price_estimate_usd || 200) * 0.5) : 150;
      document.getElementById('sf-price').value = suggested;
      showToast(`AI suggests $${suggested} — 50% of retail price`);
    });

    document.getElementById('sf-submit').addEventListener('click', () => {
      const name = document.getElementById('sf-name').value.trim();
      const price = Number(document.getElementById('sf-price').value) || 150;
      const condition = document.getElementById('sf-condition').value;
      const cat = document.getElementById('sf-cat').value;
      if (!name) { showToast('Item name is missing'); return; }
      const mine = JSON.parse(localStorage.getItem(MP_KEY) || '[]');
      mine.unshift({id:'u'+Date.now(), name, price, condition, category: cat, seller:'@me', orig: price*2, style_tags: prefill?.style_tags || []});
      localStorage.setItem(MP_KEY, JSON.stringify(mine));
      addListing({ name, price, category: cat });
      modal.classList.remove('show');
      logAdminEvent('sell', 'Listed: ' + name + ' $' + price);
      addRewardPoints(25, 'sell_listing');
      mpTab = 'sell';
      showView('marketplace');
      showToast('Listed in My Store! +25 points');
    });
  }

  // ---- Public Closets ----
  const SEED_USERS = [
    {id:'u1', name:'Tamar', handle:'@tamar', avatar:'/static/img/users/tamar/avatar.jpg', vibe:'Effortless Cool', items:42, following:true},
    {id:'u2', name:'Carmel', handle:'@carmel', avatar:'/static/img/users/carmel/avatar.jpg', vibe:'Street Casual', items:28, following:true},
    {id:'u3', name:'Maayan', handle:'@maayan', avatar:'/static/img/users/maayan/avatar.jpg', vibe:'Clean Minimal', items:19, following:true},
    {id:'u4', name:'Dana Katz', handle:'@danakatz', avatar:'https://randomuser.me/api/portraits/women/4.jpg', vibe:'Boho Chic', items:35, following:false},
    {id:'u5', name:'Roni Gold', handle:'@ronigold', avatar:'https://randomuser.me/api/portraits/women/5.jpg', vibe:'Sport Luxe', items:22, following:false},
    {id:'u6', name:'Lior Sade', handle:'@liorsade', avatar:'https://randomuser.me/api/portraits/women/6.jpg', vibe:'Vintage', items:51, following:false},
  ];
  const _defaultFollows={};
  SEED_USERS.forEach(u=>{if(u.following)_defaultFollows[u.id]=true;});
  let followState=Object.assign({},_defaultFollows,JSON.parse(localStorage.getItem('awear_follows')||'{}'));

  // ---- Blocking (Shira) ----
  // Same persistence pattern as followState: a plain object keyed by a
  // user-identifying string, mirrored to localStorage on every change.
  // This app has no real backend session model, so "blocking" is a local
  // client-side filter on what's shown to the current device's user — not
  // a server-side relationship. Two disjoint demo identities exist in this
  // file (public-closet directory users like "u1"/"@noalevi" vs feed-post
  // authors like "noa.styles") with no shared key between them, so block
  // entries are keyed generically by whatever handle/id identifies the
  // person on the surface the block was triggered from, and store a
  // display label so the management list can render something readable
  // regardless of which surface it came from.
  const BLOCKED_KEY = 'awear_blocked';
  let blockedUsers = JSON.parse(localStorage.getItem(BLOCKED_KEY) || '{}');

  function isBlocked(key) { return !!blockedUsers[key]; }

  function setBlocked(key, label, blocked) {
    if (blocked) {
      blockedUsers[key] = { label: label || key, ts: Date.now() };
    } else {
      delete blockedUsers[key];
    }
    localStorage.setItem(BLOCKED_KEY, JSON.stringify(blockedUsers));
  }

  // Shared confirm sheet for blocking — reuses the .book-overlay/.book-sheet
  // pattern already used for the stylist booking modal, so it matches the
  // app's existing lightweight-modal convention instead of introducing a new one.
  function confirmBlockUser(key, label, onDone) {
    const existing = document.getElementById('block-overlay-el');
    if (existing) existing.remove();
    const already = isBlocked(key);
    const overlay = document.createElement('div');
    overlay.id = 'block-overlay-el';
    overlay.className = 'book-overlay';
    overlay.innerHTML = `
      <div class="book-sheet">
        <div class="book-title" style="display:flex;align-items:center;gap:8px">${icon('blockUser',20)} ${already ? 'Unblock' : 'Block'} ${esc(label)}?</div>
        <div style="font-size:var(--t-small);color:var(--muted);font-weight:600;line-height:1.5;margin-bottom:16px">
          ${already
            ? 'Their looks will appear in your feed again.'
            : "You won't see any more looks or content from this user in your feed, and they'll be moved to the blocked list in Public Closets."}
        </div>
        <button class="book-submit" style="background:${already ? 'linear-gradient(135deg,var(--accent),var(--accent2))' : 'var(--danger)'}">${already ? 'Unblock' : 'Block user'}</button>
        <button class="book-cancel">Cancel</button>
      </div>`;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
    overlay.querySelector('.book-cancel').addEventListener('click', () => overlay.remove());
    overlay.querySelector('.book-submit').addEventListener('click', () => {
      const nowBlocked = !already;
      setBlocked(key, label, nowBlocked);
      logAdminEvent(nowBlocked ? 'block_user' : 'unblock_user', `${nowBlocked ? 'Blocked' : 'Unblocked'}: ${label} (${key})`);
      showToast(nowBlocked ? `Blocked: ${label}` : `Unblocked ${label}`);
      overlay.remove();
      if (onDone) onDone(nowBlocked);
    });
  }

  // Profile (...) menu — Report is the primary action; Block is intentionally demoted
  // (secondary, muted, below Report) per Carmel/Razi: blocking should not be one tap away.
  function openUserMoreMenu(key, label, onDone) {
    const existing = document.getElementById('user-more-overlay-el');
    if (existing) existing.remove();
    const overlay = document.createElement('div');
    overlay.id = 'user-more-overlay-el';
    overlay.className = 'book-overlay';
    overlay.innerHTML = `
      <div class="book-sheet">
        <div class="book-title" style="display:flex;align-items:center;gap:8px">${icon('flag',20)} ${esc(label)}</div>
        <button class="book-submit" id="um-report" style="background:var(--card,#1e1a22);border:1px solid var(--line,#2e2836);color:var(--fg,#f0ecf5)">${icon('flag',16)} Report user</button>
        <button class="book-cancel" id="um-block" style="color:var(--muted,#8a8498);font-size:var(--t-small,13px)">Block user</button>
        <button class="book-cancel" id="um-cancel">Cancel</button>
      </div>`;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
    overlay.querySelector('#um-cancel').addEventListener('click', () => overlay.remove());
    overlay.querySelector('#um-report').addEventListener('click', () => { overlay.remove(); reportContent('user', key, label); });
    overlay.querySelector('#um-block').addEventListener('click', () => { overlay.remove(); confirmBlockUser(key, label, onDone); });
  }

  function renderPublicClosets() {
    const el = document.getElementById('pc-wrap');
    const visibleUsers = SEED_USERS.filter(u => !isBlocked(u.id));
    const blockedEntries = Object.entries(blockedUsers);
    el.innerHTML = `
      <div class="pc-header">${icon('users',18)} Public Closets</div>
      <div class="pc-section-label">Featured</div>
      <div class="pc-featured-row">
        ${visibleUsers.slice(0,4).map(u => `
          <div class="pc-featured-card" data-uid="${u.id}">
            <div class="pc-feat-cover"><img src="${u.avatar}" alt="${esc(u.name)}" data-name="${attr(u.name)}" style="width:64px;height:64px;border-radius:50%;object-fit:cover;border:2px solid rgba(255,255,255,.12);" onerror="this.onerror=null;avatarFallback(this)"></div>
            <div class="pc-feat-info">
              <div class="pc-feat-name">${esc(u.name)}</div>
              <div class="pc-feat-handle">${esc(u.handle)}</div>
              <div class="pc-feat-items">${u.items} items</div>
            </div>
          </div>`).join('')}
      </div>
      <div class="pc-section-label">Everyone</div>
      <div class="pc-list">
        ${visibleUsers.map(u => {
          const isFollowing = followState[u.id] ?? u.following;
          return `<div class="pc-row">
            <div class="pc-avatar"><img src="${u.avatar}" alt="${esc(u.name)}" data-name="${attr(u.name)}" style="width:48px;height:48px;border-radius:50%;object-fit:cover;display:block;" onerror="this.onerror=null;avatarFallback(this)"></div>
            <div class="pc-info">
              <div class="pc-name">${esc(u.name)}</div>
              <div class="pc-handle">${esc(u.handle)} · ${u.items} items</div>
              <div class="pc-tag">${esc(u.vibe)}</div>
            </div>
            <button class="pc-follow-btn${isFollowing?' following':''}" data-uid="${u.id}">${isFollowing?'Following':'+ Follow'}</button>
            <button class="pc-more-btn" data-more-uid="${u.id}" data-more-label="${attr(u.name)}" aria-label="More options">${icon('more',18)}</button>
          </div>`;
        }).join('')}
      </div>
      <div class="pc-section-label">Blocked users</div>
      <div class="pc-list pc-blocked-list">
        ${blockedEntries.length ? blockedEntries.map(([key, b]) => `
          <div class="pc-row pc-row-blocked">
            <div class="pc-avatar" style="opacity:.45">${icon('blockUser',20)}</div>
            <div class="pc-info">
              <div class="pc-name">${esc(b.label)}</div>
              <div class="pc-tag" style="color:var(--danger)">Blocked — hidden from feed</div>
            </div>
            <button class="pc-follow-btn following" data-unblock-key="${attr(key)}" data-unblock-label="${attr(b.label)}">Unblock</button>
          </div>`).join('') : `<div style="color:var(--muted);font-size:var(--t-small);padding:8px 16px 4px">No blocked users</div>`}
      </div>`;

    el.querySelectorAll('.pc-follow-btn[data-uid]').forEach(btn => {
      btn.addEventListener('click', () => {
        const uid = btn.dataset.uid;
        followState[uid] = !followState[uid];
        localStorage.setItem('awear_follows', JSON.stringify(followState));
        btn.textContent = followState[uid] ? 'Following' : '+ Follow';
        btn.classList.toggle('following', !!followState[uid]);
        showToast(followState[uid] ? 'Now following' : 'Unfollowed');
      });
    });

    el.querySelectorAll('.pc-more-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const uid = btn.dataset.moreUid, label = btn.dataset.moreLabel;
        confirmBlockUser(uid, label, () => renderPublicClosets());
      });
    });

    el.querySelectorAll('[data-unblock-key]').forEach(btn => {
      btn.addEventListener('click', () => {
        confirmBlockUser(btn.dataset.unblockKey, btn.dataset.unblockLabel, () => { renderPublicClosets(); renderFeed(); });
      });
    });

    el.querySelectorAll('.pc-featured-card[data-uid]').forEach(card => {
      card.addEventListener('click', () => openUserProfile(card.dataset.uid));
    });

    el.querySelectorAll('.pc-row').forEach(row => {
      row.addEventListener('click', e => {
        if (e.target.closest('button')) return;
        const uid = row.querySelector('[data-uid]')?.dataset.uid || row.querySelector('[data-more-uid]')?.dataset.moreUid;
        if (uid) openUserProfile(uid);
      });
    });
  }

  // ---- Seasonal Report ----
  function renderSeasonalReport() {
    const wardrobe = JSON.parse(localStorage.getItem('awear_wardrobe') || '[]');
    const el = document.getElementById('sr-wrap');
    const now = new Date();
    const month = now.getMonth();
    const season = month < 3 ? 'Winter 2025' : month < 6 ? 'Spring 2026' : month < 9 ? 'Summer 2026' : 'Fall 2025';

    if (!wardrobe.length) {
      el.innerHTML = `
        <div class="sr-header"><div class="sr-title" style="display:flex;align-items:center;gap:7px">${icon('list',18)} Season Report</div><div class="sr-period">${esc(season)}</div></div>
        <div style="text-align:center;padding:60px 20px;color:var(--muted)">
          <div style="margin-bottom:12px">${icon('hanger',40)}</div>
          <div style="font-size:var(--t-body);font-weight:700">No data yet</div>
          <div style="font-size:var(--t-caption);margin-top:6px;opacity:.7">Scan looks throughout the season</div>
        </div>`;
      return;
    }

    const totalItems = wardrobe.length;
    const totalValue = wardrobe.reduce((s,i) => s + (i.price_estimate_usd||0), 0);
    const totalWears = wardrobe.reduce((s,i) => s + (i.wear_count||0), 0);
    const worn = wardrobe.filter(i => (i.wear_count||0) > 0);
    const unworn = wardrobe.filter(i => (i.wear_count||0) === 0);
    const unusedValue = unworn.reduce((s,i) => s + (i.price_estimate_usd||0), 0);
    const utilizationPct = totalItems > 0 ? Math.round((worn.length / totalItems) * 100) : 0;
    const avgCPW = totalValue > 0 && totalWears > 0 ? Math.round(totalValue / totalWears) : null;

    const sortedByWear = [...wardrobe].sort((a,b) => (b.wear_count||0) - (a.wear_count||0));
    const top3 = sortedByWear.filter(i => (i.wear_count||0) > 0).slice(0,3);
    const bottom3 = unworn.slice(0,3);

    const insights = [];
    if (utilizationPct < 50) insights.push(`Only ${utilizationPct}% of your closet gets worn — consider clearing out ${unworn.length} unused items`);
    if (unusedValue > 500) insights.push(`$${unusedValue} is sitting unworn in your closet — you could sell it and earn`);
    if (avgCPW && avgCPW < 20) insights.push(`Average cost per wear is $${avgCPW} — excellent! You're using your closet well`);
    if (avgCPW && avgCPW > 100) insights.push(`High cost per wear ($${avgCPW}) — try wearing what you already own more`);

    el.innerHTML = `
      <div class="sr-header">
        <div class="sr-title" style="display:flex;align-items:center;gap:7px">${icon('list',18)} Season Report</div>
        <div class="sr-period">${esc(season)}</div>
      </div>
      <div class="sr-hero">
        <div class="sr-hero-title">Season summary</div>
        <div class="sr-hero-grid">
          <div class="sr-hero-stat">
            <div class="sr-hero-num">${utilizationPct}%</div>
            <div class="sr-hero-label">Closet utilization</div>
          </div>
          <div class="sr-hero-stat">
            <div class="sr-hero-num">${totalWears}</div>
            <div class="sr-hero-label">Total wears</div>
          </div>
          <div class="sr-hero-stat">
            <div class="sr-hero-num">$${unusedValue}</div>
            <div class="sr-hero-label">Sitting unworn</div>
          </div>
          <div class="sr-hero-stat">
            <div class="sr-hero-num">${avgCPW ? '$'+avgCPW : '—'}</div>
            <div class="sr-hero-label">Avg CPW</div>
          </div>
        </div>
      </div>

      ${insights.map(ins => `
      <div class="sr-insight-card">
        <div class="sr-insight-text">${icon('sparkle',14)} ${esc(ins)}</div>
      </div>`).join('')}

      ${top3.length ? `
      <div class="sr-section">
        <div class="sr-sec-title" style="display:inline-flex;align-items:center;gap:6px">${icon('flame',16)} Most worn this season</div>
        ${top3.map((i,idx) => `
          <div class="sr-item-row">
            <div class="sr-rank">${idx+1}</div>
            <div class="sr-item-ico">${icon(catIcon(i.category), 22)}</div>
            <div style="flex:1;min-width:0">
              <div class="sr-item-name">${esc(i.name)}</div>
              <div class="sr-item-meta">${i.wear_count} wears · CPW $${i.price_estimate_usd && i.wear_count ? Math.round(i.price_estimate_usd/i.wear_count) : '—'}</div>
            </div>
          </div>`).join('')}
      </div>` : ''}

      ${bottom3.length ? `
      <div class="sr-section">
        <div class="sr-sec-title" style="display:inline-flex;align-items:center;gap:6px">${icon('tag',16)} Never worn</div>
        ${bottom3.map(i => `
          <div class="sr-item-row">
            <div class="sr-rank" style="font-size:var(--t-caption);color:var(--muted)">&mdash;</div>
            <div class="sr-item-ico">${icon(catIcon(i.category), 22)}</div>
            <div style="flex:1;min-width:0">
              <div class="sr-item-name">${esc(i.name)}</div>
              <div class="sr-item-meta">$${i.price_estimate_usd||0} in closet · 0 wears</div>
            </div>
          </div>`).join('')}
      </div>` : ''}

      <div class="sr-action-row">
        <button class="ha-btn ha-primary" style="flex:1;display:inline-flex;align-items:center;justify-content:center;gap:6px" onclick="runDeclutter()">${icon('sparkle',15)} Clean your closet</button>
        <button class="ha-btn ha-secondary" style="flex:1;display:inline-flex;align-items:center;justify-content:center;gap:6px" onclick="showView('analytics')">${icon('barChart',15)} Analytics</button>
      </div>`;
  }

  // ---- Smart Declutter ----
  async function runDeclutter() {
    const wardrobe = JSON.parse(localStorage.getItem('awear_wardrobe') || '[]');
    if (!wardrobe.length) { showToast('Closet is empty — nothing to declutter'); return; }
    showToast('AI analyzing your closet…');
    const candidates = wardrobe.filter(i => (i.wear_count||0) === 0);
    if (!candidates.length) { showToast('Everything is worn — great closet utilization!'); return; }
    try {
      const res = await fetch('/api/declutter', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({wardrobe: wardrobe.map(i=>({name:i.name,category:i.category,wear_count:i.wear_count||0,price_estimate_usd:i.price_estimate_usd||0,style_tags:i.style_tags||[]}))}),
      });
      const data = await res.json();
      showDeclutterResults(data.suggestions || []);
    } catch(_) {
      const suggestions = candidates.slice(0,3).map(i => ({
        name: i.name, action: 'Sell', reason: 'Never worn', price_suggestion: Math.round((i.price_estimate_usd||100)*0.4),
      }));
      showDeclutterResults(suggestions);
    }
  }

  function showDeclutterResults(suggestions) {
    if (!suggestions.length) { showToast('Your closet is clean — nothing to declutter'); return; }
    const modal = document.getElementById('purchase-modal');
    const card  = document.getElementById('modal-card');
    card.innerHTML = `
      <div style="padding:20px 20px 0;font-size: var(--t-lead,17px);font-weight:900;display:flex;align-items:center;gap:8px">${icon('sparkle',18)} Smart Declutter</div>
      <div style="padding:6px 20px 14px;font-size:var(--t-caption);color:var(--muted);font-weight:600">AI suggests letting go of ${suggestions.length} items</div>
      <div style="display:flex;flex-direction:column;gap:10px;padding:0 16px;max-height:320px;overflow-y:auto">
        ${suggestions.map(s => `
          <div style="background:var(--card);border-radius:14px;padding:12px 14px;border:1px solid var(--line)">
            <div style="font-size:var(--t-body);font-weight:800;margin-bottom:4px">${esc(s.name)}</div>
            <div style="font-size:var(--t-micro);color:var(--muted,#8e8e9c);font-weight:600;margin-bottom:6px">${esc(s.reason)}</div>
            <div style="display:flex;gap:8px">
              <span style="padding:4px 10px;background:var(--success-surface);border-radius:20px;font-size:var(--t-micro);font-weight:800;color:var(--success)">${esc(s.action)} • $${s.price_suggestion||0}</span>
            </div>
          </div>`).join('')}
      </div>
      <div style="padding:16px 16px 20px">
        <button class="ha-btn ha-primary" style="width:100%" onclick="document.getElementById('purchase-modal').classList.remove('show')">Close</button>
      </div>`;
    modal.classList.add('show');
    card.querySelector('.ha-btn')?.addEventListener('click', () => modal.classList.remove('show'));
  }

  // ---- Wishlist ----
  const WL_KEY = 'awear_wishlist';

  function loadWishlist() { return JSON.parse(localStorage.getItem(WL_KEY) || '[]'); }
  function saveWishlist(wl) { localStorage.setItem(WL_KEY, JSON.stringify(wl)); }

  function renderWishlist() {
    const wl = loadWishlist();
    const wardrobe = JSON.parse(localStorage.getItem('awear_wardrobe') || '[]');
    const list = document.getElementById('wl-list');

    // Add button
    const addBtn = document.getElementById('wl-add-btn');
    const addInput = document.getElementById('wl-input');
    if (addBtn && !addBtn._bound) {
      addBtn._bound = true;
      const doAdd = () => {
        const name = addInput.value.trim();
        if (!name) return;
        const wl2 = loadWishlist();
        wl2.unshift({id: Date.now(), name, addedAt: new Date().toLocaleDateString('he-IL')});
        saveWishlist(wl2);
        addInput.value = '';
        renderWishlist();
        showToast('Added to Wishlist');
      };
      addBtn.addEventListener('click', doAdd);
      addInput.addEventListener('keydown', e => { if(e.key==='Enter') doAdd(); });
    }

    if (!wl.length) {
      const suggestions = SHOP_SEED.filter(s => s.score > 88).slice(0,4);
      list.innerHTML = `
        <div class="wl-empty">
          <div class="wl-empty-icon">${icon('bookmark', 44)}</div>
          <div class="wl-empty-text">Your list is empty</div>
          <div class="wl-empty-sub">Add items you want to buy — or pick from these suggestions:</div>
        </div>
        <div style="display:flex;flex-direction:column;gap:10px;padding:0 18px">
          ${suggestions.map(s => `
            <div style="display:flex;align-items:center;gap:12px;background:var(--card);border:1px solid var(--line);border-radius:16px;padding:12px 14px;cursor:pointer" onclick="addToWishlistFromSeed('${attr(s.name)}')">
              <div style="width:44px;height:44px;border-radius:12px;overflow:hidden;flex-shrink:0">${productImage(s)}</div>
              <div style="flex:1"><div style="font-size:var(--t-small);font-weight:800">${esc(s.name)}</div><div style="font-size:var(--t-micro);color:var(--muted);font-weight:600">${esc(s.brand)} · $${s.price}</div></div>
              <div style="font-size: var(--t-title,20px);color:var(--accent)">+</div>
            </div>`).join('')}
        </div>`;
      return;
    }

    list.innerHTML = wl.map(item => {
      const compat = calcCompatScore({name: item.name, style_tags: [], color: ''}, wardrobe);
      return `<div class="wl-item" data-id="${item.id}">
        <div class="wl-item-ico">${icon('sparkle',18)}</div>
        <div class="wl-item-info">
          <div class="wl-item-name">${esc(item.name)}</div>
          <div class="wl-item-price">Added ${esc(item.addedAt)}</div>
          ${wardrobe.length ? `<div class="wl-item-compat">Closet match: ${compat.pct}%</div>` : ''}
        </div>
        <button class="wl-item-del" data-id="${item.id}">×</button>
      </div>`;
    }).join('');

    list.querySelectorAll('.wl-item-del').forEach(btn =>
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const id = Number(btn.dataset.id);
        saveWishlist(loadWishlist().filter(i => i.id !== id));
        renderWishlist();
      })
    );
  }

  // ---- AI Stylist Chat ----
  const CHAT_PRESETS = [
    'What to wear for a date night?',
    'Job interview outfit',
    'Casual brunch look',
    'First day of work',
    'Beach day outfit',
    'What matches my black jeans?',
  ];
  let chatInited = false;
  let chatHistory = [];

  function addToWishlistFromSeed(name) {
    const wl = loadWishlist();
    if (wl.some(i => i.name === name)) { showToast('Already on your wishlist'); return; }
    wl.unshift({id: Date.now(), name, addedAt: new Date().toLocaleDateString('he-IL')});
    saveWishlist(wl);
    renderWishlist();
    showToast(name + ' added to wishlist');
  }

  function initChat() {
    const sendBtn = document.getElementById('chat-send');
    if (sendBtn) sendBtn.innerHTML = icon('arrowUp', 18);

    const backBtn = document.getElementById('chat-back');
    if (backBtn) {
      backBtn.innerHTML = icon('arrowLeft', 20);
      if (!backBtn._bound) { backBtn._bound = true; backBtn.addEventListener('click', () => showView('outfits')); }
    }

    document.getElementById('chat-presets').innerHTML = CHAT_PRESETS.map(p =>
      `<button class="chat-preset">${esc(p)}</button>`
    ).join('');
    document.getElementById('chat-presets').querySelectorAll('.chat-preset').forEach(btn =>
      btn.addEventListener('click', () => sendChatMsg(btn.textContent))
    );

    if (!chatInited) {
      chatInited = true;
      const wardrobe = JSON.parse(localStorage.getItem('awear_wardrobe') || '[]');
      let greeting;
      if (wardrobe.length >= 2) {
        const sample = wardrobe.slice(0, 2).map(i => i.name).join(' and ');
        greeting = "Hey! I'm Abigail, your personal stylist. I see you've got " + sample + " in your closet — great combo. What would you like to wear today?";
      } else if (wardrobe.length === 1) {
        greeting = "Hi! I'm Abigail, your stylist. I see you added " + wardrobe[0].name + " to your closet — nice taste. Let's build looks around it.";
      } else {
        greeting = "Hi! I'm Abigail, your personal stylist at AWEAR. Add some clothes to your closet and I'll build outfits that work for your life. What's on your mind?";
      }
      addChatMsg('bot', greeting);
    }

    const input = document.getElementById('chat-input');
    if (sendBtn && !sendBtn._bound) {
      sendBtn._bound = true;
      sendBtn.addEventListener('click', () => { const q = input.value.trim(); if(q){input.value='';sendChatMsg(q);} });
      input.addEventListener('keydown', e => { if(e.key==='Enter'){const q=input.value.trim();if(q){input.value='';sendChatMsg(q);}} });
    }
  }

  function addChatMsg(role, text) {
    const el = document.getElementById('chat-messages');
    if (!el) return;
    const now = new Date().toLocaleTimeString('he-IL',{hour:'2-digit',minute:'2-digit'});
    const div = document.createElement('div');
    div.className = 'chat-msg ' + role;
    div.innerHTML = `<div class="chat-bubble">${esc(text)}</div><div class="chat-time">${now}</div>`;
    el.appendChild(div);
    el.scrollTop = el.scrollHeight;
  }

  function showChatTyping() {
    const el = document.getElementById('chat-messages');
    if (!el || document.getElementById('chat-typing')) return;
    const div = document.createElement('div');
    div.id = 'chat-typing'; div.className = 'chat-msg bot chat-typing-wrap';
    div.innerHTML = `<div class="typing-bubble">Abigail is typing<span class="tdots"><span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span></span></div>`;
    el.appendChild(div);
    el.scrollTop = el.scrollHeight;
  }
  function hideChatTyping() { const el = document.getElementById('chat-typing'); if(el) el.remove(); }

  async function sendChatMsg(q) {
    if (!q) return;
    logAdminEvent('chat', 'Question: ' + q.slice(0,40));
    addChatMsg('user', q);
    showChatTyping();
    const wardrobe = JSON.parse(localStorage.getItem('awear_wardrobe') || '[]');
    const ctx = wardrobe.length
      ? 'Closet contains: ' + wardrobe.map(i=>i.name).join(', ')
      : 'Closet is currently empty';
    try {
      const res = await fetch('/api/stylist/chat', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({question: q, wardrobe_context: ctx}),
      });
      const data = await res.json();
      hideChatTyping();
      // Use the live AI answer only when it really is one. When the AI is
      // unavailable (no API key / server error) the backend sends {ok:false} —
      // fall through to the local stylist so the demo never breaks. (A6)
      if (data && data.ok !== false && data.answer) addChatMsg('bot', data.answer);
      else addChatMsg('bot', abigailLocalReply(q));
    } catch(_) {
      hideChatTyping();
      addChatMsg('bot', abigailLocalReply(q));
    }
  }

  // Local stylist fallback — keyword-matched replies used whenever the live AI
  // is unavailable. Keeps the L4 chat working as a real feature in the demo. (A6)
  function abigailLocalReply(q) {
      const wardrobe2 = JSON.parse(localStorage.getItem('awear_wardrobe')||'[]');
      const hasW = wardrobe2.length > 0;
      const itemName = hasW ? wardrobe2[0].name : null;
      const ABIGAIL_FALLBACKS = [
        {keys:['date','evening','night'], reply: itemName ? `For a date I'd take your ${itemName} with a satin midi dress and a kitten heel — a combo that never fails.` : 'For a date — satin midi dress + kitten heel + mini bag. Always works.'},
        {keys:['interview','work','professional'], reply:'For an interview: straight black trousers + a tucked-in white shirt + a low heel. Clean, confident, winning.'},
        {keys:['missing','what do i need','need','buy'], reply:'3 things almost always missing: white sneakers, a denim jacket, and a utility piece. They create dozens of looks.'},
        {keys:['capsule','capsule wardrobe','minimalist'], reply:'Capsule wardrobe: 2 pairs of jeans, 3 basics, one versatile dress, one coat, 2 pairs of shoes, a black bag. 12 pieces — endless looks.'},
        {keys:['shoes','sneakers','heel','shoe'], reply:'Most useful: white sneakers (for everything), brown Chelsea boots for winter, nude heels for events. Three pairs that cover it all.'},
        {keys:['trend','hot','what\'s in','right now'], reply:'The hottest trends right now: barrel jeans, white Adidas Samba, a leather jacket, a mini bag, and cottage core with lace.'},
        {keys:['price','how much','expensive','cheap','budget','spend'], reply:'Stylist wisdom: invest in shoes and a bag, save on clothes. 20% of your closet = 80% of your looks.'},
        {keys:['y2k','retro','vintage'], reply:'Y2K now: low-rise denim + crop top + big hoops + a tiny bag. You don\'t need it all — one Y2K piece is enough.'},
        {keys:['black','all black'], reply:'All black is the easiest win: play with textures — leather + velvet + matte. That\'s what makes it interesting.'},
        {keys:['winter','cold','fall','autumn'], reply:'For winter: layers are key. A bodysuit + linen shirt + leather jacket + a big coat. Warm and cool.'},
        {keys:['summer','hot','heat'], reply:'Summer in the city: linen, linen, linen. It breathes and doesn\'t wrinkle. A midi dress + leather sandals = perfect.'},
        {keys:['what to wear','don\'t know','help'], reply: hasW ? 'Let\'s build a look from your closet! Tell me — where to? Morning/evening? Casual or a bit more?' : 'Tell me a little about yourself — where to? What style do you love? And I\'ll tell you what to wear.'},
        {keys:['organize','organise','closet'], reply:'To organize your closet: the AWEAR Marie Kondo version — take everything out, sort by category, keep only what you\'ve worn in the last 6 months. Whatever\'s left — sell it.'},
        {keys:['sell','selling','depop'], reply:'Before you sell: shoot on a white background, natural light, 3 angles. Price = 30-40% of the original. A clear title with size and brand.'},
      ];
      const lq = q.toLowerCase();
      const match = ABIGAIL_FALLBACKS.find(f => f.keys.some(k => lq.includes(k)));
      const defaultReplies = [
        'Great question! Tell me more — for which occasion? What\'s your usual style?',
        'I\'m here! Give me a few more details so I can help you better.',
        hasW ? `With your closet we have tons of options — tell me what you need and we'll create a look!` : 'Let\'s get started — scan an item into your closet and I\'ll help you build looks.',
      ];
      return match ? match.reply : defaultReplies[Math.floor(Math.random()*defaultReplies.length)];
  }

  // ============================================================
  // DIRECT MESSAGES (user-to-user) — distinct from Abigail AI chat.
  // Backend: Sam's /api/dm/* (conversations / thread / send).
  // dmPeer === null  → conversation list ;  else → open thread.
  // ============================================================
  let dmPeer = null;        // {user_id, name, handle, avatar} of open thread, or null
  let dmSending = false;    // guards double-send

  // Relative time helper — number-driven, language-neutral chrome (just digits + m/h/d).
  function dmTimeAgo(iso){
    if(!iso) return '';
    const then = new Date(iso).getTime();
    if(isNaN(then)) return '';
    const sec = Math.max(0, Math.floor((Date.now()-then)/1000));
    if(sec < 60)        return 'now';
    const min = Math.floor(sec/60); if(min < 60) return min+'m';
    const hr  = Math.floor(min/60); if(hr  < 24) return hr+'h';
    const day = Math.floor(hr/24);  if(day < 7)  return day+'d';
    return new Date(then).toLocaleDateString('en-US',{month:'short',day:'numeric'});
  }

  // Renders an avatar: real <img> with onerror fallback when there's a URL,
  // otherwise an inline initials circle (SF-AVATAR-01 — a valid placeholder
  // never fires onerror, so we must inline the fallback when there's no photo).
  function dmAvatarHTML(name, avatar, cls){
    if(avatar){
      return `<img class="${cls}" src="${attr(avatar)}" alt="" data-name="${attr(name)}" loading="lazy" onerror="this.onerror=null;avatarFallback(this)">`;
    }
    const initials = String(name||'').split(/[ .@]/).filter(Boolean).slice(0,2).map(w=>w[0]).join('').toUpperCase() || '?';
    return `<span class="${cls} avatar-fallback">${esc(initials)}</span>`;
  }

  function renderDM(){
    if(dmPeer) renderDMThread();
    else       renderDMList();
  }

  async function renderDMList(){
    const root = document.getElementById('dm-outer');
    if(!root) return;
    document.querySelector('nav')?.classList.remove('conv-nav-hidden'); // list is a top-level tab — keep the nav
    root.innerHTML =
      `<div class="dm-head"><div class="dm-head-text"><div class="dm-head-title">Messages</div>`+
      `<div class="dm-head-sub">Direct messages</div></div></div>`+
      `<div class="dm-list" id="dm-list"><div class="dm-empty">Loading…</div></div>`;
    const listEl = document.getElementById('dm-list');
    let convos = [];
    try {
      const res = await fetch('/api/dm/conversations');
      const data = await res.json();
      convos = (data && data.conversations) || [];
    } catch(_){
      listEl.innerHTML =
        `<div class="dm-empty"><div class="dm-empty-ico">${icon('messageCircle',40)}</div>`+
        `<div class="dm-empty-title">Couldn't load messages</div>`+
        `<div class="dm-empty-sub">Check your connection and try again.</div></div>`;
      return;
    }
    if(!convos.length){
      listEl.innerHTML =
        `<div class="dm-empty"><div class="dm-empty-ico">${icon('messageCircle',40)}</div>`+
        `<div class="dm-empty-title">No messages yet</div>`+
        `<div class="dm-empty-sub">When you message someone, your chats show up here.</div></div>`;
      return;
    }
    listEl.innerHTML = convos.map(c => {
      const name    = c.name || c.handle || 'User';
      const unread  = Number(c.unread) || 0;
      const handle  = c.handle ? '@'+String(c.handle).replace(/^@/,'') : '';
      const lastCls = unread > 0 ? 'dm-row-last unread' : 'dm-row-last';
      const rowCls  = unread > 0 ? 'dm-row unread' : 'dm-row';
      const aria    = unread > 0 ? `${name}, ${unread} unread` : name;
      return `<div class="${rowCls}" role="button" tabindex="0" aria-label="${attr(aria)}" data-uid="${attr(c.user_id)}" `+
        `data-name="${attr(name)}" data-handle="${attr(handle)}" data-avatar="${attr(c.avatar||'')}">`+
        dmAvatarHTML(name, c.avatar, 'dm-avatar')+
        `<div class="dm-row-body">`+
          `<div class="dm-row-top"><span class="dm-row-name">${esc(name)}</span>`+
            `<span class="dm-row-time">${esc(dmTimeAgo(c.last_at))}</span></div>`+
          `<div class="dm-row-preview"><span class="${lastCls}">${esc(c.last_message||'')}</span>`+
            (unread>0 ? `<span class="dm-badge">${unread>99?'99+':unread}</span>` : '')+
          `</div>`+
        `</div></div>`;
    }).join('');
    listEl.querySelectorAll('.dm-row').forEach(row => {
      const open = () => {
        dmPeer = {
          user_id: row.dataset.uid,
          name:    row.dataset.name,
          handle:  row.dataset.handle,
          avatar:  row.dataset.avatar || '',
        };
        renderDM();
      };
      row.addEventListener('click', open);
      row.addEventListener('keydown', e => {
        if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); open(); }
      });
    });
  }

  async function renderDMThread(){
    const root = document.getElementById('dm-outer');
    if(!root || !dmPeer) return;
    document.querySelector('nav')?.classList.add('conv-nav-hidden'); // composer needs the bottom space
    const peerName = dmPeer.name || dmPeer.handle || 'User';
    root.innerHTML =
      `<div class="dm-head">`+
        `<button class="dm-back" id="dm-back" aria-label="Back to messages">${icon('arrowLeft',20)}</button>`+
        dmAvatarHTML(peerName, dmPeer.avatar, 'dm-head-avatar')+
        `<div class="dm-head-text"><div class="dm-head-title">${esc(peerName)}</div>`+
        (dmPeer.handle ? `<div class="dm-head-sub">${esc(dmPeer.handle)}</div>` : '')+`</div>`+
      `</div>`+
      `<div class="dm-thread" id="dm-thread"><div class="dm-empty">Loading…</div></div>`+
      `<div class="dm-input-row">`+
        `<input class="dm-input" id="dm-input" placeholder="Message…" dir="auto" autocomplete="off" />`+
        `<button class="dm-send" id="dm-send" aria-label="Send">${icon('send',18)}</button>`+
      `</div>`;

    document.getElementById('dm-back').addEventListener('click', () => {
      dmPeer = null; renderDM();
    });

    const input  = document.getElementById('dm-input');
    const sendBtn = document.getElementById('dm-send');
    const submit = () => dmSend(input);
    sendBtn.addEventListener('click', submit);
    input.addEventListener('keydown', e => { if(e.key==='Enter'){ e.preventDefault(); submit(); }});

    await loadDMThread();
    input.focus();
  }

  async function loadDMThread(){
    const threadEl = document.getElementById('dm-thread');
    if(!threadEl || !dmPeer) return;
    let messages = [];
    try {
      const res = await fetch('/api/dm/thread/'+encodeURIComponent(dmPeer.user_id));
      const data = await res.json();
      if(data && data.peer){
        // refresh peer meta from the server (authoritative name/handle/avatar)
        dmPeer.name   = data.peer.name   || dmPeer.name;
        dmPeer.handle = data.peer.handle ? '@'+String(data.peer.handle).replace(/^@/,'') : dmPeer.handle;
        dmPeer.avatar = data.peer.avatar || dmPeer.avatar;
      }
      messages = (data && data.messages) || [];
    } catch(_){
      threadEl.innerHTML =
        `<div class="dm-empty"><div class="dm-empty-ico">${icon('messageCircle',40)}</div>`+
        `<div class="dm-empty-title">Couldn't load this chat</div>`+
        `<div class="dm-empty-sub">Check your connection and try again.</div></div>`;
      return;
    }
    renderDMMessages(messages);
  }

  function renderDMMessages(messages){
    const threadEl = document.getElementById('dm-thread');
    if(!threadEl) return;
    if(!messages.length){
      threadEl.innerHTML =
        `<div class="dm-empty"><div class="dm-empty-sub">No messages yet — say hi.</div></div>`;
      return;
    }
    threadEl.innerHTML = messages.map((m, i) =>
      dmBubbleHTML(m, messages[i-1], i === messages.length-1)).join('');
    threadEl.scrollTop = threadEl.scrollHeight;
  }

  // 5-minute grouping threshold: bubbles within 5 min of the previous same-side
  // bubble are visually grouped (tight gap, no per-bubble timestamp).
  const DM_GROUP_MS = 5 * 60 * 1000;
  function dmSameSide(a, b){
    if(!a || !b) return false;
    return (a.from === 'me' ? 'me' : 'them') === (b.from === 'me' ? 'me' : 'them');
  }
  function dmCloseInTime(a, b){
    if(!a || !b) return false;
    const ta = new Date(a.created_at).getTime(), tb = new Date(b.created_at).getTime();
    if(isNaN(ta) || isNaN(tb)) return false;
    return Math.abs(tb - ta) <= DM_GROUP_MS;
  }

  function dmBubbleHTML(m, prev, isLast){
    // m.text is USER CONTENT — emoji here is legitimate; esc() guards XSS only.
    const side = m.from === 'me' ? 'me' : 'them';
    // grouped = same sender as the bubble directly above, within 5 min → tighten gap.
    const grouped = dmSameSide(m, prev) && dmCloseInTime(m, prev);
    // Show the timestamp only when the conversation "breaks" — a side change or a
    // >5 min gap from the previous bubble — so the thread reads like a chat, not a log.
    const showTime = !grouped;
    const meta = isLast && side === 'me'
      ? `<div class="dm-bubble-status">Sent</div>`
      : (showTime ? `<div class="dm-bubble-time">${esc(dmTimeAgo(m.created_at))}</div>` : '');
    return `<div class="dm-bubble-wrap ${side}${grouped ? ' grouped' : ''}">`+
      `<div class="dm-bubble">${esc(m.text)}</div>`+meta+`</div>`;
  }

  async function dmSend(input){
    if(dmSending || !dmPeer) return;
    const text = (input.value || '').trim();
    if(!text) return;
    if(text.length > 2000){ showToast('Message is too long (max 2000)'); return; }
    dmSending = true;
    input.value = '';
    // Optimistic append.
    const threadEl = document.getElementById('dm-thread');
    if(threadEl){
      const empty = threadEl.querySelector('.dm-empty');
      if(empty) threadEl.innerHTML = '';
      // Derive "prev" from the bubble already at the bottom so grouping (same side,
      // <5 min) is correct, and clear any stale "Sent" status that was on it.
      const prevWrap = threadEl.querySelector('.dm-bubble-wrap:last-child');
      let prev = null;
      if(prevWrap){
        prev = { from: prevWrap.classList.contains('me') ? 'me' : 'them', created_at: new Date().toISOString() };
        const oldStatus = prevWrap.querySelector('.dm-bubble-status');
        if(oldStatus) oldStatus.remove();
      }
      threadEl.insertAdjacentHTML('beforeend',
        dmBubbleHTML({from:'me', text, created_at:new Date().toISOString()}, prev, true));
      threadEl.scrollTop = threadEl.scrollHeight;
    }
    logAdminEvent('dm', 'Sent message to '+(dmPeer.name||dmPeer.user_id));
    try {
      const res = await fetch('/api/dm/send', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({to_user_id: dmPeer.user_id, text}),
      });
      if(res.status === 429){ showToast('Slow down — too many messages'); }
      else if(!res.ok){ showToast("Couldn't send message"); }
      // Refetch to reconcile optimistic bubble with server truth.
      await loadDMThread();
    } catch(_){
      showToast("Couldn't send message");
    } finally {
      dmSending = false;
      document.getElementById('dm-input')?.focus();
    }
  }

  // ---- Explore / Search ----
  const EX_VIBES = [
    {label:'All', val:'all'}, {label:'Y2K', val:'y2k'}, {label:'Streetwear', val:'streetwear'},
    {label:'Minimal', val:'minimal'}, {label:'Vintage', val:'vintage'}, {label:'Cottage Core', val:'cottage'},
    {label:'Performance', val:'sport'}, {label:'Formal', val:'formal'},
  ];
  const EX_TRENDING = [
    {icon:'flame',label:'Adidas Samba',tag:'streetwear'},
    {icon:'hanger',label:'Barrel jeans',tag:'y2k'},
    {icon:'hanger',label:'Leather jacket',tag:'streetwear'},
    {icon:'bag',label:'Mini bag',tag:'y2k'},
    {icon:'flower',label:'Cottage Core',tag:'cottage'},
    {icon:'sparkle',label:'Y2K Denim',tag:'y2k'},
    {icon:'minimal',label:'White minimal',tag:'minimal'},
    {icon:'briefcase',label:'Power Dressing',tag:'formal'},
  ];
  const EX_CARDS = [
    {name:'Urban summer look',sub:'Zara + Samba',badge:'Trending'},
    {name:'Streetwear All Black',sub:'Cargo + oversized',badge:'Top pick'},
    {name:'Cottage Romance',sub:'Vintage + romantic',badge:''},
    {name:'Sport Luxe',sub:'Nike + minimal',badge:'New'},
    {name:'Classic minimal',sub:'White + nude',badge:''},
    {name:'Y2K Butterfly',sub:'Low-rise + crop',badge:'Viral'},
  ];

  let exVibe = 'all', exInited = false;

  function initExplore() {
    if (exInited) return;
    exInited = true;

    // search icon
    document.getElementById('ex-search-icon').innerHTML = icon('search', 18);

    // vibes
    const vibesEl = document.getElementById('ex-vibes');
    vibesEl.innerHTML = EX_VIBES.map(v =>
      `<button class="ev-chip${v.val==='all'?' active':''}" data-val="${attr(v.val)}">${esc(v.label)}</button>`
    ).join('');
    vibesEl.querySelectorAll('.ev-chip').forEach(btn => btn.addEventListener('click', () => {
      exVibe = btn.dataset.val;
      vibesEl.querySelectorAll('.ev-chip').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      renderExGrid();
    }));

    // trending chips
    document.getElementById('ex-trending').innerHTML = EX_TRENDING.map(t =>
      `<button class="ex-trend-chip" data-q="${attr(t.label)}" data-tag="${attr(t.tag||'')}">
         <span class="tc-emoji">${icon(t.icon,16)}</span>
         <span class="tc-text">${esc(t.label)}</span>
       </button>`
    ).join('');
    document.getElementById('ex-trending').querySelectorAll('.ex-trend-chip').forEach(btn =>
      btn.addEventListener('click', () => {
        document.getElementById('ex-trending').querySelectorAll('.ex-trend-chip').forEach(b=>b.style.background='');
        btn.style.background='linear-gradient(135deg,rgba(255,61,119,.2),rgba(123,92,255,.2))';
        btn.style.borderColor='var(--accent)';
        document.getElementById('ex-input').value = btn.dataset.q;
        runExSearch(btn.dataset.q, btn.dataset.tag);
      })
    );

    renderExGrid();

    // search input
    const inp = document.getElementById('ex-input');
    inp.addEventListener('input', () => {
      const q = inp.value.trim();
      if (q.length > 1) runExSearch(q);
      else showExDefault();
    });
    inp.addEventListener('keydown', e => { if(e.key==='Enter') runExSearch(inp.value.trim()); });
  }

  function renderExGrid() {
    let cards = EX_CARDS;
    if (exVibe !== 'all') {
      const vibeMap = {y2k:['y2k','butterfly'],streetwear:['black','street','cargo'],
        minimal:['minimal','nude'],vintage:['vintage'],cottage:['cottage','romance'],
        sport:['sport','nike'],formal:['formal','power']};
      const terms = vibeMap[exVibe]||[exVibe];
      cards = EX_CARDS.filter(c => terms.some(t => (c.name+c.sub).toLowerCase().includes(t.toLowerCase())));
      if (!cards.length) cards = EX_CARDS;
    }
    document.getElementById('ex-grid').innerHTML = cards.map(c =>
      `<div class="ex-card">
         <div class="ex-card-bg">${productImage({name:c.name, search_query:c.name+' '+(c.sub||'')})}</div>
         <div class="ex-card-info">
           <div class="ex-card-name">${esc(c.name)}</div>
           <div class="ex-card-sub">${esc(c.sub)}</div>
         </div>
         ${c.badge ? `<div class="ex-card-badge">${esc(c.badge)}</div>` : ''}
       </div>`
    ).join('');
  }

  function runExSearch(q, tag) {
    if (!q) { showExDefault(); return; }
    document.getElementById('ex-default').style.display = 'none';
    document.getElementById('ex-results').style.display = 'block';
    document.getElementById('ex-results-label').textContent = `Results for "${q}"`;

    const wardrobe = JSON.parse(localStorage.getItem('awear_wardrobe') || '[]');
    const ql = q.toLowerCase();
    const wardHits = wardrobe.filter(it =>
      [(it.name||''),(it.category||''),(it.style_tags||[]).join(' '),(it.color||'')].join(' ').toLowerCase().includes(ql)
    );

    // Match shop seed items
    const shopHits = SHOP_SEED.filter(it =>
      [it.name, it.brand, ...(it.style_tags||[])].join(' ').toLowerCase().includes(ql) ||
      (tag && (it.style_tags||[]).some(t=>t.toLowerCase().includes(tag)))
    ).slice(0,6);

    const list = document.getElementById('ex-results-list');
    let html = '';

    if (wardHits.length) {
      html += `<div style="font-size:var(--t-micro);font-weight:800;color:var(--muted);padding:0 0 8px;letter-spacing:.4px">From your closet</div>`;
      html += wardHits.map(it => `
        <div class="ex-result-row" onclick="openSheetItem(${JSON.stringify({name:it.name,category:it.category,style_tags:it.style_tags||[]})})">
          <div class="ex-result-emoji">${productImage(it)}</div>
          <div><div class="ex-result-name">${esc(it.name)}</div><div class="ex-result-cat">${esc(catLabel(it.category))}</div></div>
        </div>`).join('');
    }

    if (shopHits.length) {
      html += `<div style="font-size:var(--t-micro);font-weight:800;color:var(--muted);padding:${wardHits.length?'14px':0} 0 8px;letter-spacing:.4px">Shop</div>`;
      html += shopHits.map(it => {
        const disc = it.orig > it.price ? Math.round((1-it.price/it.orig)*100) : 0;
        return `
        <div class="ex-result-row" onclick="openSheetSingle({name:'${attr(it.name)}',category:'${attr(it.category)}',style_tags:${JSON.stringify(it.style_tags)},price_estimate_usd:${it.price}},0,null)">
          <div class="ex-result-emoji">${productImage(it)}</div>
          <div style="flex:1"><div class="ex-result-name">${esc(it.name)}</div><div class="ex-result-cat">${esc(it.brand)} · $${it.price}${disc?` <span style="color:var(--success)">-${disc}%</span>`:''}</div></div>
          ${it.badge?`<div style="font-size: var(--t-micro,11px);font-weight:800;padding:2px 7px;border-radius:8px;background:rgba(255,61,119,.15);color:var(--accent)">${esc(it.badge)}</div>`:''}
        </div>`;
      }).join('');
    }

    if (!html) {
      list.innerHTML = `<div style="text-align:center;color:var(--muted);padding:32px 0;font-size:var(--t-body);font-weight:700">${icon('search',28)}<br>No results found<br><span style="font-size:var(--t-caption);font-weight:500">Try a style, color, or brand</span></div>`;
      return;
    }
    list.innerHTML = html;
  }

  function showExDefault() {
    document.getElementById('ex-default').style.display = 'block';
    document.getElementById('ex-results').style.display = 'none';
    document.getElementById('ex-input').value = '';
  }

  // ---- Onboarding ----
  const ONBOARDING_KEY = 'awear_onboarded';
  // Each slide leads with a real full-bleed editorial photo -- same Pollinations source as
  // productImage(), an editorial/lifestyle prompt instead of a white-cutout product shot.
  // This replaces the old single-icon-on-empty-gradient layout per the 2026-06-18 board
  // decision (Instagram/Pinterest density + Chanel/LV/Fendi cinematic-photo restraint).
  // Copy is generated by a function (not a load-time constant) so switching locale via
  // setLocale() and re-calling renderOnbSlide() picks up the new language immediately.
  function getOnbSlides() {
    return [
      { q:'editorial fashion photography, full body shot, curated streetwear outfit, urban backdrop, golden hour light, magazine editorial style, cinematic',
        kicker:t('onboarding.slide1_kicker'), title:t('onboarding.slide1_title'), desc:t('onboarding.slide1_desc') },
      { q:'editorial fashion photography, flatlay of curated clothing items on neutral textured surface, soft natural light, magazine style, minimal composition',
        kicker:t('onboarding.slide2_kicker'), title:t('onboarding.slide2_title'), desc:t('onboarding.slide2_desc') },
      { q:'editorial fashion photography, woman in upscale boutique holding garment, soft window light, cinematic minimal composition, muted tones',
        kicker:t('onboarding.slide3_kicker'), title:t('onboarding.slide3_title'), desc:t('onboarding.slide3_desc') },
    ];
  }

  // Extended quiz: 5 steps
  function getQuizSteps() {
    return [
    {
      type: 'choice', q: t('onboarding.quiz_vibe_q'), hint: t('onboarding.quiz_vibe_hint'), multi: true,
      key: 'styleVibes',
      opts: [
        {icon:'sparkle',label:'Y2K',sub:'Trendy & retro'},
        {icon:'hoodie',label:'Streetwear',sub:'Urban'},
        {icon:'minimal',label:'Minimal',sub:'Clean & simple'},
        {icon:'flower',label:'Cottage Core',sub:'Romantic & vintage'},
      ]
    },
    {
      type: 'choice', q: t('onboarding.quiz_goal_q'), hint: t('onboarding.quiz_goal_hint'), multi: false,
      key: 'goal',
      opts: [
        {icon:'shirt',label:t('onboarding.quiz_goal_opt_dress_better'),sub:t('onboarding.quiz_goal_opt_dress_better_sub')},
        {icon:'coins',label:t('onboarding.quiz_goal_opt_save_money'),sub:'CPW & smart buys'},
        {icon:'tag',label:t('onboarding.quiz_goal_opt_sell_clothes'),sub:'Marketplace'},
        {icon:'box',label:t('onboarding.quiz_goal_opt_capsule'),sub:t('onboarding.quiz_goal_opt_capsule_sub')},
      ]
    },
    {
      type: 'choice', q: t('onboarding.quiz_budget_q'), hint: t('onboarding.quiz_budget_hint'), multi: false,
      key: 'budget',
      opts: [
        {icon:'cash',label:'Up to $50',sub:t('onboarding.quiz_budget_opt_smart')},
        {icon:'receipt',label:'$50–150',sub:t('onboarding.quiz_budget_opt_medium')},
        {icon:'diamond',label:'$150–300',sub:t('onboarding.quiz_budget_opt_luxury')},
        {icon:'crown',label:'$300+',sub:t('onboarding.quiz_budget_opt_anything')},
      ]
    },
    {
      type: 'choice', q: t('onboarding.quiz_source_q'), hint: t('onboarding.quiz_source_hint'), multi: true,
      key: 'shopSource',
      opts: [
        {icon:'globe',label:'ASOS / Zara',sub:'online'},
        {icon:'storefront',label:'H&M / Mango',sub:t('onboarding.quiz_source_opt_intl_chain')},
        {icon:'leaf',label:t('onboarding.quiz_source_opt_secondhand'),sub:'Depop / Vinted'},
        {icon:'flame',label:t('onboarding.quiz_source_opt_everything'),sub:''},
      ]
    },
    {
      type: 'choice', q: t('onboarding.quiz_size_q'), hint: t('onboarding.quiz_size_hint'), multi: false,
      key: 'size',
      opts: [
        {text:'XS/S',label:'XS / S',sub:'34–36'},
        {text:'M',label:'M',sub:'38–40'},
        {text:'L',label:'L',sub:'42–44'},
        {text:'XL+',label:'XL+',sub:'46+'},
      ]
    },
    {
      type: 'text', q: t('onboarding.quiz_name_q'), hint: t('onboarding.quiz_name_hint'),
      key: 'name', placeholder: t('onboarding.quiz_name_placeholder'),
    },
    ];
  }

  let onbStep = 0, quizStep = 0, quizAnswers = {};

  function showOnboarding() {
    document.getElementById('onboarding').style.display = 'flex';
    renderOnbSlide();
  }
  function finishOnboarding() {
    localStorage.setItem(ONBOARDING_KEY, '1');
    const prof = loadProfile();
    getQuizSteps().forEach((step, i) => {
      if (!quizAnswers[i]) return;
      if (step.type === 'text') {
        prof[step.key] = quizAnswers[i];
      } else {
        const labels = [...quizAnswers[i]].map(idx => step.opts[idx]?.label).filter(Boolean);
        prof[step.key] = step.multi ? labels : labels[0];
      }
    });
    saveProfile(prof);
    document.getElementById('onboarding').style.display = 'none';
    renderHome();
  }

  function renderOnbSlide() {
    const onbSlides = getOnbSlides(), quizSteps = getQuizSteps();
    const total = onbSlides.length + quizSteps.length;
    const cur = onbStep;
    // dots
    document.getElementById('onb-dots').innerHTML =
      Array.from({length: total}, (_,i) =>
        `<div class="onb-dot${i===cur?' active':''}"></div>`).join('');

    const nextBtn = document.getElementById('onb-next');

    if (onbStep < onbSlides.length) {
      const s = onbSlides[onbStep];
      const isFinalIntro = onbStep === onbSlides.length - 1;
      document.getElementById('onb-content').innerHTML = `
        <div class="onb-slide">
          <div class="onb-photo-wrap">${editorialImage(s.q, s.title, 'onb-photo')}</div>
          <div class="onb-scrim"></div>
          <div class="onb-top"><div class="onb-logo">AWEAR</div></div>
          <div class="onb-content-bottom">
            <div class="onb-kicker">${esc(s.kicker)}</div>
            <div class="onb-title">${esc(s.title)}</div>
            <div class="onb-desc">${esc(s.desc)}</div>
          </div>
        </div>`;
      nextBtn.classList.toggle('onb-next-final', isFinalIntro);
      nextBtn.textContent = isFinalIntro ? t('onboarding.slide3_btn') : t('onboarding.continue');
    } else {
      nextBtn.classList.remove('onb-next-final');
      const qi = onbStep - onbSlides.length;
      const step = quizSteps[qi];
      quizStep = qi;
      const sel = quizAnswers[qi] || new Set();
      const isLast = onbStep === onbSlides.length + quizSteps.length - 1;

      if (step.type === 'text') {
        document.getElementById('onb-content').innerHTML = `
          <div class="quiz-wrap">
            <div class="quiz-q">${esc(step.q)}</div>
            <div class="quiz-hint">${esc(step.hint)}</div>
            <input id="onb-text-input" style="width:100%;background:var(--card);border:2px solid var(--line);border-radius:16px;padding:14px 16px;font-family:inherit;font-size: var(--t-h3,16px);color:var(--text);outline:none;direction:rtl;margin-top:16px;transition:border .18s" placeholder="${attr(step.placeholder||'')}" value="${attr(quizAnswers[qi]||'')}" />
          </div>`;
        const inp = document.getElementById('onb-text-input');
        inp.addEventListener('focus', () => inp.style.borderColor = 'var(--accent)');
        inp.addEventListener('blur', () => inp.style.borderColor = 'var(--line)');
        inp.addEventListener('input', () => { quizAnswers[qi] = inp.value; });
      } else {
        document.getElementById('onb-content').innerHTML = `
          <div class="quiz-wrap">
            <div class="quiz-q">${esc(step.q)}</div>
            <div class="quiz-hint">${esc(step.hint)}</div>
            <div class="quiz-grid">${step.opts.map((o,i) =>
              `<button class="quiz-opt${([...sel].includes(i))?' sel':''}" data-qi="${qi}" data-oi="${i}">
                 <div class="qo-emoji">${o.icon ? icon(o.icon,32) : `<span class="qo-text">${esc(o.text)}</span>`}</div>
                 <div class="qo-label">${esc(o.label)}</div>
                 <div class="qo-sub">${esc(o.sub)}</div>
               </button>`).join('')}
            </div>
          </div>`;
        document.getElementById('onb-content').querySelectorAll('.quiz-opt').forEach(btn => {
          btn.addEventListener('click', () => {
            const qi2 = Number(btn.dataset.qi), oi = Number(btn.dataset.oi);
            if (!quizAnswers[qi2]) quizAnswers[qi2] = new Set();
            if (step.multi) {
              quizAnswers[qi2].has(oi) ? quizAnswers[qi2].delete(oi) : quizAnswers[qi2].add(oi);
            } else {
              quizAnswers[qi2] = new Set([oi]);
            }
            btn.closest('.quiz-grid').querySelectorAll('.quiz-opt').forEach((b,i) =>
              b.classList.toggle('sel', quizAnswers[qi2].has(i)));
          });
        });
      }
      if (isLast) nextBtn.classList.add('onb-next-final');
      nextBtn.textContent = isLast ? t('onboarding.lets_go') : t('onboarding.continue');
    }
  }

  document.getElementById('onb-next').addEventListener('click', () => {
    const total = getOnbSlides().length + getQuizSteps().length;
    if (onbStep < total - 1) { onbStep++; renderOnbSlide(); }
    else finishOnboarding();
  });
  document.getElementById('onb-skip').addEventListener('click', finishOnboarding);

  // Show onboarding for new users
  if (!localStorage.getItem(ONBOARDING_KEY)) showOnboarding();

  // ---- Edit profile ----
  const editOverlay = document.getElementById('edit-profile-overlay');
  let editPhotoData = null;

  function openEditProfile(){
    const prof = loadProfile();
    document.getElementById('edit-name').value    = prof.name||'';
    document.getElementById('edit-handle').value  = prof.handle||'';
    document.getElementById('edit-city').value    = prof.city||'';
    document.getElementById('edit-bio').value     = prof.bio||'';
    editPhotoData = prof.photo||null;
    const showPricesEl = document.getElementById('edit-show-prices');
    if (showPricesEl) showPricesEl.checked = prof.show_closet_prices !== false;
    const prev = document.getElementById('edit-photo-preview');
    prev.innerHTML = prof.photo
      ? `<img src="${attr(prof.photo)}" alt="">`
      : icon('user', 32);
    document.querySelectorAll('[data-lang-opt]').forEach(b =>
      b.classList.toggle('sel', b.dataset.langOpt === LOCALE));
    editOverlay.classList.add('show');
  }

  document.getElementById('lang-switch-icon').innerHTML = icon('globe', 20);
  document.getElementById('lang-opt-he').addEventListener('click', () => setLocale('he'));
  document.getElementById('lang-opt-en').addEventListener('click', () => setLocale('en'));
  document.querySelectorAll('[data-lang-opt]').forEach(b =>
    b.classList.toggle('sel', b.dataset.langOpt === LOCALE));

  document.getElementById('edit-cancel-btn').addEventListener('click',()=>editOverlay.classList.remove('show'));
  document.getElementById('edit-profile-close')?.addEventListener('click',()=>editOverlay.classList.remove('show'));
  editOverlay.addEventListener('click',e=>{ if(e.target===editOverlay) editOverlay.classList.remove('show'); });

  document.getElementById('edit-photo-btn').addEventListener('click',()=>document.getElementById('edit-photo-input').click());
  document.getElementById('edit-photo-input').addEventListener('change',e=>{
    const f=e.target.files[0]; if(!f) return;
    const r=new FileReader();
    r.onload=()=>{
      editPhotoData=r.result;
      document.getElementById('edit-photo-preview').innerHTML=`<img src="${attr(r.result)}" alt="">`;
    };
    r.readAsDataURL(f);
    e.target.value='';
  });

  document.getElementById('edit-save-btn').addEventListener('click',()=>{
    const prof={
      name:  document.getElementById('edit-name').value.trim()  || 'My Style',
      handle:document.getElementById('edit-handle').value.trim().replace(/^@/,'') || 'me',
      city:  document.getElementById('edit-city').value.trim(),
      bio:   document.getElementById('edit-bio').value.trim(),
      photo: editPhotoData,
      show_closet_prices: document.getElementById('edit-show-prices')?.checked !== false,
    };
    saveProfile(prof);
    updateHeaderCityPin();
    editOverlay.classList.remove('show');
    renderCloset();
  });

  // ---- Feed tabs ----
  let activeTab = 'foryou';
  document.querySelectorAll('.ftab').forEach(t=>t.addEventListener('click',()=>{
    document.querySelectorAll('.ftab').forEach(x=>x.classList.remove('active'));
    t.classList.add('active');
    activeTab = t.dataset.tab;
    renderFeed();
  }));

  // ---- Stories data ----
  // Demo seed = graceful fallback ONLY (used if GET /api/stories fails) so the
  // bar is never empty in a demo. Real active (≤24h) stories come from the backend.
  const STORIES_SEED = [
    {id:'st1', name:'Tamar',  userId:'u1', avatar:'/static/img/users/tamar/avatar.jpg',  initials:'TG'},
    {id:'st2', name:'Carmel', userId:'u2', avatar:'/static/img/users/carmel/avatar.jpg', initials:'CP'},
    {id:'st3', name:'Maayan', userId:'u3', avatar:'/static/img/users/maayan/avatar.jpg', initials:'MA'},
  ];
  // ===== COMMENTS (Shira) =====
  const COMMENTS_KEY  = 'awear_comments';

  // ===== SEEDED SOCIAL PROOF (Shira) =====
  // Demo-only seed so the feed reads as ALIVE: posts with 2.4k–7.2k likes must
  // not show 0 comments (an investor reads that as fake).
  // - Comments: ~likes/400 clamped 3–9, unique & look-specific per post, every
  //   post has a shopping-intent question AND a creator reply right under it
  //   (the ask→answer loop is the shop-the-look thesis on display).
  // - EMOJI RULE: emoji appears ONLY inside the comment `text` (user-generated
  //   content). All UI chrome stays emoji-free via icon()/SVG.
  // Comment voice: warm, lowercase-leaning, SPECIFIC to that look + creator.
  // "user" is a handle string (rendered with @); the seeded creator reply uses
  // the post's own handle so the ask→answer loop is legible.
  const FEED_COMMENTS_SEED = {
    s1: [ // noa.styles — summer cafe, white cropped tee + beige trousers + white sneakers
      {user:'leah.wears',  text:'the beige trousers + white tee is SO clean for summer ☀️'},
      {user:'tamarrr',     text:'where are the trousers from?? need that exact baker fit'},
      {user:'noa.styles',  text:'thrifted the trousers but linked a similar pair in my closet ✨'},
      {user:'cafe.ksenia', text:'tuck the tee a little more and this is a perfect cafe fit'},
      {user:'minimal.may', text:'the all-neutral palette is everything'},
      {user:'rinathk',     text:'obsessed, saving this for my next coffee date 🔥'},
    ],
    s2: [ // yael_fits — streetwear, oversized tee, parachute cargos, Adidas Samba, cap
      {user:'kobi.streets', text:'those Sambas with the parachute cargos go crazy 🔥'},
      {user:'dorfits',      text:'where are the cargos from? been hunting that parachute fit'},
      {user:'yael_fits',    text:'cargos are vintage but dropped a similar pair in my closet'},
      {user:'urban.eli',    text:'size up on the tee next time and it’s a 10/10 fit'},
      {user:'samba.head',   text:'the cap ties the whole thing together ngl'},
      {user:'noya.k',       text:'this is the cleanest street fit on my feed today'},
      {user:'streetlab',    text:'fit is loud in the best way 🔥'},
      {user:'maor.t',       text:'how tall are you? trying to judge the cargo break'},
      {user:'yael_fits',    text:'5’7 — cargos hit right at the Sambas for reference ✨'},
    ],
    s3: [ // mika.thrift — secondhand mint: vintage shirt, mom jeans, shoulder bag
      {user:'vintage.ro',   text:'no WAY this is secondhand, the shirt looks brand new'},
      {user:'thriftwithme', text:'where did you find that shoulder bag?? it’s perfect'},
      {user:'mika.thrift',  text:'tiny local thrift! similar bag linked in my closet ✨'},
      {user:'eco.dana',     text:'the mom jeans wash is unreal for a thrift find 🔥'},
      {user:'secondhand.s', text:'this is why i trust your hauls every time'},
    ],
    s4: [ // shir.daily — sunday minimal: midi slip dress, ballet flats, mini bag
      {user:'sundaynoa',    text:'the slip dress + ballet flats is such a soft sunday combo'},
      {user:'flat.lover',   text:'what color is the midi dress exactly? screen reads sage?'},
      {user:'shir.daily',   text:'it’s a muted sage 🌿 linked the dress in my closet'},
      {user:'minimalist.m', text:'add a thin gold chain and it’s flawless'},
      {user:'gilad.ph',     text:'this is my favorite fit you’ve posted ⭐'},
      {user:'cafe.ksenia',  text:'the mini bag is so cute, where is it from?'},
      {user:'shir.daily',   text:'mini bag was a gift but found a near-match in my closet ✨'},
      {user:'roniii',       text:'soft girl sunday done right honestly'},
    ],
    s5: [ // agam.x — vintage: denim jacket, retro sunglasses, cowboy boots
      {user:'retro.tom',    text:'the denim jacket + cowboy boots combo is unreal 🔥'},
      {user:'vintagevicky', text:'where are the boots from?? been wanting a pair forever'},
      {user:'agam.x',       text:'boots are a vintage find — similar ones in my closet ✨'},
      {user:'denimdiary',   text:'the wash on that jacket is a perfect vintage blue'},
      {user:'sunny.lee',    text:'those retro shades complete the whole 70s thing'},
      {user:'oldsoul.r',    text:'this could be straight out of a film still'},
      {user:'maytal.k',     text:'saving for inspo, the layering is so good 🔥'},
      {user:'thrift.ari',   text:'how do you always find boots like these'},
      {user:'agam.x',       text:'patience + early saturdays at the market honestly'},
    ],
    s6: [ // dana.edit — office cute: blazer dress, loafers, structured bag
      {user:'work.tova',    text:'office but make it cute is EXACTLY this, the blazer dress ⭐'},
      {user:'corporate.k',  text:'where is the structured bag from? need a real work bag'},
      {user:'dana.edit',    text:'bag is older but linked a very close one in my closet ✨'},
      {user:'loaferlove',   text:'the loafers keep it sharp without trying too hard'},
      {user:'minimal.may',  text:'this is my whole monday mood now'},
      {user:'hilaaa',       text:'the tailoring on that blazer dress is so clean'},
      {user:'office.eden',  text:'what length is the dress? worried about a work dress code'},
      {user:'dana.edit',    text:'hits just above the knee — totally office-safe ✨'},
      {user:'quietlux.j',   text:'understated and expensive-looking, love it'},
    ],
    s7: [ // lia.threads — beach: bikini top, linen pants, straw hat
      {user:'beachbella',   text:'the linen pants over a bikini top is the perfect beach fit'},
      {user:'summer.noa',   text:'where are the linen pants from? need that exact drape'},
      {user:'lia.threads',  text:'linen pants are linked in my closet — so breezy ✨'},
      {user:'sandy.t',      text:'the straw hat is the cherry on top honestly 🔥'},
      {user:'coastalcore',  text:'this is going straight on my vacation moodboard'},
      {user:'mermaid.may',  text:'so effortless, you make beach dressing look easy'},
      {user:'rotem.s',      text:'what spf are we wearing for this gorgeous day ☀️'},
      {user:'lia.threads',  text:'50 always — protect the skin 💛 the hat helps too'},
      {user:'oceanic.k',    text:'saving this for my trip next week, obsessed'},
    ],
    s8: [ // emma.edit — business casual: blazer dress, pointed heels, croc tote
      {user:'office.eden',  text:'business casual done right, the pointed heels elevate it ⭐'},
      {user:'profesh.r',    text:'where is the croc tote from? need a polished work bag'},
      {user:'emma.edit',    text:'tote is a few seasons old — close match in my closet ✨'},
      {user:'tailored.t',   text:'the neutral palette reads so expensive'},
      {user:'monday.may',   text:'stealing this exact combo for interviews honestly'},
      {user:'hadas.k',      text:'the beige-on-beige is doing all the work, love it'},
      {user:'work.tova',    text:'are the heels comfy enough for a full office day?'},
      {user:'emma.edit',    text:'surprisingly yes — block-ish heel, i walk miles in them ✨'},
      {user:'classickara',  text:'this is the blueprint for first-day-of-work fits'},
    ],
    s9: [ // zara.fits — quiet luxury: camel wool coat, wide leg trousers, ballet flats
      {user:'quietlux.j',   text:'quiet luxury era indeed, what’s the coat fabric?'},
      {user:'zara.fits',    text:'it’s a cashmere-wool blend — linked a similar coat in my closet ✨'},
      {user:'minimal.may',  text:'the camel coat + cream trousers is pure elegance ⭐'},
      {user:'understated.s',text:'where are the ballet flats from? need that exact satin'},
      {user:'zara.fits',    text:'flats are old faithful — dropped a near-match in my closet'},
      {user:'sleek.noa',    text:'the tonal styling is so quietly expensive'},
      {user:'editorial.k',  text:'this looks like a campaign shot honestly ⭐'},
      {user:'tova.r',       text:'how warm is that coat for actual winter?'},
      {user:'zara.fits',    text:'genuinely toasty — the wool blend earns its keep ✨'},
    ],
    s10: [ // sport.mia — gym to brunch: sports bra, flare leggings, cropped hoodie
      {user:'fitwithdana',  text:'gym to brunch in one fit, the flare leggings are everything 🔥'},
      {user:'brunch.bex',   text:'where’s the set from? need those flare leggings'},
      {user:'sport.mia',    text:'set is linked in my closet — squat-proof i promise ✨'},
      {user:'movemore.m',   text:'the cropped hoodie makes it brunch-ready instantly'},
      {user:'lift.lia',     text:'love that this actually works for both, so smart'},
      {user:'activenoa',    text:'are the leggings high-waisted enough for squats?'},
      {user:'sport.mia',    text:'super high-waisted — they stay put through everything 🔥'},
    ],
  };

  // Idempotent: writes a post's baseline ONLY if that post has no stored entry
  // yet, so get/addComment all operate naturally on top of the baseline
  // (solves the toggle-drop trap — no merge math in getters needed). Safe to
  // call on every load. Uses the localStorage helpers below (hoisted fns).
  function seedFeedSocialProof() {
    try {
      const comments  = loadComments();
      let cChanged = false;
      Object.keys(FEED_COMMENTS_SEED).forEach(pid => {
        if (!comments[pid] || !comments[pid].length) {
          const n = FEED_COMMENTS_SEED[pid].length;
          comments[pid] = FEED_COMMENTS_SEED[pid].map((c, i) => ({
            id: 'seed_' + pid + '_' + i,
            user: c.user,
            text: c.text,
            // Deterministic, plausible spread: oldest first → newest last (render
            // iterates array order). minutes-ago shrinks as i grows so the LAST
            // comment is the most recent (~6m) and the first is oldest (~up to 2d).
            // The trailing - i*1000 keeps every ts strictly unique within a post.
            // Stamped once at first seed (idempotent localStorage cache).
            ts: Date.now() - Math.round((6 + (n - 1 - i) * (2880 / (n + 1))) * 60000) - i * 1000,
            seed: true,
          }));
          cChanged = true;
        }
      });
      if (cChanged) saveComments(comments);
    } catch (e) { /* seeding is additive; never block render */ }
  }

  function loadComments() {
    try { return JSON.parse(localStorage.getItem(COMMENTS_KEY) || '{}'); } catch(e) { return {}; }
  }
  function saveComments(c) { localStorage.setItem(COMMENTS_KEY, JSON.stringify(c)); }

  function getPostComments(postId) {
    const all = loadComments();
    return all[postId] || [];
  }

  function addComment(postId, text) {
    if (!text.trim()) return null;
    const all = loadComments();
    if (!all[postId]) all[postId] = [];
    const comment = { id: 'c' + Date.now() + '_' + Math.random().toString(36).slice(2,7), user: 'you', text: text.trim(), ts: Date.now() };
    all[postId].push(comment);
    saveComments(all);
    logAdminEvent('comment', postId + ': ' + text.slice(0,30));
    return comment;
  }

  function removeComment(postId, commentId) {
    const all = loadComments();
    if (!all[postId]) return;
    all[postId] = all[postId].filter(c => c.id !== commentId);
    saveComments(all);
  }

  // ---- comment rate limiting (client-side only) ----
  // This app has no logged-in-user id reaching the backend (comments are
  // stored keyed by postId in localStorage with a hardcoded 'you' author —
  // there's no session/auth concept at all), so true per-user server-side
  // limiting isn't possible without backend auth work that's out of scope
  // here. This throttles the local client to ≤3 comment posts per rolling
  // 60s window and surfaces a clear message instead of silently dropping.
  const COMMENT_RATE_LIMIT = 3;
  const COMMENT_RATE_WINDOW_MS = 60 * 1000;
  let _commentPostTimestamps = [];

  function isCommentRateLimited() {
    const now = Date.now();
    _commentPostTimestamps = _commentPostTimestamps.filter(t => now - t < COMMENT_RATE_WINDOW_MS);
    return _commentPostTimestamps.length >= COMMENT_RATE_LIMIT;
  }

  function recordCommentPost() {
    _commentPostTimestamps.push(Date.now());
  }

  // ---- report comment/post (client-side log only, no backend user model) ----
  function reportContent(kind, id, label) {
    logAdminEvent('report_' + kind, id + (label ? (': "' + label.slice(0,40) + '"') : '') + ' — reported by user');
    showToast("thanks, we'll review this");
  }

  // Claude-based comment moderation (language-agnostic, not a keyword filter).
  // Additive/async: the comment is already shown optimistically by the caller —
  // this never blocks or delays that. If the call is slow or fails, nothing
  // happens to the comment (fail open) per the moderation hard rule.
  async function moderateCommentAsync(postId, comment, host) {
    try {
      const res = await fetch('/api/moderate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: comment.text }),
      });
      const data = await res.json();
      if (data.severity === 'high') {
        removeComment(postId, comment.id);
        const node = (host || document).querySelector(`[data-comment-id="${comment.id}"]`);
        if (node) node.remove();
        _updateCommentCountBtn(postId);
        logAdminEvent('comment_hidden', postId + ': "' + comment.text.slice(0,40) + '" — severity high, removed by moderation');
      } else if (data.severity === 'medium') {
        logAdminEvent('comment_flagged', postId + ': "' + comment.text.slice(0,40) + '" — severity medium, visible, flagged for review');
      }
    } catch (e) {
      // Fail open: comment stays visible, no admin event needed beyond the
      // backend's own fallback logging — moderation being unreachable must
      // never silently block or remove a comment.
    }
  }

  // Global comments bottom sheet — single instance, reused per post
  let _commentsSheet = null;
  let _commentsPostId = null;

  function ensureCommentsSheet() {
    if (_commentsSheet) return _commentsSheet;
    const sheet = document.createElement('div');
    sheet.className = 'comments-sheet';
    sheet.innerHTML = `
      <div class="comments-sheet-handle"></div>
      <div class="cs-title-row">
        <div class="comments-sheet-title">Comments</div>
        <button class="mp-fsheet-x cs-close-btn" aria-label="Close"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button>
      </div>
      <div class="cs-list"></div>
      <div class="fc-comment-input-row">
        <input class="fc-comment-input" placeholder="Add a comment..." maxlength="500" />
        <button class="fc-comment-send">Send</button>
      </div>`;
    document.body.appendChild(sheet);
    sheet.querySelector('.cs-close-btn').addEventListener('click', closeCommentsSheet);

    sheet.querySelector('.fc-comment-send').addEventListener('click', async () => {
      const input = sheet.querySelector('.fc-comment-input');
      if (!input.value.trim() || !_commentsPostId) return;
      if (isCommentRateLimited()) {
        showToast("you're commenting too fast, wait a moment");
        return;
      }
      const postId = _commentsPostId;
      // Backend caps text at 500 chars; trim client-side so we never POST a
      // body the server will reject for length.
      const text = input.value.trim().slice(0, 500);

      // Optimistic display — show comment immediately before API responds.
      const localComment = addComment(postId, text);
      if (!localComment) return;
      recordCommentPost();
      // Reuse _commentItemHTML so the optimistic row matches the seeded rows
      // exactly (avatar column + body). The author is 'you' (the comment's
      // user), never the look creator, so no creator highlight applies.
      const _tmp = document.createElement('div');
      _tmp.innerHTML = _commentItemHTML(localComment, _postCreatorHandle(postId));
      const newItem = _tmp.firstElementChild;
      // Repaint the avatar fallback now (the data: img onerror fires on insert).
      const csList = sheet.querySelector('.cs-list');
      // Remove "No comments yet" placeholder if present.
      const placeholder = csList.querySelector('div:not(.fc-comment-item)');
      if (placeholder) placeholder.remove();
      csList.appendChild(newItem);
      input.value = '';

      // Update the comment count on the feed action-bar button for this post
      // (and the legacy data-comment-open button if it's ever rendered).
      _updateCommentCountBtn(postId);

      // POST to API — persists the comment server-side. The server runs
      // moderation: a harmful comment comes back as 400 "content rejected".
      // On 400 we roll back the optimistic row + toast; on network failure we
      // fail open (comment survives in localStorage) per the moderation rule.
      try {
        const res = await fetch(`/api/posts/${encodeURIComponent(postId)}/comments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
        });
        if (res.status === 400) {
          // Rejected by server-side moderation — undo the optimistic insert.
          removeComment(postId, localComment.id);
          newItem.remove();
          _updateCommentCountBtn(postId);
          if (!csList.querySelector('.fc-comment-item')) {
            csList.innerHTML = `<div style="color:rgba(255,255,255,.35);font-size:var(--t-small);padding:12px 0">No comments yet</div>`;
          }
          showToast("Comment couldn't be posted");
          logAdminEvent('comment_rejected', postId + ': "' + text.slice(0,40) + '" — rejected by server moderation (400)');
          return;
        }
      } catch (_e) {
        // API unreachable — comment survives in localStorage only.
      }

      // Belt-and-suspenders: the /api/moderate path (used when the POST above
      // fails open, e.g. no API key on the comments endpoint) still runs async
      // and removes a high-severity comment after the fact.
      moderateCommentAsync(postId, localComment, csList);
    });

    // Report a single comment — tap anywhere in the list, delegate to the flag button
    sheet.querySelector('.cs-list').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-report-comment]');
      if (!btn) return;
      e.stopPropagation();
      const commentId = btn.dataset.reportComment;
      const item = btn.closest('.fc-comment-item');
      const text = item ? item.querySelector('.fc-comment-text')?.textContent : '';
      reportContent('comment', commentId, text || '');
    });

    // Close on backdrop tap
    sheet.addEventListener('click', (e) => {
      if (e.target === sheet) closeCommentsSheet();
    });
    document.addEventListener('click', (e) => {
      if (_commentsSheet && _commentsSheet.classList.contains('open') &&
          !_commentsSheet.contains(e.target) &&
          !e.target.closest('[data-comment-open]')) {
        closeCommentsSheet();
      }
    });

    _commentsSheet = sheet;
    return sheet;
  }

  // The look creator's handle for a given post id (so a creator's own reply
  // can be highlighted in the comments). SEED_POSTS is the live feed array
  // (API data is prepended into it at load).
  function _postCreatorHandle(postId) {
    try {
      const p = SEED_POSTS.find(p => p.id === postId);
      return p ? (p.user || p.handle || '') : '';
    } catch (e) { return ''; }
  }

  // Relative time for comments — takes epoch ms (our comment ts), NOT an ISO
  // string like dmTimeAgo. Mirrors dmTimeAgo's thresholds/labels. Legacy/seed
  // rows carry ts:0 → returns '' so we render NOTHING (never a false "now").
  function commentTimeAgo(ts) {
    if (!ts || ts <= 0 || isNaN(ts)) return '';
    const sec = Math.max(0, Math.floor((Date.now() - ts) / 1000));
    if (sec < 60)       return 'now';
    const min = Math.floor(sec / 60); if (min < 60) return min + 'm';
    const hr  = Math.floor(min / 60); if (hr  < 24) return hr  + 'h';
    const day = Math.floor(hr / 24);  if (day < 7)  return day + 'd';
    return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  // Renders a single comment item — used by both openCommentsSheet and the
  // optimistic send path so the DOM structure is always identical.
  // creatorHandle: the look's creator handle for the open post — when the
  // comment author matches it, the row is highlighted + badged so the
  // ask→answer shop-the-look loop pops.
  function _commentItemHTML(c, creatorHandle) {
    const handle = c.user_key || c.user || 'you';
    const username = '@' + esc(handle.split('.').join(''));
    const isCreator = !!creatorHandle && handle === creatorHandle;
    const badge = isCreator ? `<span class="fc-comment-creator-badge">Creator</span>` : '';
    const time = commentTimeAgo(c.ts);
    // Initials avatar rendered INLINE (not via <img onerror=avatarFallback>):
    // a valid src never fires onerror, so the fallback never painted. Same
    // initials rule avatarFallback() uses — split on [ .@], first 2 words.
    const initials = handle.split(/[ .@]/).filter(Boolean).slice(0,2).map(w=>w[0]).join('').toUpperCase() || '?';
    return `<div class="fc-comment-item${isCreator?' fc-comment-item--creator':''}" data-comment-id="${esc(c.id||'')}">
      <span class="fc-comment-avatar avatar-fallback">${esc(initials)}</span>
      <div class="fc-comment-body">
        <div class="fc-comment-row">
          <div class="fc-comment-meta">
            <div class="fc-comment-user">${username}${badge}</div>
            ${time ? `<span class="fc-comment-time" dir="ltr">${esc(time)}</span>` : ''}
          </div>
          <button class="fc-comment-report" data-report-comment="${esc(c.id||'')}" aria-label="Report comment">${icon('flag',14)}</button>
        </div>
        <div class="fc-comment-text">${esc(c.text)}</div>
      </div>
    </div>`;
  }

  // Opens the comments bottom sheet for postId.
  // API-first: fetches GET /api/posts/{id}/comments (200ms timeout fallback).
  // Falls back to localStorage if the API is unreachable.
  async function openCommentsSheet(postId) {
    const sheet = ensureCommentsSheet();
    _commentsPostId = postId;
    const list = sheet.querySelector('.cs-list');
    const creatorHandle = _postCreatorHandle(postId);
    // Show sheet immediately with local data (instant feel), then refresh from API.
    const localComments = getPostComments(postId);
    list.innerHTML = localComments.length
      ? localComments.map(c => _commentItemHTML(c, creatorHandle)).join('')
      : `<div style="color:rgba(255,255,255,.35);font-size:var(--t-small);padding:12px 0">No comments yet</div>`;
    sheet.classList.add('open');

    // Async API fetch — MERGES server comments ABOVE the local/seeded view.
    // Trap: in the demo the backend store is EMPTY, so a naive "replace with
    // API result" wipes the seeded conversation and shows "No comments yet".
    // Rule: empty API response → KEEP the seed; non-empty → server items
    // (newest-first) ABOVE the seed, de-duped so a user's own comment that
    // round-tripped to the server isn't shown twice.
    try {
      const res = await fetch(`/api/posts/${encodeURIComponent(postId)}/comments`);
      if (res.ok) {
        const data = await res.json();
        const apiItems = data.items || [];
        if (apiItems.length) {
          const local = getPostComments(postId);
          const apiTexts = new Set(apiItems.map(c => (c.text || '').trim()));
          const merged = apiItems.concat(local.filter(c => !apiTexts.has((c.text || '').trim())));
          list.innerHTML = merged.map(c => _commentItemHTML(c, creatorHandle)).join('');
        }
        // apiItems empty → do nothing: the seeded/local view stays on screen.
      }
    } catch (_e) {
      // API unreachable — local/seeded data already shown, keep it.
    }
  }

  function closeCommentsSheet() {
    if (_commentsSheet) _commentsSheet.classList.remove('open');
    _commentsPostId = null;
  }

  // Repaint the comment count on the feed action-bar button (data-action=
  // "comment") for a post, plus the legacy [data-comment-open] button if it's
  // present. Count 0 → no badge (matches feedCardHTML's initial render).
  function _updateCommentCountBtn(postId) {
    const cnt = getPostComments(postId).length;
    document.querySelectorAll(`.fca-btn[data-action="comment"][data-id="${postId}"]`).forEach(btn => {
      let badge = btn.querySelector('.fca-count');
      if (cnt) {
        if (!badge) { badge = document.createElement('span'); badge.className = 'fca-count'; btn.appendChild(badge); }
        badge.textContent = String(cnt);
      } else if (badge) {
        badge.remove();
      }
    });
    const legacy = document.querySelector(`[data-comment-open="${postId}"]`);
    if (legacy) legacy.innerHTML = cnt ? `${icon('chat',16)} ${cnt}` : icon('chat',16);
  }

  // Per-card "more" button on feed posts (Shira) — currently exposes only
  // "block this user". Additional per-post moderation actions (e.g. report)
  // can hang off this same icon/handler later without changing the binding.
  function bindFeedMoreMenu(host) {
    host.querySelectorAll('.fc-more-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const userHandle = btn.dataset.moreUser;
        if (!userHandle) return;
        // Feed cards no longer expose Block directly (too accessible) — Report only.
        // Block lives in the user's profile (...) menu, demoted under Report.
        reportContent('user', userHandle, '@' + userHandle);
      });
    });
  }

  // Seed demo social proof once everything it depends on (COMMENTS_KEY
  // const + load/save helpers) is initialized above. Runs
  // synchronously before the deferred showView('feed') rAF fires, so the very
  // first render reads the seeded counts. Idempotent — safe on every load.
  seedFeedSocialProof();

  // Seen-state persists per-story-id but resets daily (stories are ephemeral —
  // yesterday's "seen" is meaningless once today's stories replace them).
  function _todayKey(){ const d=new Date(); return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate(); }
  let seenStories = (function(){
    try{ const raw=JSON.parse(localStorage.getItem('awear_stories_seen')||'{}');
      if(raw && raw.date===_todayKey() && Array.isArray(raw.ids)) return new Set(raw.ids);
    }catch(e){}
    return new Set();
  })();
  function _persistSeen(){ localStorage.setItem('awear_stories_seen', JSON.stringify({date:_todayKey(), ids:[...seenStories]})); }
  // IDs of stories *I* posted (so the viewer can offer delete on owner-only rows).
  let myStoryIds = (function(){ try{ return new Set(JSON.parse(localStorage.getItem('awear_my_stories')||'[]')); }catch(e){ return new Set(); } })();
  function _rememberMyStory(id){ myStoryIds.add(id); localStorage.setItem('awear_my_stories', JSON.stringify([...myStoryIds])); }
  function _forgetMyStory(id){ myStoryIds.delete(id); localStorage.setItem('awear_my_stories', JSON.stringify([...myStoryIds])); }

  // storyBatches: one entry per user with active stories — { key, name, initials, avatar, items:[story,...] }.
  // Newest user first; items newest-first within a batch.
  let storyBatches = [];

  function _initialsFor(name){
    return (name||'').split(/\s+/).map(w=>w[0]).filter(Boolean).slice(0,2).join('').toUpperCase() || 'YOU';
  }

  // Group flat /api/stories items by user_key into batches, newest user first.
  function _groupStories(items){
    const order=[]; const map={};
    items.forEach(it=>{
      const k=it.user_key||'anon';
      if(!map[k]){ map[k]={key:k, name:k, initials:_initialsFor(k), avatar:null, items:[]}; order.push(k); }
      map[k].items.push(it);
    });
    return order.map(k=>map[k]);
  }

  // Fallback batches from the demo seed (one fake story each) — never empty bar.
  function _seedBatches(){
    return STORIES_SEED.map(s=>({
      key:'seed_'+s.id, name:s.name, initials:s.initials, avatar:s.avatar,
      items:[{id:s.id, image_url:s.avatar, caption:'', created_at:null, _seed:true}]
    }));
  }

  async function loadStories(){
    try{
      const res = await fetch('/api/stories');
      if(!res.ok) throw new Error('status '+res.status);
      const data = await res.json();
      const items = (data&&data.items)||[];
      storyBatches = items.length ? _groupStories(items) : _seedBatches();
    }catch(e){
      // graceful fallback — bar is never empty in demo
      storyBatches = _seedBatches();
    }
    const bar = document.querySelector('#feed-scroll .stories-bar');
    if(bar) bar.replaceWith(renderStories());
  }

  function renderStories(){
    const bar = document.createElement('div');
    bar.className = 'stories-bar';
    // First item: Add story (post today's outfit).
    let html = `<div class="story-item" data-add="1">
        <div class="story-ring add"><div class="story-inner"><span class="story-add-glyph">${icon('plus',22)}</span></div></div>
        <span class="story-name">${esc('Your story')}</span>
      </div>`;
    html += storyBatches.map((b,idx)=>{
      // A batch is "seen" only when every story in it has been viewed.
      const seen = b.items.every(it=>seenStories.has(String(it.id)));
      const cover = b.items[0] && b.items[0].image_url;
      const inner = cover
        ? `<div class="story-inner"><span class="story-initials">${esc(b.initials||'')}</span><img src="${attr(cover)}" alt="${attr(b.name)}" loading="eager" onerror="this.onerror=null;this.remove()"></div>`
        : `<div class="story-inner"><span class="story-initials">${esc(b.initials||'')}</span></div>`;
      return `<div class="story-item" data-batch="${idx}">
        <div class="story-ring${seen?' seen':''}">${inner}</div>
        <span class="story-name">${esc(b.name)}</span>
      </div>`;
    }).join('');
    bar.innerHTML = html;
    bar.addEventListener('click',e=>{
      const item=e.target.closest('.story-item');
      if(!item) return;
      if(item.dataset.add!=null){ addStory(); return; }
      const idx=parseInt(item.dataset.batch,10);
      if(!isNaN(idx)) openStoryViewer(idx);
    });
    return bar;
  }

  // ---- Add story: reuse an existing image (most recent of my feed posts /
  // captured look / closet item) — no camera flow. ----
  function _myLatestImage(){
    try{
      const feed = (typeof loadFeedPosts==='function') ? loadFeedPosts() : [];
      const withPhoto = feed.find(p=>p && p.photo);
      if(withPhoto) return withPhoto.photo;
    }catch(e){}
    try{ const scan=JSON.parse(localStorage.getItem('awear_last_scan')||'null'); if(scan&&scan.photo) return scan.photo; }catch(e){}
    try{ const w=JSON.parse(localStorage.getItem('awear_wardrobe')||'[]'); const it=w.find(i=>i&&i.img); if(it) return it.img; }catch(e){}
    return null;
  }

  async function addStory(){
    const image_url=_myLatestImage();
    if(!image_url){ showToast('Capture or save a look first to share a story'); return; }
    showToast('Sharing your story...');
    try{
      const res=await fetch('/api/stories',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({image_url, caption:"Today's look"})});
      if(!res.ok) throw new Error('status '+res.status);
      const created=await res.json();
      if(created&&created.id!=null) _rememberMyStory(String(created.id));
      showToast('Your story is live for 24h');
      await loadStories();
    }catch(e){
      showToast('Could not share story — try again');
    }
  }

  // ---- Full-screen story viewer (progress bars, tap nav, auto-advance, delete) ----
  let _storyTimer=null;
  function openStoryViewer(batchIdx){
    const batch=storyBatches[batchIdx]; if(!batch||!batch.items.length) return;
    let i=0;
    const ov=document.createElement('div');
    ov.className='story-viewer';
    ov.id='story-viewer-el';
    document.body.appendChild(ov);

    function close(){ if(_storyTimer){clearTimeout(_storyTimer);_storyTimer=null;} ov.remove(); document.removeEventListener('keydown',onKey); }
    function markSeen(it){ seenStories.add(String(it.id)); _persistSeen(); }
    function fmtTime(ts){ if(!ts) return ''; const diff=Date.now()-new Date(ts).getTime();
      const h=Math.floor(diff/3600000); if(h>=1) return h+'h'; const m=Math.max(1,Math.floor(diff/60000)); return m+'m'; }

    function paint(){
      const it=batch.items[i];
      markSeen(it);
      const mine=myStoryIds.has(String(it.id)) && !it._seed;
      const bars=batch.items.map((_,k)=>`<div class="story-viewer-bar${k<i?' done':''}${k===i?' active':''}"><i></i></div>`).join('');
      ov.innerHTML=`
        <img class="story-viewer-img" src="${attr(it.image_url)}" alt="" onerror="this.style.opacity=0">
        <div class="story-viewer-bars">${bars}</div>
        <div class="story-viewer-head">
          <div class="story-viewer-ava">${batch.avatar?`<img src="${attr(batch.avatar)}" alt="">`:esc(batch.initials||'')}</div>
          <div>
            <div class="story-viewer-name">${esc(batch.name)}</div>
            <div class="story-viewer-time">${esc(fmtTime(it.created_at))}</div>
          </div>
          ${mine?`<button class="story-viewer-del" data-del="${attr(it.id)}" aria-label="Delete story">${icon('trash',20)}</button>`:''}
          <button class="story-viewer-close" aria-label="Close" data-close="1">${icon('x',22)}</button>
        </div>
        ${it.caption?`<div class="story-viewer-cap">${esc(it.caption)}</div>`:''}
        <div class="story-viewer-tap prev" data-prev="1"></div>
        <div class="story-viewer-tap next" data-next="1"></div>`;
      // Drive the active progress bar + auto-advance (5s per story).
      const active=ov.querySelector('.story-viewer-bar.active > i');
      if(active){ active.style.animationDuration='5000ms'; }
      if(_storyTimer) clearTimeout(_storyTimer);
      _storyTimer=setTimeout(next,5000);
    }
    function next(){ if(i<batch.items.length-1){ i++; paint(); } else { close(); } }
    function prev(){ if(i>0){ i--; paint(); } }

    async function del(id){
      try{
        const res=await fetch('/api/stories/'+encodeURIComponent(id),{method:'DELETE'});
        if(!res.ok) throw new Error('status '+res.status);
        _forgetMyStory(String(id));
        showToast('Story deleted');
        close();
        await loadStories();
      }catch(e){ showToast('Could not delete story'); }
    }

    ov.addEventListener('click',e=>{
      if(e.target.closest('[data-close]')){ close(); return; }
      const delBtn=e.target.closest('[data-del]');
      if(delBtn){ del(delBtn.dataset.del); return; }
      if(e.target.closest('[data-prev]')){ prev(); return; }
      if(e.target.closest('[data-next]')){ next(); return; }
    });
    // Swipe-down to dismiss.
    let startY=null;
    ov.addEventListener('touchstart',e=>{ startY=e.touches[0].clientY; },{passive:true});
    ov.addEventListener('touchend',e=>{ if(startY!=null && e.changedTouches[0].clientY-startY>80) close(); startY=null; });
    function onKey(e){ if(e.key==='Escape') close(); else if(e.key==='ArrowRight') next(); else if(e.key==='ArrowLeft') prev(); }
    document.addEventListener('keydown',onKey);

    paint();
  }

  // ---- Following empty state ----
  function renderFollowingEmpty(){
    const div = document.createElement('div');
    div.className = 'feed-empty';
    div.innerHTML = `<div class="big" style="display:flex;justify-content:center">${icon('heart',50)}</div>
      <p style="margin-top:14px;font-size: var(--t-h3,15px);font-weight:800;color:var(--text)">You're not following anyone yet</p>
      <p style="margin-top:8px;font-size:var(--t-small);color:var(--muted);line-height:1.6">Head to the "For You" feed, discover looks<br/>and tap a username to follow</p>`;
    return div;
  }

  // patch renderFeed to support tabs + stories
  const _origRenderFeed = renderFeed;
  renderFeed = function(){
    const host=document.getElementById('feed-scroll'); if(!host) return;
    host.innerHTML='';
    if(activeTab==='following'){
      _renderFollowingTab(host); return;
    }
    host.appendChild(renderStories());
    _origRenderFeed.call(this);
  };

  function _renderFollowingTab(host){
    LIKES=loadSet('awear_likes'); SAVED=loadSet('awear_saved');
    const followed=SEED_POSTS.filter(p=>p.userId&&followState[p.userId]&&!isBlocked(p.user));
    if(!followed.length){ host.appendChild(renderFollowingEmpty()); return; }
    followed.forEach(post=>{
      const wrap=document.createElement('div');
      wrap.innerHTML=feedCardHTML(post,false);
      host.appendChild(wrap.firstElementChild);
    });
    bindFeedMoreMenu&&bindFeedMoreMenu(host);
  }

  // override: renderFeed adds cards to host — we need stories first
  // Re-implement cleanly:
  renderFeed = function(){
    const host=document.getElementById('feed-scroll'); if(!host) return;
    LIKES=loadSet('awear_likes'); SAVED=loadSet('awear_saved');
    host.innerHTML='';
    if(activeTab==='following'){
      _renderFollowingTab(host); return;
    }
    host.appendChild(renderStories());
    loadStories(); // async: swaps the seed/empty bar for real active (≤24h) stories
    loadFeedPosts().forEach(p=>{
      const wrap=document.createElement('div');
      wrap.innerHTML=feedCardHTML({...p,id:p.id||'mine_'+p.ts,user:'you',
        grad:p.photo?null:'linear-gradient(160deg,#a18cd1,#fbc2eb)',img:p.photo||null,tags:p.tags||[],trend:95},true);
      host.appendChild(wrap.firstElementChild);
    });
    let seeds=SEED_POSTS.filter(p=>!isBlocked(p.user));
    if(!activeFilters.has('all')) seeds=seeds.filter(p=>(p.tags||[]).some(t=>activeFilters.has(t)));
    // "For You" is personalized to your wardrobe (formerly the separate "Your Match" tab —
    // merged in so there's one discovery feed, not two confusingly-similar ones).
    const wardrobe=JSON.parse(localStorage.getItem('awear_wardrobe')||'[]');
    if(wardrobe.length){
      const wardTags=new Set(wardrobe.flatMap(i=>(i.style_tags||[]).map(t=>t.toLowerCase())));
      seeds=[...seeds].sort((a,b)=>{
        const aMatch=(a.tags||[]).filter(t=>wardTags.has(t.toLowerCase())).length;
        const bMatch=(b.tags||[]).filter(t=>wardTags.has(t.toLowerCase())).length;
        return bMatch-aMatch;
      });
    }
    if(!seeds.length&&!loadFeedPosts().length){
      const em=document.createElement('div');em.className='feed-empty';
      em.innerHTML=`<div class="big" style="display:flex;justify-content:center">${icon('search',50)}</div><p>No looks in this style yet</p>`;
      host.appendChild(em); return;
    }
    seeds.forEach(post=>{const wrap=document.createElement('div');wrap.innerHTML=feedCardHTML(post,false);host.appendChild(wrap.firstElementChild);});
    bindFeedMoreMenu(host);
  };

  // ── Skeleton helpers ──────────────────────────────────────────────────────
  // Returns HTML for a single product card skeleton (matches sf-card / wardrobe card)
  function skeletonCard() {
    return `<div class="skeleton skeleton-card" aria-hidden="true"></div>`;
  }

  // Returns HTML for a full feed card skeleton (header + image + text lines)
  function skeletonFeedCard() {
    return `
      <div class="feed-card" style="padding:16px" aria-hidden="true">
        <div style="display:flex;gap:10px;align-items:center;margin-bottom:12px">
          <div class="skeleton skeleton-avatar"></div>
          <div style="flex:1;display:flex;flex-direction:column;gap:6px">
            <div class="skeleton skeleton-text" style="width:42%"></div>
            <div class="skeleton skeleton-text xshort"></div>
          </div>
        </div>
        <div class="skeleton skeleton-card"></div>
        <div class="skeleton skeleton-text" style="margin-top:12px;width:80%"></div>
        <div class="skeleton skeleton-text short"></div>
      </div>`;
  }

  // ---- Async data init: fetch JSON data files and wire into app arrays ----
  // Runs after DOM ready; falls back to hardcoded seeds if fetch fails (no silent errors).
  (async function initDataFromFiles() {
    // Show skeletons immediately — frame 1, before any fetch
    const feedHost = document.getElementById('feed-scroll');
    if (feedHost) {
      feedHost.innerHTML = Array(6).fill(0).map(() => skeletonFeedCard()).join('');
    }
    const shopGrid = document.getElementById('sf-grid');
    if (shopGrid) {
      shopGrid.innerHTML = Array(8).fill(0).map(() => skeletonCard()).join('');
    }

    try {
      const [feedData, productData] = await Promise.all([
        loadFeedData(),
        loadProducts()
      ]);

      if (feedData && feedData.length) {
        // Prepend JSON posts before hardcoded seed posts so real data comes first
        SEED_POSTS = [...feedData, ...SEED_POSTS];
        console.info('[AWEAR] feed loaded from JSON:', feedData.length, 'posts. Total:', SEED_POSTS.length);
      } else {
        console.warn('[AWEAR] loadFeedData returned null — using hardcoded SEED_POSTS (' + SEED_POSTS.length + ' posts)');
      }

      if (productData && productData.length) {
        // Prepend JSON products to SHOP_SEED so explore/shop shows real data
        SHOP_SEED = [...productData, ...SHOP_SEED];
        console.info('[AWEAR] products loaded from JSON:', productData.length, 'products. Total:', SHOP_SEED.length);
      } else {
        console.warn('[AWEAR] loadProducts returned null — using hardcoded SHOP_SEED (' + SHOP_SEED.length + ' products)');
      }
    } catch(e) {
      // Outer safety net — should never reach here since both loaders catch internally
      console.error('[AWEAR] initDataFromFiles unexpected error:', e.message);
    } finally {
      // Always render — with real data or fallback
      renderCloset();
      renderFeed();
    }
  })();

  // ===== ADMIN DASHBOARD =====
  const ADMIN_LOG_KEY = 'awear_admin_log';

  function logAdminEvent(type, label) {
    try {
      const log = JSON.parse(localStorage.getItem(ADMIN_LOG_KEY) || '[]');
      log.unshift({type, label, ts: Date.now()});
      if (log.length > 200) log.length = 200;
      localStorage.setItem(ADMIN_LOG_KEY, JSON.stringify(log));
    } catch(e) {}
  }

  function renderAdminDashboard() {
    const el = document.getElementById('adm-wrap');
    if (!el) return;
    const wardrobe = JSON.parse(localStorage.getItem('awear_wardrobe') || '[]');
    const shelf    = JSON.parse(localStorage.getItem('awear_shelf') || '[]');
    const mp       = JSON.parse(localStorage.getItem('awear_marketplace') || '[]');
    const log      = JSON.parse(localStorage.getItem(ADMIN_LOG_KEY) || '[]');
    const rwData   = JSON.parse(localStorage.getItem(RW_KEY) || '{"points":0,"actions":{}}');
    const today    = new Date().toDateString();
    const todayEvts= log.filter(e => new Date(e.ts).toDateString() === today);
    const d7Evts   = log.filter(e => Date.now() - e.ts < 7*24*60*60*1000);
    const wardValue= wardrobe.reduce((s,i)=>s+(i.price_estimate_usd||0),0);
    const totalW   = wardrobe.reduce((s,i)=>s+(i.wear_count||0),0);
    const scanEvts = log.filter(e=>e.type==='scan').length;
    const ogEvts   = log.filter(e=>e.type==='outfit_gen').length || ((rwData.actions&&rwData.actions.wore)||0);
    const buyEvts  = log.filter(e=>e.type==='buy_intent').length;
    const unworn   = wardrobe.filter(i=>(i.wear_count||0)===0).length;
    const reuseR   = wardrobe.length>0?Math.round(((wardrobe.length-unworn)/wardrobe.length)*100):0;
    const avgCPW   = totalW>0?wardValue/totalW:0;
    const cpwScore = avgCPW>0?Math.min(30,30*(50/avgCPW)):0;
    const susScore = Math.round((reuseR/100)*40+cpwScore+Math.min(30,mp.length*6));
    const susGrade = susScore>=80?'A':susScore>=60?'B':susScore>=40?'C':'D';
    const susColor = susScore>=80?'var(--success)':susScore>=60?'var(--success)':susScore>=40?'var(--warning)':'var(--danger)';
    const catMap   = {};
    wardrobe.forEach(i=>{const c=catLabel(i.category||'other');catMap[c]=(catMap[c]||0)+1;});
    const topCats  = Object.entries(catMap).sort((a,b)=>b[1]-a[1]).slice(0,5);
    const maxCat   = topCats[0]?.[1]||1;
    const kpis = [
      {icon:'user',num:todayEvts.length>0?'1':'0',label:'DAU',sub:`D7: ${d7Evts.length} actions`},
      {icon:'coins',num:wardValue>999?'$'+(wardValue/1000).toFixed(1)+'K':'$'+wardValue,label:'Wardrobe Value',sub:`${wardrobe.length} items`},
      {icon:'camera',num:wardrobe.length,label:'Items Scanned',sub:`${scanEvts} scans`},
      {icon:'sparkle',num:ogEvts,label:'Outfit Gens',sub:'AI generator'},
      {icon:'receipt',num:totalW>0?'$'+Math.round(wardValue/totalW):'—',label:'CPW Avg',sub:`${totalW} wears`},
      {icon:'cart',num:shelf.length+mp.length,label:'For Sale',sub:`${buyEvts} buy intents`},
    ];
    const recentLog = log.slice(0,10);
    el.innerHTML = `
      <div class="adm-header"><div class="adm-title" style="display:flex;align-items:center;gap:8px">${icon('barChart',20)} Admin Dashboard</div><div class="adm-badge">INTERNAL</div></div>
      <div class="adm-kpi-grid">${kpis.map(k=>`<div class="adm-kpi"><div class="adm-kpi-icon">${icon(k.icon,20)}</div><div class="adm-kpi-num">${esc(String(k.num))}</div><div class="adm-kpi-label">${esc(k.label)}</div><div class="adm-kpi-sub">${esc(k.sub)}</div></div>`).join('')}</div>
      <div class="adm-section"><div class="adm-sec-title" style="display:inline-flex;align-items:center;gap:6px">${icon('leaf',16)} Sustainability</div></div>
      <div class="adm-grade-card"><div class="adm-grade-letter" style="color:${susColor}">${susGrade}</div><div class="adm-grade-info"><div class="adm-grade-label">${susScore}/100</div><div class="adm-grade-sub">Reuse: ${reuseR}% · Sold: ${mp.length} · CPW: $${Math.round(avgCPW)||'—'}</div></div></div>
      <div class="adm-section"><div class="adm-sec-title" style="display:inline-flex;align-items:center;gap:6px">${icon('hanger',16)} Categories</div>${topCats.length?topCats.map(([cat,cnt])=>`<div class="adm-bar-row"><div class="adm-bar-lbl">${esc(cat)}</div><div class="adm-bar-track"><div class="adm-bar-fill" style="width:${Math.round((cnt/maxCat)*100)}%"></div></div><div class="adm-bar-val">${cnt}</div></div>`).join(''):'<div style="color:var(--muted);font-size:var(--t-small)">Empty closet</div>'}</div>
      <div class="adm-section"><div class="adm-sec-title" style="display:inline-flex;align-items:center;gap:6px">${icon('list',16)} Event Log</div>${recentLog.length?recentLog.map(e=>{const t=new Date(e.ts).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'});return`<div class="adm-event-row"><div class="adm-ev-dot"></div><div class="adm-ev-text">${esc(e.label)}</div><div class="adm-ev-time">${t}</div></div>`;}).join(''):'<div style="color:var(--muted);font-size:var(--t-small);padding:12px 0">No events yet</div>'}</div>
      <div class="adm-export-row"><button class="adm-export-btn primary" onclick="adminExportCSV()" style="display:inline-flex;align-items:center;gap:6px">${icon('arrowUp',15)} Export CSV</button><button class="adm-export-btn secondary" onclick="adminClearLog()" style="display:inline-flex;align-items:center;gap:6px">${icon('alert',15)} Reset Log</button></div>
    `;
  }

  function adminExportCSV() {
    const wardrobe = JSON.parse(localStorage.getItem('awear_wardrobe')||'[]');
    const headers  = ['name','category','color','price_estimate_usd','wear_count'];
    const rows     = wardrobe.map(i=>headers.map(h=>JSON.stringify(i[h]??'')).join(','));
    const csv      = [headers.join(','),...rows].join('\n');
    const blob     = new Blob([csv],{type:'text/csv;charset=utf-8;'});
    const url      = URL.createObjectURL(blob);
    const a        = document.createElement('a');
    a.href=url;a.download='awear_wardrobe.csv';a.click();
    URL.revokeObjectURL(url);
    showToast('CSV exported');
  }

  function adminClearLog() {
    localStorage.removeItem(ADMIN_LOG_KEY);
    renderAdminDashboard();
    showToast('Log cleared');
  }

  if (new URLSearchParams(location.search).get('admin')==='1') showView('admin');

  // ===== STYLIST MARKETPLACE =====
  const STYLISTS_SEED = [
    {id:'st1', name:'Maya Cohen',   avatar_bg:'linear-gradient(135deg,#f472b6,#a855f7)', spec:'Y2K & Streetwear',     price:'$40/hr', tags:['Y2K','Streetwear','Gen-Z'],          avail:true,  rating:'4.9', sessions:234},
    {id:'st2', name:'Noa Levi',     avatar_bg:'linear-gradient(135deg,#818cf8,#6366f1)', spec:'Minimal & Elegant',    price:'$55/hr', tags:['Minimal','Business','Bridal'],       avail:true,  rating:'5.0', sessions:189},
    {id:'st3', name:'Shira Bar',    avatar_bg:'linear-gradient(135deg,var(--card),var(--bg))',   spec:'Dark & Edgy',          price:'$32/hr', tags:['Edgy','Rock','Alternative'],         avail:false, rating:'4.7', sessions:98},
    {id:'st4', name:'Tamar Raz',    avatar_bg:'linear-gradient(135deg,#f9a8d4,var(--accent2))', spec:'Cottage Core & Boho',  price:'$35/hr', tags:['Cottage Core','Boho','Romantic'],    avail:true,  rating:'4.8', sessions:156},
    {id:'st5', name:'Dana Katz',    avatar_bg:'linear-gradient(135deg,#0ea5e9,#6366f1)', spec:'Corporate & Power',    price:'$68/hr', tags:['Business','Formal','Power Dressing'],avail:true,  rating:'4.9', sessions:312},
    {id:'st6', name:'Lior Mizrahi', avatar_bg:'linear-gradient(135deg,var(--accent2),var(--accent))', spec:'Trendy & Bold', price:'$48/hr', tags:['Trendy','Bold','Going Out'],         avail:false, rating:'4.6', sessions:77},
  ];

  function renderStylistMarketplace() {
    const el = document.getElementById('styl-wrap');
    if (!el) return;
    el.innerHTML = `
      <div class="styl-header">
        <div class="styl-title" style="display:flex;align-items:center;gap:8px">${icon('users',20)} Stylists</div>
        <div class="styl-sub">Book a personal session with a pro stylist</div>
      </div>
      <div class="styl-grid">
        ${STYLISTS_SEED.map(s => `
          <div class="styl-card">
            <div class="styl-top">
              <div class="styl-avatar" style="background:${s.avatar_bg}">${esc(s.name.split(' ').map(w=>w[0]).join('').slice(0,2))}</div>
              <div class="styl-info">
                <div class="styl-name">${esc(s.name)}</div>
                <div class="styl-spec">${esc(s.spec)}</div>
                <div class="styl-price" style="display:flex;align-items:center;gap:3px">${esc(s.price)} · <span style="color:var(--warning)">${icon('diamond',12)}</span> ${esc(s.rating)} · ${s.sessions} sessions</div>
              </div>
              <div class="styl-avail ${s.avail?'open':'busy'}">${s.avail?'Available':'Busy'}</div>
            </div>
            <div class="styl-tags">${s.tags.map(t=>`<div class="styl-tag">${esc(t)}</div>`).join('')}</div>
            <div class="styl-actions">
              <button class="styl-btn primary" onclick="openBooking('${attr(s.id)}','${attr(s.name)}')" ${s.avail?'':'disabled style="opacity:.4"'} style="display:inline-flex;align-items:center;gap:5px">${icon('calendar',15)} Book</button>
              <button class="styl-btn secondary" onclick="openBookingPreset('${attr(s.id)}','${attr(s.name)}','video')" ${s.avail?'':'disabled style="opacity:.4"'} style="display:inline-flex;align-items:center;gap:5px">${icon('video',15)} Video</button>
              <button class="styl-btn secondary" onclick="openBookingPreset('${attr(s.id)}','${attr(s.name)}','chat')" ${s.avail?'':'disabled style="opacity:.4"'} style="display:inline-flex;align-items:center;gap:5px">${icon('chat',15)} Chat</button>
            </div>
          </div>`).join('')}
      </div>
    `;
  }

  function openBooking(id, name) {
    const existing = document.getElementById('book-overlay-el');
    if (existing) existing.remove();
    const overlay = document.createElement('div');
    overlay.id = 'book-overlay-el';
    overlay.className = 'book-overlay';
    overlay.innerHTML = `
      <div class="book-sheet">
        <div class="book-title" style="display:flex;align-items:center;gap:8px">${icon('calendar',18)} Book a session with ${esc(name)}</div>
        <div class="book-field"><div class="book-label">Full name</div><input class="book-input" id="book-nm" placeholder="Your name..." /></div>
        <div class="book-field"><div class="book-label">Date</div><input class="book-input" id="book-dt" type="date" /></div>
        <div class="book-field"><div class="book-label">Session type</div>
          <select class="book-input" id="book-type">
            <option value="video">Video call</option>
            <option value="chat">Text chat</option>
            <option value="home">Home visit</option>
          </select>
        </div>
        <button class="book-submit" onclick="submitBooking('${attr(name)}')">${icon('check',16)} Confirm session</button>
        <button class="book-cancel" onclick="document.getElementById('book-overlay-el').remove()">Cancel</button>
      </div>`;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  }

  // Open the booking overlay pre-set to a given session type (video/chat/home) —
  // reused by the stylist card's Video/Chat quick actions so they land on the
  // same real booking flow as the Book button instead of a dead-end toast.
  function openBookingPreset(id, name, type) {
    openBooking(id, name);
    const sel = document.getElementById('book-type');
    if (sel) sel.value = type;
  }

  function submitBooking(name) {
    const nm = document.getElementById('book-nm')?.value.trim();
    const dt = document.getElementById('book-dt')?.value;
    const type = document.getElementById('book-type')?.value;
    if (!nm || !dt) { showToast('Please fill in all the details'); return; }
    document.getElementById('book-overlay-el')?.remove();
    const typeLabel = type === 'video' ? 'video' : type === 'chat' ? 'chat' : 'home visit';
    showToast(`${typeLabel} session with ${name} booked`);
    logAdminEvent('booking', `Session with ${name} — ${typeLabel} on ${dt}`);
    addRewardPoints(50, 'booking');
  }

  // ===== SHOPPING FEED =====
  let SHOP_SEED = [
    {id:'s1',  name:'Washed Straight Leg Jeans',  search_query:'washed straight leg jeans women', category:'bottoms',  price:220, orig:380, style_tags:['y2k','denim','casual'],    brand:'Zara',      store:'Zara',       badge:'Hot',   score:95},
    {id:'s2',  name:'Velvet Crop Top',            search_query:'velvet crop top women',           category:'top',      price:89,  orig:89,  style_tags:['minimal','elegant'],          brand:'H&M',       store:'H&M',        badge:'New',   score:88, image_url:'https://image.hm.com/assets/hm/59/12/591234ce7947b24f9bbb9ce0abf536e0d0551563.jpg'},
    {id:'s3',  name:'Pleated Mini Skirt',         search_query:'pleated mini skirt women',        category:'bottoms',  price:160, orig:249, style_tags:['y2k','going-out','bold'],      brand:'SHEIN',     store:'SHEIN',      badge:'Sale',  score:91, image_url:'https://n.nordstrommedia.com/it/15963ac9-5f3f-4207-b119-a021e1db52e7.jpeg?h=368&w=240&dpr=2'},
    {id:'s4',  name:'Oversized Denim Jacket',     search_query:'oversized denim jacket women',    category:'outerwear',price:310, orig:310, style_tags:['streetwear','denim','casual'],  brand:'Pull&Bear', store:'Pull&Bear',  badge:'Hot',   score:87, image_url:'https://n.nordstrommedia.com/it/742c046e-df5e-4844-95b4-61e1096c97ed.jpeg?crop=pad&pad_color=FFF&format=jpeg&trim=color&trimcolor=FFF&w=780&h=1196'},
    {id:'s5',  name:'Classic White Sneakers',     search_query:'adidas stan smith white sneakers women', category:'shoes', price:299, orig:420, style_tags:['minimal','streetwear','white'], brand:'adidas', store:'adidas', badge:'Sale', score:93, image_url:'https://assets.adidas.com/images/w_1880,f_auto,q_auto/c68f09963c6e47dcad68ac010115a208_9366/Stan_Smith_Shoes_White_FX5500_01_standard.jpg'},
    {id:'s6',  name:'Canvas Tote Bag',            search_query:'canvas tote bag',                 category:'bag',      price:140, orig:140, style_tags:['minimal','casual','neutral'],   brand:'Mango',     store:'Mango',      badge:'New',   score:82, image_url:'https://shop.mango.com/assets/rcs/pics/static/T8/fotos/S/87046714_CU_B.jpg?ts=1714729382668'},
    {id:'s7',  name:'Floral Midi Dress',          search_query:'floral midi dress women',         category:'dress',    price:195, orig:290, style_tags:['cottage-core','romantic'],      brand:'ASOS',      store:'ASOS',       badge:'Sale',  score:89, image_url:'https://is4.revolveassets.com/images/p4/n/tv/BENE-WD377_V1.jpg'},
    {id:'s8',  name:'Oversized Linen Shirt',      search_query:'oversized linen shirt women',     category:'top',      price:120, orig:120, style_tags:['minimal','linen','casual'],     brand:'Bershka',   store:'Bershka',    badge:'New',   score:84},
    {id:'s9',  name:'Y2K Track Pants',            search_query:'nike track pants women sporty',   category:'bottoms',  price:175, orig:240, style_tags:['y2k','sporty','streetwear'],    brand:'Nike',      store:'Nike',       badge:'Hot',   score:96, image_url:'https://static.nike.com/a/images/t_PDP_1728_v1/f_auto,q_auto:eco/be2e8b53-e82c-4e2f-9ed5-6d4e4430e29a/W+NSW+ESSNTL+PANT+REG+FLC.png'},
    {id:'s10', name:'Gold Hoop Earrings',         search_query:'gold hoop earrings',              category:'jewelry',  price:65,  orig:65,  style_tags:['minimal','elegant','gold'],     brand:'ASOS',      store:'ASOS',       badge:'New',   score:78, image_url:'https://cdn.shopify.com/s/files/1/2556/2250/products/Small-thin-gold-hoop-earrings.jpg'},
    {id:'s11', name:'Oversized Blazer',           search_query:'oversized blazer women',          category:'outerwear',price:380, orig:520, style_tags:['elegant','streetwear','power'],  brand:'Zara',      store:'Zara',       badge:'Sale',  score:90, image_url:'https://static.zara.net/assets/public/9885/e922/a0be46659e56/661cb395b150/08769916400-p/08769916400-p.jpg'},
    {id:'s12', name:'Patent Leather Mule Sandals',search_query:'patent leather mule sandals women',category:'shoes',  price:210, orig:210, style_tags:['elegant','minimal','summer'],   brand:'Mango',     store:'Mango',      badge:'New',   score:85, image_url:'https://cdn.shopify.com/s/files/1/0610/1440/9428/files/10MM18-VENICE-20118-CASTAN.jpg'},
    {id:'s13', name:'Y2K Ringer Tee',             search_query:'ringer tee women retro y2k',      category:'top',      price:95,  orig:140, style_tags:['y2k','retro','casual'],          brand:'SHEIN',     store:'SHEIN',      badge:'Sale',  score:88, image_url:'https://images.urbndata.com/is/image/UrbanOutfitters/89759898_049_b?$xlarge$&fit=constrain&qlt=80&wid=614'},
    {id:'s14', name:'Mini Baguette Bag',          search_query:'mini baguette bag women',         category:'bag',      price:250, orig:380, style_tags:['y2k','going-out','bold'],        brand:'Zara',      store:'Zara',       badge:'Sale',  score:86, image_url:'https://shop.mango.com/assets/rcs/pics/static/T8/fotos/S/57049660_CU_B.jpg'},
    {id:'s15', name:'Black Fishnet Tights',       search_query:'black fishnet tights women',      category:'accessory',price:35,  orig:35,  style_tags:['y2k','edgy','streetwear'],       brand:'H&M',       store:'H&M',        badge:'Hot',   score:92},
    {id:'s16', name:'Satin Slip Dress',           search_query:'satin slip dress women elegant',  category:'dress',    price:280, orig:400, style_tags:['elegant','going-out','romantic'], brand:'ASOS',      store:'ASOS',       badge:'Sale',  score:91, image_url:'https://n.nordstrommedia.com/it/20c4ecd0-45e4-4ed7-90c4-2fada40be8ea.jpeg?crop=pad&pad_color=FFF&format=jpeg&trim=color&trimcolor=FFF&w=780&h=1196'},
    {id:'s17', name:'Beige Bucket Hat',           search_query:'beige bucket hat streetwear',     category:'hat',      price:80,  orig:80,  style_tags:['casual','streetwear','minimal'], brand:'Pull&Bear', store:'Pull&Bear',  badge:'New',   score:80, image_url:'https://cdn.shopify.com/s/files/1/0730/0929/9798/files/WigensBeigeNylonBucketHat.jpg'},
    {id:'s18', name:'Green Cargo Pants',          search_query:'green cargo pants women streetwear', category:'bottoms', price:195, orig:260, style_tags:['streetwear','cargo','casual'], brand:'Bershka', store:'Bershka',   badge:'Sale',  score:87, image_url:'https://is4.revolveassets.com/images/p4/n/uv/RTAR-WJ45_V1.jpg'},
    {id:'s19', name:'Structured Corset Top',      search_query:'structured corset top women',     category:'top',      price:150, orig:150, style_tags:['y2k','going-out','bold','sexy'], brand:'SHEIN',     store:'SHEIN',      badge:'Hot',   score:94, image_url:'https://cdn.shopify.com/s/files/1/1818/9543/products/white-corset-top-styledup-fashion.jpg'},
    {id:'s20', name:'Platform Chunky Sneakers',   search_query:'platform chunky sneakers women adidas', category:'shoes', price:350, orig:480, style_tags:['y2k','chunky','bold','streetwear'], brand:'adidas', store:'adidas', badge:'Sale', score:89, image_url:'https://assets.adidas.com/images/w_1880,f_auto,q_auto/7f58eea8063344908fafb96773b13a1e_9366/Superstar_Shoes_White_EG4958_01_standard.jpg'},
  ];

  let sfTab = 'recommended', sfInited = false;

  function buildShopFeed(tab, wardrobe, profile) {
    const vibes = (profile.styleVibes || []).map(v => v.toLowerCase());
    const wardCats = new Set(wardrobe.map(i => i.category));
    const wardTags = new Set(wardrobe.flatMap(i => (i.style_tags||[]).map(t=>t.toLowerCase())));
    const allCats  = ['top','bottoms','dress','outerwear','shoes','bag','accessory','jewelry','hat'];

    let items = [...SHOP_SEED];

    if (tab === 'recommended') {
      items = items.map(it => {
        let score = it.score;
        const itTags = it.style_tags.map(t=>t.toLowerCase());
        vibes.forEach(v => { if (itTags.some(t=>t.includes(v)||v.includes(t))) score += 15; });
        return {...it, _score: score};
      }).sort((a,b) => b._score - a._score);
    }
    else if (tab === 'trending') {
      items = items.sort((a,b) => b.score - a.score);
    }
    else if (tab === 'missing') {
      const missingCats = allCats.filter(c => !wardCats.has(c));
      if (missingCats.length === 0) {
        items = items.filter(it => {
          const itTags = it.style_tags.map(t=>t.toLowerCase());
          return !itTags.some(t => wardTags.has(t));
        });
      } else {
        items = items.filter(it => missingCats.includes(it.category));
      }
      items = items.map(it => ({...it, badge: 'Gap', _badgeCls: 'missing'}));
    }
    else if (tab === 'deals') {
      items = items.filter(it => it.orig > it.price)
        .sort((a,b) => ((b.orig-b.price)/b.orig) - ((a.orig-a.price)/a.orig))
        .map(it => ({...it, _badgeCls: 'deal'}));
    }

    return items.slice(0, 12);
  }

  function initShoppingFeed() {
    sfInited = true;
    document.getElementById('sf-tabs').querySelectorAll('.sf-tab').forEach(btn => {
      // Inject icon prefix from data-icon attribute
      const iconName = btn.dataset.icon;
      if (iconName) {
        btn.innerHTML = `<span style="display:inline-flex;align-items:center;gap:5px;vertical-align:middle">${icon(iconName, 14)} ${btn.textContent.trim()}</span>`;
      }
      btn.addEventListener('click', () => {
        sfTab = btn.dataset.tab;
        document.getElementById('sf-tabs').querySelectorAll('.sf-tab').forEach(b => b.classList.toggle('active', b===btn));
        renderShopGrid();
      });
    });
    renderShopGrid();
  }

  function renderShopGrid() {
    const wardrobe = JSON.parse(localStorage.getItem('awear_wardrobe') || '[]');
    const profile  = loadProfile();
    const grid = document.getElementById('sf-grid');
    const items = buildShopFeed(sfTab, wardrobe, profile);

    if (!items.length) {
      grid.innerHTML = `<div class="sf-empty">No items in this category right now</div>`;
      return;
    }

    const wardTags = new Set(wardrobe.flatMap(i => (i.style_tags||[]).map(t=>t.toLowerCase())));
    grid.innerHTML = items.map(it => {
      const disc = it.orig > it.price ? Math.round((1 - it.price/it.orig)*100) : 0;
      const badgeCls = it._badgeCls || (it.badge==='New'?'new':'');
      const itTags = it.style_tags.map(t=>t.toLowerCase());
      const matchCount = itTags.filter(t=>wardTags.has(t)).length;
      const compatTxt = wardrobe.length ? `${Math.round((matchCount/Math.max(itTags.length,1))*100)}% matches your closet` : '';
      return `
        <div class="sf-card" onclick="openShopItem('${attr(it.id)}')">
          <div class="sf-card-img">
            ${productImage(it)}
            ${it.badge ? `<div class="sf-badge ${badgeCls}">${esc(it.badge)}</div>` : ''}
          </div>
          <div class="sf-card-body">
            <div class="sf-card-name">${esc(it.name)}</div>
            <div class="sf-card-brand">${esc(it.brand)} · ${esc(it.store)}</div>
            <div class="sf-price-row">
              <div class="sf-price">$${it.price}</div>
              ${disc ? `<div class="sf-orig">$${it.orig}</div><div class="sf-discount">-${disc}%</div>` : ''}
            </div>
            ${compatTxt ? `<div class="sf-compat">${icon('sparkle',12)} ${esc(compatTxt)}</div>` : ''}
          </div>
        </div>`;
    }).join('');
  }

  function openShopItem(id) {
    const it = SHOP_SEED.find(s => s.id === id);
    if (!it) return;
    openSheetSingle({
      name: it.name,
      category: it.category,
      style_tags: it.style_tags,
      color: '',
      price_estimate_usd: it.price,
      image_url: it.image_url,
      search_query: it.search_query,
      brand: it.brand,
      brand_vibe: it.brand + ' · ' + it.store,
    }, 0, null);
  }

  // ===== COMPARE BEFORE BUY =====
  let cmpItems = {a: null, b: null};
  let cmpInited = false;

  function initCompare() {
    cmpInited = false;
    cmpItems = {a: null, b: null};
    const hangerSVG = `<span class="ic-svg" style="width:32px;height:32px;opacity:.5" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 6.2a2 2 0 1 1 1.4 1.9c-.5.2-.9.6-.9 1.2v.8"/><path d="M12 10.5 4.5 16a1 1 0 0 0 .6 1.8h13.8A1 1 0 0 0 19.5 16L12 10.5Z" stroke-linejoin="round"/></svg></span>`;
    document.getElementById('cmp-slot-a').innerHTML = `<div class="cmp-slot-empty"><div class="cmp-slot-empty-icon">${hangerSVG}</div><div class="cmp-slot-empty-text">+ Pick first item</div></div>`;
    document.getElementById('cmp-slot-b').innerHTML = `<div class="cmp-slot-empty"><div class="cmp-slot-empty-icon">${hangerSVG}</div><div class="cmp-slot-empty-text">+ Pick second item</div></div>`;
    document.getElementById('cmp-go').style.display = 'none';
    document.getElementById('cmp-result').innerHTML = '';
    const slotA = document.getElementById('cmp-slot-a');
    const slotB = document.getElementById('cmp-slot-b');
    slotA.classList.remove('filled');
    slotB.classList.remove('filled');
  }

  function openCmpPicker(slot) {
    const wardrobe = JSON.parse(localStorage.getItem('awear_wardrobe') || '[]');
    const mp = JSON.parse(localStorage.getItem('awear_marketplace') || '[]');
    const wishlist = JSON.parse(localStorage.getItem('awear_wishlist') || '[]');
    const allItems = [
      ...wardrobe.map(i => ({...i, _src: 'Closet'})),
      ...mp.map(i => ({...i, _src: 'Marketplace'})),
      ...wishlist.map(i => ({...i, _src: 'Wishlist'})),
    ];

    if (!allItems.length) {
      alert('No items. Scan some pieces to your closet first.');
      return;
    }

    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:9999;display:flex;flex-direction:column;overflow:hidden;';
    overlay.innerHTML = `
      <div style="flex:1;overflow-y:auto;padding:16px;padding-top:48px;">
        <div style="font-size: var(--t-h2,18px);font-weight:900;margin-bottom:14px;color:#fff;">Pick ${slot === 'a' ? 'first' : 'second'} item</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
          ${allItems.map((it, idx) => `
            <div onclick="selectCmpItem('${slot}',${idx},'${attr(JSON.stringify(it).replace(/'/g,"\\'"))}')" style="background:var(--bg);border-radius:14px;overflow:hidden;cursor:pointer;border:2px solid var(--card);transition:all .15s;">
              <div style="height:80px;overflow:hidden;background:var(--card);">${productImage(it)}</div>
              <div style="padding:8px 10px;">
                <div style="font-size:var(--t-caption);font-weight:800;color:var(--text);">${esc(it.name||'Item')}</div>
                <div style="font-size:var(--t-micro);color:var(--accent2);margin-top:3px;">${it.price_estimate_usd || it.price ? '$'+(it.price_estimate_usd||it.price) : ''} · ${esc(it._src)}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
      <button onclick="this.closest('div[style]').remove()" style="margin:0 16px 24px;padding:12px;background:var(--card);border:0;border-radius:14px;color:var(--text);font-family:inherit;font-size:var(--t-body);font-weight:900;cursor:pointer;">Cancel</button>
    `;
    overlay.dataset.slot = slot;
    overlay.dataset.items = JSON.stringify(allItems);
    overlay.id = 'cmp-picker-overlay';
    document.body.appendChild(overlay);
  }

  function selectCmpItem(slot, idx, itemJson) {
    const overlay = document.getElementById('cmp-picker-overlay');
    if (overlay) overlay.remove();

    let item;
    try { item = JSON.parse(itemJson); } catch(e) {
      const allItems = JSON.parse(localStorage.getItem('awear_wardrobe') || '[]');
      item = allItems[idx];
    }
    if (!item) return;

    cmpItems[slot] = item;
    const slotEl = document.getElementById(`cmp-slot-${slot}`);
    slotEl.classList.add('filled');
    slotEl.innerHTML = `
      <div class="cmp-slot-content">
        <div class="cmp-slot-img">${productImage(item)}</div>
        <div class="cmp-slot-info">
          <div class="cmp-slot-name">${esc(item.name||'Item')}</div>
          <div class="cmp-slot-price">${item.price_estimate_usd||item.price ? '$'+(item.price_estimate_usd||item.price) : 'Price unknown'}</div>
        </div>
      </div>`;
    slotEl.onclick = () => openCmpPicker(slot);

    if (cmpItems.a && cmpItems.b) {
      document.getElementById('cmp-go').style.display = 'block';
    }
  }

  function runCompare() {
    const a = cmpItems.a, b = cmpItems.b;
    if (!a || !b) return;
    const wardrobe = JSON.parse(localStorage.getItem('awear_wardrobe') || '[]');

    const priceA = a.price_estimate_usd || a.price || 0;
    const priceB = b.price_estimate_usd || b.price || 0;

    const wearsA = a.wear_count || 1, wearsB = b.wear_count || 1;
    const cpwA = priceA ? (priceA / wearsA).toFixed(0) : '—';
    const cpwB = priceB ? (priceB / wearsB).toFixed(0) : '—';

    const compatA = calcCompatScore(a, wardrobe).pct;
    const compatB = calcCompatScore(b, wardrobe).pct;

    const tagsA = new Set((a.style_tags||[]).map(t=>t.toLowerCase()));
    const tagsB = new Set((b.style_tags||[]).map(t=>t.toLowerCase()));
    let versatileA = 0, versatileB = 0;
    wardrobe.forEach(w => {
      const wTags = (w.style_tags||[]).map(t=>t.toLowerCase());
      if (wTags.some(t=>tagsA.has(t))) versatileA++;
      if (wTags.some(t=>tagsB.has(t))) versatileB++;
    });

    function winClass(valA, valB, higherIsBetter=true) {
      if (valA === '—' || valB === '—') return ['',''];
      const numA = parseFloat(valA), numB = parseFloat(valB);
      if (higherIsBetter) return numA > numB ? ['winner',''] : numA < numB ? ['','winner'] : ['',''];
      return numA < numB ? ['winner',''] : numA > numB ? ['','winner'] : ['',''];
    }

    const [pA,pB] = winClass(priceA, priceB, false);
    const [cpwAw,cpwBw] = winClass(cpwA==='—'?0:cpwA, cpwB==='—'?0:cpwB, false);
    const [cA,cB] = winClass(compatA, compatB, true);
    const [vA,vB] = winClass(versatileA, versatileB, true);

    const scoreA = (pA?1:0) + (cpwAw?1:0) + (cA?1:0) + (vA?1:0);
    const scoreB = (pB?1:0) + (cpwBw?1:0) + (cB?1:0) + (vB?1:0);

    let verdictWinner, verdictText;
    if (scoreA > scoreB) {
      verdictWinner = a.name || 'Item A';
      verdictText = `Recommended: **${verdictWinner}** wins ${scoreA} of 4 categories. ${compatA > compatB ? 'It matches your closet better' : cpwA < cpwB ? 'Lower cost per wear' : 'Lower price'}.`;
    } else if (scoreB > scoreA) {
      verdictWinner = b.name || 'Item B';
      verdictText = `Recommended: **${verdictWinner}** wins ${scoreB} of 4 categories. ${compatB > compatA ? 'It matches your closet better' : cpwB < cpwA ? 'Lower cost per wear' : 'Lower price'}.`;
    } else {
      verdictText = "It's a tie! Go with your gut — both work for your closet.";
    }

    const nameA = esc(a.name||'Item A'), nameB = esc(b.name||'Item B');

    document.getElementById('cmp-result').innerHTML = `
      <div class="cmp-row">
        <div class="cmp-row-b ${pA}" style="text-align:center;">${priceA ? '$'+priceA : '—'}</div>
        <div class="cmp-row-label">Price</div>
        <div class="cmp-row-a ${pB}" style="text-align:center;">${priceB ? '$'+priceB : '—'}</div>
      </div>
      <div class="cmp-row">
        <div class="cmp-row-b ${cpwAw}" style="text-align:center;">${cpwA === '—' ? '—' : '$'+cpwA+'/wear'}</div>
        <div class="cmp-row-label">Cost per wear</div>
        <div class="cmp-row-a ${cpwBw}" style="text-align:center;">${cpwB === '—' ? '—' : '$'+cpwB+'/wear'}</div>
      </div>
      <div class="cmp-row">
        <div class="cmp-row-b ${cA}" style="text-align:center;">${compatA}%</div>
        <div class="cmp-row-label">Closet match</div>
        <div class="cmp-row-a ${cB}" style="text-align:center;">${compatB}%</div>
      </div>
      <div class="cmp-row">
        <div class="cmp-row-b ${vA}" style="text-align:center;">${versatileA} items</div>
        <div class="cmp-row-label">Versatility</div>
        <div class="cmp-row-a ${vB}" style="text-align:center;">${versatileB} items</div>
      </div>
      <div class="cmp-row" style="background:rgba(255,255,255,.04);">
        <div class="cmp-row-b" style="font-size:var(--t-micro);font-weight:700;text-align:center;padding:8px;color:var(--muted);">${nameA}</div>
        <div class="cmp-row-label" style="color:var(--text);">Item</div>
        <div class="cmp-row-a" style="font-size:var(--t-micro);font-weight:700;text-align:center;padding:8px;color:var(--muted);">${nameB}</div>
      </div>
      <div class="cmp-verdict">${verdictText.replace(/\*\*(.*?)\*\*/g, '<strong style="color:var(--success)">$1</strong>')}</div>
      <div style="display:flex;gap:10px;margin-top:4px;">
        <button onclick="initCompare()" style="flex:1;padding:12px;background:var(--card);border:1px solid var(--line);border-radius:14px;color:var(--muted);font-family:inherit;font-size:var(--t-small);font-weight:800;cursor:pointer;">New comparison</button>
      </div>
    `;
  }

  // ===== NOTIFICATIONS =====

  function renderNotifPanel(items) {
    const panel = document.getElementById('notif-panel');
    if (!panel) return;
    if (!items || items.length === 0) {
      panel.innerHTML = '<p class="notif-empty">No updates yet</p>';
      return;
    }
    panel.innerHTML = items.map(n => `
      <div class="notif-item ${n.read ? '' : 'unread'}">
        <span class="notif-type">${icon(n.type === 'like' ? 'heartFill' : 'chat', 16)}</span>
        <span class="notif-text">${n.type === 'like' ? 'Someone liked your look' : esc(n.type)}</span>
        <span class="notif-time">${new Date(n.created_at * 1000).toLocaleDateString('en')}</span>
      </div>
    `).join('');
  }

  async function loadNotifications() {
    try {
      const res = await fetch('/api/notifications/user_1?limit=20');
      if (!res.ok) {
        console.error('[AWEAR] loadNotifications HTTP error:', res.status);
        return;
      }
      const data = await res.json();
      const badge = document.getElementById('notif-badge');
      if (badge) {
        badge.textContent = data.unread || '';
        badge.style.display = data.unread > 0 ? 'flex' : 'none';
      }
      const btn = document.getElementById('notif-btn');
      if (btn && !btn.querySelector('.ic-svg')) {
        btn.insertAdjacentHTML('afterbegin', icon('bell', 18));
      }
      renderNotifPanel(data.items || []);
    } catch(e) {
      console.error('[AWEAR] loadNotifications network error:', e.message);
    }
  }

  async function markNotifsRead() {
    try {
      const res = await fetch('/api/notifications/user_1/read-all', { method: 'POST' });
      if (!res.ok) {
        console.error('[AWEAR] markNotifsRead HTTP error:', res.status);
        return;
      }
      const badge = document.getElementById('notif-badge');
      if (badge) badge.style.display = 'none';
    } catch(e) {
      console.error('[AWEAR] markNotifsRead network error:', e.message);
    }
  }

  function toggleNotifPanel() {
    const panel = document.getElementById('notif-panel');
    if (!panel) return;
    const isOpen = panel.classList.contains('open');
    panel.classList.toggle('open');
    if (!isOpen) {
      markNotifsRead();
    }
  }

  // close panel on outside click
  document.addEventListener('click', function(e) {
    const btn = document.getElementById('notif-btn');
    const panel = document.getElementById('notif-panel');
    if (!panel || !btn) return;
    if (!btn.contains(e.target) && !panel.contains(e.target)) {
      panel.classList.remove('open');
    }
  }, true);

  // ---- User Profile view ----
  let _upUserId = null;
  let _upTab = 'posts';
  let _prevViewForProfile = 'feed';

  function openUserProfile(userId) {
    if (!userId) return;
    _upUserId = userId;
    _upTab = 'posts';
    _prevViewForProfile = document.querySelector('.view.active')?.id || 'feed';
    showView('user-profile');
  }

  function renderUserProfile() {
    const el = document.getElementById('up-wrap');
    if (!el) return;

    // Reset content to prevent listener accumulation on re-render
    el.innerHTML = '';

    let u = SEED_USERS.find(x => x.id === _upUserId);
    if (!u) {
      const post = SEED_POSTS.find(p => p.userId === _upUserId || p.user === _upUserId);
      if (!post) {
        el.innerHTML = `<div class="up-back-bar"><button class="up-back-btn" id="up-back-btn">${icon('arrowRight',16)} Back</button></div><div class="up-empty">${icon('user',40)}<div>Profile not found</div></div>`;
        document.getElementById('up-back-btn')?.addEventListener('click', () => showView(_prevViewForProfile));
        return;
      }
      u = { id: post.userId || post.user, name: post.name || post.user || 'User', handle: '@'+(post.user||'user'), avatar: null, vibe: (post.tags||[])[0]||'Style', items: 0, following: false };
    }

    // Block check
    if (isBlocked(u.id) || isBlocked(u.handle)) {
      el.innerHTML = `
        <div class="up-back-bar"><button class="up-back-btn" id="up-back-btn">${icon('arrowRight',16)} Back</button></div>
        <div class="up-empty" style="padding-top:60px">
          ${icon('user',40)}
          <div>You've blocked this user</div>
          <button class="up-follow-btn" style="background:var(--card,#1e1a22);border:1.5px solid var(--line,#2e2836);color:var(--muted,#8a8498)" id="up-unblock-btn">Unblock</button>
        </div>`;
      document.getElementById('up-back-btn')?.addEventListener('click', () => showView(_prevViewForProfile));
      document.getElementById('up-unblock-btn')?.addEventListener('click', () => confirmBlockUser(u.id, u.name, () => renderUserProfile()));
      return;
    }

    const myWardrobe = JSON.parse(localStorage.getItem('awear_wardrobe') || '[]');
    const isFollowing = followState[u.id] ?? u.following;
    const initials = u.name.split(' ').filter(Boolean).slice(0,2).map(w=>w[0]).join('').toUpperCase() || 'U';

    const userPosts = SEED_POSTS.filter(p => p.userId === u.id || p.user === u.handle.replace(/^@/,''));

    // ---- Real look-image manifest (PROFILE GRID ONLY — never touch global SEED_POSTS) ----
    // Maps each real user → the real look photos on disk under /static/img/users/<name>/.
    // Carmel is CAPPED at 12 (look1..look12) of her 17 files.
    const LOOK_MANIFEST = {
      u1: { dir:'tamar',  files:['look1.jpg','look2.jpg','look3.jpg'] },
      u2: { dir:'carmel', files:['look1.jpg','look2.jpg','look3.jpg','look4.jpg','look5.jpg','look6.jpg','look7.jpg','look8.jpg','look9.jpg','look10.jpg','look11.jpg','look12.jpg'] },
      u3: { dir:'maayan', files:['look1.jpg','look2.jpg','look3.jpg'] },
    };
    // gridLooks = seeded posts FIRST (they carry real items/captions), THEN synthesized
    // image-only tiles for any manifest photo not already used by a seeded post.
    let gridLooks = userPosts;
    const manifest = LOOK_MANIFEST[u.id];
    if (manifest) {
      const usedImgs = new Set(userPosts.map(p => p.img).filter(Boolean));
      const SYNTH_LIKES = [612,847,503,729,418,956,634,521,803,447,688,572]; // static, plausible — not random
      const synthTiles = [];
      manifest.files.forEach((f, idx) => {
        const path = '/static/img/users/' + manifest.dir + '/' + f;
        if (usedImgs.has(path)) return;
        usedImgs.add(path);
        synthTiles.push({ img: path, likes: SYNTH_LIKES[idx % SYNTH_LIKES.length], caption: '', items: [] });
      });
      gridLooks = userPosts.concat(synthTiles);
    }

    const wardrobeItems = [];
    const seenNames = new Set();
    userPosts.forEach(post => {
      (post.items || []).forEach(item => {
        if (!seenNames.has(item.name)) {
          seenNames.add(item.name);
          wardrobeItems.push({ ...item, style_tags: post.tags || [] });
        }
      });
    });

    const STORE_DEMO = {
      u1: [{name:'Vintage Denim Jacket', price:85, cat:'outerwear', q:'vintage denim jacket women'}, {name:'White Linen Dress', price:65, cat:'dress', q:'white linen midi dress'}],
      u2: [{name:'Oversized Blazer', price:110, cat:'outerwear', q:'oversized blazer beige women'}, {name:'Cargo Pants', price:70, cat:'bottoms', q:'cargo pants streetwear women'}],
      u3: [{name:'Silk Slip Dress', price:55, cat:'dress', q:'silk slip dress minimal'}, {name:'Vintage Crossbody', price:40, cat:'bag', q:'vintage leather crossbody bag'}],
      u4: [{name:'Boho Maxi Skirt', price:48, cat:'bottoms', q:'boho maxi skirt floral'}, {name:'Crochet Top', price:35, cat:'top', q:'crochet crop top beige'}],
      u5: [{name:'Sport Windbreaker', price:95, cat:'outerwear', q:'sport windbreaker jacket'}, {name:'Track Pants', price:60, cat:'bottoms', q:'track pants sporty'}],
      u6: [{name:'Tailored Blazer', price:145, cat:'outerwear', q:'tailored blazer suit women'}, {name:'Structured Tote', price:180, cat:'bag', q:'structured leather tote bag'}],
    };
    const storeItems = STORE_DEMO[u.id] || [];

    const theirShowPrices = u.id !== 'u3' && u.id !== 'u6';

    const STATS = {
      u1:{followers:4320,following:512}, u2:{followers:8750,following:390}, u3:{followers:2140,following:278},
      u4:{followers:12600,following:1100}, u5:{followers:3870,following:620}, u6:{followers:1980,following:340},
    };
    const stats = STATS[u.id] || {followers:1200, following:300};

    const BIOS = {
      u1:'looks like she didn\'t try · always does',
      u2:'streetwear · loud sneakers · soft attitude',
      u3:'fewer pieces · cleaner lines · more intent',
      u4:'Street style documentation · TLV × Berlin · always in monochrome',
      u5:'Thrift queen · every item under $20 · proving budget = style',
      u6:'Oxford shirts forever · TLV-based stylist · menswear nerd',
    };

    const allTags = [...new Set(userPosts.flatMap(p => p.tags||[]))].slice(0,4);
    const tagPillsHTML = allTags.map(t => `<span style="display:inline-flex;align-items:center;padding:3px 9px;background:var(--card,#1e1a22);border:1px solid var(--line,#2e2836);border-radius:var(--r-pill,999px);font-size:var(--t-micro,11px);font-weight:800;color:var(--muted,#8a8498)">${esc(t)}</span>`).join('');

    el.innerHTML = `
      <div class="up-back-bar" style="display:flex;align-items:center;justify-content:space-between">
        <button class="up-back-btn" id="up-back-btn" aria-label="Back">${icon('arrowRight',16)} Back</button>
        <button id="up-more-btn" aria-label="More options" style="width:40px;height:40px;border-radius:50%;background:var(--card,#1e1a22);border:1px solid var(--line,#2e2836);display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--muted,#8a8498);min-height:40px;flex-shrink:0">${icon('more',18)}</button>
      </div>
      <div class="up-hero">
        ${u.avatar
          ? `<img class="up-avatar" src="${attr(u.avatar)}" alt="${attr(u.name)}" data-name="${attr(u.name)}" loading="lazy" onerror="this.onerror=null;avatarFallback(this)">`
          : `<div class="up-avatar-initials">${esc(initials)}</div>`}
        <div class="up-name">${esc(u.name)}</div>
        <div class="up-handle">${esc(u.handle)}</div>
        <div class="up-vibe">${esc(BIOS[u.id] || u.vibe)}</div>
        ${tagPillsHTML ? `<div style="display:flex;flex-wrap:wrap;gap:5px;justify-content:center;margin-top:8px">${tagPillsHTML}</div>` : ''}
        <div class="up-stats">
          <div class="up-stat"><div class="up-stat-n">${fmtN(stats.followers)}</div><div class="up-stat-l">Followers</div></div>
          <div class="up-stat"><div class="up-stat-n">${fmtN(stats.following)}</div><div class="up-stat-l">Following</div></div>
          <div class="up-stat"><div class="up-stat-n">${wardrobeItems.length || u.items}</div><div class="up-stat-l">Items</div></div>
        </div>
        <button class="up-follow-btn${isFollowing?' following':''}" id="up-follow-btn" aria-pressed="${isFollowing}" data-uid="${attr(u.id)}">${isFollowing?'Following':'+ Follow'}</button>
      </div>
      <div class="up-tabs" role="tablist">
        <button class="up-tab${_upTab==='posts'?' active':''}" data-uptab="posts" role="tab" aria-selected="${_upTab==='posts'}" aria-controls="up-content">${icon('grid',14)} Posts</button>
        <button class="up-tab${_upTab==='wardrobe'?' active':''}" data-uptab="wardrobe" role="tab" aria-selected="${_upTab==='wardrobe'}" aria-controls="up-content">${icon('hanger',14)} Wardrobe</button>
        <button class="up-tab${_upTab==='store'?' active':''}" data-uptab="store" role="tab" aria-selected="${_upTab==='store'}" aria-controls="up-content">${icon('storefront',14)} Store</button>
      </div>
      <div class="up-content" id="up-content" role="tabpanel"></div>
    `;

    function renderUpTab() {
      const contentEl = document.getElementById('up-content');
      if (!contentEl) return;

      if (_upTab === 'posts') {
        // 3-column square grid — Instagram style
        contentEl.innerHTML = gridLooks.length ? `
          <div class="up-grid-ig">
            ${gridLooks.map((p,i) => `
              <button class="up-grid-thumb" data-post-idx="${i}" aria-label="${attr(p.caption||'Post')}">
                <div class="up-thumb-bg" style="background:${attr(p.grad||'var(--surface,#161318)')}">
                  ${p.img ? `<img src="${attr(p.img)}" alt="" loading="lazy">` : icon('image',20)}
                </div>
                <div class="up-thumb-likes">${icon('heart',9)} ${fmtN(p.likes||0)}</div>
              </button>`).join('')}
          </div>${gridLooks.length < 4 ? `
          <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;padding:32px 16px;margin-top:16px;background:var(--surface,#161318);border:1px solid var(--line,#2e2836);border-radius:var(--r-md,14px);color:var(--muted,#8a8498)">
            <span style="color:var(--muted,#8a8498)">${icon('camera',24)}</span>
            <div style="font-size:var(--t-small,13px);font-weight:700">More looks coming</div>
          </div>` : ''}` : `<div class="up-empty">${icon('image',36)}<div>No posts yet</div></div>`;
        contentEl.querySelectorAll('[data-post-idx]').forEach(card => {
          card.addEventListener('click', () => {
            const p = gridLooks[Number(card.dataset.postIdx)];
            if (!p) return;
            // Open same-design post card in sheet
            const lookItems = (p.items||[]).slice(0,5);
            sheetBody.innerHTML = `
              <div class="fc-header" style="padding:14px 16px 10px">
                <div class="fc-hdr-avatar">${esc(u.name.split(' ').filter(Boolean).slice(0,2).map(w=>w[0]).join('').toUpperCase()||'?')}</div>
                <div class="fc-hdr-info">
                  <div class="fc-hdr-user" style="font-size:var(--t-small,13px);font-weight:900">${esc(u.handle)}</div>
                  <div class="fc-hdr-time">${fmtN(p.likes||0)} likes</div>
                </div>
              </div>
              <div style="position:relative;width:100%;aspect-ratio:4/5;overflow:hidden;background:${attr(p.grad||'var(--surface,#161318)')}">
                ${p.img ? `<img src="${attr(p.img)}" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover">` : `<div style="height:100%;display:flex;align-items:center;justify-content:center;color:var(--muted,#8a8498)">${icon('image',48)}</div>`}
              </div>
              <div style="padding:10px 16px 8px">
                <div style="font-size:var(--t-small,13px);line-height:1.5;margin-bottom:8px">
                  <span style="font-weight:900;margin-right:5px">${esc(u.handle)}</span><span style="color:var(--fg,#f0ecf5)">${esc(p.caption||'')}</span>
                </div>
                ${lookItems.length ? `
                <div style="font-size:var(--t-micro,11px);font-weight:800;color:var(--muted,#8a8498);text-transform:uppercase;letter-spacing:.6px;margin-bottom:8px">Items in this look</div>
                <div style="display:flex;flex-direction:column;gap:8px">
                  ${lookItems.map(it => `<div style="display:flex;align-items:center;gap:10px;background:var(--card,#1e1a22);border-radius:var(--r-sm,10px);padding:9px 12px;border:1px solid var(--line,#2e2836)">
                    <span style="color:var(--muted,#8a8498)">${icon(catIcon(it.category),18)}</span>
                    <div style="flex:1;min-width:0">
                      <div style="font-size:var(--t-small,13px);font-weight:800;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(it.name)}</div>
                      <div style="font-size:var(--t-micro,11px);color:var(--muted,#8a8498);text-transform:capitalize">${esc(it.category||'')}</div>
                    </div>
                    ${it.price_estimate_usd?`<span style="font-size:var(--t-small,13px);font-weight:900;color:var(--accent2,#c4855a);flex-shrink:0">$${esc(String(it.price_estimate_usd))}</span>`:''}
                  </div>`).join('')}
                </div>` : `
                <div style="display:flex;align-items:center;gap:10px;background:var(--card,#1e1a22);border:1px solid var(--line,#2e2836);border-radius:var(--r-sm,10px);padding:11px 12px;color:var(--muted,#8a8498)">
                  <span style="color:var(--accent2,#c4855a)">${icon('shoppingBag',18)}</span>
                  <div style="font-size:var(--t-small,13px);font-weight:700">Shop this look — coming soon</div>
                </div>`}
              </div>`;
            sheetFooter.innerHTML = `<button class="sheet-buy" style="background:var(--card,#1e1a22);border:1.5px solid var(--line,#2e2836);color:var(--muted,#8a8498)" onclick="closeSheet()">Close</button>`;
            showSheet();
          });
        });

      } else if (_upTab === 'wardrobe') {
        const hasWardrobe = myWardrobe.length > 0;
        contentEl.innerHTML = wardrobeItems.length ? `
          ${!theirShowPrices ? `<div class="up-privacy-note">${icon('tag',12)} This user has hidden item prices</div>` : ''}
          ${!hasWardrobe ? `<div class="up-privacy-note" style="margin-bottom:12px">${icon('sparkle',12)} Add items to your wardrobe to see compatibility</div>` : ''}
          <div class="up-wardrobe-grid">
            ${wardrobeItems.map(item => {
              const compat = hasWardrobe ? calcCompatScore({...item}, myWardrobe) : null;
              const cColor = compat ? (compat.pct >= 80 ? 'var(--success,#52c97a)' : compat.pct >= 60 ? 'var(--accent2,#c4855a)' : 'var(--accent,#e8526a)') : '';
              return `<div class="up-item-card" data-up-item="${attr(JSON.stringify(item))}" data-compat="${attr(String(compat?.pct||0))}" data-uname="${attr(u.name)}">
                <div class="up-item-img">${productImage({name:item.name, search_query:item.q||item.name, category:item.category}, 'up-pi')}</div>
                <div class="up-item-name">${esc(item.name)}</div>
                <div class="up-item-cat">${esc(item.category||'')}</div>
                ${(theirShowPrices && item.price_estimate_usd) ? `<div class="up-item-price">$${esc(String(item.price_estimate_usd))}</div>` : ''}
                ${compat ? `<div class="up-compat-badge" style="color:${cColor}">${icon('sparkle',10)} ${compat.pct}% match</div>` : ''}
              </div>`;
            }).join('')}
          </div>` : `<div class="up-empty">${icon('hanger',36)}<div>No wardrobe items</div></div>`;
        contentEl.querySelectorAll('[data-up-item]').forEach(card => {
          card.addEventListener('click', () => {
            try { openUserWardrobeItem(JSON.parse(card.dataset.upItem), card.dataset.uname, Number(card.dataset.compat)); }
            catch(e2) { console.warn('up-item parse error', e2); }
          });
        });

      } else if (_upTab === 'store') {
        const hasWardrobe = myWardrobe.length > 0;
        contentEl.innerHTML = storeItems.length ? `
          <div class="up-store-grid">
            ${storeItems.map((si,i) => {
              const synthItem = {name:si.name, category:si.cat, search_query:si.q||si.name, style_tags:[]};
              const compat = hasWardrobe ? calcCompatScore(synthItem, myWardrobe) : null;
              const cColor = compat ? (compat.pct >= 80 ? 'var(--success,#52c97a)' : compat.pct >= 60 ? 'var(--accent2,#c4855a)' : 'var(--accent,#e8526a)') : '';
              return `<div class="up-store-item" data-store-idx="${i}">
                <div class="up-store-img">${productImage({name:si.name, search_query:si.q||si.name, category:si.cat}, 'up-pi')}</div>
                <div class="up-store-name">${esc(si.name)}</div>
                <div class="up-store-cat">${esc(si.cat)}</div>
                <div class="up-store-price">$${esc(String(si.price))}</div>
                ${compat ? `<div class="up-compat-badge" style="color:${cColor};margin-top:4px">${icon('sparkle',10)} ${compat.pct}% match</div>` : ''}
              </div>`;
            }).join('')}
          </div>` : `<div class="up-empty">${icon('storefront',36)}<div>No active listings</div></div>`;
        contentEl.querySelectorAll('[data-store-idx]').forEach(card => {
          card.addEventListener('click', () => {
            const si = storeItems[Number(card.dataset.storeIdx)];
            if (!si) return;
            openUserWardrobeItem(
              {name:si.name, category:si.cat, search_query:si.q||si.name, price_estimate_usd:si.price, style_tags:[]},
              u.name, 0
            );
          });
        });
      }
    }
    renderUpTab();

    el.querySelectorAll('[data-uptab]').forEach(btn => {
      btn.addEventListener('click', () => {
        _upTab = btn.dataset.uptab;
        el.querySelectorAll('[data-uptab]').forEach(b => {
          b.classList.toggle('active', b === btn);
          b.setAttribute('aria-selected', String(b === btn));
        });
        renderUpTab();
      });
    });

    document.getElementById('up-back-btn')?.addEventListener('click', () => showView(_prevViewForProfile));

    document.getElementById('up-follow-btn')?.addEventListener('click', () => {
      followState[u.id] = !followState[u.id];
      localStorage.setItem('awear_follows', JSON.stringify(followState));
      const btn = document.getElementById('up-follow-btn');
      if (btn) {
        btn.innerHTML = followState[u.id] ? 'Following' : '+ Follow';
        btn.classList.toggle('following', !!followState[u.id]);
        btn.setAttribute('aria-pressed', String(!!followState[u.id]));
      }
      showToast(followState[u.id] ? `Now following ${u.name}` : `Unfollowed ${u.name}`);
    });

    document.getElementById('up-more-btn')?.addEventListener('click', () => {
      openUserMoreMenu(u.id, u.name, () => renderUserProfile());
    });
  }

  function openUserWardrobeItem(item, userName, compatPct) {
    const myWardrobe = JSON.parse(localStorage.getItem('awear_wardrobe') || '[]');
    const hasWardrobe = myWardrobe.length > 0;
    const compat = hasWardrobe
      ? calcCompatScore({...item, style_tags: item.style_tags||[]}, myWardrobe)
      : null;
    const displayPct = compat?.pct ?? compatPct ?? 0;
    const cColor = displayPct >= 80 ? 'var(--success,#52c97a)' : displayPct >= 60 ? 'var(--accent2,#c4855a)' : 'var(--accent,#e8526a)';
    const cLabel = displayPct >= 80 ? 'Great fit for your wardrobe!' : displayPct >= 60 ? 'Good match' : 'Partial match';

    sheetBody.innerHTML = `
      <div style="text-align:center;padding:18px 18px 4px">
        <div style="width:140px;height:140px;border-radius:var(--r-lg,20px);overflow:hidden;margin:0 auto 14px;border:1px solid var(--line,#2e2836);background:var(--bg,#0e0c0f);display:flex;align-items:center;justify-content:center;color:var(--muted,#8a8498)">
          ${productImage({name:item.name, search_query:item.q||item.search_query||item.name, category:item.category}, 'up-sheet-pi')}
        </div>
        <div style="font-size:var(--t-title,20px);font-weight:900">${esc(item.name)}</div>
        <div style="font-size:var(--t-small,13px);color:var(--muted,#8a8498);font-weight:700;margin-top:4px;text-transform:capitalize">${esc(item.category||'')} · ${esc(userName||'')}</div>
      </div>
      <div style="padding:4px 18px 16px">
        ${hasWardrobe ? `
        <div style="background:var(--card,#1e1a22);border-radius:var(--r-md,14px);padding:14px 16px;border:1px solid var(--line,#2e2836)">
          <div style="font-size:var(--t-micro,11px);font-weight:800;color:var(--muted,#8a8498);text-transform:uppercase;letter-spacing:.6px;margin-bottom:10px">Compatibility with your wardrobe</div>
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
            <span style="font-size:var(--t-body,14px);font-weight:800;color:${cColor}">${cLabel}</span>
            <span style="font-size:var(--t-h1,24px);font-weight:900;color:${cColor}">${displayPct}%</span>
          </div>
          <div style="height:6px;background:var(--bg,#0e0c0f);border-radius:var(--r-pill,999px);overflow:hidden">
            <div style="height:100%;width:${displayPct}%;background:${cColor};border-radius:var(--r-pill,999px)"></div>
          </div>
          ${compat?.matches?.length ? `<div style="margin-top:10px;font-size:var(--t-micro,11px);color:var(--muted,#8a8498);font-weight:700">Pairs with: ${compat.matches.map(m=>`<span style="color:var(--fg,#f0ecf5)">${esc(m)}</span>`).join(', ')}</div>` : ''}
        </div>` : `
        <div style="background:var(--card,#1e1a22);border-radius:var(--r-md,14px);padding:14px 16px;border:1px solid var(--line,#2e2836);text-align:center;color:var(--muted,#8a8498);font-size:var(--t-small,13px);font-weight:700">
          ${icon('sparkle',16)} Add items to your wardrobe to see how this fits
        </div>`}
        ${item.price_estimate_usd ? `<div style="margin-top:12px;text-align:center;font-size:var(--t-small,13px);color:var(--muted,#8a8498)">Est. value <strong style="color:var(--accent2,#c4855a)">$${esc(String(item.price_estimate_usd))}</strong></div>` : ''}
      </div>`;
    sheetFooter.innerHTML = `<div style="display:flex;gap:10px;width:100%">
      <button class="sheet-buy" onclick="closeSheet()" style="flex:1;background:var(--card,#1e1a22);border:1.5px solid var(--line,#2e2836);color:var(--muted,#8a8498)">Close</button>
      ${item.price_estimate_usd ? `<button class="sheet-buy" onclick="showToast('Added to wishlist');closeSheet()" style="flex:2;background:linear-gradient(135deg,var(--accent,#e8526a),var(--accent2,#c4855a));border:0;color:var(--text,#fbfbfd)">${icon('bookmark',14)} Wishlist</button>` : ''}
    </div>`;
    showSheet();
  }

  // init bell icon (static HTML — inject via JS per DS-008)
  (function initNotifBell() {
    const btn = document.getElementById('notif-btn');
    if (btn && !btn.querySelector('.ic-svg')) {
      btn.insertAdjacentHTML('afterbegin', icon('bell', 18));
    }
  })();

  // initial load + 30s session poll
  loadNotifications();
  setInterval(loadNotifications, 30000);
