import { useCallback, useEffect, useRef, useState } from 'react'
import './chat.css'
import NutritionCalculator from './NutritionCalculator'
import { estimateNutrition } from '../shared/nutrition.js'
function BotFace({ small = false }) {
  return <svg viewBox="0 0 64 64" width={small ? 35 : 44} height={small ? 35 : 44} fill="none" aria-hidden="true"><path d="M32 15V9" stroke="#d2b48b" strokeWidth="2.5"/><circle cx="32" cy="7" r="3" fill="#e8c38c"/><rect x="11" y="17" width="42" height="34" rx="15" fill="#e9d6b8"/><rect x="17" y="25" width="30" height="17" rx="8.5" fill="#4c392d"/><g className="bot-eyes"><path d="M25 31v5M39 31v5" stroke="#ead0a4" strokeWidth="3" strokeLinecap="round"/></g><path d="M28 46h8" stroke="#af8960" strokeWidth="2" strokeLinecap="round"/><path d="M8 30v9M56 30v9" stroke="#b28b5d" strokeWidth="4" strokeLinecap="round"/></svg>
}
function SmallIcon({ kind }) { return <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{kind === 'close' ? <path d="m6 6 12 12M6 18 18 6"/> : kind === 'send' ? <><path d="m3 3 18 9-18 9 4-9-4-9ZM7 12h14"/></> : <path d="M20 10a8 8 0 1 0-1 7M20 4v6h-6"/>}</svg> }
function ReplyContent({ text, animate, paused, onProgress, onDone }) {
  const [visible, setVisible] = useState(0)
  useEffect(() => {
    if (!animate || paused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) { onDone(); return }
    const duration = Math.min(1700, Math.max(400, text.length * 4))
    let start, frame
    function tick(now) {
      if (start === undefined) start = now
      const count = Math.min(text.length, Math.ceil((now - start) / duration * text.length))
      setVisible(count); onProgress()
      if (count < text.length) frame = requestAnimationFrame(tick)
      else onDone()
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [text, animate, paused, onProgress, onDone])
  const full = !animate || paused || window.matchMedia('(prefers-reduced-motion: reduce)').matches
  return <p className="reply-content"><span className="sr-only">{text}</span><span aria-hidden="true">{full ? text : text.slice(0, visible)}{!full && visible < text.length && <i className="reply-caret"/>}</span></p>
}
function AssistantReply({ message, animate, paused, onProgress, markDone }) {
  const [copied, setCopied] = useState(false)
  const [copyError, setCopyError] = useState(false)
  const done = useCallback(() => markDone(message.id), [message.id, markDone])
  async function copy() {
    try { await navigator.clipboard.writeText(message.content); setCopied(true); setCopyError(false) }
    catch { setCopyError(true) }
  }
  return <div className="assistant-row"><span className="reply-avatar" aria-hidden="true"><BotFace small/></span><div className="chat-message assistant"><span>AUREATINE AI</span><ReplyContent text={message.content} animate={animate} paused={paused} onProgress={onProgress} onDone={done}/><div className="reply-actions"><button onClick={copy} aria-label="Copy assistant reply"><svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">{copied ? <path d="m4 12 5 5L20 5"/> : <><rect x="8" y="8" width="12" height="13" rx="2"/><path d="M16 8V3H3v13h5"/></>}</svg>{copied ? 'Copied' : 'Copy'}</button><span>AI guidance · double-check important details</span></div>{copyError && <output className="copy-feedback">Copy isn’t available in this browser. Select the text to copy it.</output>}</div></div>
}
export default function ChatWidget({ paused = false }) {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState('chat')
  const [calculatorReady, setCalculatorReady] = useState(false)
  const [status, setStatus] = useState('checking')
  const [consent, setConsent] = useState(false)
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')
  const [pending, setPending] = useState('')
  const [error, setError] = useState('')
  const [check, setCheck] = useState(0)
  const launcher = useRef(null), input = useRef(null), panel = useRef(null), end = useRef(null), request = useRef(null), scroll = useRef(null)
  const follow = useRef(true), revealed = useRef(new Set()), nextId = useRef(0)
  const closing = useRef(false)
  const followReply = useCallback(() => { if (follow.current && scroll.current) scroll.current.scrollTop = scroll.current.scrollHeight }, [])
  const markDone = useCallback(id => revealed.current.add(id), [])
  const api = import.meta.env.VITE_CHAT_API_URL || '/api/chat'
  useEffect(() => {
    if (!open) return
    const controller = new AbortController()
    fetch(api, { signal: controller.signal }).then(async result => {
      if (!result.ok || !result.headers.get('content-type')?.includes('application/json')) throw new Error('unavailable')
      const data = await result.json(); setStatus(data.available ? 'ready' : 'offline'); setCalculatorReady(data.nutritionCalculator === true)
    }).catch(() => { if (!controller.signal.aborted) setStatus('offline') })
    panel.current?.focus()
    return () => controller.abort()
  }, [open, check, api])
  useEffect(() => { followReply() }, [messages, pending, followReply])
  useEffect(() => () => request.current?.abort(), [])
  async function close() {
    if (closing.current) return
    closing.current = true
    if (panel.current && !paused && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      try { await panel.current.animate([{ transform: 'translateY(0) scale(1)' }, { transform: 'translateY(10px) scale(.98)' }], { duration: 140, easing: 'ease-in' }).finished } catch { /* Panel may already be unmounted. */ }
    }
    setOpen(false); closing.current = false; launcher.current?.focus()
  }
  function clear() { request.current?.abort(); revealed.current.clear(); follow.current = true; setMessages([]); setDraft(''); setPending(''); setError(''); input.current?.focus() }
  async function send(event, calculator = null) {
    event?.preventDefault()
    const estimate = calculator ? estimateNutrition(calculator) : null
    if (calculator && (!estimate.ok || !calculatorReady)) { setError(estimate?.error || 'The deployed calculator backend needs updating.'); return }
    const text = calculator ? `Explain my calculator estimates: about ${estimate.maintenance} kcal/day for maintenance and ${estimate.proteinLow === estimate.proteinHigh ? estimate.proteinLow : `${estimate.proteinLow}–${estimate.proteinHigh}`} g/day protein. Explain the assumptions, uncertainty and food-first approach, not a medical prescription.` : draft.trim()
    if (!text || pending || status !== 'ready' || (!calculator && !consent)) return
    if (calculator) { setTab('chat'); setConsent(true) }
    const controller = new AbortController(); request.current = controller
    follow.current = true; setPending(text); setDraft(''); setError('')
    const history = [...messages.slice(-4).map(({ role, content }) => ({ role, content: content.slice(0, 1600) })), { role: 'user', content: text }]
    const timer = setTimeout(() => controller.abort('timeout'), 25000)
    try {
      const result = await fetch(api, { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: controller.signal, body: JSON.stringify({ consent: true, messages: history, ...(calculator ? { calculator, calculatorConsent: true } : {}) }) })
      if (!result.headers.get('content-type')?.includes('application/json')) throw new Error('Chat is not available on this deployment yet.')
      const data = await result.json()
      if (!result.ok) throw new Error(data.error || 'Could not send your message.')
      if (typeof data.reply !== 'string') throw new Error('The assistant returned an invalid response.')
      const userId = nextId.current++, replyId = nextId.current++
      setMessages(previous => [...previous, { id: userId, role: 'user', content: text }, { id: replyId, role: 'assistant', content: data.reply }])
    } catch (failure) {
      if (!controller.signal.aborted || controller.signal.reason === 'timeout') { setError((controller.signal.aborted ? 'That took too long. Please try again.' : failure.message) + (calculator ? ' Your local estimates are still in the Calculator tab; use its Explain button to retry.' : '')); if (!calculator) setDraft(text) }
    } finally { clearTimeout(timer); if (request.current === controller) { request.current = null; setPending('') } }
  }
  return <div className="aureatine-chat">
    {open && <section ref={panel} tabIndex={-1} role="dialog" aria-modal="false" aria-labelledby="chat-title" className={`chat-panel chat-polished${pending ? ' is-thinking' : ''}${messages.length || pending ? ' has-conversation' : ''}`} onKeyDown={event => { if (event.key === 'Escape') { event.stopPropagation(); close() } }}>
      <header className="chat-header"><span className="chat-avatar"><BotFace small/></span><div><h2 id="chat-title">Aureatine AI<span className="chat-beta">BETA</span></h2><p><span className={`chat-status-dot ${status}`}/>{pending ? 'Thinking through your question…' : status === 'ready' ? 'Your everyday fitness companion' : status === 'checking' ? 'Checking connection…' : 'Connection pending'}</p></div><button aria-label="Close chat" onClick={close}><SmallIcon kind="close"/></button></header>
      <div className="chat-mode-switch" aria-label="Assistant tools"><button aria-pressed={tab === 'chat'} onClick={() => { setTab('chat'); follow.current = true }}>Conversation</button><button aria-pressed={tab === 'calculator'} onClick={() => { setTab('calculator'); follow.current = false; if (scroll.current) scroll.current.scrollTop = 0 }}><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><rect x="5" y="2" width="14" height="20" rx="3"/><path d="M8 6h8M8 11h3m3 0h2M8 16h3m3 0h2"/></svg>Calculator</button></div>
      <div ref={scroll} className="chat-scroll" onScroll={() => { const el = scroll.current; follow.current = tab === 'chat' && el.scrollHeight - el.scrollTop - el.clientHeight < 80 }}><div hidden={tab !== 'chat'}><div className="chat-welcome"><div className="welcome-bot" aria-hidden="true"><BotFace/><span/></div><span className="chat-label">SMALL QUESTIONS. STRONGER ROUTINES.</span><h3>A little guidance.<br/><em>A better everyday.</em></h3><p>Hi, I’m Aureatine AI. Ask about gym basics, protein, or your next visit.</p><div className="chat-suggestions">{['How does protein help recovery?', 'How will QR rewards work?', 'Where is APEX Fitness Gym?'].map(text => <button key={text} onClick={() => { setDraft(text); input.current?.focus() }}>{text}<span aria-hidden="true">↗</span></button>)}</div></div>
      {status === 'offline' && <div className="chat-offline"><strong>Almost ready to chat.</strong><p>Aureatine AI hasn’t been connected on this deployment yet. No message will be sent until it’s ready.</p><button onClick={() => { setStatus('checking'); setCheck(value => value + 1) }}>Check connection again <SmallIcon kind="refresh"/></button></div>}
      <div className="chat-log" role="log" aria-live="polite" aria-label="Conversation">{messages.map(message => message.role === 'assistant' ? <AssistantReply key={message.id} message={message} animate={!revealed.current.has(message.id)} paused={paused} onProgress={followReply} markDone={markDone}/> : <div key={message.id} className="chat-message user"><span>YOU</span><p>{message.content}</p></div>)}{pending && <><div className="chat-message user"><span>YOU</span><p>{pending}</p></div><div className="thinking-card"><span className="thinking-face"><BotFace small/><i/></span><div><strong>Aureatine AI is thinking</strong><div className="thinking-wave" aria-hidden="true">{[0,1,2,3,4].map(i => <span key={i} style={{ animationDelay: `${i * .12}s` }}/>)}</div></div><span className="thinking-caption">One moment…</span></div></>}</div>
      {error && <output className="chat-error">{error}</output>}<div ref={end}/></div><div hidden={tab !== 'calculator'}><NutritionCalculator status={status === 'ready' && calculatorReady ? 'ready' : 'offline'} busy={Boolean(pending)} onExplain={profile => send(null, profile)}/></div></div>
      <div className="chat-compose" hidden={tab !== 'chat'}>{<label className="chat-consent"><input type="checkbox" checked={consent} onChange={event => setConsent(event.target.checked)}/><span>I agree to chat with Aureatine AI. <a href="https://ai.google.dev/gemini-api/terms" target="_blank" rel="noopener noreferrer">Provider terms</a>. Don’t share sensitive health details.</span></label>}<form onSubmit={send}><label htmlFor="chat-message" className="sr-only">Message the Aureatine assistant</label><textarea ref={input} id="chat-message" value={draft} onChange={event => setDraft(event.target.value)} maxLength={1200} rows={2} placeholder={status === 'ready' ? 'Ask Aureatine AI…' : 'Aureatine AI is not connected yet…'} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); send(event) } }}/><button aria-label="Send message" disabled={!draft.trim() || !consent || status !== 'ready' || Boolean(pending)}><SmallIcon kind="send"/></button></form><div className="chat-bottom"><span>{draft.length ? `${draft.length}/1200 characters` : 'General guidance, not medical advice.'}</span>{pending ? <button onClick={() => { request.current?.abort(); setPending(''); setError('Response stopped.') }}>Stop</button> : <button onClick={clear} disabled={!messages.length && !draft && !error}>Clear chat</button>}</div><p className="chat-privacy">Aureatine AI uses Google Gemini to process messages under Google’s policies. This app does not save chats. AI can make mistakes.</p></div>
    </section>}
    <button ref={launcher} className={`chat-launcher${open ? ' is-open' : ''}`} aria-label={open ? 'Close Aureatine AI chat' : 'Open Aureatine AI chat'} aria-expanded={open} onClick={() => open ? close() : setOpen(true)}>{open ? <SmallIcon kind="close"/> : <BotFace/>}{!open && <span className="chat-ai-badge">AI</span>}</button>
  </div>
}
