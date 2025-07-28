export const AVAILABLE_SYMBOLS = [
  'BTCUSDT',
  'ETHUSDT',
  'ADAUSDT',
  'DOTUSDT',
  'LINKUSDT'
] as const

export const DEFAULT_SYMBOL = 'BTCUSDT' as const

export const ASSET_INFO = {
  BTCUSDT: { name: 'Bitcoin', symbol: 'BTC' },
  ETHUSDT: { name: 'Ethereum', symbol: 'ETH' },
  ADAUSDT: { name: 'Cardano', symbol: 'ADA' },
  DOTUSDT: { name: 'Polkadot', symbol: 'DOT' },
  LINKUSDT: { name: 'Chainlink', symbol: 'LINK' }
} as const

export const API_CONFIG = {
  BASE_URL: 'https://api.binance.com/api/v3',
  WS_URL: 'wss://stream.binance.com:9443',
  DEFAULT_LIMIT: 100,
  TIMEOUT: 15000,

  DATA_LIMITS: {
    DAILY: 1500,
    WEEKLY: 200,
    MONTHLY: 24
  }
} as const

export const VOLATILITY_THRESHOLDS = {
  LOW: 5,
  MEDIUM: 10
} as const
