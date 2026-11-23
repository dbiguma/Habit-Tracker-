// App start-up: screens + tab bar, service worker, day rollover at midnight.
// To add a screen later (food log, journal, reports): import it, add it to `routes`,
// and (optionally) add a tab to `tabs`.
import { startRouter, refresh } from './router.js';
import { el, toast } from './ui.js';
import { load, getLoadProblem } from './storage.js';
import { todayKey, isValidKey } from './dates.js';
import * as todayScreen from './screens/today.js';
import * as weekScreen from './screens/week.js';
import * as historyScreen from './screens/history.js';
import * as settingsScreen from './screens/settings.js';
import { renderDayEditor } from './screens/day-editor.js';

const tabs = [
  { name: 'today', label: 'Today', icon: '☀️' },
  { name: 'week', label: 'Week', icon: '📊' },
  { name: 'history', label: 'History', icon: '🗓️' },
  { name: 'settings', label: 'Settings', icon: '⚙️' },
];

const routes = {
  today: { title: 'Today', render: todayScreen.render },
  week: { title: 'This Week', render: weekScreen.render },
  history: { title: 'History', render: historyScreen.render },
  settings: { title: 'Settings', render: settingsScreen.render },
  day: {
    title: 'Edit Day',
    tab: 'history',
    guard: ([key]) => {
      const today = todayKey();
      if (!isValidKey(key) || key > today) return 'history';
      if (key === today) return 'today';
      return null;
    },
    render: (root, [key]) => renderDayEditor(root, key),
  },
};

function buildTabBar() {
  const nav = document.querySelector('.tabbar');
  nav.replaceChildren(...tabs.map((t) => el('a', { class: 'tab', href: `#/${t.name}`, dataset: { tab: t.name } },
    el('span', { class: 'ic', 'aria-hidden': 'true' }, t.icon),
    el('span', {}, t.label))));
}

function markActiveTab(name, route) {
  const active = route.tab ?? name;
  for (const a of document.querySelectorAll('.tab')) {
    if (a.dataset.tab === active) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  }
  document.title = `${route.title} · Habit Tracker`;
}

// If the app stays open past midnight, switch "Today" to the new date.
let shownDay = todayKey();
function checkDayChange() {
  const now = todayKey();
  if (now === shownDay) return;
  if (document.activeElement?.tagName === 'INPUT') return; // don't interrupt typing; retry later
  shownDay = now;
  refresh();
}

// Offline support. A new version is installed in the background and used the next time
// the app comes back to the foreground.
let updateReady = false;
function setUpServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  const hadController = Boolean(navigator.serviceWorker.controller);
  navigator.serviceWorker.register('./sw.js').catch(() => {});
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (hadController) updateReady = true;
  });
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'visible') return;
  if (updateReady) { location.reload(); return; }
  navigator.serviceWorker?.getRegistration().then((r) => r?.update()).catch(() => {});
  checkDayChange();
});
setInterval(checkDayChange, 60 * 1000);

load();
buildTabBar();
startRouter(document.getElementById('app'), routes, markActiveTab);
setUpServiceWorker();
navigator.storage?.persist?.().catch(() => {});
if (getLoadProblem()) toast(getLoadProblem(), 'error');
