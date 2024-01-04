const express = require('express')
const dotenv = require('dotenv')
const bodyParser = require('body-parser')
const binanceRoutes = require('./binanceFutureRoutes')
const binanceService = require('./binnaceFutureService')

setupEnvironment()
setupServices()

const app = express()
const PORT = process.env.PORT || 8881
app.use(bodyParser.json())
app.use('/binance', binanceRoutes)
app.listen(PORT, () => {
  console.log(`The server is running on port ${PORT}`)
})
setupServer()

function setupServices() {
  binanceService.createBinanceExchange()
}

function setupServer() {}

function setupEnvironment() {
  if (process.env.NODE_ENV === 'prod') {
    dotenv.config({ path: '.env.prod' })
  } else {
    dotenv.config({ path: '.env.dev' })
  }
}
