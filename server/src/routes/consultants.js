const { Router } = require('express')
const multer = require('multer')
const prisma = require('../db')
const stripe = require('../lib/stripe')
const { authenticate, authorize, optionalAuthenticate } = require('../middleware/authenticate')
const { uploadBlob, streamBlob, deleteBlob } = require('../lib/azureStorage')

const router = Router()

function isMissingStripeAccountError(err) {
  return err?.type === 'StripeInvalidRequestError' && err?.code === 'resource_missing' && err?.param === 'account'
}

async function createExpressConnectAccount(profileId, email) {
  const account = await stripe.accounts.create({
    type: 'express',
    email,
    capabilities: { transfers: { requested: true } },
    business_type: 'individual',
  })

  await prisma.consultantProfile.update({
    where: { id: profileId },
    data: { stripeAccountId: account.id, stripeOnboardingComplete: false },
  })

  return account
}

// Multer: memory storage, 5 MB limit, images only
const IMAGE_MIME = new Set(['image/jpeg', 'image/png', 'image/webp'])
const uploadImage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    IMAGE_MIME.has(file.mimetype) ? cb(null, true) : cb(Object.assign(new Error('Only JPEG, PNG and WebP images are allowed'), { status: 415 }))
  },
})

function runImageUpload(req, res) {
  return new Promise((resolve, reject) => {
    uploadImage.single('file')(req, res, (err) => (err ? reject(err) : resolve()))
  })
}

// Fields exposed to any authenticated caller (catalogue, profile cards)
const CONSULTANT_SELECT = {
  id: true,
  displayName: true,
  description: true,
  hourlyRate: true,
  avatarUrl: true,
  bannerUrl: true,
  languages: true,
  isActive: true,
  userId: true,
  platformFeePct: true,
  stripeAccountId: true,
  stripeOnboardingComplete: true,
  specialisations: {
    select: { specialisation: { select: { id: true, name: true, slug: true } } },
  },
  expertiseCategories: {
    select: { category: { select: { id: true, name: true, slug: true, specialisationId: true } } },
  },
  tags: { select: { id: true, tag: true } },
}

// GET /api/consultants — paginated + filtered list (public catalogue)
router.get('/', optionalAuthenticate, async (req, res, next) => {
  try {
    const {
      specialisationIds,
      maxRate,
      availableToday,
      sortBy = 'displayName',
      order = 'asc',
      page = 1,
      limit = 12,
    } = req.query

    const pageNum = Math.max(1, parseInt(page))
    const pageSize = Math.min(50, Math.max(1, parseInt(limit)))

    const where = { isActive: true }
    if (specialisationIds) {
      const ids = specialisationIds.split(',').map(Number).filter(Boolean)
      if (ids.length > 0) {
        where.specialisations = { some: { specialisationId: { in: ids } } }
      }
    }
    if (maxRate) {
      where.hourlyRate = { lte: parseFloat(maxRate) }
    }
    if (availableToday === 'true') {
      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)
      const todayEnd = new Date()
      todayEnd.setHours(23, 59, 59, 999)
      where.availabilitySlots = {
        some: { isBooked: false, startTime: { gte: todayStart, lte: todayEnd } },
      }
    }

    const allowedSort = ['displayName', 'hourlyRate']
    const orderField = allowedSort.includes(sortBy) ? sortBy : 'displayName'
    const orderDir = order === 'desc' ? 'desc' : 'asc'

    const [consultants, total] = await Promise.all([
      prisma.consultantProfile.findMany({
        where,
        select: CONSULTANT_SELECT,
        orderBy: { [orderField]: orderDir },
        skip: (pageNum - 1) * pageSize,
        take: pageSize,
      }),
      prisma.consultantProfile.count({ where }),
    ])

    res.json({ data: consultants, total, page: pageNum, pageSize })
  } catch (err) {
    next(err)
  }
})

// GET /api/consultants/specialisations — all specialisations with their expertise areas (public)
router.get('/specialisations', async (_req, res, next) => {
  try {
    const specialisations = await prisma.specialisation.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        expertiseAreas: {
          orderBy: { name: 'asc' },
          select: { id: true, name: true, slug: true },
        },
      },
    })
    res.json(specialisations)
  } catch (err) {
    next(err)
  }
})

// GET /api/consultants/categories — flat expertise categories list (backward compat)
router.get('/categories', async (_req, res, next) => {
  try {
    const categories = await prisma.expertiseCategory.findMany({ orderBy: { name: 'asc' } })
    res.json(categories)
  } catch (err) {
    next(err)
  }
})

