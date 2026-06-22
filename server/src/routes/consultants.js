const { Router } = require('express')
const multer = require('multer')
const prisma = require('../db')
const stripe = require('../lib/stripe')
const { authenticate, authorize, optionalAuthenticate } = require('../middleware/authenticate')
const { uploadBlob, streamBlob, deleteBlob } = require('../lib/azureStorage')
const { sendPublicationRequestEmail } = require('../emails')

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
  slug: true,
  description: true,
  hourlyRate: true,
  avatarUrl: true,
  avatarBlobName: true,
  bannerUrl: true,
  bannerBlobName: true,
  languages: true,
  isActive: true,
  userId: true,
  platformFeePct: true,
  stripeAccountId: true,
  stripeOnboardingComplete: true,
  publicationRequested: true,
  averageRating: true,
  _count: { select: { reviews: true } },
  specialisations: {
    select: { specialisation: { select: { id: true, name: true, slug: true } } },
  },
  expertiseCategories: {
    select: { category: { select: { id: true, name: true, slug: true, specialisationId: true } } },
  },
  tags: { select: { id: true, tag: true } },
}

async function resolveConsultantId(idOrSlug) {
  const id = parseInt(idOrSlug)
  if (!isNaN(id) && String(id) === String(idOrSlug)) {
    return id
  }
  const profile = await prisma.consultantProfile.findUnique({
    where: { slug: idOrSlug },
    select: { id: true },
  })
  return profile ? profile.id : null
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
      select: {
        ...CONSULTANT_SELECT,
        user: {
          select: {
            id: true,
            email: true,
            isEmailConfirmed: true,
          },
        },
      },
    })
    if (!profile) return res.status(404).json({ error: 'Consultant profile not found' })

    const slotsCount = await prisma.availabilitySlot.count({
      where: { consultantId: profile.id },
    })

    const futureSlotsCount = await prisma.availabilitySlot.count({
      where: {
        consultantId: profile.id,
        startTime: { gte: new Date() },
        isBooked: false,
      },
    })

    const isEmailConfirmed = !!profile.user?.isEmailConfirmed
    const isHourlyRateSet = parseFloat(profile.hourlyRate) > 0
    const isAvailabilitySet = slotsCount > 0
    const hasCurrentAvailability = futureSlotsCount > 0
    const isStripeOnboarded = !!profile.stripeOnboardingComplete
    const isProfileSetupComplete = !!(
      profile.description &&
      profile.description.trim() &&
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

    res.json({
      ...profile,
      isEmailConfirmed,
      isHourlyRateSet,
      isAvailabilitySet,
      hasCurrentAvailability,
      isStripeOnboarded,
      isProfileSetupComplete,
      accountComplete,
    })
  } catch (err) {
    next(err)
  }
})

