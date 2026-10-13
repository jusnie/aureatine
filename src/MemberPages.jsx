import { useEffect, useRef, useState } from 'react'
import { supabase } from './supabase'
import { parseMemberCode, purchaseCentavos, prepareAvatar } from './memberUtils'
import './members.css'
import MemberScanner from './MemberScanner'
import MemberTasks from './MemberTasks'
import OwnRanking from './OwnRanking'
import MemberCommunity, { CommunityStats, SocialLinks, socialValues, validSocialURL } from './MemberCommunity'
function EditPencil() { return <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="m16 3 5 5M4 15 16 3a2 2 0 0 1 5 5L9 20l-6 1 1-6ZM14 5l5 5"/></svg> }
function MemberGate({ session, Link, children }) {
  if (!supabase || !session) return <section className="member-page shell"><span className="section-label">Your Aureatine account</span><h1>Your membership<br/><em>starts here.</em></h1><p>Sign in to view your profile and personal member code.</p><Link to="/login" className="button dark">Log in</Link> <Link to="/signup" className="button outline">Create account</Link></section>
  return children
}
async function avatarUrl(path) {
  if (!path) return ''
  const { data, error } = await supabase.storage.from('member-avatars').createSignedUrl(path, 600)
  return error ? '' : data.signedUrl
}
export function MemberProfilePage({ session, Link, onBalanceChange }) {
  return <MemberGate session={session} Link={Link}>{session && <MemberProfile key={session.user.id} session={session} Link={Link} onBalanceChange={onBalanceChange}/>}</MemberGate>
}
function MemberProfile({ session, Link, onBalanceChange }) {
  const [isAdmin,setIsAdmin] = useState(false)
  useEffect(()=>{let active=true;supabase.rpc('get_my_admin_status').then(({data,error})=>{if(active)setIsAdmin(!error&&data===true)}).catch(()=>{if(active)setIsAdmin(false)});return()=>{active=false}},[session.user.id])
  const [profile, setProfile] = useState(null), [displayName, setDisplayName] = useState(''), [username, setUsername] = useState('')
  const [photo, setPhoto] = useState(''), [qr, setQr] = useState(''), [balance, setBalance] = useState(null), [roles, setRoles] = useState([])
  const [events, setEvents] = useState([]), [message, setMessage] = useState(''), [loading, setLoading] = useState(true), [busy, setBusy] = useState(false)
  const [refresh, setRefresh] = useState(0), [rotateConfirm, setRotateConfirm] = useState(false)
  const [showPhoto,setShowPhoto] = useState(false)
  const signupClaim = useRef(null)
  const [social,setSocial] = useState(socialValues(null)), [socialRefresh,setSocialRefresh] = useState(0)
  const [peopleOpen,setPeopleOpen] = useState(false)
  const peopleButton = useRef(null)
  const closePeople = () => {setPeopleOpen(false);peopleButton.current?.focus()}
  useEffect(()=>{const update=()=>{if(document.visibilityState==='visible')setSocialRefresh(n=>n+1)};const timer=setInterval(update,30000);window.addEventListener('focus',update);document.addEventListener('visibilitychange',update);return()=>{clearInterval(timer);window.removeEventListener('focus',update);document.removeEventListener('visibilitychange',update)}},[])
  const [editing,setEditing] = useState(false)
  const editButton = useRef(null)
  useEffect(()=>{if(!editing) editButton.current?.focus()},[editing])
  const mounted = useRef(true)
  useEffect(() => { mounted.current = true; return () => { mounted.current = false } }, [])
  useEffect(() => {
    let active = true
    setLoading(true)
    Promise.all([
      supabase.from('member_profiles').select('display_name,username,member_code,manual_code,avatar_path,bio,facebook_url,instagram_url,tiktok_url,community_id,share_leaderboard_photo').eq('user_id', session.user.id).single(),
      (signupClaim.current ||= Promise.resolve(supabase.rpc('claim_member_task',{p_task:'signup'}))).then(()=>supabase.from('wallets').select('points').eq('user_id', session.user.id).single()),
      supabase.from('staff_members').select('role').eq('user_id', session.user.id),
      supabase.from('member_point_events').select('id,kind,points,created_at').eq('user_id', session.user.id).order('created_at', { ascending: false }).limit(10)
    ]).then(async ([p,w,r,h]) => {
      if (!active) return
      if (p.error) { setProfile(null); setMessage('Your profile setup is not available yet. The account database migration needs to be installed, or the connection needs checking.'); return }
      setProfile(p.data); setDisplayName(p.data.display_name); setUsername(p.data.username); setSocial(socialValues(p.data)); setShowPhoto(Boolean(p.data.share_leaderboard_photo))
      setBalance(w.error ? null : w.data?.points ?? null); onBalanceChange?.(w.error ? null : w.data?.points ?? null)
      setRoles(r.error ? [] : r.data.map(item => item.role)); setEvents(h.error ? [] : h.data)
      if (w.error || h.error) setMessage('Profile loaded. Points or recent activity could not be loaded; try Refresh profile.')
      const signed = await avatarUrl(p.data.avatar_path)
      if (active) setPhoto(signed)
    }).catch(() => { if (active) setMessage('Could not load your profile. Please try again.') }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [session.user.id, refresh, onBalanceChange])
  useEffect(() => {
    let active = true; setQr('')
    if (profile?.member_code) import('qrcode').then(module => (module.default || module).toDataURL(`aureatine:member:${profile.member_code}`, { width: 280, margin: 4, errorCorrectionLevel: 'M', color: { dark: '#241d17', light: '#ffffff' } })).then(url => { if (active) setQr(url) }).catch(() => { if (active) setMessage('QR generation failed. Staff can enter your member code instead.') })
    return () => { active = false }
  }, [profile?.member_code])
  async function save(event) {
    event.preventDefault(); if (busy) return
    const name = displayName.trim().normalize('NFC'), handle = username.trim().normalize('NFC')
    if ([...name].length < 1 || [...name].length > 60 || [...handle].length < 3 || [...handle].length > 40 || /[\u0000-\u001f\u007f]/.test(name + handle)) { setMessage('Use a 1–60 character display name and a unique 3–40 character username. Newlines and control characters are not allowed.'); return }
    const cleaned = Object.fromEntries(Object.entries(social).map(([key,value])=>[key,value.trim()]))
    if([...cleaned.bio].length>300 || ['facebook','instagram','tiktok'].some(site=>!validSocialURL(cleaned[site+'_url'],site))){setMessage('Use a bio up to 300 characters and full HTTPS links on the matching Facebook, Instagram or TikTok website.');return}
    for(const site of ['facebook','instagram','tiktok'])if(cleaned[site+'_url'])cleaned[site+'_url']=new URL(cleaned[site+'_url']).href
    setBusy(true); setMessage('')
    try {
      const available=await supabase.rpc('check_member_names',{p_display_name:name,p_username:handle})
      if(available.error){setMessage('Could not check name availability. Try again after database setup is complete.');return}
      if(available.data?.display_taken){setMessage('Display name already taken.');return}
      if(available.data?.username_taken){setMessage('Username already taken.');return}
      if(showPhoto && !profile.share_leaderboard_photo){
        if(!profile.avatar_path || !profile.community_id){setMessage('Upload a profile photo first, then enable leaderboard sharing.');return}
        const source=await supabase.storage.from('member-avatars').download(profile.avatar_path)
        if(source.error)throw source.error
        const copy=await supabase.storage.from('leaderboard-avatars').upload(`${profile.community_id}/avatar.webp`,source.data,{upsert:true,contentType:'image/webp',cacheControl:'0'})
        if(copy.error)throw copy.error
      }
      const { data, error } = await supabase.from('member_profiles').update({ display_name: name, username: handle, ...cleaned,share_leaderboard_photo:showPhoto }).eq('user_id', session.user.id).select('display_name,username,member_code,manual_code,avatar_path,bio,facebook_url,instagram_url,tiktok_url,community_id,share_leaderboard_photo').single()
      if (error) { setMessage(error.code === '23505' ? (error.message?.includes('member_display_name_casefold') ? 'Display name already taken.' : 'Username already taken.') : 'Profile could not be saved. Please try again.'); return }
      setProfile(data); setDisplayName(data.display_name); setUsername(data.username); setSocial(socialValues(data)); setSocialRefresh(n=>n+1); setMessage('Profile saved successfully.'); setEditing(false); editButton.current?.focus()
    } catch { setMessage('Could not connect. Your changes have not been confirmed.') } finally { if (mounted.current) setBusy(false) }
  }
  async function upload(event) {
    const file = event.target.files?.[0]; event.target.value = ''; if (!file || busy) return
    setBusy(true); setMessage('')
    try {
      const blob = await prepareAvatar(file), path = `${session.user.id}/avatar.webp`
      const { error: uploadError } = await supabase.storage.from('member-avatars').upload(path, blob, { upsert: true, contentType: 'image/webp', cacheControl: '0' })
      if (!uploadError && profile.share_leaderboard_photo){const copy=await supabase.storage.from('leaderboard-avatars').upload(`${profile.community_id}/avatar.webp`,blob,{upsert:true,contentType:'image/webp',cacheControl:'0'});if(copy.error)throw Error('Your private photo uploaded, but the leaderboard copy did not update. Please retry the upload.')}
      if (uploadError) throw Error('Photo upload failed. Check that private photo storage is configured.')
      const { error } = await supabase.from('member_profiles').update({ avatar_path: path }).eq('user_id', session.user.id).select('user_id').single()
      if (error) throw Error('Photo uploaded, but linking it to your profile failed. Please retry.')
      setPhoto(await avatarUrl(path)); setProfile(previous => ({ ...previous, avatar_path: path })); setMessage('Profile photo updated.')
    } catch (error) { setMessage(error.message || 'Unable to upload that image.') } finally { if (mounted.current) setBusy(false) }
  }
  async function rotate() {
    if (busy) return; setBusy(true)
    try { const { data, error } = await supabase.rpc('rotate_member_codes'); if (error || !parseMemberCode(data?.member_code) || !/^[A-HJ-NP-Z]{6}$/.test(data?.manual_code || '')) throw Error('Could not replace the code.'); setProfile(p => ({ ...p, member_code: data.member_code, manual_code: data.manual_code })); setRotateConfirm(false); setMessage('New QR and manual code created. Both previous codes no longer work.') }
    catch { setMessage('Could not replace the code. Try again later.') } finally { setBusy(false) }
  }
  return <article className="member-page shell"><header className="member-heading"><div><span className="section-label">The Aureatine club</span><h1>Your routine.<br/><em>Your own space.</em></h1><p>Your profile, member code and verified points.</p></div><div className="member-header-actions"><button className="button outline" disabled={loading || busy} onClick={() => { setMessage(''); setRefresh(n => n + 1) }}>Refresh profile</button><Link to="/login" className="text-button">Account & sign out ↗</Link>{isAdmin&&<Link to="/admin" className="text-button">Manage members ↗</Link>}{roles.length > 0 && <Link to="/staff" className="button dark">Staff scanner ↗</Link>}</div></header>
    {message && <output className="member-notice" role="status">{message}</output>}
    {loading ? <p className="member-notice">Loading your membership…</p> : profile && <><div className="member-layout"><section className="member-card member-editor member-account-card" aria-label="Your account">
    <div className="member-account-top"><div className="member-photo-row">{photo ? <img className="member-photo" src={photo} alt="Your profile"/> : <span className="member-photo member-initial-avatar" aria-label="No profile photo">{(Array.from(profile.display_name)[0] || '').toUpperCase()}</span>}<div className="member-account-identity"><span className="section-label">MY ACCOUNT</span><h2>{profile.display_name}{isAdmin&&<span className="admin-badge">ADMIN</span>}</h2><p className="member-account-username">@{profile.username}</p></div></div><button ref={editButton} type="button" className="account-edit-button" aria-label="Edit personal information" title="Edit personal information" aria-expanded={editing} aria-controls="personal-information-editor" disabled={busy} onClick={()=>{setEditing(value=>!value);setDisplayName(profile.display_name);setUsername(profile.username);setSocial(socialValues(profile));setShowPhoto(Boolean(profile.share_leaderboard_photo))}}><EditPencil/></button></div>
    <OwnRanking userId={session.user.id} refresh={`${refresh}:${balance}:${profile.display_name}`} Link={Link} profile/>
    {profile.bio && <p className="member-account-bio">{profile.bio}</p>}<SocialLinks profile={profile}/><CommunityStats userId={session.user.id} refresh={`${refresh}:${socialRefresh}`}/>
    <button ref={peopleButton} type="button" className="find-people-button" aria-expanded={peopleOpen} aria-controls="member-community-disclosure" onClick={()=>peopleOpen?closePeople():setPeopleOpen(true)}><svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2M16 5a3 3 0 0 1 0 6M18 14a5 5 0 0 1 3 4v2"/></svg><span>Find your people</span><svg className="people-chevron" aria-hidden="true" viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m4 6 4 4 4-4"/></svg></button>
    <Link to="/tasks" className="profile-tasks-link"><svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V2h6v2M9 13l2 2 4-5"/></svg>View tasks<span aria-hidden="true">↗</span></Link>
    <p className="account-edit-hint">Your personal space. Use the pencil to edit your information.</p>
    {editing && <div id="personal-information-editor" className="personal-information-editor"><h3>Personal information</h3><label className="photo-upload"><EditPencil/> Change profile photo<input aria-label="Change profile photo" type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={upload}/></label><p className="member-helper">JPG, PNG or WebP · up to 2 MB. Your original photo stays private. You can share a copy on the leaderboard below. Photo changes save immediately.</p><form onSubmit={save}><label className="leaderboard-photo-consent"><input type="checkbox" checked={showPhoto} onChange={e=>setShowPhoto(e.target.checked)} disabled={busy}/> Show my photo on the leaderboard</label><p className="member-helper">Optional: your photo becomes publicly visible only while you are also opted into the leaderboard. Turn this off and save to hide the image from future leaderboard loads. Downloaded images and previously issued image links cannot be recalled.</p><label>Display name<input autoFocus value={displayName} onChange={e => setDisplayName(e.target.value)} minLength={1} maxLength={60} required autoComplete="name" disabled={busy}/></label><label>Username<input value={username} onChange={e => setUsername(e.target.value)} minLength={3} maxLength={40} required autoComplete="username" disabled={busy}/></label><label>Bio<textarea maxLength={300} value={social.bio} onChange={e=>setSocial(v=>({...v,bio:e.target.value}))} disabled={busy} placeholder="A little about you and your routine…"/></label>{['facebook','instagram','tiktok'].map(site=><label key={site}>{site==='tiktok'?'TikTok':site[0].toUpperCase()+site.slice(1)} link<input type="url" maxLength={500} placeholder={`https://www.${site}.com/your-profile`} value={social[site+'_url']} onChange={e=>setSocial(v=>({...v,[site+'_url']:e.target.value}))} disabled={busy}/></label>)}<p className="member-helper">Your display name, username, bio and social links are searchable by signed-in members. Leave optional details blank to keep them private.</p><label>Login email<input value={session.user.email || ''} readOnly type="text"/></label><p className="member-helper">Choose your own name and username, including spaces, capitals and symbols. Usernames stay unique, ignoring case. Your display name appears on the leaderboard only if you opt in. Your login email cannot be changed in this editor.</p><div className="account-editor-actions"><button className="button dark" disabled={busy}>{busy ? 'Saving…' : 'Save profile'}</button><button type="button" className="text-button" disabled={busy} onClick={()=>{setEditing(false);setDisplayName(profile.display_name);setUsername(profile.username);setSocial(socialValues(profile));setShowPhoto(Boolean(profile.share_leaderboard_photo));editButton.current?.focus()}}>Cancel</button></div></form></div>}
    </section>
    <section className="member-card member-qr"><span className="section-label">ONE MEMBER. ONE CODE.</span><h2>Ready for your next visit.</h2>{qr ? <img className="member-qr-image" src={qr} alt="Your personal Aureatine member QR code"/> : <p>Preparing your QR code…</p>}<strong>@{profile.username}</strong><p>Show this to APEX or Aureatine staff. A scan alone does not award points—staff must verify and confirm.</p><div className="manual-member-code"><span>MANUAL MEMBER CODE</span><code>{profile.manual_code || 'Code setup pending'}</code><p>Six letters · show this to staff if scanning is unavailable.</p></div><div className="qr-actions">{qr && <a className="button outline" href={qr} download="Aureatine-member-QR.png">Download QR</a>}<button className="text-button" disabled={busy} onClick={() => setRotateConfirm(true)}>Replace code</button></div>{rotateConfirm && <div className="member-notice"><p>Replace your QR and six-letter code? Both old codes will stop working.</p><button className="button dark" disabled={busy} onClick={rotate}>Confirm replacement</button><button className="text-button" disabled={busy} onClick={() => setRotateConfirm(false)}>Cancel</button></div>}<p className="member-helper">Keep this code private this code identifies your account or membership</p></section></div>
    <div id="member-community-disclosure" hidden={!peopleOpen}>{peopleOpen && <MemberCommunity refresh={`${refresh}:${socialRefresh}`} onChange={()=>setSocialRefresh(n=>n+1)} onClose={closePeople}/>}</div><section className="member-card member-points"><div><span className="section-label">VERIFIED POINTS</span><h2>{balance === null ? '—' : balance.toLocaleString()} <small>points</small></h2><p>APEX: 10 points per verified visit.<br/>Aureatine: 1 point per ₱5 spent, rounded down.</p><Link to="/rewards" className="text-button">Explore redeemables ↗</Link></div><div><h3>Recent points earned</h3>{events.length ? <ul>{events.map(item => <li key={item.id}><span>{item.kind === 'visit' ? 'APEX gym visit' : 'Aureatine purchase'}<small>{new Date(item.created_at).toLocaleString('en-PH', { timeZone: 'Asia/Manila' })} · PH time</small></span><strong>+{item.points}</strong></li>)}</ul> : <p>No recent earning records to show.</p>}<p className="member-helper">Latest 10 earning records. Refresh after a staff award to update your balance.</p></div></section></>}
  </article>
}

const awardErrors = { LOOKUP_LIMIT: 'Too many member lookups. Please wait up to five minutes before trying again.', STAFF_ONLY: 'Your staff role is not authorized for this action.', INVALID_CODE: 'This member code is invalid or has been replaced.', SELF_AWARD: 'Staff cannot award points to their own account.', INVALID_REFERENCE: 'Use a unique 3–80 character visit or receipt reference: letters, numbers, dash, slash, dot or underscore.', INVALID_AMOUNT: 'Enter a purchase amount from ₱0.01 to ₱1,000,000, with at most two decimals.', DUPLICATE_REFERENCE: 'That visit or receipt reference has already been recorded. No additional points were awarded.', REQUEST_CONFLICT: 'This request conflicts with an earlier one. Ask the owner to review the record.', WALLET_UNAVAILABLE: 'The member’s points wallet is not available yet.', BALANCE_LIMIT: 'The points balance limit would be exceeded.' }
export function StaffScannerPage({ session, Link }) {
  return <MemberGate session={session} Link={Link}>{session && <StaffScanner key={session.user.id} session={session} Link={Link}/>}</MemberGate>
}
function StaffScanner({ session, Link }) {
  const [roles,setRoles]=useState(null),[accessError,setAccessError]=useState(''),[code,setCode]=useState(''),[member,setMember]=useState(null),[photo,setPhoto]=useState('')
  const [kind,setKind]=useState('visit'),[reference,setReference]=useState(''),[amount,setAmount]=useState(''),[confirmed,setConfirmed]=useState(false)
  const [busy,setBusy]=useState(false),[message,setMessage]=useState(''),[result,setResult]=useState(null),[pending,setPending]=useState(null)
  const lock=useRef(false), alive=useRef(true)
  const storageKey=`aureatine:pending-award:${session.user.id}`
  useEffect(()=>{alive.current=true;let active=true
    supabase.from('staff_members').select('role').eq('user_id',session.user.id).then(({data,error})=>{if(!active)return;if(error){setAccessError('Staff access is not configured or could not be checked.');setRoles([])}else{const list=data.map(r=>r.role);setRoles(list);setKind(list.includes('apex')?'visit':'purchase')}}).catch(()=>{if(active){setAccessError('Could not check staff access.');setRoles([])}})
    try {const saved=JSON.parse(sessionStorage.getItem(storageKey)||'null');if(saved?.p_request_id && parseMemberCode(saved.p_code)){
      setPending(saved);setCode(saved.p_code);setKind(saved.p_kind);setReference(saved.p_reference);setAmount(saved.p_amount_centavos===null?'':(saved.p_amount_centavos/100).toFixed(2));setMessage('A previous confirmation is unresolved. Retry it safely before starting another member.')
      supabase.from('member_point_events').select('id,points').eq('request_id',saved.p_request_id).eq('staff_id',session.user.id).maybeSingle().then(({data,error})=>{if(active&&data&&!error){setResult({ok:true,event_id:data.id,points:data.points,replayed:true});setPending(null);sessionStorage.removeItem(storageKey);setMessage('Previous award confirmed from the database.')}}).catch(()=>{})
    }}catch{}
    return()=>{active=false;alive.current=false}
  },[session.user.id,storageKey])
  function captured(value){if(pending)return;setCode(value);setMember(null);setPhoto('');setConfirmed(false);setResult(null);setMessage('')}
  async function verify(event){event?.preventDefault();if(lock.current)return;const parsed=parseMemberCode(code);if(!parsed){setMessage('Enter the six-letter member code or scan an Aureatine QR.');return}
    lock.current=true;setBusy(true);setMember(null);setConfirmed(false);setMessage('')
    try{const{data,error}=await supabase.rpc('verify_member',{p_code:parsed});if(error)throw error;if(!data?.ok){setMessage(awardErrors[data?.code]||'Member verification failed.');return}setMember(data);setCode(parsed);setPhoto(await avatarUrl(data.avatar_path))}catch{setMessage('Member verification is unavailable. Check the database setup or connection.')}finally{lock.current=false;if(alive.current)setBusy(false)}
  }
  async function award(){if(lock.current || result?.ok || (!pending && (!member || !confirmed)))return
    const cents=kind==='purchase'?purchaseCentavos(amount):null
    if(!pending && kind==='purchase'&&cents===null){setMessage(awardErrors.INVALID_AMOUNT);return}
    if(!pending && !/^[A-Za-z0-9][A-Za-z0-9._/-]{2,79}$/.test(reference.trim())){setMessage(awardErrors.INVALID_REFERENCE);return}
    const payload=pending||{p_code:parseMemberCode(code),p_kind:kind,p_reference:reference.trim().toUpperCase(),p_amount_centavos:cents,p_request_id:crypto.randomUUID()}
    // Persist BEFORE sending. Retrying an uncertain network request must reuse its ID.
    try{sessionStorage.setItem(storageKey,JSON.stringify(payload))}catch{setMessage('Browser session storage is unavailable. Enable it before confirming points, so retries remain safe.');return}
    lock.current=true;setBusy(true);setPending(payload);setMessage('')
    try{const{data,error}=await supabase.rpc('award_member_points',payload);if(error)throw error
      if(data?.ok===true && Number.isSafeInteger(data.points) && typeof data.event_id==='string'){setResult(data);setPending(null);sessionStorage.removeItem(storageKey);setMessage('')}
      else if(data?.ok===false){setPending(null);sessionStorage.removeItem(storageKey);setMessage(awardErrors[data.code]||'No award was confirmed. Please check with the owner.')}
      else throw Error('Invalid response')
    }catch{setMessage('The result could not be confirmed. Retry this same request; do not create a new receipt or visit reference.')}
    finally{lock.current=false;if(alive.current)setBusy(false)}
  }
  const canKind=k=>roles?.includes(k==='visit'?'apex':'aureatine')
  const quoted=kind==='visit'?10:Math.floor((purchaseCentavos(amount)||0)/500)
  return <article className="member-page shell"><header className="member-heading"><div><span className="section-label">AUTHORIZED STAFF ONLY</span><h1>Scan. Verify.<br/><em>Recognize the routine.</em></h1><p>Identify the member and confirm the actual visit or paid purchase.</p></div><Link to="/profile" className="button outline">My profile ↗</Link></header>
    {roles===null?<p className="member-notice">Checking staff access…</p>:roles.length===0?<p className="member-notice" role="status">{accessError||'This account is not authorized as staff. The owner must assign your staff role in Supabase.'}</p>:<section className="member-card staff-workspace"><div className="staff-role-label">{roles.map(role=>role==='apex'?'APEX gym staff':'Aureatine purchase staff').join(' · ')}</div>
      {message&&<output className="member-notice" role="status">{message}</output>}
      {result?.ok?<div className="staff-success" role="status"><h2>{result.replayed?'Award already recorded.':'Points awarded successfully.'}</h2><strong>+{result.points} points</strong><p>{result.replayed?'No duplicate points were added.':'The database confirmed this award.'}</p><small>Record: {result.event_id}</small><button className="button dark" onClick={()=>{setResult(null);setMember(null);setPhoto('');setCode('');setReference('');setAmount('');setConfirmed(false);setMessage('');setKind(roles.includes('apex')?'visit':'purchase')}}>Scan next member</button></div>:pending?<div className="member-notice"><h2>Confirm the previous request.</h2><p>Reference: {pending.p_reference}. Retrying uses the original request ID, so a completed award will not be added twice.</p><button className="button dark" disabled={busy} onClick={award}>{busy?'Checking…':'Retry confirmation safely'}</button></div>:<>
        <MemberScanner onCode={captured}/><form className="staff-code-form" onSubmit={verify}><label>Member code<input value={code} onChange={e=>captured(e.target.value)} placeholder="6-letter code, e.g. ABCDEF" autoCapitalize="characters" spellCheck={false} disabled={busy} autoComplete="off" required/></label><button className="button dark" disabled={busy || !code.trim()}>{busy?'Verifying…':'Verify member'}</button></form>
        {member&&<div className="verified-member"><div className="member-photo-row">{photo?<img className="member-photo" src={photo} alt="Member profile for staff verification"/>:<span className="member-photo member-initial-avatar">{Array.from(member.display_name || '')[0]}</span>}<div><span className="section-label">MEMBER FOUND</span><h2>{member.display_name}</h2><p>@{member.username}</p></div></div><p className="member-helper">A static QR can be copied. Confirm that this person is the member; a profile photo alone is not proof of identity.</p>
          <fieldset disabled={busy}><legend>Record a verified activity</legend><div className="staff-kind-options">{canKind('visit')&&<button type="button" aria-pressed={kind==='visit'} onClick={()=>{setKind('visit');setConfirmed(false)}}>APEX visit · 10 points</button>}{canKind('purchase')&&<button type="button" aria-pressed={kind==='purchase'} onClick={()=>{setKind('purchase');setConfirmed(false)}}>Aureatine purchase · ₱5 / point</button>}</div>
          <label>{kind==='visit'?'Unique visit reference':'Unique receipt reference'}<input value={reference} onChange={e=>{setReference(e.target.value);setConfirmed(false)}} placeholder={kind==='visit'?'VISIT-20261013-001':'RECEIPT-001'} maxLength={80}/></label><p className="member-helper">Use your actual check-in or receipt reference. Reuse the same reference when retrying the same activity, never a new one. Multiple genuine visits can earn points.</p>
          {kind==='purchase'&&<label>Amount paid (PHP)<input type="text" inputMode="decimal" value={amount} onChange={e=>{setAmount(e.target.value);setConfirmed(false)}} placeholder="e.g. 150.00"/></label>}<p className="staff-award-total">Points to award: <strong>{quoted}</strong>{kind==='purchase'&&<small>₱150 earns 30 points. Partial points are rounded down.</small>}</p><label className="staff-confirm"><input type="checkbox" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)}/><span>I verified this member and the {kind==='visit'?'actual gym visit':'paid purchase'}. This activity has not already earned points.</span></label><button type="button" className="button dark" disabled={!confirmed || !reference.trim() || (kind==='purchase'&&purchaseCentavos(amount)===null)} onClick={award}>Confirm & award {quoted} points</button>
          </fieldset></div>}
      </>}
    </section>}
  </article>
}

export function MemberTasksPage({session,Link,onBalanceChange}) {
 return <MemberGate session={session} Link={Link}>{session && <article className="member-page tasks-page shell"><header className="member-heading"><div><h1>Tasks</h1><p>Check in, track your streaks and claim verified points.</p></div><Link to="/profile" className="button outline">Back to profile</Link></header><MemberTasks key={session.user.id} userId={session.user.id} Link={Link} onBalanceChange={onBalanceChange}/></article>}</MemberGate>
}
