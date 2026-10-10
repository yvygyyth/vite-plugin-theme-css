# vite-plugin-theme-css

Vite 插件：用一份主题配置生成 CSS 变量、SCSS helper 与 JS 运行时，支持多主题切换与热更新。

## 安装

```bash
pnpm add vite-plugin-theme-css
# 或
npm i vite-plugin-theme-css
```

需配合 Vite `>=5`，若使用 SCSS helper，请自行安装 `sass`。

## 快速开始

### 1. 创建主题配置

默认读取项目根目录的 `theme.config.ts`：

```ts
import { defineTheme } from 'vite-plugin-theme-css'

export default defineTheme({
  themes: {
    light: {
      text: {
        primary: '#111',
        secondary: '#666'
      },
      bg: {
        page: '#fff'
      }
    },
    dark: {
      text: {
        primary: '#f5f5f5',
        secondary: '#aaa'
      },
      bg: {
        page: '#111'
      }
    }
  },
  common: {
    font: {
      size: {
        h1: '32px',
        body: '14px'
      }
    }
  }
})
```

嵌套对象会扁平化为 CSS 变量：

| 配置路径 | CSS 变量 |
| --- | --- |
| `themes.light.text.primary` | `--text-primary` |
| `common.font.size.h1` | `--common-font-size-h1` |

主题变量挂在 `:root[data-theme="..."]`，公共变量挂在 `:root`。

> `defineTheme` 为类型辅助（恒等函数）。配置里调用了 `defineTheme` 但未 import 时，插件会自动注入，类似 Vite 的 `defineConfig`。

### 2. 注册插件

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import { themeCss } from 'vite-plugin-theme-css'

export default defineConfig({
  plugins: [themeCss()]
})
```

### 3. CSS 变量（自动注入）

默认会在 HTML 里自动注入主题 CSS 变量，**无需**在入口手动写：

```ts
import 'virtual:theme-css/css' // 可省略
```

若需关闭自动注入，可设置 `autoImportCss: false`，再自行在入口 import。

生成示例：

```css
:root {
  --common-font-size-h1: 32px;
  --common-font-size-body: 14px;
}

:root[data-theme="light"] {
  --text-primary: #111;
  --text-secondary: #666;
  --bg-page: #fff;
}

:root[data-theme="dark"] {
  --text-primary: #f5f5f5;
  --text-secondary: #aaa;
  --bg-page: #111;
}
```

## 用法

### CSS / 内联样式

```css
.card {
  color: var(--text-primary);
  background: var(--bg-page);
}
```

### SCSS

插件会通过 `css.preprocessorOptions.scss.additionalData` 自动注入 helper（命名空间默认 `token`），可直接使用：

```scss
.title {
  color: token.theme(text, primary); // var(--text-primary)
  font-size: token.common(font, size, h1); // var(--common-font-size-h1)
}

.banner {
  @include token.on-theme(dark) {
    opacity: 0.9;
  }
}
```

| API | 说明 |
| --- | --- |
| `token.theme($keys...)` | 主题变量 → `var(--a-b-c)` |
| `token.common($keys...)` | 公共变量 → `var(--common-a-b-c)` |
| `@include token.on-theme($name)` | 在指定主题下生效 |

也可手动导入：

```scss
@use 'virtual:theme-css/scss' as token;
```

### JS 运行时

```ts
import { theme, common, setTheme, getTheme } from '@scope/theme-css'

theme('text', 'primary') // 当前主题下的原始值，如 '#111'
common('font', 'size', 'h1') // '32px'

setTheme('dark') // 设置 html[data-theme="dark"]
getTheme() // 'dark'
```

`setTheme` 默认在主题名为 `dark` 时同步给 `<html>` 加上 `dark` class（可用 `syncHtmlDark: false` 关闭）。

TypeScript 需引入虚拟模块声明（在 `env.d.ts` / `vite-env.d.ts` 中）：

```ts
/// <reference types="vite-plugin-theme-css/client" />
```

## 插件选项

```ts
themeCss({
  /** 配置文件路径，默认 './theme.config.ts' */
  config: './theme.config.ts',

  /** SCSS 命名空间，默认 'token' */
  scssNamespace: 'token',

  /** 是否同步 html.dark class，默认 true */
  syncHtmlDark: true,

  /** 排除自动注入 SCSS helper 的文件 */
  exclude: [/node_modules/],
  // 或: (filename) => filename.includes('legacy')

  /** 是否自动在 HTML 注入 CSS 变量，默认 true */
  autoImportCss: true
})
```

## 虚拟模块

| 模块 ID | 内容 |
| --- | --- |
| `virtual:theme-css/css` | 生成的 CSS 变量 |
| `virtual:theme-css/scss` | SCSS helper（`theme` / `common` / `on-theme`） |
| `@scope/theme-css` | 运行时 API（`theme` / `common` / `setTheme` / `getTheme`） |

## 热更新

修改 `theme.config.ts` 后会重新生成上述模块并触发页面 full-reload。

## 开发

```bash
pnpm test        # 单元测试
pnpm build       # 构建 dist
```

## License

MIT
