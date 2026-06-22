const prisma = require('../db');

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

async function generateUniqueSlug(displayName, consultantId = null, tx = prisma) {
  const baseSlug = slugify(displayName) || 'consultant';
  let slug = baseSlug;
  let count = 1;
  while (true) {
    const existing = await tx.consultantProfile.findFirst({
      where: {
        slug,
        ...(consultantId ? { id: { not: consultantId } } : {}),
      },
    });
    if (!existing) {
      break;
    }
    slug = `${baseSlug}-${count}`;
    count++;
  }
  return slug;
}

module.exports = {
  slugify,
  generateUniqueSlug,
};
