const { Router } = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const prisma = require('../db')
const { subscribeToList, LIST_IDS, sendForgotPasswordEmail, sendConsultantActivationEmail } = require('../emails')

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
    if (!email || !password || !phone || typeof phone !== 'string' || !phone.trim()) {
      return res.status(400).json({ error: 'Email, password, and phone number are required' })
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists' })
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const crypto = require('crypto')
    const emailConfirmationToken = crypto.randomBytes(32).toString('hex')

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        phone: phone.trim(),
        role: 'consultant',
        isEmailConfirmed: false,
        emailConfirmationToken,
        profile: {
          create: {
            displayName: email.split('@')[0],
            hourlyRate: 0,
            isActive: false,
          },
        },
      },
    })

    // Generate login tokens for automatic login
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

    // Send Activation email with guides link
    const origin = req.headers.origin || `${req.protocol}://${req.get('host')}`
    const activationUrl = `${origin}/confirmare-email?token=${emailConfirmationToken}`
    const guidesUrl = `${origin}/ghiduri-consultant`
    const recipientName = email.split('@')[0]

    sendConsultantActivationEmail({
      recipientEmail: user.email,
      recipientName,
      activationUrl,
      guidesUrl,
    }).catch(err =>
      console.error('[brevo] sendConsultantActivationEmail failed:', err.message)
    )

    // Fire-and-forget: add to Brevo consultant list
    subscribeToList(user.email, LIST_IDS.CONSULTANTS).catch(err =>
      console.error('[brevo] subscribeToList (consultant) failed:', err.message)
    )

    res.status(201).json({
      message: 'Un email de confirmare a fost trimis!',
      token,
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

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = req.body
    if (!email) {
      return res.status(400).json({ error: 'email is required' })
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { profile: true },
    })

    if (!user) {
      // Return 200 to prevent email enumeration
      return res.json({ message: 'Dacă această adresă de email există în sistem, un link de resetare a fost trimis.' })
    }

    const crypto = require('crypto')
    const token = crypto.randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + 3600000) // 1 hour token validity

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: token,
        resetPasswordExpires: expires,
      },
    })

    const origin = req.headers.origin || `${req.protocol}://${req.get('host')}`
    const resetUrl = `${origin}/reset-password?token=${token}`
    const recipientName = user.profile?.displayName || user.email.split('@')[0]

    try {
      await sendForgotPasswordEmail({
        recipientEmail: user.email,
        recipientName,
        resetUrl,
      })
    } catch (err) {
      console.error('[brevo] sendForgotPasswordEmail failed:', err.message)
    }

    res.json({ message: 'Dacă această adresă de email există în sistem, un link de resetare a fost trimis.' })
  } catch (err) {
    next(err)
  }
})

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res, next) => {
  try {
    const { token, password } = req.body
    if (!token || !password) {
      return res.status(400).json({ error: 'Tokenul și parola sunt obligatorii' })
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Parola trebuie să aibă cel puțin 8 caractere' })
    }

    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: {
          gt: new Date(),
        },
      },
    })

    if (!user) {
      return res.status(400).json({ error: 'Link-ul de resetare este invalid sau a expirat.' })
    }

    const passwordHash = await bcrypt.hash(password, 12)

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    })

    res.json({ message: 'Parola a fost resetată cu succes!' })
  } catch (err) {
    next(err)
  }
})

// POST /api/auth/confirm-email
router.post('/confirm-email', async (req, res, next) => {
  try {
    const { token } = req.body
    if (!token) {
      return res.status(400).json({ error: 'Tokenul este obligatoriu.' })
    }

    const user = await prisma.user.findFirst({
      where: { emailConfirmationToken: token }
    })

    if (!user) {
      return res.status(440).json({ error: 'Token-ul de confirmare este invalid sau a expirat.' })
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailConfirmed: true,
        emailConfirmationToken: null,
      }
    })

    res.json({ message: 'Emailul a fost confirmat cu succes!' })
  } catch (err) {
    next(err)
  }
})

module.exports = router
