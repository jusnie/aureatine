import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
const originalFetch=globalThis.fetch,originalDeno=globalThis.Deno
const env={NVIDIA_API_KEY:'test-secret-not-real',NVIDIA_MODEL:'z-ai/glm-5.3-flash'}
let count=0,served=false,seq=0
try{
 globalThis.Deno={env:{get:key=>env[key]},serve:()=>{served=true}}
 const source=readFileSync(new URL('../supabase/functions/aureatine-ai/index.ts',import.meta.url),'utf8')
 const {serveRequest}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'))
 assert.equal(served,true)
 const url='https://test.supabase.co/functions/v1/aureatine-ai'
 const valid={provider:'nvidia',consent:true,adultConfirmed:true,messages:[{role:'user',content:'Give a general recovery tip.'}]}
 const call=(body=valid,origin='https://aureatine.cc.cd')=>serveRequest(new Request(url,{method:'POST',headers:{'content-type':'application/json',...(origin?{origin}:{}),'x-real-ip':`test-${seq++}`},body:JSON.stringify(body)}))
 globalThis.fetch=async(url,options)=>{count++;assert.equal(url,'https://integrate.api.nvidia.com/v1/chat/completions');assert.equal(options.headers.Authorization,'Bearer test-secret-not-real');const payload=JSON.parse(options.body);assert.equal(payload.model,'z-ai/glm-5.3-flash');assert.equal(payload.messages[0].role,'system');return new Response(JSON.stringify({choices:[{message:{content:'Rest between demanding sessions.',reasoning_content:'Do not return this'}}]}),{status:200,headers:{'content-type':'application/json'}})}
 const status=await serveRequest(new Request(url));assert.equal((await status.json()).provider,'nvidia')
 const preflight=await serveRequest(new Request(url,{method:'OPTIONS',headers:{origin:'https://aureatine.cc.cd','access-control-request-headers':'content-type'}}));assert.equal(preflight.status,204);assert.equal(preflight.headers.get('access-control-allow-origin'),'https://aureatine.cc.cd')
 assert.equal((await call(valid,'https://unapproved.example')).status,403);assert.equal(count,0)
 assert.equal((await call({...valid,provider:undefined})).status,400);assert.equal((await call({...valid,adultConfirmed:false})).status,400);assert.equal(count,0)
 const result=await call();assert.equal(result.status,200);assert.equal((await result.json()).reply,'Rest between demanding sessions.');assert.equal(result.headers.get('access-control-allow-origin'),'https://aureatine.cc.cd');assert.equal(count,1)
 const dashboard=await call(valid,'');assert.equal(dashboard.status,200)
 const large=await call({...valid,extra:'a'.repeat(17000)});assert.equal(large.status,413)
 const adult={age:30,weight:70,height:175,coefficient:'male',activity:'moderate',training:3,goal:'strength',experience:'beginner',meals:'protein_foods',suitable:true}
 globalThis.fetch=async(_url,options)=>{assert.match(JSON.parse(options.body).messages[0].content,/2550 kcal/);return new Response(JSON.stringify({choices:[{message:{content:'Server estimates received.'}}]}))}
 assert.equal((await call({...valid,calculator:adult,calculatorConsent:true})).status,200)
 assert.equal((await call({...valid,calculator:{...adult,age:16},calculatorConsent:true})).status,403)
 delete env.NVIDIA_API_KEY;assert.equal((await call()).status,503);assert.equal((await (await serveRequest(new Request(url))).json()).available,false)
 console.log('PASS single-file Web Request/Response adapter, CORS allowlist/preflight, consent and age gates, bounded body, dashboard requests, calculator recalculation, NVIDIA mapping and missing-secret state. Mocked Deno globals/provider only; not deployed or live-tested.')
}finally{globalThis.fetch=originalFetch;if(originalDeno===undefined)delete globalThis.Deno;else globalThis.Deno=originalDeno}
