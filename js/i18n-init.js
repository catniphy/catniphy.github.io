// --- Helpers ---
const SUPPORTED = ['zh', 'en'];
const savedLang = localStorage.getItem('site.lang') || null;
const urlParams = new URLSearchParams(window.location.search);
const urlLangRaw = urlParams.get('lang');
const urlLang = urlLangRaw ? urlLangRaw.toLowerCase() : null;
const initialLang = SUPPORTED.includes(urlLang) ? urlLang : (SUPPORTED.includes(savedLang) ? savedLang : undefined);

// --- i18next init ---
i18next
  .use(i18nextHttpBackend)
  .use(i18nextBrowserLanguageDetector)
  .init({
    fallbackLng: 'zh',
    debug: false,

    // Normalize locales and restrict to your two files
    load: 'languageOnly',
    supportedLngs: SUPPORTED,
    lowerCaseLng: true,

    // If we have a URL or saved lang, start with it; otherwise let detector run
    lng: initialLang, // undefined => detector decides

    detection: {
      // Make sure query string takes priority if lng is undefined
      order: ['querystring', 'localStorage', 'navigator', 'htmlTag'],
      lookupQuerystring: 'lang',
      caches: ['localStorage'], // keep user choice
      checkWhitelist: true
    },

    backend: {
      loadPath: '/locales/{{lng}}.json'
    }
  }, (err) => {
    if (err) console.error('i18next init error:', err);
    updateContent();
    syncDropdown();
  });

// --- Apply translations ---
function updateContent() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const val = i18next.t(key);
    if (val && val !== key) el.textContent = val;
  });
  document.documentElement.setAttribute('lang', i18next.language);
  document.documentElement.removeAttribute('data-i18n-loading');
}

// --- Keep dropdown label in sync (optional) ---
function syncDropdown() {
  const current = i18next.language;
  document.querySelectorAll('.lang-switch').forEach(a => {
    a.classList.toggle('active', a.getAttribute('data-lang') === current);
  });
}

// --- Click-to-switch + persist + update URL ---
document.addEventListener('click', e => {
  const btn = e.target.closest('.lang-switch');
  if (!btn) return;
  e.preventDefault();

  const lang = btn.getAttribute('data-lang');
  if (!SUPPORTED.includes(lang)) return;

  i18next.changeLanguage(lang, () => {
    updateContent();
    syncDropdown();
  });
  localStorage.setItem('site.lang', lang);

  // Keep shareable ?lang=... in the URL
  const url = new URL(window.location);
  url.searchParams.set('lang', lang);
  history.replaceState({}, '', url);
});
