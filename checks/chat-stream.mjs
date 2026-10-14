import assert from 'node:assert/strict'
import {EventEmitter} from 'node:events'
import handler from '../api/chat.js'
import {readSSE,finalAnswerFilter} from '../shared/chatStream.js'
const oldFetch=globalThis.fetch,oldKey=process.env.NVIDIA_API_KEY
const encoder=new TextEncoder()
function stream(parts){return new ReadableStream({start(c){for(const p of parts)c.enqueue(encoder.encode(p));c.close()}})}
const filter=finalAnswerFilter();let filtered='';for(const s of ['<th','ink>private',' reasoning</thi','nk>Hello <ana','lysis>hidden</analysis>world!'])filtered+=filter.push(s);filtered+=filter.finish();assert.equal(filtered,'Hello world!')
const frames=[];for await(const frame of readSSE(stream(['data: {"a":','1}\r','\n\r\n',': ping\n\n','data: [DONE]\n\n'])))frames.push(frame);assert.deepEqual(frames,['{"a":1}','[DONE]'])
let i=0
function request(){return{method:'POST',headers:{host:'test.local',origin:'https://test.local','content-type':'application/json','x-real-ip':`stream-${i++}`},body:{stream:true,provider:'nvidia',consent:true,adultConfirmed:true,messages:[{role:'user',content:'Say hello.'}]}}}
function response(){const res=new EventEmitter();res.headers={};res.statusCode=200;res.output='';res.ended=false;res.setHeader=(k,v)=>res.headers[k.toLowerCase()]=v;res.write=s=>{res.output+=s;res.emit('chunk',s)};res.end=s=>{if(s)res.output+=s;res.ended=true};res.flushHeaders=()=>{};return res}
function delta(text){return `data: ${JSON.stringify({choices:[{delta:{content:text}}]})}\n\n`}
try{
 process.env.NVIDIA_API_KEY='test-not-real'
 let release,signal
 globalThis.fetch=async(_url,options)=>{const payload=JSON.parse(options.body);assert.equal(payload.stream,true);assert.equal(payload.max_tokens,384);signal=options.signal;return{ok:true,body:new ReadableStream({start(c){c.enqueue(encoder.encode(delta('Hello')));release=()=>{c.enqueue(encoder.encode(delta(' world.')));c.enqueue(encoder.encode('data: {"choices":[{"delta":{},"finish_reason":"stop"}]}\n\n'));c.close()}}})}}
 const res=response(),first=new Promise(resolve=>res.on('chunk',chunk=>{if(chunk.includes('delta'))resolve()})),pending=handler(request(),res)
 await first;assert.match(res.output,/Hello/);assert.equal(res.ended,false);release();await pending;assert.match(res.output,/"type":"done"/);assert.equal(res.ended,true);assert.equal(signal.aborted,true)
 globalThis.fetch=async()=>({ok:true,body:stream(['data: {"choices":[{"delta":{"reasoning_content":"SECRET"}}]}\n\n',delta('<thi'),delta('nk>INTERNAL</think>Visible'),'data: [DONE]\n\n'])});const safe=response();await handler(request(),safe);assert.ok(!safe.output.includes('SECRET'));assert.ok(!safe.output.includes('INTERNAL'));assert.match(safe.output,/Visible/)
 globalThis.fetch=async()=>({ok:true,body:stream([delta('Partial')])});const partial=response();await handler(request(),partial);assert.match(partial.output,/Partial/);assert.match(partial.output,/"type":"error"/);assert.ok(!partial.output.includes('"type":"done"'))
 globalThis.fetch=async()=>({ok:true,body:stream([delta('Short answer'),'data: {"choices":[{"finish_reason":"length"}]}\n\n'])});const limited=response();await handler(request(),limited);assert.match(limited.output,/"truncated":true/)
 let cancelSignal
 globalThis.fetch=async(_url,options)=>{cancelSignal=options.signal;return{ok:true,body:new ReadableStream({start(c){c.enqueue(encoder.encode(delta('First')));options.signal.addEventListener('abort',()=>c.error(new Error('aborted')))}})}}
 const cancelled=response();cancelled.on('chunk',chunk=>{if(chunk.includes('delta')){cancelled.destroyed=true;cancelled.emit('close')}});await handler(request(),cancelled);assert.equal(cancelSignal.aborted,true);assert.ok(!cancelled.output.includes('"type":"done"'))
 console.log('PASS real incremental chunks before completion, reasoning/tag filtering across boundaries, interrupted/truncated output, upstream cancellation and short token budget. Mocked provider; no live latency claim.')
}finally{globalThis.fetch=oldFetch;if(oldKey===undefined)delete process.env.NVIDIA_API_KEY;else process.env.NVIDIA_API_KEY=oldKey}
