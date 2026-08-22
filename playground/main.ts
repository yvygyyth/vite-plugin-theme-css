import './style/demo.scss'
import { theme, setTheme, getTheme } from '@scope/theme-css'

const tokenEl = document.querySelector<HTMLElement>('#token')!

function renderToken() {
    tokenEl.textContent = `theme('text','primary') = ${theme('text', 'primary')} | getTheme() = ${getTheme()}`
}

renderToken()

document.querySelectorAll<HTMLButtonElement>('[data-theme]').forEach((btn) => {
    btn.addEventListener('click', () => {
        setTheme(btn.dataset.theme!)
        renderToken()
    })
})
