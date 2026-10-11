import { useState } from 'react'
import { googleReviews } from './googleReviews'
const source = 'https://www.google.com/maps?cid=7131569850007852016'
export default function GoogleReviews() {
  const [visible, setVisible] = useState(6)
  return <section className="visit-reviews" aria-labelledby="visit-reviews-title">
    <div className="visit-reviews-heading"><div><span className="section-label">FROM THE APEX COMMUNITY</span><h3 id="visit-reviews-title">Good company.<br/><em>In their own words.</em></h3></div><p>{googleReviews.length} written reviews transcribed from Google Maps screenshots. About APEX Fitness Gym—not Aureatine shakes.</p></div>
    <div className="visit-review-grid" id="visit-review-list">{googleReviews.slice(0, visible).map(review => <figure className="visit-review-card" key={review.name}>
      <div className="visit-review-stars"><span aria-label={`${review.rating} out of 5 stars`}><span aria-hidden="true">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span></span><span>Google Maps</span></div>
      <blockquote>“{review.text}”</blockquote>
      {review.excerpt && <a className="review-excerpt-link" href={source} target="_blank" rel="noopener noreferrer">Visible excerpt · full review on Google ↗</a>}
      <figcaption><strong>{review.name}</strong></figcaption>
    </figure>)}</div>
    <div className="review-load-controls"><p role="status">Showing {Math.min(visible, googleReviews.length)} of {googleReviews.length} written reviews</p>{visible < googleReviews.length && <button className="button outline" aria-controls="visit-review-list" onClick={() => setVisible(n => n + 6)}>Show more reviews <span aria-hidden="true">+</span></button>}</div>
    <div className="visit-review-footer"><p>Original wording and ratings retained, including 4-star reviews. Duplicates and entries without a written comment omitted. Cut-off comments are labeled as excerpts. Screenshots supplied October 12, 2026—not a live feed or the complete Google listing. Reviewer statements are not verified business details.</p><a className="text-button" href={source} target="_blank" rel="noopener noreferrer">Read reviews on Google Maps ↗</a></div>
  </section>
}
