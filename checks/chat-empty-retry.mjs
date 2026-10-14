import { CHAT_SERVER_TIMEOUT_MS, CHAT_RECOVERY_MIN_REMAINING_MS } from '../shared/chatTiming.js'
import assert from 'node:assert/strict'
import {EventEmitter} from 'node:events'
import handler from '../api/chat.js'
const originalFetch=globalThis.fetch,originalKey=process.env.NVIDIA_API_KEY,originalNow=Date.now
let id=0
const messages=[{role:'user',content:'Hello.'},{role:'assistant',content:'Hello! How can I help?'},{role:'user',content:'One recovery tip?'}]
const req=(stream=true)=>({method:'POST',headers:{host:'test.local',origin:'https://test.local','content-type':'application/json','x-real-ip':`empty-${id++}`},body:{stream,provider:'nvidia',consent:true,adultConfirmed:true,messages}})
function response(){const r=new EventEmitter();r.output='';r.headers={};r.started=false;r.setHeader=(k,v)=>{assert.equal(r.started,false,'headers must not be changed after SSE starts');r.headers[k]=v};r.flushHeaders=()=>{r.started=true};r.write=s=>{r.output+=s};r.end=s=>{r.output+=s||'';r.ended=true};return r}
const frame=choice=>`data: ${JSON.stringify({choices:[choice]})}\n\n`
function sse(content='',finish='stop',extra={}){return{ok:true,body:new ReadableStream({start(c){c.enqueue(new TextEncoder().encode(frame({delta:{content,...extra}})+frame({delta:{},finish_reason:finish})));c.close()}})}}
try{
 process.env.NVIDIA_API_KEY='mock-only'
 let calls=[]
 globalThis.fetch=async(_,options)=>{const body=JSON.parse(options.body);calls.push({body,signal:options.signal});return calls.length===1?sse('','length',{reasoning_content:'NEVER SHOW THIS'}):sse('Prioritize consistent sleep.')}
 let r=response();await handler(req(),r)
 assert.equal(calls.length,2);assert.equal(calls[0].body.max_tokens,384);assert.equal(calls[1].body.max_tokens,1536);assert.deepEqual(calls[0].body.messages,calls[1].body.messages);assert.deepEqual(calls[1].body.messages.slice(1),messages);assert.equal(calls[0].signal,calls[1].signal);assert.equal((r.output.match(/"type":"start"/g)||[]).length,1);assert.match(r.output,/Prioritize consistent sleep/);assert.match(r.output,/"type":"done"/);assert.ok(!r.output.includes('NEVER SHOW'))
 calls=[];globalThis.fetch=async()=>{calls.push(1);return sse('','stop')};r=response();await handler(req(),r);assert.equal(calls.length,2);assert.match(r.output,/"type":"error"/);assert.doesNotMatch(r.output,/"type":"done"/)
 for(const [content,finish,extra] of [['','content_filter',{}],['','stop',{refusal:'Cannot help'}],['Partial answer','length',{}]]){let count=0;globalThis.fetch=async()=>{count++;return sse(content,finish,extra)};r=response();await handler(req(),r);assert.equal(count,1)}
 let count=0;globalThis.fetch=async()=>{count++;return{ok:true,body:new ReadableStream({start(c){c.close()}})}};r=response();await handler(req(),r);assert.equal(count,1);assert.match(r.output,/interrupted/)
 count=0;globalThis.fetch=async()=>++count===1?sse('','length'):{ok:false,status:429};r=response();await handler(req(),r);assert.equal(count,2);assert.equal(r.headers['Content-Type'],'text/event-stream; charset=utf-8');assert.match(r.output,/usage limit/);assert.equal(r.ended,true)
 count=0;globalThis.fetch=async()=>({ok:true,json:async()=>({choices:[{finish_reason:++count===1?'length':'stop',message:{content:count===1?'':'A short reply.'}}]})});r=response();await handler(req(false),r);assert.equal(count,2);assert.equal(JSON.parse(r.output).reply,'A short reply.')
 let clock=originalNow();Date.now=()=>clock;count=0;globalThis.fetch=async()=>{count++;clock+=CHAT_SERVER_TIMEOUT_MS - CHAT_RECOVERY_MIN_REMAINING_MS + 1;return sse('','length')};r=response();await handler(req(),r);assert.equal(count,1,'do not retry when less than the recovery window remains');Date.now=originalNow
 console.log('PASS empty-response retry once, larger recovery budget, identical two-turn history, same deadline/signal, no leaked reasoning, no retry for partial/interrupted/refused answers, exhausted retry, SSE error integrity and JSON compatibility. Mocked only.')
}finally{globalThis.fetch=originalFetch;Date.now=originalNow;if(originalKey===undefined)delete process.env.NVIDIA_API_KEY;else process.env.NVIDIA_API_KEY=originalKey}
