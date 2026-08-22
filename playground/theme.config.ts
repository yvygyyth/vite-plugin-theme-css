import { defineTheme } from '../src/defineTheme.ts'

export default defineTheme({
    themes: {
        light: {
            text: { primary: '#111', secondary: '#666' },
            bg: { page: '#f5f5f5' }
        },
        dark: {
            text: { primary: '#f5f5f5', secondary: '#aaa' },
            bg: { page: '#111' }
        }
    },
    common: {
        font: {
            size: { body: '14px', title: '24px' }
        }
    }
})
