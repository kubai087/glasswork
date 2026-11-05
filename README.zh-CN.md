# Glasswork

[English](README.md) · **简体中文**

[Lumno](https://lumno.kubai.design) 新标签页上那层液态玻璃，我把它单独拿出来，做成了一个可以随便调的 Playground。着色、模糊、边缘折射、边缘光、文字颜色，每一层都在面板上，调到满意了点「复制 CSS」带走就行。

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![No build step](https://img.shields.io/badge/build-none-brightgreen.svg)](#本地运行)
[![Refraction: Chromium](https://img.shields.io/badge/refraction-Chromium-4285f4.svg)](#浏览器)
[![Live demo](https://img.shields.io/badge/demo-live-black.svg)](https://www.kubai.design/glasswork/?lang=zh)

![沙丘壁纸上的玻璃搜索框、播放器、染色滑条和工具栏，右边是设置面板](media/preview.jpg)

**[在线体验](https://www.kubai.design/glasswork/?lang=zh)** · [X 上的原帖](https://x.com/Kubai087/status/2117782193108082923) · [Prompt](#用到自己的产品里)

## 可以玩什么

- 浅色玻璃、深色玻璃各一套参数：着色颜色和浓淡、模糊、饱和度、亮度、对比度、边缘光、内侧柔光、阴影。
- 边缘折射的边宽、偏移、衰减和色散都能调。圆角也能调平滑度，折射会跟着圆角走。
- 玻璃会看身后的壁纸：背景越花，着色越浓，文字始终保持 4.5:1 的对比度。
- 背景有很多选择：从 Tahoe 往前数的五代 macOS 抽象壁纸（Tahoe、Sonoma、Ventura、Monterey、Big Sur，深浅两版跟着主题切换，Tahoe 和 Sonoma 是动态的）；6 张我用 WebGL 画的动态壁纸，深浅模式各一版；或者随机来一张 Unsplash 的照片。
- 也可以用你自己的图片或视频：点上传、直接拖进页面、粘贴文件，或者贴一个图片 / 视频链接都行。本地文件只在你的浏览器里打开，不会上传。背景加载时顶部会有提示。
- 搜索框、播放器、染色滑条可以拖着在壁纸上走，双击回到原位。
- 预设有 Lumno、全透、磨砂、厚玻璃、鲜艳几种，只改材质和折射，你调过的颜色、主题这些不会被冲掉。
- 所有设置都记在网址里，把链接发给别人，打开就是同一块玻璃。

![6 张动态壁纸的浅色版和深色版](media/wallpapers.jpg)

## 这层玻璃是怎么做的

组件本身一行不动，只换掉四个声明：`background`、`backdrop-filter`、`box-shadow`、`color`。底下拆成 6 层：

1. **投影**：控制卡片的体积感。
2. **模糊与提亮**：背景只模糊 2px，同时提高饱和度和亮度，玻璃更通透，不发奶白。深色玻璃反过来压暗，也不会发灰。
3. **边缘折射**：用 SVG 位移贴图把边缘一圈的背景往里压，越靠边压得越狠，中间保持平整；红光比蓝光多弯一点，就有了色散。
4. **着色**：一层半透明的颜色，透明度跟着背景的复杂程度自动调。
5. **边缘光**：左上、右下各一道，再往内侧缩进一道，整体就有了厚度。
6. **文字着色**：浅色玻璃上用正片叠底，深色玻璃上叠加提亮。文字会带一点背景的颜色，不是死板的纯色。

另外每块玻璃会在身后读 15 个采样点，算出平均亮度。墨色设成「自动」的话，低于 0.5 就换成深色玻璃配浅色字。

![波纹壁纸上的播放器卡片，边缘把条纹往里折，带一圈彩边](media/refraction.jpg)

推荐参数，也就是 [Lumno](https://lumno.kubai.design) 现在用的：

| | 着色 | 模糊 | 饱和度 | 亮度 |
| --- | --- | --- | --- | --- |
| 浅色 | 白色 6%–22% | 2px | 180% | 1.06 |
| 深色 | rgb(30 30 34) 16%–38% | 2px | 160% | 0.8 |

折射：边宽 40–44px，边缘偏移 1.1 倍边宽，衰减 2.6，色散 ±15%。

## 用到自己的产品里

最省事的办法是把下面这段 Prompt 交给 Claude Code、Cursor 这类 AI 编程工具，它会在你现有的组件上换材质，不动布局。这是帖子里附的那段，原文是英文。

<details>
<summary><b>展开 Prompt</b></summary>

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

想自己动手的话，在 Playground 里调好，点工具栏的 `</>`，会得到浅色（`.glass`）和深色（`.glass.is-dark`）两套 CSS，数值就是你调出来的。仓库里的 `glass.css` 是同一套材质的变量写法。

边缘折射要额外引一个小脚本，没有依赖：

```html
<script type="module">
  import { liquidGlass } from 'https://cdn.jsdelivr.net/gh/kubai087/glasswork@v1.0.0/lens.js';
  for (const el of document.querySelectorAll('.glass')) {
    liquidGlass(el, { rim: 40, edge: 1.1, power: 2.6, dispersion: 0.15 });
  }
</script>
```

元素的 `backdrop-filter` 最后要接上 `var(--glass-lens,)`，折射会填进这个变量里，元素尺寸变了也会自己跟上。

| 选项 | 默认值 | 作用 |
| --- | --- | --- |
| `rim` | `40` | 边宽上限，单位 px。小组件会自动缩到短边的 1/3.5 |
| `edge` | `1.1` | 最外沿往里偏移几倍边宽 |
| `power` | `2.6` | 往里走时折射衰减得多快 |
| `dispersion` | `0.15` | 红光比蓝光多弯多少，`0` 就是不分色 |
| `radius`、`corner` | 读 CSS | 圆角半径和形状，一般不用填 |
| `enabled` | `true` | 临时关掉折射 |

它会返回 `update(options)`、`refresh()` 和 `destroy()`。如果还想让玻璃跟着背景换深浅、调浓度，可以看 `adapt.js`。

## 网址参数

网址里只记和当前预设不一样的值。也可以手写，比如 `?wallpaper=aurora&theme=dark&rim=56`。

| 参数 | 取值 | |
| --- | --- | --- |
| `preset` | `lumno`、`clear-glass`、`frosted`、`thick-slab`、`vivid` | 预设 |
| `theme` | `light`（默认）、`dark` | 主题 |
| `wallpaper` | `tahoe`（默认）、`sonoma`、`ventura`、`monterey`、`bigsur`、`mesh`、`dunes`、`aurora`、`lava`、`lines`、`bokeh`、`photo` | 壁纸 |
| `photo` | Picsum 的照片 id | 随机照片固定成哪一张 |
| `speed`、`paused` | `0`–`3`；`0` / `1` | 壁纸速度、暂停 |
| `ink` | `theme`（默认）、`auto`、`dark`、`light` | 文字墨色，`auto` 是按壁纸自动切换 |
| `autoDensity`、`density` | `0` / `1`；`0`–`1` | 着色浓度自动或手动 |
| `legible`、`threshold` | `0` / `1`；`0.2`–`0.8` | 保证可读；自动换色的阈值 |
| `lens`、`rim`、`edge`、`power`、`dispersion` | `0` / `1`；`4`–`96`；`0`–`2.5`；`1`–`6`；`0`–`0.4` | 边缘折射 |
| `radius`、`smoothing` | `0`–`60`；`0.5`–`3` | 圆角和平滑度 |
| `l.<key>`、`d.<key>` | | 浅色、深色玻璃的单项：`tint`、`opacity`、`thin`、`dense`、`blur`、`saturation`、`brightness`、`contrast`、`rimLight`、`bevel`、`shadow` |
| `lang`、`ui` | `zh`；`0` / `1` | 中文界面；默认收起面板 |

快捷键：`H` 面板，`T` 深浅色，`W` 下一张壁纸，空格暂停。工具栏按钮悬停时也会提示。

## 本地运行

不用装依赖，也没有构建步骤，起一个静态服务器就行：

```bash
git clone https://github.com/kubai087/glasswork.git
cd glasswork
python3 -m http.server 8000
```

打开 <http://localhost:8000>。控制台里有 `window.__glass`，调试时方便看状态。

文件很少：`glass.css` 是材质，`lens.js` 是折射，`adapt.js` 负责读壁纸，`wallpapers.js` 是那 6 张动态壁纸，`playground.js` 管面板和页面交互。

## 浏览器

Chrome、Edge、Arc 这类 Chromium 内核的浏览器效果最完整。Safari 和 Firefox 画不出边缘折射，会退回纯 CSS 的玻璃，着色、模糊、边缘光都还在。圆角平滑度需要 Chromium 139 以上。如果贴的链接所在的网站不允许跨域读取，背景照样能显示，只是玻璃读不到它，会改用跟随主题的墨色和偏浓的着色。

想改点什么或者发现问题，欢迎开 Issue 或 PR，规范写在 [CONTRIBUTING.md](CONTRIBUTING.md)。

## 版权

- 代码以 [MIT](LICENSE) 开源，`media/` 里由这个项目渲染出来的图片也一样。
- **macOS 壁纸不在 MIT 范围内。** `media/` 里的 `tahoe-*`、`sonoma-*`、`ventura-*`、`monterey-*`、`bigsur-*` 截自或转自 macOS 的系统壁纸，版权属于 Apple Inc.。放在这里只是为了在线演示能看到玻璃在这些壁纸上的样子，请不要拿去用，基于这份代码做东西时也请删掉它们。如果权利人要求，我会马上移除。详见 [NOTICE](NOTICE)。
- 这是个人项目，和 Apple 没有任何关系。Apple、macOS、macOS Tahoe、Liquid Glass 是 Apple Inc. 的商标，这里说的液态玻璃指的是 [Lumno](https://lumno.kubai.design) 自己的材质。
- 随机照片来自 [Lorem Picsum](https://picsum.photos)，原图出自 Unsplash，遵循 Unsplash License，左下角会显示摄影师。
- 面板用的是 [Tweakpane](https://tweakpane.github.io/docs/)，MIT 许可，从 jsDelivr 加载。
