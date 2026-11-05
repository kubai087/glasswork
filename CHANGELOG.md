# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-11-05

### Added

- **INSTALL.md** and a one-line install prompt in the README: paste it into a coding agent and it adds this repository's glass to a project.

- **More backgrounds.** macOS's abstract wallpapers from Sonoma back to Big Sur beside Tahoe's, each with a light and a dark version that follow the theme (Sonoma's moves), a random photo from Lorem Picsum (Unsplash) with **Another photo**, and pasted links to an image or video; who made each shows in the stage's corner.
- **Your own file, more ways.** Upload an image or video, drop it on the page or paste it.
- **Loading note.** A note at the top of the stage while a wallpaper loads, and when one can't be loaded or played.

- **Refraction in Safari and Firefox.** Where `backdrop-filter` can't take an SVG filter, the glass's backdrop is drawn in WebGL (`refract.js`) between the wallpaper and the surfaces: the same rim, color split, blur and tone. It draws on each new frame of the wallpaper (a video's own frame callbacks, each frame of a live wallpaper), so the glass never lags what is around it, at the display's full rate while a surface is dragged, and not at all while everything is still.

### Changed

- **Faster.** About half the main-thread work while a wallpaper moves: the glass only restyles when what it reads has changed enough, the progress bar moves on its own, sampling reads a smaller copy and only while the wallpaper moves, and the live wallpapers draw at 30 frames a second and one pixel per CSS pixel. Dragging a refraction slider no longer drops frames: the lens bends to the new rim at once and rebuilds its tiles when the slider stops.
- A cover image for links to the page (`media/og.jpg`).
- **Safari draws every surface.** iOS failed to draw a backdrop filter clipped to a superellipse corner, which left the player blank; in WebKit the glass keeps plain round corners (the album art keeps its continuous ones). Safari also gets a moment's compositing hint after the wallpaper starts or changes, which it otherwise doesn't redraw for, and the player's progress bar no longer clips or blends.
- Corners follow tip 004: capsules (a radius of half the height or more) keep round ends instead of a flattened superellipse, and the player's art takes the card's radius minus its padding, so both share one corner center.
- The settings float over the wallpaper at the top right instead of being docked beside it.
- The refraction button shows when it is off: its icon is struck through and dimmed, and its tip says on or off.
- A wallpaper the glass can't read (another site's, without CORS) takes the theme's ink and a dense tint.

## [1.0.0] - 2026-11-05

### Added

- **The material.** Lumno's liquid glass as tokens (`glass.css`): light glass with dark ink and dark glass with light ink, each a thin tint, a 2px blur with saturation and a lift or dim inside the filter, rim light, a bevel, a shadow and blended ink.
- **The rim lens** (`lens.js`). A standalone module that bends the scene behind a surface's rim inward like a thick slab and splits it into colors, built from shared nine-slice tiles, following `corner-shape: superellipse()` corners; Chromium only, with the CSS glass kept elsewhere.
- **Wallpaper adaptation** (`adapt.js`). Each surface samples the wallpaper under it: tint density, how much saturation to keep, a legibility floor at 4.5:1 and, in Auto ink, light or dark ink with a band against flicker.
- **The playground.** A search bar, a now-playing card, a tint slider and a toolbar over the wallpaper; the first three can be dragged. A panel with every part of both materials, the adaptation, the refraction and the shape.
- **Presets.** Lumno, Clear glass, Frosted, Thick slab and Vivid; a preset sets only the material's body and refraction.
- **Wallpapers.** macOS Tahoe's dynamic wallpaper (Apple's; not covered by the license), six scenes drawn live in WebGL 2 with a light and a dark look (Mesh, Dunes, Aurora, Lava, Rings, Bokeh), or an image or video of your own; speed and pause.
- **Copy CSS.** The material at the current settings as plain CSS for light and dark glass, with the lens's script tag.
- **Settings in the URL**, relative to the chosen preset; **keyboard shortcuts** (H, T, W, Space) shown in the toolbar's tips.
- **Phone layout.** The settings open as a sheet below the stage from the toolbar.
- **Chinese panel and README** (`?lang=zh`, `README.zh-CN.md`).

[1.1.0]: https://github.com/kubai087/glasswork/releases/tag/v1.1.0
[1.0.0]: https://github.com/kubai087/glasswork/releases/tag/v1.0.0
