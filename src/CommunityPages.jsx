import { useEffect, useRef, useState } from 'react'
import { supabase } from './supabase'
import RedeemableCatalog from './RedeemableCatalog'
import OwnRanking from './OwnRanking'
import LeaderboardAvatar from './LeaderboardAvatar'
import { RankCorner } from './RankFrame'
import { rankByTitle } from './ranks'
import LeaderboardMemberProfile from './LeaderboardMemberProfile'
import {LabelBadges, labelsOf} from './memberLabels'
import { basePath } from './urls'
import './leaderboardHow.css'

export function RewardsPage({ Icon, Link, session, balance, notice, onBalanceChange }) {
  const [guide, setGuide] = useState(false)
  const [section, setSection] = useState('rewards')
  return <article className="club-page shell">
    <header className="club-heading"><div><div className="club-kicker"><Icon name="gift" size={16}/> THE Aureatine CLUB</div><h1>A little more<br/><em>to look forward to.</em></h1><p>Your Aurels. Your future perks. All in one place.</p></div><Link to="/leaderboard" className="button outline"><Icon name="trophy" size={18}/> Explore the leaderboard <Icon name="northeast" size={16}/></Link></header>
    <div className="rewards-dashboard"><section className="balance-card" aria-labelledby="balance-title"><div className="balance-top"><span id="balance-title">YOUR AURELS BALANCE</span><span className="wallet-status"><span/>{session ? 'Member account' : 'Sign in to connect'}</span></div><div className="balance-amount"><img className="aurel-coin" src="/images/aurel-coin.png" alt="" width="40" height="40"/><strong>{session && balance !== null ? balance.toLocaleString() : '—'}</strong><span>Aurels</span><button className="balance-plus" aria-label="How to earn points" aria-expanded={guide} aria-controls="points-guide" onClick={() => setGuide(value => !value)}><Icon name={guide ? 'close' : 'plus'}/></button></div><p>{session ? balance === null ? 'Your verified balance is not available yet.' : 'Your balance is verified by the business, never self-added.' : 'Your next ritual starts with an account.'}</p><div className="balance-bottom"><span><Icon name="check" size={14}/> Verified Aurels only</span>{session ? <Link to="/profile">Your profile & QR <Icon name="arrow" size={16}/></Link> : <Link to="/login" className="wallet-login">Log in <Icon name="arrow" size={16}/></Link>}</div></section>
      <aside className="club-side"><div className="club-side-icon"><Icon name="cup" size={30}/></div><span className="club-kicker">GOOD THINGS TAKE A LITTLE TIME</span><h2>Your favorites.<br/>With a little extra.</h2><p>One QR code for gym visits at APEX and purchases at Aureatine. Both earn Aurels.</p><span className="status-chip"><span/> Getting ready for you</span></aside></div>
    {guide && <section className="points-explainer" id="points-guide"><div><Icon name="plus" size={22}/><h2>How can I add Aurels?</h2></div><p>Show your account QR to APEX staff when you visit the gym, or to Aureatine staff after a purchase. Staff scans add Aurels to your account. You earn 10 Aurels per verified APEX visit and 1 Aurel per ₱5 spent at Aureatine, rounded down.</p></section>}
    {notice && <output className="form-message">{notice}</output>}
    <div className="club-section-bar"><div className="club-switch" aria-label="Rewards sections"><button aria-pressed={section === 'rewards'} onClick={() => setSection('rewards')}>Redeemables</button><button aria-pressed={section === 'guide'} onClick={() => setSection('guide')}>How it works</button></div><span className="subtle-status">No active offers yet</span></div>
    {section === 'rewards' ? <RedeemableCatalog session={session} balance={balance} onBalanceChange={onBalanceChange}><section className="catalog-empty"><div className="flying-reward modern-flight" aria-hidden="true"><svg viewBox="0 0 320 210" fill="none" className="rocket-person">
<defs><linearGradient id="flight-visor" x1="222" y1="73" x2="246" y2="101" gradientUnits="userSpaceOnUse"><stop stopColor="#7F5539"/><stop offset="1" stopColor="#7F5539"/></linearGradient><linearGradient id="flight-suit" x1="140" y1="91" x2="197" y2="128" gradientUnits="userSpaceOnUse"><stop stopColor="#6B4A38"/><stop offset="1" stopColor="#6B4A38"/></linearGradient><linearGradient id="flight-trail-fade"><stop stopColor="white" stopOpacity="0"/><stop offset=".25" stopColor="white"/><stop offset=".8" stopColor="white"/><stop offset="1" stopColor="white" stopOpacity="0"/></linearGradient><mask id="flight-speed-mask"><rect width="320" height="210" fill="url(#flight-trail-fade)"/></mask><linearGradient id="flight-plume"><stop stopColor="#6B4A38" stopOpacity="0"/><stop offset=".65" stopColor="#6B4A38" stopOpacity=".6"/><stop offset="1" stopColor="#6B4A38"/></linearGradient></defs>
<g className="continuous-speed" mask="url(#flight-speed-mask)" stroke="#6B4A38" strokeLinecap="round"><path d="M0 58h320"/><path d="M0 147h320"/><path d="M0 175h320"/><path d="M0 36h320"/></g>
<g className="modern-pilot">
<g className="thruster-wake"><path d="M128 75C99 69 47 80 22 80c31 3 70 8 106 5Z" fill="url(#flight-plume)"/><path d="M128 89C97 84 67 92 37 94c38 1 65 7 91 4Z" fill="url(#flight-plume)"/><path className="plume-core" d="m128 77-48 3 48 3M128 91l-37 3 37 2" fill="#6B4A38"/></g>
<g className="pilot-leg pilot-leg-back"><path d="m165 110-39 9-27-7-17 3-6 7 23 5 28 3 44-9Z" fill="#4A2F20"/><path d="m124 120 3 8" stroke="#6B4A38" strokeWidth="3" strokeLinecap="round"/><g className="pilot-boot pilot-boot-back"><path d="m97 113-18-4-12 5 1 8 22 5 7-5Z" fill="#4A2F20"/></g></g>
<g className="pilot-leg pilot-leg-front"><path d="m159 123-30 11-37-1-16 5 1 6 46 3 16-2 35-14Z" fill="#6B4A38"/><path d="M128 135l4 9" stroke="#6B4A38" strokeWidth="3" strokeLinecap="round"/><g className="pilot-boot pilot-boot-front"><path d="m93 133-20 1-12 7 2 7 29-1 7-6Z" fill="#4A2F20"/></g></g>
<path d="M155 95c15-6 32-5 47 1l14 11-9 15-29 10c-16 4-31-3-32-13-1-9 2-18 9-24Z" fill="url(#flight-suit)"/>
<path d="m169 97 5 32" stroke="#4A2F20" strokeWidth="6"/><path d="m178 96 4 29" stroke="#6B4A38" strokeWidth="1.5"/>
<path d="M182 104c4-5 11-5 17-1l15 10 20-3 4 8-26 6-25-9c-6-2-8-6-5-11Z" fill="#6B4A38"/>
<path d="m230 109 12-2c5-1 9 2 8 6l-4 6-12 1Z" fill="#4A2F20"/><path d="m239 111 5 1" stroke="#6B4A38" strokeWidth="1.5" strokeLinecap="round"/>
<path d="m204 95 14-5 8 12-13 10-11-5Z" fill="#4A2F20"/>
<rect x="126" y="69" width="47" height="17" rx="8.5" fill="#4A2F20"/><rect x="129" y="85" width="44" height="17" rx="8.5" fill="#6B4A38"/>
<path d="M141 74h23M144 90h18" stroke="#6B4A38" strokeWidth="2.5" strokeLinecap="round"/>
<path d="M126 73v9M129 89v9" stroke="#4A2F20" strokeWidth="5" strokeLinecap="round"/>
<rect x="168" y="74" width="9" height="22" rx="4.5" fill="#4A2F20"/>
<path d="M215 66c11-4 26 1 30 12 3 8 2 19-4 25l-13 4-15-7-7-12c-2-10 0-18 9-22Z" fill="#6B4A38"/>
<path d="M216 68c9-3 20-1 25 6" stroke="#6B4A38" strokeWidth="2.5" strokeLinecap="round"/>
<path d="m227 76 18 3c4 1 6 6 5 10l-3 8-18-1c-9-1-11-15-2-20Z" fill="url(#flight-visor)"/>
<path d="m229 79 14 3" stroke="#6B4A38" strokeWidth="1.8" strokeLinecap="round" opacity=".65"/>
<circle cx="217" cy="90" r="6" fill="#4A2F20" stroke="#6B4A38" strokeWidth="1.5"/><circle cx="217" cy="90" r="2" fill="#6B4A38"/>
<path d="m219 99 8 5 10-1" stroke="#4A2F20" strokeWidth="3" strokeLinecap="round"/>
<path d="m190 120 5-2" stroke="#6B4A38" strokeWidth="3" strokeLinecap="round"/>
</g></svg></div><div><span className="club-kicker">THE NEXT GOOD THING</span><h2>Perks worth the wait.</h2><p>Our first rewards are coming soon.</p><div className="catalog-actions">{!session ? <Link to="/signup" className="button dark">Create your account <Icon name="arrow" size={17}/></Link> : <Link to="/leaderboard" className="button dark">Visit the leaderboard <Icon name="arrow" size={17}/></Link>}<button className="text-button" onClick={() => setSection('guide')}>See how it works <Icon name="arrow" size={17}/></button></div></div></section></RedeemableCatalog> : <section className="reward-steps"><div><span className="step-marker">1</span><h3>One account. Your own QR.</h3><p>Create and confirm your account. Your personal QR code will be in your account.</p><Link to={session ? '/profile' : '/signup'} className="text-button">{session ? 'Open your account' : 'Create an account'} <Icon name="arrow" size={15}/></Link><span className="step-state">Coming soon</span></div><div><span className="step-marker">2</span><h3>Show it. Scan it. Earn Aurels.</h3><p>Show your QR code to staff. Gym visits and shake purchases both earn Aurels.</p><div className="scan-partners"><div><span className="scan-partner-icon"><Icon name="qr" size={20}/></span><p><strong>APEX Fitness Gym</strong><span>Gym staff scan your QR to record your visit and award gym Aurels.</span></p></div><div><span className="scan-partner-icon"><Icon name="cup" size={20}/></span><p><strong>Aureatine</strong><span>Staff scan your QR after your purchase to award purchase Aurels.</span></p></div></div><span className="step-state">Coming soon</span></div><div><span className="step-marker">3</span><h3>A new month. More to earn.</h3><p>Join monthly events to earn rewards. Each event will list its schedule and rules.</p><span className="monthly-event-note"><Icon name="calendar" size={18}/><span>Monthly events from the Aureatine × APEX community</span></span><span className="step-state">Details coming soon</span></div></section>}
    <section className="community-bridge"><div className="bridge-icon"><Icon name="trophy" size={31}/></div><div><h2>A little friendly motivation.</h2><p>Meet the community leaderboard. Participation is optional.</p></div><Link to="/leaderboard" className="text-button">View leaderboard <Icon name="northeast"/></Link></section>
    <div className="club-footnote"><Icon name="check" size={14}/><p>Opening this page never adds Aurels automatically.</p></div>
  </article>
}

