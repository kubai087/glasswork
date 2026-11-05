/*
 * Glasswork: Lumno's liquid glass material over a moving wallpaper, with
 * every part of the material on the panel.
 *
 * - glass.css: the material, as tokens; each surface uses four declarations.
 * - lens.js: the rim lens (Chromium), a standalone module.
 * - adapt.js: reading the wallpaper under each surface: ink, tint density,
 *   saturation and the least tint its text needs.
 * - wallpapers.js: moving wallpapers drawn live in WebGL, besides Tahoe.
 * - refract.js: the glass's backdrop drawn in WebGL, refraction included,
 *   where backdrop-filter can't take an SVG filter (Safari, Firefox).
 *
 * Every setting goes in the URL (only those that differ from the defaults),
 * so a reload or a shared link opens the same glass. Keys: H hides the
 * panel, T switches the theme, W the wallpaper, Space pauses it.
 */
import { liquidGlass, isLensSupported } from './lens.js';
import { sampler, pickInk, adapt, tintFloor, luma } from './adapt.js';
import { createPane } from './panel.js';
import { createScene, SCENES } from './wallpapers.js';
import { createRefraction } from './refract.js';
import { language, t, translate } from './i18n.js';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const stage = $('.stage');
const wall = $('.wall');
const videos = { light: $('.wall .is-light'), dark: $('.wall .is-dark') };
// The surfaces that can be dragged, and every pane of glass.
const surfaces = $$('.surfaces > .glass');
const toolbar = $('.toolbar');
const glasses = [...surfaces, toolbar];
const player = $('.player');
const tintRange = $('.tint-range');
const tintValue = $('.tint-value');
const dialog = $('.code-dialog');
const params = new URLSearchParams(location.search);
const PHONE = matchMedia('(max-width: 720px)');
const cornerShapes = typeof CSS !== 'undefined' && CSS.supports?.('corner-shape', 'superellipse(2)');
const lensSupported = isLensSupported();

// ---------- Settings ----------

// The two materials, as on Lumno's New Tab page.
const MATERIALS = {
  light: { tint: '#ffffff', opacity: 1, thin: 0.06, dense: 0.22, blur: 2, saturation: 1.8, brightness: 1.06, contrast: 1, rimLight: 1, bevel: 1, shadow: 1 },
  dark: { tint: '#1e1e22', opacity: 1, thin: 0.16, dense: 0.38, blur: 2, saturation: 1.6, brightness: 0.8, contrast: 1, rimLight: 1, bevel: 1, shadow: 1 },
};

// The wallpapers, in the panel's order: macOS's abstract ones from Tahoe
// back to Big Sur (Apple's), the scenes drawn live (wallpapers.js), a
// random photo, and the visitor's own file or link.
const WALLPAPERS = {
  Tahoe: 'tahoe', Sonoma: 'sonoma', Ventura: 'ventura', Monterey: 'monterey', 'Big Sur': 'bigsur',
  Mesh: 'mesh', Dunes: 'dunes', Aurora: 'aurora', Lava: 'lava', Rings: 'lines', Bokeh: 'bokeh',
  'Random photo': 'photo', 'Your own': 'custom',
};

// macOS's abstract wallpapers before Tahoe (Apple's, not covered by this
// project's license), served with the page. Each has a light and a dark
// look that follow the theme, as Tahoe's do; Sonoma's moves, the others
// are stills.
const APPLE = {
  sonoma: { name: 'macOS Sonoma', video: true },
  ventura: { name: 'macOS Ventura', video: false },
  monterey: { name: 'macOS Monterey', video: false },
  bigsur: { name: 'macOS Big Sur', video: false },
};
const appleCredit = (name) => ({ text: language.value === 'zh' ? `${name} 壁纸 © Apple Inc.` : `${name} wallpaper © Apple Inc.` });

const DEFAULTS = {
  theme: 'light',
  wallpaper: 'tahoe',
  // The random photo's Picsum id, so a link opens the same one (0: any).
  photo: 0,
  // How fast the wallpaper moves.
  speed: 1,
  // theme: dark ink on light glass under the light theme, light ink on
  // dark glass under the dark one; auto reads the wallpaper under each
  // surface; dark or light holds one ink everywhere.
  ink: 'theme',
  // The tint's density from the wallpaper, or the one set here.
  autoDensity: true,
  density: 0.35,
  // No surface's tint below the least its text needs for 4.5:1.
  legible: true,
  threshold: 0.5,
  // The rim lens: its widest, how far the edge samples inward (in rims),
  // how fast the bend falls off, and the color split.
  lens: true,
  rim: 40,
  edge: 1.1,
  power: 2.6,
  dispersion: 0.15,
  // Corner radius (Lumno pixels) and smoothing (CSS superellipse(k)).
  radius: 28,
  smoothing: 1.25,
  paused: false,
};

const LIMITS = {
  density: [0, 1], threshold: [0.2, 0.8], rim: [4, 96], edge: [0, 2.5], power: [1, 6], dispersion: [0, 0.4],
  radius: [0, 60], smoothing: [0.5, 3], speed: [0, 3], photo: [0, 100000],
  opacity: [0, 1.5], thin: [0, 0.8], dense: [0, 0.95], blur: [0, 40], saturation: [0, 3], brightness: [0.4, 1.6],
  contrast: [0.4, 1.6], rimLight: [0, 2], bevel: [0, 2.5], shadow: [0, 3],
};

// Starting points for the material. A preset sets only the material's
// body (PRESET_KEYS), each value it leaves out back to Lumno's; the tint's
// color and opacity, the scene, the adaptation and the shape stay as they
// are.
const PRESET_KEYS = {
  state: ['lens', 'rim', 'edge', 'power', 'dispersion'],
  material: ['thin', 'dense', 'blur', 'saturation', 'brightness', 'contrast', 'rimLight', 'bevel', 'shadow'],
};
const PRESETS = {
  Lumno: {},
  'Clear glass': { light: { thin: 0, dense: 0 }, dark: { thin: 0, dense: 0 } },
  Frosted: {
    lens: false,
    light: { thin: 0.42, dense: 0.68, blur: 30, saturation: 1.7, contrast: 0.6, brightness: 1.18, bevel: 0.4 },
    dark: { thin: 0.24, dense: 0.48, blur: 30, saturation: 1.5, contrast: 0.82, brightness: 0.7, bevel: 0.4 },
  },
  'Thick slab': {
    rim: 64, edge: 1.6, power: 2, dispersion: 0.24,
    light: { rimLight: 1.4, bevel: 1.8 }, dark: { rimLight: 1.4, bevel: 1.8 },
  },
  Vivid: {
    dispersion: 0.22,
    light: { thin: 0.03, dense: 0.14, saturation: 2.4 },
    dark: { thin: 0.12, dense: 0.3, saturation: 2.2 },
  },
};

// Tints to start from, for each material.
const SWATCHES = {
  light: { Clear: '#ffffff', Warm: '#fff3e2', Sky: '#dcebff', Rose: '#ffe0ea', Mint: '#d9f6e8', Lilac: '#ebe2ff', Sand: '#ffe3ad', Lime: '#eaf8c4' },
  dark: { Slate: '#1e1e22', Night: '#0f1a2e', Plum: '#2a1731', Forest: '#10261c', Ocean: '#0a2637', Wine: '#2f1218', Cocoa: '#2a1d14', Black: '#000000' },
};

const clone = (value) => JSON.parse(JSON.stringify(value));
const state = { ...DEFAULTS };
const materials = clone(MATERIALS);
const chosen = { preset: 'Lumno' };
const slug = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
const pick = (source, keys) => Object.fromEntries(keys.map((key) => [key, source[key]]));

