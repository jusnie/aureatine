export const CARD_WIDTH=1080, CARD_HEIGHT=1350
const INK='#0b090a', MIST='#d3d3d3', WHITE='#ffffff'
const DISPLAY='Manrope, sans-serif', BODY='"DM Sans", sans-serif'
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
export function drawMemberCard(canvas,{profile,image,rank,snapshotDate}){
 canvas.width=CARD_WIDTH;canvas.height=CARD_HEIGHT
 const ctx=canvas.getContext('2d');if(!ctx)throw Error('Your browser cannot create the card image.')
 const initial=graphemes(profile.display_name)[0]?.toUpperCase()||''
 ctx.save();rounded(ctx,0,0,CARD_WIDTH,CARD_HEIGHT,48);ctx.clip()
 // Base: black field with a red glow top-left and a soft grey glow bottom-right.
 ctx.fillStyle=INK;ctx.fillRect(0,0,CARD_WIDTH,CARD_HEIGHT)
 const glowA=ctx.createRadialGradient(140,140,0,140,140,760);glowA.addColorStop(0,'rgba(164,22,26,0.62)');glowA.addColorStop(1,'rgba(164,22,26,0)');ctx.fillStyle=glowA;ctx.fillRect(0,0,CARD_WIDTH,CARD_HEIGHT)
 const glowB=ctx.createRadialGradient(980,1180,0,980,1180,640);glowB.addColorStop(0,'rgba(211,211,211,0.14)');glowB.addColorStop(1,'rgba(211,211,211,0)');ctx.fillStyle=glowB;ctx.fillRect(0,0,CARD_WIDTH,CARD_HEIGHT)

 // Photo panel: the member photo, or an initial on a glass tile.
 ctx.save();rounded(ctx,36,126,1008,1104,36);ctx.clip()
 if(image)cover(ctx,image,36,126,1008,1104)
 else{
  ctx.fillStyle='#14110f';ctx.fillRect(36,126,1008,1104)
  const disc=ctx.createRadialGradient(540,520,40,540,520,330);disc.addColorStop(0,'rgba(164,22,26,0.95)');disc.addColorStop(1,'rgba(164,22,26,0.15)')
  ctx.fillStyle=disc;ctx.beginPath();ctx.arc(540,520,330,0,Math.PI*2);ctx.fill()
  ctx.fillStyle='rgba(211,211,211,0.92)';ctx.font=`600 300px ${DISPLAY}`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(initial,540,540);ctx.textAlign='left';ctx.textBaseline='alphabetic'
 }
 // Scrim keeps the watermark legible over bright photos.
 const top=ctx.createLinearGradient(0,126,0,500);top.addColorStop(0,'rgba(11,9,10,0.85)');top.addColorStop(1,'rgba(11,9,10,0)');ctx.fillStyle=top;ctx.fillRect(36,126,1008,374)
 ctx.restore()

 // Black gradient rises from the bottom so the identity reads over any photo.
 const fade=ctx.createLinearGradient(0,540,0,1240);fade.addColorStop(0,'rgba(11,9,10,0)');fade.addColorStop(.42,'rgba(11,9,10,0.84)');fade.addColorStop(1,'rgba(11,9,10,0.97)');ctx.fillStyle=fade;ctx.fillRect(36,540,1008,700)
 // Watermark, upper left.
 ctx.fillStyle=WHITE;ctx.font=`600 42px ${DISPLAY}`;ctx.fillText('Aureatine',66,84)
 ctx.textAlign='right';ctx.font=`500 21px ${BODY}`;ctx.fillStyle=MIST;ctx.fillText('Your next rep. Your new favorite sip.',1014,79);ctx.textAlign='left'
 // Identity: a small name with the username under it, kept low so the photo leads.
 const NAME_X=76
 const name=fitted(ctx,profile.display_name,928,2,56,30)
 ctx.fillStyle=WHITE
 name.lines.forEach((line,i)=>ctx.fillText(line,NAME_X,1060-(name.lines.length-1-i)*name.size*1.12))
 ctx.fillStyle=MIST;ctx.font=`400 26px ${BODY}`;ctx.fillText('@'+profile.username,NAME_X,1112)
 // Rank line, only when the member is opted in to the leaderboard.
 if(rank){
  ctx.fillStyle='rgba(211,211,211,0.14)';ctx.fillRect(NAME_X,1140,928,1.5)
  ctx.fillStyle=MIST;ctx.font=`500 22px ${BODY}`;ctx.fillText('Leaderboard rank',NAME_X,1190)
  const labelW=ctx.measureText('Leaderboard rank').width
  ctx.fillStyle=WHITE;ctx.font=`600 30px ${DISPLAY}`;ctx.fillText('#'+rank.toLocaleString('en-PH'),NAME_X+labelW+18,1190)
 }

 // Footer.
 ctx.fillStyle=MIST;ctx.font=`400 19px ${BODY}`;ctx.fillText('Community snapshot · '+snapshotDate+' · PH',66,1297)
 ctx.textAlign='right';ctx.font=`600 21px ${BODY}`;ctx.fillText('aureatine.cc.cd',1014,1297);ctx.textAlign='left'
 ctx.restore()
 return canvas
}
export function canvasPNG(canvas){return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(Error('Could not export the PNG. Try another browser.')),'image/png'))}
