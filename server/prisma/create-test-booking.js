/**
 * Create a past or future test booking for testing the review flow.
 *
 * Usage:
 *   node prisma/create-test-booking.js [past|future]
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const mode = process.argv[2] === 'future' ? 'future' : 'past'

async function main() {
  console.log(`Creating test booking in the ${mode.toUpperCase()}...`)

  // 1. Find the test client and consultant users
  const clientUser = await prisma.user.findUnique({
    where: { email: 'client@servio.dev' }
  })
  if (!clientUser) {
    throw new Error('Test client user "client@servio.dev" not found. Please run seed first.')
  }

  const consultantUser = await prisma.user.findFirst({
    where: { role: 'consultant', email: 'lorem@servio.dev' },
    include: { profile: true }
  })
  if (!consultantUser || !consultantUser.profile) {
    throw new Error('Test consultant user "lorem@servio.dev" with profile not found. Please run seed first.')
  }

  // 2. Define timestamps based on mode
  const startTime = new Date()
  if (mode === 'past') {
    // 1 hour ago
    startTime.setMinutes(startTime.getMinutes() - 60)
  } else {
    // 1 hour in the future
    startTime.setMinutes(startTime.getMinutes() + 60)
  }

  const endTime = new Date(startTime.getTime() + 30 * 60 * 1000) // 30 minutes duration

  // 3. Create unique availability slot
  const slot = await prisma.availabilitySlot.create({
    data: {
      consultantId: consultantUser.profile.id,
      startTime,
      endTime,
      isBooked: true,
    }
  })

  // 4. Create the Session associated with this slot
  const session = await prisma.session.create({
    data: {
      clientId: clientUser.id,
      consultantId: consultantUser.profile.id,
      slotId: slot.id,
      durationMinutes: 30,
      status: 'confirmed',
      notes: `[Test session] Created via CLI script in the ${mode}`,
      paymentStatus: 'paid',
      meetingUrl: `https://dummy-meeting-room-url/servio-session-test-${slot.id}`,
      dailyRoomName: `servio-session-test-${slot.id}`
    }
  })

  console.log('\nSuccess! Created the following test records:')
  console.log(`- Availability Slot ID: ${slot.id}`)
  console.log(`- Session ID:           ${session.id}`)
  console.log(`- Status:               ${session.status}`)
  console.log(`- Start Time:           ${startTime.toISOString()}`)
  console.log(`- End Time:             ${endTime.toISOString()}`)
  console.log(`\nTo test the review flow, do the following:`)
  console.log(`1. Log in as client: client@servio.dev / client1234`)
  console.log(`2. Navigate directly to dashboard sessions or to http://localhost:5173/sessions/${session.id}`)
  console.log(`3. Since the start time is in the past, you should see the "Lasă o Recenzie" / "Leave a Review" button!`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
