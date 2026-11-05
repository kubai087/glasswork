/*
 * ?debug=1: a panel in the corner for checking the page on a device you
 * can't attach developer tools to (an in-app browser on a phone). It lists
 * errors, the browser and each glass surface's box and drawing state, and
 * has switches that turn parts of the material off, so a screenshot shows
 * which part a browser can't draw.
 */
const panel = document.createElement('div');
panel.style.cssText = [
  'position:fixed', 'z-index:2147483647', 'left:6px', 'right:6px', 'bottom:6px', 'max-height:46vh', 'overflow:auto',
  'padding:8px 10px', 'border-radius:10px', 'background:rgba(0,0,0,.82)', 'color:#e8f0ff',
  'font:11px/1.35 ui-monospace,Menlo,monospace', 'white-space:pre-wrap', 'word-break:break-all',
].join(';');
const text = document.createElement('div');
const bar = document.createElement('div');
bar.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;margin-top:6px';
panel.append(text, bar);
document.body.append(panel);

const style = document.createElement('style');
document.head.append(style);
const switches = { blur: true, blend: true, video: true, transitions: true };
function restyle() {
  style.textContent = [
    switches.blur ? '' : '.glass::before { -webkit-backdrop-filter: none !important; backdrop-filter: none !important; }',
    switches.blend ? '' : '.glass * { mix-blend-mode: normal !important; }',
    switches.video ? '' : '.wall video { display: none !important; }',
    switches.transitions ? '' : '.glass { transition: none !important; }',
  ].join('\n');
}
for (const key of Object.keys(switches)) {
  const button = document.createElement('button');
  button.style.cssText = 'font:inherit;padding:5px 9px;border-radius:7px;border:0;background:#2d6cdf;color:#fff';
  const label = () => { button.textContent = `${key}: ${switches[key] ? 'on' : 'off'}`; };
  button.addEventListener('click', (event) => {
    event.stopPropagation();
    switches[key] = !switches[key];
    label();
    restyle();
  });
  label();
  bar.append(button);
}

function report() {
  const css = (el, p) => getComputedStyle(el).getPropertyValue(p);
  const lines = [
    navigator.userAgent,
    `viewport ${innerWidth}x${innerHeight} dpr ${devicePixelRatio} --u ${css(document.querySelector('.stage'), '--u')}`,
    `sheets ${[...document.styleSheets].map((s) => { try { return `${(s.href || 'inline').split('/').pop()}:${s.cssRules.length}`; } catch { return `${(s.href || '').split('/').pop()}:x`; } }).join(' ')}`,
    `supports backdrop ${CSS.supports('backdrop-filter', 'blur(2px)')} -webkit ${CSS.supports('-webkit-backdrop-filter', 'blur(2px)')} color-mix ${CSS.supports('color', 'color-mix(in srgb, red 50%, blue)')} @property ${'registerProperty' in CSS}`,
  ];
  for (const el of document.querySelectorAll('.glass')) {
    const r = el.getBoundingClientRect();
    lines.push(`${el.dataset.surface} ${Math.round(r.x)},${Math.round(r.y)} ${Math.round(r.width)}x${Math.round(r.height)} op ${css(el, 'opacity')} vis ${css(el, 'visibility')} kind ${el.dataset.kind} bg ${css(el, 'background-color')} bf ${css(el, '-webkit-backdrop-filter').slice(0, 60)}`);
  }
  const card = document.querySelector('.player');
  if (card) lines.push(`player kids ${[...card.querySelectorAll('*')].length} first ${card.firstElementChild?.className} html ${card.innerHTML.length}`);
  const video = document.querySelector('.wall .is-light');
  lines.push(`tahoe video rs ${video.readyState} paused ${video.paused}`);
  lines.push(`errors: ${(window.__errors || []).join(' | ') || 'none'}`);
  text.textContent = lines.join('\n');
}
report();
setInterval(report, 1000);
