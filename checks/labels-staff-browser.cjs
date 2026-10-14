// Browser check (mocked Supabase): automatic APEX visit from a staff code, no visit reference field,
// purchase still asks for a receipt, and multiple member labels render on the leaderboard.
const{chromium}=require('/home/user/tools/browser-check/node_modules/playwright'),assert=require('node:assert/strict')
;(async()=>{
  const browser=await chromium.launch({args:['--no-sandbox']})
  const uid='22222222-2222-4222-8222-222222222222',user={id:uid,aud:'authenticated',role:'authenticated',email:'staff.test@example.test',app_metadata:{provider:'email',providers:['email']},user_metadata:{}}
  const awards=[];let roles=['apex','aureatine'];const errors=[]
  const entries=[{rank:1,display_name:'Member One',points:120,is_current_user:false,leaderboard_avatar_path:null,is_admin:false,community_id:'c-1',labels:['MEMBER','STAFF']},{rank:2,display_name:'Gian Pokling',points:90,is_current_user:false,leaderboard_avatar_path:null,is_admin:true,community_id:'c-2',labels:['APEX','MEMBER']}]
  async function setup(page){
    const part=o=>Buffer.from(JSON.stringify(o)).toString('base64url'),jwt=part({alg:'HS256'})+'.'+part({sub:uid,role:'authenticated',exp:Math.floor(Date.now()/1000)+3600})+'.fake'
    await page.addInitScript(({jwt,user})=>{localStorage.setItem('sb-oisqrwrmtbcwtfmcenoc-auth-token',JSON.stringify({access_token:jwt,refresh_token:'fake',expires_at:Math.floor(Date.now()/1000)+3600,token_type:'bearer',user}))},{jwt,user})
    await page.route('https://oisqrwrmtbcwtfmcenoc.supabase.co/**',route=>{
      const req=route.request(),u=new URL(req.url()),path=u.pathname
      if(path.endsWith('/auth/v1/user'))return route.fulfill({json:user})
      if(path.endsWith('/staff_members'))return route.fulfill({json:roles.map(role=>({role}))})
      if(path.endsWith('/member_profiles'))return route.fulfill({json:{display_name:'Staff Tester',username:'staff.test',avatar_path:null,user_id:uid,community_id:'c-0'}})
      if(path.endsWith('/rpc/verify_member'))return route.fulfill({json:{ok:true,display_name:'Member One',username:'member.one',avatar_path:null}})
      if(path.endsWith('/rpc/award_member_points')){const body=req.postDataJSON();awards.push(body);return route.fulfill({json:{ok:true,event_id:'e-1',points:body.p_kind==='visit'?10:30,replayed:false,member_name:'Member One'}})}
      if(path.endsWith('/rpc/get_my_labels'))return route.fulfill({json:['STAFF']})
      if(path.endsWith('/rpc/get_leaderboard_entries'))return route.fulfill({json:entries})
      if(path.endsWith('/rpc/get_my_leaderboard_standing'))return route.fulfill({json:{ok:true,opted_in:false,rank:null}})
      if(path.endsWith('/rpc/get_member_tasks'))return route.fulfill({json:{ok:true,today:'2026-10-14',signup_claimed:false,daily_claimed:false,gym_claimed:false}})
      return route.fulfill({json:[]})
    })
  }
  // Staff with APEX role
  const p=await browser.newPage({viewport:{width:390,height:844}});p.on('pageerror',e=>errors.push(e.message))
  await setup(p)
  await p.goto('http://localhost:5179/staff')
  await p.getByRole('button',{name:'Record visit'}).waitFor({timeout:20000})
  assert.equal(await p.getByLabel(/visit reference/i).count(),0,'no visit reference field')
  assert.equal(await p.getByText(/VISIT-20261013/).count(),0)
  await p.getByLabel('Member code').fill('ABCDEF')
  await p.getByRole('button',{name:'Record visit'}).click()
  await p.getByRole('heading',{name:'Points awarded successfully.'}).waitFor()
  assert.equal(awards.length,1)
  assert.equal(awards[0].p_kind,'visit')
  assert.equal(awards[0].p_reference,null)
  assert.match(awards[0].p_request_id,/^[0-9a-f-]{36}$/)
  assert.ok(await p.getByText('For Member One').isVisible())
  assert.ok(await p.getByText('+10 points').isVisible())
  // Purchase still needs a verified member, a receipt reference and confirmation.
  await p.getByRole('button',{name:'Scan next member'}).click()
  await p.getByRole('button',{name:/Aureatine purchase/}).click()
  await p.getByLabel('Member code').fill('ABCDEF')
  await p.getByRole('button',{name:'Verify member'}).click()
  await p.getByRole('heading',{name:'Member One'}).waitFor()
  const confirm=p.getByRole('button',{name:/Confirm & award/})
  assert.equal(await confirm.isDisabled(),true,'purchase needs reference, amount and confirmation')
  await p.getByLabel('Unique receipt reference').fill('RECEIPT-0042')
  await p.getByLabel('Amount paid (PHP)').fill('150.00')
  await p.getByRole('checkbox').check()
  await confirm.click()
  await p.getByRole('heading',{name:'Points awarded successfully.'}).waitFor()
  assert.equal(awards[1].p_kind,'purchase')
  assert.equal(awards[1].p_reference,'RECEIPT-0042')
  assert.equal(awards[1].p_amount_centavos,15000)
  await p.setViewportSize({width:320,height:700});assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'no overflow at 320')
  // Leaderboard: several labels per member, display-only.
  await p.goto('http://localhost:5179/leaderboard')
  await p.getByText('Member One',{exact:true}).first().waitFor({timeout:20000})
  for(const label of ['MEMBER','STAFF','APEX','ADMIN']) assert.ok(await p.locator('.rank-table').getByText(label,{exact:true}).count()>0,`badge ${label}`)
  assert.deepEqual(errors,[])
  await browser.close()
  console.log('PASS staff APEX visit records automatically from a code with no reference field; purchases still need verified member, receipt, amount and confirmation; leaderboard shows multiple labels; no overflow at 320. Mocked Supabase only.')
})().catch(e=>{console.error('FAIL',e.message);process.exit(1)})
