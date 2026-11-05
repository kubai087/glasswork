# Security policy

Glasswork is a static site with no server code: it draws in the browser and keeps its settings in the page's URL. The parts most worth a look are how URL parameters are read into settings (`playground.js`), the wallpaper upload (a file stays in the browser as an object URL), and `lens.js`, which other sites import.

## Supported versions

Only the latest code on the `main` branch is supported.

## Reporting a vulnerability

Please do not open a public issue for a security problem. Report it privately through GitHub's security advisories instead: on this repository, go to **Security → Advisories → Report a vulnerability** ([direct link](https://github.com/kubai087/glasswork/security/advisories/new)).

Include what you found, the steps or a page URL that reproduces it, and the browser you used. You will get a reply on the advisory, and a fix will be credited to you if you wish.
