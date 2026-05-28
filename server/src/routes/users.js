const { Router } = require('express')
const bcrypt = require('bcryptjs')
const prisma = require('../db')
const { authenticate, authorize } = require('../middleware/authenticate')

const router = Router()

// All /api/users routes require a valid JWT
router.use(authenticate)

const USER_SELECT = { id: true, email: true, role: true, createdAt: true }

// GET /api/users — admin: list all users
router.get('/', authorize('admin'), async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: USER_SELECT,
      orderBy: { createdAt: 'asc' },
    })
    res.json(users)
  } catch (err) {
    next(err)
  }
})

// GET /api/users/me
router.get('/me', async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        profile: {
          select: {
            id: true,
            displayName: true,
            specialisations: {
              select: { specialisation: { select: { id: true, name: true, slug: true } } },
            },
            hourlyRate: true,
            avatarUrl: true,
            isActive: true,
          },
        },
      },
    })
    if (!user) return res.status(404).json({ error: 'User not found' })
    res.json(user)
  } catch (err) {
    next(err)
  }
})

// PATCH /api/users/me — update email or password
router.patch('/me', async (req, res, next) => {
  try {
    const { email, password } = req.body
    const data = {}

    if (email) data.email = email
    if (password) data.passwordHash = await bcrypt.hash(password, 12)

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: 'Nothing to update' })
    }

    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data,
      select: { id: true, email: true, role: true },
    })
    res.json(updated)
  } catch (err) {
    next(err)
  }
})

// DELETE /api/users/me — delete own account
router.delete('/me', async (req, res, next) => {
  try {
    await prisma.user.delete({ where: { id: req.user.id } })
    res.status(204).end()
  } catch (err) {
    next(err)
  }
})

// PATCH /api/users/:id — admin: change role
router.patch('/:id', authorize('admin'), async (req, res, next) => {
  try {
    const id = parseInt(req.params.id)
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' })

    const { role } = req.body
    const VALID_ROLES = ['client', 'consultant', 'admin']
    if (!role || !VALID_ROLES.includes(role)) {
      return res.status(400).json({ error: `role must be one of: ${VALID_ROLES.join(', ')}` })
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { role },
      select: USER_SELECT,
    })
    res.json(updated)
  } catch (err) {
    next(err)
  }
})

module.exports = router
