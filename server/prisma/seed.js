const bcrypt = require('bcryptjs')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  // ── Clear reference tables for idempotent re-seeding ─────────────────────
  // Delete children before parents to satisfy FK constraints,
  // then use $executeRawUnsafe so MySQL receives plain SQL (not a prepared statement).
  await prisma.$executeRawUnsafe('DELETE FROM consultant_profile_categories')
  await prisma.$executeRawUnsafe('DELETE FROM consultant_profile_specialisations')
  await prisma.$executeRawUnsafe('DELETE FROM expertise_categories')
  await prisma.$executeRawUnsafe('DELETE FROM specialisations')

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

  // ── Specialisations and their expertise areas ────────────────────────────
  const SPECIALISATIONS = [
    {
      name: 'Contabilitate',
      slug: 'contabilitate',
      areas: [
        { name: 'Interpretare balanță și situații financiare', slug: 'interpretare-balanta-situatii-financiare' },
        { name: 'Fluxuri financiare și cash-flow',             slug: 'fluxuri-financiare-cash-flow' },
        { name: 'Optimizare procese contabile',                slug: 'optimizare-procese-contabile' },
        { name: 'Analiză costuri și profitabilitate',          slug: 'analiza-costuri-profitabilitate' },
        { name: 'Pregătire pentru controale ANAF',             slug: 'pregatire-controale-anaf' },
        { name: 'Consultanță facturare și documente contabile', slug: 'consultanta-facturare-documente-contabile' },
      ],
    },
    {
      name: 'Fiscalitate',
      slug: 'fiscalitate',
      areas: [
        { name: 'Consultanță TVA',                                   slug: 'consultanta-tva' },
        { name: 'Taxare microîntreprinderi vs impozit pe profit',    slug: 'taxare-microintreprinderi-impozit-profit' },
        { name: 'Fiscalitate pentru PFA și profesii liberale',       slug: 'fiscalitate-pfa-profesii-liberale' },
        { name: 'Optimizare fiscală legală',                         slug: 'optimizare-fiscala-legala' },
        { name: 'Impozitare dividende',                              slug: 'impozitare-dividende' },
        { name: 'Taxare venituri internaționale',                    slug: 'taxare-venituri-internationale' },
        { name: 'Fiscalitate pentru eCommerce și SaaS',              slug: 'fiscalitate-ecommerce-saas' },
        { name: 'Declarații fiscale și obligații',                   slug: 'declaratii-fiscale-obligatii' },
        { name: 'Relația cu ANAF',                                   slug: 'relatia-cu-anaf' },
        { name: 'Consultanță controale fiscale',                     slug: 'consultanta-controale-fiscale' },
        { name: 'Tratament fiscal pentru beneficii salariale',       slug: 'tratament-fiscal-beneficii-salariale' },
      ],
    },
    {
      name: 'Resurse Umane',
      slug: 'resurse-umane',
      areas: [
        { name: 'Recrutare și selecție personal',             slug: 'recrutare-selectie-personal' },
        { name: 'Interviuri și evaluare candidați',           slug: 'interviuri-evaluare-candidati' },
        { name: 'Organizare departament HR',                  slug: 'organizare-departament-hr' },
        { name: 'Contracte de muncă și relații de muncă',    slug: 'contracte-munca-relatii-munca' },
        { name: 'Onboarding angajați',                        slug: 'onboarding-angajati' },
        { name: 'Evaluare performanță',                       slug: 'evaluare-performanta' },
        { name: 'Retenția angajaților',                       slug: 'retentia-angajatilor' },
        { name: 'Politici interne și regulament intern',      slug: 'politici-interne-regulament-intern' },
        { name: 'Salarizare și beneficii',                    slug: 'salarizare-beneficii' },
        { name: 'Management conflicte la locul de muncă',     slug: 'management-conflicte-munca' },
        { name: 'Cultura organizațională',                    slug: 'cultura-organizationala' },
        { name: 'HR pentru startup-uri și IMM-uri',           slug: 'hr-startup-imm' },
      ],
    },
    {
      name: 'Marketing și Vânzări',
      slug: 'marketing-vanzari',
      areas: [
        { name: 'Marketing Digital',       slug: 'marketing-digital' },
        { name: 'Social Media și Content', slug: 'social-media-content' },
        { name: 'Vânzări',                 slug: 'vanzari' },
      ],
    },
    {
      name: 'Tehnologie și IT',
      slug: 'tehnologie-it',
      areas: [
        { name: 'Dezvoltare Software', slug: 'dezvoltare-software' },
        { name: 'Web și eCommerce',    slug: 'web-ecommerce' },
        { name: 'IT & Infrastructură', slug: 'it-infrastructura' },
      ],
    },
    {
      name: 'Juridic',
      slug: 'juridic',
      areas: [
        { name: 'Drept Comercial',                    slug: 'drept-comercial' },
        { name: 'Dreptul Muncii',                     slug: 'dreptul-muncii' },
        { name: 'Proprietate Intelectuală și Online', slug: 'proprietate-intelectuala-online' },
      ],
    },
    {
      name: 'Consultanță în Fonduri și Finanțări',
      slug: 'consultanta-fonduri-finantari',
      areas: [
        { name: 'Fonduri Nerambursabile',  slug: 'fonduri-nerambursabile' },
        { name: 'Finanțări și Investiții', slug: 'finantari-investitii' },
        { name: 'Business și Strategie',   slug: 'business-strategie' },
      ],
    },
  ]

  // Upsert specialisations and their expertise areas
  const specMap = {}  // slug → Specialisation
  const areaMap = {}  // slug → ExpertiseCategory

  for (const spec of SPECIALISATIONS) {
    const s = await prisma.specialisation.upsert({
      where: { slug: spec.slug },
      update: { name: spec.name },
      create: { name: spec.name, slug: spec.slug },
    })
    specMap[spec.slug] = s

    for (const area of spec.areas) {
      const a = await prisma.expertiseCategory.upsert({
        where: { slug: area.slug },
        update: { name: area.name, specialisationId: s.id },
        create: { name: area.name, slug: area.slug, specialisationId: s.id },
      })
      areaMap[area.slug] = a
    }
  }

  console.log(`  ${SPECIALISATIONS.length} specialisations seeded`)

  // ── Consultant profiles ───────────────────────────────────────────────────
  const [profile1, profile2] = await Promise.all([
    prisma.consultantProfile.upsert({
      where: { userId: consultant1.id },
      update: {},
      create: {
        userId: consultant1.id,
        displayName: 'Lorem Ipsum',
        description: 'Consultant experimentat în contabilitate și fiscalitate, cu peste 12 ani de experiență în consultanță pentru IMM-uri și multinaționale.',
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
        description: 'Expert în fiscalitate cu experiență vastă în TVA, declarații fiscale și relația cu ANAF.',
        hourlyRate: 75,
        isActive: true,
        languages: ['en', 'ro'],
      },
    }),
  ])

  // Link seed profiles to specialisations (idempotent)
  const specLinks = [
    { profileId: profile1.id, specialisationId: specMap['contabilitate'].id },
    { profileId: profile1.id, specialisationId: specMap['fiscalitate'].id },
    { profileId: profile2.id, specialisationId: specMap['fiscalitate'].id },
  ]
  for (const link of specLinks) {
    await prisma.consultantProfileSpecialisation.upsert({
      where: { profileId_specialisationId: link },
      update: {},
      create: link,
    })
  }

  // Link seed profiles to expertise areas (idempotent via upsert on the @@id)
  const categoryLinks = [
    { profileId: profile1.id, categoryId: areaMap['interpretare-balanta-situatii-financiare'].id },
    { profileId: profile1.id, categoryId: areaMap['consultanta-tva'].id },
    { profileId: profile1.id, categoryId: areaMap['optimizare-fiscala-legala'].id },
    { profileId: profile2.id, categoryId: areaMap['consultanta-tva'].id },
    { profileId: profile2.id, categoryId: areaMap['declaratii-fiscale-obligatii'].id },
    { profileId: profile2.id, categoryId: areaMap['relatia-cu-anaf'].id },
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
    { consultantId: profile1.id, tag: 'balanta-verificare' },
    { consultantId: profile1.id, tag: 'optimizare-fiscala' },
    { consultantId: profile2.id, tag: 'tva-intracomunitar' },
    { consultantId: profile2.id, tag: 'declaratii-anaf' },
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
