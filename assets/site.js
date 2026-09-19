(() => {
  'use strict';
  const french = document.documentElement.lang === 'fr';
  const languageLinks = [...document.querySelectorAll('.language-switch a,.language-links a,.translation-link')];
  languageLinks.forEach(link => { link.dataset.languagePath = new URL(link.href).pathname; });
  function updateLanguageLinks() {
    const query = new URLSearchParams(location.search);
    ['lang','p','page_id','attachment_id'].forEach(key => query.delete(key));
    let fragment = '';
    try { fragment = decodeURIComponent(location.hash.slice(1)); } catch { /* Invalid old bookmark. */ }
    languageLinks.forEach(link => {
      const target = new URL(link.dataset.languagePath, location.origin);
      target.search = query.toString();
      if (fragment && link.dataset.fragments.split(' ').includes(fragment)) target.hash = fragment;
      link.href = target.pathname + target.search + target.hash;
    });
  }
  updateLanguageLinks();
  window.addEventListener('hashchange', updateLanguageLinks);
  window.addEventListener('popstate', updateLanguageLinks);
  languageLinks.forEach(link => link.addEventListener('pointerdown', updateLanguageLinks));
  languageLinks.forEach(link => link.addEventListener('focus', updateLanguageLinks));
  const menu = document.querySelector('.menu-toggle');
  const nav = document.getElementById('main-nav');
  const closeMenu = () => { if (!menu || !nav) return; menu.setAttribute('aria-expanded','false'); nav.classList.remove('is-open'); };
  menu?.addEventListener('click', () => { const open = menu.getAttribute('aria-expanded') !== 'true'; menu.setAttribute('aria-expanded', String(open)); nav.classList.toggle('is-open',open); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && menu?.getAttribute('aria-expanded') === 'true') { closeMenu(); menu.focus(); } });
  document.addEventListener('click', e => { if (nav?.classList.contains('is-open') && !e.target.closest('.site-header')) closeMenu(); });
  window.matchMedia('(min-width: 801px)').addEventListener('change', e => { if(e.matches) closeMenu(); });

  const normalize = text => text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  document.querySelectorAll('[data-filter-root]').forEach(root => {
    const search = root.querySelector('[data-search-input]');
    const topic = root.querySelector('[data-topic-select]');
    const items = [...root.querySelectorAll('[data-search]')];
    const count = root.querySelector('[data-results]');
    const empty = root.querySelector('[data-empty]');
    const initial = new URLSearchParams(location.search);
    if (initial.has('q')) search.value = initial.get('q');
    if ([...topic.options].some(o => o.value === initial.get('topic'))) topic.value = initial.get('topic');
    function filter(updateURL=true) {
      const q = normalize(search.value.trim()); let visible=0;
      items.forEach(item => { const match = (!q || normalize(item.dataset.search).includes(q)) && (!topic.value || item.dataset.topic === topic.value); item.hidden = !match; if(match) visible++; });
      const noun = root.querySelector('.media-directory') ? (french ? (visible === 1 ? 'résultat' : 'résultats') : (visible === 1 ? 'entry' : 'entries')) : (visible === 1 ? 'article' : 'articles');
      count.textContent = `${visible} ${noun}`;
      empty.hidden = visible !== 0;
      if (updateURL) { const p = new URLSearchParams(); if(search.value.trim()) p.set('q',search.value.trim()); if(topic.value) p.set('topic',topic.value); history.replaceState(null,'',location.pathname+(p.size?'?'+p.toString():'')+location.hash); updateLanguageLinks(); }
    }
    search.addEventListener('input', () => filter()); topic.addEventListener('change', () => filter()); filter(false);
  });

  document.querySelectorAll('[data-embed]').forEach(button => {
    button.addEventListener('click', () => {
      const frame = document.createElement('iframe'); frame.src=button.dataset.embed; frame.title=button.dataset.title || (french ? 'Graphique interactif original' : 'Original interactive chart'); frame.loading='lazy'; frame.referrerPolicy='no-referrer'; frame.setAttribute('allowfullscreen','');
      const figure=button.closest('figure'); figure.appendChild(frame); button.remove();
    });
  });
  document.querySelectorAll('[data-copy]').forEach(button => {
    button.addEventListener('click', async () => {
      const text = document.querySelector(button.dataset.copy).textContent;
      const status = document.querySelector('[data-copy-status]');
      try { await navigator.clipboard.writeText(text); status.textContent=french ? 'Biographie copiée.' : 'Biography copied.'; }
      catch { const range=document.createRange(); range.selectNodeContents(document.querySelector(button.dataset.copy)); const selection=window.getSelection(); selection.removeAllRanges(); selection.addRange(range); status.textContent=french ? 'Biographie sélectionnée. Utilisez la commande de copie de votre appareil.' : 'Biography selected. Use your device’s copy command.'; }
    });
  });
  // Keep wide historical report tables readable on small screens.
  document.querySelectorAll('.prose table').forEach(table => {
    if (table.parentElement.classList.contains('table-scroll')) return;
    const wrapper = document.createElement('div'); wrapper.className='table-scroll'; wrapper.tabIndex=0; wrapper.setAttribute('role','region'); wrapper.setAttribute('aria-label',table.caption?.textContent || (french ? 'Tableau de données défilant' : 'Scrollable data table')); table.before(wrapper); wrapper.appendChild(table);
  });
})();
