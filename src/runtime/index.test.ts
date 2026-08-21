import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'
import { createThemeRuntime } from './index'
import type { ThemeConfig } from '../types'

const config: ThemeConfig = {
    themes: {
        light: { text: { primary: '#111' } },
        dark: { text: { primary: '#eee' } }
    },
    common: { font: { size: { h1: '32px' } } }
}

describe('createThemeRuntime', () => {
    let classListToggle: ReturnType<typeof vi.fn>

    beforeEach(() => {
        classListToggle = vi.fn()
        vi.stubGlobal('document', {
            documentElement: {
                dataset: { theme: 'light' },
                classList: { toggle: classListToggle }
            }
        })
    })

    afterEach(() => {
        vi.unstubAllGlobals()
    })

    it('按路径读取当前主题与公共 token', () => {
        const runtime = createThemeRuntime(config)

        expect(runtime.getTheme()).toBe('light')
        expect(runtime.theme('text', 'primary')).toBe('#111')
        expect(runtime.common('font', 'size', 'h1')).toBe('32px')
        expect(runtime.theme('missing')).toBe('')
    })

    it('setTheme 更新 data-theme，并可选同步 dark class', () => {
        const runtime = createThemeRuntime(config, { syncHtmlDark: true })

        runtime.setTheme('dark')
        expect(runtime.getTheme()).toBe('dark')
        expect(document.documentElement.dataset.theme).toBe('dark')
        expect(runtime.theme('text', 'primary')).toBe('#eee')
        expect(classListToggle).toHaveBeenCalledWith('dark', true)

        runtime.setTheme('light')
        expect(classListToggle).toHaveBeenCalledWith('dark', false)
    })

    it('syncHtmlDark 为 false 时不同步 class', () => {
        const runtime = createThemeRuntime(config, { syncHtmlDark: false })

        runtime.setTheme('dark')
        expect(document.documentElement.dataset.theme).toBe('dark')
        expect(classListToggle).not.toHaveBeenCalled()
    })
})
