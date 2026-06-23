const { Router } = require('express')
const { authenticate } = require('../middleware/authenticate')

const router = Router()

// GET /api/companies/lookup/:cui
// Publicly accessible to make sure users can look it up before/during booking
router.get('/lookup/:cui', async (req, res, next) => {
  try {
    const rawCui = req.params.cui || ''
    // Clean CUI: strip non-digits to get a clean number
    const cleanedCui = rawCui.replace(/\D/g, '')

    if (!cleanedCui) {
      return res.status(400).json({ error: 'CUI-ul furnizat este invalid.' })
    }

    // Support mock CUI for testing / local development
    if (cleanedCui === '123456' || cleanedCui === '12345678') {
      return res.json({
        success: true,
        company: {
          denumire: 'S.C. EXEMPLU S.R.L.',
          nrRegCom: 'J40/123/2020',
          adresa: 'Str. Comerțului Nr. 5, București'
        }
      })
    }

    const todayStr = new Date().toISOString().split('T')[0]

    // Query ANAF Public API (v9/tva is the correct endpoint)
    const response = await fetch('https://webservicesp.anaf.ro/api/PlatitorTvaRest/v9/tva', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify([{
        cui: parseInt(cleanedCui, 10),
        data: todayStr
      }])
    })

    if (!response.ok) {
      throw new Error(`ANAF API returned status code ${response.status}`)
    }

    const data = await response.json()
    
    if (data && Array.isArray(data.found) && data.found.length > 0) {
      const match = data.found[0]
      const info = match.date_generale

      if (info) {
        const denumire = info.denumire ? info.denumire.trim() : ''
        const adresa = info.adresa ? info.adresa.trim() : ''
        const nrRegCom = info.nrRegCom ? info.nrRegCom.trim() : ''

        if (!denumire) {
          return res.status(404).json({ error: 'CUI-ul a fost găsit, dar nu conține o denumire validă.' })
        }

        return res.json({
          success: true,
          company: {
            denumire,
            nrRegCom,
            adresa
          }
        })
      }
    }

    return res.status(404).json({ error: 'Compania cu acest CUI nu a fost găsită în baza de date ANAF.' })
    
  } catch (error) {
    console.error('[ANAF Lookup Error]:', error)
    return res.status(500).json({ 
      error: 'Nu s-au putut prelua datele automat de la ANAF. Vă rugăm să le introduceți manual.' 
    })
  }
})

module.exports = router
