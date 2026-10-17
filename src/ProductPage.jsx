import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import ProductSheet from './ProductSheet'
import { normalizeRedemptionCounts, redemptionCountLabel } from './redemptionCounts'
import { rewardProducts } from './redeemables'
import { appHref } from './urls'
import './shop.css'

// Opens a product on its own page (/rewards/<key>/). Uses the View Transitions API when the browser supports it.
export function openRewardProduct(product) {
  const update = () => {
    window.history.pushState({}, '', appHref(`/rewards/${encodeURIComponent(product.key)}`))
    window.dispatchEvent(new PopStateEvent('popstate'))
    window.scrollTo({ top: 0, behavior: 'instant' })
  }
  if (document.startViewTransition && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) document.startViewTransition(update)
  else update()
}

// "You may also like": other products, same category first, up to four.
function similarProducts(product) {
  const others = rewardProducts.filter(p => p.key !== product.key)
  return [...others.filter(p => p.category === product.category), ...others.filter(p => p.category !== product.category)].slice(0, 4)
}

export default function ProductPage({ productKey, session, balance, onBalanceChange, Icon, Link }) {
  const key = (() => { try { return decodeURIComponent(productKey) } catch { return productKey } })()
  const product = rewardProducts.find(p => p.key === key)
  const [counts, setCounts] = useState({})
  const [countLoading, setCountLoading] = useState(false)
  const [refresh, setRefresh] = useState(0)
  useEffect(() => {
    if (!supabase || !product) return
    let active = true
    setCountLoading(true)
    const ids = [...new Set(product.variants.map(v => v.id))]
    supabase.rpc('get_reward_redemption_counts', { item_ids: ids })
      .then(({ data, error }) => { if (active) setCounts(error ? {} : normalizeRedemptionCounts(data || [])) })
      .catch(() => { if (active) setCounts({}) })
      .finally(() => { if (active) setCountLoading(false) })
    return () => { active = false }
  }, [product?.key, refresh])
  const countLabelFor = item => redemptionCountLabel(counts[item.id], countLoading)
  if (!product) return <section className="shop-page shell">
    <p className="shop-page-missing">This item is not available right now.</p>
    <Link to="/rewards" className="button outline">Back to rewards</Link>
  </section>
  return <section className="shop-page shell" aria-label={product.name}>
    <Link to="/rewards" className="shop-back" aria-label="Back to rewards"><Icon name="arrow" size={14}/><span>Back</span></Link>
    <nav className="breadcrumb shop-page-crumb" aria-label="Breadcrumb"><Link to="/">Home</Link><Icon name="arrow" size={12}/><Link to="/rewards">Rewards</Link><Icon name="arrow" size={12}/><span>{product.name}</span></nav>
    <ProductSheet inline product={product} session={session} balance={balance} countLabelFor={countLabelFor} similar={similarProducts(product)} onOpenProduct={openRewardProduct} onRedeemed={newBalance => { onBalanceChange?.(newBalance); setRefresh(n => n + 1) }}/>
  </section>
}
