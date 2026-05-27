const fs = require('fs')
const path = require('path')

const CACHE_FILE = path.join(__dirname, 'bnr-cache.xml')
const BNR_URL = 'https://www.bnr.ro/nbrfxrates.xml'
const CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours

function parseEurRate(xml) {
  const match = xml.match(/<Rate currency="EUR">([\d.]+)<\/Rate>/)
  if (!match) throw new Error('EUR rate not found in BNR XML')
  const rate = parseFloat(match[1])
  if (!isFinite(rate) || rate <= 0) throw new Error(`Invalid EUR rate parsed: ${match[1]}`)
  return rate
}

/**
 * Returns the current EUR → RON exchange rate from BNR.
 *
 * Strategy:
 *  1. If the local cache file exists and is < 24h old, parse and return its rate.
 *  2. Otherwise fetch a fresh XML from BNR, write it to the cache file, and return the new rate.
 *  3. If the fetch fails for any reason, fall back to the stale cache (however old).
 *  4. If there is no cache at all and the fetch fails, throw so the caller can handle it.
 */
async function getEurToRonRate() {
  let cacheAge = Infinity
  let cacheXml = null

  try {
    const stat = fs.statSync(CACHE_FILE)
    cacheAge = Date.now() - stat.mtimeMs
    cacheXml = fs.readFileSync(CACHE_FILE, 'utf8')
  } catch {
    // No cache file yet — will fetch below
  }

  if (cacheAge < CACHE_TTL_MS && cacheXml) {
    return parseEurRate(cacheXml)
  }

  // Cache is stale or missing — attempt a fresh fetch
  try {
    const res = await fetch(BNR_URL, { signal: AbortSignal.timeout(8000) })
    if (!res.ok) throw new Error(`BNR responded with HTTP ${res.status}`)
    const xml = await res.text()
    const rate = parseEurRate(xml) // validate before persisting
    try {
      fs.writeFileSync(CACHE_FILE, xml, 'utf8')
    } catch (writeErr) {
      console.warn('[bnr] failed to write cache file:', writeErr.message)
    }
    return rate
  } catch (err) {
    if (cacheXml) {
      console.warn('[bnr] fetch failed, using stale cache:', err.message)
      return parseEurRate(cacheXml)
    }
    throw new Error(`BNR rate unavailable and no cache exists: ${err.message}`)
  }
}

module.exports = { getEurToRonRate }
