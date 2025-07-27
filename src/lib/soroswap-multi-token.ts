// import { Token, TradingPair } from '@/types/multi-token-trading';
// import { soroswapAPI } from './api';

// export class SoroswapMultiTokenAPI {
//   private tokens: Token[] = [];
//   private pairs: TradingPair[] = [];
//   private priceCache: Map<string, number> = new Map();

//   // Desteklenen tokenları yükle
//   async loadSupportedTokens(): Promise<Token[]> {
//     try {
//       // Soroswap'tan token listesini al
//       const response = await fetch('https://api.soroswap.finance/asset-list');
//       const data = await response.json();
      
//       // eslint-disable-next-line @typescript-eslint/no-explicit-any
//       this.tokens = data.tokens?.map((token: any) => ({
//         address: token.address,
//         symbol: token.symbol,
//         name: token.name || token.symbol,
//         decimals: token.decimals || 7,
//         logo: token.logoURI
//       })) || [];

//       // TESTNET tokenları (gerçek testnet verilerinizden)
//       const testnetTokens: Token[] = [
//         {
//           address: 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC',
//           symbol: 'XLM',
//           name: 'Stellar Lumens',
//           decimals: 7,
//           logo: 'https://assets.coingecko.com/coins/images/100/standard/Stellar_symbol_black_RGB.png'
//         },
//         {
//           address: 'CBBHRKEP5M3NUDRISGLJKGHDHX3DA2CN2AZBQY6WLVUJ7VNLGSKBDUCM',
//           symbol: 'USDC',
//           name: 'USDCoin',
//           decimals: 7,
//           logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png'
//         },
//         {
//           address: 'CA34FYW2SL7VZW5E6WIPA2NOTLGG7TNAOKQLEO5YZHVUGNRFHM4HJ7WD',
//           symbol: 'EURC',
//           name: 'EURoCoin',
//           decimals: 7,
//           logo: 'https://static.ultrastellar.com/media/assets/img/f8b00dbf-64b3-488f-bcd2-354f29e2cdc8.png'
//         },
//         {
//           address: 'CDYZ6I4FTABFDVWIH2RSVDVIFSJF7FMA2CTUBFHWCLPSLIGO55K4HNSN',
//           symbol: 'XTAR',
//           name: 'Dogstar',
//           decimals: 7,
//           logo: 'https://www.dogstarcoin.com/assets/img/dogstarcoin-logo.png'
//         },
//         {
//           address: 'CCPOB5HBFV2MGDFHR2QOFW3Y2JS7DQVJMWL7YESGSGH4AGQWVCJIPCKE',
//           symbol: 'XRP',
//           name: 'Ripple',
//           decimals: 7,
//           logo: 'https://static.ultrastellar.com/media/assets/img/4ab58d77-b70f-4a6c-9944-6f273d549cd5.png'
//         },
//         {
//           address: 'CAVCOKZ5XZ5GONIP2M7QJARHZMELBVPZXVTZU5AJEJTOLNWAT5R43LPO',
//           symbol: 'ARST',
//           name: 'ArgentinePeso',
//           decimals: 7,
//           logo: 'https://static.ultrastellar.com/media/assets/img/648754b5-f91d-46c4-97f9-557642976a75.png'
//         },
//         {
//           address: 'CCXQWO33QBEUDVTWDDOYLD2SYEJSWUM6DIJUX6NDAOSXNCGK3PSIWQJG',
//           symbol: 'AQUA',
//           name: 'Aquarius',
//           decimals: 7,
//           logo: 'https://static.ultrastellar.com/media/assets/img/1878ee2d-2fd1-4e31-89a7-5a430f1596f8.png'
//         },
//         {
//           address: 'CAD23PIPKXXRLZ54VKAW7IGOOM4FFW6WFZZM2XPD5VC6Q4BA3FN4F32F',
//           symbol: 'BTC',
//           name: 'Bitcoin',
//           decimals: 7,
//           logo: 'https://static.ultrastellar.com/media/assets/img/c3380651-52e5-4054-9121-a438c60a1ec4.png'
//         },
//         {
//           address: 'CCS2TOJEO7QIWJOM7C6PZ2AKLNDP2UJQIVKGUE6KFS5ULRCN6G7GHITY',
//           symbol: 'BRL',
//           name: 'BrazilianReal',
//           decimals: 7,
//           logo: 'https://static.ultrastellar.com/media/assets/img/03e2b3a2-f310-4426-8ff1-ec960b033195.png'
//         },
//         {
//           address: 'CBSC4KEC3ZFSV33LLDUBISDIO6AWWOETQOFXFVUNESZJIL47N6SDFBQP',
//           symbol: 'WUNP',
//           name: 'wunpyr',
//           decimals: 7
//         },
//         {
//           address: 'CC5BEKXQJRY7TUD5TBQT7UBOAXU7DKCKXR7BSPFO23OHFABNJCE27UZ4',
//           symbol: 'WUNT',
//           name: 'wuntro',
//           decimals: 7
//         },
//         {
//           address: 'CA34VPNNRRVH5FMFVXWMQVEDMTOMLZESEZ5LE4724OSBHFB5HIRRHQ7G',
//           symbol: 'PYRZ',
//           name: 'pyrzim',
//           decimals: 7
//         },
//         {
//           address: 'CDHNUGDN5ODFN25ADDSDQIOJPQSHFLH3IBFEVMMPYNQKG5Y2UZ5MV4ZW',
//           symbol: 'NYLF',
//           name: 'nylfyx',
//           decimals: 7
//         }
//       ];

