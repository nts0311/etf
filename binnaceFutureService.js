const ccxt = require('ccxt')

let exchange = null

function createBinanceExchange() {
  const options = {
    apiKey: process.env.BINANCE_API_KEY,
    secret: process.env.BINANCE_API_SECRET,
    enableRateLimit: true,
    options: {
      defaultType: 'future', // Set the default type to 'future'
    },
  }

  exchange = new ccxt.binance(options)

  if (process.env.NODE_ENV !== 'prod') {
    exchange.setSandboxMode(true)
  }
}

async function getCurrentPrice(symbol) {
  try {
    const ticker = await exchange.fetchTicker(symbol)
    return ticker.last
  } catch (error) {
    console.error(`Error fetching current price of ${symbol} :`, error.message)
  }
}

function calculateTargetAndStopLossPricesForLong(
  currentPrice,
  takeProfitPercentage,
  stopLossPercentage
) {
  const targetPrice = currentPrice * (1 + takeProfitPercentage / 100)
  const stopLossPrice = currentPrice * (1 + stopLossPercentage / 100)
  return { targetPrice, stopLossPrice }
}

async function openLongPosition(orderInfo) {
  try {
    console.log('placing long order:')
    console.log(orderInfo)

    const {
      symbol,
      leverage,
      usdtAmount,
      takeProfitPercentage,
      stopLossPercentage,
    } = orderInfo

    await exchange.fapiPrivatePostLeverage({
      symbol: symbol,
      leverage: leverage,
    })

    let currentPrice = await getCurrentPrice(symbol)
    const maxQuantityUSDT = usdtAmount * leverage

    // Calculate the order size in BTC
    const orderSizeBTC = maxQuantityUSDT / currentPrice

    console.log(`order size: ${orderSizeBTC}`)

    // Place a market order
    const order = await exchange.createMarketOrder(
      symbol,
      'buy',
      orderSizeBTC,
      {
        leverage: leverage,
      }
    )

    console.log('Long position opened successfully')

    // Calculate target price for take profit and stop-loss price
    currentPrice = await getCurrentPrice(symbol)

    const { targetPrice, stopLossPrice } =
      calculateTargetAndStopLossPricesForLong(
        currentPrice,
        takeProfitPercentage,
        stopLossPercentage
      )

    console.log('TP/SL:')
    console.log({ targetPrice, stopLossPrice })

    //Create a market sell order with type 'TAKE_PROFIT_MARKET' for take profit
    const takeProfitOrder = await exchange.createMarketSellOrder(
      symbol,
      orderSizeBTC,
      {
        takeProfitPrice: targetPrice,
        type: 'TAKE_PROFIT_MARKET',
      }
    )

    console.log('Take profit market order placed successfully')

    // Create a market sell order with type 'STOP_MARKET' for stop loss
    const stopLossOrder = await exchange.createMarketSellOrder(
      symbol,
      orderSizeBTC,
      {
        stopPrice: stopLossPrice,
        type: 'STOP_MARKET',
      }
    )

    console.log('Stop-loss order placed successfully')

    return { order, takeProfitOrder, stopLossOrder }
  } catch (error) {
    if (error instanceof ccxt.NetworkError) {
      console.error('Network error:', error.message)
    } else if (error instanceof ccxt.ExchangeError) {
      console.error('Exchange error:', error.message)
    } else {
      console.error('Error:', error.message)
    }
  }
}

function calculateTargetAndStopLossPricesForShort(
  currentPrice,
  takeProfitPercentage,
  stopLossPercentage
) {
  const targetPrice = currentPrice * (1 - takeProfitPercentage / 100)
  const stopLossPrice = currentPrice * (1 - stopLossPercentage / 100)
  return { targetPrice, stopLossPrice }
}

async function openShortPosition(orderInfo) {
  try {
    console.log('placing short order:')
    console.log(orderInfo)

    const {
      symbol,
      leverage,
      usdtAmount,
      takeProfitPercentage,
      stopLossPercentage,
    } = orderInfo

    await exchange.fapiPrivatePostLeverage({
      symbol: symbol,
      leverage: leverage,
    })

    // Fetch current market price
    let currentPrice = await getCurrentPrice(symbol)

    // Calculate the maximum quantity using leverage in USDT
    const maxQuantityUSDT = usdtAmount * leverage

    // Calculate the order size in BTC
    const orderSizeBTC = maxQuantityUSDT / currentPrice

    console.log(`order size: ${orderSizeBTC}`)

    // Place a market order to open a short position
    const order = await exchange.createMarketOrder(
      symbol,
      'sell',
      orderSizeBTC,
      {
        leverage: leverage,
      }
    )

    console.log('Short position opened successfully')

    // Calculate target price for take profit and stop-loss price
    currentPrice = await getCurrentPrice(symbol)
    const { targetPrice, stopLossPrice } =
      calculateTargetAndStopLossPricesForShort(
        currentPrice,
        takeProfitPercentage,
        stopLossPercentage
      )

    console.log('TP/SL:')
    console.log({ targetPrice, stopLossPrice })

    // Simulate a take profit by placing a conditional market order when the price reaches the target level
    const takeProfitOrder = await exchange.createMarketBuyOrder(
      symbol,
      orderSizeBTC,
      {
        takeProfitPrice: targetPrice,
        type: 'TAKE_PROFIT_MARKET',
      }
    )

    console.log('Take profit order placed successfully:')

    // Simulate a stop-loss by placing a conditional market order when the price reaches the stop-loss level
    const stopLossOrder = await exchange.createMarketBuyOrder(
      symbol,
      orderSizeBTC,
      {
        stopPrice: stopLossPrice,
        type: 'STOP_MARKET',
      }
    )

    console.log('Stop-loss order placed successfully:')

    return { order, takeProfitOrder, stopLossOrder }
  } catch (error) {
    if (error instanceof ccxt.NetworkError) {
      console.error('Network error:', error.message)
    } else if (error instanceof ccxt.ExchangeError) {
      console.error('Exchange error:', error.message)
    } else {
      console.error('Error:', error.message)
    }
  }
}

module.exports = {
  createBinanceExchange,
  openLongPosition,
  openShortPosition,
}
