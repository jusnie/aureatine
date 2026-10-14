import assert from 'node:assert/strict'
import {cardFacts} from '../src/memberCardCanvas.js'
assert.deepEqual(cardFacts(null,null),{rank:null,achievements:[]})
assert.equal(cardFacts({ok:true,opted_in:false,rank:1},null).rank,null)
assert.equal(cardFacts({ok:true,opted_in:true,rank:56},null).rank,56)
for(const rank of [0,-1,'1',1.1,Infinity])assert.equal(cardFacts({ok:true,opted_in:true,rank},null).rank,null)
assert.deepEqual(cardFacts(null,{ok:true,signup_claimed:false,daily_claimed:false,gym_claimed:false,gym_days:5}).achievements,[])
assert.deepEqual(cardFacts(null,{ok:true,signup_claimed:true,daily_claimed:true,gym_claimed:true,today:'2026-10-14'}).achievements.map(a=>a.key),['signup','daily','gym'])
assert.equal(cardFacts(null,{ok:false,signup_claimed:true,daily_claimed:true,gym_claimed:true}).achievements.length,0)
console.log('PASS rank requires actual opted-in standing; unavailable/invalid ranks omitted; only completed claim flags produce achievements; no points or arbitrary tiers inferred.')