// GET /api/consultants/tags/suggestions?q= — hashtag autocomplete for catalogue search
router.get('/tags/suggestions', async (req, res, next) => {
  try {
    const q = (req.query.q || '').trim().toLowerCase()
    if (!q) return res.json([])
    const rows = await prisma.consultantTag.findMany({
      where: { tag: { contains: q } },
      select: { tag: true },
      distinct: ['tag'],
      take: 20,
      orderBy: { tag: 'asc' },
    })
    res.json(rows.map((r) => r.tag))
  } catch (err) {
    next(err)
  }
})

// GET /api/consultants/me — consultant's own profile
router.get('/me', authenticate, authorize('consultant', 'admin'), async (req, res, next) => {
  try {
    const profile = await prisma.consultantProfile.findUnique({
      where: { userId: req.user.id },
      select: CONSULTANT_SELECT,
    })
    if (!profile) return res.status(404).json({ error: 'Consultant profile not found' })
    res.json(profile)
  } catch (err) {
    next(err)
  }
})

// PATCH /api/consultants/me — consultant updates their own profile
// Body may include: displayName, description, hourlyRate,
//   languages (string[]), specialisationIds (number[]), categoryIds (number[]), tags (string[])
router.patch('/me', authenticate, authorize('consultant', 'admin'), async (req, res, next) => {
  try {
    const profile = await prisma.consultantProfile.findUnique({
      where: { userId: req.user.id },
      select: { id: true },
    })
    if (!profile) return res.status(404).json({ error: 'Consultant profile not found' })

    const { displayName, description, hourlyRate, languages, specialisationIds, categoryIds, tags } = req.body

    const data = {}
    if (displayName !== undefined) data.displayName = String(displayName).trim()
    if (description !== undefined) data.description = description
    if (hourlyRate !== undefined) data.hourlyRate = parseFloat(hourlyRate)
    if (languages !== undefined) {
      if (!Array.isArray(languages)) return res.status(400).json({ error: 'languages must be an array' })
      data.languages = languages
    }

    const ops = []

    if (Object.keys(data).length > 0) {
      ops.push(prisma.consultantProfile.update({ where: { id: profile.id }, data }))
    }

    if (specialisationIds !== undefined) {
      if (!Array.isArray(specialisationIds)) return res.status(400).json({ error: 'specialisationIds must be an array' })
      ops.push(prisma.consultantProfileSpecialisation.deleteMany({ where: { profileId: profile.id } }))
      if (specialisationIds.length > 0) {
        ops.push(
          prisma.consultantProfileSpecialisation.createMany({
            data: specialisationIds.map((sid) => ({ profileId: profile.id, specialisationId: Number(sid) })),
            skipDuplicates: true,
          }),
        )
      }
    }

    if (categoryIds !== undefined) {
      if (!Array.isArray(categoryIds)) return res.status(400).json({ error: 'categoryIds must be an array' })
      ops.push(prisma.consultantProfileCategory.deleteMany({ where: { profileId: profile.id } }))
      if (categoryIds.length > 0) {
        ops.push(
          prisma.consultantProfileCategory.createMany({
            data: categoryIds.map((cid) => ({ profileId: profile.id, categoryId: Number(cid) })),
            skipDuplicates: true,
          }),
        )
      }
    }

    if (tags !== undefined) {
      if (!Array.isArray(tags)) return res.status(400).json({ error: 'tags must be an array' })
      const cleaned = [...new Set(tags.map((t) => String(t).toLowerCase().trim()).filter(Boolean))]
      ops.push(prisma.consultantTag.deleteMany({ where: { consultantId: profile.id } }))
      if (cleaned.length > 0) {
        ops.push(
          prisma.consultantTag.createMany({
            data: cleaned.map((tag) => ({ consultantId: profile.id, tag })),
            skipDuplicates: true,
          }),
        )
      }
    }

    if (ops.length === 0) return res.status(400).json({ error: 'Nothing to update' })

    await prisma.$transaction(ops)

    const updated = await prisma.consultantProfile.findUnique({
      where: { id: profile.id },
      select: CONSULTANT_SELECT,
    })
    res.json(updated)
  } catch (err) {
    next(err)
  }
})

