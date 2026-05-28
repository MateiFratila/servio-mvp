const { Router } = require('express')
const prisma = require('../db')

const router = Router()

// POST /api/feedbacks — Public endpoint to submit a contact or feedback form
router.post('/', async (req, res, next) => {
  try {
    const { name, email, type, message } = req.body

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Numele este obligatoriu' })
    }
    if (!email || typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({ error: 'Emailul este obligatoriu' })
    }
    if (!type || !['contact', 'feedback'].includes(type)) {
      return res.status(400).json({ error: 'Tipul este invalid' })
    }
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'Mesajul este obligatoriu' })
    }

    const feedback = await prisma.feedback.create({
      data: {
        name: name.trim(),
        email: email.trim(),
        type,
        message: message.trim(),
      },
    })

    res.status(201).json(feedback)
  } catch (err) {
    next(err)
  }
})

module.exports = router
