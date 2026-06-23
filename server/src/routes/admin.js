const { Router } = require('express')
const prisma = require('../db')
const { authenticate, authorize } = require('../middleware/authenticate')

const router = Router()

function stripHtml(html) {
  if (!html) return ''
  let text = html.replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, '')
  text = text.replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, '')
  text = text.replace(/<[^>]*>/g, ' ')
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
  return text.replace(/\s+/g, ' ').trim()
}

router.use(authenticate, authorize('admin'))

// GET /api/admin/stats — platform KPI summary
router.get('/stats', async (_req, res, next) => {
  try {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    const [totalUsers, activeConsultants, sessionsThisMonth] = await Promise.all([
      prisma.user.count(),
      prisma.consultantProfile.count({ where: { isActive: true } }),
      prisma.session.count({
        where: { createdAt: { gte: monthStart }, status: { not: 'cancelled' } },
      }),
    ])

    // Revenue estimate: sum of hourly rates for completed sessions this month
    const completedSessions = await prisma.session.findMany({
      where: { status: 'completed', createdAt: { gte: monthStart } },
      include: { consultant: { select: { hourlyRate: true } } },
    })
    const revenueEst = completedSessions.reduce(
      (sum, s) => sum + parseFloat(s.consultant.hourlyRate),
      0
    )

    res.json({ totalUsers, activeConsultants, sessionsThisMonth, revenueEst })
  } catch (err) {
    next(err)
  }
})

// GET /api/admin/settings — current system settings
// Secrets are NEVER sent to the client — only boolean configured status
router.get('/settings', async (_req, res, next) => {
  try {
    const rows = await prisma.systemSetting.findMany()
    const db = Object.fromEntries(rows.map((r) => [r.key, r.value]))

    const secretKey = process.env.STRIPE_SECRET_KEY ?? ''
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? ''
    const publishableKey = db['stripe_publishable_key'] ?? process.env.STRIPE_PUBLISHABLE_KEY ?? ''

    const mode = secretKey.startsWith('sk_live_') ? 'live' : 'test'

    res.json({
      stripe: {
        mode,
        publishableKey,
        secretKeyConfigured: secretKey.length > 0,
        webhookSecretConfigured: webhookSecret.length > 0,
      },
      legal: {
        legal_terms: db['legal_terms'] ?? '',
        legal_privacy: db['legal_privacy'] ?? '',
        legal_cookies: db['legal_cookies'] ?? '',
      },
    })
  } catch (err) {
    next(err)
  }
})

// GET /api/admin/consultants — all profiles regardless of isActive (admin only)
router.get('/consultants', async (_req, res, next) => {
  try {
    const consultants = await prisma.consultantProfile.findMany({
      select: {
        id: true,
        displayName: true,
        description: true,
        specialisations: {
          select: { specialisation: { select: { id: true, name: true, slug: true } } },
        },
        hourlyRate: true,
        avatarUrl: true,
        avatarBlobName: true,
        isActive: true,
        userId: true,
        platformFeePct: true,
        stripeAccountId: true,
        stripeOnboardingComplete: true,
        user: { select: { email: true, phone: true, isEmailConfirmed: true } },
        _count: {
          select: { availabilitySlots: true }
        },
        availabilitySlots: {
          where: {
            startTime: { gte: new Date() },
            isBooked: false,
          },
          select: { id: true }
        }
      },
      orderBy: { displayName: 'asc' },
    })

    const enriched = consultants.map(profile => {
      const slotsCount = profile._count?.availabilitySlots || 0
      const isEmailConfirmed = !!profile.user?.isEmailConfirmed
      const isHourlyRateSet = parseFloat(profile.hourlyRate) > 0
      const isAvailabilitySet = slotsCount > 0
      const hasCurrentAvailability = profile.availabilitySlots?.length > 0
      const isStripeOnboarded = !!profile.stripeOnboardingComplete
      const isProfileSetupComplete = !!(
        stripHtml(profile.description) &&
        profile.specialisations?.length > 0 &&
        profile.displayName &&
        profile.displayName.trim() &&
        (profile.avatarUrl || profile.avatarBlobName)
      )
      const accountComplete =
        isEmailConfirmed &&
        isHourlyRateSet &&
        isAvailabilitySet &&
        isStripeOnboarded &&
        isProfileSetupComplete

      // Remove the full availabilitySlots array to keep payload neat
      const mappedProfile = { ...profile }
      delete mappedProfile.availabilitySlots

      return {
        ...mappedProfile,
        isEmailConfirmed,
        isHourlyRateSet,
        isAvailabilitySet,
        hasCurrentAvailability,
        isStripeOnboarded,
        isProfileSetupComplete,
        accountComplete,
      }
    })

    res.json({ data: enriched, total: enriched.length })
  } catch (err) {
    next(err)
  }
})

