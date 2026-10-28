// Version, release notes, download count and "launcher open right now" for the website.
// Counters live on abacus.jasoncameron.dev (a free public counter service):
//   openng-drive/downloads      +1 for every click on a download link
//   openng-drive/live-<slot>    +1 from every open launcher in each 15-second window (1.6.3 and newer)
//   openng-drive/online-<slot>  +1 from older launchers in each five-minute window
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
const setText = (sel, text) => document.querySelectorAll(sel).forEach((e) => { e.textContent = text; });

// version, size and the notes of the current release
fetch('update.json', { cache: 'no-store' }).then((r) => r.json()).then((u) => {
  if (u.version) setText('[data-version]', u.version);
  const box = document.querySelector('[data-notes]');
  const lines = String(u.notes || '').split('\n').map((l) => l.replace(/^[•\-*]\s*/, '').trim()).filter(Boolean);
  if (box && lines.length) {
    box.textContent = '';
    const ul = document.createElement('ul');
    for (const l of lines) { const li = document.createElement('li'); li.textContent = l; ul.append(li); }
    box.append(ul);
  }
}).catch(() => {});
fetch('openNG.drive.zip', { method: 'HEAD', cache: 'no-store' }).then((r) => {
  const n = +r.headers.get('content-length');
  if (n > 0) setText('[data-size]', (n / 1048576).toFixed(1) + ' MB');
}).catch(() => {});

// downloads
counter('downloads').then((n) => {
  if (n === null) return;
  setText('[data-downloads]', fmt(n));
  document.querySelectorAll('[data-downloads-row]').forEach((e) => { e.hidden = false; });
});
document.querySelectorAll('a[data-dl]').forEach((a) => a.addEventListener('click', () => {
  // counted without holding up the download
  try { fetch(`${COUNTER}/hit/${NS}/downloads`, { keepalive: true, cache: 'no-store' }); } catch {}
}));

// launchers open right now: the larger of this and the last 15-second window,
// plus older launchers that still count in five-minute windows (asked once a minute)
let legacy = 0, legacyAt = 0;
async function showOnline() {
  const now = Date.now() / 1000;
  const s = Math.floor(now / 15);
  const [a, b] = await Promise.all([counter('live-' + s), counter('live-' + (s - 1))]);
  if (a === null && b === null) return;
  if (Date.now() - legacyAt > 60000) {
    const t = Math.floor(now / 300);
    const [c, d] = await Promise.all([counter('online-' + t), counter('online-' + (t - 1))]);
    legacy = Math.max(c || 0, d || 0);
    legacyAt = Date.now();
  }
  const n = Math.max(a || 0, b || 0) + legacy;
  setText('[data-online]', n === 0 ? 'Nobody' : fmt(n));
  setText('[data-online-word]', n === 0 ? 'has the launcher open right now' : n === 1 ? 'person has the launcher open right now' : 'people have the launcher open right now');
  document.querySelectorAll('[data-online-dot]').forEach((e) => e.classList.toggle('off', n === 0));
  document.querySelectorAll('[data-online-row]').forEach((e) => { e.hidden = false; });
}
showOnline();
setInterval(() => { if (!document.hidden) showOnline(); }, 10000);
