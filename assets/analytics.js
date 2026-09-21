(() => {
  'use strict';
  const node = document.getElementById('site-analytics-config');
  const banner = document.getElementById('analytics-consent');
  if (!node || !banner) return;
  const config = JSON.parse(node.textContent);
  const id = config.measurement_id;
  if (!/^G-[A-Z0-9]{6,15}$/.test(id)) return;
  const key = 'jfg-analytics-consent';
  const ttl = config.consent_days * 86400000;
  const production = location.origin === config.production_origin && location.pathname === config.page_path;
  let loaded = false;
  let choice = null;
  let returnFocus = null;
  function savedChoice() {
    try {
      const record = JSON.parse(localStorage.getItem(key));
      return record && record.version === config.consent_version && record.expires > Date.now() &&
        ['granted', 'denied'].includes(record.choice) ? record.choice : null;
    } catch { return null; }
  }
  function clearCookies() {
    document.cookie.split(';').forEach(part => {
      const name = part.split('=')[0].trim();
      if (!/^_ga(?:_|$)/.test(name)) return;
      ['', '; Domain=www.jfgagne.com', '; Domain=jfgagne.com'].forEach(domain => {
        document.cookie = name + '=; Max-Age=0; Path=/' + domain + '; SameSite=Lax; Secure';
      });
    });
  }
  function start() {
    if (!production || loaded || choice !== 'granted') return;
    loaded = true;
    window['ga-disable-' + id] = false;
    window.dataLayer = window.dataLayer || [];
    function gtag() { window.dataLayer.push(arguments); }
    window.gtag = gtag;
    // Basic consent mode: no Google script or request exists until opt-in.
    gtag('consent', 'default', {analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied'});
    gtag('consent', 'update', {analytics_storage: 'granted'});
    gtag('set', 'ads_data_redaction', true);
    gtag('js', new Date());
    let referrer = '';
    try { referrer = new URL(document.referrer).origin; } catch { /* No valid referrer. */ }
    gtag('config', id, {
      send_page_view: false,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      cookie_domain: 'www.jfgagne.com',
      cookie_expires: config.cookie_days * 86400,
      cookie_update: false,
      cookie_flags: 'SameSite=Lax;Secure',
      page_location: config.production_origin + config.page_path,
      page_referrer: referrer,
      page_title: document.title,
      language: document.documentElement.lang
    });
    gtag('event', 'page_view', {send_to: id});
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + id;
    script.referrerPolicy = 'origin';
    document.head.appendChild(script);
  }
  function apply(value) {
    choice = value;
    if (choice !== 'granted') {
      window['ga-disable-' + id] = true;
      clearCookies();
      // Unload the tag so declining does not leave background measurement running.
      if (loaded) { location.reload(); return; }
    }
    banner.hidden = choice !== null;
    start();
  }
  // Clicks express intent, not completed inquiries, downloads, or conversions.
  // Do not queue clicks made before consent or collect arbitrary DOM/URL text.
  document.addEventListener('click', event => {
    if (!production || !loaded || choice !== 'granted' || event.defaultPrevented) return;
    const action = event.target?.closest?.('a[data-measure-action]')?.dataset.measureAction;
    if (action === 'contact_email') {
      window.gtag('event', 'contact_intent', {send_to: id, method: 'email'});
    } else if (action === 'project_crapkit' || action === 'research_report') {
      window.gtag('event', 'select_content', {
        send_to: id,
        content_type: action === 'project_crapkit' ? 'project' : 'research',
        item_id: action === 'project_crapkit' ? 'crapkit' : 'historical_report'
      });
    }
  });
  document.querySelectorAll('[data-analytics-settings]').forEach(button => {
    button.hidden = false;
    button.addEventListener('click', () => {
      returnFocus = button;
      banner.hidden = false;
      banner.querySelector('button').focus();
    });
  });
  banner.querySelectorAll('[data-analytics-choice]').forEach(button => button.addEventListener('click', () => {
    const value = button.dataset.analyticsChoice;
    try { localStorage.setItem(key, JSON.stringify({choice: value, version: config.consent_version, expires: Date.now() + ttl})); }
    catch { /* Still honor this page's choice if browser storage is unavailable. */ }
    apply(value);
    returnFocus?.focus();
  }));
  window.addEventListener('storage', event => {
    if (event.key === key || event.key === null) apply(savedChoice());
  });
  apply(savedChoice());
})();