// POST /api/admin/consultants/:id/change-email — change consultant's email (admin only)
router.post('/consultants/:id/change-email', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10)
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID invalid' })
    }

    const { email } = req.body
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ error: 'Adresa de email este nevalidă.' })
    }

    const trimmedEmail = email.trim().toLowerCase()

    const profile = await prisma.consultantProfile.findUnique({
      where: { id },
      select: { userId: true, user: { select: { email: true } } }
    })

    if (!profile) {
      return res.status(404).json({ error: 'Profilul de consultant nu a fost găsit.' })
    }

    if (profile.user.email === trimmedEmail) {
      return res.json({ success: true, message: 'Adresa de email este deja aceasta.' })
    }

    const existing = await prisma.user.findUnique({ where: { email: trimmedEmail } })
    if (existing) {
      return res.status(409).json({ error: 'Acest email este deja înregistrat la un alt cont.' })
    }

    await prisma.user.update({
      where: { id: profile.userId },
      data: { email: trimmedEmail }
    })

    res.json({ success: true, message: 'Emailul a fost schimbat cu succes!' })
  } catch (err) {
    next(err)
  }
})

// POST /api/admin/consultants/:id/resend-activation — resend activation email when unconfirmed (admin only)
router.post('/consultants/:id/resend-activation', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10)
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID invalid' })
    }

    const profile = await prisma.consultantProfile.findUnique({
      where: { id },
      include: { user: true }
    })

    if (!profile) {
      return res.status(404).json({ error: 'Profilul de consultant nu a fost găsit.' })
    }

    if (profile.user.isEmailConfirmed) {
      return res.status(400).json({ error: 'Emailul acestui consultant este deja confirmat.' })
    }

    const { email } = profile.user
    const crypto = require('crypto')
    const emailConfirmationToken = crypto.randomBytes(32).toString('hex')

    await prisma.user.update({
      where: { id: profile.userId },
      data: { emailConfirmationToken }
    })

    const origin = req.headers.origin || `${req.protocol}://${req.get('host')}`
    const activationUrl = `${origin}/confirmare-email?token=${emailConfirmationToken}`
    const guidesUrl = `${origin}/ghiduri-consultant`
    const recipientName = profile.displayName || email.split('@')[0]

    const { sendConsultantActivationEmail } = require('../emails')
    await sendConsultantActivationEmail({
      recipientEmail: email,
      recipientName,
      activationUrl,
      guidesUrl,
    })

    res.json({ success: true, message: 'Emailul de activare a fost retrimis cu succes!' })
  } catch (err) {
    console.error('[resend-activation] error:', err.message)
    next(err)
  }
})

// PATCH /api/admin/settings/:key — update an editable setting
// Only whitelisted keys can be updated from the UI
const EDITABLE_KEYS = new Set([
  'stripe_publishable_key',
  'legal_terms',
  'legal_privacy',
  'legal_cookies'
])

router.patch('/settings/:key', async (req, res, next) => {
  try {
    const { key } = req.params
    const { value } = req.body

    if (!EDITABLE_KEYS.has(key)) {
      return res.status(403).json({ error: 'This setting cannot be updated via the API. Use environment variables.' })
    }
    if (typeof value !== 'string' || !value.trim()) {
      return res.status(400).json({ error: 'value is required' })
    }

    await prisma.systemSetting.upsert({
      where: { key },
      update: { value: value.trim() },
      create: { key, value: value.trim() },
    })

    res.json({ key, updated: true })
  } catch (err) {
    next(err)
  }
})

