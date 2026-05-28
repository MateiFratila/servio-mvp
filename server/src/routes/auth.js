const { Router } = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const prisma = require('../db')
const { subscribeToList, LIST_IDS } = require('../emails')

const router = Router()

// Helper to set HTTP-only refresh token cookie
const setRefreshTokenCookie = (res, token) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/api/auth', // restrict scope to auth routes
  })
}

// Helper to manually parse cookies and extract refresh token
const getRefreshTokenFromHeaders = (req) => {
  const cookieHeader = req.headers.cookie
  if (!cookieHeader) return null
  const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
    const [key, ...valueParts] = cookie.trim().split('=')
    acc[key] = valueParts.join('=')
    return acc
  }, {})
  return cookies.refreshToken || null
}

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' })
    }

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const token = jwt.sign(
      { sub: user.id, email: user.email, role: user.role, type: 'access' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
    )

    const refreshToken = jwt.sign(
      { sub: user.id, type: 'refresh' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    setRefreshTokenCookie(res, refreshToken)

    res.json({
      token,
      user: { id: user.id, email: user.email, role: user.role },
    })
  } catch (err) {
    next(err)
  }
})

// POST /api/auth/register
router.post('/register', async (req, res, next) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' })
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists' })
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const user = await prisma.user.create({
      data: { email, passwordHash, role: 'client' },
    })

    const token = jwt.sign(
      { sub: user.id, email: user.email, role: user.role, type: 'access' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
    )

    const refreshToken = jwt.sign(
      { sub: user.id, type: 'refresh' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    setRefreshTokenCookie(res, refreshToken)

    // Fire-and-forget: add to Brevo client list
    subscribeToList(user.email, LIST_IDS.CLIENTS).catch(err =>
      console.error('[brevo] subscribeToList (client) failed:', err.message)
    )

    res.status(201).json({
      token,
      user: { id: user.id, email: user.email, role: user.role },
    })
  } catch (err) {
    next(err)
  }
})

// POST /api/auth/register/consultant
router.post('/register/consultant', async (req, res, next) => {
  try {
    const { email, password, phone } = req.body
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' })
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists' })
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        phone: phone || null,
        role: 'consultant',
        profile: {
          create: {
            displayName: email.split('@')[0],
            hourlyRate: 0,
            isActive: false,
          },
        },
      },
    })

    // Fire-and-forget: add to Brevo consultant list
    subscribeToList(user.email, LIST_IDS.CONSULTANTS).catch(err =>
      console.error('[brevo] subscribeToList (consultant) failed:', err.message)
    )

    res.status(201).json({
      message: 'Cererea ta a fost înregistrată. Echipa noastră o va revizui și te vom contacta în curând.',
      user: { id: user.id, email: user.email, role: user.role },
    })
  } catch (err) {
    next(err)
  }
})

// POST /api/auth/refresh
router.post('/refresh', async (req, res, next) => {
  try {
    const refreshToken = getRefreshTokenFromHeaders(req)
    if (!refreshToken) {
      return res.status(401).json({ error: 'No refresh token provided' })
    }

    let decoded
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_SECRET)
    } catch (err) {
      return res.status(401).json({ error: 'Invalid or expired refresh token' })
    }

    if (decoded.type !== 'refresh') {
      return res.status(401).json({ error: 'Invalid token type' })
    }

    const user = await prisma.user.findUnique({ where: { id: decoded.sub } })
    if (!user) {
      return res.status(401).json({ error: 'User does not exist' })
    }

    const token = jwt.sign(
      { sub: user.id, email: user.email, role: user.role, type: 'access' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
    )

    const newRefreshToken = jwt.sign(
      { sub: user.id, type: 'refresh' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    setRefreshTokenCookie(res, newRefreshToken)

    res.json({
      token,
      user: { id: user.id, email: user.email, role: user.role },
    })
  } catch (err) {
    next(err)
  }
})

// POST /api/auth/logout - clear the http-only refresh cookie
router.post('/logout', (_req, res) => {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    path: '/api/auth',
  })
  res.status(204).end()
})

module.exports = router
