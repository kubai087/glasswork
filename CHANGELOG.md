# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **More backgrounds.** Four openly licensed videos streamed from Wikimedia Commons (Clouds, Waterfall, Coast, Ocean), a random photo from Lorem Picsum (Unsplash) with **Another photo**, and pasted links to an image or video; the author and license show in the stage's corner.
- **Your own file, more ways.** Upload an image or video, drop it on the page or paste it.
- **Loading note.** A note at the top of the stage while a wallpaper loads, and when one can't be loaded or played.

### Changed

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

[1.0.0]: https://github.com/kubai087/glasswork/releases/tag/v1.0.0