// What a preset stands for: Lumno's values for the keys presets set, with
// the preset's own laid over them.
function presetValues(name) {
  const { light, dark, ...rest } = PRESETS[name] ?? {};
  return {
    state: { ...pick(DEFAULTS, PRESET_KEYS.state), ...rest },
    light: { ...pick(MATERIALS.light, PRESET_KEYS.material), ...light },
    dark: { ...pick(MATERIALS.dark, PRESET_KEYS.material), ...dark },
  };
}

function applyPreset(name) {
  const values = presetValues(name);
  chosen.preset = name;
  Object.assign(state, values.state);
  Object.assign(materials.light, values.light);
  Object.assign(materials.dark, values.dark);
}

// Where the URL counts from: the defaults under the chosen preset. Only
// what differs from it goes in the URL.
function baseline() {
  const values = presetValues(chosen.preset);
  return {
    state: { ...DEFAULTS, ...values.state },
    light: { ...MATERIALS.light, ...values.light },
    dark: { ...MATERIALS.dark, ...values.dark },
  };
}

const clampTo = (value, [lo, hi]) => Math.min(hi, Math.max(lo, value));
const isHex = (raw) => /^#?[0-9a-f]{6}$/i.test(raw);
const toHex = (raw) => (raw.startsWith('#') ? raw : `#${raw}`).toLowerCase();

// A value from the URL, held to the panel's range.
function parseInto(target, key, raw, fallback) {
  if (typeof fallback === 'number') {
    const value = Number(raw);
    if (raw !== '' && Number.isFinite(value)) target[key] = LIMITS[key] ? clampTo(value, LIMITS[key]) : value;
  } else if (typeof fallback === 'boolean') {
    target[key] = raw !== '0' && raw !== 'false';
  } else if (fallback.startsWith('#')) {
    if (isHex(raw)) target[key] = toHex(raw);
  } else {
    target[key] = raw;
  }
}

// ?preset= starts from a preset; the other values override it.
applyPreset(Object.keys(PRESETS).find((name) => slug(name) === params.get('preset')?.toLowerCase()) ?? 'Lumno');
for (const [key, fallback] of Object.entries(DEFAULTS)) {
  if (params.has(key)) parseInto(state, key, params.get(key), fallback);
}
for (const kind of ['light', 'dark']) {
  for (const [key, fallback] of Object.entries(MATERIALS[kind])) {
    const name = `${kind[0]}.${key}`;
    if (params.has(name)) parseInto(materials[kind], key, params.get(name), fallback);
  }
}
if (!['light', 'dark'].includes(state.theme)) state.theme = DEFAULTS.theme;
if (!['theme', 'auto', 'light', 'dark'].includes(state.ink)) state.ink = DEFAULTS.ink;
if (!Object.values(WALLPAPERS).includes(state.wallpaper) || state.wallpaper === 'custom') state.wallpaper = DEFAULTS.wallpaper;

const format = (value) => {
  if (typeof value === 'boolean') return value ? '1' : '0';
  if (typeof value === 'number') return String(+value.toFixed(4));
  return String(value).replace(/^#/, '');
};

let saveTimer = 0;
function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    const next = new URLSearchParams();
    const base = baseline();
    const differs = (a, b) => format(a) !== format(b);
    if (chosen.preset !== 'Lumno') next.set('preset', slug(chosen.preset));
    for (const key of Object.keys(DEFAULTS)) {
      // A file of the visitor's own can't go in a link.
      if (key === 'wallpaper' && state.wallpaper === 'custom') continue;
      if (key === 'photo' && state.wallpaper !== 'photo') continue;
      if (differs(state[key], base.state[key])) next.set(key, format(state[key]));
    }
    for (const kind of ['light', 'dark']) {
      for (const key of Object.keys(MATERIALS[kind])) {
        if (differs(materials[kind][key], base[kind][key])) next.set(`${kind[0]}.${key}`, format(materials[kind][key]));
      }
    }
    if (language.value !== 'en') next.set('lang', language.value);
    if (params.has('ui')) next.set('ui', params.get('ui'));
    const search = next.toString();
    history.replaceState(null, '', location.pathname + (search ? `?${search}` : '') + location.hash);
  }, 200);
}

// ---------- Applying it ----------

const hexRgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const unit = () => Number.parseFloat(getComputedStyle(stage).getPropertyValue('--u')) || 1;

const VARS = {
  tint: 'tint', opacity: 'k', thin: 'thin', dense: 'dense', blur: 'blur', saturation: 'sat',
  brightness: 'bri', contrast: 'con', rimLight: 'catch', bevel: 'bevel', shadow: 'shadow',
};

// The material each theme shows by default, and so the one the tint
// control on the stage sets.
const themeKind = () => (state.theme === 'dark' ? 'dark' : 'light');

const lenses = new Map();

function lensOptions() {
  return {
    enabled: state.lens,
    rim: state.rim * unit(),
    edge: state.edge,
    power: state.power,
    dispersion: state.dispersion,
  };
}

function applyLens() {
  const options = lensOptions();
  for (const lens of lenses.values()) lens.update(options);
  $('[data-action="lens"]').setAttribute('aria-pressed', String(state.lens));
}

function apply() {
  for (const kind of ['light', 'dark']) {
    const m = materials[kind];
    for (const [key, name] of Object.entries(VARS)) stage.style.setProperty(`--${kind[0]}-${name}`, m[key]);
  }
  stage.style.setProperty('--radius', state.radius);
  stage.style.setProperty('--corner-k', state.smoothing);
  stage.dataset.theme = state.theme;
  document.body.dataset.theme = state.theme;
  syncPlayback();
  labelToolbar();
  syncTintControl();
  applyLens();
  markPills();
  refraction?.wake();
  sampleSoon(true);
  // After a theme or wallpaper change has finished gliding.
  redrawGlass(700);
  save();
}

// Safari on iOS can leave a surface's glass layer undrawn once what is
// behind it changes (the wallpaper video starting, a theme or wallpaper
// switch, a glide between tints) until the surface moves. Giving the
// layers a compositing hint for a moment rebuilds them, with nothing to
// see. Chromium draws them anyway.
const needsRedraw = document.documentElement.dataset.engine === 'webkit';
let redrawTimer = 0;
// A redraw already on its way isn't put off by the next request, so a
// stream of changes can't keep it from happening.
function redrawGlass(delay = 120) {
  if (!needsRedraw || redrawTimer) return;
  redrawTimer = setTimeout(() => {
    redrawTimer = 0;
    for (const el of glasses) el.style.setProperty('--redraw', 'transform');
    requestAnimationFrame(() => requestAnimationFrame(() => {
      for (const el of glasses) el.style.removeProperty('--redraw');
    }));
  }, delay);
}
if (needsRedraw) {
  // When a glide between materials ends (a theme or preset change). The
  // readings off a moving wallpaper glide all the time and don't need it.
  for (const el of glasses) {
    el.addEventListener('transitionend', (event) => {
      if (event.propertyName === '--m-tint' || event.propertyName === '--m-sat') redrawGlass();
    });
  }
  // When the wallpaper starts moving or a new one shows.
  addEventListener('playing', () => redrawGlass(), true);
  addEventListener('loadeddata', () => redrawGlass(), true);
  addEventListener('load', () => redrawGlass(), true);
  addEventListener('pageshow', () => redrawGlass(400));
}

// Surfaces whose radius reaches half their height are capsules, which keep
// round ends (glass.css); the lens follows the corner it is given.
function markPills() {
  for (const el of glasses) {
    const radius = Number.parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0;
    const pill = radius >= el.offsetHeight / 2 - 0.5;
    if (pill === el.hasAttribute('data-pill')) continue;
    el.toggleAttribute('data-pill', pill);
    lenses.get(el)?.refresh();
  }
}

function syncTintControl() {
  const k = materials[themeKind()].opacity;
  tintRange.value = Math.round(k * 100);
  tintRange.style.setProperty('--p', `${(k / 1.5) * 100}%`);
  tintValue.textContent = `${Math.round(k * 100)}%`;
}

