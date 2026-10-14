import { useEffect, useRef, useState } from 'react'
import { supabase } from './supabase'
import RedeemableCatalog from './RedeemableCatalog'
import OwnRanking from './OwnRanking'
import LeaderboardAvatar from './LeaderboardAvatar'
import LeaderboardMemberProfile from './LeaderboardMemberProfile'
import {LabelBadges} from './memberLabels'

export function RewardsPage({ Icon, Link, session, balance, notice, onBalanceChange }) {
  const [guide, setGuide] = useState(false)
  const [section, setSection] = useState('rewards')
  return <article className="club-page shell">
    <header className="club-heading"><div><div className="club-kicker"><Icon name="gift" size={16}/> THE Aureatine CLUB</div><h1>A little more<br/><em>to look forward to.</em></h1><p>Your points. Your future perks. All in one place.</p></div><Link to="/leaderboard" className="button outline"><Icon name="trophy" size={18}/> Explore the leaderboard <Icon name="northeast" size={16}/></Link></header>
    <div className="rewards-dashboard"><section className="balance-card" aria-labelledby="balance-title"><div className="balance-top"><span id="balance-title">YOUR POINTS BALANCE</span><span className="wallet-status"><span/>{session ? 'Member account' : 'Sign in to connect'}</span></div><div className="balance-amount"><span className="reward-coin"><Icon name="star" size={27}/></span><strong>{session && balance !== null ? balance.toLocaleString() : '—'}</strong><span>points</span><button className="balance-plus" aria-label="How to earn points" aria-expanded={guide} aria-controls="points-guide" onClick={() => setGuide(value => !value)}><Icon name={guide ? 'close' : 'plus'}/></button></div><p>{session ? balance === null ? 'Your verified balance is not available yet.' : 'Your balance is verified by the business, never self-added.' : 'Your next ritual starts with an account.'}</p><div className="balance-bottom"><span><Icon name="check" size={14}/> Verified points only</span>{session ? <Link to="/profile">Your profile & QR <Icon name="arrow" size={16}/></Link> : <Link to="/login" className="wallet-login">Log in <Icon name="arrow" size={16}/></Link>}</div></section>
      <aside className="club-side"><div className="club-side-icon"><Icon name="cup" size={30}/></div><span className="club-kicker">GOOD THINGS TAKE A LITTLE TIME</span><h2>Your favorites.<br/>With a little extra.</h2><p>One personal QR for gym visits at APEX and purchases at Aureatine. Both earn points, with monthly events offering more opportunities for rewards.</p><span className="status-chip"><span/> Getting ready for you</span></aside></div>
    {guide && <section className="points-explainer" id="points-guide"><div><Icon name="plus" size={22}/><h2>How can I add points?</h2></div><p>Show your account QR to APEX staff when you visit the gym, or to Aureatine staff after a purchase. Staff scans will award points to your account once the system is connected. Configured earning rules: 10 points per verified APEX visit and 1 point per ₱5 spent at Aureatine, rounded down. Database activation is still required. This plus button only explains the process; it cannot add points.</p><span>The points symbol is a temporary SVG until the final icon is supplied.</span></section>}
    {notice && <output className="form-message">{notice}</output>}
    <div className="club-section-bar"><div className="club-switch" aria-label="Rewards sections"><button aria-pressed={section === 'rewards'} onClick={() => setSection('rewards')}>Redeemables <span>Coming soon</span></button><button aria-pressed={section === 'guide'} onClick={() => setSection('guide')}>How it works</button></div><span className="subtle-status">No active offers yet</span></div>
    {section === 'rewards' ? <RedeemableCatalog session={session} balance={balance} onBalanceChange={onBalanceChange}><section className="catalog-empty"><div className="flying-reward modern-flight" aria-hidden="true"><svg viewBox="0 0 320 210" fill="none" className="rocket-person">
<defs><linearGradient id="flight-visor" x1="222" y1="73" x2="246" y2="101" gradientUnits="userSpaceOnUse"><stop stopColor="#6f583e"/><stop offset="1" stopColor="#3f362b"/></linearGradient><linearGradient id="flight-suit" x1="140" y1="91" x2="197" y2="128" gradientUnits="userSpaceOnUse"><stop stopColor="#d8c2a3"/><stop offset="1" stopColor="#b59163"/></linearGradient><linearGradient id="flight-trail-fade"><stop stopColor="white" stopOpacity="0"/><stop offset=".25" stopColor="white"/><stop offset=".8" stopColor="white"/><stop offset="1" stopColor="white" stopOpacity="0"/></linearGradient><mask id="flight-speed-mask"><rect width="320" height="210" fill="url(#flight-trail-fade)"/></mask><linearGradient id="flight-plume"><stop stopColor="#d8bd96" stopOpacity="0"/><stop offset=".65" stopColor="#d2ad79" stopOpacity=".6"/><stop offset="1" stopColor="#f3deb9"/></linearGradient></defs>
<g className="continuous-speed" mask="url(#flight-speed-mask)" stroke="#c5aa85" strokeLinecap="round"><path d="M0 58h320"/><path d="M0 147h320"/><path d="M0 175h320"/><path d="M0 36h320"/></g>
<g className="modern-pilot">
<g className="thruster-wake"><path d="M128 75C99 69 47 80 22 80c31 3 70 8 106 5Z" fill="url(#flight-plume)"/><path d="M128 89C97 84 67 92 37 94c38 1 65 7 91 4Z" fill="url(#flight-plume)"/><path className="plume-core" d="m128 77-48 3 48 3M128 91l-37 3 37 2" fill="#f4ddb6"/></g>
<g className="pilot-leg pilot-leg-back"><path d="m165 110-39 9-27-7-17 3-6 7 23 5 28 3 44-9Z" fill="#9b784e"/><path d="m124 120 3 8" stroke="#e2cfad" strokeWidth="3" strokeLinecap="round"/><g className="pilot-boot pilot-boot-back"><path d="m97 113-18-4-12 5 1 8 22 5 7-5Z" fill="#715a40"/></g></g>
<g className="pilot-leg pilot-leg-front"><path d="m159 123-30 11-37-1-16 5 1 6 46 3 16-2 35-14Z" fill="#b28e60"/><path d="M128 135l4 9" stroke="#e2cfad" strokeWidth="3" strokeLinecap="round"/><g className="pilot-boot pilot-boot-front"><path d="m93 133-20 1-12 7 2 7 29-1 7-6Z" fill="#806347"/></g></g>
<path d="M155 95c15-6 32-5 47 1l14 11-9 15-29 10c-16 4-31-3-32-13-1-9 2-18 9-24Z" fill="url(#flight-suit)"/>
<path d="m169 97 5 32" stroke="#8d6d48" strokeWidth="6"/><path d="m178 96 4 29" stroke="#ebdac0" strokeWidth="1.5"/>
<path d="M182 104c4-5 11-5 17-1l15 10 20-3 4 8-26 6-25-9c-6-2-8-6-5-11Z" fill="#d9c2a0"/>
<path d="m230 109 12-2c5-1 9 2 8 6l-4 6-12 1Z" fill="#8c704f"/><path d="m239 111 5 1" stroke="#d7bd96" strokeWidth="1.5" strokeLinecap="round"/>
<path d="m204 95 14-5 8 12-13 10-11-5Z" fill="#8b6e4c"/>
<rect x="126" y="69" width="47" height="17" rx="8.5" fill="#9d7a4e"/><rect x="129" y="85" width="44" height="17" rx="8.5" fill="#b18c5d"/>
<path d="M141 74h23M144 90h18" stroke="#e8d2af" strokeWidth="2.5" strokeLinecap="round"/>
<path d="M126 73v9M129 89v9" stroke="#70563c" strokeWidth="5" strokeLinecap="round"/>
<rect x="168" y="74" width="9" height="22" rx="4.5" fill="#7c6244"/>
<path d="M215 66c11-4 26 1 30 12 3 8 2 19-4 25l-13 4-15-7-7-12c-2-10 0-18 9-22Z" fill="#c4a67c"/>
<path d="M216 68c9-3 20-1 25 6" stroke="#e7d5b9" strokeWidth="2.5" strokeLinecap="round"/>
<path d="m227 76 18 3c4 1 6 6 5 10l-3 8-18-1c-9-1-11-15-2-20Z" fill="url(#flight-visor)"/>
<path d="m229 79 14 3" stroke="#e1ca9f" strokeWidth="1.8" strokeLinecap="round" opacity=".65"/>
<circle cx="217" cy="90" r="6" fill="#94734d" stroke="#dfc7a0" strokeWidth="1.5"/><circle cx="217" cy="90" r="2" fill="#d7bf9a"/>
<path d="m219 99 8 5 10-1" stroke="#97754e" strokeWidth="3" strokeLinecap="round"/>
<path d="m190 120 5-2" stroke="#f0dfc2" strokeWidth="3" strokeLinecap="round"/>
</g></svg></div><div><span className="club-kicker">THE NEXT GOOD THING</span><h2>Perks worth the wait.</h2><p>We’re preparing our first redeemables. When they’re ready, you’ll find the rewards, points required, and availability right here.</p><div className="catalog-actions">{!session ? <Link to="/signup" className="button dark">Create your account <Icon name="arrow" size={17}/></Link> : <Link to="/leaderboard" className="button dark">Visit the leaderboard <Icon name="arrow" size={17}/></Link>}<button className="text-button" onClick={() => setSection('guide')}>See how it works <Icon name="arrow" size={17}/></button></div></div></section></RedeemableCatalog> : <section className="reward-steps"><div><span className="step-marker">1</span><h3>One account. Your own QR.</h3><p>Create and confirm your account. Once the QR system is connected, your personal code will be available in your account, ready to show at APEX Fitness Gym and Aureatine.</p><Link to={session ? '/profile' : '/signup'} className="text-button">{session ? 'Open your account' : 'Create an account'} <Icon name="arrow" size={15}/></Link><span className="step-state">Personal QR available after account database setup</span></div><div><span className="step-marker">2</span><h3>Show it. Scan it. Earn points.</h3><p>Bring up your personal QR for staff to scan. Both your gym visits and your shake purchases can earn points in the same account.</p><div className="scan-partners"><div><span className="scan-partner-icon"><Icon name="qr" size={20}/></span><p><strong>APEX Fitness Gym</strong><span>Gym staff scan your QR to record your visit and award gym points.</span></p></div><div><span className="scan-partner-icon"><Icon name="cup" size={20}/></span><p><strong>Aureatine</strong><span>Staff scan your QR after your purchase to award purchase points.</span></p></div></div><span className="step-state">Staff scanner and earning rules prepared; database activation pending</span></div><div><span className="step-marker">3</span><h3>A new month. More to earn.</h3><p>Take part in monthly events for opportunities to get rewards. Each event will show its schedule, how to participate, and which rewards are available.</p><span className="monthly-event-note"><Icon name="calendar" size={18}/><span>Monthly events from the Aureatine × APEX community</span></span><span className="step-state">First event details and reward rules coming soon</span></div></section>}
    <section className="community-bridge"><div className="bridge-icon"><Icon name="trophy" size={31}/></div><div><h2>A little friendly motivation.</h2><p>Meet the community leaderboard. Participation is optional.</p></div><Link to="/leaderboard" className="text-button">View leaderboard <Icon name="northeast"/></Link></section>
    <div className="club-footnote"><Icon name="check" size={14}/><p>Member profiles, QR codes and authorized staff awards require database activation. Monthly reward events are still pending. Opening this page never awards points automatically.</p></div>
  </article>
}

