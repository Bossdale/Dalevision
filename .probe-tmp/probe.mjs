import { chromium } from 'playwright'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'

// id 550 = Fight Club (movie). Broadly available test target.
const SOURCES = [
  ['VidSrc',    'https://vidsrc.me/embed/movie/550'],
  ['VidLink',   'https://vidlink.pro/movie/550'],
  ['2Embed',    'https://www.2embed.cc/embed/550'],
  ['VidSrc.cc', 'https://vidsrc.cc/v2/embed/movie/550'],
  ['Embed.su',  'https://embed.su/embed/movie/550'],
  ['AutoEmbed', 'https://player.autoembed.cc/embed/movie/550'],
  ['MoviesAPI', 'https://moviesapi.club/movie/550'],
  ['VidFast',   'https://vidfast.pro/movie/550'],
  ['VidSrc DL', 'https://dl.vidsrc.me/movie/550'],
]

const STREAM_RE = /\.m3u8|\.mpd|master\.txt|\/manifest|\.ts(\?|$)|seg-\d|video\/mp4|mpegurl/i

async function probe(browser, [name, url]) {
  const ctx = await browser.newContext({
    userAgent: UA,
    viewport: { width: 1280, height: 720 },
    locale: 'en-US',
    extraHTTPHeaders: {
      'Accept-Language': 'en-US,en;q=0.9',
      'sec-ch-ua': '"Chromium";v="126", "Not:A-Brand";v="24", "Google Chrome";v="126"',
      'sec-ch-ua-platform': '"Windows"',
      'Upgrade-Insecure-Requests': '1',
    },
  })
  // Strip the navigator.webdriver flag that flags us as automation.
  await ctx.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined })
  })
  const page = await ctx.newPage()
  // Auto-close ad/popup tabs (any page other than our main one) so they
  // don't hijack the run. Registered AFTER main page exists.
  ctx.on('page', (p) => { if (p !== page) p.close().catch(() => {}) })

  let streamHit = null
  let loaded = false
  const onReq = (req) => {
    const u = req.url()
    if (!streamHit && STREAM_RE.test(u)) streamHit = u
  }
  ctx.on('request', onReq)
  ctx.on('response', (res) => { if (!streamHit && STREAM_RE.test(res.url())) streamHit = res.url() })

  let httpStatus = null
  try {
    const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 25000 })
    httpStatus = resp?.status() ?? null
    loaded = true
  } catch (e) {
    await ctx.close().catch(() => {})
    return { name, url, ok: false, httpStatus, stream: null, note: 'nav failed: ' + e.message.split('\n')[0] }
  }

  // Try to trigger playback: click center a few times (ad-gated players
  // usually need 1-3 clicks; first clicks open/close ad popups).
  const deadline = Date.now() + 22000
  let clicks = 0
  while (Date.now() < deadline && !streamHit) {
    if (clicks < 4) {
      await page.mouse.click(640, 360).catch(() => {})
      // Also try clicking common play-button selectors inside main frame.
      for (const sel of ['.play', '.jw-icon-display', 'button[aria-label*="lay"]', 'video']) {
        await page.click(sel, { timeout: 500 }).catch(() => {})
      }
      clicks++
    }
    await page.waitForTimeout(1200).catch(() => {})
  }

  await ctx.close().catch(() => {})
  return { name, url, ok: !!streamHit, httpStatus, stream: streamHit, loaded }
}

const browser = await chromium.launch({
  headless: false,
  args: [
    '--autoplay-policy=no-user-gesture-required',
    '--disable-blink-features=AutomationControlled',
    '--no-sandbox',
  ],
})
const results = []
for (const s of SOURCES) {
  process.stderr.write(`probing ${s[0]}...\n`)
  try { results.push(await probe(browser, s)) }
  catch (e) { results.push({ name: s[0], url: s[1], ok: false, note: 'crash: ' + e.message.split('\n')[0] }) }
}
await browser.close()

console.log('\n===== RESULTS =====')
for (const r of results) {
  const verdict = r.ok ? 'PLAYS   ' : (r.loaded ? 'NO STREAM' : 'DEAD    ')
  const detail = r.ok ? r.stream.slice(0, 70) : (r.note || `http ${r.httpStatus}, no stream detected`)
  console.log(`${verdict} | ${r.name.padEnd(10)} | ${detail}`)
}