// A burst of changes from a slider shows at once, without the glide.
let tuneTimer = 0;
function tuning() {
  stage.dataset.tuning = '';
  clearTimeout(tuneTimer);
  tuneTimer = setTimeout(() => delete stage.dataset.tuning, 260);
}

// ---------- The wallpaper ----------

const posters = Object.fromEntries(Object.entries(videos).map(([kind, video]) => {
  const image = new Image();
  image.src = video.poster;
  return [kind, image];
}));

// The scenes drawn live share one canvas over the videos.
const sceneCanvas = Object.assign(document.createElement('canvas'), { className: 'is-scene', hidden: true });
wall.append(sceneCanvas);
// Made the first time a scene is chosen: a WebGL context can take the GPU
// a second to set up, which the page shouldn't wait for otherwise.
let scene = null;
let scenesSupported = typeof WebGL2RenderingContext === 'function';
if (!scenesSupported && SCENES[state.wallpaper]) state.wallpaper = 'tahoe';
const isScene = () => scenesSupported && Boolean(SCENES[state.wallpaper]);
function ensureScene() {
  if (scene || !isScene()) return;
  scene = createScene(sceneCanvas);
  if (scene) scene.setDark(state.theme === 'dark', true);
  else {
    scenesSupported = false;
    state.wallpaper = 'tahoe';
  }
}

// ---------- Loading and credit ----------

// A note at the top of the stage while a wallpaper loads, or when one
// fails. It waits a moment, so a quick load shows nothing.
const notice = $('.notice');
let noticeTimer = 0;
function showNotice(text, { busy = true, hideAfter = busy ? NOTICE_MAX_MS : 0, delay = 220 } = {}) {
  clearTimeout(noticeTimer);
  noticeTimer = setTimeout(() => {
    $('span', notice).textContent = text;
    notice.toggleAttribute('data-busy', busy);
    notice.hidden = false;
    if (hideAfter) noticeTimer = setTimeout(hideNotice, hideAfter);
  }, delay);
}
function hideNotice() {
  clearTimeout(noticeTimer);
  notice.hidden = true;
}

// Who made the wallpaper and under what license, in the stage's corner.
const credit = $('.credit');
function showCredit(info) {
  credit.hidden = !info;
  if (!info) return;
  credit.textContent = info.text;
  if (info.href) credit.href = info.href;
  else credit.removeAttribute('href');
}

// ---------- Playing ----------

// Phones can refuse to play even a muted video until someone touches the
// page (iOS in Low Power Mode, data savers). Then the poster stays, the
// loading note goes, and the first touch anywhere starts it.
let waitingForTouch = false;
function play(video) {
  video.play().catch((error) => {
    if (error?.name !== 'NotAllowedError' || waitingForTouch) return;
    waitingForTouch = true;
    showNotice(t('Tap anywhere to play the wallpaper'), { busy: false, hideAfter: 4000, delay: 0 });
    const resume = () => {
      waitingForTouch = false;
      hideNotice();
      syncPlayback();
    };
    addEventListener('pointerdown', resume, { once: true, capture: true });
    addEventListener('keydown', resume, { once: true, capture: true });
  });
}

// A loading note never stays up for good: a slow network shows the poster
// meanwhile, and the note goes after a while.
const NOTICE_MAX_MS = 8000;

// ---------- Videos, photos and files ----------

// The wallpaper shown in an <img> or <video> of its own: one of Apple's,
// a photo, or the visitor's file or link. Only the one showing exists, so
// an online video stops downloading once another wallpaper is chosen.
let media = null; // { key, el, video, readable, credit }
// The visitor's own file or link: { src, video, credit, remote }.
let own = null;
let previous = 'tahoe';
const isMedia = (key = state.wallpaper) => Boolean(APPLE[key]) || key === 'photo' || key === 'custom';
// The element showing now: for a light and dark pair, the theme's one.
const mediaEl = () => (media?.pair ? media.pair[state.theme] : media?.el);

