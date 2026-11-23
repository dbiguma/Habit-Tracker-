// Tiny hash router: "#/today", "#/week", "#/history", "#/day/2026-11-20", "#/settings".
// Hash URLs keep every path relative, which GitHub Pages project sites need.

let routeTable = {};
let rootEl = null;
let afterRender = () => {};

export function parseHash(hash = location.hash) {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  return { name: parts[0] || 'today', params: parts.slice(1) };
}

export function navigate(name, { replace = false } = {}) {
  const hash = `#/${name}`;
  if (replace) location.replace(hash);
  else location.hash = hash;
}

function show(scrollToTop) {
  const { name, params } = parseHash();
  const route = routeTable[name];
  if (!route) { navigate('today', { replace: true }); return; }
  if (route.guard) {
    const redirect = route.guard(params);
    if (redirect) { navigate(redirect, { replace: true }); return; }
  }
  rootEl.replaceChildren();
  route.render(rootEl, params);
  afterRender(name, route);
  if (scrollToTop) window.scrollTo(0, 0);
}

/** Redraw the current screen without moving the scroll position. */
export function refresh() { show(false); }

export function startRouter(root, routes, onAfterRender) {
  rootEl = root;
  routeTable = routes;
  afterRender = onAfterRender ?? afterRender;
  window.addEventListener('hashchange', () => show(true));
  show(true);
}
