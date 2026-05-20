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
      },
    }),
  ])

  // ── Availability slots (next 14 days at fixed times) ────────────────────
  const slotTimes = [9, 10.5, 12, 13.5, 15, 16.5] // hours
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
