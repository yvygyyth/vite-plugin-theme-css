import type { ThemeConfig } from './types'

/**
 * 生成 JS 运行时模块内容（虚拟模块 @scope/theme-css）
 * 直接将配置对象序列化后嵌入，通过路径访问获取原始值
 */
export function generateRuntime(config: ThemeConfig, options: { syncHtmlDark: boolean }): string {
    const { syncHtmlDark } = options

    // 将配置对象转为 JSON 字符串，然后嵌入为 JS 对象字面量
    const configJson = JSON.stringify(config, null, 2)

    return `
const config = ${configJson};

let currentTheme =
  (typeof document !== 'undefined' &&
    document.documentElement.dataset.theme) ||
  'light';

function getByPath(obj, keys) {
  return keys.reduce((acc, key) => {
    if (acc && typeof acc === 'object' && key in acc) {
      return acc[key];
    }
    return undefined;
  }, obj);
}

/**
 * 获取当前主题下的 token 值
 * theme('text', 'primary') -> 配置中 themes[currentTheme].text.primary
 */
export function theme(...keys) {
  const themeTokens = config.themes?.[currentTheme] ?? {};
  const value = getByPath(themeTokens, keys);
  return value !== undefined ? String(value) : '';
}

/**
 * 获取公共 token 值
 * common('font', 'size', 'h1') -> 配置中 common.font.size.h1
 */
export function common(...keys) {
  const value = getByPath(config.common ?? {}, keys);
  return value !== undefined ? String(value) : '';
}

/**
 * 切换主题
 * 更新 data-theme 属性，可选同步 html.dark
 */
export function setTheme(name) {
  currentTheme = name;
  if (typeof document !== 'undefined') {
    document.documentElement.dataset.theme = name;
    ${syncHtmlDark ? `document.documentElement.classList.toggle('dark', name === 'dark');` : ''}
  }
}

/**
 * 获取当前主题名
 */
export function getTheme() {
  return currentTheme;
}
`
}
