import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import { rewardItems } from './redeemables'
import { basePath } from './urls'
import './orders.css'

const STEPS = ['Placed', 'Ready', 'Collected']

// Turns a redemption row into one readable state, its step, and its tone.
export function orderState(order) {
  if (order.status === 'cancelled') return { label: 'Cancelled', step: -1, tone: 'muted' }
  if (order.status === 'refunded') return { label: 'Refunded', step: -1, tone: 'muted' }
  if (order.collected_at) return { label: 'Collected', step: 2, tone: 'done' }
  if (order.status === 'completed') return { label: 'Ready to collect', step: 1, tone: 'ready' }
  return { label: 'Waiting for confirmation', step: 0, tone: 'pending' }
}

const formatDate = value => value ? new Date(value).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : ''
const assetSrc = path => (/^https?:/.test(path) ? path : `${basePath}${path}`)

function Progress({ step }) {
  return <ol className="order-progress" aria-label={step < 0 ? 'Order closed' : `Step ${step + 1} of ${STEPS.length}`}>
    {STEPS.map((label, i) => <li key={label} className={step < 0 ? '' : i <= step ? 'is-done' : ''}>
      <span aria-hidden="true"/>{label}
    </li>)}
  </ol>
}

export default function MyOrdersPage({ session, Link }) {
  const [orders, setOrders] = useState(null)
  const [error, setError] = useState(false)
  useEffect(() => {
    if (!supabase || !session) return
    let active = true
    supabase.rpc('get_my_reward_orders').then(({ data, error: rpcError }) => {
      if (!active) return
      if (rpcError) { setError(true); setOrders([]); return }
      setOrders(data || [])
    })
    return () => { active = false }
  }, [session])

  if (!session) return <section className="orders-page shell">
    <h1>Your orders</h1>
    <p className="orders-note">Log in to see the status of the items you redeemed.</p>
    <Link to="/login" className="button dark">Log in</Link>
  </section>

  return <section className="orders-page shell" aria-labelledby="orders-title">
    <header className="orders-head">
      <span className="orders-kicker">Redemptions</span>
      <h1 id="orders-title">Your orders</h1>
    </header>
    {orders === null && <p className="orders-note">Loading your orders…</p>}
    {error && <p className="orders-note" role="alert">Your orders could not be loaded. Try again in a moment.</p>}
    {orders && !error && orders.length === 0 && <div className="orders-empty">
      <svg aria-hidden="true" viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/></svg>
      <p>No orders yet. Items you redeem will appear here.</p>
      <Link to="/rewards" className="button outline">Browse rewards</Link>
    </div>}
    {orders && orders.length > 0 && <ul className="orders-list">
      {orders.map(order => {
        const item = rewardItems.find(i => i.id === order.item_id)
        const state = orderState(order)
        return <li key={order.id} className={`order-card order-${state.tone}`}>
          <div className="order-media">{item?.image ? <img src={assetSrc(item.image)} alt="" loading="lazy"/> : <span aria-hidden="true"/>}</div>
          <div className="order-body">
            <div className="order-title">
              <h2>{item?.name || 'Redeemed item'}</h2>
              <span className={`order-status order-status-${state.tone}`}>{state.label}</span>
            </div>
            <p className="order-meta">
              {[item?.color, order.selected_size && `Size ${order.selected_size}`].filter(Boolean).join(' · ') || 'Standard'}
              {order.points_spent ? ` · ${order.points_spent.toLocaleString()} Aurels` : ''}
            </p>
            <p className="order-meta">Placed {formatDate(order.created_at)}{order.collected_at ? ` · Collected ${formatDate(order.collected_at)}` : ''}</p>
            <Progress step={state.step}/>
          </div>
        </li>
      })}
    </ul>}
  </section>
}
