import assert from 'node:assert/strict'
import { estimateNutrition, nutritionContext } from '../shared/nutrition.js'
import handler from '../api/chat.js'
const adult={age:30,weight:70,height:175,coefficient:'male',activity:'moderate',training:3,goal:'strength',suitable:true}
const r=estimateNutrition(adult)
assert.equal(r.ok,true);assert.equal(r.resting,1649);assert.equal(r.maintenance,2550);assert.equal(r.proteinLow,112);assert.equal(r.proteinHigh,140)
assert.equal(estimateNutrition({...adult,coefficient:'female'}).maintenance,2300)
assert.equal(estimateNutrition({...adult,training:0,goal:'general'}).proteinLow,56)
for(const changes of [{age:16},{age:80},{weight:0},{height:0},{training:9},{training:''},{suitable:false},{coefficient:'other'},{activity:'__proto__'},{goal:'unknown'},{weight:40,height:190}]) assert.equal(estimateNutrition({...adult,...changes}).ok,false,JSON.stringify(changes))
assert.match(nutritionContext(r),/2550 kcal/)
const oldKey=process.env.NVIDIA_API_KEY,oldFetch=globalThis.fetch
async function call(extra){const req={method:'POST',headers:{host:'test.local',origin:'https://test.local','content-type':'application/json','x-real-ip':'nutrition-test'},body:{provider:'nvidia',consent:true,messages:[{role:'user',content:'Explain my estimate'}],...extra}};const res={setHeader(){},end(s){this.data=JSON.parse(s)}};await handler(req,res);return res}
try{
 process.env.NVIDIA_API_KEY='test-key-not-real'
 let calls=0
 globalThis.fetch=async(_url,options)=>{calls++;const body=JSON.parse(options.body);assert.match(body.messages[0].content,/CALCULATOR ESTIMATES/);assert.match(body.messages[0].content,/2550 kcal/);assert.ok(!body.messages[0].content.includes('99999'));return {ok:true,json:async()=>({choices:[{message:{content:'Test explanation.'}}]})}}
 assert.equal((await call({calculator:adult})).statusCode,400)
 assert.equal((await call({calculator:{...adult,age:12},calculatorConsent:true})).statusCode,400)
 assert.equal(calls,0)
 assert.equal((await call({calculator:{...adult,maintenance:99999},calculatorConsent:true})).statusCode,200)
 assert.equal(calls,1)
 console.log('PASS: formula math, coefficient, protein reference, invalid inputs, age/suitability restrictions, consent, server recalculation against tampering. Provider mocked; no health data sent.')
}finally{globalThis.fetch=oldFetch;if(oldKey===undefined)delete process.env.NVIDIA_API_KEY;else process.env.NVIDIA_API_KEY=oldKey}
