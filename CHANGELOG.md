# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
