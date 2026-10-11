import { useEffect, useRef, useState } from 'react'
import './chat.css'
function BotFace({ small = false }) {
  return <svg viewBox="0 0 64 64" width={small ? 35 : 44} height={small ? 35 : 44} fill="none" aria-hidden="true"><path d="M32 15V9" stroke="#d2b48b" strokeWidth="2.5"/><circle cx="32" cy="7" r="3" fill="#e8c38c"/><rect x="11" y="17" width="42" height="34" rx="15" fill="#e9d6b8"/><rect x="17" y="25" width="30" height="17" rx="8.5" fill="#4c392d"/><g className="bot-eyes"><path d="M25 31v5M39 31v5" stroke="#ead0a4" strokeWidth="3" strokeLinecap="round"/></g><path d="M28 46h8" stroke="#af8960" strokeWidth="2" strokeLinecap="round"/><path d="M8 30v9M56 30v9" stroke="#b28b5d" strokeWidth="4" strokeLinecap="round"/></svg>
}
function SmallIcon({ kind }) { return <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{kind === 'close' ? <path d="m6 6 12 12M6 18 18 6"/> : kind === 'send' ? <><path d="m3 3 18 9-18 9 4-9-4-9ZM7 12h14"/></> : <path d="M20 10a8 8 0 1 0-1 7M20 4v6h-6"/>}</svg> }
export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState('checking')
  const [consent, setConsent] = useState(false)
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')
  const [pending, setPending] = useState('')
  const [error, setError] = useState('')
  const [check, setCheck] = useState(0)
  const launcher = useRef(null), input = useRef(null), panel = useRef(null), end = useRef(null), request = useRef(null)
  const api = import.meta.env.VITE_CHAT_API_URL || '/api/chat'
  useEffect(() => {
    if (!open) return
    const controller = new AbortController()
    fetch(api, { signal: controller.signal }).then(async result => {
      if (!result.ok || !result.headers.get('content-type')?.includes('application/json')) throw new Error('unavailable')
      const data = await result.json(); setStatus(data.available ? 'ready' : 'offline')
    }).catch(() => { if (!controller.signal.aborted) setStatus('offline') })
    panel.current?.focus()
    return () => controller.abort()
  }, [open, check, api])
  useEffect(() => { end.current?.scrollIntoView({ block: 'nearest', behavior: 'instant' }) }, [messages, pending])
  useEffect(() => () => request.current?.abort(), [])
  function close() { setOpen(false); launcher.current?.focus() }
  function clear() { request.current?.abort(); setMessages([]); setDraft(''); setPending(''); setError(''); input.current?.focus() }
  async function send(event) {
    event.preventDefault()
    const text = draft.trim()
    if (!text || pending || status !== 'ready' || !consent) return
    const controller = new AbortController(); request.current = controller
    setPending(text); setDraft(''); setError('')
    const history = [...messages.slice(-4).map(({ role, content }) => ({ role, content: content.slice(0, 1600) })), { role: 'user', content: text }]
    const timer = setTimeout(() => controller.abort('timeout'), 25000)
    try {
      const result = await fetch(api, { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: controller.signal, body: JSON.stringify({ consent: true, messages: history }) })
      if (!result.headers.get('content-type')?.includes('application/json')) throw new Error('Chat is not available on this deployment yet.')
      const data = await result.json()
      if (!result.ok) throw new Error(data.error || 'Could not send your message.')
      if (typeof data.reply !== 'string') throw new Error('The assistant returned an invalid response.')
      setMessages(previous => [...previous, { role: 'user', content: text }, { role: 'assistant', content: data.reply }])
    } catch (failure) {
      if (!controller.signal.aborted || controller.signal.reason === 'timeout') { setError(controller.signal.aborted ? 'That took too long. Please try again.' : failure.message); setDraft(text) }
    } finally { clearTimeout(timer); if (request.current === controller) { request.current = null; setPending('') } }
  }
  return <div className="aureatine-chat">
    {open && <section ref={panel} tabIndex={-1} role="dialog" aria-modal="false" aria-labelledby="chat-title" className="chat-panel" onKeyDown={event => { if (event.key === 'Escape') { event.stopPropagation(); close() } }}>
      <header className="chat-header"><span className="chat-avatar"><BotFace small/></span><div><h2 id="chat-title">Your little boost.</h2><p>Aureatine AI · {status === 'ready' ? 'Gemini configured' : status === 'checking' ? 'Checking connection' : 'Not connected yet'}</p></div><button aria-label="Close chat" onClick={close}><SmallIcon kind="close"/></button></header>
      <div className="chat-scroll"><div className="chat-welcome"><span className="chat-label">A LITTLE GUIDANCE, A LITTLE ENERGY</span><h3>Hey, I’m your<br/>Aureatine assistant.</h3><p>Let’s talk gym-day basics, protein, or your next visit. What’s on your mind?</p><div className="chat-suggestions">{['How does protein help recovery?', 'How will QR rewards work?', 'Where is Apex Fitness Gym?'].map(text => <button key={text} onClick={() => { setDraft(text); input.current?.focus() }}>{text}<span aria-hidden="true">↗</span></button>)}</div></div>
      {status === 'offline' && <div className="chat-offline"><strong>Almost ready to chat.</strong><p>The Gemini connection hasn’t been activated on this deployment. No message will be sent until it’s ready.</p><button onClick={() => { setStatus('checking'); setCheck(value => value + 1) }}>Check connection again <SmallIcon kind="refresh"/></button></div>}
      <div className="chat-log" role="log" aria-live="polite" aria-label="Conversation">{messages.map((message, index) => <div key={index} className={`chat-message ${message.role}`}><span>{message.role === 'user' ? 'YOU' : 'AUREATINE AI'}</span><p>{message.content}</p></div>)}{pending && <><div className="chat-message user"><span>YOU</span><p>{pending}</p></div><div className="chat-thinking"><span/><span/><span/><span className="sr-only">Assistant is thinking</span></div></>}</div>
      {error && <output className="chat-error">{error}</output>}<div ref={end}/></div>
      <div className="chat-compose">{<label className="chat-consent"><input type="checkbox" checked={consent} onChange={event => setConsent(event.target.checked)}/><span>I agree to send my messages to Google Gemini. <a href="https://ai.google.dev/gemini-api/terms" target="_blank" rel="noopener noreferrer">Provider terms</a>. Don’t share sensitive health details.</span></label>}<form onSubmit={send}><label htmlFor="chat-message" className="sr-only">Message the Aureatine assistant</label><textarea ref={input} id="chat-message" value={draft} onChange={event => setDraft(event.target.value)} maxLength={1200} rows={2} placeholder={status === 'ready' ? 'Ask a little, learn a little…' : 'Chat connection is pending…'} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); send(event) } }}/><button aria-label="Send message" disabled={!draft.trim() || !consent || status !== 'ready' || Boolean(pending)}><SmallIcon kind="send"/></button></form><div className="chat-bottom"><span>General guidance, not medical advice.</span>{pending ? <button onClick={() => { request.current?.abort(); setPending(''); setError('Response stopped.') }}>Stop</button> : <button onClick={clear} disabled={!messages.length && !draft && !error}>Clear chat</button>}</div><p className="chat-privacy">Chat stays in this page’s memory; our app does not save it. Google processes sent messages under its own policies. AI can make mistakes.</p></div>
    </section>}
    <button ref={launcher} className={`chat-launcher${open ? ' is-open' : ''}`} aria-label={open ? 'Close Aureatine AI chat' : 'Open Aureatine AI chat'} aria-expanded={open} onClick={() => open ? close() : setOpen(true)}>{open ? <SmallIcon kind="close"/> : <BotFace/>}{!open && <span className="chat-ai-badge">AI</span>}</button>
  </div>
}