// POST /api/consultants/me/avatar — upload avatar image
router.post('/me/avatar', authenticate, authorize('consultant', 'admin'), async (req, res, next) => {
  try {
    await runImageUpload(req, res)
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' })

    const profile = await prisma.consultantProfile.findUnique({
      where: { userId: req.user.id },
      select: { id: true, avatarBlobName: true },
    })
    if (!profile) return res.status(404).json({ error: 'Consultant profile not found' })

    if (profile.avatarBlobName) await deleteBlob(profile.avatarBlobName).catch(() => {})

    const blobName = await uploadBlob(`profiles/${profile.id}/avatar`, req.file.buffer, req.file.mimetype)
    await prisma.consultantProfile.update({
      where: { id: profile.id },
      data: { avatarBlobName: blobName, avatarUrl: null },
    })
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
})

// POST /api/consultants/me/banner — upload banner image
router.post('/me/banner', authenticate, authorize('consultant', 'admin'), async (req, res, next) => {
  try {
    await runImageUpload(req, res)
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' })

    const profile = await prisma.consultantProfile.findUnique({
      where: { userId: req.user.id },
      select: { id: true, bannerBlobName: true },
    })
    if (!profile) return res.status(404).json({ error: 'Consultant profile not found' })

    if (profile.bannerBlobName) await deleteBlob(profile.bannerBlobName).catch(() => {})

    const blobName = await uploadBlob(`profiles/${profile.id}/banner`, req.file.buffer, req.file.mimetype)
    await prisma.consultantProfile.update({
      where: { id: profile.id },
      data: { bannerBlobName: blobName, bannerUrl: null },
    })
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
})

// GET /api/consultants/me/slots — all upcoming slots for the logged-in consultant
router.get('/me/slots', authenticate, authorize('consultant', 'admin'), async (req, res, next) => {
  try {
    const profile = await prisma.consultantProfile.findUnique({
      where: { userId: req.user.id },
      select: { id: true },
    })
    if (!profile) return res.status(404).json({ error: 'Consultant profile not found' })

    const slots = await prisma.availabilitySlot.findMany({
      where: {
        consultantId: profile.id,
        startTime: { gte: new Date() },
      },
      orderBy: { startTime: 'asc' },
    })
    res.json(slots)
  } catch (err) {
    next(err)
  }
})

// PUT /api/consultants/me/slots — replace all unbooked future slots
// Body: { slots: [{ startTime: ISO, endTime: ISO }] }
router.put('/me/slots', authenticate, authorize('consultant', 'admin'), async (req, res, next) => {
  try {
    const profile = await prisma.consultantProfile.findUnique({
      where: { userId: req.user.id },
      select: { id: true },
    })
    if (!profile) return res.status(404).json({ error: 'Consultant profile not found' })

    const { slots } = req.body
    if (!Array.isArray(slots)) return res.status(400).json({ error: 'slots must be an array' })

    await prisma.$transaction([
      // Delete all unbooked future slots for this consultant
      prisma.availabilitySlot.deleteMany({
        where: { consultantId: profile.id, isBooked: false, startTime: { gte: new Date() } },
      }),
      // Recreate from the submitted list
      prisma.availabilitySlot.createMany({
        data: slots.map(({ startTime, endTime }) => ({
          consultantId: profile.id,
          startTime: new Date(startTime),
          endTime: new Date(endTime),
          isBooked: false,
        })),
      }),
    ])

    const updated = await prisma.availabilitySlot.findMany({
      where: { consultantId: profile.id, startTime: { gte: new Date() } },
      orderBy: { startTime: 'asc' },
    })
    res.json(updated)
  } catch (err) {
    next(err)
  }
})

// GET /api/consultants/:id/slots?date=YYYY-MM-DD[&duration=1|2]
// Returns available start slots for the given duration:
//   duration=1 (default) — any available 1h slot
//   duration=2 — only slots where the immediately consecutive 1h slot is also available
router.get('/:id/slots', authenticate, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id)
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' })

    const { date, duration = '1' } = req.query
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'date query param required (YYYY-MM-DD)' })
    }
    const durationHours = parseInt(duration) === 2 ? 2 : 1

    const dayStart = new Date(`${date}T00:00:00.000Z`)
    const dayEnd = new Date(`${date}T23:59:59.999Z`)

    const slots = await prisma.availabilitySlot.findMany({
      where: {
        consultantId: id,
        isBooked: false,
        startTime: { gte: dayStart, lte: dayEnd },
      },
      orderBy: { startTime: 'asc' },
    })

    if (durationHours === 2) {
      // Only return start slots where the consecutive next 1h slot is also available
      const availableStartMs = new Set(slots.map((s) => s.startTime.getTime()))
      return res.json(slots.filter((slot) => availableStartMs.has(slot.endTime.getTime())))
    }

    res.json(slots)
  } catch (err) {
    next(err)
  }
})

