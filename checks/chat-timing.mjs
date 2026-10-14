import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {EventEmitter} from 'node:events'
import handler from '../api/chat.js'
import {CHAT_SERVER_TIMEOUT_MS,CHAT_BROWSER_TIMEOUT_MS,CHAT_RECOVERY_MIN_REMAINING_MS} from '../shared/chatTiming.js'
const platform=JSON.parse(readFileSync(new URL('../vercel.json',import.meta.url)))
assert.equal(CHAT_SERVER_TIMEOUT_MS,50000)
assert.ok(platform.functions['api/chat.js'].maxDuration*1000>=CHAT_SERVER_TIMEOUT_MS+10000)
assert.ok(CHAT_BROWSER_TIMEOUT_MS>=platform.functions['api/chat.js'].maxDuration*1000+5000)
assert.ok(CHAT_RECOVERY_MIN_REMAINING_MS>=12000)
const old={fetch:globalThis.fetch,timer:globalThis.setTimeout,clear:globalThis.clearTimeout,key:process.env.NVIDIA_API_KEY}
let alarm,cleared,id=0
const encoder=new TextEncoder()
function res(){const r=new EventEmitter();r.output='';r.setHeader=()=>{};r.flushHeaders=()=>{};r.write=s=>{r.output+=s};r.end=s=>{r.output+=s||'';r.ended=true};return r}
function req(){return{method:'POST',headers:{host:'test.local',origin:'https://test.local','content-type':'application/json','x-real-ip':`timing-${id++}`},body:{stream:true,provider:'nvidia',consent:true,adultConfirmed:true,messages:[{role:'user',content:'One safe recovery tip?'}]}}}
try{
 process.env.NVIDIA_API_KEY='mock-only'
 globalThis.setTimeout=(fn,ms)=>{assert.equal(ms,50000);alarm=fn;cleared=false;return 44}
 globalThis.clearTimeout=id=>{assert.equal(id,44);cleared=true}
 // Timeout before provider headers: JSON 504, not a fabricated partial answer.
 globalThis.fetch=async(_,options)=>{queueMicrotask(()=>alarm());return new Promise((_,reject)=>options.signal.addEventListener('abort',()=>reject(new Error('PRIVATE PROVIDER DETAILS'))))}
 let r=res();await handler(req(),r);assert.equal(r.statusCode,504);assert.match(JSON.parse(r.output).error,/within 50 seconds/);assert.doesNotMatch(r.output,/PRIVATE|answer above/);assert.ok(cleared)
 // Deadline during SSE, with and without actual answer text.
 for(const partial of [false,true]){
  globalThis.fetch=async(_,options)=>({ok:true,body:new ReadableStream({start(c){if(partial)c.enqueue(encoder.encode('data: {"choices":[{"delta":{"content":"Useful first words."}}]}\n\n'));options.signal.addEventListener('abort',()=>c.error(new Error('aborted')));old.timer(()=>alarm(),0)}})})
  r=res();await handler(req(),r);assert.match(r.output,/"type":"error"/);assert.doesNotMatch(r.output,/"type":"done"/);assert.ok(cleared)
  if(partial){assert.match(r.output,/Useful first words/);assert.match(r.output,/answer above is incomplete/)}else{assert.match(r.output,/within 50 seconds/);assert.doesNotMatch(r.output,/answer above/)}
 }
 // Network errors should not be mislabeled as timeouts.
 globalThis.fetch=async()=>{throw new Error('private upstream information')};r=res();await handler(req(),r);assert.equal(r.statusCode,502);assert.match(JSON.parse(r.output).error,/interrupted before an answer/);assert.doesNotMatch(r.output,/private upstream/)
 console.log('PASS aligned 50s server / 60s Vercel / 65s browser deadlines; timeout before headers and during SSE; accurate partial/no-answer messaging; timer cleanup; distinct network errors. Simulated deadlines, no real delay/provider calls.')
}finally{globalThis.fetch=old.fetch;globalThis.setTimeout=old.timer;globalThis.clearTimeout=old.clear;if(old.key===undefined)delete process.env.NVIDIA_API_KEY;else process.env.NVIDIA_API_KEY=old.key}
