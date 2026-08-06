(function () {
  'use strict';

  const params = new URLSearchParams(window.location.search);
  if (params.get('design-reference') === '1') return;

  const next = new URL('login.html', window.location.href);
  const source = window.location.pathname.split('/').pop() || 'legacy-onboarding';
  next.searchParams.set('source', source);

  ['ref', 'instant'].forEach(function (key) {
    const value = params.get(key);
    if (value) next.searchParams.set(key, value);
  });

  window.location.replace(next.href);
})();
