const bcrypt = require('bcryptjs')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  // ── Users ────────────────────────────────────────────────────────────────
  const [admin, consultant1, consultant2, client1] = await Promise.all([
    prisma.user.upsert({
      where: { email: 'admin@servio.dev' },
      update: {},
      create: {
        email: 'admin@servio.dev',
        passwordHash: await bcrypt.hash('admin1234', 12),
        role: 'admin',
      },
    }),
    prisma.user.upsert({
      where: { email: 'lorem@servio.dev' },
      update: {},
      create: {
        email: 'lorem@servio.dev',
        passwordHash: await bcrypt.hash('consultant1234', 12),
        role: 'consultant',
      },
    }),
    prisma.user.upsert({
      where: { email: 'dolor@servio.dev' },
      update: {},
      create: {
        email: 'dolor@servio.dev',
        passwordHash: await bcrypt.hash('consultant1234', 12),
        role: 'consultant',
      },
    }),
    prisma.user.upsert({
      where: { email: 'client@servio.dev' },
      update: {},
      create: {
        email: 'client@servio.dev',
        passwordHash: await bcrypt.hash('client1234', 12),
        role: 'client',
      },
    }),
  ])

  // ── Expertise categories (platform-defined) ─────────────────────────────
  const CATEGORIES = [
    { name: 'Tax Law',           slug: 'tax-law' },
    { name: 'VAT Compliance',    slug: 'vat-compliance' },
    { name: 'Payroll',           slug: 'payroll' },
    { name: 'Audit',             slug: 'audit' },
    { name: 'Corporate Finance', slug: 'corporate-finance' },
    { name: 'Estate Planning',   slug: 'estate-planning' },
    { name: 'Accounting',        slug: 'accounting' },
    { name: 'Financial Advisory',slug: 'financial-advisory' },
  ]
  const categories = {}
  for (const cat of CATEGORIES) {
    const c = await prisma.expertiseCategory.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name },
      create: cat,
    })
    categories[cat.slug] = c
  }

  // ── Consultant profiles ───────────────────────────────────────────────────
  const [profile1, profile2] = await Promise.all([
    prisma.consultantProfile.upsert({
      where: { userId: consultant1.id },
      update: {},
      create: {
        userId: consultant1.id,
        displayName: 'Lorem Ipsum',
        description:
          'Experienced fiscal consultant specialising in Tax Law and VAT compliance. Over 12 years advising SMEs and multinationals across the EU.',
        specialisation: 'Tax Law',
        hourlyRate: 90,
        isActive: true,
        languages: ['en', 'ro'],
      },
    }),
    prisma.consultantProfile.upsert({
      where: { userId: consultant2.id },
      update: {},
      create: {
        userId: consultant2.id,
        displayName: 'Dolor Sit',
        description:
          'VAT Compliance expert with deep experience in cross-border transactions and periodic VAT filings.',
        specialisation: 'VAT Compliance',
        hourlyRate: 75,
        isActive: true,
        languages: ['en', 'fr'],
      },
    }),
  ])

  // Link seed profiles to categories (idempotent via upsert on the @@id)
  const categoryLinks = [
    { profileId: profile1.id, categoryId: categories['tax-law'].id },
    { profileId: profile1.id, categoryId: categories['vat-compliance'].id },
    { profileId: profile2.id, categoryId: categories['vat-compliance'].id },
  ]
  for (const link of categoryLinks) {
    await prisma.consultantProfileCategory.upsert({
      where: { profileId_categoryId: link },
      update: {},
      create: link,
    })
  }

  // Seed a few example tags
  const tagData = [
    { consultantId: profile1.id, tag: 'transfer-pricing' },
    { consultantId: profile1.id, tag: 'eu-tax-directives' },
    { consultantId: profile2.id, tag: 'intrastat' },
    { consultantId: profile2.id, tag: 'reverse-charge' },
  ]
  for (const t of tagData) {
    await prisma.consultantTag.upsert({
      where: { consultantId_tag: t },
      update: {},
      create: t,
    })
  }

  // ── Availability slots (next 14 days at fixed times) ────────────────────
  const slotTimes = [9, 10, 11, 12, 13, 14, 15, 16, 17] // hours (1h slots, back-to-back)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const slotData = []
  for (const profile of [profile1, profile2]) {
    for (let day = 1; day <= 14; day++) {
      for (const hour of slotTimes) {
        const start = new Date(today)
        start.setDate(today.getDate() + day)
        start.setHours(Math.floor(hour), (hour % 1) * 60, 0, 0)
        const end = new Date(start)
        end.setMinutes(end.getMinutes() + 60)
        slotData.push({ consultantId: profile.id, startTime: start, endTime: end, isBooked: false })
      }
    }
  }

  // Only create slots if none exist yet (idempotent-ish)
  const existingSlots = await prisma.availabilitySlot.count()
  if (existingSlots === 0) {
    await prisma.availabilitySlot.createMany({ data: slotData })
    console.log(`  ${slotData.length} availability slots created`)
  } else {
    console.log(`  Slots already exist (${existingSlots}), skipping slot creation`)
  }

  console.log('Seed complete:')
  console.log('  admin@servio.dev       / admin1234')
  console.log('  lorem@servio.dev       / consultant1234')
  console.log('  dolor@servio.dev       / consultant1234')
  console.log('  client@servio.dev      / client1234')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
