# Glasswork

**English** · [简体中文](README.zh-CN.md)

Glasswork is a standalone playground for the liquid glass material used on [Lumno](https://lumno.kubai.design)'s New Tab page. Tint, blur, rim refraction, rim light and text color can each be adjusted from the panel, and **Copy CSS** exports the resulting code.

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![No build step](https://img.shields.io/badge/build-none-brightgreen.svg)](#running-locally)
[![Refraction: Chromium and WebGL](https://img.shields.io/badge/refraction-Chromium%20%7C%20WebGL-4285f4.svg)](#browser-support)
[![Live demo](https://img.shields.io/badge/demo-live-black.svg)](https://www.kubai.design/glasswork/)

![Glass search bar, player, tint slider and toolbar over the Dunes wallpaper, with the settings panel on the right](media/preview.jpg)

**[Open the playground](https://www.kubai.design/glasswork/)** · [Announcement on X](https://x.com/Kubai087/status/2117782193108082923) · [Installation](#using-it-in-your-project)

## Features

- Independent settings for light and dark glass: tint color and strength, blur, saturation, brightness, contrast, rim light, bevel and shadow.
- Adjustable rim refraction: width, edge offset, falloff and dispersion. Corner smoothing is also adjustable, and the refraction follows the corner shape.
- Adaptive glass: the busier the wallpaper behind a surface, the denser its tint, while text contrast stays at 4.5:1 or above.
- A range of built-in backgrounds: five generations of macOS abstract wallpapers (Tahoe, Sonoma, Ventura, Monterey and Big Sur, with light and dark versions that follow the theme; Tahoe and Sonoma are animated), six animated wallpapers rendered in WebGL (each in a light and a dark version), and random photos from Unsplash.
- Custom images and videos, added by uploading, dragging onto the page, pasting a file or pasting a link. Local files are opened in the browser only and never uploaded. A notice at the top of the page indicates when a background is loading.
- The search bar, player and tint slider can be dragged across the wallpaper; double-click to return one to its original position.
- Five presets: Lumno, Clear glass, Frosted, Thick slab and Vivid. Presets change only the material and refraction, so adjusted colors, theme and other settings are preserved.
- All settings are stored in the URL, so a shared link reproduces the same result.

![The six animated wallpapers, light and dark](media/wallpapers.jpg)

## How it works

The component structure is left unchanged; only four declarations are replaced: `background`, `backdrop-filter`, `box-shadow` and `color`. The material consists of six layers:

1. **Shadow**, which gives the card its sense of volume.
2. **Blur and lift.** The background is blurred by only 2px, with saturation and brightness raised so the glass stays clear rather than milky. Dark glass lowers the brightness instead, which avoids a gray cast.
3. **Rim refraction.** An SVG displacement map shifts the background near the edge inward, most strongly at the edge and not at all in the middle. Red is shifted slightly more than blue, which produces dispersion.
4. **Tint**, a translucent layer of color whose opacity adjusts to how busy the background is.
5. **Rim light**: one highlight at the top left, one at the bottom right, and a softer one inset from the edge to suggest thickness.
6. **Text color.** Text is multiplied onto light glass and added onto dark glass, so it carries some of the background's color instead of a flat fill.

Each surface also samples 15 points of the wallpaper behind it and averages their brightness. When ink is set to Auto, an average below 0.5 switches the surface to dark glass with light text.

![The player card over the Rings wallpaper, its edge refracting the stripes inward with a colored fringe](media/refraction.jpg)

The values currently used by [Lumno](https://lumno.kubai.design):

| | Tint | Blur | Saturation | Brightness |
| --- | --- | --- | --- | --- |
| Light | white, 6%–22% | 2px | 180% | 1.06 |
| Dark | rgb(30 30 34), 16%–38% | 2px | 160% | 0.8 |

Refraction: a 40–44px rim, an edge offset of 1.1× the rim width, a falloff of 2.6 and ±15% dispersion.

## Using it in your project

### Installing with an AI coding tool

Paste the following prompt into Claude Code, Cursor or another AI coding tool:

```text
Read https://raw.githubusercontent.com/kubai087/glasswork/main/INSTALL.md and follow it to add Glasswork's liquid glass to my project.
```

Following the steps in [INSTALL.md](INSTALL.md), the tool applies this repository's material to your existing components without changing their layout, including the compatibility fixes for Safari and iOS.

### Manual setup

Adjust the glass in the playground, then press `</>` in the toolbar to get CSS for light glass (`.glass`) and dark glass (`.glass.is-dark`) with the current values. `glass.css` in this repository is the same material expressed as variables.

The rim refraction requires one additional script with no dependencies:

```html
<script type="module">
  import { liquidGlass } from 'https://cdn.jsdelivr.net/gh/kubai087/glasswork@v1.1.0/lens.js';
  for (const el of document.querySelectorAll('.glass')) {
    liquidGlass(el, { rim: 40, edge: 1.1, power: 2.6, dispersion: 0.15 });
  }
</script>
```

The element's `backdrop-filter` must end with `var(--glass-lens,)`. The script writes the refraction into that variable and updates it when the element is resized.

| Option | Default | Description |
| --- | --- | --- |
| `rim` | `40` | Maximum rim width in px. Smaller elements reduce it to 1/3.5 of their shorter side |
| `edge` | `1.1` | Inward offset of the outer edge, in rim widths |
| `power` | `2.6` | How quickly the refraction falls off toward the middle |
| `dispersion` | `0.15` | Additional offset of red relative to blue; `0` disables dispersion |
| `radius`, `corner` | read from CSS | Corner radius and shape; usually omitted |
| `enabled` | `true` | Whether the refraction is active |

The function returns `update(options)`, `refresh()` and `destroy()`. To have the glass switch tone and adjust its density based on the background, see `adapt.js`.

## URL parameters

The URL records only values that differ from the current preset. Parameters can also be written by hand, for example `?wallpaper=aurora&theme=dark&rim=56`.

| Parameter | Values | Description |
| --- | --- | --- |
| `preset` | `lumno`, `clear-glass`, `frosted`, `thick-slab`, `vivid` | Preset |
| `theme` | `light` (default), `dark` | Theme |
| `wallpaper` | `tahoe` (default), `sonoma`, `ventura`, `monterey`, `bigsur`, `mesh`, `dunes`, `aurora`, `lava`, `lines`, `bokeh`, `photo` | Wallpaper |
| `photo` | a Picsum photo id | A specific random photo |
| `speed`, `paused` | `0`–`3`; `0` / `1` | Wallpaper playback speed; paused state |
| `ink` | `theme` (default), `auto`, `dark`, `light` | Text color; `auto` follows the wallpaper |
| `autoDensity`, `density` | `0` / `1`; `0`–`1` | Automatic or manual tint density |
| `legible`, `threshold` | `0` / `1`; `0.2`–`0.8` | Legibility guarantee; brightness threshold for automatic switching |
| `lens`, `rim`, `edge`, `power`, `dispersion` | `0` / `1`; `4`–`96`; `0`–`2.5`; `1`–`6`; `0`–`0.4` | Rim refraction |
| `radius`, `smoothing` | `0`–`60`; `0.5`–`3` | Corner radius and smoothing |
| `l.<key>`, `d.<key>` | | Individual values for light or dark glass: `tint`, `opacity`, `thin`, `dense`, `blur`, `saturation`, `brightness`, `contrast`, `rimLight`, `bevel`, `shadow` |
| `lang`, `ui` | `zh`; `0` / `1` | Chinese interface; panel collapsed on load |

Keyboard shortcuts: `H` toggles the panel, `T` switches between light and dark, `W` moves to the next wallpaper, and Space pauses. Toolbar buttons also show their shortcuts on hover.

## Running locally

The project has no dependencies and no build step. Any static server will run it:

```bash
git clone https://github.com/kubai087/glasswork.git
cd glasswork
python3 -m http.server 8000
```

Then open <http://localhost:8000>. `window.__glass` is available in the console for inspecting state while debugging.

Main files: `glass.css` defines the material, `lens.js` the rim refraction, `refract.js` the WebGL refraction used in Safari and Firefox, `adapt.js` the wallpaper sampling, `wallpapers.js` the six animated wallpapers, and `playground.js` the panel and page interaction.

## Browser support

Chromium-based browsers such as Chrome, Edge and Arc render the rim refraction with an SVG filter inside `backdrop-filter` (`lens.js`). Safari, all browsers on iOS and Firefox do not support this, so the playground renders the layer behind the glass in WebGL instead (`refract.js`), with the same rim refraction, dispersion, blur and tone, beneath the glass's tint and rim light. When used on its own, `lens.js` produces refraction in Chromium only.

Corner smoothing requires Chromium 139 or later. In Safari the glass uses standard rounded corners, because iOS 27 fails to render elements that combine a superellipse corner with a backdrop blur.

If a pasted link points to a site that does not allow cross-origin reads, the background still displays, but the glass cannot sample it and falls back to the theme's ink and a denser tint.

Issues and pull requests are welcome; see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License and credits

- The code is released under the [MIT](LICENSE) license, as are the images in `media/` rendered by this project.
- **The macOS wallpapers are not covered by the MIT license.** The `tahoe-*`, `sonoma-*`, `ventura-*`, `monterey-*` and `bigsur-*` files in `media/` are cropped or converted from macOS system wallpapers, © Apple Inc., and are included solely to demonstrate the glass over them in the live demo. Please do not reuse them, and remove them from any project built on this code. They will be removed promptly at the rights holder's request. See [NOTICE](NOTICE).
- This is a personal project and is not affiliated with Apple. Apple, macOS, macOS Tahoe and Liquid Glass are trademarks of Apple Inc.; "liquid glass" here refers to [Lumno](https://lumno.kubai.design)'s own material.
- Random photos are provided by [Lorem Picsum](https://picsum.photos), sourced from Unsplash under the Unsplash License; the photographer is credited in the lower-left corner.
- The settings panel uses [Tweakpane](https://tweakpane.github.io/docs/), MIT licensed, loaded from jsDelivr.
