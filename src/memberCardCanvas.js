export const CARD_WIDTH=1080, CARD_HEIGHT=1350
// Neumorphic brown card: raised base surface, pressed-in photo well, light brown fade only at the photo edge.
const BASE='#ede0d4', SAND='#e6ccb2', INK='#4a2f20', MUTED='#6b4a38'
// Georgia is installed on every phone and desktop, so the card renders the same without loading web fonts.
const DISPLAY='Georgia, "Times New Roman", serif'
const BODY='system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
const CARD={x:36,y:36,w:1008,h:1278,r:56}
const PANEL={x:84,y:168,w:912,h:880,r:40}
export function cardFacts(standing,tasks){
 const rank=standing?.ok&&standing.opted_in&&Number.isSafeInteger(standing.rank)&&standing.rank>0?standing.rank:null
 const achievements=[]
 if(tasks?.ok){
  if(tasks.signup_claimed===true)achievements.push({key:'signup',label:'Signup bonus earned'})
  if(tasks.daily_claimed===true&&/^\d{4}-\d{2}-\d{2}$/.test(tasks.today||''))achievements.push({key:'daily',label:'Daily check-in',detail:tasks.today})
  if(tasks.gym_claimed===true)achievements.push({key:'gym',label:'5 gym days completed'})
 }
 return {rank,achievements}
}
const graphemes=text=>typeof Intl.Segmenter==='function'?[...new Intl.Segmenter(undefined,{granularity:'grapheme'}).segment(text)].map(s=>s.segment):Array.from(text)
function wrap(ctx,text,width){
 const lines=[];let line=''
 for(const word of text.split(/(\s+)/).filter(Boolean)){
  if(ctx.measureText(line+word).width<=width){line+=word;continue}
  if(line.trim()){lines.push(line.trim());line=''}
  for(const char of graphemes(word.trimStart())){if(ctx.measureText(line+char).width>width&&line){lines.push(line);line=''}line+=char}
 }
 if(line.trim())lines.push(line.trim())
 return lines
}
function fitted(ctx,text,width,maxLines,initial,min){
 let lines=[],size=initial
 for(;size>=min;size-=2){ctx.font=`600 ${size}px ${DISPLAY}`;lines=wrap(ctx,text,width);if(lines.length<=maxLines)break}
 if(lines.length>maxLines)throw Error('This name could not fit on the card. Please try a shorter display name.')
 return {lines,size}
}
function rounded(ctx,x,y,w,h,r){ctx.beginPath();ctx.roundRect(x,y,w,h,r)}
function cover(ctx,image,x,y,w,h){
 const iw=image.naturalWidth||image.width,ih=image.naturalHeight||image.height
 const scale=Math.max(w/iw,h/ih),sw=w/scale,sh=h/scale
 ctx.drawImage(image,(iw-sw)/2,(ih-sh)*.42,sw,sh,x,y,w,h)
}
// Raised surface: a warm shadow falls bottom-right and a soft light edge sits top-left.
function raised(ctx,b){
 ctx.save()
 ctx.shadowColor='rgba(127,85,57,0.38)';ctx.shadowBlur=44;ctx.shadowOffsetX=20;ctx.shadowOffsetY=22
 ctx.fillStyle=BASE;rounded(ctx,b.x,b.y,b.w,b.h,b.r);ctx.fill()
 ctx.shadowColor='rgba(255,255,255,0.85)';ctx.shadowBlur=36;ctx.shadowOffsetX=-16;ctx.shadowOffsetY=-16
 rounded(ctx,b.x,b.y,b.w,b.h,b.r);ctx.fill()
 ctx.restore()
}
// Pressed-in well: a shadow cast from inside the top-left edge.
function pressed(ctx,b){
 ctx.save()
 rounded(ctx,b.x,b.y,b.w,b.h,b.r);ctx.clip()
 ctx.beginPath();ctx.rect(b.x-400,b.y-400,b.w+800,b.h+800);ctx.roundRect(b.x,b.y,b.w,b.h,b.r)
 ctx.shadowColor='rgba(127,85,57,0.45)';ctx.shadowBlur=26;ctx.shadowOffsetX=10;ctx.shadowOffsetY=10
 ctx.fillStyle='#000';ctx.fill('evenodd')
 ctx.restore()
}
export function drawMemberCard(canvas,{profile,image,rank,snapshotDate}){
 canvas.width=CARD_WIDTH;canvas.height=CARD_HEIGHT
 const ctx=canvas.getContext('2d');if(!ctx)throw Error('Your browser cannot create the card image.')
 const initial=graphemes(profile.display_name)[0]?.toUpperCase()||''
 ctx.fillStyle=BASE;ctx.fillRect(0,0,CARD_WIDTH,CARD_HEIGHT)
 raised(ctx,CARD)
 // Photo well: the member photo, or an initial on a sand tile.
 ctx.save();rounded(ctx,PANEL.x,PANEL.y,PANEL.w,PANEL.h,PANEL.r);ctx.clip()
 if(image)cover(ctx,image,PANEL.x,PANEL.y,PANEL.w,PANEL.h)
 else{
  ctx.fillStyle=SAND;ctx.fillRect(PANEL.x,PANEL.y,PANEL.w,PANEL.h)
  const disc=ctx.createRadialGradient(540,598,40,540,598,300);disc.addColorStop(0,'rgba(156,102,68,0.9)');disc.addColorStop(1,'rgba(156,102,68,0.12)')
  ctx.fillStyle=disc;ctx.beginPath();ctx.arc(540,598,300,0,Math.PI*2);ctx.fill()
  ctx.fillStyle=BASE;ctx.font=`600 260px ${DISPLAY}`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(initial,540,612);ctx.textAlign='left';ctx.textBaseline='alphabetic'
 }
 // Light brown fade only along the bottom edge of the photo.
 const fade=ctx.createLinearGradient(0,PANEL.y+PANEL.h-150,0,PANEL.y+PANEL.h);fade.addColorStop(0,'rgba(127,85,57,0)');fade.addColorStop(1,'rgba(127,85,57,0.28)')
 ctx.fillStyle=fade;ctx.fillRect(PANEL.x,PANEL.y+PANEL.h-150,PANEL.w,150)
 ctx.restore()
 pressed(ctx,PANEL)
 // Watermark, upper left, and the tagline, upper right.
 ctx.fillStyle=INK;ctx.font=`600 42px ${DISPLAY}`;ctx.fillText('Aureatine',84,124)
 ctx.textAlign='right';ctx.font=`500 19px ${BODY}`;ctx.fillStyle=MUTED;ctx.fillText('Your next rep. Your new favorite sip.',996,118);ctx.textAlign='left'
 // Identity below the photo: name, username, and the rank on the same line.
 const name=fitted(ctx,profile.display_name,912,2,60,32)
 ctx.fillStyle=INK
 const nameBase=PANEL.y+PANEL.h+80
 name.lines.forEach((line,i)=>ctx.fillText(line,84,nameBase+i*name.size*1.12))
 const userY=nameBase+(name.lines.length-1)*name.size*1.12+50
 ctx.fillStyle=MUTED;ctx.font=`400 26px ${BODY}`;ctx.fillText('@'+profile.username,84,userY)
 if(rank){
  const value='#'+rank.toLocaleString('en-PH')
  ctx.font=`600 30px ${DISPLAY}`;ctx.fillStyle=INK;ctx.textAlign='right';ctx.fillText(value,996,userY)
  const valueW=ctx.measureText(value).width
  ctx.font=`500 21px ${BODY}`;ctx.fillStyle=MUTED;ctx.fillText('Leaderboard rank',996-valueW-14,userY)
  ctx.textAlign='left'
 }
 ctx.fillStyle='rgba(127,85,57,0.2)';ctx.fillRect(84,userY+30,912,2)
 // Footer sits on the base outside the card.
 ctx.fillStyle=MUTED;ctx.font=`400 18px ${BODY}`;ctx.fillText('Community snapshot · '+snapshotDate+' · PH',84,1338)
 ctx.textAlign='right';ctx.fillStyle=INK;ctx.font=`600 20px ${BODY}`;ctx.fillText('aureatine.cc.cd',996,1338);ctx.textAlign='left'
 return canvas
}
export function canvasPNG(canvas){return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(Error('Could not export the PNG. Try another browser.')),'image/png'))}
