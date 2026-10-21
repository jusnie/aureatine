import { useEffect, useRef } from 'react'
import './cardLoader.css'

const BUBBLES = [
  { left: '18%', bottom: '8%', size: 9, delay: '0s', dur: '5.2s' },
  { left: '40%', bottom: '14%', size: 6, delay: '1.7s', dur: '4.6s' },
  { left: '64%', bottom: '6%', size: 11, delay: '0.9s', dur: '6s' },
  { left: '80%', bottom: '18%', size: 7, delay: '2.6s', dur: '5.4s' },
]

// Reference-style liquid loader: liquid rises and the count climbs while the card renders.
// When `ready` turns true it fills to 100, turns green with a smiley and "DONE!", then calls onComplete.
export default function CardLoader({ ready = false, onComplete, label = 'Preparing your card' }) {
  const rootRef = useRef(null), liquidRef = useRef(null), numRef = useRef(null)
  const readyRef = useRef(ready), completeRef = useRef(onComplete)
  readyRef.current = ready
  completeRef.current = onComplete

  useEffect(() => {
    let raf = 0, p = 0, from = null, t0 = 0
    const timers = []
    const root = rootRef.current
    const draw = v => {
      if (liquidRef.current) liquidRef.current.style.transform = `translateY(${100 - v}%)`
      if (numRef.current) numRef.current.textContent = String(Math.floor(v))
    }
    const loop = now => {
      if (readyRef.current) {
        if (from === null) { from = p; t0 = now }
        const t = Math.min(1, (now - t0) / 800)
        p = from + (100 - from) * (1 - Math.pow(1 - t, 3))
        draw(p)
        if (t >= 1) {
          draw(100)
          if (root) root.dataset.state = 'done'
          timers.push(setTimeout(() => root && root.classList.add('is-leaving'), 1300))
          timers.push(setTimeout(() => completeRef.current && completeRef.current(), 1700))
          return
        }
      } else {
        // Uneven steps, like a real progress readout. Never reaches 94 on its own.
        p += (94 - p) * (0.008 + Math.random() * 0.018)
        draw(p)
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(raf); timers.forEach(clearTimeout) }
  }, [])

  return (
    <div ref={rootRef} className="cl-root" data-state="loading" role="status" aria-label={label}>
      <div className="cl-stage">
        <div className="cl-halo" aria-hidden="true"/>
        <div className="cl-halo cl-halo--ok" aria-hidden="true"/>
        <div className="cl-ball" aria-hidden="true">
          <div className="cl-liquid" ref={liquidRef}>
            <svg className="cl-wave" viewBox="0 0 400 24" preserveAspectRatio="none"><path d="M0 12 Q50 0 100 12 T200 12 T300 12 T400 12 V24 H0Z"/></svg>
            <svg className="cl-wave cl-wave--back" viewBox="0 0 400 24" preserveAspectRatio="none"><path d="M0 12 Q50 24 100 12 T200 12 T300 12 T400 12 V24 H0Z"/></svg>
            {BUBBLES.map((b, i) => <i key={i} className="cl-bubble" style={{ left: b.left, bottom: b.bottom, width: b.size, height: b.size, animationDelay: b.delay, animationDuration: b.dur }}/>)}
          </div>
          <span className="cl-num"><span ref={numRef}>0</span><small>%</small></span>
          <svg className="cl-face" viewBox="0 0 100 100" aria-hidden="true">
            <path className="cl-eye" d="M30 46 Q37 36 44 46"/>
            <path className="cl-eye" d="M56 46 Q63 36 70 46"/>
            <path className="cl-mouth" d="M34 58 Q50 78 66 58 Z"/>
            <path className="cl-tongue" d="M43 67 Q50 77 57 67 Q50 72 43 67 Z"/>
          </svg>
        </div>
      </div>
      <p className="cl-label" aria-hidden="true"><span className="cl-loading">LOADING...</span><span className="cl-done">DONE!</span></p>
    </div>
  )
}