//       // Mevcut tokenları güncelle veya yeni olanları ekle
//       testnetTokens.forEach(testnetToken => {
//         const existingIndex = this.tokens.findIndex(t => t.address === testnetToken.address);
//         if (existingIndex !== -1) {
//           this.tokens[existingIndex] = { ...this.tokens[existingIndex], ...testnetToken };
//         } else {
//           this.tokens.push(testnetToken);
//         }
//       });

//       console.log(`📊 ${this.tokens.length} token yüklendi`);
//       return this.tokens;

//     } catch (error) {
//       console.error('Token listesi yükleme hatası:', error);
//       return this.tokens;
//     }
//   }

//   // Trading pairs oluştur
//   generateTradingPairs(): TradingPair[] {
//     const baseTokens = this.tokens.filter(t => ['USDC', 'XLM', 'EURC', 'BTC'].includes(t.symbol));
//     const pairs: TradingPair[] = [];

//     this.tokens.forEach(token => {
//       baseTokens.forEach(baseToken => {
//         if (token.address !== baseToken.address) {
//           pairs.push({
//             baseToken: token,
//             quoteToken: baseToken,
//             pair: `${token.symbol}/${baseToken.symbol}`,
//             currentPrice: 0,
//             priceChange24h: 0,
//             volume24h: 0,
//             liquidity: 0
//           });
//         }
//       });
//     });

//     this.pairs = pairs;
//     console.log(`💱 ${pairs.length} trading pair oluşturuldu`);
//     return pairs;
//   }

//   // Token fiyatını al
//   async getTokenPrice(tokenA: Token, tokenB: Token, amount: string = '10000000'): Promise<number> {
//     try {
//       const cacheKey = `${tokenA.address}-${tokenB.address}`;
      
//       // Cache kontrolü (30 saniye)
//       const cached = this.priceCache.get(cacheKey);
//       if (cached && Date.now() - cached < 30000) {
//         return cached;
//       }

//       const quote = await soroswapAPI.getQuote({
//         assetIn: tokenA.address,
//         assetOut: tokenB.address,
//         amount,
//         tradeType: 'EXACT_IN',
//         protocols: ['soroswap', 'aqua'],
//         slippageTolerance: 50
//       });

//       const price = parseFloat(quote.amountOut) / Math.pow(10, tokenB.decimals) / 
//                    (parseFloat(amount) / Math.pow(10, tokenA.decimals));

//       this.priceCache.set(cacheKey, price);
//       return price;

//     } catch (error) {
//       console.error(`Fiyat alma hatası ${tokenA.symbol}/${tokenB.symbol}:`, error);
//       return 0;
//     }
//   }

//   // Tüm pair fiyatlarını güncelle
//   async updateAllPrices(): Promise<void> {
//     console.log('📊 Fiyatlar güncelleniyor...');
    
//     const updatePromises = this.pairs.slice(0, 20).map(async (pair) => { // İlk 20 pair
//       try {
//         pair.currentPrice = await this.getTokenPrice(pair.baseToken, pair.quoteToken);
        
//         // Token'ın kendi fiyatını da güncelle
//         if (pair.quoteToken.symbol === 'USDC') {
//           pair.baseToken.currentPrice = pair.currentPrice;
//         }
//       } catch (error) {
//         console.error(`Pair fiyat güncelleme hatası ${pair.pair}:`, error);
//       }
//     });

//     await Promise.all(updatePromises);
//     console.log('✅ Fiyatlar güncellendi');
//   }

//   // En popüler pairları al
//   getPopularPairs(): TradingPair[] {
//     return this.pairs.filter(pair => 
//       (pair.quoteToken.symbol === 'USDC' && 
//        ['XLM', 'EURC', 'XTAR', 'XRP', 'AQUA', 'BTC', 'BRL', 'ARST'].includes(pair.baseToken.symbol)) ||
//       (pair.quoteToken.symbol === 'XLM' && 
//        ['USDC', 'EURC', 'XTAR', 'XRP'].includes(pair.baseToken.symbol))
//     );
//   }

//   // Token ara
//   searchTokens(query: string): Token[] {
//     const lowerQuery = query.toLowerCase();
//     return this.tokens.filter(token => 
//       token.symbol.toLowerCase().includes(lowerQuery) ||
//       token.name.toLowerCase().includes(lowerQuery) ||
//       token.address.toLowerCase().includes(lowerQuery)
//     );
//   }

//   // Getter'lar
//   getTokens(): Token[] {
//     return this.tokens;
//   }

//   getPairs(): TradingPair[] {
//     return this.pairs;
//   }

//   getTokenBySymbol(symbol: string): Token | undefined {
//     return this.tokens.find(t => t.symbol === symbol);
//   }

//   getTokenByAddress(address: string): Token | undefined {
//     return this.tokens.find(t => t.address === address);
//   }
// }