const VIDEO_EXT = /\.(mp4|m4v|webm|mov|ogv|ogg)(\?|#|$)/i;

function dropMedia() {
  if (!media) return;
  for (const el of media.pair ? Object.values(media.pair) : [media.el]) {
    el.removeAttribute('src');
    if (media.video) el.load();
  }
  media.el.remove();
  media = null;
}

// One of Apple's wallpapers: its light and dark images (or videos) laid
// one over the other, the dark one fading in with the theme.
function showPair(key) {
  dropMedia();
  const info = APPLE[key];
  const el = document.createElement('div');
  el.className = 'is-media is-pair';
  const pair = {};
  for (const kind of ['light', 'dark']) {
    const child = document.createElement(info.video ? 'video' : 'img');
    child.className = `is-${kind}`;
    child.alt = '';
    if (info.video) {
      Object.assign(child, { muted: true, loop: true, playsInline: true, preload: kind === state.theme ? 'auto' : 'metadata' });
      child.poster = `./media/${key}-${kind}.jpg`;
    }
    child.src = `./media/${key}-${kind}.${info.video ? 'mp4' : 'jpg'}`;
    pair[kind] = child;
    el.append(child);
  }
  media = { key, el, pair, video: info.video, readable: true, apple: info.name };
  const mine = media;
  const shown = pair[state.theme];
  if (!(shown.complete && !info.video)) showNotice(t(info.video ? 'Loading video…' : 'Loading image…'));
  const ready = () => {
    if (media !== mine) return;
    hideNotice();
    refreshRefraction();
    sampleSoon(true);
  };
  shown.addEventListener(info.video ? 'loadeddata' : 'load', ready, { once: true });
  if (info.video) shown.addEventListener('playing', ready);
  for (const child of Object.values(pair)) {
    child.addEventListener('error', () => {
      if (media !== mine) return;
      showNotice(t("Couldn't load this wallpaper"), { busy: false, hideAfter: 3200, delay: 0 });
      dropMedia();
      state.wallpaper = 'tahoe';
      apply();
      refreshPanel();
    }, { once: true });
  }
  wall.append(el);
}

// Puts an image or video on the wall, with the loading note while it
// loads. A remote file is asked for with CORS so the glass can read it;
// if the host doesn't allow that, it is shown anyway, unread.
function showMedia(key, { src, poster, video, credit: info, remote, cors = remote, retried = false }) {
  dropMedia();
  const el = document.createElement(video ? 'video' : 'img');
  el.className = 'is-media';
  el.alt = '';
  if (cors) el.crossOrigin = 'anonymous';
  if (video) Object.assign(el, { muted: true, loop: true, playsInline: true, preload: 'auto' });
  if (poster) el.poster = poster;
  media = { key, el, video, readable: !remote || cors, credit: info };
  const mine = media;
  showNotice(t(video ? 'Loading video…' : 'Loading image…'));
  const ready = () => {
    if (media !== mine) return;
    hideNotice();
    refreshRefraction();
    sampleSoon(true);
  };
  el.addEventListener(video ? 'loadeddata' : 'load', ready, { once: true });
  if (video) {
    el.addEventListener('waiting', () => media === mine && showNotice(t('Loading video…'), { delay: 600 }));
    el.addEventListener('playing', ready);
  }
  el.addEventListener('error', () => {
    if (media !== mine) return;
    if (cors) {
      // A host can turn a request away for a moment (busy hosts answer 429
      // when busy), so ask once more; then show it without CORS, which the
      // glass can't read but still shows.
      const again = { src, poster, video, credit: info, remote, cors: !retried, retried: true };
      setTimeout(() => media === mine && showMedia(key, again), retried ? 0 : 1200);
      return;
    }
    const unplayable = video && el.error?.code === 4;
    showNotice(t(unplayable ? "This browser can't play this video" : "Couldn't load this wallpaper"), { busy: false, hideAfter: 3200, delay: 0 });
    dropMedia();
    state.wallpaper = isMedia(previous) ? 'tahoe' : previous;
    apply();
    refreshPanel();
  });
  el.src = src;
  wall.append(el);
}

// Picsum's photos (from Unsplash), with their authors: one page of the
// list is fetched once and a photo drawn from it.
let photoList = null;
async function pickPhoto() {
  if (!photoList) {
    const page = 1 + Math.floor(Math.random() * 10);
    photoList = fetch(`https://picsum.photos/v2/list?page=${page}&limit=100`).then((r) => r.json()).catch(() => []);
  }
  const list = await photoList;
  return list.length ? list[Math.floor(Math.random() * list.length)] : { id: String(1 + Math.floor(Math.random() * 1000)) };
}
async function photoInfo(id) {
  try {
    return await fetch(`https://picsum.photos/id/${id}/info`).then((r) => r.json());
  } catch {
    return { id };
  }
}

async function showPhoto(fresh) {
  const token = (showPhoto.token = (showPhoto.token || 0) + 1);
  showNotice(t('Loading image…'), { delay: 0 });
  const photo = fresh || !state.photo ? await pickPhoto() : await photoInfo(state.photo);
  if (token !== showPhoto.token || state.wallpaper !== 'photo') return;
  state.photo = Number(photo.id) || 0;
  const box = stage.getBoundingClientRect();
  const scale = Math.min(2, devicePixelRatio || 1);
  const w = Math.min(2560, Math.round(box.width * scale));
  const h = Math.min(2560, Math.round(box.height * scale));
  showMedia('photo', {
    src: `https://picsum.photos/id/${photo.id}/${w}/${h}.webp`,
    video: false,
    remote: true,
    credit: photo.author ? { text: `${t('Photo')}: ${photo.author} · Unsplash`, href: photo.url } : null,
  });
  save();
}

function useOwn(next) {
  if (own?.src.startsWith('blob:') && own.src !== next.src) URL.revokeObjectURL(own.src);
  own = next;
  if (state.wallpaper === 'custom') dropMedia();
  else previous = state.wallpaper;
  state.wallpaper = 'custom';
  apply();
  refreshPanel();
}

function useFile(file) {
  if (!file || !/^(image|video)\//.test(file.type)) {
    showNotice(t('Use an image or a video'), { busy: false, hideAfter: 2400, delay: 0 });
    return;
  }
  useOwn({ src: URL.createObjectURL(file), video: file.type.startsWith('video/'), credit: null, remote: false });
}

function useLink(raw) {
  let url;
  try {
    url = new URL(raw.trim());
  } catch {
    showNotice(t('That is not a link'), { busy: false, hideAfter: 2400, delay: 0 });
    return;
  }
  if (!/^https?:$/.test(url.protocol)) return;
  useOwn({ src: url.href, video: VIDEO_EXT.test(url.pathname), credit: { text: url.hostname, href: url.href }, remote: true });
}

// The media the chosen wallpaper needs, made or dropped to match.
function syncMedia() {
  const key = state.wallpaper;
  if (!isMedia(key)) {
    dropMedia();
    return;
  }
  if (media?.key === key && (key !== 'custom' || media.el.src === own?.src || media.el.currentSrc === own?.src)) return;
  if (APPLE[key]) {
    showPair(key);
  } else if (key === 'photo') {
    if (media?.key !== 'photo') {
      dropMedia();
      showPhoto(false);
    }
  } else if (own) {
    showMedia('custom', own);
  }
}

// The player's clock: the playing video, or the scene's time over a minute.
const SCENE_LOOP = 60;
function clockSource() {
  if (isMedia()) return media?.video ? mediaEl() : null;
  if (isScene()) return scene ? { currentTime: scene.time % SCENE_LOOP, duration: SCENE_LOOP } : null;
  return videos[state.theme];
}

// Plays what shows and stops the rest. The Tahoe videos only load once
// Tahoe is chosen; the theme's other video keeps playing while it fades
// out (switchTheme stops it).
function syncPlayback() {
  syncMedia();
  const tahoe = state.wallpaper === 'tahoe';
  const rate = Math.max(0.0625, state.speed);
  for (const [kind, video] of Object.entries(videos)) {
    video.playbackRate = rate;
    if (!tahoe || state.paused || state.speed === 0) video.pause();
    else if (kind === state.theme) {
      video.preload = 'auto';
      if (video.readyState < 3) showNotice(t('Loading video…'), { delay: 400 });
      play(video);
    }
  }
  if (media?.video) {
    const all = media.pair ? Object.values(media.pair) : [media.el];
    for (const el of all) el.playbackRate = rate;
    // A pair's other video keeps playing while it fades out (switchTheme
    // stops it).
    if (!state.paused && state.speed > 0) play(mediaEl());
    else all.forEach((el) => el.pause());
  }
  ensureScene();
  if (scene) {
    scene.setVisible(isScene());
    if (isScene()) scene.setMode(state.wallpaper);
    scene.setSpeed(state.speed);
    scene.setPlaying(!state.paused);
    scene.setDark(state.theme === 'dark');
  }
  if (!isMedia() && state.wallpaper !== 'tahoe') hideNotice();
  showCredit(
    state.wallpaper === 'tahoe' ? { text: t('macOS Tahoe wallpaper © Apple Inc.') }
      : isMedia() ? (media?.apple ? appleCredit(media.apple) : media?.credit ?? null)
        : null,
  );
  stage.toggleAttribute('data-paused', state.paused);
}

for (const video of Object.values(videos)) {
  video.addEventListener('playing', () => state.wallpaper === 'tahoe' && hideNotice());
  video.addEventListener('waiting', () => state.wallpaper === 'tahoe' && !state.paused && showNotice(t('Loading video…'), { delay: 600 }));
}

// The incoming theme's video picks up where the other left off, and the
// other stops once it has faded out.
let fadeTimer = 0;
function switchTheme(next) {
  if (next === state.theme) return;
  // Tahoe's videos, or a pair of Apple's that moves.
  const pair = media?.pair && media.video ? media.pair : videos;
  const from = pair[state.theme];
  const to = pair[next];
  if (from.readyState >= 1 && to.readyState >= 1 && to.duration) {
    to.currentTime = from.currentTime % to.duration;
  }
  state.theme = next;
  clearTimeout(fadeTimer);
  fadeTimer = setTimeout(() => {
    if (state.theme !== next) return;
    from.pause();
  }, 700);
  tabs?.pages[next === 'dark' ? 1 : 0] && (tabs.pages[next === 'dark' ? 1 : 0].selected = true);
  apply();
  refreshPanel();
}

const upload = Object.assign(document.createElement('input'), { type: 'file', accept: 'image/*,video/*', hidden: true });
document.body.append(upload);
upload.addEventListener('change', () => {
  const file = upload.files?.[0];
  upload.value = '';
  if (file) useFile(file);
});

// A file dropped anywhere on the page, or pasted, becomes the wallpaper;
// so does a pasted link.
let dragDepth = 0;
const hasFiles = (event) => [...(event.dataTransfer?.types || [])].includes('Files');
addEventListener('dragenter', (event) => {
  if (!hasFiles(event)) return;
  dragDepth += 1;
  showNotice(t('Drop an image or video to use it'), { busy: false, delay: 0 });
});
addEventListener('dragover', (event) => hasFiles(event) && event.preventDefault());
addEventListener('dragleave', (event) => {
  if (hasFiles(event) && --dragDepth <= 0) {
    dragDepth = 0;
    hideNotice();
  }
});
addEventListener('drop', (event) => {
  if (!hasFiles(event)) return;
  event.preventDefault();
  dragDepth = 0;
  hideNotice();
  useFile(event.dataTransfer.files[0]);
});
addEventListener('paste', (event) => {
  if (event.target.closest?.('input, textarea, [contenteditable]')) return;
  const file = event.clipboardData?.files?.[0];
  const text = event.clipboardData?.getData('text/plain')?.trim();
  if (file) useFile(file);
  else if (/^https?:\/\/\S+$/.test(text || '')) useLink(text);
});

// Choosing "Your own" before giving a file asks for one.
function showWallpaper() {
  refreshRefraction();
  if (state.wallpaper === 'custom' && !own) {
    state.wallpaper = previous;
    upload.click();
  } else if (state.wallpaper !== 'custom') {
    previous = state.wallpaper;
  }
  apply();
  refreshPanel();
}

// ---------- Refraction drawn in WebGL ----------

// Where backdrop-filter can't take the lens's SVG filter, the glass's
// backdrop is drawn on a canvas between the wallpaper and the surfaces
// (refract.js), and the surfaces drop their own backdrop filter. Made after
// the first frame; until then, and wherever it can't run, the CSS glass
// stays.
const refractionCanvas = Object.assign(document.createElement('canvas'), { className: 'refraction', hidden: true });
stage.insertBefore(refractionCanvas, $('.surfaces'));
let refraction = null;

function refractionSource() {
  let el;
  if (isMedia()) el = mediaEl();
  else if (isScene()) el = sceneCanvas;
  else {
    const video = videos[state.theme];
    el = video.readyState >= 2 ? video : posters[state.theme];
  }
  return el ? { el, moving: moving() && (el.tagName === 'VIDEO' || el === sceneCanvas), external: el === sceneCanvas } : null;
}

function refractionSurfaces() {
  const stageBox = stage.getBoundingClientRect();
  const u = unit();
  return glasses.map((el) => {
    const box = el.getBoundingClientRect();
    const m = materials[el.dataset.kind === 'dark' ? 'dark' : 'light'];
    const veil = Math.min(1, m.opacity);
    // The box is as drawn, a glide's transform included; the radius is
    // scaled to match.
    const drawn = el.offsetWidth ? box.width / el.offsetWidth : 1;
    const radius = (Number.parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0) * drawn;
    return {
      x: box.left - stageBox.left,
      y: box.top - stageBox.top,
      w: box.width,
      h: box.height,
      radius: Math.min(radius, box.width / 2, box.height / 2),
      rim: Math.max(4, Math.min(state.rim * u, Math.min(box.width, box.height) / 3.5)),
      edge: state.lens ? state.edge : 0,
      power: state.power,
      dispersion: state.lens ? state.dispersion : 0,
      blur: m.blur * u,
      saturate: m.saturation,
      contrast: 1 + (m.contrast - 1) * veil,
      brightness: 1 + (m.brightness - 1) * veil,
      keep: Number.parseFloat(el.style.getPropertyValue('--keep')) || 1,
    };
  });
}

function startRefraction() {
  if (lensSupported || refraction || typeof WebGL2RenderingContext !== 'function') return;
  try {
    refraction = createRefraction(refractionCanvas, { source: refractionSource, surfaces: refractionSurfaces });
  } catch {
    refraction = null;
  }
  if (!refraction) return;
  refraction.setEnabled(true);
  stage.dataset.refract = 'webgl';
  // A live wallpaper's every frame.
  sceneCanvas.addEventListener('scenedraw', () => isScene() && refraction.frame());
  // A wallpaper it can't read (another site's, without CORS): the CSS glass.
  refractionCanvas.addEventListener('refractionfailed', () => {
    refraction.setEnabled(false);
    delete stage.dataset.refract;
  });
}

// A new wallpaper is uploaded afresh, and one that failed gets another try.
function refreshRefraction() {
  if (!refraction) return;
  if (refraction.failed || !stage.dataset.refract) {
    refraction.setEnabled(true);
    stage.dataset.refract = 'webgl';
  } else {
    refraction.reset();
  }
}

// ---------- Reading the wallpaper ----------

const read = sampler();
const readout = { luminance: '–', ink: '–', density: '–', floor: '–', tint: '–' };

function wallpaperSource() {
  if (isMedia()) return media?.readable ? mediaEl() : null;
  if (isScene()) return sceneCanvas;
  const video = videos[state.theme];
  return video.readyState >= 2 ? video : posters[state.theme];
}

// A surface's reading only changes its glass when it has moved far enough:
// each change starts a half-second glide, and a moving wallpaper nudges
// the reading on every sample. A settings change (force) always applies.
const setVar = (el, name, value, force) => {
  const old = Number.parseFloat(el.style.getPropertyValue(name));
  if (Number.isFinite(old) && Math.abs(value - old) < (force ? 0.0005 : 0.04)) return;
  el.style.setProperty(name, value.toFixed(3));
};

function decide(el, stageBox, force) {
  const box = el.getBoundingClientRect();
  const patch = read.ready ? read.sample({ x: box.left - stageBox.left, y: box.top - stageBox.top, w: box.width, h: box.height }) : null;
  let ink;
  if (state.ink === 'light' || state.ink === 'dark') ink = state.ink;
  else if (state.ink === 'theme' || state.theme === 'dark') ink = state.theme === 'dark' ? 'light' : 'dark';
  else ink = patch ? pickInk(patch.luminance, el.dataset.ink, state.threshold) : 'dark';
  const kind = ink === 'light' ? 'dark' : 'light';
  el.dataset.ink = ink;
  el.dataset.kind = kind;
  const m = materials[kind];
  let density = state.density;
  let keep = 1;
  let floor = 0;
  if (patch && state.autoDensity) ({ density, saturate: keep } = adapt(patch, ink));
  // A wallpaper the glass can't read (another site's, without CORS) takes
  // a dense tint, so its text reads whatever is behind it.
  else if (!patch && state.autoDensity && isMedia() && media && !media.readable) density = 0.85;
  if (patch && state.legible) floor = tintFloor(patch.luminance, patch.texture, ink, luma(hexRgb(m.tint)));
  setVar(el, '--density', density, force);
  setVar(el, '--keep', keep, force);
  setVar(el, '--floor', floor, force);
  if (el === player) {
    const alpha = Math.min(0.95, Math.max(floor, (m.thin + (m.dense - m.thin) * density) * m.opacity));
    Object.assign(readout, {
      luminance: patch ? patch.luminance.toFixed(2) : '–',
      ink: t(ink === 'light' ? 'Light' : 'Dark'),
      density: density.toFixed(2),
      floor: `${Math.round(floor * 100)}%`,
      tint: `${Math.round(alpha * 100)}%`,
    });
    lastDensity = density;
  }
}

let lastDensity = 0.35;
let sampleFrame = 0;
let sampleForce = false;

function sampleNow() {
  sampleFrame = 0;
  const force = sampleForce;
  sampleForce = false;
  const stageBox = stage.getBoundingClientRect();
  const source = wallpaperSource();
  if (!source || !read.capture(source, stageBox.width, stageBox.height)) read.clear();
  for (const el of glasses) decide(el, stageBox, force);
}

function sampleSoon(force = false) {
  sampleForce ||= force;
  if (!sampleFrame) sampleFrame = requestAnimationFrame(sampleNow);
}

// A moving wallpaper is read a few times a second while it plays (each
// read copies a frame back from the GPU); a still one only when something
// changes.
const moving = () => !state.paused && state.speed > 0 && (state.wallpaper === 'tahoe' || isScene() || Boolean(media?.video));
setInterval(() => {
  if (moving() && !document.hidden) sampleSoon();
}, 400);
Object.values(videos).forEach((v) => v.addEventListener('loadeddata', () => sampleSoon(true)));
Object.values(posters).forEach((p) => p.addEventListener('load', () => sampleSoon(true)));

// ---------- The player ----------

const timeNow = $('[data-time="now"]');
const timeLeft = $('[data-time="left"]');
const clock = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
let shown = '';

// The bar's own width moves, so a new position restyles only the bar, not
// the whole card. (A translate would give it a compositing layer of its
// own inside the blended, blurred card, which iOS can fail to draw.)
const progressFill = $('.p-fill', player);
let shownProgress = -1;

function tick() {
  const video = clockSource();
  if (video?.duration) {
    const now = video.currentTime;
    const total = video.duration;
    const progress = Math.round((now / total) * 1000) / 1000;
    if (progress !== shownProgress) {
      shownProgress = progress;
      progressFill.style.width = `${(progress * 100).toFixed(1)}%`;
    }
    const text = `${clock(now)} -${clock(Math.max(0, total - now))}`;
    if (text !== shown) {
      shown = text;
      timeNow.textContent = clock(now);
      timeLeft.textContent = `-${clock(Math.max(0, total - now))}`;
    }
  }
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);

function seek(by) {
  if (isScene() && scene) scene.time += by;
  const all = [...Object.values(videos), ...(media?.video ? (media.pair ? Object.values(media.pair) : [media.el]) : [])].filter((v) => v?.duration);
  for (const v of all) v.currentTime = (v.currentTime + by + v.duration) % v.duration;
  sampleSoon();
}

// ---------- Dragging the glass ----------

const interactive = 'input, button, kbd, .tint-range';
for (const el of surfaces) {
  let start = null;
  el.addEventListener('pointerdown', (event) => {
    if (event.button !== 0 || event.target.closest(interactive)) return;
    const box = el.getBoundingClientRect();
    const dx = Number.parseFloat(el.style.getPropertyValue('--dx')) || 0;
    const dy = Number.parseFloat(el.style.getPropertyValue('--dy')) || 0;
    start = { x: event.clientX, y: event.clientY, dx, dy, box };
    el.setPointerCapture(event.pointerId);
    el.dataset.dragging = '';
    event.preventDefault();
  });
  el.addEventListener('pointermove', (event) => {
    if (!start) return;
    const stageBox = stage.getBoundingClientRect();
    const { box } = start;
    // Keep at least half the surface on the stage.
    const moveX = clampTo(event.clientX - start.x, [stageBox.left - box.left - box.width / 2, stageBox.right - box.right + box.width / 2]);
    const moveY = clampTo(event.clientY - start.y, [stageBox.top - box.top - box.height / 2, stageBox.bottom - box.bottom + box.height / 2]);
    el.style.setProperty('--dx', `${start.dx + moveX}px`);
    refraction?.wake();
    el.style.setProperty('--dy', `${start.dy + moveY}px`);
    sampleSoon();
  });
  const end = () => {
    start = null;
    delete el.dataset.dragging;
  };
  el.addEventListener('pointerup', end);
  el.addEventListener('pointercancel', end);
  // A double click puts it back.
  el.addEventListener('dblclick', (event) => {
    if (event.target.closest(interactive)) return;
    el.style.removeProperty('--dx');
    el.style.removeProperty('--dy');
    sampleSoon();
  });
}

// ---------- The controls on the stage ----------

tintRange.addEventListener('input', () => {
  tuning();
  materials[themeKind()].opacity = Number(tintRange.value) / 100;
  apply();
  refreshPanel();
});

// The panel opening or closing changes the room the surfaces have and so
// their size. The layout switches at once, and each surface glides from
// where it was by a transform: that leaves its box alone, so its lens is
// fitted once instead of on every frame of the move.
let glides = [];
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');

const togglePanel = () => {
  const before = glasses.map((el) => el.getBoundingClientRect());
  glides.forEach((glide) => glide.cancel());
  glides = [];
  // Lets the panel slide, from the first toggle on (see style.css).
  document.body.dataset.uiMotion = '';
  document.body.dataset.ui = document.body.dataset.ui === 'off' ? 'on' : 'off';
  refraction?.wake();
  if (reduceMotion.matches) return;
  const root = getComputedStyle(document.documentElement);
  const timing = {
    duration: Number.parseFloat(root.getPropertyValue('--ui-time')) || 420,
    easing: root.getPropertyValue('--ui-ease').trim() || 'ease',
  };
  glasses.forEach((el, index) => {
    const from = before[index];
    const to = el.getBoundingClientRect();
    if (!from.width || !to.width) return;
    const dx = from.left - to.left;
    const dy = from.top - to.top;
    const scale = from.width / to.width;
    if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5 && Math.abs(scale - 1) < 0.001) return;
    glides.push(el.animate([
      { transformOrigin: '0 0', transform: `translate(${dx}px, ${dy}px) scale(${scale})` },
      { transformOrigin: '0 0', transform: 'none' },
    ], timing));
  });
};

