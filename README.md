# Soroswap Pro Trader - Advanced Trading Bot
<br>
<img src="/logo.png" alt="Soroswap Pro Trader" width="400"/><br> <br>
[![Next.js](https://img.shields.io/badge/Next.js-15.4.3-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Stellar SDK](https://img.shields.io/badge/Stellar%20SDK-13.3.0-yellow)](https://github.com/StellarCN/js-stellar-sdk)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

An advanced automated trading bot for Soroswap DEX on Stellar network with intelligent price tracking, grid trading capabilities, and comprehensive risk management features.

## 🌟 Features

### 🎯 Core Trading Features
- **Price-Based Auto Trading**: Automated buy/sell triggers based on customizable price conditions
- **Grid Trading Bot**: Advanced grid trading strategies with automatic position management
- **Multi-Token Support**: Trade across multiple Stellar assets (USDC, XLM, EURC, BTC, etc.)
- **Real-time Price Tracking**: Live price feeds from Soroswap DEX with CoinGecko fallback
- **Smart Order Execution**: Optimized order routing through multiple protocols

### 🛡️ Risk Management
- **Slippage Protection**: Configurable slippage tolerance (0.5% - 10%)
- **Price Impact Limits**: Maximum 5% price impact protection
- **Spam Protection**: 30-second cooldown between trades
- **Balance Validation**: Automatic wallet balance checks before trades
- **Error Recovery**: Robust error handling with automatic retries

### 🤖 Wallet Integration
- **Freighter Integration**: Seamless wallet connection with single-click approval
- **Automatic Balance Monitoring**: Real-time wallet balance tracking  
- **Smart Transaction Management**: Intelligent fee calculation and optimization
- **Multi-Asset Support**: Full support for all Stellar assets

### 📱 Telegram Integration
- **Real-time Notifications**: Instant alerts for trades and price movements
- **Trade Confirmations**: Detailed trade execution reports
- **Error Alerts**: Immediate notification of any trading issues
- **Test Messaging**: Built-in test functionality to verify setup

### 🔧 Advanced Configuration
- **Custom Trading Pairs**: Support for 15+ Stellar assets
- **Template Strategies**: Pre-configured trading templates
- **Historical Data**: Complete trade history and analytics
- **Local Storage**: Persistent settings and preferences

## 🎥 Live Demo
[![Soroswap Quote Trader - Live Trading Demo](https://img.youtube.com/vi/6m0Es4zb2MM/maxresdefault.jpg)](https://www.youtube.com/watch?v=6m0Es4zb2MM)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Freighter Wallet Extension
- Stellar account with XLM balance
- Telegram Bot Token (optional)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/murat48/soroswap-quote-traders.git
cd soroswap-quote-traders
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:
```env
# Soroswap API Configuration
NEXT_PUBLIC_SOROSWAP_API_HOST=https://api.soroswap.finance
NEXT_PUBLIC_SOROSWAP_API_KEY=your_api_key_here

# Stellar Network
NEXT_PUBLIC_STELLAR_NETWORK=Test SDF Network ; September 2015
NEXT_PUBLIC_STELLAR_HORIZON_URL=https://horizon.stellar.org

# Telegram (Optional)
NEXT_PUBLIC_TELEGRAM_BOT_TOKEN=your_bot_token_here
```

4. **Start the development server**
```bash
npm run dev
```

5. **Open your browser**
Navigate to [http://localhost:3000](http://localhost:3000)

## 📖 Usage Guide

### 1. Setup Wallet Connection
1. Install [Freighter Wallet](https://freighter.app/) extension
2. Connect your Stellar wallet
3. Ensure you have sufficient XLM balance

### 2. Configure Trading Strategy
1. Navigate to `/auto-trading` page
2. Select a trading pair (e.g., XLM/USDC)
3. Set buy and sell price triggers
4. Configure amounts and risk parameters
5. Apply pre-built templates or create custom strategies

### 3. Setup Telegram Notifications (Optional)
1. Create a Telegram bot via [@BotFather](https://t.me/botfather)
2. Get your Chat ID from [@userinfobot](https://t.me/userinfobot)
3. Enter credentials in the Telegram setup panel
4. Send a test message to verify configuration

### 4. Start Automated Trading
1. Review your triggers and settings
2. Click "Start Monitoring" to begin price tracking
3. Bot will execute trades automatically when conditions are met
4. Monitor progress via real-time dashboard and Telegram

### 5. Grid Trading Bot (Advanced)
1. Navigate to `/price` page
2. Set grid parameters (buy/sell levels, amounts)
3. Click "🤖 Automatic Grid Bot" to enable
4. Bot automatically manages multiple positions

## 🏗️ Architecture

### Tech Stack
- **Frontend**: Next.js 15.4.3 with TypeScript
- **Styling**: Tailwind CSS
- **Blockchain**: Stellar SDK 13.3.0
- **DEX Integration**: Soroswap API
- **State Management**: React Hooks + localStorage
- **Notifications**: Telegram Bot API

### Project Structure
```
src/
├── app/                    # Next.js App Router
│   ├── auto-trading/       # Automated trading interface
│   ├── price/              # Grid trading bot
│   └── api/                # API routes
├── components/             # React components
│   ├── price-tracker/      # Price tracking components
│   ├── trading/            # Trading interfaces
│   └── ui/                 # Reusable UI components
├── hooks/                  # Custom React hooks
├── lib/                    # Core libraries and utilities
│   ├── api.ts              # Soroswap API integration
│   ├── price-tracker.ts    # Price tracking logic
│   ├── telegram.ts         # Telegram bot integration
│   └── utils.ts            # Helper functions
└── types/                  # TypeScript type definitions
```

### Key Components

#### Price Tracker
- Real-time price feeds from Soroswap DEX
- Fallback to CoinGecko for reliability
- Custom alerts and notifications
- Historical price data

#### Trading Engine
- Automated trigger execution
- Order routing optimization
- Risk management integration
- Trade history logging

#### Wallet System
- Freighter wallet integration
- Balance monitoring and management
- Smart transaction optimization
- Multi-asset support

## 🔐 Security & Safety

### Built-in Protections
- **Maximum Price Impact**: 5% limit on all trades
- **Slippage Control**: Configurable tolerance levels
- **Balance Verification**: Pre-trade balance checks
- **Rate Limiting**: 30-second minimum between trades
- **Error Handling**: Comprehensive error recovery

### Best Practices
- Start with small amounts for testing
- Monitor bot performance regularly
- Keep sufficient XLM for transaction fees
- Use testnet for initial experimentation
- Regular backup of trading history

## 🛠️ Development

### Available Scripts
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

### Testing
```bash
# Test on Stellar Testnet first
NEXT_PUBLIC_STELLAR_NETWORK="Test SDF Network ; September 2015"

# Use small amounts for mainnet testing
# Monitor logs and Telegram notifications
```

### Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📊 Supported Assets

### Primary Trading Pairs
- **XLM/USDC**: Stellar Lumens / USD Coin
- **EURC/USDC**: Euro Coin / USD Coin  
- **XLM/EURC**: Stellar Lumens / Euro Coin
- **DOGSTAR/USDC**: Dogstar / USD Coin

### Additional Assets
- BTC, ETH, AQUA, XRP, ARST, CETES, and more
- Full list available in `src/lib/constants.ts`

## 🚨 Important Disclaimers

### ⚠️ Risk Warning
- **High Risk**: Automated trading involves substantial financial risk
- **No Guarantees**: Past performance does not guarantee future results
- **Market Volatility**: Crypto markets are highly volatile and unpredictable
- **Technical Risks**: Software bugs or network issues may cause losses

### 🧪 Development Status
This is a fully functional trading bot with the following capabilities:
- Complete Freighter wallet integration
- Real-time price tracking and automated trading
- Grid trading bot functionality
- Comprehensive risk management
- Telegram notifications

### 📋 Compliance
- This software is for educational and research purposes
- Users are responsible for compliance with local regulations
- Not financial advice - consult professionals before trading
- Ensure you understand all risks before using

## 📞 Support & Resources

### Documentation
- [Soroswap Documentation](https://docs.soroswap.finance/)
- [Stellar Development Guide](https://developers.stellar.org/)
- [Freighter Wallet Docs](https://docs.freighter.app/)

### Community
- [Stellar Discord](https://discord.gg/stellar)
- [Soroswap Community](https://discord.gg/soroswap)

### Issues & Support
- Report bugs via GitHub Issues
- Feature requests welcome
- Community support via Discord

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Soroswap Team** for DEX infrastructure
- **Stellar Development Foundation** for the Stellar network
- **Freighter Team** for wallet integration
- **Open Source Community** for tools and libraries

---

**⚠️ Disclaimer**: This is experimental software. Use at your own risk. Always test thoroughly with small amounts before scaling up your trading operations.
