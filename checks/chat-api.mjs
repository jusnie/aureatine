import assert from 'node:assert/strict'
import handler from '../api/chat.js'
function request(method, body, ip = 'test-client') { return { method, body, headers: { host: 'example.test', origin: 'https://example.test', 'content-type': 'application/json', 'x-real-ip': ip } } }
async function run(req) { const res = { headers: {}, setHeader(k,v) { this.headers[k]=v }, end(value) { this.payload=JSON.parse(value) } }; await handler(req,res); return res }
const key=process.env.NVIDIA_API_KEY, oldFetch=globalThis.fetch
try {
 delete process.env.NVIDIA_API_KEY
 assert.equal((await run(request('GET'))).payload.available,false)
 assert.equal((await run(request('POST',{}))).statusCode,503)
 process.env.NVIDIA_API_KEY='test-only-not-a-real-key'
 assert.equal((await run(request('GET'))).payload.available,true)
 assert.equal((await run(request('POST',{messages:[]}))).statusCode,400)
 const valid={provider:'nvidia',consent:true,adultConfirmed:true,messages:[{role:'user',content:'Where is the gym?'}]}
 const foreign=request('POST',valid); foreign.headers.origin='https://other.test'
 assert.equal((await run(foreign)).statusCode,403)
 globalThis.fetch=async(_url,options)=>{assert.equal(options.headers.Authorization,'Bearer test-only-not-a-real-key');assert.ok(JSON.parse(options.body).messages[0].content);return {ok:true,json:async()=>({choices:[{message:{content:'Mock reply for interface testing.'}}]})}}
 assert.equal((await run(request('POST',valid,'success'))).payload.reply,'Mock reply for interface testing.')
 for(let i=0;i<6;i++) assert.equal((await run(request('POST',valid,'limited'))).statusCode,200)
 assert.equal((await run(request('POST',valid,'limited'))).statusCode,429)
 globalThis.fetch=async()=>({ok:false,status:403})
 const failure=await run(request('POST',valid,'provider-failure'))
 assert.equal(failure.statusCode,502);assert.ok(!JSON.stringify(failure.payload).includes('test-only'))
 console.log('PASS: offline, status, validation, origin, mocked provider reply, throttling and sanitized provider errors. No real NVIDIA call made.')
} finally { globalThis.fetch=oldFetch; if(key===undefined)delete process.env.NVIDIA_API_KEY;else process.env.NVIDIA_API_KEY=key }
