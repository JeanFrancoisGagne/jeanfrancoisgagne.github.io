(() => {
  const link = document.querySelector('a[data-redirect]');
  if (!link) return;
  const target = new URL(link.getAttribute('href'), location.origin);
  target.search = location.search;
  target.hash = location.hash;
  location.replace(target.href);
})();
