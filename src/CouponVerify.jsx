import { useState } from 'react'
import { supabase } from './supabase'
import CouponIcon from './CouponIcon'
import './coupons.css'

const lookupErrors = {
  SIGN_IN: 'Please log in again to check coupons.',
  INVALID_CODE: 'No coupon matches this code. Check the 6 letters and try again.',
  STAFF_ONLY: 'This coupon belongs to the other team. Only the matching staff can approve it.',
}
const approveErrors = {
  SIGN_IN: 'Please log in again to approve coupons.',
  INVALID_CODE: 'No coupon matches this code.',
  STAFF_ONLY: 'This coupon belongs to the other team. Only the matching staff can approve it.',
  ALREADY_USED: 'This coupon was already approved.',
}
const fmt = iso => iso ? new Intl.DateTimeFormat('en-PH', { timeZone: 'Asia/Manila', dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso)) : ''
const teamName = brand => (brand === 'apex' ? 'APEX' : 'Aureatine')

// Staff check for coupon codes. The database decides who may verify each brand.
export default function CouponVerify() {
  const [code, setCode] = useState(''), [check, setCheck] = useState(null), [busy, setBusy] = useState(false)
  const [message, setMessage] = useState(null)
  async function lookup(event) {
    event.preventDefault()
    if (busy) return
    const clean = code.trim().toUpperCase()
    if (!/^[A-HJ-NP-Z]{6}$/.test(clean)) { setCheck(null); setMessage({ tone: 'bad', text: 'Enter the 6-letter coupon code.' }); return }
    setBusy(true); setMessage(null)
    try {
      const { data, error } = await supabase.rpc('staff_lookup_coupon', { p_code: clean })
      if (error || !data?.ok) { setCheck(null); setMessage({ tone: 'bad', text: lookupErrors[data?.code] || 'Could not check this code. Try again.' }); return }
      setCheck(data)
    } catch { setCheck(null); setMessage({ tone: 'bad', text: 'Could not check this code. Try again.' }) }
    finally { setBusy(false) }
  }
  async function approve() {
    if (busy || !check || check.status !== 'active') return
    setBusy(true)
    try {
      const { data, error } = await supabase.rpc('staff_use_coupon', { p_code: check.code })
      if (!error && data?.ok) {
        setCheck({ ...check, status: 'used', used_at: data.used_at })
        setMessage({ tone: 'ok', text: `Approved. ${data.title} is now used.` })
      } else {
        const text = approveErrors[data?.code] || 'Could not approve this coupon. Check the code again before retrying.'
        if (data?.code === 'ALREADY_USED') setCheck({ ...check, status: 'used', used_at: data.used_at })
        setMessage({ tone: 'bad', text })
      }
    } catch { setMessage({ tone: 'bad', text: 'Could not confirm the approval. Check this code again before retrying.' }) }
    finally { setBusy(false) }
  }
  return <section className="coupon-verify" aria-labelledby="coupon-verify-title">
    <span className="coupon-kicker"><CouponIcon size={16}/> COUPON CHECK</span>
    <h2 id="coupon-verify-title">Approve a coupon code</h2>
    <p>Ask the member for their 6-letter code. Gym coupons are approved by APEX staff. Shake coupons are approved by Aureatine staff.</p>
    <form className="coupon-verify-form" onSubmit={lookup}>
      <label>Coupon code<input value={code} maxLength={6} autoComplete="off" autoCapitalize="characters" spellCheck="false" placeholder="ABCDEF" onChange={e => { setCode(e.target.value.toUpperCase()); setCheck(null); setMessage(null) }}/></label>
      <button type="submit" disabled={busy}>{busy ? 'Checking…' : 'Check code'}</button>
    </form>
    {check && <output className="coupon-check">
      <span className="coupon-brand">{teamName(check.brand)} staff</span>
      <strong>{check.title}</strong>
      <span>Member: {check.member_name || 'Member'}</span>
      <span>Issued {fmt(check.created_at)}</span>
      <span className={`coupon-status ${check.status}`}>{check.status === 'used' ? `Approved ${fmt(check.used_at)}` : 'Active. Not approved yet.'}</span>
      {check.status === 'active' && <button type="button" className="coupon-approve" disabled={busy} onClick={approve}>{busy ? 'Approving…' : 'Approve coupon'}</button>}
    </output>}
    {message && <output className={`coupon-msg ${message.tone}`} aria-live={message.tone === 'bad' ? 'assertive' : 'polite'}>{message.text}</output>}
  </section>
}
