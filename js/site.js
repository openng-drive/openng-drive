// Version, download counter and "playing now" for the openNG.drive website.
// Counters live on abacus.jasoncameron.dev (free public counter service):
//   openng-drive/downloads       +1 every time someone clicks a download link
//   openng-drive/online-<slot>   +1 from every running launcher, once per 5-minute slot
const COUNTER = 'https://abacus.jasoncameron.dev';
const NS = 'openng-drive';
const fmt = (n) => Number(n).toLocaleString('en-US');

async function counter(key) {
  try {
    const r = await fetch(`${COUNTER}/info/${NS}/${key}`, { cache: 'no-store' });
    const j = await r.json();
    return j.exists ? j.value : 0;
  } catch { return null; }
}

function setText(sel, text) { document.querySelectorAll(sel).forEach((e) => { e.textContent = text; }); }

// version + size of the download
fetch('update.json', { cache: 'no-store' }).then((r) => r.json()).then((u) => {
  if (u.version) setText('[data-version]', u.version);
}).catch(() => {});
fetch('openNG.drive.zip', { method: 'HEAD', cache: 'no-store' }).then((r) => {
  const n = +r.headers.get('content-length');
  if (n > 0) setText('[data-size]', (n / 1048576).toFixed(1) + ' MB');
}).catch(() => {});

// download count
async function showDownloads() {
  const n = await counter('downloads');
  if (n === null) return;
  setText('[data-downloads]', fmt(n));
  document.querySelectorAll('[data-downloads-row]').forEach((e) => { e.hidden = false; });
}
document.querySelectorAll('a[data-dl]').forEach((a) => a.addEventListener('click', () => {
  // count it, without holding up the download
  try { fetch(`${COUNTER}/hit/${NS}/downloads`, { keepalive: true, cache: 'no-store' }); } catch {}
}));

// players with openNG.drive open right now (this and the previous 5-minute window)
async function showOnline() {
  const slot = Math.floor(Date.now() / 1000 / 300);
  const [a, b] = await Promise.all([counter('online-' + slot), counter('online-' + (slot - 1))]);
  if (a === null && b === null) return;
  const n = Math.max(a || 0, b || 0);
  setText('[data-online]', n === 0 ? 'Nobody' : fmt(n));
  setText('[data-online-word]', n === 1 ? 'is driving with openNG.drive right now' : n === 0 ? 'is online right now' : 'are driving with openNG.drive right now');
  document.querySelectorAll('[data-online-dot]').forEach((e) => e.classList.toggle('off', n === 0));
  document.querySelectorAll('[data-online-row]').forEach((e) => { e.hidden = false; });
}
showDownloads();
showOnline();
setInterval(showOnline, 60000);

// light / dark
const root = document.documentElement;
try { const t = localStorage.getItem('theme'); if (t) root.dataset.theme = t; } catch {}
document.querySelectorAll('[data-theme-toggle]').forEach((b) => b.addEventListener('click', () => {
  const dark = root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  root.dataset.theme = dark ? 'light' : 'dark';
  try { localStorage.setItem('theme', root.dataset.theme); } catch {}
}));
