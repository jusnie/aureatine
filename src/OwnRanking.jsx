import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import './ownRanking.css'
export default function OwnRanking({ userId, refresh = 0, Link, profile = false }) {
  const [standing,setStanding]=useState(null),[loading,setLoading]=useState(true),[error,setError]=useState(''),[retry,setRetry]=useState(0)
  useEffect(()=>{let active=true;setLoading(true);setStanding(null);setError('')
    if(!supabase||!userId){setLoading(false);return}
    supabase.rpc('get_my_leaderboard_standing').then(({data,error:failure})=>{
      if(!active)return
      if(failure||!data?.ok){setError('Your ranking is unavailable. The latest database setup may still need to be installed.');return}
      setStanding(data)
    }).catch(()=>{if(active)setError('Could not load your ranking. Please try again.')}).finally(()=>{if(active)setLoading(false)})
    return()=>{active=false}
  },[userId,refresh,retry])
  if(!userId)return null
  if(profile) return <div className="profile-rank-inline" role="region" aria-label="Your profile leaderboard position">
    {loading?<span role="status">Loading ranking…</span>:error?<><span role="status">Ranking unavailable</span><button type="button" className="text-button" title={error} onClick={()=>setRetry(n=>n+1)}>Retry</button></>:standing&&<Link to={standing.opted_in?'/leaderboard':'/leaderboard#leaderboard-join'} className="profile-rank-link"><svg aria-hidden="true" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M8 3h8v6a4 4 0 0 1-8 0V3ZM8 5H4v3a4 4 0 0 0 4 4M16 5h4v3a4 4 0 0 1-4 4M12 13v5M8 21h8M9 18h6v3"/></svg><span>{standing.rank?<><strong>#{standing.rank}</strong> on the leaderboard</>:'Join the leaderboard'}</span><span aria-hidden="true">↗</span></Link>}
  </div>
  return <section className="own-ranking" aria-label={profile?'Your profile leaderboard position':'Your ranking'}>
    <div className="own-rank-marker" aria-hidden="true"><svg viewBox="0 0 24 24" width="25" height="25" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 3h8v6a4 4 0 0 1-8 0V3ZM8 5H4v3a4 4 0 0 0 4 4M16 5h4v3a4 4 0 0 1-4 4M12 13v5M8 21h8M9 18h6v3"/></svg></div>
    <div className="own-rank-details"><span className="own-rank-label">{profile?'YOUR LEADERBOARD POSITION':'YOUR RANKING'} <b>YOU</b></span>
      {loading?<p role="status">Loading your standing…</p>:error?<><p role="status">{error}</p><button type="button" className="text-button" onClick={()=>setRetry(n=>n+1)}>Try again</button></>:standing&&<><h3>{standing.display_name}</h3><p>{standing.opted_in?(standing.in_top_50?'Your account is highlighted in the community list.':'Your position is shown here even outside the top 50.'):'Your account is shown here privately. Join the leaderboard to publish your display name and points and receive a ranking.'}</p><Link to={standing.opted_in?'/leaderboard':'/leaderboard#leaderboard-join'} className="text-button">{standing.opted_in?'View leaderboard ↗':'Join leaderboard →'}</Link></>}
    </div>
    {!loading&&standing&&<div className="own-rank-numbers"><strong>{standing.rank?`#${standing.rank}`:'Not listed'}</strong><span>{Number(standing.points).toLocaleString()} points</span>{standing.opted_in&&<small>of {standing.total_members} opted-in members</small>}</div>}
  </section>
}
