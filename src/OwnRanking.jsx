import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from './supabase'
import './ownRanking.css'
// Live refresh: the standing is re-read every 20 seconds, when the tab becomes visible, and when the window regains focus.
const LIVE_MS = 20000
export function rankChip(rank) {
  if (rank <= 3) return 'Top 3'
  if (rank <= 10) return 'Top 10'
  if (rank <= 50) return 'Top 50'
  return null
}
export default function OwnRanking({ userId, refresh = 0, Link, profile = false }) {
  const [standing, setStanding] = useState(null), [loading, setLoading] = useState(true), [error, setError] = useState(''), [retry, setRetry] = useState(0)
  const alive = useRef(true)
  useEffect(() => { alive.current = true; return () => { alive.current = false } }, [])
  const load = useCallback(async (silent) => {
    if (!supabase || !userId) { setLoading(false); return }
    if (!silent) { setLoading(true); setError('') }
    try {
      const { data, error: failure } = await supabase.rpc('get_my_leaderboard_standing')
      if (!alive.current) return
      if (failure || !data?.ok) { if (!silent) setError('Your ranking is unavailable. The latest database setup may still need to be installed.'); return }
      setError('')
      setStanding(data)
    } catch {
      if (alive.current && !silent) setError('Could not load your ranking. Please try again.')
    } finally {
      if (alive.current && !silent) setLoading(false)
    }
  }, [userId])
  useEffect(() => { setStanding(null); load(false) }, [load, refresh, retry])
  useEffect(() => {
    if (!supabase || !userId) return
    const tick = () => { if (!document.hidden) load(true) }
    const id = setInterval(tick, LIVE_MS)
    document.addEventListener('visibilitychange', tick)
    window.addEventListener('focus', tick)
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', tick); window.removeEventListener('focus', tick) }
  }, [load, userId])
  if (!userId) return null
  const listed = Boolean(standing?.opted_in && standing?.rank)
  const chip = listed ? rankChip(standing.rank) : null
  const trophy = <svg aria-hidden="true" viewBox="0 0 24 24" width="25" height="25" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 3h8v6a4 4 0 0 1-8 0V3ZM8 5H4v3a4 4 0 0 0 4 4M16 5h4v3a4 4 0 0 1-4 4M12 13v5M8 21h8M9 18h6v3"/></svg>
  if (profile) return <div className="profile-rank-inline" role="region" aria-label="Your profile leaderboard position">
    {loading ? <span role="status">Loading ranking…</span> : error ? <><span role="status">Ranking unavailable</span><button type="button" className="text-button" title={error} onClick={() => setRetry(n => n + 1)}>Retry</button></> : standing && <Link to={listed ? '/leaderboard' : '/leaderboard#leaderboard-join'} className="profile-rank-link">{trophy}<span>{listed ? <><strong>#{standing.rank}</strong> on the leaderboard{chip && <span className="own-rank-chip">{chip}</span>}</> : 'Not in the leaderboards'}</span><span aria-hidden="true">↗</span></Link>}
  </div>
  return <section className="own-ranking" aria-label="Your ranking">
    <div className="own-rank-marker" aria-hidden="true">{trophy}</div>
    <div className="own-rank-details"><span className="own-rank-label">YOUR RANKING <b>YOU</b> <span className="own-rank-live">· Updates automatically</span></span>
      {loading ? <p role="status">Loading your standing…</p> : error ? <><p role="status">{error}</p><button type="button" className="text-button" onClick={() => setRetry(n => n + 1)}>Try again</button></> : standing && <><h3>{standing.display_name}</h3><p>{listed ? 'You are on the leaderboard. Your rank updates automatically as Aurels change.' : 'You are not in the leaderboards. Join to publish your display name and Aurels and receive a rank.'}</p><Link to={listed ? '/leaderboard' : '/leaderboard#leaderboard-join'} className="text-button">{listed ? 'View leaderboard ↗' : 'Join leaderboard →'}</Link></>}
    </div>
    {!loading && standing && <div className="own-rank-numbers">{listed ? <><strong>#{standing.rank}</strong>{chip && <span className="own-rank-chip">{chip}</span>}</> : <strong className="not-listed">Not in the leaderboards</strong>}<span>{Number(standing.points).toLocaleString()} Aurels</span>{listed && <small>of {standing.total_members} opted-in members</small>}</div>}
  </section>
}
