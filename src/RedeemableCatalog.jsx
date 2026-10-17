import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import { basePath } from './urls'
import { openRewardProduct } from './ProductPage'
import CouponArea from './CouponArea'
import { normalizeRedemptionCounts, redemptionCountLabel } from './redemptionCounts'
import { productCostText, rewardBrands, rewardCategories, rewardItems, rewardProducts, selectRewards } from './redeemables'
import './shop.css'

const PLACEHOLDER_COUNT = 4

const brandLogo = name => `${basePath}images/brands/${name.toLowerCase()}-fit-v3.png`
// Owner-supplied item photos are relative to the site base path. Absolute URLs are used as-is.
const assetSrc = path => (/^https?:/.test(path) ? path : `${basePath}${path}`)
const coinSrc = `${basePath}images/aurel-coin.png`

function ProductCard({ product, countLabelFor, onOpen, index = 0 }) {
  const single = product.variants.length === 1 ? product.variants[0] : null
  return <article className="shop-card" style={{ '--i': index }}>
    <button type="button" className="shop-card-media" onClick={() => onOpen(product)} aria-label={`View ${product.name}`}>
      {product.image ? <img src={assetSrc(product.image)} alt="" loading="lazy"/> : product.brand && <span className="shop-card-logo"><img src={brandLogo(product.brand)} alt=""/></span>}
      <span className="shop-brand-tag">{product.brand || 'Aureatine'}</span>
    </button>
    <div className="shop-card-body">
      <h3 className="shop-card-name"><button type="button" onClick={() => onOpen(product)}>{product.name}</button></h3>
      {single?.label && <p className="shop-card-color">{product.variantLabel}: <strong>{single.label}</strong></p>}
      {!single && <p className="shop-card-colors">{product.variants.map(v => v.swatch && <span key={v.id} className="shop-swatch-dot" style={{ background: v.swatch }} title={v.label} aria-hidden="true"/>)}<span>{product.variants.length} {product.variantLabel === 'Design' ? 'designs' : 'colors'}</span></p>}
      <p className="shop-card-cost"><img src={coinSrc} alt="" width="22" height="22"/><strong>{productCostText(product)}</strong></p>
      {single && <p className="reward-redeemed-count" aria-live="polite">{countLabelFor(single)}</p>}
      <button type="button" className="shop-card-cta" onClick={() => onOpen(product)}>{product.available ? 'Exchange' : 'View details'}</button>
    </div>
  </article>
}

function PlaceholderCards() {
  return <div className="shop-grid shop-grid-placeholder" aria-hidden="true">
    {Array.from({ length: PLACEHOLDER_COUNT }, (_, i) => <div key={i} className="shop-card shop-card-placeholder">
      <div className="shop-card-media"><span className="shop-soon">Coming soon</span></div>
      <div className="shop-card-body"><span className="shop-skel"/><span className="shop-skel short"/></div>
    </div>)}
  </div>
}

export default function RedeemableCatalog({ children, session, balance, onBalanceChange }) {
  const [counts, setCounts] = useState({})
  const [countLoading, setCountLoading] = useState(false)
  const [countRefresh, setCountRefresh] = useState(0)
  const [brand, setBrand] = useState('all')
  const [category, setCategory] = useState('all')
  const [sort, setSort] = useState('points-asc')
  // Filters start open on laptops and collapsed on phones so products appear first.
  const [filtersOpen, setFiltersOpen] = useState(() => typeof window !== 'undefined' && window.matchMedia('(min-width: 960px)').matches)
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
  const items = selectRewards(rewardProducts, brand, sort, category)
  const filtersActive = brand !== 'all' || category !== 'all'
  const countFor = value => (value === 'all' ? rewardProducts : rewardProducts.filter(item => item.category === value)).length
  const countLabelFor = item => redemptionCountLabel(counts[item.id], countLoading)
  function clearFilters() { setBrand('all'); setCategory('all') }
  return <section className="redeemable-catalog shop-catalog" aria-labelledby="catalog-title">
    <CouponArea session={session} balance={balance} onBalanceChange={onBalanceChange}/>
    <header className="shop-topbar">
      <div><span className="club-kicker">REDEEM YOUR AURELS</span><h2 id="catalog-title">Shop redeemables</h2></div>
      <div className="shop-balance" aria-label="Your Aurels balance">
        <img src={coinSrc} alt="" width="34" height="34"/>
        <strong>{session && Number.isFinite(balance) ? balance.toLocaleString() : '—'}</strong>
        <span>Aurels</span>
      </div>
    </header>
    <div className="shop-layout">
      <details className="shop-filters" open={filtersOpen} onToggle={e => setFiltersOpen(e.currentTarget.open)}>
        <summary>Filters{filtersActive ? ' · on' : ''}</summary>
        <fieldset className="shop-filter-group">
          <legend>Brand</legend>
          <button type="button" className="shop-filter-option" aria-pressed={brand === 'all'} onClick={() => setBrand('all')}><span>All brands</span></button>
          {rewardBrands.map(name => <button key={name} type="button" className="shop-filter-option" aria-pressed={brand === name} onClick={() => setBrand(name)}><img src={brandLogo(name)} alt=""/><span>{name}</span></button>)}
        </fieldset>
        <fieldset className="shop-filter-group">
          <legend>Category</legend>
          {rewardCategories.map(option => <button key={option.value} type="button" className="shop-filter-option" aria-pressed={category === option.value} onClick={() => setCategory(option.value)}><span>{option.label}</span><small>{countFor(option.value)}</small></button>)}
        </fieldset>
        {filtersActive && <button type="button" className="catalog-reset" onClick={clearFilters}>Clear filters</button>}
        <p className="brand-art-note">Brand logos identify the collection filters. No brand partnership or reward availability is implied.</p>
      </details>
      <div className="shop-main">
        <div className="shop-toolbar">
          <output className="shop-count"><strong>{brand === 'all' ? 'All brands' : brand}{category !== 'all' ? ` · ${rewardCategories.find(option => option.value === category).label}` : ''}</strong> · {items.length} {items.length === 1 ? 'item' : 'items'}{!items.length && !rewardItems.length ? ' · awaiting confirmed product details' : ''}</output>
          <label className="shop-sort"><span>Sort by</span><select id="reward-sort" value={sort} onChange={e => setSort(e.target.value)}><option value="points-asc">Aurels: lowest to highest</option><option value="points-desc">Aurels: highest to lowest</option><option value="name">Item name: A–Z</option></select></label>
        </div>
        {rewardItems.length > 0 && <div className="redemption-count-info"><p>Counts show unique members with completed redemptions, not item quantities. Member identities stay private.</p><button type="button" disabled={!supabase || countLoading} onClick={() => setCountRefresh(n => n + 1)}>Refresh counts</button></div>}
        {items.length
          ? <div className="shop-grid">{items.map((product, index) => <ProductCard key={product.key} product={product} countLabelFor={countLabelFor} onOpen={openRewardProduct} index={index}/>)}</div>
          : <>{rewardItems.length === 0 && <PlaceholderCards/>}{filtersActive && <p className="catalog-brand-empty">No {brand !== 'all' ? `${brand} ` : ''}{category === 'all' ? 'items' : category} have been added yet. Try another filter or check back when the collection is ready.</p>}{children}</>}
      </div>
    </div>
  </section>
}
