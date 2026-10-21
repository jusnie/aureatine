import { useEffect, useRef, useState } from 'react'
import './cardLoader.css'

// Liquid-fill loader for the member card. Fills slowly while the card renders (never claims 100% early).
// When `ready` turns true it fills to the top, shows a check, then calls onComplete so the card can sync in.
export default function CardLoader({ ready = false, onComplete, label = 'Preparing your card' }) {
  const rootRef = useRef(null), liquidRef = useRef(null), numRef = useRef(null)
  const readyRef = useRef(ready), completeRef = useRef(onComplete)
  const [done, setDone] = useState(false)
  readyRef.current = ready
  completeRef.current = onComplete

  useEffect(() => {
    let raf = 0, timer = 0, p = 0, finished = false, fromValue = null, finishStart = 0
    const draw = v => {
      if (liquidRef.current) liquidRef.current.style.transform = `translateY(${100 - v}%)`
      if (numRef.current) numRef.current.textContent = String(Math.round(v))
    }
    const loop = now => {
      if (readyRef.current) {
        if (fromValue === null) { fromValue = p; finishStart = now }
        const t = Math.min(1, (now - finishStart) / 650)
        p = fromValue + (100 - fromValue) * (1 - Math.pow(1 - t, 3))
        if (t >= 1 && !finished) {
          finished = true
          draw(100)
          setDone(true)
          timer = window.setTimeout(() => completeRef.current && completeRef.current(), 1150)
          return
        }
      } else {
        p += (92 - p) * 0.018
      }
      draw(p)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(raf); window.clearTimeout(timer) }
  }, [])

  return (
    <div ref={rootRef} className={`card-loader${done ? ' is-done' : ''}`} role="status" aria-label={label}>
      <div className="card-loader-orb" aria-hidden="true">
        <div className="card-loader-liquid" ref={liquidRef}>
          <svg className="card-loader-wave" viewBox="0 0 400 28" preserveAspectRatio="none"><path d="M0 14 Q50 0 100 14 T200 14 T300 14 T400 14 V28 H0Z"/></svg>
          <svg className="card-loader-wave card-loader-wave--back" viewBox="0 0 400 28" preserveAspectRatio="none"><path d="M0 14 Q50 28 100 14 T200 14 T300 14 T400 14 V28 H0Z"/></svg>
        </div>
        <span className="card-loader-num"><span ref={numRef}>0</span><small>%</small></span>
        <svg className="card-loader-check" viewBox="0 0 24 24"><path d="M5 12.6l4.4 4.4L19 7.6"/></svg>
      </div>
      <p className="card-loader-label" aria-hidden="true">{label}<span className="card-loader-dots"><i>.</i><i>.</i><i>.</i></span></p>
    </div>
  )
}
