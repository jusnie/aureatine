// Tilts an element toward the pointer or finger, with a soft glare that follows it.
const prefersReducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

export function tiltMove(event) {
  if (prefersReducedMotion()) return
  const el = event.currentTarget
  const rect = el.getBoundingClientRect()
  const x = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width))
  const y = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height))
  el.style.setProperty('--ry', `${((x - 0.5) * 16).toFixed(2)}deg`)
  el.style.setProperty('--rx', `${((0.5 - y) * 12).toFixed(2)}deg`)
  el.style.setProperty('--gx', `${(x * 100).toFixed(1)}%`)
  el.style.setProperty('--gy', `${(y * 100).toFixed(1)}%`)
  el.classList.add('is-tilting')
}

export function tiltReset(event) {
  const el = event.currentTarget
  el.classList.remove('is-tilting')
  el.style.setProperty('--rx', '0deg')
  el.style.setProperty('--ry', '0deg')
}
