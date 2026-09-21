/* Per-recording consent: no storage, background player, autoplay or global opt-in. */
(() => {
  'use strict';
  document.querySelectorAll('[data-watch-player]').forEach(player => {
    const screen = player.querySelector('[data-watch-screen]');
    const load = player.querySelector('[data-watch-load]');
    const remove = player.querySelector('[data-watch-remove]');
    const poster = player.querySelector('.watch-poster');
    const status = player.querySelector('[data-watch-status]');
    let frame = null;
    load.addEventListener('click', () => {
      if (frame) return;
      const address = new URL(load.dataset.videoEmbed);
      if (address.origin !== 'https://www.youtube-nocookie.com' || !/^\/embed\/[\w-]{11}$/.test(address.pathname)) return;
      address.searchParams.set('autoplay', '0');
      frame = document.createElement('iframe');
      frame.title = load.dataset.videoTitle;
      frame.src = address.href;
      frame.referrerPolicy = 'strict-origin-when-cross-origin';
      frame.allow = 'encrypted-media; picture-in-picture; fullscreen';
      frame.setAttribute('allowfullscreen', '');
      frame.setAttribute('tabindex', '0');
      screen.appendChild(frame);
      poster.hidden = true;
      load.hidden = true;
      remove.hidden = false;
      status.textContent = load.dataset.loadedMessage;
      frame.focus();
    });
    remove.addEventListener('click', () => {
      if (frame) frame.remove();
      frame = null;
      poster.hidden = false;
      load.hidden = false;
      remove.hidden = true;
      status.textContent = load.dataset.removedMessage;
      load.focus();
    });
  });
})();