// GET /api/consultants/:id/avatar — proxy-stream the consultant's avatar image
router.get('/:id/avatar', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id)
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' })
    const profile = await prisma.consultantProfile.findUnique({
      where: { id },
      select: { avatarBlobName: true },
    })
    if (!profile?.avatarBlobName) return res.status(404).end()
    await streamBlob(profile.avatarBlobName, res)
  } catch (err) {
    next(err)
  }
})

// GET /api/consultants/:id/banner — proxy-stream the consultant's banner image
router.get('/:id/banner', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id)
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' })
    const profile = await prisma.consultantProfile.findUnique({
      where: { id },
      select: { bannerBlobName: true },
    })
    if (!profile?.bannerBlobName) return res.status(404).end()
    await streamBlob(profile.bannerBlobName, res)
  } catch (err) {
    next(err)
  }
})

// GET /api/consultants/:id — single consultant profile
router.get('/:id', optionalAuthenticate, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id)
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' })

    const consultant = await prisma.consultantProfile.findUnique({
      where: { id },
      select: CONSULTANT_SELECT,
    })
    if (!consultant) return res.status(404).json({ error: 'Consultant not found' })

    res.json(consultant)
  } catch (err) {
    next(err)
  }
})

// PATCH /api/consultants/:id — admin only: update consultant profile
router.patch('/:id', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const id = parseInt(req.params.id)
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' })

    const { displayName, description, hourlyRate, isActive, platformFeePct } = req.body
    const data = {}

    if (displayName !== undefined) data.displayName = displayName
    if (description !== undefined) data.description = description
    if (hourlyRate !== undefined) data.hourlyRate = parseFloat(hourlyRate)
    if (isActive !== undefined) data.isActive = Boolean(isActive)
    if (platformFeePct !== undefined) {
      const pct = parseFloat(platformFeePct)
      if (isNaN(pct) || pct < 0 || pct > 100) {
        return res.status(400).json({ error: 'platformFeePct must be a number between 0 and 100' })
      }
      data.platformFeePct = pct
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: 'Nothing to update' })
    }

    const updated = await prisma.consultantProfile.update({
      where: { id },
      data,
      select: CONSULTANT_SELECT,
    })
    res.json(updated)
  } catch (err) {
    next(err)
  }
})

