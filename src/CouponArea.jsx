import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from './supabase'
import { appHref, basePath } from './urls'
import { couponOffers } from './redeemables'
import CouponIcon from './CouponIcon'
import './coupons.css'

const coinSrc = `${basePath}images/aurel-coin.png`
const liveRedemptions = import.meta.env.VITE_REDEMPTIONS_ENABLED === 'true'
const messages = {
  SIGN_IN: 'Please log in to redeem a coupon.',
  NOT_ENOUGH_POINTS: 'Not enough Aurels for this coupon.',
  WEEKLY_LIMIT: 'You have used both redemptions for this coupon this week.',
  WALLET_UNAVAILABLE: 'Your Aurels balance is unavailable. Please try again later.',
  UNAVAILABLE: 'This coupon is not available right now.',
  PRICE_CHANGED: 'The Aurels cost has changed. Refresh the page before redeeming.',
  REQUEST_CONFLICT: 'This request could not be confirmed. Please contact staff.',
  INVALID_REQUEST: 'This request could not be sent. Please try again.',
}
const fmt = iso => iso ? new Intl.DateTimeFormat('en-PH', { timeZone: 'Asia/Manila', dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso)) : ''
const dayFmt = iso => new Intl.DateTimeFormat('en-PH', { timeZone: 'Asia/Manila', weekday: 'short', month: 'short', day: 'numeric' }).format(new Date(iso))

function CouponCard({ offer, usage, session, balance, busy, result, confirming, onAsk, onCancel, onRedeem, onCopy }) {
  const used = usage?.used ?? 0
  const left = Math.max(0, offer.weeklyLimit - used)
  const insufficient = Number.isFinite(balance) && balance < offer.points
  const canRedeem = liveRedemptions && Boolean(supabase) && Boolean(session) && left > 0 && !insufficient
  const label = !liveRedemptions || !supabase ? 'Coupon redemption not live yet'
    : !session ? null
    : left === 0 ? 'Weekly limit reached'
    : insufficient ? 'Not enough Aurels'
    : 'Redeem coupon'
  return <article className="coupon-card">
    <div className="coupon-media">
      <img src={`${basePath}${offer.image}`} alt={offer.imageAlt} loading="lazy" width="900" height="675"/>
      <span className="coupon-badge"><CouponIcon size={18}/><span>₱20 off</span></span>
    </div>
    <div className="coupon-body">
      <span className="coupon-brand">{offer.brand}</span>
      <h3>{offer.title}</h3>
      <p className="coupon-desc">{offer.description}</p>
      <p className="coupon-cost"><img src={coinSrc} alt="" width="22" height="22"/><strong>{offer.points} Aurels</strong></p>
      {session && <p className="coupon-weekly" aria-live="polite">{left} of {offer.weeklyLimit} left this week{usage?.resets && left < offer.weeklyLimit ? ` · resets ${dayFmt(usage.resets)}` : ''}</p>}
      {result?.ok && <output className="coupon-result">
        <p>Your coupon code</p>
        <strong className="coupon-code" aria-label={`Coupon code ${result.code.split('').join(' ')}`}>{result.code}</strong>
        <span>Show this code to {offer.approver} staff to approve it. Each code works once.</span>
        <button type="button" className="text-button" onClick={() => onCopy(result.code)}>Copy code</button>
      </output>}
      {result && !result.ok && result.message && <p className="coupon-error" role="alert">{result.message}</p>}
      {!session ? <a className="coupon-cta" href={appHref('/login')}>Log in to redeem</a>
        : confirming ? <div className="coupon-confirm">
            <p>Redeem for {offer.points} Aurels? You will get one 6-letter code.</p>
            <div className="coupon-confirm-actions">
              <button type="button" className="coupon-cta" disabled={busy} onClick={() => onRedeem(offer)}>{busy ? 'Redeeming…' : 'Confirm redemption'}</button>
              <button type="button" className="coupon-cancel" disabled={busy} onClick={onCancel}>Cancel</button>
            </div>
          </div>
        : <>
            {insufficient && <p className="coupon-short">You need {(offer.points - balance).toLocaleString()} more Aurels.</p>}
            <button type="button" className="coupon-cta" disabled={!canRedeem || busy} onClick={() => onAsk(offer.id)}>{label}</button>
          </>}
    </div>
  </article>
}

