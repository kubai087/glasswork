/*
 * The page in English or Simplified Chinese. Everything is written in
 * English; translate() swaps the text of the panel's labels, titles and
 * options and of the page's [data-i18n] elements, and swaps it back.
 * English unless the URL says ?lang=zh or the browser prefers Chinese.
 */

const ZH = {
  // Scene
  Scene: '场景',
  Theme: '主题',
  Light: '浅色',
  Dark: '深色',
  Ink: '文字墨色',
  Auto: '自动',
  Wallpaper: '壁纸',
  Tahoe: 'Tahoe 动态壁纸',
  'Your own': '自定义',
  'Upload wallpaper…': '上传壁纸…',
  Paused: '暂停壁纸',
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
  Amber: '琥珀',
  Lemon: '柠檬',
  Graphite: '石墨',
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

const asked = new URLSearchParams(location.search).get('lang');
export const language = {
  value: (asked ?? navigator.language ?? '').toLowerCase().startsWith('zh') ? 'zh' : 'en',
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
