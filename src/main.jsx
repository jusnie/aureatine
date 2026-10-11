import React, { createContext, useContext, useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { flushSync } from 'react-dom'
import gsap from 'gsap'
import { supabase } from './supabase'
import ChatWidget from './ChatWidget'
import GoogleReviews from './GoogleReviews'
import { appHref, currentRoute, shakeImage } from './urls'
import { RewardsPage, LeaderboardPage } from './CommunityPages'
import '@fontsource/dm-sans/latin-400.css'
import '@fontsource/dm-sans/latin-500.css'
import '@fontsource/dm-sans/latin-600.css'
import '@fontsource/manrope/latin-500.css'
import '@fontsource/manrope/latin-600.css'
import '@fontsource/manrope/latin-700.css'
import './style.css'

function Icon({ name, size = 20 }) {
  const paths = { qr: <><path d="M3 3h6v6H3zM15 3h6v6h-6zM3 15h6v6H3zM15 15h3v3h3v3h-6v-3M12 3v3M12 12h3M3 12h6M21 12v3"/></>, calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18M7 14h3M14 14h3M7 18h3"/></>, trophy: <><path d="M8 3h8v6a4 4 0 0 1-8 0V3ZM8 5H4v3a4 4 0 0 0 4 4M16 5h4v3a4 4 0 0 1-4 4M12 13v5M8 21h8M9 18h6v3"/></>, refresh: <><path d="M20 10a8 8 0 1 0-1 7M20 4v6h-6"/></>, search: <><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></>, arrow: <><path d="M5 12h14M13 6l6 6-6 6"/></>, northeast: <><path d="M6 18 18 6M6 6h12v12"/></>, user: <><circle cx="12" cy="8" r="3.5"/><path d="M5 21v-2a7 7 0 0 1 14 0v2"/></>, gift: <><path d="M3 8h18v4H3zM5 12v9h14v-9M12 8v13"/><path d="M12 8C3 8 5 1 9 3c2 1 3 5 3 5Zm0 0c9 0 7-7 3-5-2 1-3 5-3 5Z"/></>, plus: <path d="M12 5v14M5 12h14"/>, pin: <><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2"/></>, cup: <><path d="m6 7 2 14h8l2-14M4 7h16M13 7l2-5h5"/></>, star: <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2-5.5-2.9-5.5 2.9 1-6.2L3 9.6l6.2-.9Z"/>, menu: <path d="M4 7h16M4 12h16M4 17h16"/>, close: <path d="m6 6 12 12M6 18 18 6"/>, check: <path d="m5 12 4 4L19 6"/>, mail: <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 6 9 7 9-7"/></> }
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name] || paths.star}</svg>
}
const route = currentRoute
const NavigationContext = createContext(null)
const year = new Date().getFullYear()
function Link({ to, children, className = '', ...props }) { const go = useContext(NavigationContext); return <a href={appHref(to)} className={className} onClick={e => { if (!e.metaKey && !e.ctrlKey) { e.preventDefault(); go(to) } }} {...props}>{children}</a> }
const founders = ['Juanie', 'Gian', 'Mikay', 'Oliver', 'Jethro', 'Carl', 'Ivan', 'Salac']
function TeamBoard() {
  const board = useRef(null)
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      board.current?.classList.toggle('breeze-visible', entry.isIntersecting)
    }, { threshold: .08 })
    if (board.current) observer.observe(board.current)
    return () => observer.disconnect()
  }, [])
  return <div ref={board} className="team-board breeze-board">
    <div className="team-anchor">aureatine <span>× APEX</span></div>
    <div className="team-tags">{founders.map((name, i) => <div className="hanging-rig" key={name} style={{ '--sway-time': `${8.4 + (i % 4) * .85}s`, '--sway-delay': `${-i * 1.7}s`, '--sway-left': `${-2.2 - (i % 3) * .35}deg`, '--sway-right': `${1.8 + (i % 4) * .3}deg` }}>
      <span className="suspension-pin" aria-hidden="true"/>
      <div className="hanging-assembly">
        <span className="hanging-yarn" aria-hidden="true"/>
        <div className="team-tag"><span className="tag-eyelet" aria-hidden="true"/><span className="tag-initial">{name.slice(0, 1)}</span><h2>{name}</h2><span>THE FOUNDING TEAM</span></div>
      </div>
    </div>)}</div>
  </div>
}
function FoundersPrint() {
  const print = useRef(null)
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      print.current?.classList.toggle('print-visible', entry.isIntersecting)
    }, { threshold: .1 })
    if (print.current) observer.observe(print.current)
    return () => observer.disconnect()
  }, [])
  return <div ref={print} className="founders-print animated-print" aria-label="Eight founders, one shared idea">
    <div className="print-top"><span>AUREATINE × APEX</span><span>OUR BEGINNING</span></div>
    <div className="eight-art" aria-hidden="true"><span>8</span><svg viewBox="0 0 400 360">
      <g transform="rotate(-32 200 178)"><ellipse cx="200" cy="178" rx="177" ry="70"/><circle className="orbiting-dot orbiting-dot-one" r="3.5"/></g>
      <g transform="rotate(32 200 178)"><ellipse cx="200" cy="178" rx="177" ry="70"/><circle className="orbiting-dot orbiting-dot-two" r="3.5"/></g>
    </svg></div>
    <div className="print-bottom"><p>Different people.<br/><em>Connected by an idea.</em></p><span className="print-seal"><Icon name="cup" size={25}/></span></div>
  </div>
}
function AboutPage() {
  return <article className="about-story">
    <section className="about-hero shell">
      <div className="about-headline"><h1 className="enter">Our Startup<br/><span>Company.</span></h1><div className="about-lead"><span className="story-mark" aria-hidden="true"><Icon name="star" size={28}/></span><p>Eight people. One shared beginning.<br/>A little fuel for what comes next.</p></div><a className="button dark" href="#our-team">Meet the people <Icon name="arrow"/></a></div>
      <FoundersPrint/>
    </section>
    <div className="about-divider shell"><span>THE PEOPLE BEHIND THE POUR</span><span className="divider-line"/><Icon name="star" size={16}/><span>THIS IS OUR STORY</span></div>
    <section className="about-origin shell"><div><h2>A shake business.<br/>A shared <em>ambition.</em></h2></div><div className="origin-copy"><p className="origin-intro">Aureatine is our protein-shake startup, in partnership with APEX Gym.</p><p>We’re eight people bringing one business idea to life. Our starting point is simple: a shake, a familiar place, and something to look forward to in your everyday routine.</p><p>We’re still at the beginning. This page is a space for the people behind the name, and the company we’re building together.</p><div className="partnership-signature"><span>aureatine</span><span className="signature-cross">×</span><span>APEX gym</span></div></div></section>
    <section className="team-chapter shell" id="our-team"><div className="team-chapter-heading"><div><span className="chapter-chip"><span/> EIGHT PEOPLE, ONE TEAM</span><h2>Meet our<br/><em>common thread.</em></h2></div><p>Every name belongs here.<br/>Together, we’re the people<br/>behind Aureatine x APEX.</p></div><TeamBoard/><div className="board-caption"><span><Icon name="star" size={14}/> Individually ourselves. Better together.</span><span>THE FOUNDING TEAM · 8 PEOPLE</span></div></section>
    <section className="about-intentions shell"><div className="intentions-title"><span className="section-label">WHAT WE’RE BUILDING TOWARD</span><h2>Small rituals.<br/><em>Shared purpose.</em></h2><p>A few ideas to guide our next chapter.<br/>Not milestones. Intentions.</p></div><div className="intentions-list"><details open><summary><span>A welcome, not just a shake.</span><Icon name="plus" size={20}/></summary><p>We want Aureatine to feel approachable. A place in your routine where stopping for a shake can also mean connecting with people.</p></details><details><summary><span>Progress, at your own pace.</span><Icon name="plus" size={20}/></summary><p>Not every day has to be a personal best. Our aim is to be part of the everyday, alongside the big gym-day moments.</p></details><details><summary><span>Built together, from the start.</span><Icon name="plus" size={20}/></summary><p>Eight names sit behind this beginning. As our company develops, this space will grow with our individual stories and the work we do together.</p></details></div></section>
    <section className="about-invitation shell"><div className="invitation-line" aria-hidden="true"/><span className="invitation-icon" aria-hidden="true"><Icon name="cup" size={32}/></span><h2>The next chapter<br/>starts with <em>hello.</em></h2><p>Find us at APEX Fitness Gym in Valenzuela.<br/>Meet the place behind our partnership.</p><div className="invitation-actions"><Link to="/#visit" className="button light">Come find us <Icon name="northeast"/></Link><Link to="/#shakes" className="invitation-secondary">Explore Aureatine <Icon name="arrow" size={17}/></Link></div><div className="invitation-signoff">JUANIE · GIAN · MIKAY · OLIVER · JETHRO · CARL · IVAN · SALAC</div></section>
  </article>
}
function Atmosphere({ paused }) {
  return <div className={paused ? 'atmosphere paused' : 'atmosphere'} aria-hidden="true"><div className="ambient-orbit orbit-one"/><div className="ambient-orbit orbit-two"/><div className="ambient-orbit orbit-three"/><svg className="ambient-lines" viewBox="0 0 1440 1000" preserveAspectRatio="xMidYMid slice"><path d="M-200 780C160 300 410 1110 840 500S1430 240 1700 450"/><path d="M-200 805C160 325 410 1135 840 525S1430 265 1700 475"/><path d="M-200 830C160 350 410 1160 840 550S1430 290 1700 500"/></svg></div>
}
function ScrollTools({ paused, toggle }) {
  const meter = useRef(null)
  const [raised, setRaised] = useState(false)
  useEffect(() => {
    let frame
    const update = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(() => { const height = document.documentElement.scrollHeight - innerHeight; if(meter.current) meter.current.style.transform = `scaleX(${height > 0 ? scrollY / height : 0})`; setRaised(scrollY > 500) }) }
    update(); window.addEventListener('scroll', update, { passive: true }); window.addEventListener('resize', update)
    return () => { cancelAnimationFrame(frame); window.removeEventListener('scroll', update); window.removeEventListener('resize', update) }
  }, [])
  return <><div className="reading-progress" aria-hidden="true"><div ref={meter}/></div><div className="motion-tools"><button className="motion-toggle" onClick={toggle} aria-pressed={paused} aria-label={paused ? 'Enable decorative animations' : 'Pause decorative animations'}><span className={paused ? 'motion-indicator stopped' : 'motion-indicator'}/><span>{paused ? 'Motion off' : 'Motion on'}</span></button>{raised && <button className="back-top" aria-label="Back to top" onClick={() => window.scrollTo({ top: 0, behavior: paused ? 'instant' : 'smooth' })}><Icon name="arrow" size={17}/></button>}</div></>
}
function App() {
  const [page, setPage] = useState(route)
  const [paused, setPaused] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [menu, setMenu] = useState(false)
  const [session, setSession] = useState(null)
  const [balance, setBalance] = useState(null)
  const [notice, setNotice] = useState('')
  const root = useRef(null)
  function go(path) {
    const nextPage = path.split('#')[0] || '/'
    const anchor = path.split('#')[1]
    const update = () => {
      window.history.pushState({}, '', appHref(path))
      flushSync(() => { setPage(nextPage); setMenu(false); setNotice('') })
      if (anchor) document.getElementById(anchor)?.scrollIntoView({ behavior: paused ? 'instant' : 'smooth' })
      else { window.scrollTo({ top: 0, behavior: 'instant' }); document.getElementById('main')?.focus({ preventScroll: true }) }
    }
    if (nextPage !== page && document.startViewTransition && !paused) document.startViewTransition(update)
    else update()
  }
  useEffect(() => { const pop = () => { setPage(route()); setMenu(false) }; window.addEventListener('popstate', pop); return () => window.removeEventListener('popstate', pop) }, [])
  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((event, value) => { setSession(value); setBalance(null); if (event === 'PASSWORD_RECOVERY') { window.history.replaceState({}, '', appHref('/reset-password')); setPage('/reset-password'); setMenu(false); window.scrollTo({ top: 0, behavior: 'instant' }) } })
    return () => data.subscription.unsubscribe()
  }, [])
  useEffect(() => {
    let active = true
    if (session && supabase) supabase.from('wallets').select('points').eq('user_id', session.user.id).single().then(({ data, error }) => { if (active) { setBalance(data?.points ?? null); if (error) setNotice('Your points could not be loaded. Please try again later.') } })
    return () => { active = false }
  }, [session])
  useEffect(() => {
    document.title = `${page === '/about' ? 'Our Startup Company' : page === '/rewards' ? 'Redeemables' : page === '/leaderboard' ? 'Leaderboard' : page.includes('login') ? 'Log in' : 'Protein & purpose'} | Aureatine x APEX`
    if (paused) return
    const ctx = gsap.context(() => {
      gsap.fromTo('.hero-copy .enter', { y: 22 }, { y: 0, duration: .8, stagger: .065, ease: 'power3.out' })
      gsap.fromTo('.hero-image', { clipPath: 'inset(5% 3% 0 3% round 170px 170px 16px 16px)' }, { clipPath: 'inset(0% 0% 0% 0% round 160px 160px 12px 12px)', duration: 1.1, ease: 'power3.out' })
    }, root)
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return
      ctx.add(() => gsap.fromTo(entry.target, { y: 24 }, { y: 0, duration: .7, ease: 'power3.out' }))
      observer.unobserve(entry.target)
    }), { threshold: .12 })
    root.current.querySelectorAll('.section-heading, .shake-feature, .rewards-banner, .team-teaser, .about-origin, .team-chapter-heading, .about-intentions, .team-board, .wallet, .auth-form-wrap').forEach(el => observer.observe(el))
    return () => { observer.disconnect(); ctx.revert() }
  }, [page, paused])
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = e => setPaused(e.matches)
    const key = e => { if (e.key === 'Escape') { setMenu(false); document.querySelector('.menu-button')?.focus() } }
    const visibility = () => document.documentElement.classList.toggle('tab-hidden', document.hidden)
    media.addEventListener('change', update); document.addEventListener('keydown', key); document.addEventListener('visibilitychange', visibility)
    return () => { media.removeEventListener('change', update); document.removeEventListener('keydown', key); document.removeEventListener('visibilitychange', visibility) }
  }, [])

  return <NavigationContext.Provider value={go}><div ref={root} className={paused ? 'site motion-paused' : 'site'}>
    <Atmosphere paused={paused}/>{import.meta.env.VITE_CHAT_ENABLED !== 'false' && <ChatWidget paused={paused}/>}<ScrollTools paused={paused} toggle={() => setPaused(value => !value)}/>
    <a href="#main" className="skip">Skip to content</a>
    <div className="announcement">A little ritual. A stronger you. <span>Meet Aureatine x APEX <Icon name="northeast" size={12}/></span></div>
    <header className="header elevated-nav"><Link to="/" className="wordmark" aria-label="Aureatine x APEX home">aureatine</Link>
      <nav className={menu ? 'nav open' : 'nav'} aria-label="Main navigation"><Link to="/" aria-current={page === '/' ? 'page' : undefined}>Home</Link><Link to="/#shakes">Our shakes</Link><Link to="/about" aria-current={page === '/about' ? 'page' : undefined}>About us</Link><Link to="/#visit">Visit us <Icon name="northeast" size={13}/></Link></nav>
      <div className="nav-actions"><Link to="/leaderboard" className="icon-link leaderboard-nav" aria-current={page === '/leaderboard' ? 'page' : undefined} aria-label="Leaderboard"><Icon name="trophy"/><span>Leaderboard</span></Link><Link to="/rewards" className="icon-link" aria-current={page === '/rewards' ? 'page' : undefined} aria-label="Redeemables and points"><Icon name="gift"/><span>Rewards</span></Link><Link to="/login" className="account-link" aria-current={['/login','/signup','/forgot-password','/reset-password'].includes(page) ? 'page' : undefined} aria-label={session ? 'Your account' : 'Log in'}><Icon name="user"/><span>{session ? 'Account' : 'Log in'}</span></Link><button className="menu-button" aria-label={menu ? 'Close navigation' : 'Open navigation'} aria-expanded={menu} onClick={() => setMenu(!menu)}><Icon name={menu ? 'close' : 'menu'}/></button></div>
    </header>
    <main id="main" tabIndex={-1} key={page}>
    {page !== '/' && <div className="breadcrumb shell"><Link to="/">Home</Link><Icon name="arrow" size={12}/><span>{page === '/about' ? 'Our company' : page === '/rewards' ? 'Rewards' : page === '/leaderboard' ? 'Leaderboard' : page === '/signup' ? 'Create account' : page.includes('password') ? 'Account recovery' : 'Your account'}</span></div>}
    {page === '/' ? <>
      <section className="hero shell"><div className="hero-copy"><div className="little-pill enter"><span/> GOOD ENERGY, GREAT COMPANY</div><h1 className="enter aureatine-title">Aureatine<span className="period">.</span></h1><p className="hero-tag enter">Your next rep.<br/>Your new favorite sip.</p><p className="hero-description enter">From the first lift to the last sip. Meet your new post-workout ritual: protein shakes and a place to belong.</p><div className="hero-buttons enter"><Link to="/#shakes" className="button dark">Meet your next shake <Icon name="northeast"/></Link><Link to="/#visit" className="text-button">Find us at APEX <Icon name="arrow" size={18}/></Link></div><div className="hero-foot enter"><span className="small-round"><Icon name="cup"/></span><p>Made for your everyday.<br/><strong>Not just your gym days.</strong></p></div><p className="hero-partnership enter">In partnership with <a className="partner-facebook" href="https://www.facebook.com/apexfitnessgym" target="_blank" rel="noopener noreferrer" aria-label="APEX Fitness Gym on Facebook (opens in a new tab)">APEX Fitness Gym <Icon name="northeast" size={12}/></a></p></div>
      <div className="hero-image enter"><img src={shakeImage} alt="Concept photograph of chocolate and vanilla protein shakes on a warm stone counter"/><div className="image-top"><span>THE EVERYDAY SHAKE</span><Icon name="star" size={24}/></div><div className="photo-note">A little fuel.<br/><em>A lot of feel-good.</em></div><span className="image-caption">SERVING CONCEPT · AI-GENERATED IMAGE</span><div className="round-seal">SIP. LIFT.<br/><Icon name="star" size={23}/><br/>REPEAT.</div></div></section>
      <div className="ribbon marquee-ribbon" aria-label="Fuel your routine. Find your people. Make it a ritual. Aureatine."><div className="ribbon-track" aria-hidden="true">{[0, 1, 2, 3].map(copy => <div className="ribbon-copy" key={copy}><span>FUEL YOUR ROUTINE</span><Icon name="star"/><span>FIND YOUR PEOPLE</span><Icon name="star"/><span>MAKE IT A RITUAL</span><Icon name="star"/><span>AUREATINE</span><Icon name="star"/></div>)}</div></div>
      <section id="shakes" className="section shell shakes"><div className="section-heading"><div><span className="section-label">THE SHAKE BREAK</span><h2>Good things<br/>come by the cup.</h2></div><p>A pause between the hustle.<br/>Something to look forward to after the lift.<br/>Your shake ritual starts here.</p></div><div className="shake-feature"><div className="shake-crop"><img src={shakeImage} alt="Chocolate and vanilla shake concepts" loading="lazy"/></div><div className="shake-info"><span className="little-pill">A TASTE OF WHAT'S NEXT</span><h3>Big on flavor.<br/>Easy to love.</h3><p>We’re putting together our first shake lineup. Flavors, ingredients, allergen details, and pricing will be shared here when the menu is confirmed.</p><Link to="/#visit" className="text-button">Come meet the team <Icon name="arrow"/></Link><div className="fine-print">Menu coming soon · Product photo is illustrative</div></div></div></section>
      <section className="rewards-banner shell"><div className="rewards-symbol"><Icon name="gift" size={62}/></div><div><span className="section-label">A LITTLE EXTRA, FOR YOU</span><h2>Your routine.<br/>With rewards.</h2><p>A home for your points and the perks to come.</p></div><Link to="/rewards" className="button light">Explore redeemables <Icon name="northeast"/></Link></section>
      <section id="visit" className="section shell visit"><div className="section-heading"><div><span className="section-label">MORE THAN A SHAKE STOP</span><h2>See you at APEX.</h2></div><p>A space for movement, a moment to recharge.<br/>Come for your routine. Stay for the company.</p></div><div className="visit-grid"><div className="map-frame"><iframe title="APEX Fitness Gym Google Maps location in Valenzuela" src="https://www.google.com/maps?q=APEX%20Fitness%20Gym%2C%20B-Hive%20Plaza%2C%20108%20Corner%20Santolan%20Rd%2C%20Gen.%20T.%20de%20Leon%2C%20Valenzuela&output=embed" loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen /><a className="map-fallback" href="https://maps.app.goo.gl/T6mfqiiSYcEpShZA7" target="_blank" rel="noopener noreferrer">Open exact gym listing in Google Maps <Icon name="northeast" size={15}/></a></div><div className="visit-details"><h3>Aureatine x APEX</h3><p>Protein shakes. Gym-day rituals.<br/>A community in the making.</p><div className="detail-row"><Icon name="pin"/><div><strong>Find our space</strong><p>B-Hive Plaza, 108 Corner Santolan Rd, Gen. T. de Leon, Valenzuela, Metro Manila.</p><a className="text-button" href="https://maps.app.goo.gl/T6mfqiiSYcEpShZA7" target="_blank" rel="noopener noreferrer">Get directions &amp; check hours <Icon name="northeast" size={15}/></a></div></div><div className="detail-row"><Icon name="star"/><div><strong>Real voices. Real visits.</strong><p>See what visitors say about APEX Fitness Gym. Read current ratings and reviews directly on its Google listing.</p><a className="button outline google-reviews-link" href="https://www.google.com/maps?cid=7131569850007852016" target="_blank" rel="noopener noreferrer">Read reviews on Google <Icon name="northeast" size={16}/></a><p className="review-disclosure">Opens Google Maps in a new tab. Selected review excerpts appear below; visit Google for current reviews.</p></div></div></div></div><GoogleReviews/></section>
      <section className="team-teaser shell"><span className="section-label">BUILT BY PEOPLE, FOR PEOPLE</span><h2>Eight people.<br/>One shared beginning.</h2><Link to="/about" className="button outline">Meet our startup company <Icon name="northeast"/></Link><div className="initials" aria-hidden="true">{['J','G','M','O','J','C','I','S'].map((n,i) => <span key={i}>{n}</span>)}</div></section>
    </> : page === '/about' ? <AboutPage/> : page === '/rewards' ? <RewardsPage Icon={Icon} Link={Link} session={session} balance={balance} notice={notice}/> : page === '/leaderboard' ? <LeaderboardPage Icon={Icon} Link={Link} session={session}/> : ['/login','/signup','/forgot-password','/reset-password'].includes(page) ? <Auth key={page} page={page} go={go} session={session}/> : <section className="section shell"><h1 className="page-title">A little off track.</h1><p>We couldn’t find that page.</p><Link to="/" className="button dark">Back home <Icon name="arrow"/></Link></section>}
    </main><footer className="footer"><div className="footer-top shell"><Link to="/" className="wordmark">aureatine</Link><p>Fuel for your routine.<br/>People for your journey.</p><div><Link to="/about">Our company</Link><Link to="/#visit">Visit us</Link><Link to="/leaderboard">Leaderboard</Link><Link to="/rewards">Redeemables</Link></div><Link to="/login" className="text-button">Your account <Icon name="northeast"/></Link></div><div className="footer-bottom shell"><span>© {year} Aureatine x APEX</span><span>A shared beginning. A stronger everyday.</span></div></footer>
  </div></NavigationContext.Provider>
}
function Auth({ page, go, session }) {
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [show, setShow] = useState(false)
  const signup = page === '/signup', forgot = page === '/forgot-password', reset = page === '/reset-password'
  async function submit(e) {
    e.preventDefault(); setMessage('')
    if (!supabase) { setMessage('Accounts are not connected yet. Please check back once secure sign-in is enabled.'); return }
    const values = new FormData(e.currentTarget), email = values.get('email'), password = values.get('password')
    if ((signup || reset) && password !== values.get('confirm')) { setMessage('Your passwords do not match. Please try again.'); return }
    setBusy(true)
    try {
      let result
      const base = window.location.origin
      if (forgot) result = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${base}${appHref('/reset-password')}` })
      else if (reset) result = await supabase.auth.updateUser({ password })
      else if (signup) result = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${base}${appHref('/login')}`, data: { full_name: values.get('name') } } })
      else result = await supabase.auth.signInWithPassword({ email, password })
      if (result.error) throw result.error
      if (forgot) setMessage('If an account exists for that email, a reset link will arrive shortly. Check your inbox and spam folder.')
      else if (reset) { setMessage('Password updated. You can now access your account.') }
      else if (signup && !result.data.session) setMessage('Check your email to confirm your account before logging in.')
      else go('/rewards')
    } catch (error) { setMessage(error.message || 'Something went wrong. Please try again.') } finally { setBusy(false) }
  }
  async function logout() { setBusy(true); const { error } = await supabase.auth.signOut(); setBusy(false); if (error) setMessage(error.message); else go('/login') }
  return <section className="auth-layout shell"><div className="auth-art"><img src={shakeImage} alt="Protein-shake serving concept"/><div><h2>A familiar face.<br/>A favorite ritual.</h2><p>Your place in the Aureatine x APEX community.</p></div></div><div className="auth-form-wrap">{session && !reset ? <><span className="section-label">YOUR ACCOUNT</span><h1>You’re right<br/>where you belong.</h1><p className="account-email">{session.user.email}</p><Link to="/rewards" className="button dark">View your points <Icon name="arrow"/></Link><button className="text-button signout" onClick={logout} disabled={busy}>Sign out</button></> : <><span className="section-label">AUREATEIN × APEX</span><h1>{signup ? 'Find your people.' : forgot ? 'Let’s get you back.' : reset ? 'A fresh start.' : 'Welcome back.'}</h1><p>{signup ? 'Create your account and be part of what comes next.' : forgot ? 'Enter your email and we’ll send you a secure reset link.' : reset ? 'Choose a new password for your account.' : 'Your next chapter starts with a little fuel.'}</p>{!supabase && <div className="connection-note"><Icon name="user" size={18}/><span>Secure accounts are coming soon. Backend connection is pending.</span></div>}<form onSubmit={submit} key={page}>{signup && <label>Your name<input name="name" autoComplete="name" placeholder="How should we call you?" required maxLength={80}/></label>}{!reset && <label>Email address<input name="email" type="email" autoComplete="email" placeholder="you@example.com" required/></label>}{!forgot && <><label htmlFor="account-password">Password<div className="password-input"><input id="account-password" aria-label="Password" name="password" type={show ? 'text' : 'password'} autoComplete={signup || reset ? 'new-password' : 'current-password'} placeholder={signup || reset ? 'At least 12 characters' : 'Enter your password'} minLength={signup || reset ? 12 : undefined} required/><button type="button" onClick={() => setShow(!show)} aria-label={show ? 'Hide password' : 'Show password'}>{show ? 'Hide' : 'Show'}</button></div></label>{(signup || reset) && <label>Confirm password<input name="confirm" type={show ? 'text' : 'password'} autoComplete="new-password" required minLength={12} placeholder="Enter it once more"/></label>}</>}{!signup && !forgot && !reset && <Link to="/forgot-password" className="forgot-link">Forgot password?</Link>}<button className="button dark form-submit" type="submit" disabled={busy}>{busy ? 'One moment…' : signup ? 'Create account' : forgot ? 'Send reset link' : reset ? 'Update password' : 'Log in'}<Icon name="arrow"/></button></form><p className="account-assurance"><Icon name="check" size={14}/> Passwords handled securely by Supabase when connected.</p><div className="auth-switch">{signup ? <>Already part of the crew? <Link to="/login">Log in</Link></> : forgot || reset ? <Link to="/login">Back to log in</Link> : <>New around here? <Link to="/signup">Sign up</Link></>}</div></>}{message && <output className="form-message">{message}</output>}</div></section>
}
createRoot(document.getElementById('root')).render(<React.StrictMode><App/></React.StrictMode>)
