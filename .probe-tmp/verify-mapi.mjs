import { chromium } from 'playwright'
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'
const TARGETS = [
  ['moviesapi.to movie', 'https://moviesapi.to/movie/550'],
  ['moviesapi.to tv',    'https://moviesapi.to/tv/1399-1-1'], // Game of Thrones S1E1
]
const browser = await chromium.launch({ headless: false, args: ['--disable-blink-features=AutomationControlled', '--no-sandbox'] })
for (const [name, url] of TARGETS) {
  const ctx = await browser.newContext({ userAgent: UA, viewport: { width: 1280, height: 720 }, locale: 'en-US' })
  const page = await ctx.newPage()
  ctx.on('page', (p) => { if (p !== page) p.close().catch(() => {}) })
  let status = null, err = null
  try {
    const r = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 25000 })
    status = r?.status() ?? null
    await page.waitForTimeout(3000)
  } catch (e) { err = e.message.split('\n')[0] }
  // Does the page have a player container / iframe / video element?
  let hasPlayer = false
  try {
    hasPlayer = await page.evaluate(() => !!(document.querySelector('iframe, video, #player, .player, [id*="play"], [class*="play"]')))
  } catch {}
  console.log(`${status ?? 'ERR'} | player=${hasPlayer} | ${name} | ${err ?? ''}`)
  await ctx.close().catch(() => {})
}
await browser.close()
