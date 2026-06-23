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
      update: { phone: '+40722123456', isEmailConfirmed: true },
      create: {
        email: 'lorem@servio.dev',
        passwordHash: await bcrypt.hash('consultant1234', 12),
        phone: '+40722123456',
        role: 'consultant',
        isEmailConfirmed: true,
      },
    }),
    prisma.user.upsert({
      where: { email: 'dolor@servio.dev' },
      update: { phone: '+40733987654' },
      create: {
        email: 'dolor@servio.dev',
        passwordHash: await bcrypt.hash('consultant1234', 12),
        role: 'consultant',
        phone: '+40733987654',
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
      update: {
        stripeOnboardingComplete: true,
        slug: 'lorem-ipsum',
      },
      create: {
        userId: consultant1.id,
        displayName: 'Lorem Ipsum',
        slug: 'lorem-ipsum',
        description: 'Consultant experimentat în contabilitate și fiscalitate, cu peste 12 ani de experiență în consultanță pentru IMM-uri și multinaționale.',
        hourlyRate: 90,
        isActive: true,
        languages: ['en', 'ro'],
        stripeOnboardingComplete: true,
        avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
      },
    }),
    prisma.consultantProfile.upsert({
      where: { userId: consultant2.id },
      update: {
        slug: 'dolor-sit',
      },
      create: {
        userId: consultant2.id,
        displayName: 'Dolor Sit',
        slug: 'dolor-sit',
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
  const slotTimes = [9, 9.5, 10, 10.5, 11, 11.5, 12, 12.5, 13, 13.5, 14, 14.5, 15, 15.5, 16, 16.5, 17, 17.5] // hours (30m slots, back-to-back)
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
        end.setMinutes(end.getMinutes() + 30)
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

  // Seed default system settings for legal documents if they don't exist yet
  const defaultLegalDocs = [
    { key: 'legal_terms', value: '<h2>Termeni și Condiții</h2><p>Bine ați venit pe Servio. Utilizând serviciile noastre, sunteți de acord cu acești termeni.</p>' },
    { key: 'legal_privacy', value: '<h2>Politica de Confidențialitate (GDPR)</h2><p>Protecția datelor dumneavoastră este importantă pentru noi. Vă rugăm să citiți detaliile de mai jos.</p>' },
    { key: 'legal_cookies', value: '<h2>Politica de Cookies</h2><p>Utilizăm cookies pentru a asigura o funcționare optimă a paginii web.</p>' },
  ]
  for (const doc of defaultLegalDocs) {
    await prisma.systemSetting.upsert({
      where: { key: doc.key },
      update: {},
      create: doc,
    })
  }

  // ── Seed 35 Private Reviews for testing ─────────────────────────────────
  console.log('  Seeding 35 dummy private reviews…')

  // Cleanup past seed reviews
  await prisma.review.deleteMany({
    where: {
      privateNotes: {
        contains: '[Seed]',
      },
    },
  })

  // Delete past sessions/slots associated with Seed reviews
  await prisma.session.deleteMany({
    where: {
      notes: {
        contains: '[Seed session]',
      },
    },
  })

  await prisma.availabilitySlot.deleteMany({
    where: {
      endTime: {
        lt: new Date(),
      },
      isBooked: true,
    },
  })

  const reviewComments = [
    "Interfața este foarte curată și rapidă. Mi-ar plăcea și o aplicație mobilă nativă pe viitor.",
    "Totul a decurs perfect, consultanta a fost extrem de la obiect și am salvat mult timp.",
    "Procesul de plată prin Stripe a dat o mică eroare prima dată, dar la reîncercare a mers.",
    "Serviciul clienți a fost de ajutor când am avut o întrebare despre facturare.",
    "Platforma Servio m-a ajutat să găsesc specialistul potrivit în mai puțin de 10 minute pentru problema mea de TVA.",
    "Foarte utilă opțiunea de ping-pong pentru documente înainte de ședință.",
    "Sunetul și imaginea s-au auzit impecabil. Daily.co funcționează de minune.",
    "Aș fi vrut să pot plăti și prin transfer bancar direct, în rest totul este super ok.",
    "Un instrument excelent pentru consultanță. Simplu de utilizat de pe laptop.",
    "Apreciez atenția la detalii în design-ul platformei. Nimic de reproșat.",
    "Consultantul a întârziat 5 minute, dar platforma ne-a permis să prelungim ședința automat.",
    "Super mulțumit de claritatea apelului video. Recomand SERVIO cu încredere.",
  ]

  const romanianPlaceholderReviews = []
  for (let i = 1; i <= 35; i++) {
    const rComment = reviewComments[i % reviewComments.length]
    romanianPlaceholderReviews.push({
      rating: (i % 5) + 1, // stars 1 to 5
      testimonial: `Am avut o discuție utilă și productivă. Recomand cu încredere! (Recenzie publică #${i})`,
      displayName: i % 3 === 0 ? null : `Utilizator de test #${i}`,
      privateNotes: `[Seed] Feedback privat platformă #${i}: ${rComment}`,
      daysAgo: i,
    })
  }

  for (const item of romanianPlaceholderReviews) {
    const slotTimeStart = new Date()
    slotTimeStart.setDate(slotTimeStart.getDate() - item.daysAgo)
    slotTimeStart.setHours(10, 0, 0, 0)

    const slotTimeEnd = new Date(slotTimeStart)
    slotTimeEnd.setMinutes(30)

    const consultantId = item.daysAgo % 2 === 0 ? profile1.id : profile2.id

    const slot = await prisma.availabilitySlot.create({
      data: {
        consultantId,
        startTime: slotTimeStart,
        endTime: slotTimeEnd,
        isBooked: true,
      },
    })

    const session = await prisma.session.create({
      data: {
        clientId: client1.id,
        consultantId,
        slotId: slot.id,
        status: 'completed',
        notes: `[Seed session] Sesiune de test pentru review #${item.daysAgo}`,
        paymentStatus: 'paid',
        createdAt: slotTimeStart,
      },
    })

    await prisma.review.create({
      data: {
        sessionId: session.id,
        clientId: client1.id,
        consultantId,
        rating: item.rating,
        testimonial: item.testimonial,
        displayName: item.displayName,
        privateNotes: item.privateNotes,
        createdAt: slotTimeStart,
      },
    })
  }

  console.log('  35 private reviews successfully seeded.')

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
