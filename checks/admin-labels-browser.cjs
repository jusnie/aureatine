// Browser check (mocked Supabase): label managers see MEMBER/STUDENT/STAFF editing and save through the RPC;
// admins without an APEX or AUREATINE label do not see the label editor.
const{chromium}=require('/home/user/tools/browser-check/node_modules/playwright'),assert=require('node:assert/strict')
;(async()=>{
  const browser=await chromium.launch({args:['--no-sandbox']})
  const uid='44444444-4444-4444-8444-444444444444',user={id:uid,aud:'authenticated',role:'authenticated',email:'gian.test@example.test',app_metadata:{provider:'email',providers:['email']},user_metadata:{}}
  const errors=[]
  async function run(manager){
    const calls=[];const page=await browser.newPage({viewport:{width:390,height:844}});page.on('pageerror',e=>errors.push(e.message))
    const part=o=>Buffer.from(JSON.stringify(o)).toString('base64url'),jwt=part({alg:'HS256'})+'.'+part({sub:uid,role:'authenticated',exp:Math.floor(Date.now()/1000)+3600})+'.fake'
    await page.addInitScript(({jwt,user})=>{localStorage.setItem('sb-oisqrwrmtbcwtfmcenoc-auth-token',JSON.stringify({access_token:jwt,refresh_token:'fake',expires_at:Math.floor(Date.now()/1000)+3600,token_type:'bearer',user}))},{jwt,user})
    const rows=[{id:'c-1',display_name:'Member One',username:'member.one',bio:'',is_admin:false,labels:['STUDENT'],hide_board:false}]
    await page.route('https://oisqrwrmtbcwtfmcenoc.supabase.co/**',route=>{
      const req=route.request(),u=new URL(req.url()),path=u.pathname
      if(path.endsWith('/auth/v1/user'))return route.fulfill({json:user})
      if(path.endsWith('/rpc/get_my_admin_status'))return route.fulfill({json:true})
      if(path.endsWith('/rpc/get_my_label_manager'))return route.fulfill({json:manager})
      if(path.endsWith('/rpc/admin_search_members'))return route.fulfill({json:rows})
      if(path.endsWith('/rpc/admin_set_member_labels')){const body=req.postDataJSON();calls.push(body);return route.fulfill({json:{ok:true}})}
      return route.fulfill({json:[]})
    })
    await page.goto('http://localhost:5179/admin')
    await page.getByText('Member One').first().waitFor({timeout:20000})
    assert.ok(await page.locator('.admin-member-list').getByText('STUDENT',{exact:true}).isVisible(),'label badge in list')
    await page.getByRole('button',{name:'Edit member'}).click()
    const editorVisible=await page.getByRole('button',{name:'Save labels'}).count()
    if(!manager){assert.equal(editorVisible,0,'non-manager admins do not see label editing');await page.close();return calls}
    assert.equal(editorVisible,1)
    assert.equal(await page.getByRole('checkbox',{name:'STUDENT',exact:true}).isChecked(),true)
    assert.equal(await page.getByRole('checkbox',{name:'MEMBER',exact:true}).isChecked(),false)
    await page.getByRole('checkbox',{name:'STAFF',exact:true}).check()
    await page.getByRole('checkbox',{name:'STUDENT',exact:true}).uncheck()
    await page.getByRole('button',{name:'Save labels'}).click()
    await page.getByText('Labels saved. Changes recorded in the admin audit log.').waitFor()
    assert.equal(await page.getByRole('checkbox',{name:'APEX',exact:true}).count(),0,'APEX/AUREATINE are not offered')
    assert.deepEqual(calls,[{p_member:'c-1',p_labels:['STAFF']}])
    assert.ok(await page.locator('.admin-member-list').getByText('STAFF',{exact:true}).isVisible(),'list updated')
    await page.setViewportSize({width:320,height:700});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'no overflow at 320')
    await page.close();return calls
  }
  await run(false)
  await run(true)
  assert.deepEqual(errors,[])
  await browser.close()
  console.log('PASS label editor only for label managers; MEMBER/STUDENT/STAFF checkboxes save via admin_set_member_labels with APEX/AUREATINE not offered; list badges update; no overflow at 320. Mocked Supabase only.')
})().catch(e=>{console.error('FAIL',e.message);process.exit(1)})
