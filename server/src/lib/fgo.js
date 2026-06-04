const crypto = require('crypto')

const FGO_API_URL = process.env.FGO_API_URL || (process.env.NODE_ENV === 'production' ? 'https://api.fgo.ro/v1' : 'https://api-testuat.fgo.ro/v1')
const FGO_COD_FISCAL = process.env.FGO_COD_FISCAL
const FGO_PRIVATE_KEY = process.env.FGO_PRIVATE_KEY
const FGO_SERIE = process.env.FGO_SERIE || 'SRV'
const APP_URL = process.env.APP_URL || 'http://localhost:3000'

const ROMANIAN_COUNTIES = [
  "Alba", "Arad", "Argeș", "Bacău", "Bihor", "Bistrița-Năsăud", "Botoșani", "Brașov", "Brăila", "Buzău",
  "Caraș-Severin", "Călărași", "Cluj", "Constanța", "Covasna", "Dâmbovița", "Dolj", "Galați", "Giurgiu",
  "Gorj", "Harghita", "Hunedoara", "Ialomița", "Iași", "Ilfov", "Maramureș", "Mehedinți", "Mureș", "Neamț",
  "Olt", "Prahova", "Satu Mare", "Sălaj", "Sibiu", "Suceava", "Teleorman", "Timiș", "Tulcea", "Vaslui",
  "Vâlcea", "Vrancea", "București"
]

function extractJudetAndLocalitate(address) {
  if (!address) return { judet: 'București', localitate: 'București' }
  
  const cleanAddress = address.toLowerCase()
  let foundJudet = 'București'
  
  for (const county of ROMANIAN_COUNTIES) {
    const countyLower = county.toLowerCase()
    const regex = new RegExp(`\\b(jud\\.?\\s*)?${countyLower}\\b`, 'i')
    if (regex.test(cleanAddress)) {
      foundJudet = county
      break
    }
  }
  
  const parts = address.split(',')
  let foundLocalitate = parts[0] ? parts[0].trim() : 'București'
  
  if (
    foundLocalitate.toLowerCase().includes('str') || 
    foundLocalitate.toLowerCase().includes('bld') || 
    foundLocalitate.toLowerCase().includes('calea') ||
    foundLocalitate.toLowerCase().includes('splai')
  ) {
    foundLocalitate = foundJudet
  }
  
  return { judet: foundJudet, localitate: foundLocalitate }
}

/**
 * Emits an invoice via FGO API for a successful session payment.
 * @param {object} session - Session object with consultant and billing relations
 * @param {number} amountRon - Exact paid amount in RON
 */
async function emitInvoice(session, amountRon) {
  const billing = session.billing
  if (!billing) {
    console.warn(`[FGO] Session ${session.id} has no billing information. Skipping invoice.`)
    return null
  }

  // If credentials are not configured, use a mock response to avoid breaking development flows
  if (!FGO_COD_FISCAL || !FGO_PRIVATE_KEY) {
    console.info(`[FGO] Credentials not fully configured (FGO_COD_FISCAL, FGO_PRIVATE_KEY). Running in mock mode.`)
    const mockInvoice = {
      Success: true,
      Message: 'FGO Mock Billing succeeded (local development)',
      Factura: {
        Numar: 'MOCK-' + session.id,
        Serie: FGO_SERIE,
        Link: `https://testuat.fgo.ro/mock-factura/MOCK-${session.id}.pdf`
      }
    }
    console.log('[FGO] Mock invoice generated:', mockInvoice)
    return mockInvoice
  }

  try {
    let clientName = ''
    let clientPayload = {}

    if (billing.billingType === 'fizica') {
      clientName = billing.name || ''
      clientPayload = {
        Denumire: clientName,
        Tip: 'PF',
        Tara: 'RO',
        Judet: billing.judet || 'București',
        Localitate: billing.localitate || 'București',
        Email: session.client ? session.client.email || '' : '',
      }
      if (billing.cnp) {
        clientPayload.CodUnic = billing.cnp
      }
      if (billing.localitate) {
        clientPayload.Adresa = `Localitate: ${billing.localitate}`
      }
    } else if (billing.billingType === 'juridica') {
      clientName = billing.companyName || ''
      const parsedLocation = extractJudetAndLocalitate(billing.companyAddress)
      clientPayload = {
        Denumire: clientName,
        Tip: 'PJ',
        Tara: 'RO',
        Judet: parsedLocation.judet,
        Localitate: parsedLocation.localitate,
        CodUnic: billing.cui || '',
        NrRegCom: billing.regCom || '',
        Adresa: billing.companyAddress || '',
        Email: session.client ? session.client.email || '' : '',
      }
    } else {
      console.warn(`[FGO] Invalid billing type '${billing.billingType}' on session ${session.id}. Skipping.`)
      return null
    }

    // Hash formula: Hash = SHA1(CodUnic + PrivateKey + ClientName)
    const hash = crypto.createHash('sha1')
      .update(FGO_COD_FISCAL + FGO_PRIVATE_KEY + clientName)
      .digest('hex')
      .toUpperCase()

    const consultantName = session.consultant ? session.consultant.displayName || 'Consultanță' : 'Consultant'
    const durationHours = session.durationMinutes ? session.durationMinutes / 60 : 1
    const itemDescription = `Servicii consultanță SERVO: ${consultantName} - ${durationHours} ${durationHours === 1 ? 'oră' : 'ore'}`

    const body = {
      CodUnic: FGO_COD_FISCAL,
      Hash: hash,
      Serie: FGO_SERIE,
      Valuta: 'RON',
      TipFactura: 'Factura',
      PlatformaUrl: APP_URL,
      ModPlata: 'Card',
      TipPlata: 'Card',
      Client: clientPayload,
      Continut: [{
        Denumire: itemDescription,
        NrProduse: 1,
        UM: 'BUC',
        CotaTVA: 21,
        PretTotal: parseFloat(amountRon.toFixed(2))
      }]
    }

    console.log(`[FGO] Sending invoice request for session ${session.id}. Client: ${clientName}, Amount: ${amountRon} RON`)
    
    const response = await fetch(`${FGO_API_URL}/factura/emitere`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      throw new Error(`FGO API error (HTTP ${response.status}): ${response.statusText}`)
    }

    const result = await response.json()
    if (result && result.Success) {
      console.info(`[FGO] Invoice emitted successfully for session ${session.id}: ${result.Factura?.Serie} ${result.Factura?.Numar}. Link: ${result.Factura?.Link}`)
    } else {
      console.error(`[FGO] Invoice emission failed for session ${session.id}: ${result ? result.Message : 'Unknown error'}`)
    }
    return result
  } catch (error) {
    console.error(`[FGO] Unhandled error during invoice emission for session ${session.id}:`, error.message)
    return null
  }
}

module.exports = {
  emitInvoice
}
