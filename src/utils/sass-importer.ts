import type { Importer } from 'sass'
import { VIRTUAL_SCSS_ID } from '../constants'

const canonicalUrl = new URL(`${VIRTUAL_SCSS_ID}.scss`)

/** 让 Sass 能解析 additionalData 里的 virtual:theme-css/scss */
export function createVirtualScssImporter(getContent: () => string): Importer<'sync'> {
    return {
        canonicalize(url) {
            if (url === VIRTUAL_SCSS_ID) return canonicalUrl
            return null
        },
        load(canonical) {
            if (canonical.href === canonicalUrl.href) {
                return { contents: getContent(), syntax: 'scss' }
            }
            return null
        }
    }
}