const PAGE_SIZE = 20
export function LeaderboardPage({ Icon, Link, session }) {
  const [selectedMember, setSelectedMember] = useState(null)
  const profileTrigger = useRef(null)
  function openProfile(entry, event) { profileTrigger.current = event.currentTarget; setSelectedMember(entry) }
  function closeProfile() { setSelectedMember(null); requestAnimationFrame(() => profileTrigger.current?.focus({ preventScroll: true })) }
  const [entries, setEntries] = useState([])
  const [total, setTotal] = useState(0)
  const [moreLoading, setMoreLoading] = useState(false)
  const [loading, setLoading] = useState(Boolean(supabase))
  const [error, setError] = useState('')
  const [refresh, setRefresh] = useState(0)
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  // Paged leaderboard: the server returns 20 members at a time and runs the name search.
  useEffect(() => {
    if (!supabase) return
    let active = true
    const timer = setTimeout(() => {
      setLoading(true); setError('')
      supabase.rpc('get_leaderboard_entries', { p_limit: PAGE_SIZE, p_offset: 0, p_search: search.trim() }).then(({ data, error: queryError }) => {
        if (!active) return
        setLoading(false)
        if (queryError) { setError('The leaderboard is not available yet. Please try again later.'); setEntries([]); setTotal(0) }
        else { setEntries(data ?? []); setTotal(data?.[0]?.total_count ?? 0); setError('') }
      }).catch(() => { if (active) { setLoading(false); setError('We could not reach the leaderboard. Please try again.') } })
    }, search ? 300 : 0)
    return () => { active = false; clearTimeout(timer) }
  }, [refresh, session?.user?.id, search])
  // Live list: re-read the first pages every 20 seconds, keeping the pages already loaded.
  const shownCount = useRef(0), searchNow = useRef(search)
  shownCount.current = entries.length
  searchNow.current = search
  useEffect(() => {
    if (!supabase) return
    const tick = async () => {
      if (document.hidden) return
      const term = searchNow.current.trim()
      const limit = Math.min(50, Math.max(PAGE_SIZE, shownCount.current))
      try {
        const { data, error: queryError } = await supabase.rpc('get_leaderboard_entries', { p_limit: limit, p_offset: 0, p_search: term })
        if (queryError || !data || term !== searchNow.current.trim()) return
        setEntries(data); setTotal(data[0]?.total_count ?? 0)
      } catch { /* keep the list on screen; the next tick tries again */ }
    }
    const id = setInterval(tick, 20000)
    document.addEventListener('visibilitychange', tick)
    window.addEventListener('focus', tick)
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', tick); window.removeEventListener('focus', tick) }
  }, [session?.user?.id])
  async function loadMore() {
    if (!supabase || moreLoading) return
    setMoreLoading(true)
    try {
      const { data, error: queryError } = await supabase.rpc('get_leaderboard_entries', { p_limit: PAGE_SIZE, p_offset: entries.length, p_search: search.trim() })
      if (queryError) throw queryError
      setEntries(current => [...current, ...(data ?? [])])
      setTotal(data?.[0]?.total_count ?? total)
    } catch { setMessage('More members could not load. Please try again.') } finally { setMoreLoading(false) }
  }
  function reload() { if (!supabase) return; setLoading(true); setError(''); setRefresh(value => value + 1) }
  async function join(event) {
    event.preventDefault()
    if (!session || !supabase) return
    setSaving(true); setMessage('')
    try {
      const { error: saveError } = await supabase.rpc('set_leaderboard_participation', { p_opted_in: true })
      if (saveError) throw saveError
      setMessage('Your profile display name and verified Aurels are now included. You can leave at any time.'); reload()
    } catch { setMessage('We could not update your participation. Please try again after leaderboard setup is complete.') } finally { setSaving(false) }
  }
  async function leave() {
    if (!session || !supabase) return
    setSaving(true); setMessage('')
    try {
      const { error: saveError } = await supabase.rpc('set_leaderboard_participation', { p_opted_in: false })
      if (saveError) throw saveError
      setMessage('You are not publicly listed. Your private Aurels balance is unchanged.'); reload()
    } catch { setMessage('We could not update your participation. Please try again.') } finally { setSaving(false) }
  }
  const filtered = entries
  return <article className="club-page leaderboard-page shell"><header className="club-heading"><div><div className="club-kicker"><Icon name="trophy" size={16}/> THE Aureatine COMMUNITY</div><h1>The community<br/><em>leaderboard.</em></h1><p>Standings are based on verified Aurels. Select a member to see their profile.</p></div><Link to="/rewards" className="button outline">Your rewards <Icon name="gift" size={18}/></Link></header>
    <section className="leaderboard-how" aria-labelledby="how-heading"><figure className="leaderboard-video"><video src={`${basePath}videos/leaderboard-promo.mp4`} poster={`${basePath}videos/leaderboard-promo-poster.jpg`} aria-label="Short walkthrough: show your QR, finish tasks for Aurels and EXP, climb five ranks, then the monthly top 3" autoPlay loop muted playsInline preload="metadata" disablePictureInPicture/></figure><div className="leaderboard-how-copy"><span className="club-kicker">HOW IT WORKS</span><h2 id="how-heading">Scan. Earn.<br/>Climb.</h2><ol className="leaderboard-steps"><li><span>1</span><div><h3>Show your QR</h3><p>Staff scan your account at APEX Fitness Gym for visits and at Aureatine after purchases.</p></div></li><li><span>2</span><div><h3>Finish tasks</h3><p>Each task adds Aurels and EXP. EXP is lifetime, so redeeming never lowers your rank.</p></div></li><li><span>3</span><div><h3>Make the monthly board</h3><p>Top 3 every month receive rewards. Reward details coming soon.</p></div></li></ol><p className="leaderboard-how-note">Sample names, points, and account are for illustration.</p></div></section>
    <section className="leaderboard-intro"><div className="leaderboard-art" aria-hidden="true"><Icon name="trophy" size={70}/><span className="laurel-orbit"/></div><div><span className="club-kicker">RANKED BY VERIFIED AUREL</span><h2>Friendly competition.</h2><p>Ranks use verified Aurels, not gym performance. Pick any display name. Your email is never shown.</p></div><div className="ranking-scope"><Icon name="check" size={17}/><span>Current Aurels</span><small>Opt-in members only</small></div></section>
    <OwnRanking userId={session?.user?.id} refresh={refresh} Link={Link}/>
    <section className="ranking-panel" aria-labelledby="ranking-heading"><div className="ranking-toolbar"><div><h2 id="ranking-heading">Community standings</h2><span>Opted-in members · Equal Aurels share a rank · Updates automatically</span></div><button className="refresh-button" onClick={reload} disabled={loading || !supabase} aria-label="Refresh leaderboard"><Icon name="refresh" size={17}/>{loading ? 'Loading' : 'Refresh'}</button></div><div className="ranking-filter"><label><Icon name="search" size={17}/><input type="search" placeholder="Find a display name" aria-label="Search leaderboard display names" value={search} onChange={event => setSearch(event.target.value)}/></label><span className="status-chip"><span/>{!supabase ? 'Awaiting connection' : loading ? 'Loading standings' : error ? 'Unavailable' : `${total} listed ${total === 1 ? 'member' : 'members'}`}</span></div>
    <div className="rank-table"><table><thead><tr><th scope="col">Rank</th><th scope="col">Member</th><th scope="col">Verified Aurels</th></tr></thead><tbody>{!loading && !error && filtered.map((entry, i) => <tr key={`${entry.display_name}-${entry.rank}-${i}`} className={entry.is_current_user ? 'is-current-member' : undefined} aria-label={entry.is_current_user ? 'Your leaderboard row' : undefined}><td><span className={entry.rank <= 3 ? 'rank-number top-rank' : 'rank-number'}>{entry.rank}</span></td><td><button className="leaderboard-member-trigger" aria-label={`View ${entry.display_name}'s profile`} aria-haspopup="dialog" onClick={event => openProfile(entry, event)}><span className="rank-corner-wrap"><LeaderboardAvatar name={entry.display_name} path={entry.leaderboard_avatar_path}/><RankCorner rank={rankByTitle(entry.rank_title, entry.exp)}/></span><span>{entry.display_name}</span></button><div className="leaderboard-badges"><span className="rank-title-chip">{rankByTitle(entry.rank_title, entry.exp).title}</span><LabelBadges isAdmin={entry.is_admin} labels={labelsOf(entry)}/>{entry.is_current_user && <span className="leaderboard-you-badge">You</span>}</div></td><td>{Number(entry.points).toLocaleString()} <span>Aurels</span></td></tr>)}</tbody></table>
    {!loading && !error && entries.length < total && <div className="leaderboard-more"><p>Showing {entries.length} of {total} members</p><button className="button outline" onClick={loadMore} disabled={moreLoading}>{moreLoading ? 'Loading…' : 'Show more members'}</button></div>}
    {(loading || error || filtered.length === 0) && <div className="ranking-empty" aria-live="polite"><span className="empty-ranking-icon"><Icon name={search ? 'search' : 'trophy'} size={33}/></span><h3>{loading ? 'Gathering the standings…' : error ? 'Let’s try again soon.' : search ? 'No matching members.' : 'Every community starts somewhere.'}</h3><p>{loading ? 'Loading the leaderboard…' : error || (search ? 'Try another display name or clear your search.' : !supabase ? 'The leaderboard will open when secure accounts and Aurels are connected. No sample rankings, just real people when we’re ready.' : 'No members have opted in yet. Choose to join below to be included.')}</p>{search && <button className="text-button" onClick={() => setSearch('')}>Clear search <Icon name="close" size={15}/></button>}</div>}</div></section>
    <section className="leaderboard-join" id="leaderboard-join"><div><span className="club-kicker">OPTIONAL</span><h2>Join the board.</h2><p>Your display name and Aurels show publicly. Your photo only appears if you turn on photo sharing. Signed-in members can open your shared profile. You can leave anytime.</p><Link to="/rewards" className="text-button">Explore rewards <Icon name="arrow" size={17}/></Link></div><div className="join-controls">{session ? <><form onSubmit={join}><p>Your current profile display name will appear here. Updating it in your profile also updates the leaderboard.</p><Link to="/profile" className="text-button">Edit my display name ↗</Link><label className="consent-label"><input type="checkbox" required/> I agree to show my current profile display name and verified Aurels publicly.</label><button className="button dark" disabled={saving}>{saving ? 'Saving…' : 'Join leaderboard'}<Icon name="arrow" size={16}/></button></form><button className="text-button" disabled={saving} onClick={leave}>Remove me from the leaderboard</button></> : <><Icon name="user" size={26}/><h3>Your community starts here.</h3><p>Log in to manage your participation.<br/>An account never opts you in automatically.</p><div className="join-account-actions"><Link to="/login" className="button dark">Log in to participate <Icon name="arrow" size={17}/></Link><Link to="/signup" className="text-button">New here? Create an account <Icon name="northeast" size={15}/></Link></div></>}{message && <output className="form-message">{message}</output>}</div></section>
    {selectedMember && <LeaderboardMemberProfile member={selectedMember} session={session} Link={Link} onClose={closeProfile}/>}
  </article>
}