const actions = {
  theme: () => switchTheme(state.theme === 'dark' ? 'light' : 'dark'),
  lens: () => {
    state.lens = !state.lens;
    apply();
    refreshPanel();
  },
  code: () => openCode(),
  panel: togglePanel,
  play: () => {
    state.paused = !state.paused;
    apply();
    refreshPanel();
  },
  back: () => seek(-5),
  forward: () => seek(5),
  // The next wallpaper in the panel's list.
  wallpaper: () => {
    const keys = Object.values(WALLPAPERS).filter((key) => key !== 'custom' && (scenesSupported || !SCENES[key]));
    state.wallpaper = keys[(keys.indexOf(state.wallpaper) + 1) % keys.length];
    previous = state.wallpaper;
    // Each visit to the random photo draws a new one.
    if (state.wallpaper === 'photo') state.photo = 0;
    apply();
    refreshPanel();
  },
};

// The toolbar's tips: what a button does, and its key.
function labelToolbar() {
  for (const el of $$('[data-tip-key]', toolbar)) {
    let key = el.dataset.tipKey;
    if (key === 'Pause wallpaper' && state.paused) key = 'Play wallpaper';
    if (key === 'Refraction') key = state.lens ? 'Refraction: on' : 'Refraction: off';
    const text = el.dataset.key ? `${t(key)}  ${el.dataset.key === 'Space' ? t('Space') : el.dataset.key}` : t(key);
    el.dataset.tip = text;
    el.setAttribute('aria-label', t(key));
  }
}

