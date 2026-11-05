# Contributing to Glasswork

Thanks for your interest in improving Glasswork. Bug reports, ideas, new presets, wallpapers and fixes are all welcome.

## Before you start

- For a bug, [open an issue](https://github.com/kubai087/glasswork/issues/new/choose) with the page URL (the settings are in it), your browser and what you expected to see.
- For a larger change, such as a change to the material's look or a new kind of surface, open an issue first so the approach can be agreed before you spend time on it.
- For a security problem, do not open an issue; see [SECURITY.md](SECURITY.md).

## Run it locally

There is no build step and nothing to install. Serve the folder over HTTP, since ES modules and the videos do not load from `file://`:

```bash
git clone https://github.com/kubai087/glasswork.git
cd glasswork
python3 -m http.server 8000
```

Open <http://localhost:8000>, edit a file and reload the page.

Useful while working:

- `?paused=1` holds the wallpaper still, so you can compare a change frame for frame.
- `?ui=0` hides the panel; `H` toggles it.
- `window.__glass` in the console holds `state`, `materials`, `pane` and `apply()`.
- The panel's **Adapt** folder shows what the player card reads off the wallpaper.

## Code style

The code is small, dependency-free and meant to be read. Please keep it that way.

- **Plain ES modules, no build.** Use `import` / `export` with relative paths. Do not add a bundler, transpiler or package dependencies. Tweakpane and its Essentials plugin are imported from jsDelivr with an exact version.
- **`lens.js` and `adapt.js` stay standalone.** Other sites import them directly, so they must not depend on the playground.
- **Formatting.** Two-space indentation, LF line endings, UTF-8, a final newline (see [`.editorconfig`](.editorconfig)). Single quotes and semicolons in JavaScript; trailing commas in multi-line literals.
- **Shaders** live in template strings in `wallpapers.js` as GLSL ES 3.00 for WebGL 2. Every wallpaper needs a light and a dark look, mixed by `uDark`.
- **Comments explain the code.** Each file starts with a short block saying what it is for, and non-obvious steps get a plain-English comment on what they do and why. Leave history for commit messages.
- **Panel labels** are plain English, and any new label also needs its Chinese text in `i18n.js`.
- **Settings.** A new value belongs in `DEFAULTS` (or `MATERIALS`), so it is read from and written to the URL. Keep URL parameter names stable; shared links depend on them.
- **No third-party artwork.** New wallpapers are drawn by code or are your own work under the MIT License.

Check your change in Chrome, Safari and Firefox if you can, in both themes, and at a phone size.

## Commit messages

Use [Conventional Commits](https://www.conventionalcommits.org/): `<type>(<scope>): <summary>`, with types `feat`, `fix`, `perf`, `refactor`, `docs`, `build`, `ci`, `chore` and `revert`, and scopes such as `material`, `lens`, `adapt`, `wallpapers`, `panel` or `i18n`. Write the summary in the imperative mood, lowercase, without a trailing period.

```
feat(wallpapers): add a caustics scene
fix(lens): keep the rim seamless on tight corners
docs: document the lens options
```

## Pull requests

1. Fork the repository and create a branch from `main`.
2. Keep each pull request to one change, and describe what it does and how you checked it.
3. For a visual change, include before and after screenshots and the page URLs.
4. Add a line under **Unreleased** in [CHANGELOG.md](CHANGELOG.md) for anything a user would notice.
5. If you change a setting, URL parameter or the lens's options, update both READMEs to match.

By contributing, you agree that your contributions are licensed under the [MIT License](LICENSE).
