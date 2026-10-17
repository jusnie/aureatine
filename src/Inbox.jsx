import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import { appHref } from './urls'
import CouponIcon from './CouponIcon'
import './coupons.css'

const fmt = iso => new Intl.DateTimeFormat('en-PH', { timeZone: 'Asia/Manila', dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso))

// Coupon updates and announcements. Opening the inbox marks everything as read.
export default function Inbox({ session }) {
  const [state, setState] = useState({ loading: true, items: [], error: '' })
  const hasSession = Boolean(session)
  useEffect(() => {
    if (!hasSession || !supabase) return
    let active = true
    ;(async () => {
      const { data, error } = await supabase.rpc('get_my_inbox')
      if (!active) return
      if (error || !data?.ok) { setState({ loading: false, items: [], error: 'Could not load your inbox. Please try again.' }); return }
      setState({ loading: false, items: data.items || [], error: '' })
      // Mark read after the list is shown, so unread highlights are visible on this visit.
      Promise.resolve(supabase.rpc('mark_inbox_read')).catch(() => {})
    })().catch(() => { if (active) setState({ loading: false, items: [], error: 'Could not load your inbox. Please try again.' }) })
    return () => { active = false }
  }, [hasSession, session?.user?.id])
  return <article className="inbox-page shell">
    <span className="coupon-kicker"><CouponIcon size={16}/> UPDATES</span>
    <h1>Your inbox</h1>
    <p className="coupon-note">Coupon updates and announcements from Aureatine x APEX.</p>
    {!session ? <p className="coupon-note">Log in to see your updates. <a href={appHref('/login')}>Log in</a></p>
      : !supabase ? <p className="coupon-note">Updates are not connected yet.</p>
      : state.loading ? <p className="coupon-note">Loading your inbox…</p>
      : state.error ? <p className="coupon-error" role="alert">{state.error}</p>
      : state.items.length === 0 ? <p className="coupon-note">No updates yet. Coupon updates and announcements will appear here.</p>
      : <ul className="inbox-list">{state.items.map(item => <li key={item.id + item.kind} className={`inbox-item${item.is_read ? '' : ' unread'}`}>
          <div className="inbox-meta"><span className="inbox-tag">{item.kind === 'announcement' ? 'Announcement' : 'Coupon update'}</span><time dateTime={item.created_at}>{fmt(item.created_at)}</time></div>
          <h2>{item.title}</h2>
          <p>{item.body}</p>
        </li>)}</ul>}
  </article>
}
