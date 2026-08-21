/**
 * 生成 SCSS helper 模块内容
 * 包含 token/theme/common/on-theme 等函数和 mixin
 */
export const generateScssHelper = (): string => {
    return `
  // 内部工具：拼接多个 key
  @function _join-keys($keys...) {
    $result: '';
    @each $key in $keys {
      @if $result == '' {
        $result: $key;
      } @else {
        $result: #{$result}-#{$key};
      }
    }
    @return $result;
  }
  
  // 获取主题变量：token.theme(text, primary) -> var(--text-primary)
  @function theme($keys...) {
    @return var(--#{_join-keys($keys...)});
  }
  
  // 获取公共变量：token.common(font, size, h1) -> var(--common-font-size-h1)
  @function common($keys...) {
    @return var(--common-#{_join-keys($keys...)});
  }
  
  // 特定主题选择器：@include token.on-theme(dark) { ... }
  @mixin on-theme($theme) {
    :root[data-theme="#{$theme}"] & {
      @content;
    }
  }
  `
}
