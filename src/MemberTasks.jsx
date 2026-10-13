import { useEffect, useRef, useState } from 'react'
import { supabase } from './supabase'
const failures = { CONFIRM_EMAIL: 'Confirm your email before claiming task points.', TASK_INCOMPLETE: 'Complete staff-verified visits on five different dates first.', WALLET_UNAVAILABLE: 'Your points wallet is not ready yet.', BALANCE_LIMIT: 'Your balance limit would be exceeded.' }
export default function MemberTasks({ userId, onBalanceChange }) {
  const [data,setData]=useState(null),[loading,setLoading]=useState(true),[busy,setBusy]=useState(''),[message,setMessage]=useState(''),[refresh,setRefresh]=useState(0)
  const signupRequest=useRef(null),locked=useRef(false),alive=useRef(true),onBalance=useRef(onBalanceChange);onBalance.current=onBalanceChange
  useEffect(()=>{alive.current=true;return()=>{alive.current=false}},[])
  useEffect(()=>{let active=true
    async function load(){setLoading(true)
      try{
        if(refresh===0){signupRequest.current ||= Promise.resolve(supabase.rpc('claim_member_task',{p_task:'signup'}));const{data:bonus,error}=await signupRequest.current;if(!active)return;if(!error&&bonus?.ok&&Number.isSafeInteger(bonus.balance)){onBalance.current?.(bonus.balance);if(bonus.awarded)setMessage('Welcome! Your verified account earned 15 signup points.')}}
        const{data:status,error}=await supabase.rpc('get_member_tasks');if(!active)return
        if(error||!status?.ok)throw Error('setup');setData(status)
      }catch{if(active)setMessage('Tasks are not available yet. Check the database setup or try Refresh tasks.')}finally{if(active)setLoading(false)}
    }load();return()=>{active=false}
  },[userId,refresh])
  useEffect(()=>{if(!data?.next_reset)return;const wait=Math.max(1000,new Date(data.next_reset).getTime()-Date.now()+1000);const timer=setTimeout(()=>setRefresh(n=>n+1),Math.min(wait,2147483647));return()=>clearTimeout(timer)},[data?.next_reset])
  useEffect(()=>{const update=()=>{if(!document.hidden)setRefresh(n=>n+1)};document.addEventListener('visibilitychange',update);return()=>document.removeEventListener('visibilitychange',update)},[])
  async function claim(task){if(locked.current)return;locked.current=true;setBusy(task);setMessage('')
    try{const{data:result,error}=await supabase.rpc('claim_member_task',{p_task:task});if(error)throw error
      if(result?.ok&&Number.isSafeInteger(result.balance)){onBalance.current?.(result.balance);setMessage(result.awarded?`Successfully claimed ${result.points} points!`:'Already claimed. No duplicate points were added.');setRefresh(n=>n+1)}else setMessage(failures[result?.code]||'This task could not be claimed.')
    }catch{setMessage('Could not confirm the result. Refresh or retry this task safely—completed claims cannot award twice.')}finally{locked.current=false;if(alive.current)setBusy('')}
  }
  return <section className="member-tasks" aria-labelledby="member-tasks-title"><header className="task-section-heading"><div><h2 id="member-tasks-title">Available tasks</h2><p>Daily check-in resets at midnight, Philippine time.</p></div><button className="button outline" disabled={loading||Boolean(busy)} onClick={()=>setRefresh(n=>n+1)}>Refresh tasks</button></header>
    {message&&<output className="member-notice" role="status">{message}</output>}
    {!data?<p className="member-helper">{loading?'Loading your verified task progress…':'Task progress unavailable. No sample points or streaks are shown.'}</p>:<>
      <div className="member-streak-grid"><div><span>Daily check-in streak</span><strong>{data.daily_streak.current} <small>days</small></strong><p>Best: {data.daily_streak.best} days</p></div><div><span>Gym visit streak</span><strong>{data.gym_streak.current} <small>days</small></strong><p>Best: {data.gym_streak.best} days</p></div></div>
      <div className="member-task-grid">{[
        {key:'signup',label:'A confirmed beginning.',points:15,description:'Confirm your email. A one-time bonus for new and existing accounts.',done:data.signup_claimed,ready:true},
        {key:'daily',label:'Check in today.',points:5,description:`One claim per Philippine calendar day. Today: ${data.today}.`,done:data.daily_claimed,ready:true},
        {key:'gym_five_days',label:'Five days of showing up.',points:25,description:'Visit the gym on five different dates. Staff verification required; consecutive days are not necessary.',done:data.gym_claimed,ready:data.gym_days>=5}
      ].map(task=><article key={task.key} className="member-task-card"><span className="task-points">+{task.points} points</span><h3>{task.label}</h3><p>{task.description}</p>{task.key==='gym_five_days'&&<><progress max="5" value={Math.min(5,data.gym_days)} aria-label="Gym visit days toward five-day task"/><small>{Math.min(5,data.gym_days)} / 5 days · one-time milestone</small></>}<button className="button outline" disabled={loading||Boolean(busy)||task.done||!task.ready} onClick={()=>claim(task.key)}>{busy===task.key?'Confirming…':task.done?'Completed':!task.ready?'Keep making progress':'Claim points'}</button></article>)}</div>
      <p className="member-helper">Streaks count consecutive Philippine dates, not repeated actions in one day. A streak remains current if you checked in yesterday; missing a full day resets it. The five-day task counts total unique visit dates, separately from your streak.</p>

      {data.history?.length>0&&<details className="task-history"><summary>Recent task points</summary><ul>{data.history.map((item,i)=><li key={`${item.task}-${item.claim_day}-${i}`}><span>{item.task==='signup'?'Signup bonus':item.task==='daily'?'Daily check-in':'Five gym days'} · {item.claim_day}</span><strong>+{item.points}</strong></li>)}</ul></details>}
    </>}
  </section>
}
