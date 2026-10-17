import { useEffect, useRef, useState } from 'react'
import { supabase } from './supabase'
import LeaderboardAvatar from './LeaderboardAvatar'
import { RankFrame, RankLine } from './RankFrame'
import { rankByTitle } from './ranks'
import { SocialLinks } from './MemberCommunity'
import './leaderboardProfile.css'
import {LabelBadges, labelsOf} from './memberLabels'

const validId = value => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
const count = value => Number.isSafeInteger(value) && value >= 0 ? value.toLocaleString() : '—'

function ProfileDetails({ memberId, Link }) {
  const [state, setState] = useState({ loading: true })
  const [version, setVersion] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    let active = true
    if (!validId(memberId) || !supabase) {
      setState({ error: 'This profile is unavailable right now. Please try again later.' })
      return () => { active = false }
    }
    setState({ loading: true })
    const timer = setTimeout(() => controller.abort(), 15000)
    supabase.rpc('get_leaderboard_member_profile', { p_member: memberId }).abortSignal(controller.signal)
      .then(({ data, error }) => {
        if (!active) return
        if (error) { setState({ error: 'Could not load this profile. Please try again.' }); return }
        if (!data?.ok) { setState({ unavailable: true }); return }
        const profile = data.profile
        if (profile?.id !== memberId || typeof profile.display_name !== 'string' || typeof profile.username !== 'string') {
          setState({ error: 'Could not load this profile. Please try again.' }); return
        }
        setState({ profile })
      })
      .catch(() => { if (active) setState({ error: 'Could not reach this profile. Please try again.' }) })
      .finally(() => clearTimeout(timer))
    return () => { active = false; clearTimeout(timer); controller.abort() }
  }, [memberId, version])

  if (state.loading) return <output className="leaderboard-profile-notice">Loading member profile…</output>
  if (state.unavailable) return <output className="leaderboard-profile-notice">This member profile is unavailable.</output>
  if (state.error) return <div className="leaderboard-profile-notice"><output>{state.error}</output><button className="button outline" onClick={() => setVersion(n => n + 1)}>Try again</button></div>
  const p = state.profile
  const photo = p.leaderboard_avatar_path === `${memberId}/avatar.webp` ? p.leaderboard_avatar_path : null
  const ranked = Number.isSafeInteger(p.rank) && p.rank > 0
  return <div className="leaderboard-profile-details">
    <header className="leaderboard-profile-identity"><RankFrame rank={rankByTitle(p.rank_title, p.exp)} size={96}><LeaderboardAvatar key={photo || 'initial'} name={p.display_name} path={photo}/></RankFrame><div><h3>{p.display_name}</h3><p>@{p.username}</p><RankLine rank={rankByTitle(p.rank_title, p.exp)} exp={p.exp}/><LabelBadges isAdmin={p.is_admin} labels={labelsOf(p)}/>{p.is_me === true && <span className="leaderboard-you-badge">You</span>}</div></header>
    {p.bio ? <p className="leaderboard-profile-bio">{p.bio}</p> : <p className="leaderboard-profile-muted">No bio added yet.</p>}
    <SocialLinks profile={p}/>
    <div className="leaderboard-profile-standing">{ranked ? <><div><span>Leaderboard rank</span><strong>#{p.rank.toLocaleString()}</strong></div><div><span>Verified Aurels</span><strong>{count(p.points)}</strong></div></> : <p>This member is not currently listed on the leaderboard.</p>}</div>
    <dl className="leaderboard-profile-counts">{['friends', 'followers', 'following'].map(label => <div key={label}><dt>{label}</dt><dd>{count(p[label])}</dd></div>)}</dl>
    {p.is_me === true && <Link to="/profile" className="button outline">Open my account</Link>}
    <p className="leaderboard-profile-privacy">Only shared member details appear here. Photos require leaderboard and photo-sharing consent.</p>
  </div>
}

export default function LeaderboardMemberProfile({ member, session, Link, onClose }) {
  const dialog = useRef(null)
  useEffect(() => {
    const element = dialog.current
    const previousOverflow = document.body.style.overflow
    element.showModal()
    document.body.style.overflow = 'hidden'
    return () => { element.close(); document.body.style.overflow = previousOverflow }
  }, [])
  function keepFocus(event) {
    if (event.key !== 'Tab') return
    const controls = [...dialog.current.querySelectorAll('button:not([disabled]),a[href]')].filter(el => el.getClientRects().length)
    const first = controls[0], last = controls.at(-1)
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
  }
  return <dialog onKeyDown={keepFocus} ref={dialog} className="leaderboard-profile-dialog" aria-labelledby="leaderboard-profile-title" onCancel={event => { event.preventDefault(); onClose() }}>
    <div className="leaderboard-profile-heading"><h2 id="leaderboard-profile-title">Member profile</h2><button type="button" onClick={onClose} aria-label="Close member profile"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button></div>
    {session ? <ProfileDetails key={`${session.user.id}:${member.community_id || 'missing'}`} memberId={member.community_id} Link={Link}/> : <div className="leaderboard-profile-notice"><p>Sign in to view this member’s profile. Bios and social links are shared with signed-in members only.</p><Link to="/login" className="button dark">Log in to view profile</Link></div>}
  </dialog>
}
