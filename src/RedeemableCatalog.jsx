import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import { basePath } from './urls'
import RewardRedemption from './RewardRedemption'
import { normalizeRedemptionCounts, redemptionCountLabel } from './redemptionCounts'
import { rewardBrands, rewardCategories, rewardItems, selectRewards } from './redeemables'
export default function RedeemableCatalog({ children, session, balance, onBalanceChange }) {
  const [counts, setCounts] = useState({})
  const [countLoading, setCountLoading] = useState(false)
  const [countRefresh, setCountRefresh] = useState(0)
  useEffect(() => {
    if (!supabase || !rewardItems.length) return
    let active = true
    setCountLoading(true)
    setCounts({})
    const ids = [...new Set(rewardItems.map(item => item.id))]
    // Small bounded batches; no per-card requests or constant polling.
    const batches = Array.from({ length: Math.ceil(ids.length / 100) }, (_, i) => ids.slice(i * 100, (i + 1) * 100))
    Promise.all(batches.map(item_ids => supabase.rpc('get_reward_redemption_counts', { item_ids })))
      .then(results => {
        if (!active) return
        if (results.some(result => result.error)) { setCounts({}); return }
        setCounts(normalizeRedemptionCounts(results.flatMap(result => result.data || [])))
      }).catch(() => { if (active) setCounts({}) })
      .finally(() => { if (active) setCountLoading(false) })
    return () => { active = false }
  }, [countRefresh])
  const [brand, setBrand] = useState('all')
  const [category, setCategory] = useState('all')
  const [sort, setSort] = useState('points-asc')
  const items = selectRewards(rewardItems, brand, sort, category)
  return <section className="redeemable-catalog" aria-labelledby="catalog-title">
    <header className="catalog-heading"><div><span className="club-kicker">FIND YOUR NEXT FAVORITE</span><h2 id="catalog-title">Explore by brand.</h2></div><p>A few names to look forward to.<br/>Items and points costs are coming soon.</p></header>
    <div className="reward-brand-options" role="group" aria-label="Filter rewards by brand">
      <button className="reward-brand-all" aria-pressed={brand === 'all'} onClick={() => setBrand('all')}><span aria-hidden="true">✳</span><strong>All brands</strong><small>The full collection</small></button>
      {rewardBrands.map((name, i) => <button key={name} className={`reward-brand-tile brand-style-${i}`} aria-label={`Filter by ${name}`} aria-pressed={brand === name} onClick={() => setBrand(name)}><span className="reward-brand-logo"><img src={`${basePath}images/brands/${name.toLowerCase()}-fit-v3.png`} alt={`${name} logo`} width="600" height="240" style={{ width: '100%', height: '100%', maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', objectPosition: 'center', transform: 'none' }}/></span><small>{brand === name ? 'Selected' : 'Browse brand'}<span aria-hidden="true">↗</span></small></button>)}
    </div>
    <p className="brand-art-note">Brand logos identify the collection filters. No brand partnership or reward availability is implied.</p>
    <div className="reward-category-options" role="group" aria-label="Filter rewards by category">{rewardCategories.map(option => <button key={option.value} aria-pressed={category === option.value} onClick={() => setCategory(option.value)}>{option.value === 'apparel' && <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m8 3-6 4 3 5 3-2v11h8V10l3 2 3-5-6-4"/><path d="M8 3a4 4 0 0 0 8 0"/></svg>}{option.value === 'accessories' && <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M5 8h14l2 13H3L5 8Z"/><path d="M8 8V6a4 4 0 0 1 8 0v2"/></svg>}{option.label}</button>)}</div>
    <div className="reward-catalog-toolbar"><div><strong>{brand === 'all' ? 'All brands' : brand}{category !== 'all' ? ` · ${rewardCategories.find(option => option.value === category).label}` : ''}</strong><p role="status">{items.length} {items.length === 1 ? 'item' : 'items'}{!items.length ? ' · awaiting confirmed product details' : ''}</p></div><label htmlFor="reward-sort">Sort by<select id="reward-sort" value={sort} onChange={e => setSort(e.target.value)}><option value="points-asc">Points: lowest to highest</option><option value="points-desc">Points: highest to lowest</option><option value="name">Item name: A–Z</option></select></label>{(brand !== 'all' || category !== 'all') && <button className="catalog-reset" onClick={() => { setBrand('all'); setCategory('all') }}>Clear filters</button>}</div>
    {rewardItems.length > 0 && <div className="redemption-count-info"><p>Counts show unique members with completed redemptions, not item quantities. Member identities stay private.</p><button type="button" disabled={!supabase || countLoading} onClick={() => setCountRefresh(n => n + 1)}>Refresh counts</button></div>}
    {items.length ? <div className="reward-product-grid">{items.map(item => <article className="reward-product-card" key={item.id}>{item.image && <img src={item.image} alt={item.imageAlt || item.name} loading="lazy"/>}<span className="club-kicker">{item.brand}</span><h3>{item.name}</h3><p>{item.description}</p><p className="reward-redeemed-count" aria-live="polite">{redemptionCountLabel(counts[item.id], countLoading)}</p><strong>{Number.isFinite(item.points) ? `${item.points.toLocaleString()} points` : 'Points to be confirmed'}</strong><RewardRedemption item={item} session={session} balance={balance} onRedeemed={newBalance => { onBalanceChange?.(newBalance); setCountRefresh(n => n + 1) }}/></article>)}</div> : <>{(brand !== 'all' || category !== 'all') && <p className="catalog-brand-empty">No {brand !== 'all' ? `${brand} ` : ''}{category === 'all' ? 'items' : category} have been added yet. Try another filter or check back when the collection is ready.</p>}{children}</>}
  </section>
}