for (const button of $$('.stage [data-action]')) {
  button.addEventListener('click', () => actions[button.dataset.action]?.());
}

addEventListener('keydown', (event) => {
  if (event.target.closest?.('input, textarea, select, dialog') || event.metaKey || event.ctrlKey || event.altKey) return;
  const key = event.key.toLowerCase();
  if (key === 'h') togglePanel();
  else if (key === 't') actions.theme();
  else if (key === 'w') actions.wallpaper();
  else if (key === ' ') {
    event.preventDefault();
    actions.play();
  } else return;
});

// The panel opening or closing resizes the stage, which changes --u.
new ResizeObserver(() => {
  markPills();
  applyLens();
  sampleSoon();
}).observe(stage);

// ---------- The CSS ----------

const n = (value, digits = 3) => String(+value.toFixed(digits));
const rgba = ([r, g, b], a) => `rgb(${r} ${g} ${b} / ${n(Math.min(1, Math.max(0, a)))})`;
const WHITE = [255, 255, 255];
const BLACK = [0, 0, 0];

// The rim light, outline and shadow, and the bevel, as in glass.css.
const EDGES = {
  light: {
    rim: [['inset 1.5px 1.5px 1px -1px', WHITE, 1], ['inset -1.5px -1.5px 1px -1px', WHITE, 0.6], ['inset 0 0 0 0.5px', WHITE, 0.3]],
    shadow: [['0 0 0 0.5px', BLACK, 0.12], ['0 4px 16px', BLACK, 0.1]],
    bevel: [['inset 0 6px 8px -6px', WHITE, 0.5], ['inset 4px 0 8px -6px', WHITE, 0.22], ['inset -4px 0 8px -6px', WHITE, 0.12], ['inset 0 -6px 8px -6px', BLACK, 0.06]],
  },
  dark: {
    rim: [['inset 1px 1px 0.5px -0.5px', WHITE, 0.46], ['inset -1px -1px 0.5px -0.5px', WHITE, 0.18], ['inset 0 0 0 0.5px', WHITE, 0.06]],
    shadow: [['0 0 0 0.5px', BLACK, 0.28], ['0 4px 14px', BLACK, 0.22]],
    bevel: [['inset 0 6px 8px -6px', WHITE, 0.18], ['inset 4px 0 8px -6px', WHITE, 0.07], ['inset -4px 0 8px -6px', WHITE, 0.04], ['inset 0 -6px 8px -6px', BLACK, 0.08]],
  },
};