// POST /api/consultants/me/request-publication — consultant triggers profile publication review
router.post('/me/request-publication', authenticate, authorize('consultant'), async (req, res, next) => {
  try {
    const profile = await prisma.consultantProfile.findUnique({
      where: { userId: req.user.id },
      select: {
        id: true,
        displayName: true,
        hourlyRate: true,
        description: true,
        avatarUrl: true,
        avatarBlobName: true,
        stripeOnboardingComplete: true,
        specialisations: { select: { specialisationId: true } },
        user: { select: { email: true, isEmailConfirmed: true } },
      },
    })

    if (!profile) {
      return res.status(404).json({ error: 'Profilul de consultant nu a fost găsit.' })
    }

    const slotsCount = await prisma.availabilitySlot.count({
      where: { consultantId: profile.id },
    })

    const isEmailConfirmed = !!profile.user?.isEmailConfirmed
    const isHourlyRateSet = parseFloat(profile.hourlyRate) > 0
    const isAvailabilitySet = slotsCount > 0
    const isStripeOnboarded = !!profile.stripeOnboardingComplete
    const isProfileSetupComplete = !!(
      profile.description &&
      profile.description.trim() &&
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

    if (!accountComplete) {
      return res.status(400).json({ error: 'Trebuie să îndeplinești toate cele 5 condiții înainte de a solicita publicarea.' })
    }

    // Set publicationRequested to true
    await prisma.consultantProfile.update({
      where: { id: profile.id },
      data: { publicationRequested: true },
    })

    // Find admins to notify them via email
    const admins = await prisma.user.findMany({
      where: { role: 'admin' },
      select: { email: true },
    })

    const origin = req.headers.origin || `${req.protocol}://${req.get('host')}`
    const adminUrl = `${origin}/tools`

    for (const admin of admins) {
      sendPublicationRequestEmail({
        adminEmail: admin.email,
        consultantName: profile.displayName || profile.user.email.split('@')[0],
        consultantEmail: profile.user.email,
        adminUrl,
      }).catch(err =>
        console.error(`[brevo] Failed sending publication request email to ${admin.email}:`, err.message)
      )
    }

    res.json({ success: true, message: 'Cererea de publicare a fost trimisă cu succes administratorilor.' })
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
    if (displayName !== undefined) {
      data.displayName = String(displayName).trim()
      const { generateUniqueSlug } = require('../lib/slugify')
      data.slug = await generateUniqueSlug(data.displayName, profile.id)
    }
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

    const now = new Date()

    await prisma.$transaction([
      // Delete all unbooked future slots for this consultant
      prisma.availabilitySlot.deleteMany({
        where: { consultantId: profile.id, isBooked: false, startTime: { gte: now } },
      }),
      // Recreate from the submitted list (only future slots)
      prisma.availabilitySlot.createMany({
        data: slots
          .filter(({ startTime }) => new Date(startTime) >= now)
          .map(({ startTime, endTime }) => ({
            consultantId: profile.id,
            startTime: new Date(startTime),
            endTime: new Date(endTime),
            isBooked: false,
          })),
      }),
    ])

    const updated = await prisma.availabilitySlot.findMany({
      where: { consultantId: profile.id, startTime: { gte: now } },
      orderBy: { startTime: 'asc' },
    })
    res.json(updated)
  } catch (err) {
    next(err)
  }
})

// GET /api/consultants/:id/slots?date=YYYY-MM-DD or ?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
// Returns available start slots.
router.get('/:id/slots', authenticate, async (req, res, next) => {
  try {
    const id = await resolveConsultantId(req.params.id)
    if (!id) return res.status(404).json({ error: 'Consultant not found' })

    const { date, startDate, endDate } = req.query
    let gte, lte

    if (startDate && endDate) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
        return res.status(400).json({ error: 'startDate and endDate must be YYYY-MM-DD' })
      }
      gte = new Date(`${startDate}T00:00:00.000Z`)
      lte = new Date(`${endDate}T23:59:59.999Z`)
    } else if (date) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({ error: 'date query param required (YYYY-MM-DD)' })
      }
      gte = new Date(`${date}T00:00:00.000Z`)
      lte = new Date(`${date}T23:59:59.999Z`)
    } else {
      return res.status(400).json({ error: 'date or (startDate and endDate) query param required' })
    }

    const slots = await prisma.availabilitySlot.findMany({
      where: {
        consultantId: id,
        isBooked: false,
        startTime: { gte, lte },
      },
      orderBy: { startTime: 'asc' },
    })

    res.json(slots)
  } catch (err) {
    next(err)
  }
})

// GET /api/consultants/:id/avatar — proxy-stream the consultant's avatar image
router.get('/:id/avatar', async (req, res, next) => {
  try {
    const id = await resolveConsultantId(req.params.id)
    if (!id) return res.status(404).end()
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
    const id = await resolveConsultantId(req.params.id)
    if (!id) return res.status(404).end()
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

// GET /api/consultants/:id/reviews — public reviews for a consultant profile
router.get('/:id/reviews', async (req, res, next) => {
  try {
    const id = await resolveConsultantId(req.params.id)
    if (!id) return res.status(404).json({ error: 'Consultant not found' })

    const reviews = await prisma.review.findMany({
      where: { consultantId: id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        rating: true,
        testimonial: true,
        displayName: true,
        createdAt: true,
        session: {
          select: { id: true, clientId: true },
        },
        replies: {
          select: { id: true, index: true, content: true, authorId: true, createdAt: true },
          orderBy: { index: 'asc' },
        },
      },
    })

    res.json(reviews)
  } catch (err) {
    next(err)
  }
})

// GET /api/consultants/:id — single consultant profile
router.get('/:id', optionalAuthenticate, async (req, res, next) => {
  try {
    const id = await resolveConsultantId(req.params.id)
    if (!id) return res.status(404).json({ error: 'Consultant not found' })

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
    const id = await resolveConsultantId(req.params.id)
    if (!id) return res.status(404).json({ error: 'Consultant not found' })

    const { displayName, description, hourlyRate, isActive, platformFeePct } = req.body
    const data = {}

    if (displayName !== undefined) {
      data.displayName = displayName
      const { generateUniqueSlug } = require('../lib/slugify')
      data.slug = await generateUniqueSlug(displayName, id)
    }
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

// GET /api/consultants/me/reviews — all reviews for the authenticated consultant, newest first
router.get('/me/reviews', authenticate, authorize('consultant', 'admin'), async (req, res, next) => {
  try {
    const profile = await prisma.consultantProfile.findUnique({
      where: { userId: req.user.id },
      select: { id: true },
    })
    if (!profile) return res.status(404).json({ error: 'Consultant profile not found' })

    const reviews = await prisma.review.findMany({
      where: { consultantId: profile.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        rating: true,
        testimonial: true,
        displayName: true,
        createdAt: true,
        session: {
          select: {
            id: true,
            clientId: true,
          },
        },
        replies: {
          select: { id: true, index: true, content: true, authorId: true, createdAt: true },
          orderBy: { index: 'asc' },
        },
      },
    })

    res.json(reviews)
  } catch (err) {
    next(err)
  }
})

module.exports = router
