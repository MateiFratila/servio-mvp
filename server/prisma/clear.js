/**
 * Clears all transactional test data from the database.
 *
 * Safe to run repeatedly. Deletes in FK-safe order:
 *   sessions → availability_slots → consultant_profiles → users (non-admin)
 *
 * System settings are left intact by default.
 * Pass --all to also wipe system_settings and the admin user.
 *
 * Usage:
 *   npm run db:clear           # clear test data, keep admin + system settings
 *   npm run db:clear -- --all  # wipe everything
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()
const wipeAll = process.argv.includes('--all')

async function main() {
  console.log(`Clearing ${wipeAll ? 'ALL' : 'test'} data…`)

  // Delete in FK-safe order
  const deletedSessions = await prisma.session.deleteMany()
  const deletedSlots = await prisma.availabilitySlot.deleteMany()
  const deletedProfiles = await prisma.consultantProfile.deleteMany()
  const deletedUsers = wipeAll
    ? await prisma.user.deleteMany()
    : await prisma.user.deleteMany({ where: { role: { not: 'admin' } } })

  if (wipeAll) {
    await prisma.systemSetting.deleteMany()
    console.log('  system_settings cleared')
  }

  console.log(`  sessions             deleted: ${deletedSessions.count}`)
  console.log(`  availability_slots   deleted: ${deletedSlots.count}`)
  console.log(`  consultant_profiles  deleted: ${deletedProfiles.count}`)
  console.log(`  users                deleted: ${deletedUsers.count}`)
  console.log('Done.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
