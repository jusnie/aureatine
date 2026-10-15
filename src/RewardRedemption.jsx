import { useRef, useState } from 'react'
import { supabase } from './supabase'
import { getRewardSizes } from './redeemables'
import RewardSizePicker from './RewardSizePicker'
const messages = {
  NOT_ENOUGH_POINTS: 'Not enough Aurels.', SIGN_IN: 'Please log in to redeem this item.',
  WALLET_UNAVAILABLE: 'Your Aurels balance is unavailable. Please try again later.',
  UNAVAILABLE: 'This item is not available for redemption.', PRICE_CHANGED: 'The Aurels cost has changed. Refresh the page before redeeming.',
  INVALID_SIZE: 'This size is not available. Please choose another size.', OUT_OF_STOCK: 'This size or item is out of stock.',
  REQUEST_CONFLICT: 'This request could not be confirmed. Please contact staff.', CLAIM_CHANGED: 'This claim has changed. Please contact staff.'
}
export default function RewardRedemption({ item, session, balance, onRedeemed }) {
  const [size, setSize] = useState(''), [busy, setBusy] = useState(false)
  const [result, setResult] = useState(null), [confirm, setConfirm] = useState(false)
  const requestKey = useRef(null), inFlight = useRef(false)
  const sizes = getRewardSizes(item)
  const enabled = import.meta.env.VITE_REDEMPTIONS_ENABLED === 'true' && Boolean(supabase) && item.available === true
  const costKnown = Number.isSafeInteger(item.points) && item.points > 0
  const insufficient = costKnown && Number.isFinite(balance) && balance < item.points
  const success = result?.ok === true
  async function redeem() {
    if (inFlight.current || !enabled || !session || !costKnown || success) return
    inFlight.current = true; setBusy(true); setResult(null)
    // Retain the same key across uncertain network retries to avoid double debit.
    requestKey.current ||= crypto.randomUUID()
    try {
      const { data, error } = await supabase.rpc('redeem_reward', { p_item_id: item.id, p_size: size, p_request_id: requestKey.current, p_expected_points: item.points })
      if (error) throw error
      if (data?.ok === true && data.code === 'REDEEMED' && typeof data.redemption_id === 'string' && Number.isSafeInteger(data.balance) && data.balance >= 0) {
        setResult(data); setConfirm(false); onRedeemed?.(data.balance)
      } else {
        if (data?.ok === false) requestKey.current = null
        setResult({ ok: false, message: messages[data?.code] || 'Redemption could not be confirmed. Please try again.' })
      }
    } catch { setResult({ ok: false, message: 'Could not confirm redemption. Retry with this same item and size to safely check the request.' }) }
    finally { inFlight.current = false; setBusy(false) }
  }
  return <div className="reward-redemption"><RewardSizePicker item={item} selected={size} onSelect={value => { setSize(value); setResult(null); setConfirm(false) }} disabled={busy || success || Boolean(requestKey.current)}/>
    {success ? <output className="redemption-success"><strong>Successfully redeemed!</strong><span>Your Aurels were deducted and your item is reserved—not yet collected.</span><small>Claim reference: {result.redemption_id}</small></output> : <>
      <button className="button dark" disabled={busy || !enabled || !costKnown || insufficient || !session || (sizes.length > 0 && !size)} onClick={() => setConfirm(true)}>{busy ? 'Redeeming…' : !enabled ? 'Redemption not live yet' : !session ? 'Log in to redeem' : insufficient ? 'Not enough points' : !costKnown ? 'Points to be confirmed' : sizes.length > 0 && !size ? 'Choose a size' : 'Redeem item'}</button>
      {insufficient && <p className="redemption-warning">Not enough Aurels. You need {(item.points - balance).toLocaleString()} more Aurels.</p>}
      {confirm && <div className="redemption-confirm"><p>Redeem {item.name}{size ? ` · size ${size}` : ''} for {item.points.toLocaleString()} points?</p><button className="button dark" disabled={busy} onClick={redeem}>{busy ? 'Confirming…' : 'Confirm redemption'}</button><button className="text-button" disabled={busy} onClick={() => setConfirm(false)}>Cancel</button></div>}
      {result?.message && <output className="redemption-warning" role="alert">{result.message}</output>}
    </>}
  </div>
}
