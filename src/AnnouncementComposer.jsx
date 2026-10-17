import { useState } from 'react'
import { supabase } from './supabase'
import './coupons.css'

const errors = { ADMIN_ONLY: 'Admin access is required to publish announcements.', INVALID_CONTENT: 'Add a title (up to 120 characters) and a message (up to 2,000 characters).' }

// Admin only. Publishes one announcement to every member's inbox. The server checks admin access.
export default function AnnouncementComposer() {
  const [title, setTitle] = useState(''), [body, setBody] = useState(''), [busy, setBusy] = useState(false), [message, setMessage] = useState(null)
  async function publish(event) {
    event.preventDefault()
    if (busy) return
    setBusy(true); setMessage(null)
    try {
      const { data, error } = await supabase.rpc('admin_publish_announcement', { p_title: title, p_body: body })
      if (!error && data?.ok) { setTitle(''); setBody(''); setMessage({ tone: 'ok', text: 'Published. Members will see it in their inbox.' }) }
      else setMessage({ tone: 'bad', text: errors[data?.code] || 'Could not publish. Check your access and try again.' })
    } catch { setMessage({ tone: 'bad', text: 'Could not publish. Check your connection and try again.' }) }
    finally { setBusy(false) }
  }
  return <section className="announcement-composer" aria-labelledby="announcement-title">
    <h2 id="announcement-title">Publish an announcement</h2>
    <p>Sends one update to every member’s inbox. No email is sent.</p>
    <form onSubmit={publish}>
      <label>Title<input value={title} maxLength={120} onChange={e => setTitle(e.target.value)} placeholder="Coupon update"/></label>
      <label>Message<textarea value={body} maxLength={2000} onChange={e => setBody(e.target.value)} placeholder="Write the announcement"/></label>
      <button type="submit" disabled={busy || !title.trim() || !body.trim()}>{busy ? 'Publishing…' : 'Publish to inbox'}</button>
    </form>
    {message && <output className={`coupon-msg ${message.tone}`} aria-live={message.tone === 'bad' ? 'assertive' : 'polite'}>{message.text}</output>}
  </section>
}
