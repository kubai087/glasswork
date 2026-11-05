# Glasswork

**English** · [简体中文](README.zh-CN.md)

The liquid glass from [Lumno](https://lumno.kubai.design)'s New Tab page, pulled out into a playground you can tune. Tint, blur, the refracting rim, rim light and text color each have their own controls, and once it looks right, **Copy CSS** gives you the code.

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![No build step](https://img.shields.io/badge/build-none-brightgreen.svg)](#run-it-locally)
[![Refraction: Chromium](https://img.shields.io/badge/refraction-Chromium-4285f4.svg)](#browsers)
[![Live demo](https://img.shields.io/badge/demo-live-black.svg)](https://www.kubai.design/glasswork/)

![Glass search bar, player, tint slider and toolbar over the Dunes wallpaper, with the settings panel on the right](media/preview.jpg)

**[Open the playground](https://www.kubai.design/glasswork/)** · [The original post on X](https://x.com/Kubai087/status/2117782193108082923) · [The prompt](#use-it-in-your-own-product)

## What's in it

- Separate settings for light glass and dark glass: tint color and strength, blur, saturation, brightness, contrast, rim light, bevel and shadow.
- The refracting rim, with its width, edge offset, falloff and color split. Corner smoothing too, and the refraction follows the corner shape.
- Glass that looks at what's behind it. Busier wallpaper gets a denser tint, and text stays at 4.5:1 contrast.
- Plenty of backgrounds: macOS Tahoe's dynamic wallpaper, six animated wallpapers I drew in WebGL (each with a light and a dark version), four openly licensed videos from Wikimedia Commons (clouds, a waterfall, a coast, waves), or a random photo from Unsplash.
- Or use your own: upload an image or video, drag it onto the page, paste it, or paste a link to one. Local files are opened in your browser and never uploaded. A note at the top shows while a background loads.
- The search bar, player and tint slider can be dragged around the wallpaper. Double-click to put one back.
- Presets (Lumno, Clear glass, Frosted, Thick slab, Vivid) change only the material and the refraction, so your colors and theme stay put.
- Every setting lives in the URL. Send someone the link and they see the same glass.

![The six animated wallpapers, light and dark](media/wallpapers.jpg)

## How the glass works

The component itself doesn't change. Only four declarations do: `background`, `backdrop-filter`, `box-shadow` and `color`. Underneath, the glass is six layers:

1. **Shadow** gives the card its volume.
2. **Blur and lift.** The background is blurred by only 2px, then saturated and brightened, so the glass looks clear instead of milky. Dark glass dims the background instead, so it doesn't turn gray.
3. **Rim refraction.** An SVG displacement map pushes the background near the edge inward, hardest at the very edge and flat in the middle. Red bends a little more than blue, which gives the colored fringe.
4. **Tint**, a thin layer of color whose opacity follows how busy the background is.
5. **Rim light**, one line at the top left and one at the bottom right, plus a softer one set inside the edge.
6. **Text color.** Text is multiplied onto light glass and added onto dark glass, so it picks up a little of the background instead of sitting on top as flat color.

Each surface also reads 15 points of the wallpaper behind it and averages their brightness. With ink set to Auto, anything under 0.5 switches to dark glass with light text.

![The player card over the Rings wallpaper, its edge folding the stripes inward with a colored fringe](media/refraction.jpg)

The values [Lumno](https://lumno.kubai.design) uses:

| | Tint | Blur | Saturation | Brightness |
| --- | --- | --- | --- | --- |
| Light | white, 6%–22% | 2px | 180% | 1.06 |
| Dark | rgb(30 30 34), 16%–38% | 2px | 160% | 0.8 |

Refraction: a 40–44px rim, an edge offset of 1.1× the rim, falloff 2.6, color split ±15%.

## Use it in your own product

The quickest way is to hand this prompt to an AI coding tool like Claude Code or Cursor. It changes the material of your existing components and leaves the layout alone. It's the one from the original post.

<details>
<summary><b>Show the prompt</b></summary>

```text
Give the cards and panels in my product a liquid glass material: clear glass that takes its color from the scene behind it, reads as a thick slab at the rim, adapts to what is behind it, and keeps its text readable in light and dark mode. Work inside my existing design system. This is a change of surface, not of layout: keep my markup, spacing, radii, fonts, icons and copy.

0. Start from what exists
- Find every surface that sits over an image, a wallpaper, video or a busy background: cards, players, search bars, toolbars, menus, popovers, toasts. List them with their component and where they are.
- Find how the product switches between light and dark mode, and where its color tokens live. The glass goes into those tokens, not into each component.
- Leave surfaces over a plain background alone; glass over a flat color only looks gray.

1. The material as tokens
Build it as one set of variables per state, so a surface opts in by using them. The numbers are a starting point, for a UI at its normal size.
- Light glass, dark text (the default): tint white at 6–22% (by density, step 4); backdrop filter blur(2px) saturate(180%) brightness(1.06), so the color comes from behind and stays vivid instead of milky.
  Edge: inset 1.5px 1.5px 1px -1px white 95%, inset -1.5px -1.5px 1px -1px white 55%, inset 0 0 0 0.5px white 30%, 0 0 0 0.5px black 6%, 0 6px 24px black 8%.
  Inner light, on a layer inside the surface: a radial highlight from the top left (white 30% fading out by 55%), and soft inset glows just inside the rim, brighter at the top and left, a little shade at the bottom.
- Light mode over a dark area, light text: tint rgb(16 18 22) at 10–30%; filter blur(2px) saturate(170%), then brightness(0.85); edge: a faint inset white line on top and a 0.5px dark outline.
- Dark mode: tint rgb(20 20 24) at 16–38%; filter blur(2px) saturate(160%) brightness(0.8), which dims like a multiply with black instead of going muddy; the same edge and inner light at about a third of their strength, with a darker outline and shadow.
- Ink, one color in fixed steps, used for everything drawn on the glass:
  on light glass black 86% (titles, icons, times, progress), rgb(60 60 67) at 70% (secondary); mix-blend-mode multiply;
  on dark glass white 94%, rgb(235 235 245) at 64%; mix-blend-mode plus-lighter.
  Draw icons in the opaque color and fade the whole icon with opacity: a translucent color darkens where a shape's strokes and fills overlap.
- A highlighted row on light glass is a lighter layer of the glass: white 42% on hover, 76% when selected, with a white stroke. Never a gray wash.
- Register the numeric and color tokens with @property so a surface glides between states instead of jumping.

2. Apply it in four declarations
Each surface changes only these, and its markup stays as it is:
- background: the tint.
- backdrop-filter: the material's filter, then the rim lens (step 3) last, so the color steps fold into one pass and the bend stays crisp.
- box-shadow: the edge.
- color: the ink, with the blend mode on everything drawn inside.
Hover brightens the tint by about 14% instead of lifting a shadow.

3. The rim lens
- Build a displacement map for each surface: red is the sideways bend, green the vertical one, 128 is none. Only a rim bends; the middle stays flat.
- The rim is about 44px wide on a card (min(44px, the short side / 3.5), never under 4px). For a thick slab, a point d from the edge looks inward by 1.1 × rim × (1 - d / rim)^2.6: hard at the edge, where the scene folds back on itself, easing to nothing at the rim's inner edge.
- Draw the map for the same corner the CSS draws. If the surface uses corner-shape: superellipse(), follow that curve, not a circle, or the bend and the rim light miss each other at the corners.
- Put it in an SVG filter with feImage (the map) and feDisplacementMap (scale = 2 × the largest offset), and add url(#id) at the end of backdrop-filter.
- Split it into colors: three passes, red 15% further and blue 15% less, each kept to its channel with feColorMatrix and added back with screen blends. Check the corners of wide rims over busy backgrounds; lower the split where it turns into a haze.
- Only Chromium draws url() in backdrop-filter. Check CSS.supports('backdrop-filter', 'url(#a)') and skip Firefox, which parses it and draws nothing. Everywhere else the CSS-only glass stays.
- Wait for the map image to decode before pointing a surface at the filter, or it draws without its blur. Give every filter a unique id and its own <svg>. Build maps once per radius and rim width and reuse them; on resize, move the map, don't rebuild it.
- Skip the lens on surfaces under 32px, and on surfaces with will-change or their own compositing layer (menus, animated panels), where Chrome can draw the map instead of the bent backdrop.

4. Adapt to what is behind
- For each surface, sample the background under it at a 5 × 3 grid, drop the two darkest and two brightest points, and average. Luminance is (0.299 R + 0.587 G + 0.114 B) / 255; texture is the brightest point minus the darkest.
- Ink: in light mode, light text when the luminance is under 0.5. Keep the current ink within ±0.05 of the line so a surface never flickers at it. Dark mode is always light text. Neighbouring surfaces in one row share one decision.
- Density (0 thin, 1 dense) = 0.55 × how close the background is to the ink's own brightness + 0.7 × texture + 0.3 × chroma. It moves the tint between its thin and dense alpha.
- Saturation kept = 1 - 0.75 × chroma, at least 0.45, so a vivid background doesn't stain the glass.
- Sample again when the background, the theme or a surface's position changes, and remember the last ink so the next load opens in it.
- If the background is not an image you can read (live video, cross-origin content), pick the ink from the theme and use the dense tint.

5. Let people set the tint
- Add one setting for light mode and one for dark that scale the tint, from 0 to 1.5 (1 is the material as designed). Below 1 the brightness lift in the filter thins with it, so at 0 only the blur, the rim and the shadow are left.
- Each theme keeps its own value; switching themes glides to that theme's value.

6. Keep it accessible
- Check text contrast on the busiest and the darkest background the product allows, at the default tint; raise density, not the ink's opacity, until it passes.
- Respect prefers-reduced-transparency and forced colors: fall back to a solid surface in the same tint at full opacity.
- Keep focus rings, disabled states and error colors as they are; failures keep their red.

7. Deliver
- First list the surfaces you will change, which get the lens and the color split, and which you leave solid and why.
- Then add the tokens, the lens helper and the two settings, switch the surfaces over, and list every file you touched.
- Don't change layout, fonts, radii or copy. If a surface would need a new component to work as glass, stop and ask me first.
```

</details>

To do it by hand, tune the glass in the playground and press `</>` in the toolbar. You get CSS for light glass (`.glass`) and dark glass (`.glass.is-dark`) with your values in it. `glass.css` in this repo is the same material written as variables.

The refraction needs one small script with no dependencies:

```html
<script type="module">
  import { liquidGlass } from 'https://cdn.jsdelivr.net/gh/kubai087/glasswork@v1.0.0/lens.js';
  for (const el of document.querySelectorAll('.glass')) {
    liquidGlass(el, { rim: 40, edge: 1.1, power: 2.6, dispersion: 0.15 });
  }
</script>
```

End the element's `backdrop-filter` with `var(--glass-lens,)`. The script fills that variable in and keeps it fitted when the element resizes.

| Option | Default | |
| --- | --- | --- |
| `rim` | `40` | Maximum rim width in px. Small elements shrink it to 1/3.5 of their short side |
| `edge` | `1.1` | How far the outer edge shifts inward, in rim widths |
| `power` | `2.6` | How quickly the bend fades toward the middle |
| `dispersion` | `0.15` | How much more red bends than blue; `0` for no color split |
| `radius`, `corner` | from CSS | Corner radius and shape; usually leave these out |
| `enabled` | `true` | Turn the refraction off for now |

It returns `update(options)`, `refresh()` and `destroy()`. If you also want the glass to change tone and density with the background, see `adapt.js`.

## URL parameters

The URL only keeps what differs from the current preset. You can also write one by hand, like `?wallpaper=aurora&theme=dark&rim=56`.

| Parameter | Values | |
| --- | --- | --- |
| `preset` | `lumno`, `clear-glass`, `frosted`, `thick-slab`, `vivid` | Preset |
| `theme` | `light` (default), `dark` | Theme |
| `wallpaper` | `tahoe` (default), `mesh`, `dunes`, `aurora`, `lava`, `lines`, `bokeh`, `clouds`, `waterfall`, `coast`, `ocean`, `photo` | Wallpaper |
| `photo` | a Picsum photo id | Which random photo to show |
| `speed`, `paused` | `0`–`3`; `0` / `1` | Wallpaper speed, pause |
| `ink` | `theme` (default), `auto`, `dark`, `light` | Text color; `auto` follows the wallpaper |
| `autoDensity`, `density` | `0` / `1`; `0`–`1` | Tint density, automatic or set by hand |
| `legible`, `threshold` | `0` / `1`; `0.2`–`0.8` | Keep text legible; where Auto ink switches |
| `lens`, `rim`, `edge`, `power`, `dispersion` | `0` / `1`; `4`–`96`; `0`–`2.5`; `1`–`6`; `0`–`0.4` | Refraction |
| `radius`, `smoothing` | `0`–`60`; `0.5`–`3` | Corner radius and smoothing |
| `l.<key>`, `d.<key>` | | One value of light or dark glass: `tint`, `opacity`, `thin`, `dense`, `blur`, `saturation`, `brightness`, `contrast`, `rimLight`, `bevel`, `shadow` |
| `lang`, `ui` | `zh`; `0` / `1` | Chinese panel; start with the panel closed |

Shortcuts: `H` panel, `T` light/dark, `W` next wallpaper, Space to pause. The toolbar shows them on hover.

## Run it locally

No dependencies and no build step. Any static server works:

```bash
git clone https://github.com/kubai087/glasswork.git
cd glasswork
python3 -m http.server 8000
```

Open <http://localhost:8000>. `window.__glass` in the console is there for debugging.

There aren't many files: `glass.css` is the material, `lens.js` the refraction, `adapt.js` reads the wallpaper, `wallpapers.js` draws the six wallpapers, and `playground.js` runs the panel and the page.

## Browsers

Chromium browsers (Chrome, Edge, Arc and so on) show everything. Safari and Firefox can't draw the refraction and fall back to plain CSS glass, which still has the tint, blur and rim light. Corner smoothing needs Chromium 139 or later.

If you paste a link from a site that doesn't allow cross-origin reads, it still shows, but the glass can't read it, so it uses the theme's ink and a denser tint.

Issues and pull requests are welcome; see [CONTRIBUTING.md](CONTRIBUTING.md).

## License and credits

- The code is [MIT](LICENSE), and so are the images in `media/` that this project rendered.
- **The Tahoe wallpaper isn't covered by the MIT license.** `tahoe-light.mp4`, `tahoe-dark.mp4`, `tahoe-light.webp` and `tahoe-dark.webp` in `media/` are cut from macOS Tahoe's dynamic wallpaper, © Apple Inc. They're here only so the live demo can show the glass over the wallpaper it was designed on. Please don't reuse them, and remove them from anything you build on this code. I'll take them down if the rights holder asks. See [NOTICE](NOTICE).
- This is a personal project with no connection to Apple. Apple, macOS, macOS Tahoe and Liquid Glass are trademarks of Apple Inc.; "liquid glass" here means [Lumno](https://lumno.kubai.design)'s own material.
- The four videos come from Wikimedia Commons. I cut each to at most 30 seconds, dropped the sound and re-encoded them as 720p MP4 in `media/`; each keeps its own license (not MIT): [Clouds](https://commons.wikimedia.org/wiki/File:2020-04-03_timelapse-nuages-Belfort.webm) by Thomas Bresson (CC BY 4.0), [Waterfall](https://commons.wikimedia.org/wiki/File:Athirapally_falls.webm) by Shyamal (CC0), [Coast](https://commons.wikimedia.org/wiki/File:Northern_Shore_of_Madeira_near_Porto_Moniz.webm) by Szabolcs Beki (CC BY 3.0) and [Ocean](https://commons.wikimedia.org/wiki/File:Pacific_Ocean_at_Arena_Cove_-_April_2023_-_Sarah_Stierch.webm) by Sarah Stierch (CC BY 4.0). The author and license show in the bottom-left corner while one plays.
- Random photos come from [Lorem Picsum](https://picsum.photos), which serves Unsplash photos under the Unsplash License; the photographer is credited in the corner.
- The panel is [Tweakpane](https://tweakpane.github.io/docs/), MIT licensed, loaded from jsDelivr.
