import assert from 'node:assert/strict'
import handler from '../api/chat.js'
const oldFetch=globalThis.fetch, oldKey=process.env.NVIDIA_API_KEY,oldModel=process.env.NVIDIA_MODEL
let seq=0,calls=0
async function call(extra={}){const req={method:'POST',headers:{host:'example.test',origin:'https://example.test','content-type':'application/json','x-real-ip':`nvidia-test-${seq++}`},body:{provider:'nvidia',consent:true,adultConfirmed:true,messages:[{role:'assistant',content:'How can I help?'},{role:'user',content:'Explain recovery.'}],...extra}};const res={setHeader(){},end(s){this.data=JSON.parse(s)}};await handler(req,res);return res}
try{
 process.env.NVIDIA_API_KEY='test-not-a-real-secret';delete process.env.NVIDIA_MODEL
 globalThis.fetch=async(url,options)=>{calls++;assert.equal(url,'https://integrate.api.nvidia.com/v1/chat/completions');assert.equal(options.headers.Authorization,'Bearer test-not-a-real-secret');const b=JSON.parse(options.body);assert.equal(b.model,'z-ai/glm-5.3-flash');assert.equal(b.stream,false);assert.equal(b.max_tokens,384);assert.equal(b.messages[0].role,'system');assert.equal(b.messages[1].role,'assistant');assert.equal(b.messages[2].role,'user');return{ok:true,json:async()=>({choices:[{message:{reasoning_content:'PRIVATE REASONING',content:'<think>INTERNAL</think>Rest between sessions.'}}]})}}
 assert.equal((await call({provider:undefined})).statusCode,400);assert.equal(calls,0)
 assert.equal((await call()).data.reply,'Rest between sessions.');assert.equal(calls,1)
 globalThis.fetch=async()=>({ok:true,json:async()=>({choices:[{message:{content:null,reasoning_content:'Do not expose this'}}]})})
 assert.equal((await call()).statusCode,422)
 globalThis.fetch=async()=>({ok:false,status:429});assert.equal((await call()).statusCode,429)
 globalThis.fetch=async()=>({ok:false,status:401});const unauthorized=await call();assert.equal(unauthorized.statusCode,502);assert.ok(!JSON.stringify(unauthorized).includes('test-not-a-real-secret'))
 globalThis.fetch=async()=>{throw new Error('provider details')};assert.equal((await call()).statusCode,502)
 process.env.NVIDIA_MODEL='invalid model';assert.equal((await call()).statusCode,503)
 console.log('PASS NVIDIA endpoint/model/auth, message mapping, final-answer-only parsing, explicit new-provider consent, rate/config/error handling. Mocked only, no live provider access verified.')
}finally{globalThis.fetch=oldFetch;for(const[k,v]of [['NVIDIA_API_KEY',oldKey],['NVIDIA_MODEL',oldModel]]){if(v===undefined)delete process.env[k];else process.env[k]=v}}
