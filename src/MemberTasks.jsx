import { useEffect, useRef, useState } from 'react'
import { supabase } from './supabase'
const failures = { CONFIRM_EMAIL: 'Confirm your email before claiming task points.', TASK_INCOMPLETE: 'Complete staff-verified visits on five different dates first.', WALLET_UNAVAILABLE: 'Your points wallet is not ready yet.', BALANCE_LIMIT: 'Your balance limit would be exceeded.' }
// Counts down to when a 24-hour task becomes available again; updates once per second.
function AvailableCountdown({ until }) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer) }, [])
  const ms = Math.max(0, new Date(until).getTime() - now)
  const pad = n => String(n).padStart(2, '0')
  return <p className="task-timer">Available again in <strong>{pad(Math.floor(ms / 3600000))}:{pad(Math.floor(ms % 3600000 / 60000))}:{pad(Math.floor(ms % 60000 / 1000))}</strong></p>
}
const historyLabel = { signup: 'Signup bonus', daily: 'Daily check-in', cardio: 'Cardio 30 minutes', gym_five_days: 'Five gym days' }
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
  // Re-read the tasks when the next 24-hour window opens.
  useEffect(()=>{if(!data?.next_reset)return;const wait=Math.max(1000,new Date(data.next_reset).getTime()-Date.now()+1000);const timer=setTimeout(()=>setRefresh(n=>n+1),Math.min(wait,2147483647));return()=>clearTimeout(timer)},[data?.next_reset])
  useEffect(()=>{const update=()=>{if(!document.hidden)setRefresh(n=>n+1)};document.addEventListener('visibilitychange',update);return()=>document.removeEventListener('visibilitychange',update)},[])
  async function claim(task){if(locked.current)return;locked.current=true;setBusy(task);setMessage('')
    try{const{data:result,error}=await supabase.rpc('claim_member_task',{p_task:task});if(error)throw error
      if(result?.ok&&Number.isSafeInteger(result.balance)){onBalance.current?.(result.balance);setMessage(result.awarded?`Successfully claimed ${result.points} Aurels!`:'Already claimed. No duplicate Aurels were added.');setRefresh(n=>n+1)}else setMessage(failures[result?.code]||'This task could not be claimed.')
    }catch{setMessage('Could not confirm the result. Refresh or retry this task safely—completed claims cannot award twice.')}finally{locked.current=false;if(alive.current)setBusy('')}
  }
  const tasks=data?[
    {key:'signup',label:'A confirmed beginning.',points:15,description:'Confirm your email. A one-time bonus for new and existing accounts.',done:data.signup_claimed,ready:true,oneTime:true},
    {key:'daily',label:'Check in today.',points:5,description:'Claim once, then it is available again 24 hours later.',done:data.daily_claimed,ready:true,until:data.daily_available_at},
    {key:'cardio',label:'Thirty minutes of cardio.',points:30,description:'Log 30 minutes of cardio. Claim once, then it is available again 24 hours later.',done:data.cardio_claimed,ready:true,until:data.cardio_available_at},
    {key:'gym_five_days',label:'Five days of showing up.',points:25,description:'Visit the gym on five different dates, then claim. Staff verification required; consecutive days are not necessary. Repeats 24 hours after you claim.',done:data.gym_claimed,ready:data.gym_days>=5,until:data.gym_available_at}
  ].filter(task=>!(task.oneTime&&task.done)):[]
  return <section className="member-tasks" aria-labelledby="member-tasks-title"><header className="task-section-heading"><div><h2 id="member-tasks-title">Available tasks</h2><p>Each task refreshes 24 hours after you claim it.</p></div><button className="button outline" disabled={loading||Boolean(busy)} onClick={()=>setRefresh(n=>n+1)}>Refresh tasks</button></header>
    {message&&<output className="member-notice">{message}</output>}
    {!data?<p className="member-helper">{loading?'Loading your verified task progress…':'Task progress unavailable. No sample Aurels or streaks are shown.'}</p>:<>
      <div className="member-streak-grid"><div><span>Daily check-in streak</span><strong>{data.daily_streak.current} <small>days</small></strong><p>Best: {data.daily_streak.best} days</p></div><div><span>Gym visit streak</span><strong>{data.gym_streak.current} <small>days</small></strong><p>Best: {data.gym_streak.best} days</p></div></div>
      <div className="member-task-grid">{tasks.map(task=><article key={task.key} className="member-task-card"><span className="task-points">+{task.points} Aurels</span><h3>{task.label}</h3><p>{task.description}</p>{task.until&&task.done&&<AvailableCountdown until={task.until}/>}{task.key==='gym_five_days'&&<><progress max="5" value={Math.min(5,data.gym_days)} aria-label="Gym visit days toward five-day task"/><small>{Math.min(5,data.gym_days)} / 5 days since your last claim · repeats every 24 hours</small></>}<button className="button outline" disabled={loading||Boolean(busy)||task.done||!task.ready} onClick={()=>claim(task.key)}>{busy===task.key?'Confirming…':task.done?(task.until?'Claimed':'Completed'):!task.ready?'Keep making progress':'Claim points'}</button></article>)}</div>
      <p className="member-helper">Streaks count consecutive Philippine dates, not repeated actions in one day. A streak remains current if you checked in yesterday; missing a full day resets it. The five-day task counts total unique visit dates, separately from your streak.</p>

      {data.history?.length>0&&<details className="task-history"><summary>Recent task Aurels</summary><ul>{data.history.map((item,i)=><li key={`${item.task}-${item.claim_day}-${i}`}><span>{historyLabel[item.task]||item.task} · {item.claim_day}</span><strong>+{item.points}</strong></li>)}</ul></details>}
    </>}
  </section>
}
