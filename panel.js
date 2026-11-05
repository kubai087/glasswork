/*
 * The settings panel's library (Tweakpane, from jsDelivr). If the CDN can't
 * be reached in time the glass still works, with a stand-in that accepts
 * every call the page makes and does nothing. Adapted from PRO Threads.
 */

const TWEAKPANE = 'https://cdn.jsdelivr.net/npm/tweakpane@4.0.5/dist/tweakpane.min.js';
const ESSENTIALS = 'https://cdn.jsdelivr.net/npm/@tweakpane/plugin-essentials@0.2.1/dist/tweakpane-plugin-essentials.min.js';
const WAIT = 8000;

// Any property is another stand-in, any call returns one; element is a real
// (detached) node, children an empty list, flags false.
function standIn() {
  const element = document.createElement('div');
  const proxy = new Proxy(function () {}, {
    get(_, key) {
      if (key === 'element') return element;
      if (key === 'children') return [];
      if (key === 'pages') return [proxy, proxy, proxy];
      if (key === 'then' || typeof key === 'symbol') return undefined;
      if (['disabled', 'selected', 'hidden', 'expanded'].includes(key)) return false;
      return proxy;
    },
    apply: () => proxy,
    set: () => true,
  });
  return proxy;
}

// A Pane (with the Essentials plugin), or the stand-in.
export async function createPane(options) {
  try {
    const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), WAIT));
    const [{ Pane }, Essentials] = await Promise.race([Promise.all([import(TWEAKPANE), import(ESSENTIALS)]), timeout]);
    options.container?.querySelector('.sidebar-loading')?.remove();
    const pane = new Pane(options);
    pane.registerPlugin(Essentials);
    return pane;
  } catch {
    const note = options.container?.querySelector('.sidebar-loading');
    if (note) note.textContent = 'The settings could not be loaded.';
    console.warn('Glasswork: the settings panel could not be loaded; the glass works without it.');
    return standIn();
  }
}
