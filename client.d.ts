/**
 * 用户侧虚拟模块的 ambient 声明。
 * 在项目 env.d.ts / vite-env.d.ts 中引用：
 *
 *   /// <reference types="vite-plugin-theme-css/client" />
 */

declare module '@scope/theme-css' {
    export function theme(...keys: string[]): string
    export function common(...keys: string[]): string
    export function setTheme(name: string): void
    export function getTheme(): string
}

declare module 'virtual:theme-css/css' {}
