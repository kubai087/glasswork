# Liquid Glass Playground

[简体中文](./README.zh-CN.md)

**Live: <https://www.kubai.design/liquid-glass/>**

The liquid glass material from [Lumno](https://github.com/kubai087/lumno-extension)'s New Tab page, open and tunable, over macOS Tahoe's dynamic wallpaper. Tip 010 of *Vibe Design Tips* takes the material apart; this page lets you set every part of it and copy the result.

Open `index.html` over http (videos and modules don't load from `file://`):

```bash
python3 -m http.server 8000
```

## What you can set

| Group | Settings |
| --- | --- |
| Scene | Light or dark theme, ink (auto from the wallpaper, or held dark or light), Tahoe or your own image or video, pause |
| Material | For light glass and dark glass each: tint color with swatches, tint opacity (0–150%), thin and dense tint, blur, saturation, brightness, contrast, rim light, bevel, shadow |
| Adapt | Tint density from the wallpaper or by hand, a legibility floor (text keeps 4.5:1), the ink threshold, and what the player card reads live |
| Refraction | Rim width, how far the edge bends (in rims), falloff, color split |
| Shape | Corner radius and smoothing (CSS `corner-shape: superellipse()`) |

Presets: Lumno, Clear glass, Frosted, Thick slab, Vivid. Drag any surface across the wallpaper (double-click puts it back). Every setting goes in the URL, so a link opens the same glass. Keys: **H** hides the panel, **T** switches the theme, **Space** pauses the wallpaper. On a phone the panel is a sheet, opened from the toolbar.

## How the material works

A surface becomes glass with four declarations:

```css
.glass {
  background: rgb(255 255 255 / 0.12);                                   /* the tint */
  backdrop-filter: blur(2px) saturate(180%) brightness(1.06) var(--glass-lens,);
  box-shadow: /* rim light, outline, shadow, bevel */;
  color: rgb(0 0 0 / 0.86);                                              /* the ink, multiplied */
}
```

- **Tint**: a thin wash; the color comes from behind. Its density follows the wallpaper under each surface (busier or nearer the ink's own brightness → denser).
- **Blur and tone**: only 2px of blur, then saturation and a lift (light) or a dim (dark) inside the filter, so the glass stays vivid instead of milky or muddy.
- **Rim lens** (`lens.js`): an SVG displacement map bends the wallpaper behind the rim inward like a thick slab's edge: a point *d* from the edge looks inward by `edge × rim × (1 − d / rim)^power`. Red bends a little further than blue, so the rim fringes into colors. Only Chromium draws `url()` in `backdrop-filter`; other browsers keep the CSS glass.
- **Ink**: each surface samples the wallpaper under it (5 × 3 points, two darkest and two brightest dropped). Under 0.5 luminance it takes light ink and dark glass; text is one ink in two opacities, multiplied on light glass and plus-lighter on dark.

**Copy CSS** writes the material at your settings, with the lens's script tag.

## Using the lens on its own

```js
import { liquidGlass } from './lens.js';
const lens = liquidGlass(element, { rim: 40, edge: 1.1, power: 2.6, dispersion: 0.15 });
lens.update({ rim: 32 });
lens.destroy();
```

The element must end its `backdrop-filter` with `var(--glass-lens,)`. The radius and corner shape are read from its CSS.

## Files

- `glass.css`: the material, as tokens
- `lens.js`: the rim lens, standalone
- `adapt.js`: wallpaper sampling, ink, density and the legibility floor
- `playground.js`, `panel.js`, `i18n.js`, `style.css`: the page

## License

The code is MIT. The wallpaper videos in `media/` are cut from macOS Tahoe's dynamic wallpaper, which belongs to Apple; they are here for demonstration and are not covered by the license.
