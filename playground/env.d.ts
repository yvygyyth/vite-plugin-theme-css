declare module 'virtual:theme-css/css' {}

declare module '@scope/theme-css' {
    export function theme(...keys: string[]): string
    export function common(...keys: string[]): string
    export function setTheme(name: string): void
    export function getTheme(): string
}