export function LeaderboardPage({ Icon, Link, session }) {
  const [selectedMember, setSelectedMember] = useState(null)
  const profileTrigger = useRef(null)
  function openProfile(entry, event) { profileTrigger.current = event.currentTarget; setSelectedMember(entry) }
  function closeProfile() { setSelectedMember(null); requestAnimationFrame(() => profileTrigger.current?.focus({ preventScroll: true })) }
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(Boolean(supabase))
  const [error, setError] = useState('')
  const [refresh, setRefresh] = useState(0)
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  useEffect(() => {
    if (!supabase) return
    let active = true
    setLoading(true); setEntries([]); setError('')
    supabase.rpc('get_leaderboard_entries').then(({ data, error: queryError }) => {
      if (!active) return
      setLoading(false)
      if (queryError) { setError('The leaderboard is not available yet. Please try again later.'); setEntries([]) }
      else { setEntries(data ?? []); setError('') }
    }).catch(() => { if (active) { setLoading(false); setError('We could not reach the leaderboard. Please try again.') } })
    return () => { active = false }
  }, [refresh, session?.user?.id])
  function reload() { if (!supabase) return; setLoading(true); setError(''); setRefresh(value => value + 1) }
  async function join(event) {
    event.preventDefault()
    if (!session || !supabase) return
    setSaving(true); setMessage('')
    try {
      const { error: saveError } = await supabase.rpc('set_leaderboard_participation', { p_opted_in: true })
      if (saveError) throw saveError
      setMessage('Your profile display name and verified points are now included. You can leave at any time.'); reload()
    } catch { setMessage('We could not update your participation. Please try again after leaderboard setup is complete.') } finally { setSaving(false) }
  }
  async function leave() {
    if (!session || !supabase) return
    setSaving(true); setMessage('')
    try {
      const { error: saveError } = await supabase.rpc('set_leaderboard_participation', { p_opted_in: false })
      if (saveError) throw saveError
      setMessage('You are not publicly listed. Your private points balance is unchanged.'); reload()
    } catch { setMessage('We could not update your participation. Please try again.') } finally { setSaving(false) }
  }
  const filtered = entries.filter(entry => entry.display_name.toLocaleLowerCase().includes(search.toLocaleLowerCase()))
  return <article className="club-page leaderboard-page shell"><header className="club-heading"><div><div className="club-kicker"><Icon name="trophy" size={16}/> THE Aureatine COMMUNITY</div><h1>A shared ritual.<br/><em>A little motivation.</em></h1><p>The leaderboard for our community’s verified points. Select a member to view their profile.</p></div><Link to="/rewards" className="button outline">Your rewards <Icon name="gift" size={18}/></Link></header>
    <section className="leaderboard-intro"><div className="leaderboard-art" aria-hidden="true"><Icon name="trophy" size={70}/><span className="laurel-orbit"/></div><div><span className="club-kicker">PROGRESS LOOKS GOOD TOGETHER</span><h2>Good company.<br/>Friendly competition.</h2><p>Ranked by verified points, not gym performance. Join with a display name you choose. Your email is never shown.</p></div><div className="ranking-scope"><Icon name="check" size={17}/><span>Current points</span><small>Opt-in members only</small></div></section>
    <OwnRanking userId={session?.user?.id} refresh={refresh} Link={Link}/>
    <section className="ranking-panel" aria-labelledby="ranking-heading"><div className="ranking-toolbar"><div><h2 id="ranking-heading">Community standings</h2><span>Top 50 opted-in members · Equal points share a rank</span></div><button className="refresh-button" onClick={reload} disabled={loading || !supabase} aria-label="Refresh leaderboard"><Icon name="refresh" size={17}/>{loading ? 'Loading' : 'Refresh'}</button></div><div className="ranking-filter"><label><Icon name="search" size={17}/><input type="search" placeholder="Find a display name" aria-label="Search leaderboard display names" value={search} onChange={event => setSearch(event.target.value)}/></label><span className="status-chip"><span/>{!supabase ? 'Awaiting connection' : loading ? 'Loading standings' : error ? 'Unavailable' : `${entries.length} listed members`}</span></div>
    <div className="rank-table"><table><thead><tr><th scope="col">Rank</th><th scope="col">Member</th><th scope="col">Verified points</th></tr></thead><tbody>{!loading && !error && filtered.map((entry, i) => <tr key={`${entry.display_name}-${entry.rank}-${i}`} className={entry.is_current_user ? 'is-current-member' : undefined} aria-label={entry.is_current_user ? 'Your leaderboard row' : undefined}><td><span className={entry.rank <= 3 ? 'rank-number top-rank' : 'rank-number'}>{entry.rank}</span></td><td><button className="leaderboard-member-trigger" aria-label={`View ${entry.display_name}'s profile`} aria-haspopup="dialog" onClick={event => openProfile(entry, event)}><LeaderboardAvatar name={entry.display_name} path={entry.leaderboard_avatar_path}/><span>{entry.display_name}</span></button><div className="leaderboard-badges"><LabelBadges isAdmin={entry.is_admin} labels={entry.labels}/>{entry.is_current_user && <span className="leaderboard-you-badge">You</span>}</div></td><td>{Number(entry.points).toLocaleString()} <span>pts</span></td></tr>)}</tbody></table>
    {(loading || error || filtered.length === 0) && <div className="ranking-empty" aria-live="polite"><span className="empty-ranking-icon"><Icon name={search ? 'search' : 'trophy'} size={33}/></span><h3>{loading ? 'Gathering the standings…' : error ? 'Let’s try again soon.' : search ? 'No matching members.' : 'Every community starts somewhere.'}</h3><p>{loading ? 'Fetching verified points from the connected database.' : error || (search ? 'Try another display name or clear your search.' : !supabase ? 'The leaderboard will open when secure accounts and points are connected. No sample rankings, just real people when we’re ready.' : 'No members have opted in yet. Choose to join below to be included.')}</p>{search && <button className="text-button" onClick={() => setSearch('')}>Clear search <Icon name="close" size={15}/></button>}</div>}</div></section>
    <section className="leaderboard-join" id="leaderboard-join"><div><span className="club-kicker">YOUR NAME. YOUR CHOICE.</span><h2>Be part of the board.</h2><p>Participation is optional. Your display name and points appear publicly, with your photo only if you enable photo sharing. Signed-in members can open your shared profile. Keep your name anonymous if you prefer, and leave whenever you like.</p><Link to="/rewards" className="text-button">Explore rewards <Icon name="arrow" size={17}/></Link></div><div className="join-controls">{session ? <><form onSubmit={join}><p>Your current profile display name will appear here. Updating it in your profile also updates the leaderboard.</p><Link to="/profile" className="text-button">Edit my display name ↗</Link><label className="consent-label"><input type="checkbox" required/> I agree to show my current profile display name and verified points publicly.</label><button className="button dark" disabled={saving}>{saving ? 'Saving…' : 'Join leaderboard'}<Icon name="arrow" size={16}/></button></form><button className="text-button" disabled={saving} onClick={leave}>Remove me from the leaderboard</button></> : <><Icon name="user" size={26}/><h3>Your community starts here.</h3><p>Log in to manage your participation.<br/>An account never opts you in automatically.</p><div className="join-account-actions"><Link to="/login" className="button dark">Log in to participate <Icon name="arrow" size={17}/></Link><Link to="/signup" className="text-button">New here? Create an account <Icon name="northeast" size={15}/></Link></div></>}{message && <output className="form-message">{message}</output>}</div></section>
    {selectedMember && <LeaderboardMemberProfile member={selectedMember} session={session} Link={Link} onClose={closeProfile}/>}
  </article>
}
