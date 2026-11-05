# Liquid Glass Playground

[English](./README.md)

**在线体验：<https://www.kubai.design/liquid-glass/>**

[Lumno](https://github.com/kubai087/lumno-extension) 新标签页的液态玻璃材质，开源、可调，背景是 macOS Tahoe 的动态壁纸。《Vibe Design Tips》第 010 期拆解了这层材质；在这里可以调它的每一个参数，并复制结果。

用 http 打开 `index.html`（视频和模块无法从 `file://` 加载）：

```bash
python3 -m http.server 8000
```

## 可以调什么

| 分组 | 设置 |
| --- | --- |
| 场景 | 浅色 / 深色主题，文字墨色（自动读取壁纸，或固定深色 / 浅色），Tahoe 或自己的图片、视频，暂停 |
| 材质 | 浅色玻璃、深色玻璃各一套：染色颜色和色板、染色不透明度（0–150%）、最薄 / 最浓染色、模糊、饱和度、亮度、对比度、边缘光、内侧柔光、阴影 |
| 自适应 | 染色浓度跟随壁纸或手动、可读性底线（文字保持 4.5:1）、换色阈值，以及播放器卡片实时读到的数值 |
| 折射 | 边宽、边缘偏移（以边宽计）、衰减、色散 |
| 形状 | 圆角和平滑度（CSS `corner-shape: superellipse()`） |

预设：Lumno 默认、全透、磨砂、厚玻璃、鲜艳。任何一块玻璃都可以拖着在壁纸上移动（双击归位）。所有设置都写进 URL，链接打开就是同一块玻璃。快捷键：**H** 隐藏面板，**T** 切换主题，**空格** 暂停壁纸。手机上面板是底部抽屉，从工具栏打开。

## 材质怎么做

组件只改四个声明：

```css
.glass {
  background: rgb(255 255 255 / 0.12);                                   /* 着色 */
  backdrop-filter: blur(2px) saturate(180%) brightness(1.06) var(--glass-lens,);
  box-shadow: /* 边缘光、描边、阴影、内侧柔光 */;
  color: rgb(0 0 0 / 0.86);                                              /* 墨色，正片叠底 */
}
```

- **着色**：只有一层很薄的颜色，颜色来自身后。浓度跟随每块玻璃身后的壁纸：背景越杂、越接近文字本身的亮度，着色越浓。
- **模糊与提鲜**：只模糊 2px，再在滤镜里提饱和度，浅色提亮、深色压暗，玻璃通透鲜艳，不发奶白也不发灰。
- **边缘折射**（`lens.js`）：用 SVG 位移贴图把边缘一圈的背景往里压，像厚玻璃的边：离边缘 *d* 的点往里看 `边缘偏移 × 边宽 × (1 − d / 边宽)^衰减`。红光比蓝光多弯一点，边上出现彩边。只有 Chromium 画得出 `backdrop-filter` 里的 `url()`，其他浏览器保留纯 CSS 的玻璃。
- **墨色**：每块玻璃采样身后的壁纸（5 × 3 个点，去掉最暗和最亮各两个），亮度低于 0.5 时换成浅色文字和深色玻璃；文字只用一种墨色的两档透明度，浅色玻璃上正片叠底，深色上叠加提亮。

**复制 CSS** 会按当前设置写出材质，附带折射的 script 标签。

## 单独使用折射

```js
import { liquidGlass } from './lens.js';
const lens = liquidGlass(element, { rim: 40, edge: 1.1, power: 2.6, dispersion: 0.15 });
lens.update({ rim: 32 });
lens.destroy();
```

元素的 `backdrop-filter` 最后要接 `var(--glass-lens,)`。圆角和圆角形状从它的 CSS 读取。

## 文件

- `glass.css`：材质本身，写成变量
- `lens.js`：边缘折射，可单独使用
- `adapt.js`：壁纸采样、墨色、浓度和可读性底线
- `playground.js`、`panel.js`、`i18n.js`、`style.css`：页面

## 许可

代码以 MIT 许可开源。`media/` 里的壁纸视频截自 macOS Tahoe 的动态壁纸，版权属于 Apple，仅作演示，不在许可范围内。
