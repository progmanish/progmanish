import { tell } from '../stores/companion'

const ua = navigator.userAgent || ''
const isMobile = /Mobi|Android|iPhone|iPad|IEMobile|Opera Mini/i.test(ua)

const STYLE = `
#sec-warn {
  position: fixed;
  left: 50%;
  bottom: 24px;
  transform: translateX(-50%) translateY(10px);
  z-index: 2147483646;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 18px;
  border-radius: 10px;
  background: rgba(200, 16, 46, 0.14);
  border: 1px solid rgba(200, 16, 46, 0.6);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.5);
  color: #ff8899;
  font-family: 'Orbitron', 'Consolas', monospace;
  font-size: 10px;
  letter-spacing: 1.5px;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.25s ease, transform 0.25s ease;
  white-space: nowrap;
}
#sec-warn.show { opacity: 1; transform: translateX(-50%) translateY(0); }
#sec-warn i { font-style: normal; color: #ff5566; font-size: 14px; }
`

let styleEl = null
let warnEl = null

function ensureEl() {
  if (styleEl) return
  styleEl = document.createElement('style')
  styleEl.textContent = STYLE
  document.head.appendChild(styleEl)
  warnEl = document.createElement('div')
  warnEl.id = 'sec-warn'
  warnEl.innerHTML = '<i>⚠</i><span>DEVTOOLS DETECTED - THIS WORLD IS NOT MEANT TO BE POKED.</span>'
  document.body.appendChild(warnEl)
}

export function installSecurity() {
  if (isMobile) {
    const css = document.createElement('style')
    css.textContent =
      'body { -webkit-user-select: none; user-select: none; } input, textarea { -webkit-user-select: text; user-select: text; }'
    document.head.appendChild(css)
    return
  }

  ensureEl()

  document.addEventListener(
    'contextmenu',
    (e) => {
      e.preventDefault()
      e.stopPropagation()
      tell('blocked_click')
    },
    true
  )

  document.addEventListener('dragstart', (e) => e.preventDefault())

  document.addEventListener(
    'keydown',
    (e) => {
      const k = (e.key || '').toUpperCase()
      const ctrl = e.ctrlKey || e.metaKey
      const shift = e.shiftKey
      if (e.key === 'F12') return block(e, 'blocked_f12')
      if (ctrl && shift && ['I', 'J', 'C', 'K', 'U'].includes(k)) return block(e, 'blocked_key')
      if (ctrl && !shift && ['U', 'S', 'P'].includes(k)) return block(e, 'blocked_key')
    },
    true
  )

  function block(e, type) {
    e.preventDefault()
    e.stopPropagation()
    tell(type)
    return true
  }

  let flagged = false
  const check = () => {
    const threshold = 180
    const diffW = window.outerWidth - window.innerWidth
    const diffH = window.outerHeight - window.innerHeight
    const open = diffW > threshold || diffH > threshold
    if (open && !flagged) {
      flagged = true
      warnEl.classList.add('show')
    } else if (!open && flagged) {
      flagged = false
      warnEl.classList.remove('show')
    }
  }
  setInterval(check, 1200)
  check()

  const css = document.createElement('style')
  css.textContent =
    'body { -webkit-user-select: none; user-select: none; } input, textarea { -webkit-user-select: text; user-select: text; }'
  document.head.appendChild(css)
}
