if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') })
}
const app = require('./app')

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log(`[server] running on port ${PORT} (${process.env.NODE_ENV || 'development'})`)
})