const INKS = {
  light: { ink: 'rgb(0 0 0 / 0.86)', secondary: 'rgb(60 60 67 / 0.7)', blend: 'multiply' },
  dark: { ink: 'rgb(255 255 255 / 0.94)', secondary: 'rgb(235 235 245 / 0.64)', blend: 'plus-lighter' },
};

function materialCss(kind, selector) {
  const m = materials[kind];
  const veil = Math.min(1, m.opacity);
  const density = state.autoDensity ? lastDensity : state.density;
  const alpha = Math.min(0.95, (m.thin + (m.dense - m.thin) * density) * m.opacity);
  const filter = [
    `blur(${n(m.blur, 2)}px)`,
    `saturate(${Math.round(m.saturation * 100)}%)`,
    m.contrast !== 1 && `contrast(${n(1 + (m.contrast - 1) * veil)})`,
    m.brightness !== 1 && `brightness(${n(1 + (m.brightness - 1) * veil)})`,
  ].filter(Boolean).join(' ');
  const edge = EDGES[kind];
  const shadows = [
    ...edge.rim.map(([geometry, color, a]) => `${geometry} ${rgba(color, a * m.rimLight)}`),
    ...edge.shadow.map(([geometry, color, a]) => `${geometry} ${rgba(color, a * m.shadow)}`),
    ...edge.bevel.map(([geometry, color, a]) => `${geometry} ${rgba(color, a * veil * m.bevel)}`),
  ];
  const ink = INKS[kind];
  const lens = state.lens ? ' var(--glass-lens,)' : '';
  return [
    `${selector} {`,
    `  background: ${rgba(hexRgb(m.tint), alpha)};`,
    `  -webkit-backdrop-filter: ${filter};`,
    `  backdrop-filter: ${filter}${lens};`,
    `  box-shadow:\n${shadows.map((s) => `    ${s}`).join(',\n')};`,
    `  color: ${ink.ink};`,
    '}',
    `${selector} > * { mix-blend-mode: ${ink.blend}; }`,
    `${selector} .secondary { color: ${ink.secondary}; }`,
  ].join('\n');
}

function exportCss() {
  const shape = [
    '.glass {',
    `  border-radius: ${n(state.radius, 1)}px;`,
    ...(Math.abs(state.smoothing - 1) > 1e-3 ? [`  corner-shape: superellipse(${n(state.smoothing, 2)});`] : []),
    '}',
    '/* Capsules keep round ends. */',
    '.glass.is-pill { border-radius: 999px; corner-shape: round; }',
  ].join('\n');
  const css = [
    "/* Lumno's liquid glass, from Glasswork (https://www.kubai.design/glasswork/).\n   Light glass with dark ink by default; .glass.is-dark for dark glass with light ink.\n   If Safari leaves a surface with busy content undrawn, move background and\n   backdrop-filter to a ::before under the content, as glass.css in the repo does. */",
    shape,
    materialCss('light', '.glass'),
    materialCss('dark', '.glass.is-dark'),
  ].join('\n\n');
  if (!state.lens) return css;
  const options = `{ rim: ${n(state.rim, 1)}, edge: ${n(state.edge, 2)}, power: ${n(state.power, 2)}, dispersion: ${n(state.dispersion, 3)} }`;
  return `${css}\n\n<!-- The rim lens (Chromium); everywhere else the CSS glass stays as it is. -->
<script type="module">
  import { liquidGlass } from 'https://cdn.jsdelivr.net/gh/kubai087/glasswork@v1.1.0/lens.js';
  for (const el of document.querySelectorAll('.glass')) liquidGlass(el, ${options});
</script>`;
}

function openCode() {
  $('code', dialog).textContent = exportCss();
  translate(dialog);
  dialog.showModal();
}

dialog.addEventListener('click', async (event) => {
  const action = event.target.closest('[data-action]')?.dataset.action;
  if (event.target === dialog || action === 'close') dialog.close();
  if (action === 'copy') {
    const button = event.target.closest('button');
    try {
      await navigator.clipboard.writeText($('code', dialog).textContent);
      button.textContent = t('Copied');
    } catch {
      const range = document.createRange();
      range.selectNodeContents($('code', dialog));
      getSelection().removeAllRanges();
      getSelection().addRange(range);
    }
    setTimeout(() => { button.textContent = t('Copy'); }, 1400);
  }
});

// ---------- The panel ----------

let pane = null;
let tabs = null;
// The swatches show the tint when it is one of theirs; the density slider
// is off while the wallpaper sets it.
const swatch = { light: materials.light.tint, dark: materials.dark.tint };
const swatchBindings = {};
let densityBinding = null;

// Brings every control on the panel in line with the settings, after a
// change made anywhere but the control itself.
function refreshPanel() {
  if (!pane) return;
  for (const kind of ['light', 'dark']) swatch[kind] = materials[kind].tint;
  if (densityBinding) densityBinding.disabled = state.autoDensity;
  pane.refresh();
}

if (params.get('ui') === '0' || (!params.has('ui') && PHONE.matches)) document.body.dataset.ui = 'off';

// The lenses come after the first frame, one surface at a time when the
// page is idle, so opening the page shows the glass at once and the rims
// bend a moment later.
const idle = (fn) => (window.requestIdleCallback ? requestIdleCallback(fn, { timeout: 500 }) : setTimeout(fn, 50));
requestAnimationFrame(() => setTimeout(() => {
  idle(startRefraction);
  const next = (i) => {
    if (i >= glasses.length) return;
    idle(() => {
      lenses.set(glasses[i], liquidGlass(glasses[i], lensOptions()));
      next(i + 1);
    });
  };
  next(0);
}, 0));
apply();
translate(document.body);
// The page is running (index.html reloads once if it never gets here).
document.documentElement.dataset.ready = '1';
try { sessionStorage.removeItem('glasswork:reloaded'); } catch {}

// Reset: every setting back to Lumno's, but the scene (theme, wallpaper,
// motion) stays, and the surfaces go back in place.
function resetAll() {
  Object.assign(state, DEFAULTS, pick(state, ['theme', 'wallpaper', 'speed', 'paused']));
  for (const kind of ['light', 'dark']) Object.assign(materials[kind], MATERIALS[kind]);
  applyPreset('Lumno');
  for (const el of surfaces) {
    el.style.removeProperty('--dx');
    el.style.removeProperty('--dy');
  }
}

