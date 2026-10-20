import { useEffect, useRef, useState } from 'react'
import { useDeviceKind } from './deviceKind'
import './liquidCursor.css'

// Elements that get the hover morph.
const INTERACTIVE = 'a, button, [role="button"], label, summary, select, input[type="submit"], input[type="checkbox"], input[type="radio"], .pc, .shake-feature, .card, [data-cursor="hover"]'
// Trailing droplets: the core follows fastest, each droplet lags a little more.
const LAG = [0.5, 0.3, 0.18, 0.1, 0.05]

export default function LiquidCursor() {
  const device = useDeviceKind()
  const [enabled, setEnabled] = useState(false)
  const stageRef = useRef(null)
  const blobRefs = useRef([])

  // Desktop with a fine (mouse) pointer only; reduced motion keeps the normal cursor.
  useEffect(() => {
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)')
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
    const check = () => setEnabled(device === 'desktop' && fine.matches && !reduced.matches)
    check()
    fine.addEventListener('change', check)
    reduced.addEventListener('change', check)
    return () => { fine.removeEventListener('change', check); reduced.removeEventListener('change', check) }
  }, [device])

  useEffect(() => {
    if (!enabled) return undefined
    const stage = stageRef.current
    const root = document.documentElement
    const startX = window.innerWidth / 2, startY = window.innerHeight / 2
    const blobs = blobRefs.current.map((el, i) => ({
      el, k: LAG[i], x: startX, y: startY, tx: startX, ty: startY, px: startX, py: startY, stretch: 0, angle: 0,
    }))
    let raf = 0
    root.classList.add('lc-active')

    // Liquid motion: each droplet springs toward the pointer and stretches along its velocity.
    const frame = () => {
      for (const b of blobs) {
        b.x += (b.tx - b.x) * b.k
        b.y += (b.ty - b.y) * b.k
        const vx = b.x - b.px, vy = b.y - b.py
        b.px = b.x; b.py = b.y
        const speed = Math.hypot(vx, vy)
        const targetStretch = Math.min(0.55, speed * 0.018)
        b.stretch += (targetStretch - b.stretch) * 0.25
        if (speed > 0.5) b.angle = Math.atan2(vy, vx) * 180 / Math.PI
        const sx = 1 + b.stretch, sy = 1 - b.stretch * 0.45
        b.el.style.transform =
          `translate3d(${b.x.toFixed(2)}px, ${b.y.toFixed(2)}px, 0) translate(-50%, -50%) rotate(${b.angle.toFixed(1)}deg) scale(${sx.toFixed(3)}, ${sy.toFixed(3)})`
      }
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)

    const onMove = (e) => {
      if (e.pointerType === 'touch') return
      blobs.forEach(b => { b.tx = e.clientX; b.ty = e.clientY })
      stage.classList.toggle('is-hover', !!(e.target.closest && e.target.closest(INTERACTIVE)))
    }
    const onDown = (e) => {
      if (e.pointerType === 'touch') return
      stage.classList.add('is-down')
      const r = document.createElement('div')
      r.className = 'lc-ripple'
      r.style.left = `${e.clientX}px`
      r.style.top = `${e.clientY}px`
      r.addEventListener('animationend', () => r.remove())
      stage.appendChild(r)
    }
    const onUp = () => stage.classList.remove('is-down')

    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerdown', onDown, { passive: true })
    window.addEventListener('pointerup', onUp, { passive: true })

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerup', onUp)
      root.classList.remove('lc-active')
    }
  }, [enabled])

  if (!enabled) return null

  return (
    <>
      <svg aria-hidden="true" width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <filter id="lc-goo" colorInterpolationFilters="sRGB">
            <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -8" result="goo" />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>
      <div ref={stageRef} className="lc-stage" aria-hidden="true">
        <div className="lc-blob lc-core" ref={el => { blobRefs.current[0] = el }} />
        <div className="lc-blob lc-t1" ref={el => { blobRefs.current[1] = el }} />
        <div className="lc-blob lc-t2" ref={el => { blobRefs.current[2] = el }} />
        <div className="lc-blob lc-t3" ref={el => { blobRefs.current[3] = el }} />
        <div className="lc-blob lc-t4" ref={el => { blobRefs.current[4] = el }} />
      </div>
    </>
  )
}
