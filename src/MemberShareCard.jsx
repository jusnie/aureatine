import {useEffect,useRef,useState} from 'react'
import {supabase} from './supabase'
import {cardFacts,drawMemberCard,canvasPNG} from './memberCardCanvas'
import './memberShareCard.css'
import CardLoader from './CardLoader'
function canShareFile(file){try{return Boolean(file&&navigator.canShare?.({files:[file]}))}catch{return false}}
function DownloadIcon(){return <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/></svg>}
export default function MemberShareCard({session,Link}){
 if(!supabase||!session)return <section className="shell member-share-page"><h1>Your member card.</h1><p>Sign in to preview and download your own card.</p><Link to="/login" className="button dark">Log in</Link></section>
 return <CardEditor key={session.user.id} userId={session.user.id} Link={Link}/>
}
function CardEditor({userId,Link}){
 const[source,setSource]=useState(null),[loading,setLoading]=useState(true),[error,setError]=useState(''),[warnings,setWarnings]=useState([]),[version,setVersion]=useState(0)
 const[options,setOptions]=useState({photo:true,rank:true,achievements:true}),[output,setOutput]=useState(null),[rendering,setRendering]=useState(false),[notice,setNotice]=useState(''),[sharing,setSharing]=useState(false),[revealed,setRevealed]=useState(false)
 const alive=useRef(true)
 useEffect(()=>{alive.current=true;return()=>{alive.current=false}},[])
 useEffect(()=>{let active=true,photoURL;const abort=new AbortController();const timer=setTimeout(()=>abort.abort(),15000);setLoading(true);setSource(null);setError('');setWarnings([])
  async function load(){try{
   const[p,r,t]=await Promise.all([
    supabase.from('member_profiles').select('display_name,username,avatar_path').eq('user_id',userId).single().abortSignal(abort.signal),
    supabase.rpc('get_my_leaderboard_standing').abortSignal(abort.signal),supabase.rpc('get_member_tasks').abortSignal(abort.signal)
   ])
   if(p.error||!p.data?.display_name||!p.data?.username)throw Error('Your profile could not be loaded. Please refresh to try again.')
   const notes=[];let image=null
   if(r.error||!r.data?.ok)notes.push('Your ranking could not be loaded, so it will not appear on the card.')
   if(t.error||!t.data?.ok)notes.push('Task achievements could not be loaded, so they will not appear on the card.')
   if(p.data.avatar_path){try{const{data,error}=await supabase.storage.from('member-avatars').download(p.data.avatar_path,undefined,{signal:abort.signal,cache:'no-store'});if(error||!data)throw Error('photo');if(!active)return;photoURL=URL.createObjectURL(data);image=new Image();image.src=photoURL;await image.decode()}catch{image=null;notes.push('Your photo could not be loaded. The card uses your initial instead; refresh to retry.')}}
   if(!active)return
   const facts=cardFacts(r.error?null:r.data,t.error?null:t.data)
   const day=t.data?.ok&&/^\d{4}-\d{2}-\d{2}$/.test(t.data.today||'')?t.data.today:new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Manila',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())
   setSource({profile:{display_name:p.data.display_name,username:p.data.username},image,...facts,snapshotDate:day,rankReady:!r.error&&r.data?.ok===true,tasksReady:!t.error&&t.data?.ok===true});setWarnings(notes)
  }catch(e){if(active)setError(e.message||'Could not load your card. Please try again.')}finally{clearTimeout(timer);if(active)setLoading(false)}}
  load();return()=>{active=false;clearTimeout(timer);abort.abort();if(photoURL)URL.revokeObjectURL(photoURL)}
 },[userId,version])
 useEffect(()=>{let active=true,url;setOutput(null);setNotice('');setRevealed(false);if(!source){setRendering(false);return}setRendering(true)
  async function render(){try{await Promise.all([document.fonts.load('600 42px Manrope'),document.fonts.load('400 22px "DM Sans"')]).catch(()=>{/* Native sans-serif remains available offline. */});if(!active)return
   const canvas=document.createElement('canvas');drawMemberCard(canvas,{...source,image:options.photo?source.image:null,rank:options.rank?source.rank:null,achievements:options.achievements?source.achievements:[]})
   const blob=await canvasPNG(canvas);if(!active)return;url=URL.createObjectURL(blob);const file=new File([blob],'Aureatine-member-card.png',{type:'image/png'});setOutput({url,blob,file});
  }catch(e){if(active)setNotice(e.message||'Could not create the card. Please try again.')}finally{if(active)setRendering(false)}}
  render();return()=>{active=false;if(url)URL.revokeObjectURL(url)}
 },[source,options])
 async function share(){if(!output||sharing)return;setSharing(true);setNotice('');try{await navigator.share({files:[output.file],title:'My Aureatine member card'});if(alive.current)setNotice('Share sheet closed. Posting is controlled by the app you selected.')}catch(e){if(alive.current&&e.name!=='AbortError')setNotice('Sharing is unavailable here. Download the PNG instead.')}finally{if(alive.current)setSharing(false)}}
 const includedRank=options.rank?source?.rank:null, includedAchievements=[]
 const canShare=canShareFile(output?.file)
 return <article className="shell member-share-page"><header className="share-page-heading"><div><h1>Your member card.</h1><p>Your name. Your progress. Ready to take with you.</p></div><Link to="/profile" className="text-button">Back to profile ↗</Link></header>
 <div className="share-card-workspace"><section className="share-card-preview" aria-label="Member card preview" aria-busy={loading||rendering}>
 {(loading||rendering||(output&&!revealed))?<CardLoader ready={!loading&&!rendering&&!!output} onComplete={()=>setRevealed(true)} label={loading?'Loading your account':'Preparing your card'}/>:output&&source&&!loading?<img className="card-sync-in" src={output.url} width="1080" height="1350" alt={`Aureatine member card for ${source.profile.display_name}, @${source.profile.username}${includedRank?`, leaderboard rank ${includedRank}`:''}${includedAchievements.length?', '+includedAchievements.map(a=>a.label).join(', '):''}. Snapshot ${source.snapshotDate}.`}/>:<div className="share-preview-placeholder"><DownloadIcon/><p>{loading?'Loading your account…':rendering?'Preparing your card…':'Your card preview will appear here.'}</p></div>}
 </section><aside className="share-card-controls"><h2>Make it share-ready.</h2><p className="share-card-description">A portrait card with your saved account details and an Aureatine watermark. Nothing is posted automatically.</p>
 {error&&<output className="share-card-message">{error}</output>}{warnings.map(note=><p className="share-card-message" key={note}>{note}</p>)}
 <fieldset disabled={!source||loading||sharing}><legend>Include on your card</legend>{[['photo','Profile photo',Boolean(source?.image)],['rank','Leaderboard rank',Boolean(source?.rank)]].map(([key,label,available])=><label key={key}><input type="checkbox" checked={options[key]&&available} disabled={!available} onChange={e=>setOptions(current=>({...current,[key]:e.target.checked}))}/><span>{label}</span></label>)}</fieldset>
 {source&&<div className="share-card-facts"><p><strong>{source.profile.display_name}</strong><br/>@{source.profile.username}</p>{source.rankReady&&!source.rank&&<p>You are not listed on the leaderboard. No rank is added to your card.</p>}{!source.image&&<p>Your initial is used when no photo is available.</p>}<small>Snapshot: {source.snapshotDate} · Philippine date</small></div>}
 <div className="share-card-actions">{output&&!loading&&!rendering?<a className="button dark" href={output.url} download="Aureatine-member-card.png" onClick={()=>setNotice('PNG download requested. On some phones, open the image and choose Save Image.')}><DownloadIcon/>Download PNG</a>:<button className="button dark" disabled><DownloadIcon/>{loading||rendering?'Preparing…':'Download PNG'}</button>}{canShare&&<button className="button outline" disabled={sharing||rendering||loading} onClick={share}>{sharing?'Opening…':'Share card'}</button>}<button type="button" className="text-button" disabled={loading||sharing} onClick={()=>setVersion(n=>n+1)}>Refresh card details</button></div>
 {output&&source&&!loading&&<a href={output.url} target="_blank" rel="noopener noreferrer" className="share-open-image">Open full-size image ↗</a>}{notice&&<output className="share-card-message">{notice}</output>}
 <p className="share-card-privacy">1080 × 1350 PNG · Generated in your browser.<br/>No email, QR code or login details are included. Downloading does not share your photo publicly.</p><p className="share-card-disclaimer">A personal progress snapshot, not a membership pass. Ranks can change.</p>
 </aside></div></article>
}
