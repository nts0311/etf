const express = require('express')
const binanceService = require('./binnaceFutureService')

const Router = express.Router()

Router.post('/long', async (req, res) => {
  try {
    const orderInfo = req.body
    const orderResults = await binanceService.openLongPosition(orderInfo)

    if (orderResults != null) {
      res.json({
        success: true,
        order: orderResults.order,
        takeProfitOrder: orderResults.takeProfitOrder,
        stoplossOrder: orderResults.stopLossOrder,
      })
    } else {
      res.json({
        success: false,
        message: 'Error while opening posistion',
      })
    }
  } catch (error) {
    console.log('Binace future - open long error')
    console.log(error.message)
  }
})

Router.post('/short', async (req, res) => {
  try {
    const orderInfo = req.body
    const orderResults = await binanceService.openShortPosition(orderInfo)

    if (orderResults != null) {
      res.json({
        success: true,
        order: orderResults.order,
        takeProfitOrder: orderResults.takeProfitOrder,
        stoplossOrder: orderResults.stopLossOrder,
      })
    } else {
      res.json({
        success: false,
        message: 'Error while opening posistion',
      })
    }
  } catch (error) {
    console.log('Binace future - open short error')
    console.log(error.message)
  }
})

Router.get('/ping', async (req, res) => {
  res.json({ success: true, message: 'Hello from server' })
})

module.exports = Router
