import { describe, expect, it } from 'vitest'
import { createVirtualScssImporter, VIRTUAL_SCSS_MODULE_ID } from './sass-importer'

describe('createVirtualScssImporter', () => {
    it('解析 virtual:theme-css/scss 并返回 helper 内容', () => {
        const importer = createVirtualScssImporter(() => '@mixin demo {}')
        const canonical = importer.canonicalize!(VIRTUAL_SCSS_MODULE_ID, {
            fromImport: false,
            containingUrl: null
        })

        expect(canonical).not.toBeNull()
        expect(importer.load!(canonical!)).toEqual({
            contents: '@mixin demo {}',
            syntax: 'scss'
        })
    })
})
