export const CARD_WIDTH=1080, CARD_HEIGHT=1350
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
 for(;size>=min;size-=2){ctx.font=`600 ${size}px Manrope, sans-serif`;lines=wrap(ctx,text,width);if(lines.length<=maxLines)break}
 if(lines.length>maxLines)throw Error('This name could not fit on the card. Please try a shorter display name.')
 return {lines,size}
}
function round(ctx,x,y,w,h,r){ctx.beginPath();ctx.roundRect(x,y,w,h,r)}
function cover(ctx,image,x,y,w,h){
 const iw=image.naturalWidth||image.width,ih=image.naturalHeight||image.height
 const scale=Math.max(w/iw,h/ih),sw=w/scale,sh=h/scale
 ctx.drawImage(image,(iw-sw)/2,(ih-sh)*.42,sw,sh,x,y,w,h)
}
function tick(ctx,x,y){ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+7,y+7);ctx.lineTo(x+20,y-9);ctx.stroke()}
export function drawMemberCard(canvas,{profile,image,rank,achievements,snapshotDate}){
 canvas.width=CARD_WIDTH;canvas.height=CARD_HEIGHT
 const ctx=canvas.getContext('2d');if(!ctx)throw Error('Your browser cannot create the card image.')
 ctx.save();round(ctx,0,0,1080,1350,48);ctx.clip();ctx.fillStyle='#f3e9d8';ctx.fillRect(0,0,1080,1350)
 // Brand watermark always occupies the upper-left, separate from member identity.
 ctx.fillStyle='#65462f';ctx.font='600 42px Manrope, sans-serif';ctx.fillText('Aureatine',66,84)
 ctx.textAlign='right';ctx.font='500 21px "DM Sans", sans-serif';ctx.fillStyle='#795c40';ctx.fillText('Your next rep. Your new favorite sip.',1014,79);ctx.textAlign='left'
 ctx.save();round(ctx,36,126,1008,1114,36);ctx.clip()
 if(image)cover(ctx,image,36,126,1008,1114)
 else{
  ctx.fillStyle='#d9c09b';ctx.fillRect(36,126,1008,1114)
  ctx.fillStyle='#c4a378';ctx.beginPath();ctx.arc(540,674,292,0,Math.PI*2);ctx.fill()
  ctx.fillStyle='#775333';ctx.font='500 260px Manrope, sans-serif';ctx.textAlign='center';ctx.fillText(graphemes(profile.display_name)[0]?.toUpperCase()||'',540,765);ctx.textAlign='left'
 }
 // Functional photo scrims keep real portraits legible without changing the face.
 const top=ctx.createLinearGradient(0,126,0,510);top.addColorStop(0,'rgba(250,246,238,.98)');top.addColorStop(.58,'rgba(250,246,238,.88)');top.addColorStop(1,'rgba(250,246,238,0)');ctx.fillStyle=top;ctx.fillRect(36,126,1008,384)
 const bottom=ctx.createLinearGradient(0,735,0,1240);bottom.addColorStop(0,'rgba(40,29,20,0)');bottom.addColorStop(.5,'rgba(40,29,20,.94)');bottom.addColorStop(1,'rgba(40,29,20,.99)');ctx.fillStyle=bottom;ctx.fillRect(36,735,1008,505)
 ctx.fillStyle='#3e2c20';const name=fitted(ctx,profile.display_name,900,3,74,30);name.lines.forEach((line,i)=>ctx.fillText(line,82,211+i*name.size*1.2))
 // Lower identity strip echoes the supplied portrait-card reference.
 ctx.save();ctx.beginPath();ctx.arc(116,993,38,0,Math.PI*2);ctx.clip()
 if(image)cover(ctx,image,78,955,76,76);else{ctx.fillStyle='#e3c99f';ctx.fillRect(78,955,76,76);ctx.fillStyle='#5e422b';ctx.font='600 34px Manrope, sans-serif';ctx.textAlign='center';ctx.fillText(graphemes(profile.display_name)[0]?.toUpperCase()||'',116,1007);ctx.textAlign='left'}ctx.restore()
 ctx.strokeStyle='rgba(249,241,226,.8)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(116,993,38,0,Math.PI*2);ctx.stroke()
 ctx.fillStyle='#fff7e9';const username=fitted(ctx,'@'+profile.username,794,2,35,22);username.lines.forEach((line,i)=>ctx.fillText(line,175,988+i*username.size*1.2))
 ctx.strokeStyle='rgba(239,214,173,.3)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(82,1050);ctx.lineTo(998,1050);ctx.stroke()
 if(rank){ctx.fillStyle='#f0d1a0';ctx.font='600 58px Manrope, sans-serif';const value='#'+rank.toLocaleString('en-PH');let size=58;while(ctx.measureText(value).width>415&&size>24){size-=2;ctx.font=`600 ${size}px Manrope, sans-serif`}ctx.fillText(value,82,1132);ctx.fillStyle='#eee0ca';ctx.font='400 23px "DM Sans", sans-serif';ctx.fillText('on the leaderboard',82,1174)}
 const x=rank?555:82
 if(achievements.length){ctx.fillStyle='#efe1cc';ctx.font='500 18px "DM Sans", sans-serif';ctx.fillText('COMPLETED',x,1084)
  achievements.forEach((item,i)=>{const y=1120+i*37;ctx.strokeStyle='#e4c58f';ctx.lineWidth=2.5;tick(ctx,x+1,y-5);ctx.fillStyle='#fff7e9';ctx.font='400 22px "DM Sans", sans-serif';ctx.fillText(item.label,x+34,y)})
 }else if(!rank){ctx.fillStyle='#f0d1a0';ctx.font='500 33px Manrope, sans-serif';ctx.fillText('Your next rep.',82,1125);ctx.fillStyle='#eee0ca';ctx.font='400 27px "DM Sans", sans-serif';ctx.fillText('Your new favorite sip.',82,1167)}
 ctx.restore()
 ctx.fillStyle='#76573b';ctx.font='400 19px "DM Sans", sans-serif';ctx.fillText('Community snapshot · '+snapshotDate+' · PH',66,1297)
 ctx.textAlign='right';ctx.font='600 21px "DM Sans", sans-serif';ctx.fillText('aureatine.cc.cd',1014,1297);ctx.restore()
 return canvas
}
export function canvasPNG(canvas){return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(Error('Could not export the PNG. Try another browser.')),'image/png'))}
