import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'
import { generateRuntime } from './runtime'
import type { ThemeConfig } from '../types'

const config: ThemeConfig = {
    themes: {
        light: { text: { primary: '#111' } },
        dark: { text: { primary: '#eee' } }
    },
    common: { font: { size: { h1: '32px' } } }
}

async function loadRuntime(syncHtmlDark = true) {
    const code = generateRuntime(config, { syncHtmlDark })
    const moduleUrl = `data:text/javascript,${encodeURIComponent(code)}`
    return import(/* @vite-ignore */ moduleUrl) as Promise<{
        theme: (...keys: string[]) => string
        common: (...keys: string[]) => string
        setTheme: (name: string) => void
        getTheme: () => string
    }>
}

describe('generateRuntime', () => {
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

    it('按路径读取当前主题与公共 token', async () => {
        const runtime = await loadRuntime()

        expect(runtime.getTheme()).toBe('light')
        expect(runtime.theme('text', 'primary')).toBe('#111')
        expect(runtime.common('font', 'size', 'h1')).toBe('32px')
        expect(runtime.theme('missing')).toBe('')
    })

    it('setTheme 更新 data-theme，并可选同步 dark class', async () => {
        const runtime = await loadRuntime(true)

        runtime.setTheme('dark')
        expect(runtime.getTheme()).toBe('dark')
        expect(document.documentElement.dataset.theme).toBe('dark')
        expect(runtime.theme('text', 'primary')).toBe('#eee')
        expect(classListToggle).toHaveBeenCalledWith('dark', true)

        runtime.setTheme('light')
        expect(classListToggle).toHaveBeenCalledWith('dark', false)
    })

    it('syncHtmlDark 为 false 时不同步 class', async () => {
        const runtime = await loadRuntime(false)

        runtime.setTheme('dark')
        expect(document.documentElement.dataset.theme).toBe('dark')
        expect(classListToggle).not.toHaveBeenCalled()
    })
})
