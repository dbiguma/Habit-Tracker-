# Habit Tracker

A simple, private habit tracker for iPhone. Log water, sleep, exercise and steps, set your own goals, and see your weekly progress and streaks.

- Plain HTML, CSS and JavaScript. No frameworks, no build step, no outside libraries.
- Data is saved **only on your device** (localStorage). No accounts, no servers, no tracking.
- Works offline after the first visit, and installs to the iPhone Home Screen.

## Habits and default goals

| Habit | Default goal | Notes |
|---|---|---|
| 💧 Water | 64 fl oz (0.5 gal / 1.89 L) | Switch between fl oz and liters. The other units are shown as a conversion. Stored in fl oz. |
| 😴 Sleep | 7 hours | Hours + minutes, to the minute. Log it the morning you wake up. Stored in minutes. |
| 🏃 Exercise | 30 minutes | Add one or more sessions (minutes + type). Total minutes count toward the goal. A 0-minute session records a day with no exercise. |
| 👟 Steps | 10,000 | Type the number in, or use ±1,000. |

## Forgot to log?

The **Log yesterday** bar at the top of Today opens yesterday in one tap and shows whether anything is logged. Older days are under **History**.

## How the math works

- **✅ Goal met** when the amount logged is **at or above** the goal. "Not logged" counts as ❌.
- Each day keeps the goal it was logged with. Changing a goal affects today and future days only.
- **This Week** = how many of the last 7 days (today plus the 6 before it) met the goal.
- **Streak** = consecutive days meeting the goal, counting back from today. If today isn't met *yet*, counting starts from yesterday, so an unfinished day doesn't break your streak.

## Run it on your computer

You need a small local web server, because browsers won't run this app by double-clicking `index.html`. Python is built into macOS.

```bash
cd habit-tracker
python3 -m http.server 8000
```

Then open:

- App: http://localhost:8000
- Math tests: http://localhost:8000/tests/tests.html (everything should be green)

**Helpful checks in Chrome DevTools** (View → Developer → Developer Tools):

- Device toolbar (phone icon) → choose an iPhone, to see the phone layout.
- **Application** tab → *Manifest* (icons and name), *Service workers* (should say "activated"), *Local storage* (your data).
- Application → Service workers → tick **Offline**, then reload. The app should still work.

## Publish on GitHub Pages

1. Create a **public** repository (for example `habit-tracker`) and upload all of these files to it.
2. Repository **Settings → Pages → Build and deployment**: Source = *Deploy from a branch*, Branch = `main`, folder `/ (root)`. Save.
3. After a minute, it's live at `https://<your-username>.github.io/habit-tracker/`.

## Install on iPhone

1. Open the link in **Safari**.
2. Tap **Share** → **Add to Home Screen** → **Add**.
3. Open it from the new icon. It runs in its own window with no browser bar.

> Safari and the Home Screen app keep **separate** data. After installing, use only the icon.

## Backups

Settings → **Export data** saves a `.json` file (on iPhone, choose *Save to Files*). **Import data** restores from that file and replaces what's on the device. If you delete the app or reset your phone, your data is gone unless you have an export.

## Updating the app after changes

1. Open `sw.js` and change `VERSION` (for example `'v1.0.0'` → `'v1.0.1'`).
2. If you added a new file, add it to the `FILES` list in `sw.js`.
3. Publish. Phones download the new version in the background and switch to it the next time the app is reopened.

## Code layout (for future versions)

```
index.html, manifest.webmanifest, sw.js
css/styles.css
js/app.js          start-up, tabs, routes
js/router.js       #/today, #/week, #/history, #/day/YYYY-MM-DD, #/settings
js/dates.js        local-time-zone date helpers
js/units.js        fl oz / gallon / liter conversions
js/storage.js      localStorage, export/import validation, data-version upgrades
js/stats.js        goal met, weekly count, streak
js/ui.js           shared controls (stepper, toggle, toast)
js/habits/         one file per habit + index.js (the registry)
js/screens/        one file per screen
icons/             icon.svg (source) + PNGs
tests/             tests.html + tests.js
```

- **New habit** (such as meditation): add `js/habits/meditation.js` with the same shape as the others, register it in `js/habits/index.js`, and add the file to `sw.js`. Today, Week, History, Settings and streaks pick it up automatically.
- **New screen** (food log, journal, reports): add `js/screens/<name>.js`, then add it to `routes` and `tabs` in `js/app.js` and to `sw.js`.
- **Data format change**: increase `SCHEMA_VERSION` in `js/storage.js` and add an upgrade step to `migrations`.
