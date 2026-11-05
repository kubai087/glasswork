# Glasswork

[English](README.md) · **简体中文**

Glasswork 是 [Lumno](https://lumno.kubai.design) 新标签页所用液态玻璃材质的独立调试工具。着色、模糊、边缘折射、边缘光与文字颜色均可在面板中单独调整，调整完成后可通过「复制 CSS」导出对应代码。

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![No build step](https://img.shields.io/badge/build-none-brightgreen.svg)](#本地运行)
[![Refraction: Chromium and WebGL](https://img.shields.io/badge/refraction-Chromium%20%7C%20WebGL-4285f4.svg)](#浏览器支持)
[![Live demo](https://img.shields.io/badge/demo-live-black.svg)](https://www.kubai.design/glasswork/?lang=zh)

![沙丘壁纸上的玻璃搜索框、播放器、染色滑条和工具栏，右侧为设置面板](media/preview.jpg)

**[在线体验](https://www.kubai.design/glasswork/?lang=zh)** · [X 上的介绍](https://x.com/Kubai087/status/2117782193108082923) · [安装](#在项目中使用)

## 功能

- 浅色玻璃与深色玻璃各有一套独立参数：着色颜色与浓度、模糊、饱和度、亮度、对比度、边缘光、内侧柔光和阴影。
- 边缘折射支持调整边宽、偏移、衰减和色散；圆角支持调整平滑度，折射形状随圆角变化。
- 玻璃根据背后的壁纸自动调整：背景越复杂，着色越浓，文字对比度始终不低于 4.5:1。
- 内置多种背景：五代 macOS 抽象壁纸（Tahoe、Sonoma、Ventura、Monterey、Big Sur，深浅两版随主题切换，其中 Tahoe 与 Sonoma 为动态壁纸）、6 张使用 WebGL 绘制的动态壁纸（各有深浅两版），以及来自 Unsplash 的随机照片。
- 支持使用自定义图片或视频，可通过上传、拖入页面、粘贴文件或粘贴链接的方式添加。本地文件仅在浏览器中打开，不会上传至服务器。背景加载期间页面顶部会显示提示。
- 搜索框、播放器和染色滑条可在壁纸上拖动，双击可恢复原位。
- 提供 Lumno、全透、磨砂、厚玻璃、鲜艳五种预设。预设仅修改材质与折射参数，已调整的颜色、主题等设置会保留。
- 所有设置均保存在网址中，分享链接即可复现相同效果。

![6 张动态壁纸的浅色版与深色版](media/wallpapers.jpg)

## 实现原理

组件结构保持不变，仅替换 `background`、`backdrop-filter`、`box-shadow`、`color` 四项声明。材质由以下 6 层构成：

1. **投影**：表现卡片的体积感。
2. **模糊与提亮**：背景仅模糊 2px，同时提高饱和度与亮度，使玻璃保持通透而不泛白。深色玻璃则降低亮度，避免发灰。
3. **边缘折射**：通过 SVG 位移贴图将边缘区域的背景向内偏移，越靠近边缘偏移量越大，中间区域保持平整。红光的偏移量略大于蓝光，由此形成色散。
4. **着色**：一层半透明颜色，其透明度随背景复杂程度自动调整。
5. **边缘光**：左上与右下各一道高光，内侧另有一道较柔和的高光，用于表现厚度。
6. **文字着色**：浅色玻璃上的文字使用正片叠底，深色玻璃上使用叠加提亮，使文字带有背景的色彩，而非单一纯色。

此外，每块玻璃会读取背后壁纸的 15 个采样点并计算平均亮度。墨色设为「自动」时，若平均亮度低于 0.5，将切换为深色玻璃与浅色文字。

![波纹壁纸上的播放器卡片，边缘条纹向内折射，并带有一圈彩色边缘](media/refraction.jpg)

[Lumno](https://lumno.kubai.design) 当前使用的参数如下：

| | 着色 | 模糊 | 饱和度 | 亮度 |
| --- | --- | --- | --- | --- |
| 浅色 | 白色 6%–22% | 2px | 180% | 1.06 |
| 深色 | rgb(30 30 34) 16%–38% | 2px | 160% | 0.8 |

折射：边宽 40–44px，边缘偏移为边宽的 1.1 倍，衰减 2.6，色散 ±15%。

## 在项目中使用

### 通过 AI 编程工具安装

将以下提示词粘贴至 Claude Code、Cursor 或其他 AI 编程工具：

```text
Read https://raw.githubusercontent.com/kubai087/glasswork/main/INSTALL.md and follow it to add Glasswork's liquid glass to my project.
```

AI 将依据 [INSTALL.md](INSTALL.md) 中的步骤，使用本仓库的代码为现有组件替换材质，不改动布局，并包含针对 Safari 与 iOS 的兼容处理。

### 手动接入

在调试页面中调整参数后，点击工具栏中的 `</>`，即可获得浅色（`.glass`）与深色（`.glass.is-dark`）两套 CSS，其中的数值即为当前设置。仓库中的 `glass.css` 是同一材质的变量版本。

边缘折射需要额外引入一个无依赖的脚本：

```html
<script type="module">
  import { liquidGlass } from 'https://cdn.jsdelivr.net/gh/kubai087/glasswork@v1.1.0/lens.js';
  for (const el of document.querySelectorAll('.glass')) {
    liquidGlass(el, { rim: 40, edge: 1.1, power: 2.6, dispersion: 0.15 });
  }
</script>
```

元素的 `backdrop-filter` 末尾需加上 `var(--glass-lens,)`。脚本会将折射写入该变量，并在元素尺寸变化时自动更新。

| 选项 | 默认值 | 说明 |
| --- | --- | --- |
| `rim` | `40` | 边宽上限，单位为 px。较小的组件会自动缩减至短边的 1/3.5 |
| `edge` | `1.1` | 最外沿向内偏移的距离，以边宽为单位 |
| `power` | `2.6` | 折射从边缘向内衰减的速度 |
| `dispersion` | `0.15` | 红光相对蓝光的额外偏移量，`0` 表示不分色 |
| `radius`、`corner` | 从 CSS 读取 | 圆角半径与形状，通常无需填写 |
| `enabled` | `true` | 是否启用折射 |

函数返回 `update(options)`、`refresh()` 和 `destroy()`。如需让玻璃根据背景自动切换深浅并调整浓度，可参考 `adapt.js`。

## 网址参数

网址仅记录与当前预设不同的值，也可手动编写，例如 `?wallpaper=aurora&theme=dark&rim=56`。

| 参数 | 取值 | 说明 |
| --- | --- | --- |
| `preset` | `lumno`、`clear-glass`、`frosted`、`thick-slab`、`vivid` | 预设 |
| `theme` | `light`（默认）、`dark` | 主题 |
| `wallpaper` | `tahoe`（默认）、`sonoma`、`ventura`、`monterey`、`bigsur`、`mesh`、`dunes`、`aurora`、`lava`、`lines`、`bokeh`、`photo` | 壁纸 |
| `photo` | Picsum 照片 id | 指定随机照片 |
| `speed`、`paused` | `0`–`3`；`0` / `1` | 壁纸播放速度；是否暂停 |
| `ink` | `theme`（默认）、`auto`、`dark`、`light` | 文字墨色，`auto` 表示随壁纸自动切换 |
| `autoDensity`、`density` | `0` / `1`；`0`–`1` | 着色浓度为自动或手动 |
| `legible`、`threshold` | `0` / `1`；`0.2`–`0.8` | 是否保证可读性；自动切换的亮度阈值 |
| `lens`、`rim`、`edge`、`power`、`dispersion` | `0` / `1`；`4`–`96`；`0`–`2.5`；`1`–`6`；`0`–`0.4` | 边缘折射 |
| `radius`、`smoothing` | `0`–`60`；`0.5`–`3` | 圆角半径与平滑度 |
| `l.<key>`、`d.<key>` | | 浅色或深色玻璃的单项参数：`tint`、`opacity`、`thin`、`dense`、`blur`、`saturation`、`brightness`、`contrast`、`rimLight`、`bevel`、`shadow` |
| `lang`、`ui` | `zh`；`0` / `1` | 中文界面；默认收起面板 |

快捷键：`H` 显示或隐藏面板，`T` 切换深浅色，`W` 切换至下一张壁纸，空格键暂停。将鼠标悬停在工具栏按钮上也会显示提示。

## 本地运行

项目无需安装依赖，也没有构建步骤，使用任意静态服务器即可运行：

```bash
git clone https://github.com/kubai087/glasswork.git
cd glasswork
python3 -m http.server 8000
```

在浏览器中打开 <http://localhost:8000>。控制台中的 `window.__glass` 可用于调试时查看状态。

主要文件说明：`glass.css` 为材质样式，`lens.js` 为边缘折射，`refract.js` 为供 Safari 与 Firefox 使用的 WebGL 折射，`adapt.js` 负责读取壁纸，`wallpapers.js` 负责绘制 6 张动态壁纸，`playground.js` 负责面板与页面交互。

## 浏览器支持

Chrome、Edge、Arc 等 Chromium 内核浏览器通过 `backdrop-filter` 中的 SVG 滤镜绘制边缘折射（`lens.js`）。Safari、iOS 上的所有浏览器以及 Firefox 不支持该写法，调试页面会改用 WebGL 绘制玻璃背后的图层（`refract.js`），实现相同的边缘折射、色散、模糊与提亮效果，并在其上叠加玻璃的底色与边缘光。单独使用 `lens.js` 时，折射效果仅在 Chromium 中生效。

圆角平滑度需要 Chromium 139 及以上版本。Safari 中的玻璃使用普通圆角，原因是 iOS 27 无法正确绘制同时使用超椭圆圆角与背景模糊的元素。

若粘贴的链接来自不允许跨域读取的网站，背景仍可正常显示，但玻璃无法读取其内容，将改用跟随主题的墨色与较浓的着色。

欢迎通过 Issue 或 Pull Request 反馈问题或参与改进，相关规范见 [CONTRIBUTING.md](CONTRIBUTING.md)。

## 许可与致谢

- 代码以 [MIT](LICENSE) 许可开源，`media/` 中由本项目渲染生成的图片同样适用该许可。
- **macOS 壁纸不在 MIT 许可范围内。** `media/` 中的 `tahoe-*`、`sonoma-*`、`ventura-*`、`monterey-*`、`bigsur-*` 文件截取或转换自 macOS 系统壁纸，版权归 Apple Inc. 所有，仅用于在线演示玻璃在这些壁纸上的效果。请勿将其用于其他用途；基于本项目代码进行开发时，也请移除这些文件。如权利人提出要求，将立即删除。详见 [NOTICE](NOTICE)。
- 本项目为个人项目，与 Apple 无任何关联。Apple、macOS、macOS Tahoe、Liquid Glass 是 Apple Inc. 的商标，本文所述的液态玻璃指 [Lumno](https://lumno.kubai.design) 自有的材质。
- 随机照片来自 [Lorem Picsum](https://picsum.photos)，原图出自 Unsplash，遵循 Unsplash License，摄影师信息显示在页面左下角。
- 设置面板使用 [Tweakpane](https://tweakpane.github.io/docs/)，采用 MIT 许可，通过 jsDelivr 加载。