async function buildPane() {
  pane = await createPane({ container: $('.sidebar') });

  const presets = pane.addFolder({ title: 'Presets' });
  presets.addBinding(chosen, 'preset', {
    label: 'Preset',
    options: Object.fromEntries(Object.keys(PRESETS).map((k) => [k, k])),
  }).on('change', ({ value }) => {
    applyPreset(value);
    apply();
    refreshPanel();
  });

  const sceneFolder = pane.addFolder({ title: 'Scene' });
  sceneFolder.addBinding(state, 'theme', {
    label: 'Theme',
    view: 'radiogrid',
    groupName: 'theme',
    size: [2, 1],
    cells: (x) => [{ title: 'Light', value: 'light' }, { title: 'Dark', value: 'dark' }][x],
  }).on('change', ({ value }) => {
    // switchTheme compares against the current theme, which the binding
    // has already set.
    state.theme = value === 'dark' ? 'light' : 'dark';
    switchTheme(value);
  });
  sceneFolder.addBinding(state, 'ink', {
    label: 'Ink',
    options: { 'Follow theme': 'theme', 'Auto (wallpaper)': 'auto', Dark: 'dark', Light: 'light' },
  });
  sceneFolder.addBinding(state, 'wallpaper', {
    label: 'Wallpaper',
    options: Object.fromEntries(Object.entries(WALLPAPERS).filter(([, key]) => scenesSupported || !SCENES[key])),
  }).on('change', showWallpaper);
  sceneFolder.addButton({ title: 'Another photo' }).on('click', () => {
    state.wallpaper = 'photo';
    previous = 'photo';
    if (media?.key === 'photo') showPhoto(true);
    else state.photo = 0;
    apply();
    refreshPanel();
  });
  sceneFolder.addButton({ title: 'Upload image or video…' }).on('click', () => upload.click());
  const link = { url: '' };
  sceneFolder.addBinding(link, 'url', { label: 'Link' }).on('change', ({ value }) => {
    if (value.trim()) useLink(value);
  });
  sceneFolder.addBinding(state, 'speed', { label: 'Speed', min: 0, max: 3, step: 0.05 });
  sceneFolder.addBinding(state, 'paused', { label: 'Paused' });

  const material = pane.addFolder({ title: 'Material' });
  tabs = material.addTab({ pages: [{ title: 'Light glass' }, { title: 'Dark glass' }] });
  ['light', 'dark'].forEach((kind, index) => {
    const page = tabs.pages[index];
    const m = materials[kind];
    page.addBinding(m, 'tint', { label: 'Tint' }).on('change', ({ value }) => {
      swatch[kind] = value;
      swatchBindings[kind].refresh();
    });
    const names = Object.entries(SWATCHES[kind]);
    swatchBindings[kind] = page.addBinding(swatch, kind, {
      label: 'Swatch',
      view: 'radiogrid',
      groupName: `swatch-${kind}`,
      size: [4, 2],
      cells: (x, y) => ({ title: names[y * 4 + x][0], value: names[y * 4 + x][1] }),
    }).on('change', ({ value }) => {
      if (m.tint === value) return;
      m.tint = value;
      apply();
      refreshPanel();
    });
    page.addBinding(m, 'opacity', { label: 'Opacity', min: 0, max: 1.5, step: 0.01 });
    page.addBinding(m, 'thin', { label: 'Thin', min: 0, max: 0.8, step: 0.01 });
    page.addBinding(m, 'dense', { label: 'Dense', min: 0, max: 0.95, step: 0.01 });
    page.addBlade({ view: 'separator' });
    page.addBinding(m, 'blur', { label: 'Blur', min: 0, max: 40, step: 0.5 });
    page.addBinding(m, 'saturation', { label: 'Saturation', min: 0, max: 3, step: 0.01 });
    page.addBinding(m, 'brightness', { label: 'Brightness', min: 0.4, max: 1.6, step: 0.01 });
    page.addBinding(m, 'contrast', { label: 'Contrast', min: 0.4, max: 1.6, step: 0.01 });
    page.addBlade({ view: 'separator' });
    page.addBinding(m, 'rimLight', { label: 'Rim light', min: 0, max: 2, step: 0.01 });
    page.addBinding(m, 'bevel', { label: 'Bevel', min: 0, max: 2.5, step: 0.01 });
    page.addBinding(m, 'shadow', { label: 'Shadow', min: 0, max: 3, step: 0.01 });
  });
  tabs.pages[state.theme === 'dark' ? 1 : 0].selected = true;

  const adaptFolder = pane.addFolder({ title: 'Adapt' });
  adaptFolder.addBinding(state, 'autoDensity', { label: 'Auto density' });
  densityBinding = adaptFolder.addBinding(state, 'density', { label: 'Density', min: 0, max: 1, step: 0.01 });
  adaptFolder.addBinding(state, 'legible', { label: 'Keep legible' });
  adaptFolder.addBinding(state, 'threshold', { label: 'Threshold', min: 0.2, max: 0.8, step: 0.01 });
  adaptFolder.addBlade({ view: 'separator' });
  // What the player card reads off the wallpaper, as plain rows of the
  // folder: Tweakpane's read-only bindings raise the pane's change event on
  // every refresh, which would re-apply the settings twice a second.
  const readoutRows = document.createElement('div');
  readoutRows.className = 'readouts';
  adaptFolder.element.querySelector('.tp-fldv_c')?.append(readoutRows);
  const READOUTS = [['luminance', 'Luminance'], ['ink', 'Ink'], ['density', 'Density'], ['floor', 'Floor'], ['tint', 'Tint']];
  const showReadouts = () => {
    if (document.body.dataset.ui === 'off' || !adaptFolder.expanded) return;
    readoutRows.replaceChildren(...READOUTS.map(([key, label]) => {
      const row = document.createElement('div');
      row.append(Object.assign(document.createElement('span'), { textContent: t(label) }), Object.assign(document.createElement('b'), { textContent: readout[key] }));
      return row;
    }));
  };
  showReadouts();
  setInterval(showReadouts, 500);

  const refraction = pane.addFolder({ title: 'Refraction' });
  refraction.addBinding(state, 'lens', { label: 'On' });
  refraction.addBinding(state, 'rim', { label: 'Rim width', min: 4, max: 96, step: 1 });
  refraction.addBinding(state, 'edge', { label: 'Edge', min: 0, max: 2.5, step: 0.01 });
  refraction.addBinding(state, 'power', { label: 'Falloff', min: 1, max: 6, step: 0.1 });
  refraction.addBinding(state, 'dispersion', { label: 'Dispersion', min: 0, max: 0.4, step: 0.005 });

  const shape = pane.addFolder({ title: 'Shape' });
  shape.addBinding(state, 'radius', { label: 'Radius', min: 0, max: 60, step: 1 });
  if (cornerShapes) shape.addBinding(state, 'smoothing', { label: 'Smoothing', min: 0.5, max: 3, step: 0.05 });

  pane.addBlade({ view: 'separator' });
  pane.addButton({ title: 'Copy CSS' }).on('click', openCode);
  const linkButton = pane.addButton({ title: 'Copy link' });
  linkButton.on('click', async () => {
    try {
      await navigator.clipboard.writeText(location.href);
      linkButton.title = t('Link copied');
      setTimeout(() => { linkButton.title = t('Copy link'); }, 1400);
    } catch {}
  });
  pane.addButton({ title: 'Reset' }).on('click', () => {
    resetAll();
    apply();
    refreshPanel();
  });

  pane.addBinding(language, 'value', {
    label: 'Language',
    view: 'radiogrid',
    groupName: 'language',
    size: [2, 1],
    cells: (x) => [{ title: 'EN', value: 'en' }, { title: '中文', value: 'zh' }][x],
  }).on('change', () => {
    translate(document.body);
    apply();
  });

  densityBinding.disabled = state.autoDensity;

  const STYLE_ONLY = new Set(['theme', 'ink', 'preset', 'wallpaper', 'value']);
  pane.on('change', (event) => {
    const key = event.target?.key;
    if (key === 'theme' || key === 'wallpaper' || key === 'preset') return;
    if (!STYLE_ONLY.has(key)) tuning();
    for (const kind of ['light', 'dark']) {
      if (swatch[kind] !== materials[kind].tint) {
        swatch[kind] = materials[kind].tint;
        swatchBindings[kind].refresh();
      }
    }
    densityBinding.disabled = state.autoDensity;
    apply();
  });

  translate(pane.element);
}

buildPane().then(() => {
  // For the browser console.
  window.__glass = { state, materials, pane, apply };
});