export default function CouponArea({ session, balance, onBalanceChange }) {
  const [summary, setSummary] = useState(null)
  const [busy, setBusy] = useState(null)
  const [confirming, setConfirming] = useState(null)
  const [results, setResults] = useState({})
  const [copied, setCopied] = useState(false)
  const keys = useRef({})
  const userId = session?.user?.id

  const load = useCallback(async () => {
    if (!supabase || !userId) return
    const { data, error } = await supabase.rpc('get_my_coupons')
    setSummary(!error && data?.ok ? data : null)
  }, [userId])
  useEffect(() => { load() }, [load])

  const usageFor = id => {
    const row = summary?.weekly?.find(item => item.offer_id === id)
    return row ? { used: Number(row.used) || 0, resets: summary.resets_at } : undefined
  }

  async function redeem(offer) {
    if (busy || !session || !supabase || !liveRedemptions) return
    setBusy(offer.id); setResults(prev => ({ ...prev, [offer.id]: null })); setCopied(false)
    // Keep the same request ID across uncertain network retries so a retry cannot charge twice.
    keys.current[offer.id] ||= crypto.randomUUID()
    try {
      const { data, error } = await supabase.rpc('redeem_coupon', { p_offer_id: offer.id, p_request_id: keys.current[offer.id], p_expected_points: offer.points })
      if (error) throw error
      if (data?.ok === true && data.code === 'REDEEMED' && typeof data.coupon_code === 'string') {
        // A new redemption needs a new request ID.
        keys.current[offer.id] = null
        setResults(prev => ({ ...prev, [offer.id]: { ok: true, code: data.coupon_code } }))
        setConfirming(null)
        if (Number.isSafeInteger(data.balance)) onBalanceChange?.(data.balance)
      } else {
        if (data?.ok === false) keys.current[offer.id] = null
        const weekly = data?.code === 'WEEKLY_LIMIT' && data.resets_at ? ` They reset ${dayFmt(data.resets_at)}.` : ''
        setResults(prev => ({ ...prev, [offer.id]: { ok: false, message: (messages[data?.code] || 'Redemption could not be confirmed. Please try again.') + weekly } }))
      }
      load()
    } catch {
      setResults(prev => ({ ...prev, [offer.id]: { ok: false, message: 'Could not confirm the coupon. Retry to check the same request safely.' } }))
    } finally { setBusy(null) }
  }

  async function copy(code) {
    try { await navigator.clipboard.writeText(code); setCopied(true) } catch { setCopied(false) }
  }

  const codes = summary?.codes || []
  return <section className="coupon-area" aria-labelledby="coupon-title">
    <header className="coupon-head">
      <div className="coupon-head-text">
        <span className="coupon-kicker"><CouponIcon size={16}/> COUPONS</span>
        <h2 id="coupon-title">Treat yourself after the routine.</h2>
        <p>150 Aurels per coupon. Up to 2 of each coupon per week. Show the 6-letter code to staff. Each code works once.</p>
      </div>
      {session && <a className="coupon-inbox-link" href={appHref('/inbox')}>Inbox updates</a>}
    </header>
    {!session && <p className="coupon-note">Log in to redeem coupons and see your codes.</p>}
    <div className="coupon-grid">
      {couponOffers.map(offer => <CouponCard key={offer.id} offer={offer} usage={usageFor(offer.id)} session={session} balance={balance}
        busy={busy === offer.id} result={results[offer.id]} confirming={confirming === offer.id}
        onAsk={id => { setConfirming(id); setResults(prev => ({ ...prev, [id]: null })) }} onCancel={() => setConfirming(null)}
        onRedeem={redeem} onCopy={copy}/>)}
    </div>
    {copied && <output className="coupon-note">Code copied.</output>}
    {session && <div className="coupon-codes">
      <h3>Your codes</h3>
      {codes.length === 0 ? <p className="coupon-note">No coupon codes yet.</p>
        : <ul>{codes.map(item => <li key={item.code} className={`coupon-code-row ${item.status}`}>
            <span className="coupon-code-value">{item.code}</span>
            <span className="coupon-code-title">{item.title}</span>
            <span className={`coupon-status ${item.status}`}>{item.status === 'used' ? `Approved ${fmt(item.used_at)}` : `Active · show to ${item.brand === 'apex' ? 'APEX' : 'Aureatine'} staff`}</span>
          </li>)}</ul>}
    </div>}
  </section>
}
