export interface Token {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logo?: string;
  currentPrice?: number;
  priceChange24h?: number;
  volume24h?: number;
  marketCap?: number;
}

export interface TradingPair {
  baseToken: Token;
  quoteToken: Token;
  pair: string; // "XLM/USDC"
  currentPrice: number;
  priceChange24h: number;
  volume24h: number;
  liquidity: number;
}

export interface MultiTokenOrder {
  id: string;
  type: 'BUY' | 'SELL';
  baseToken: Token;
  quoteToken: Token;
  amount: string;
  price: number;
  total: string;
  strategy: 'LIMIT' | 'MARKET' | 'STOP_LOSS' | 'TAKE_PROFIT' | 'DCA';
  status: 'PENDING' | 'EXECUTED' | 'FAILED' | 'CANCELLED';
  createdAt: Date;
  executedAt?: Date;
  transactionHash?: string;
  error?: string;
}

export interface Portfolio {
  tokens: PortfolioToken[];
  totalValueUSD: number;
  totalChangeUSD: number;
  totalChange24h: number;
}

export interface PortfolioToken {
  token: Token;
  balance: string;
  valueUSD: number;
  change24h: number;
  allocation: number; // %
}

export interface TradingStrategy {
  id: string;
  name: string;
  enabled: boolean;
  pairs: string[]; // ["XLM/USDC", "EURC/USDC"]
  conditions: StrategyCondition[];
  riskSettings: RiskSettings;
}
export interface RiskSettings {
  maxOrderAmount: string; // Maksimum emir miktarı
  dailyLimit: string; // Günlük limit
  stopLossPercentage: number; // %5 zarar durumunda sat
  takeProfitPercentage: number; // %10 kar durumunda sat
  maxActiveOrders: number;
}
export interface StrategyCondition {
  type: 'PRICE_ABOVE' | 'PRICE_BELOW' | 'VOLUME_SPIKE' | 'SPREAD_WIDE' | 'RSI_OVERSOLD';
  pair: string;
  value: number;
  action: 'BUY' | 'SELL';
  amount: string;
}