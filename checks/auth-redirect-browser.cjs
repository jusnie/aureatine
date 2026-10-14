const { chromium } = require('/home/user/tools/browser-check/node_modules/playwright')
const assert = require('node:assert/strict')

const SUPABASE = 'https://oisqrwrmtbcwtfmcenoc.supabase.co'
const SITE = 'http://localhost:5179'
const uid = '77777777-7777-4777-8777-777777777777'
const email = 'new.member@example.test'
const part = o => Buffer.from(JSON.stringify(o)).toString('base64url')
const jwt = part({ alg: 'HS256' }) + '.' + part({ sub: uid, role: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3600 }) + '.mock'
const user = { id: uid, aud: 'authenticated', role: 'authenticated', email, app_metadata: { provider: 'email', providers: ['email'] }, user_metadata: {} }

;(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox'] })
  const results = []
  const seen = { signupRedirect: null, resend: null, leakedLocalhost3000: false }
  async function page(width = 390) {
    const p = await browser.newPage({ viewport: { width, height: 844 }, reducedMotion: 'reduce' })
    p.errors = []
    p.on('pageerror', e => p.errors.push(e.message))
    p.on('request', r => { if (r.url().includes('localhost:3000')) seen.leakedLocalhost3000 = true })
    return p
  }
  async function mockSupabase(p, options = {}) {
    await p.route(SUPABASE + '/**', async route => {
      const req = route.request()
      const url = new URL(req.url())
      const path = url.pathname
      if (path.endsWith('/check_member_names')) return route.fulfill({ json: { display_taken: false, username_taken: false } })
      if (path.endsWith('/auth/v1/signup')) {
        seen.signupRedirect = url.searchParams.get('redirect_to')
        return route.fulfill({ json: { id: uid, aud: 'authenticated', email, confirmation_sent_at: new Date().toISOString() } })
      }
      if (path.endsWith('/auth/v1/resend')) {
        seen.resend = req.postDataJSON()
        return route.fulfill({ json: {} })
      }
      if (path.endsWith('/auth/v1/token')) {
        if (options.badPassword) return route.fulfill({ status: 400, json: { error: 'invalid_grant', error_description: 'Invalid login credentials' } })
        return route.fulfill({ json: { access_token: jwt, token_type: 'bearer', expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, refresh_token: 'mock', user } })
      }
      if (path.endsWith('/auth/v1/user')) return route.fulfill({ json: user })
      if (path.endsWith('/wallets')) return route.fulfill({ json: { points: 0 } })
      return route.fulfill({ json: [] })
    })
  }

  // 1) Sign-up goes to the Check-email page and asks Supabase to return to /confirm, not localhost:3000.
  {
    const p = await page()
    await mockSupabase(p)
    await p.goto(SITE + '/signup/')
    await p.getByLabel('Your name').fill('New Member')
    await p.getByLabel('Email address').fill(email)
    await p.getByLabel('Password', { exact: true }).fill('a very long password 1')
    await p.getByLabel('Confirm password').fill('a very long password 1')
    await p.getByRole('button', { name: 'Create account' }).click()
    await p.getByRole('heading', { name: 'Check your email to confirm your account.' }).waitFor({ timeout: 10000 })
    assert.equal(new URL(p.url()).pathname, '/check-email/')
    assert.ok(seen.signupRedirect, 'signup must send a redirect target')
    assert.equal(new URL(seen.signupRedirect).origin, SITE, 'dev build uses the current site origin, never localhost:3000')
    assert.ok(new URL(seen.signupRedirect).pathname.endsWith('/confirm/'))
    assert.ok((await p.textContent('body')).includes(email))
    await p.getByRole('button', { name: 'Resend confirmation email' }).click()
    await p.getByText('A new confirmation email was requested').waitFor({ timeout: 10000 })
    assert.equal(seen.resend.type, 'signup'); assert.equal(seen.resend.email, email)
    assert.equal(await p.locator('.auth-status-success').count(), 1)
    assert.deepEqual(p.errors, [])
    results.push('sign-up redirects to Check your email, resends green confirmation, redirect target stays on the public site')
    await p.close()
  }

  // 2) Confirmation link with an error shows a red label.
  {
    const p = await page()
    await mockSupabase(p)
    await p.goto(SITE + '/confirm/#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired')
    await p.locator('.auth-status-error').waitFor({ timeout: 10000 })
    const text = await p.locator('.auth-status-error').innerText()
    assert.ok(text.includes('expired or was already used'))
    assert.equal(await p.locator('.auth-status-success').count(), 0)
    assert.equal(new URL(p.url()).hash, '', 'error tokens/fragments are removed from the address bar')
    assert.deepEqual(p.errors, [])
    results.push('expired confirmation link shows a red error label and clears the URL fragment')
    await p.close()
  }

  // 3) Confirmation link with valid tokens logs in and shows a green label.
  {
    const p = await page()
    await mockSupabase(p)
    await p.goto(SITE + '/confirm/#access_token=' + jwt + '&refresh_token=mock&expires_in=3600&token_type=bearer&type=signup')
    await p.locator('.auth-status-success').waitFor({ timeout: 10000 })
    assert.ok((await p.locator('.auth-status-success').innerText()).includes('You are logged in'))
    assert.ok((await p.textContent('h1')).includes('Your account successfully verified.'))
    assert.equal(await p.locator('.auth-status-error').count(), 0)
    assert.equal(new URL(p.url()).hash, '')
    assert.deepEqual(p.errors, [])
    results.push('valid confirmation link shows green logged-in label and removes tokens from the address bar')
    await p.close()
  }

  // 4) Wrong password shows red label; successful login shows green flash on the account page.
  {
    const bad = await page()
    await mockSupabase(bad, { badPassword: true })
    await bad.goto(SITE + '/login/')
    await bad.getByLabel('Email address').fill(email)
    await bad.getByLabel('Password', { exact: true }).fill('wrong password here')
    await bad.getByRole('button', { name: 'Log in' }).click()
    await bad.locator('output.form-message-error').waitFor({ timeout: 10000 })
    assert.ok((await bad.locator('output.form-message-error').innerText()).includes('Invalid login credentials'))
    await bad.close()

    const good = await page()
    await mockSupabase(good)
    await good.goto(SITE + '/login/')
    await good.getByLabel('Email address').fill(email)
    await good.getByLabel('Password', { exact: true }).fill('correct password here')
    await good.getByRole('button', { name: 'Log in' }).click()
    await good.locator('.auth-status-success').filter({ hasText: 'logged in successfully' }).waitFor({ timeout: 10000 })
    results.push('wrong password shows red error; successful login shows green success label')
    await good.close()
  }

  // 5) Mobile width has no horizontal overflow on the status pages.
  {
    const p = await page(320)
    await mockSupabase(p)
    await p.goto(SITE + '/confirm/#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired')
    await p.locator('.auth-status-error').waitFor({ timeout: 10000 })
    const overflow = await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
    assert.equal(overflow, false)
    results.push('status label has no horizontal overflow at 320px')
    await p.close()
  }

  assert.equal(seen.leakedLocalhost3000, false, 'no request should target localhost:3000')
  await browser.close()
  console.log('PASS ' + results.join('; ') + '. Mocked Supabase; no live accounts or emails.')
})().catch(e => { console.error('FAIL', e.message); process.exit(1) })
