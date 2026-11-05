# Install Glasswork

Instructions for an AI coding agent adding Glasswork's liquid glass to a project. The user pasted a short prompt that points here; follow these steps in their project.

The material changes surfaces, not layout. Keep the project's markup, spacing, radii, fonts, icons and copy.

## 1. Read the source

Read these files from https://github.com/kubai087/glasswork before changing anything:

- `glass.css`: the material. A surface becomes glass through four declarations: `background`, `backdrop-filter`, `box-shadow` and `color`. Two kinds, chosen per surface with `data-kind`: `light` (clear glass, dark ink) and `dark` (smoky glass, light ink).
- `lens.js`: the rim refraction, `liquidGlass(el, options)`.
- `adapt.js`: reads the background under a surface and picks the ink and the least tint its text needs.
- `refract.js`: the same refraction drawn in WebGL, for browsers without `backdrop-filter: url()`.

## 2. Find the surfaces

List every surface that sits over an image, a video or a busy background (cards, players, search bars, toolbars, menus, popovers, toasts), with its component and file. Show the list to the user before editing. Leave surfaces over a plain color alone; glass over a flat color only looks gray.

## 3. Add the material

- Bring the custom properties and rules from `glass.css` into the project's own styles, next to its color tokens, and connect the `light` and `dark` kinds to its existing light/dark switch.
- On each surface, change only `background`, `backdrop-filter`, `box-shadow` and `color`.
- If the user pasted CSS copied from the playground (https://www.kubai.design/glasswork/, the Copy CSS button), use those values.

## 4. Add the rim refraction

```js
import { liquidGlass } from 'https://cdn.jsdelivr.net/gh/kubai087/glasswork@v1.1.0/lens.js';

liquidGlass(el, { rim: 40, edge: 1.1, power: 2.6, dispersion: 0.15 });
```

Each surface must end its `backdrop-filter` with `var(--glass-lens,)`. This draws in Chromium only; in other browsers the CSS glass stays as it is. If the project doesn't load modules from a CDN, copy lens.js into it.

If the background is an image, a video or a canvas the page draws itself, `refract.js` can draw the refraction for Safari, iOS and Firefox too. `playground.js` (`startRefraction`) shows how to wire it up.

## 5. Safari and iOS

Give every surface with `backdrop-filter` `corner-shape: round` in Safari and on iOS. iOS 27 leaves an element with both `backdrop-filter` and a superellipse corner undrawn on real devices, and the simulator doesn't show the bug.

## 6. Check

- Text keeps 4.5:1 contrast against the glass in light and dark mode.
- `prefers-reduced-transparency: reduce` gets a solid surface.
- Tell the user every file you changed.
