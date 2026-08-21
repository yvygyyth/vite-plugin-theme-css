import { describe, expect, it } from 'vitest'
import { flattenTokens } from './flatten'

describe('flattenTokens', () => {
    it('扁平化嵌套对象', () => {
        expect(
            flattenTokens({
                text: { primary: '#111', secondary: '#666' },
                bg: { page: '#fff' }
            })
        ).toEqual({
            'text-primary': '#111',
            'text-secondary': '#666',
            'bg-page': '#fff'
        })
    })

    it('支持前缀', () => {
        expect(flattenTokens({ size: { h1: '32px' } }, 'common')).toEqual({
            'common-size-h1': '32px'
        })
    })

    it('将非对象值转为字符串', () => {
        expect(flattenTokens({ gap: 8, enabled: true })).toEqual({
            gap: '8',
            enabled: 'true'
        })
    })

    it('不展开数组', () => {
        expect(flattenTokens({ colors: ['#000', '#fff'] })).toEqual({
            colors: '#000,#fff'
        })
    })
})
