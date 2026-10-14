import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
const root = fileURLToPath(new URL('../', import.meta.url))
const docs = root + 'docs'
rmSync(docs, { recursive: true, force: true })
cpSync(root + 'dist', docs, { recursive: true })
const html = readFileSync(docs + '/index.html', 'utf8')
for (const route of ['member-card','admin','tasks','profile','staff','about','rewards','leaderboard','login','signup','forgot-password','reset-password','check-email','confirm']) {
  mkdirSync(`${docs}/${route}`, { recursive: true })
  writeFileSync(`${docs}/${route}/index.html`, html)
}
writeFileSync(docs + '/404.html', html)
writeFileSync(docs + '/.nojekyll', '')
