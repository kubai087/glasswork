/*
 * The page in English or Simplified Chinese. Everything is written in
 * English; translate() swaps the text of the panel's labels, titles and
 * options and of the page's [data-i18n] elements, and swaps it back.
 * English unless the URL says ?lang=zh (the panel's switch puts it there).
 */

const ZH = {
  // Scene
  Scene: '场景',
  Theme: '主题',
  Light: '浅色',
  Dark: '深色',
  Ink: '文字墨色',
  Auto: '自动',
  'Follow theme': '跟随主题',
  'Auto (wallpaper)': '自动（读取壁纸）',
  'Light / dark': '浅色 / 深色',
  'Next wallpaper': '下一张壁纸',
  'Pause wallpaper': '暂停壁纸',
  'Play wallpaper': '播放壁纸',
  'Source on GitHub': 'GitHub 源码',
  Space: '空格',
  Clouds: '云',
  Waterfall: '瀑布',
  Coast: '海岸',
  Ocean: '海浪',
  'Random photo': '随机照片',
  'Another photo': '换一张照片',
  'Upload image or video…': '上传图片或视频…',
  Link: '链接',
  Photo: '照片',
  'Loading video…': '正在加载视频…',
  'Tap anywhere to play the wallpaper': '点一下屏幕开始播放壁纸',
  'Loading image…': '正在加载图片…',
  "Couldn't load this wallpaper": '这张壁纸加载失败',
  "This browser can't play this video": '这个浏览器播放不了这个视频',
  'Drop an image or video to use it': '松手即可换成壁纸',
  'Use an image or a video': '请用图片或视频',
  'That is not a link': '这不是一个链接',
  'macOS Tahoe wallpaper © Apple Inc.': 'macOS Tahoe 壁纸 © Apple Inc.',
  'Refraction: on': '折射：开',
  'Refraction: off': '折射：关',
  Wallpaper: '壁纸',
  Tahoe: 'Tahoe 动态壁纸',
  'Your own': '自定义',
  'Upload wallpaper…': '上传壁纸…',
  Paused: '暂停壁纸',
  Speed: '速度',
  Mesh: '流光渐变',
  Dunes: '沙丘',
  Aurora: '极光',
  Lava: '熔岩',
  Rings: '波纹',
  Bokeh: '光斑',
  // Material
  Material: '材质',
  'Light glass': '浅色玻璃',
  'Dark glass': '深色玻璃',
  Tint: '染色',
  Swatch: '色板',
  Opacity: '不透明度',
  Thin: '最薄',
  Dense: '最浓',
  Blur: '模糊',
  Saturation: '饱和度',
  Brightness: '亮度',
  Contrast: '对比度',
  'Rim light': '边缘光',
  Bevel: '内侧柔光',
  Shadow: '阴影',
  Clear: '清透',
  Warm: '暖白',
  Sky: '天蓝',
  Rose: '玫瑰',
  Mint: '薄荷',
  Lilac: '丁香',
  Sand: '沙色',
  Lime: '青柠',
  Slate: '石墨',
  Night: '夜蓝',
  Plum: '梅紫',
  Forest: '森绿',
  Ocean: '深海',
  Wine: '酒红',
  Cocoa: '可可',
  Black: '纯黑',
  // Adapt
  Adapt: '自适应',
  Density: '浓度',
  'Keep legible': '保证可读',
  Threshold: '换色阈值',
  Luminance: '背景亮度',
  'Auto density': '自动浓度',
  Floor: '最低染色',
  // Refraction
  Refraction: '折射',
  On: '开启',
  'Rim width': '边宽',
  Edge: '边缘偏移',
  Falloff: '衰减',
  Dispersion: '色散',
  Support: '支持',
  'Chromium only': '仅 Chromium',
  Drawn: '已绘制',
  // Shape
  Shape: '形状',
  Radius: '圆角',
  Smoothing: '平滑度',
  // Presets and the rest
  Presets: '预设',
  Preset: '预设',
  Lumno: 'Lumno 默认',
  'Clear glass': '全透',
  Frosted: '磨砂',
  'Thick slab': '厚玻璃',
  Vivid: '鲜艳',
  'Copy CSS': '复制 CSS',
  'Copy link': '复制链接',
  'Link copied': '链接已复制',
  Copy: '复制',
  Copied: '已复制',
  Close: '关闭',
  Reset: '重置',
  Language: '语言',
  Settings: '设置',
  'Search or enter address': '搜索或输入网址',
  'The material at the settings you see now. The lens needs lens.js, from this repository.': '当前设置下的材质。边缘折射需要本仓库的 lens.js。',
};

export const language = {
  value: new URLSearchParams(location.search).get('lang')?.toLowerCase().startsWith('zh') ? 'zh' : 'en',
};

export const t = (text) => (language.value === 'zh' && ZH[text]) || text;

const english = new WeakMap();

function swap(node, get, set) {
  const en = english.get(node) ?? get();
  if (!ZH[en]) return;
  english.set(node, en);
  set(t(en));
}

export function translate(root = document.body) {
  document.documentElement.lang = language.value === 'zh' ? 'zh-Hans' : 'en';
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    swap(node, () => node.nodeValue, (v) => { node.nodeValue = v; });
  }
  for (const input of root.querySelectorAll('[data-i18n-placeholder]')) {
    swap(input, () => input.placeholder, (v) => { input.placeholder = v; });
  }
}
