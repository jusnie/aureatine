import { useEffect, useRef, useState } from 'react'
import { supabase } from './supabase'
import { appHref, publicUrl } from './urls'
import './authStatus.css'

export const flashKey = 'aureatine-flash'
const pendingKey = 'aureatine-pending-email'

function readStorage(key) { try { return sessionStorage.getItem(key) } catch { return null } }

export function StatusLabel({ tone, children }) {
  return <div className={`auth-status auth-status-${tone}`} role={tone === 'error' ? 'alert' : 'status'}>{children}</div>
}

// One-time green/red note shown after login or sign-up.
export function FlashBanner() {
  const [flash] = useState(() => {
    try { return JSON.parse(readStorage(flashKey) || 'null') } catch { return null }
  })
  useEffect(() => { try { sessionStorage.removeItem(flashKey) } catch { /* storage unavailable */ } }, [])
  if (!flash || typeof flash.text !== 'string') return null
  return <div className="shell"><StatusLabel tone={flash.tone === 'error' ? 'error' : 'success'}><strong>{flash.text}</strong></StatusLabel></div>
}

export function CheckEmailPage({ Link }) {
  const [email] = useState(() => readStorage(pendingKey) || '')
  const [result, setResult] = useState(null)
  const [busy, setBusy] = useState(false)
  async function resend() {
    setResult(null)
    if (!supabase) { setResult({ tone: 'error', text: 'Accounts are not connected yet. Please check back later.' }); return }
    if (!email) { setResult({ tone: 'error', text: 'Sign up again so we know where to send the link.' }); return }
    setBusy(true)
    try {
      const { error } = await supabase.auth.resend({ type: 'signup', email, options: { emailRedirectTo: publicUrl('/confirm') } })
      if (error) throw error
      setResult({ tone: 'success', text: 'A new confirmation email was requested. Check your inbox and spam folder.' })
    } catch (error) {
      setResult({ tone: 'error', text: error.message || 'We could not resend the email. Please wait a moment and try again.' })
    } finally { setBusy(false) }
  }
  return <section className="auth-status-page shell">
    <span className="section-label">One more step</span>
    <h1>Check your email to confirm your account.</h1>
    <p>{email ? <>We sent a confirmation link to <strong>{email}</strong>. Open it on this device to finish setting up your account.</> : 'We sent a confirmation link to the email you entered. Open it on this device to finish setting up your account.'}</p>
    <p>Didn’t see it? Check spam or promotions first.</p>
    {result && <StatusLabel tone={result.tone}><span>{result.text}</span></StatusLabel>}
    <div className="auth-status-actions">
      {email && <button className="button dark" type="button" onClick={resend} disabled={busy}>{busy ? 'Sending…' : 'Resend confirmation email'}</button>}
      <Link to="/login" className="button outline">Back to log in</Link>
    </div>
  </section>
}

const expiredText = 'This confirmation link has expired or was already used. Log in if your account is ready, or sign up again to get a new link.'

function friendlyError(code, description) {
  if (code === 'otp_expired') return expiredText
  if (code === 'access_denied') return 'The confirmation was cancelled or denied. Please try the link again from your email.'
  return description ? `We could not confirm your email: ${description}` : 'We could not confirm your email. Please try again.'
}

export function ConfirmEmailPage({ Link }) {
  const [status, setStatus] = useState({ state: 'checking' })
  const started = useRef(false)
  useEffect(() => {
    if (started.current) return
    started.current = true
    // Read the link details before the URL is cleaned up.
    const query = new URLSearchParams(window.location.search)
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''))
    const code = query.get('code')
    const errorCode = hash.get('error_code') || query.get('error_code')
    const errorDescription = hash.get('error_description') || query.get('error_description') || hash.get('error') || query.get('error')
    const cleanUrl = () => { try { window.history.replaceState({}, '', appHref('/confirm')) } catch { /* storage unavailable */ } }
    if (!supabase) { setStatus({ state: 'error', text: 'Accounts are not connected yet. Please check back later.' }); return }
    ;(async () => {
      try {
        if (errorCode || errorDescription) {
          await supabase.auth.getSession()
          cleanUrl()
          setStatus({ state: 'error', text: friendlyError(errorCode, errorDescription) })
          return
        }
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          if (error) throw error
        }
        const { data, error } = await supabase.auth.getSession()
        if (error) throw error
        cleanUrl()
        if (data.session) setStatus({ state: 'success' })
        else setStatus({ state: 'error', text: 'This link is missing or was already used. Log in with your email and password, or sign up again.' })
      } catch (error) {
        setStatus({ state: 'error', text: friendlyError(null, error?.message) })
      }
    })()
  }, [])
  return <section className="auth-status-page shell">
    <span className="section-label">Email confirmation</span>
    {status.state === 'checking' && <><h1>Confirming your email…</h1><p>This only takes a moment.</p></>}
    {status.state === 'success' && <><h1>Your account successfully verified.</h1><StatusLabel tone="success"><strong>You are logged in.</strong><span>Your Aureatine x APEX account is ready to use.</span></StatusLabel><div className="auth-status-actions"><Link to="/profile" className="button dark">Go to my account</Link></div></>}
    {status.state === 'error' && <><h1>Confirmation didn’t work.</h1><StatusLabel tone="error"><strong>Error</strong><span>{status.text}</span></StatusLabel><div className="auth-status-actions"><Link to="/login" className="button dark">Log in</Link><Link to="/signup" className="button outline">Sign up again</Link></div></>}
  </section>
}
