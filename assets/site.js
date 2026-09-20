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
  const header = document.querySelector('.site-header-grouped');
  const menu = header?.querySelector('.menu-toggle');
  const nav = header?.querySelector('#main-nav');
  if (header && menu && nav) {
    const mobile = window.matchMedia('(max-width: 900px)');
    const hover = window.matchMedia('(hover: hover) and (pointer: fine)');
    const groups = [...nav.querySelectorAll('.nav-group')];
    const trigger = group => group.querySelector('.nav-group-toggle');
    function setGroup(group, open) {
      groups.forEach(item => {
        const expanded = item === group && open;
        item.classList.toggle('is-open', expanded);
        trigger(item).setAttribute('aria-expanded', String(expanded));
      });
    }
    function closeMenu() {
      menu.setAttribute('aria-expanded', 'false');
      nav.classList.remove('is-open');
      setGroup(null, false);
    }
    header.classList.add('navigation-ready');
    closeMenu();
    menu.addEventListener('click', () => {
      const open = menu.getAttribute('aria-expanded') !== 'true';
      menu.setAttribute('aria-expanded', String(open));
      nav.classList.toggle('is-open', open);
      if (!open) setGroup(null, false);
    });
    groups.forEach((group, index) => {
      const button = trigger(group);
      button.addEventListener('click', () => setGroup(group, button.getAttribute('aria-expanded') !== 'true'));
      group.addEventListener('pointerenter', event => {
        if (!mobile.matches && hover.matches && event.pointerType !== 'touch') setGroup(group, true);
      });
      group.addEventListener('pointerleave', event => {
        if (!mobile.matches && event.pointerType !== 'touch' && !group.querySelector('.nav-submenu').contains(document.activeElement)) {
          group.classList.remove('is-open');
          button.setAttribute('aria-expanded', 'false');
        }
      });
      group.addEventListener('focusout', event => {
        // On mobile, closing during mousedown would move the next section before click.
        if (!mobile.matches && !group.contains(event.relatedTarget)) {
          group.classList.remove('is-open');
          button.setAttribute('aria-expanded', 'false');
        }
      });
      button.addEventListener('keydown', event => {
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
          event.preventDefault();setGroup(group, true);
          const links = [...group.querySelectorAll('.nav-submenu a')];
          (event.key === 'ArrowDown' ? links[0] : links.at(-1))?.focus();
        } else if (!mobile.matches && ['ArrowLeft', 'ArrowRight'].includes(event.key)) {
          event.preventDefault();setGroup(null, false);
          trigger(groups[(index + (event.key === 'ArrowRight' ? 1 : groups.length - 1)) % groups.length]).focus();
        }
      });
    });
    header.addEventListener('keydown', event => {
      if (event.key !== 'Escape') return;
      const open = groups.find(group => group.classList.contains('is-open'));
      if (open) {
        event.preventDefault();setGroup(null, false);trigger(open).focus();
      } else if (menu.getAttribute('aria-expanded') === 'true') {
        event.preventDefault();closeMenu();menu.focus();
      }
    });
    document.addEventListener('click', event => { if (!header.contains(event.target)) closeMenu(); });
    nav.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
    mobile.addEventListener('change', event => {
      const focused = document.activeElement;
      const wasInside = nav.contains(focused);
      closeMenu();
      if (event.matches && wasInside) menu.focus();
      else if (!event.matches && focused === menu) trigger(groups[0]).focus();
    });
  }

  const normalize = text => text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  document.querySelectorAll('[data-filter-root]').forEach(root => {
    const search = root.querySelector('[data-search-input]');
    const topic = root.querySelector('[data-topic-select]');
    const year = root.querySelector('[data-year-select]');
    const items = [...root.querySelectorAll('[data-search]')];
    const count = root.querySelector('[data-results]');
    const empty = root.querySelector('[data-empty]');
    const initial = new URLSearchParams(location.search);
    if (initial.has('q')) search.value = initial.get('q');
    if ([...topic.options].some(o => o.value === initial.get('topic'))) topic.value = initial.get('topic');
    if (year && [...year.options].some(o => o.value === initial.get('year'))) year.value = initial.get('year');
    function filter(updateURL=true) {
      const q = normalize(search.value.trim()); let visible=0;
      items.forEach(item => { const match = (!q || normalize(item.dataset.search).includes(q)) && (!topic.value || item.dataset.topic === topic.value) && (!year?.value || item.dataset.year === year.value); item.hidden = !match; if(match) visible++; });
      root.querySelectorAll('.card-grid').forEach(grid => { grid.dataset.count = [...grid.children].filter(item => !item.hidden).length; });
      const noun = root.querySelector('.media-directory') ? (french ? (visible === 1 ? 'résultat' : 'résultats') : (visible === 1 ? 'entry' : 'entries')) : (visible === 1 ? 'article' : 'articles');
      count.textContent = `${visible} ${noun}`;
      empty.hidden = visible !== 0;
      if (updateURL) { const p = new URLSearchParams(); if(search.value.trim()) p.set('q',search.value.trim()); if(topic.value) p.set('topic',topic.value); if(year?.value) p.set('year',year.value); history.replaceState(null,'',location.pathname+(p.size?'?'+p.toString():'')+location.hash); updateLanguageLinks(); }
    }
    search.addEventListener('input', () => filter()); topic.addEventListener('change', () => filter()); filter(false);
    year?.addEventListener('change', () => filter());
  });

  document.querySelectorAll('[data-embed]').forEach(button => {
    button.addEventListener('click', () => {
      const frame = document.createElement('iframe'); frame.src=button.dataset.embed; frame.title=button.dataset.title || (french ? 'Graphique interactif original' : 'Original interactive chart'); frame.loading='lazy'; frame.referrerPolicy='no-referrer'; frame.setAttribute('allowfullscreen','');
      const figure=button.closest('figure'); figure.appendChild(frame); figure.classList.add('is-loaded'); button.remove();
    });
  });
  const viewer = document.querySelector('.image-viewer');
  if (viewer && typeof viewer.showModal === 'function') {
    const canvas = viewer.querySelector('.viewer-canvas');
    const zoom = viewer.querySelector('[data-viewer-zoom]');
    let sourceControl;
    const resetZoom = () => {
      viewer.classList.remove('is-zoomed');
      zoom.setAttribute('aria-pressed','false');
      zoom.textContent = french ? 'Agrandir' : 'Zoom in';
    };
    document.addEventListener('click', event => {
      const control = event.target.closest('[data-image-viewer]');
      if (!control || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
      event.preventDefault(); sourceControl = control; resetZoom();
      const picture = document.createElement('img');
      picture.src = control.dataset.imageSrc; picture.alt = control.dataset.imageAlt || '';
      canvas.replaceChildren(picture);
      viewer.querySelector('[data-viewer-original]').href = picture.src;
      viewer.showModal();
      viewer.querySelector('[data-viewer-close]').focus();
    });
    zoom.addEventListener('click', () => {
      const expanded = viewer.classList.toggle('is-zoomed');
      zoom.setAttribute('aria-pressed',String(expanded));
      zoom.textContent = expanded ? (french ? 'Ajuster à l’écran' : 'Fit to screen') : (french ? 'Agrandir' : 'Zoom in');
    });
    viewer.querySelector('[data-viewer-close]').addEventListener('click', () => viewer.close());
    viewer.addEventListener('close', () => { sourceControl?.focus(); });
    viewer.addEventListener('click', event => { if (event.target === viewer) viewer.close(); });
  }
  document.querySelectorAll('.reading-contents a').forEach(link => link.addEventListener('click', () => {
    link.closest('details').open = false;
  }));
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
