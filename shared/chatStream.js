// Streaming helpers shared by the Vercel backend and the browser. No provider secrets.
export async function* readSSE(body) {
  if (!body) throw new Error('Missing stream')
  const reader=body.getReader(), decoder=new TextDecoder()
  let buffer='', fields=[]
  function line(value) {
    if(value.endsWith('\r')) value=value.slice(0,-1)
    if(value===''){const data=fields.join('\n');fields=[];return data||null}
    if(value.startsWith('data:'))fields.push(value.slice(5).replace(/^ /,''))
    if(fields.join('\n').length>65536)throw new Error('Stream frame too large')
    return null
  }
  try {
    while(true){
      const {value,done}=await reader.read()
      buffer+=done?decoder.decode():decoder.decode(value,{stream:true})
      let index
      while((index=buffer.indexOf('\n'))>=0){const data=line(buffer.slice(0,index));buffer=buffer.slice(index+1);if(data!==null)yield data}
      if(buffer.length>65536)throw new Error('Stream line too large')
      if(done){if(buffer)line(buffer);const data=line('');if(data!==null)yield data;break}
    }
  } finally {try{await reader.cancel()}catch{/* Already closed or aborted. */}reader.releaseLock()}
}
// Hold incomplete tag prefixes so split <think> blocks never flash on screen.
export function finalAnswerFilter() {
  let pending='',closing=null
  function consume(chunk,final=false){pending+=chunk;let output=''
    while(pending){
      const tags=closing?[closing]:['<think>','<analysis>']
      const lower=pending.toLowerCase(),tag=tags.find(t=>lower.startsWith(t))
      if(tag){pending=pending.slice(tag.length);closing=closing?null:tag.replace('<','</');continue}
      if(tags.some(t=>t.startsWith(lower))) {if(final)pending='';break}
      if(!closing)output+=pending[0]
      pending=pending.slice(1)
    }
    return output
  }
  return {push:chunk=>consume(chunk),finish:()=>consume('',true)}
}