// POST /api/consultants/me/connect/onboard
// Creates a Stripe Express account (if needed) and returns a hosted Stripe link.
// - Not yet onboarded → account_onboarding link (enter bank details + KYC)
// - Already onboarded → account_update link (update bank details / payout settings)
// Always safe to call; Stripe links are single-use and expire after a few minutes.
router.post('/me/connect/onboard', authenticate, authorize('consultant'), async (req, res, next) => {
  try {
    const profile = await prisma.consultantProfile.findUnique({
      where: { userId: req.user.id },
      select: { id: true, stripeAccountId: true, stripeOnboardingComplete: true },
    })
    if (!profile) return res.status(404).json({ error: 'Consultant profile not found' })

    const user = await prisma.user.findUnique({ where: { id: req.user.id }, select: { email: true } })

    let stripeAccount = null
    if (profile.stripeAccountId) {
      try {
        stripeAccount = await stripe.accounts.retrieve(profile.stripeAccountId)
      } catch (stripeErr) {
        if (!isMissingStripeAccountError(stripeErr)) throw stripeErr

        await prisma.consultantProfile.update({
          where: { id: profile.id },
          data: { stripeAccountId: null, stripeOnboardingComplete: false },
        })
      }
    }

    if (!stripeAccount) {
      stripeAccount = await createExpressConnectAccount(profile.id, user.email)
    }

    const accountId = stripeAccount.id

    const appUrl = process.env.APP_URL || 'http://localhost:5173'

    const linkType = stripeAccount.details_submitted ? 'account_update' : 'account_onboarding'

    // Sync DB if needed
    if (stripeAccount.details_submitted && !profile.stripeOnboardingComplete) {
      await prisma.consultantProfile.update({
        where: { id: profile.id },
        data: { stripeOnboardingComplete: true },
      })
    } else if (!stripeAccount.details_submitted && profile.stripeOnboardingComplete) {
      await prisma.consultantProfile.update({
        where: { id: profile.id },
        data: { stripeOnboardingComplete: false },
      })
    }

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${appUrl}/acasa?tab=contul-meu&connect=refresh`,
      return_url: `${appUrl}/acasa?tab=contul-meu&connect=success`,
      type: linkType,
    })

    res.json({ url: accountLink.url })
  } catch (err) {
    console.error('[connect/onboard] error:', err.message, err.type, err.code, err.param)
    next(err)
  }
})

// GET /api/consultants/me/connect/status
// Returns whether the consultant has completed Stripe Connect onboarding.
// If a stripeAccountId exists but onboardingComplete is still false, we query
// Stripe directly to check details_submitted and self-heal the DB row.
// This means the status is always accurate even if the account.updated webhook
// was missed (e.g. stripe listener not running in dev).
router.get('/me/connect/status', authenticate, authorize('consultant'), async (req, res, next) => {
  try {
    const profile = await prisma.consultantProfile.findUnique({
      where: { userId: req.user.id },
      select: { id: true, stripeAccountId: true, stripeOnboardingComplete: true },
    })
    if (!profile) return res.status(404).json({ error: 'Consultant profile not found' })

    let onboardingComplete = profile.stripeOnboardingComplete
    let stripeAccountId = profile.stripeAccountId

    if (profile.stripeAccountId) {
      try {
        const account = await stripe.accounts.retrieve(profile.stripeAccountId)
        if (account.details_submitted !== onboardingComplete) {
          onboardingComplete = account.details_submitted
          await prisma.consultantProfile.update({
            where: { id: profile.id },
            data: { stripeOnboardingComplete: onboardingComplete },
          })
        }
      } catch (stripeErr) {
        if (isMissingStripeAccountError(stripeErr)) {
          stripeAccountId = null
          onboardingComplete = false
          await prisma.consultantProfile.update({
            where: { id: profile.id },
            data: { stripeAccountId: null, stripeOnboardingComplete: false },
          })
        } else {
          // Non-fatal: return whatever we have in the DB
          console.error('[connect] failed to retrieve Stripe account', stripeErr.message)
        }
      }
    }

    res.json({
      stripeAccountId,
      onboardingComplete,
    })
  } catch (err) {
    next(err)
  }
})

// POST /api/consultants/suggest-specialisation — suggest a specialisation (authenticated)
router.post('/suggest-specialisation', authenticate, async (req, res, next) => {
  try {
    const { name } = req.body
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Numele specializării este obligatoriu' })
    }

    const trimmedName = name.trim()

    // Check if it already exists as an approved specialisation
    const existingSpec = await prisma.specialisation.findFirst({
      where: { name: { equals: trimmedName } },
    })
    if (existingSpec) {
      return res.status(400).json({ error: 'Această specializare există deja.' })
    }

    // Check if already suggested and pending
    const existingSuggestion = await prisma.suggestedSpecialisation.findFirst({
      where: { name: { equals: trimmedName } },
    })
    if (existingSuggestion) {
      return res.status(400).json({ error: 'Această specializare a fost sugerată deja și este în curs de verificare.' })
    }

    const suggestion = await prisma.suggestedSpecialisation.create({
      data: {
        name: trimmedName,
        status: 'Pending',
      },
    })

    res.json(suggestion)
  } catch (err) {
    next(err)
  }
})

// POST /api/consultants/suggest-expertise-area — suggest an expertise area (authenticated)
router.post('/suggest-expertise-area', authenticate, async (req, res, next) => {
  try {
    const { name, specialisationId } = req.body
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Numele ariei de expertiză este obligatoriu' })
    }
    if (!specialisationId) {
      return res.status(400).json({ error: 'ID-ul specializării este obligatoriu' })
    }

    const trimmedName = name.trim()
    const specId = parseInt(specialisationId, 10)

    // Check if the parent specialisation exists
    const parentSpec = await prisma.specialisation.findUnique({
      where: { id: specId },
    })
    if (!parentSpec) {
      return res.status(404).json({ error: 'Specializarea părinte nu a fost găsită.' })
    }

    // Check if it already exists in Approved categories
    const existingCategory = await prisma.expertiseCategory.findFirst({
      where: { name: { equals: trimmedName }, specialisationId: specId },
    })
    if (existingCategory) {
      return res.status(400).json({ error: 'Această arie de expertiză există deja.' })
    }

    // Check if already suggested and pending for this specialisation
    const existingSuggestion = await prisma.suggestedExpertiseArea.findFirst({
      where: { name: { equals: trimmedName }, specialisationId: specId },
    })
    if (existingSuggestion) {
      return res.status(400).json({ error: 'Această arie de expertiză a fost sugerată deja sub această specializare.' })
    }

    const suggestion = await prisma.suggestedExpertiseArea.create({
      data: {
        name: trimmedName,
        specialisationId: specId,
        status: 'Pending',
      },
    })

    res.json(suggestion)
  } catch (err) {
    next(err)
  }
})

module.exports = router
