import { useEffect, useRef, useState } from 'react'
import { googleReviews } from './googleReviews'
const source = 'https://www.google.com/maps?cid=7131569850007852016'
export default function GoogleReviews() {
  const [visible, setVisible] = useState(6)
  const [changing, setChanging] = useState(false)
  const controls = useRef(null), grid = useRef(null), busy = useRef(false), animations = useRef([])
  useEffect(() => () => animations.current.forEach(animation => animation.cancel()), [])
  async function showLess() {
    if (busy.current || visible <= 6) return
    busy.current = true; setChanging(true)
    const next = Math.max(6, visible - 6)
    const noMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.hidden || document.querySelector('.motion-paused')
    if (!noMotion && grid.current) {
      animations.current = [...grid.current.children].slice(next).map((card, index) => card.animate(
        [{ opacity: 1, transform: 'translateY(0)' }, { opacity: 0, transform: 'translateY(7px)' }],
        { duration: 160, delay: index * 12, easing: 'ease-in', fill: 'forwards' }
      ))
      await Promise.allSettled(animations.current.map(animation => animation.finished))
    }
    setVisible(next); setChanging(false); busy.current = false
    requestAnimationFrame(() => {
      animations.current.forEach(animation => animation.cancel()); animations.current = []
      controls.current?.scrollIntoView({ block: 'nearest', behavior: 'instant' })
    })
  }
  return <section className="visit-reviews" aria-labelledby="visit-reviews-title">
    <div className="visit-reviews-heading"><div><span className="section-label">FROM THE APEX COMMUNITY</span><h3 id="visit-reviews-title">Good company.<br/><em>In their own words.</em></h3></div><p>{googleReviews.length} written reviews transcribed from Google Maps screenshots. About APEX Fitness Gym—not Aureatine shakes.</p></div>
    <div ref={grid} className="visit-review-grid" aria-busy={changing} id="visit-review-list">{googleReviews.slice(0, visible).map((review, index) => <figure className="visit-review-card" key={review.name} style={{ '--review-delay': `${(index % 6) * 25}ms` }}>
      <div className="visit-review-stars"><span aria-label={`${review.rating} out of 5 stars`}><span aria-hidden="true">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span></span><span>Google Maps</span></div>
      <blockquote>“{review.text}”</blockquote>
      {review.excerpt && <a className="review-excerpt-link" href={source} target="_blank" rel="noopener noreferrer">Visible excerpt · full review on Google ↗</a>}
      <figcaption><strong>{review.name}</strong></figcaption>
    </figure>)}</div>
    <div className="review-load-controls" ref={controls}><p role="status">Showing {Math.min(visible, googleReviews.length)} of {googleReviews.length} written reviews</p><div className="review-load-buttons">{visible < googleReviews.length && <button className="button outline" aria-controls="visit-review-list" disabled={changing} onClick={() => { if (!busy.current) setVisible(n => Math.min(googleReviews.length, n + 6)) }}>Show more reviews <span aria-hidden="true">+</span></button>}<button className="button outline" aria-controls="visit-review-list" disabled={visible <= 6 || changing} onClick={showLess}>Show less <span aria-hidden="true">−</span></button></div></div>
    <div className="visit-review-footer"><p>These reviews are from the latest reviews of the gym, as of October 15, 2026.</p><a className="text-button" href={source} target="_blank" rel="noopener noreferrer">Read reviews on Google Maps ↗</a></div>
  </section>
}