// GET /api/admin/private-reviews — admin only, get paginated private reviews
router.get('/private-reviews', async (req, res, next) => {
  try {
    const { page = 1, limit = 30 } = req.query
    const pageNum = Math.max(1, parseInt(page, 10))
    const pageSize = Math.min(100, Math.max(1, parseInt(limit, 10)))

    const where = {
      AND: [
        { privateNotes: { not: null } },
        { privateNotes: { not: '' } }
      ]
    }

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        include: {
          client: {
            select: {
              id: true,
              email: true,
            },
          },
          consultant: {
            select: {
              id: true,
              displayName: true,
              slug: true,
            },
          },
          session: {
            select: {
              id: true,
              slot: {
                select: {
                  startTime: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (pageNum - 1) * pageSize,
        take: pageSize,
      }),
      prisma.review.count({ where }),
    ])

    res.json({ data: reviews, total, page: pageNum, pageSize })
  } catch (err) {
    next(err)
  }
})

// GET /api/admin/feedbacks — admin only, get all feedbacks
router.get('/feedbacks', async (_req, res, next) => {
  try {
    const feedbacks = await prisma.feedback.findMany({
      orderBy: { createdAt: 'desc' },
    })
    res.json({ data: feedbacks, total: feedbacks.length })
  } catch (err) {
    next(err)
  }
})

// DELETE /api/admin/feedbacks/:id — admin only, delete feedback
router.delete('/feedbacks/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10)
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID-ul feedback-ului este invalid' })
    }

    await prisma.feedback.delete({
      where: { id },
    })

    res.json({ success: true })
  } catch (err) {
    next(err)
  }
})

// Helper function for slugification
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD') // split accented characters into components
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\-]/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
}

// GET /api/admin/suggestions — get both types of suggestions for vetting
router.get('/suggestions', async (req, res, next) => {
  try {
    const specialisations = await prisma.suggestedSpecialisation.findMany({
      orderBy: { createdAt: 'desc' },
    })
    const expertiseAreas = await prisma.suggestedExpertiseArea.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        specialisation: {
          select: { name: true },
        },
      },
    })
    res.json({ specialisations, expertiseAreas })
  } catch (err) {
    next(err)
  }
})

// POST /api/admin/suggestions/specialisations/:id/approve — approve a suggested specialisation
router.post('/suggestions/specialisations/:id/approve', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10)
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID invalid' })
    }

    const suggestion = await prisma.suggestedSpecialisation.findUnique({
      where: { id },
    })

    if (!suggestion) {
      return res.status(404).json({ error: 'Sugestia de specializare nu a fost găsită.' })
    }

    const slug = slugify(suggestion.name)

    // Insert to proper table and delete from temp table in a transaction
    await prisma.$transaction([
      prisma.specialisation.create({
        data: {
          name: suggestion.name,
          slug,
        },
      }),
      prisma.suggestedSpecialisation.delete({
        where: { id },
      }),
    ])

    res.json({ success: true, message: 'Specializarea a fost aprobată cu succes!' })
  } catch (err) {
    // if unique constraint or any other db error
    if (err.code === 'P2002') {
      return res.status(400).json({ error: 'Această specializare (sau slug-ul ei) există deja în baza de date.' })
    }
    next(err)
  }
})

// POST /api/admin/suggestions/specialisations/:id/reject — reject/delete a suggested specialisation
router.post('/suggestions/specialisations/:id/reject', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10)
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID invalid' })
    }

    await prisma.suggestedSpecialisation.delete({
      where: { id },
    })

    res.json({ success: true, message: 'Sugestia a fost respinsă.' })
  } catch (err) {
    next(err)
  }
})

// POST /api/admin/suggestions/expertise-areas/:id/approve — approve a suggested expertise area
router.post('/suggestions/expertise-areas/:id/approve', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10)
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID invalid' })
    }

    const suggestion = await prisma.suggestedExpertiseArea.findUnique({
      where: { id },
    })

    if (!suggestion) {
      return res.status(404).json({ error: 'Sugestia de arie de expertiză nu a fost găsită.' })
    }

    const slug = slugify(suggestion.name)

    await prisma.$transaction([
      prisma.expertiseCategory.create({
        data: {
          name: suggestion.name,
          slug,
          specialisationId: suggestion.specialisationId,
        },
      }),
      prisma.suggestedExpertiseArea.delete({
        where: { id },
      }),
    ])

    res.json({ success: true, message: 'Aria de expertiză a fost aprobată cu succes!' })
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(400).json({ error: 'Această arie de expertiză (sau slug-ul ei) există deja în baza de date.' })
    }
    next(err)
  }
})

// POST /api/admin/suggestions/expertise-areas/:id/reject — reject/delete a suggested expertise area
router.post('/suggestions/expertise-areas/:id/reject', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10)
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID invalid' })
    }

    await prisma.suggestedExpertiseArea.delete({
      where: { id },
    })

    res.json({ success: true, message: 'Sugestia a fost respinsă.' })
  } catch (err) {
    next(err)
  }
})

module.exports = router
