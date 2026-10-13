import { useEffect, useState } from 'react'
import { supabase } from './supabase'
export default function LeaderboardAvatar({ name, path }) {
 const [image,setImage]=useState(null)
 useEffect(()=>{let active=true,url;setImage(null)
  if(path&&supabase)supabase.storage.from('leaderboard-avatars').download(path).then(({data,error})=>{if(active&&!error&&data){url=URL.createObjectURL(data);setImage(url)}}).catch(()=>{})
  return()=>{active=false;if(url)URL.revokeObjectURL(url)}
 },[path])
 return image?<img className="member-initial leaderboard-photo" src={image} alt={name} onError={()=>setImage(null)}/>:<span className="member-initial" aria-hidden="true">{(Array.from(name)[0]||'').toUpperCase()}</span>
}
