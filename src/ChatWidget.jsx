import { CHAT_BROWSER_TIMEOUT_MS } from '../shared/chatTiming.js'
import { useCallback, useEffect, useRef, useState } from 'react'
import './chat.css'
import NutritionCalculator from './NutritionCalculator'
import { estimateNutrition } from '../shared/nutrition.js'
import { readSSE } from '../shared/chatStream.js'
function BotFace({ small = false }) {
  return <svg viewBox="0 0 64 64" width={small ? 35 : 44} height={small ? 35 : 44} fill="none" aria-hidden="true"><path d="M32 15V9" stroke="#6B4A38" strokeWidth="2.5"/><circle cx="32" cy="7" r="3" fill="#6B4A38"/><rect x="11" y="17" width="42" height="34" rx="15" fill="#6B4A38"/><rect x="17" y="25" width="30" height="17" rx="8.5" fill="#4A2F20"/><g className="bot-eyes"><path d="M25 31v5M39 31v5" stroke="#6B4A38" strokeWidth="3" strokeLinecap="round"/></g><path d="M28 46h8" stroke="#6B4A38" strokeWidth="2" strokeLinecap="round"/><path d="M8 30v9M56 30v9" stroke="#6B4A38" strokeWidth="4" strokeLinecap="round"/></svg>
}
function SmallIcon({ kind }) { return <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{kind === 'close' ? <path d="m6 6 12 12M6 18 18 6"/> : kind === 'send' ? <><path d="m3 3 18 9-18 9 4-9-4-9ZM7 12h14"/></> : <path d="M20 10a8 8 0 1 0-1 7M20 4v6h-6"/>}</svg> }
function AssistantReply({ message }) {
  const [copied, setCopied] = useState(false)
  const [copyError, setCopyError] = useState(false)
  async function copy() {
    try { await navigator.clipboard.writeText(message.content); setCopied(true); setCopyError(false) }
    catch { setCopyError(true) }
  }
  return <div className="assistant-row"><span className="reply-avatar" aria-hidden="true"><BotFace small/></span><div className="chat-message assistant"><span>Aureatine AI</span><p className="reply-content">{message.content}</p>{message.incomplete&&<small className="reply-incomplete">Partial answer — response did not finish.</small>}<div className="reply-actions"><button onClick={copy} aria-label="Copy assistant reply"><svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">{copied ? <path d="m4 12 5 5L20 5"/> : <><rect x="8" y="8" width="12" height="13" rx="2"/><path d="M16 8V3H3v13h5"/></>}</svg>{copied ? 'Copied' : 'Copy'}</button><span>AI guidance · double-check important details</span></div>{copyError && <output className="copy-feedback">Copy isn’t available in this browser. Select the text to copy it.</output>}</div></div>
}
export default function ChatWidget({ paused = false }) {
  const [open, setOpen] = useState(false)
  const [adultAccess, setAdultAccess] = useState(false)
  const [ageDenied, setAgeDenied] = useState(false)
  const [pageHidden, setPageHidden] = useState(document.hidden)
  useEffect(() => {
    const update = () => setPageHidden(document.hidden)
    document.addEventListener('visibilitychange', update)
    return () => document.removeEventListener('visibilitychange', update)
  }, [])
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
  const follow = useRef(true), nextId = useRef(0)
  const closing = useRef(false)
  const followReply = useCallback(() => { if (follow.current && scroll.current) scroll.current.scrollTop = scroll.current.scrollHeight }, [])
  const api = import.meta.env.VITE_CHAT_API_URL || '/api/chat'
  useEffect(() => {
    if (!open || !adultAccess) return
    const controller = new AbortController()
    fetch(api, { signal: controller.signal }).then(async result => {
      if (!result.ok || !result.headers.get('content-type')?.includes('application/json')) throw new Error('unavailable')
      const data = await result.json(); setStatus(data.available ? 'ready' : 'offline'); setCalculatorReady(data.gymGuidanceVersion === 2)
    }).catch(() => { if (!controller.signal.aborted) setStatus('offline') })
    panel.current?.focus()
    return () => controller.abort()
  }, [open, adultAccess, check, api])
  useEffect(() => { followReply() }, [messages, pending, followReply])
  useEffect(() => () => {const active=request.current;request.current=null;active?.abort('unmount')}, [])
  async function close() {
    if (closing.current) return
    closing.current = true
    if (panel.current && !paused && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      try { await panel.current.animate([{ transform: 'translateY(0) scale(1)' }, { transform: 'translateY(10px) scale(.98)' }], { duration: 140, easing: 'ease-in' }).finished } catch { /* Panel may already be unmounted. */ }
    }
    setOpen(false); closing.current = false; launcher.current?.focus()
  }
  function clear() { request.current?.abort('clear'); request.current=null; follow.current = true; setMessages([]); setDraft(''); setPending(''); setError(''); input.current?.focus() }
  async function send(event, calculator = null, shortcut = null) {
    event?.preventDefault()
    const estimate = calculator ? estimateNutrition(calculator) : null
    if (!adultAccess) { setError('This assistant and calculator are for adults 18+ only.'); return }
    if (calculator && (!estimate.ok || !calculatorReady)) { setError(estimate?.error || 'The deployed calculator backend needs updating.'); return }
    const text = calculator ? (`Please explain my gym goal and next steps using my maintenance estimate of ${estimate.maintenance} kcal/day and protein reference of ${estimate.proteinLow === estimate.proteinHigh ? estimate.proteinLow : `${estimate.proteinLow}–${estimate.proteinHigh}`} g/day. Explain whether protein powder or a mass gainer could be relevant, without assuming I need either. These are estimates, not a medical prescription.`) : (shortcut ?? draft).trim()
    if (!text || pending || request.current || status !== 'ready' || (!calculator && !consent)) return
    if (calculator) { setTab('chat'); setConsent(true) }
    const controller = new AbortController(); request.current = controller
    follow.current = true; setPending(text); setDraft(''); setError('')
    const history = [...messages.filter(message=>!message.incomplete).slice(-4).map(({ role, content }) => ({ role, content: content.slice(0, 1600) })), { role: 'user', content: text }]
    const userId=nextId.current++, replyId=nextId.current++
    setMessages(previous=>[...previous,{id:userId,role:'user',content:text}])
    let collected='',finished=false,updateTimer=null,truncated=false
    const publish=()=>{updateTimer=null;if(request.current!==controller||controller.signal.aborted||!collected)return
      setMessages(previous=>previous.some(item=>item.id===replyId)?previous.map(item=>item.id===replyId?{...item,content:collected}:item):[...previous,{id:replyId,role:'assistant',content:collected}])}
    const timer=setTimeout(()=>controller.abort('timeout'),CHAT_BROWSER_TIMEOUT_MS)
    try {
      const result=await fetch(api,{method:'POST',headers:{'Content-Type':'application/json'},signal:controller.signal,body:JSON.stringify({provider:'nvidia',stream:true,consent:true,adultConfirmed:true,messages:history,...(calculator?{calculator:estimate.profile,calculatorConsent:true}:{})})})
      if(result.headers.get('content-type')?.includes('text/event-stream')&&result.ok){
        for await(const raw of readSSE(result.body)){
          if(controller.signal.aborted||request.current!==controller)break
          const event=JSON.parse(raw)
          if(event.type==='error')throw new Error(event.error||'The response was interrupted.')
          if(event.type==='delta'){
            if(typeof event.text!=='string'||collected.length+event.text.length>8000)throw new Error('Invalid response stream.')
            collected+=event.text
            if(updateTimer===null)updateTimer=setTimeout(publish,40)
          }
          if(event.type==='done'){finished=true;truncated=event.truncated===true;break}
        }
        if(!controller.signal.aborted&&(!finished||!collected.trim()))throw new Error('The response ended early. Please try again.')
      }else{
        if(!result.headers.get('content-type')?.includes('application/json'))throw new Error('Chat is not available on this deployment yet.')
        const data=await result.json()
        if(!result.ok)throw new Error(data.error||'Could not send your message.')
        if(typeof data.reply!=='string'||!data.reply.trim())throw new Error('The assistant returned an invalid response.')
        collected=data.reply;finished=true
      }
      clearTimeout(updateTimer);publish()
      if(truncated)setError('This answer reached its length limit. Ask a follow-up for more detail.')
    } catch(failure) {
      if(request.current===controller&&(!controller.signal.aborted||controller.signal.reason==='timeout')){
        publish();setError((controller.signal.aborted?(collected.trim() ? 'The request timed out. The answer above is incomplete; try again shortly.' : 'The request timed out before an answer arrived. Please try again shortly.'):failure.message)+(calculator?' Your local estimates are still in the Calculator tab.':''))
        if(!calculator)setDraft(text)
      }
    } finally {
      clearTimeout(timer);clearTimeout(updateTimer)
      if(request.current===controller){
        if(!finished||truncated)setMessages(previous=>previous.map(item=>item.id===replyId?{...item,incomplete:true}:item))
        request.current=null;setPending('')
      }
    }
  }

  return <div className={`aureatine-chat${paused || pageHidden ? ' coach-motion-paused' : ''}`}>
    {open && <section ref={panel} tabIndex={-1} role="dialog" aria-modal="false" aria-labelledby="chat-title" className={`chat-panel chat-polished chat-coach${pending ? ' is-thinking' : ''}${messages.length || pending ? ' has-conversation' : ''}`} onKeyDown={event => { if (event.key === 'Escape') { event.stopPropagation(); close() } }}>
      <header className="chat-header"><span className="chat-avatar"><BotFace small/></span><div><h2 id="chat-title">Aureatine AI<span className="chat-beta">BETA</span></h2><p><span className={`chat-status-dot ${status}`}/>{pending ? (messages.at(-1)?.role==='assistant'?'Replying…':'Waiting for NVIDIA…') : status === 'ready' ? 'Your AI fitness coach · 18+' : status === 'checking' ? 'Checking connection…' : 'Connection pending'}</p></div><button aria-label="Close chat" onClick={close}><SmallIcon kind="close"/></button></header>
      {!adultAccess ? <div className="coach-age-gate"><span className="chat-label">ADULT FITNESS GUIDANCE</span><h3>A space for<br/><em>your next step.</em></h3><p>Aureatine AI and its gym calculator are for adults aged 18 or older. AI guidance does not replace a qualified trainer or health professional.</p>{ageDenied ? <div role="status"><strong>This assistant is not available to under-18s.</strong><p>Please ask a trusted adult and a qualified professional for age-appropriate fitness guidance.</p></div> : <><button className="nutrition-submit" onClick={() => setAdultAccess(true)}>I confirm I am 18 or older <span aria-hidden="true">→</span></button><button className="nutrition-reset" onClick={() => setAgeDenied(true)}>I am under 18</button></>}<p className="nutrition-local">No chat message is sent at this step. NVIDIA’s hosted GLM model processes messages only after you agree and send.</p></div> : <>
      <div className="chat-mode-switch" aria-label="Assistant tools"><button aria-pressed={tab === 'chat'} onClick={() => { setTab('chat'); follow.current = true }}>Conversation</button><button aria-pressed={tab === 'calculator'} onClick={() => { setTab('calculator'); follow.current = false; if (scroll.current) scroll.current.scrollTop = 0 }}><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><rect x="5" y="2" width="14" height="20" rx="3"/><path d="M8 6h8M8 11h3m3 0h2M8 16h3m3 0h2"/></svg>Calculator</button></div>
      <div ref={scroll} className="chat-scroll" onScroll={() => { const el = scroll.current; follow.current = tab === 'chat' && el.scrollHeight - el.scrollTop - el.clientHeight < 80 }}><div hidden={tab !== 'chat'}><div className="chat-welcome"><div className="welcome-bot" aria-hidden="true"><BotFace/><span/></div><span className="chat-label">YOUR PACE. YOUR PROGRESS.</span><h3>Your next step.<br/><em>Let’s find it together.</em></h3><p>I’m Aureatine AI, your coach-style fitness guide. Let’s talk training, food and habits — one realistic step at a time.</p><div className="coach-method"><span>01 · Set a goal</span><span>02 · Take a step</span><span>03 · Check in</span></div><p className="shortcut-hint">{!consent ? 'Agree to message processing below to enable one-tap questions.' : 'Tap a question to send it to Aureatine AI.'}</p><div className="chat-suggestions">{[
        { title: 'Build my gym routine', detail: 'Start with your experience & schedule', text: 'Help me build a realistic gym routine. Ask about my goal, experience and available training days first.' },
        { title: 'Make sense of nutrition', detail: 'Food first. Supplements only if useful.', text: 'Help me understand food, protein powder and mass gainers for my gym goal. Ask about my goal and usual meals before giving advice.' },
        { title: 'Help me stay consistent', detail: 'Small habits for the days life gets busy', text: 'Coach me on staying consistent with the gym. Ask what is getting in my way and help me choose one small action.' }
      ].map(({ title, detail, text }, i) => <button key={title} disabled={!consent || status !== 'ready' || Boolean(pending)} onClick={() => send(null, null, text)}><span className="coach-prompt-number">0{i + 1}</span><span className="coach-prompt-copy"><strong>{title}</strong><small>{detail}</small></span><span aria-hidden="true">↗</span></button>)}</div><p className="coach-boundary">AI guidance, not a certified trainer. No pressure. No quick fixes.</p></div>
      {status === 'offline' && <div className="chat-offline"><strong>Almost ready to chat.</strong><p>Aureatine AI hasn’t been connected on this deployment yet. No message will be sent until it’s ready.</p><button onClick={() => { setStatus('checking'); setCheck(value => value + 1) }}>Check connection again <SmallIcon kind="refresh"/></button></div>}
      <div className="chat-log" role="log" aria-live="polite" aria-label="Conversation">{messages.map(message => message.role === 'assistant' ? <AssistantReply key={message.id} message={message}/> : <div key={message.id} className="chat-message user"><span>YOU</span><p>{message.content}</p></div>)}{pending && messages.at(-1)?.role!=='assistant' && <><div className="thinking-card"><span className="thinking-face"><BotFace small/><i/></span><div><strong>Waiting for NVIDIA</strong><div className="thinking-wave" aria-hidden="true">{[0,1,2,3,4].map(i => <span key={i} style={{ animationDelay: `${i * .12}s` }}/>)}</div></div><span className="thinking-caption">Waiting for the first words…</span></div></>}</div>
      {messages.length > 0 && !pending && <div className="coach-followups" aria-label="Continue with your AI coach">{['What’s my first step?', 'Make it simpler', 'Help me check my progress'].map(text => <button key={text} disabled={!consent || status !== 'ready' || Boolean(pending)} onClick={() => send(null, null, text)}>{text}</button>)}</div>}
      {error && <output className="chat-error">{error}</output>}<div ref={end}/></div><div hidden={tab !== 'calculator'}><NutritionCalculator status={status === 'ready' && calculatorReady ? 'ready' : 'offline'} busy={Boolean(pending)} onExplain={profile => send(null, profile)}/></div></div>
      <div className="chat-compose" hidden={tab !== 'chat'}>{<label className="chat-consent"><input type="checkbox" checked={consent} onChange={event => setConsent(event.target.checked)}/><span>I am 18 or older and agree to NVIDIA processing my messages for Aureatine AI. <a href="https://assets.ngc.nvidia.com/products/api-catalog/legal/NVIDIA%20API%20Trial%20Terms%20of%20Service.pdf" target="_blank" rel="noopener noreferrer">Provider terms</a>. Don’t share sensitive health details.</span></label>}<form onSubmit={send}><label htmlFor="chat-message" className="sr-only">Message the Aureatine assistant</label><textarea ref={input} id="chat-message" value={draft} onChange={event => setDraft(event.target.value)} maxLength={1200} rows={2} placeholder={status === 'ready' ? 'Tell me your goal, or ask a question…' : 'Aureatine AI is not connected yet…'} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); send(event) } }}/><button aria-label="Send message" disabled={!draft.trim() || !consent || status !== 'ready' || Boolean(pending)}><SmallIcon kind="send"/></button></form><div className="chat-bottom"><span>{draft.length ? `${draft.length}/1200 characters` : 'General guidance, not medical advice.'}</span>{pending ? <button onClick={() => { request.current?.abort('stopped'); setPending(''); setError('Response stopped. Any partial text is kept above.') }}>Stop</button> : <button onClick={clear} disabled={!messages.length && !draft && !error}>Clear chat</button>}</div><p className="chat-privacy">Aureatine AI uses NVIDIA’s hosted GLM model to process messages under NVIDIA’s applicable policies. This app does not save chats. AI can make mistakes.</p></div></>}
    </section>}
    <button ref={launcher} className={`chat-launcher${open ? ' is-open' : ''}`} aria-label={open ? 'Close Aureatine AI chat' : 'Open Aureatine AI chat'} aria-expanded={open} onClick={() => open ? close() : setOpen(true)}>{open ? <SmallIcon kind="close"/> : <BotFace/>}{!open && <span className="chat-ai-badge">AI</span>}</button>
  </div>
}
