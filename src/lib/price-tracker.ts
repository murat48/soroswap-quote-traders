// // src/lib/price-tracker.ts
// import { PriceAlert, PriceData } from '@/types/price-tracker';
// import { soroswapAPI } from './api';
// import { ASSET_OPTIONS } from './constants';

// export class PriceTracker {
//   private alerts: PriceAlert[] = [];
//   private currentPrice: number = 0;
//   private intervalId: NodeJS.Timeout | null = null;
//   private listeners: ((price: PriceData) => void)[] = [];

//   constructor() {
//     this.loadAlertsFromStorage();
//   }

//   // Fiyat takibini başlat
//   startTracking(intervalMs: number = 30000) { // 30 saniye
//     if (this.intervalId) {
//       clearInterval(this.intervalId);
//     }

//     this.intervalId = setInterval(async () => {
//       try {
//         await this.fetchCurrentPrice();
//         this.checkAlerts();
//       } catch (error) {
//         console.error('Fiyat takip hatası:', error);
//       }
//     }, intervalMs);

//     // İlk fiyatı hemen al
//     this.fetchCurrentPrice();
//   }

//   // Fiyat takibini durdur
//   stopTracking() {
//     if (this.intervalId) {
//       clearInterval(this.intervalId);
//       this.intervalId = null;
//     }
//   }

//   // Güncel fiyatı al
//   private async fetchCurrentPrice(): Promise<void> {
//     try {
//       // XLM > USDC için quote al
//       const xlmAsset = ASSET_OPTIONS.find(a => a.symbol === 'XLM')?.value;
//       const usdcAsset = ASSET_OPTIONS.find(a => a.symbol === 'USDC')?.value;

//       if (!xlmAsset || !usdcAsset) {
//         throw new Error('XLM veya USDC asset bulunamadı');
//       }

//       const quote = await soroswapAPI.getQuote({
//         assetIn: xlmAsset,
//         assetOut: usdcAsset,
//         amount: '10000000', // 1 XLM (7 decimal)
//         tradeType: 'EXACT_IN',
//         protocols: ['soroswap', 'phoenix', 'aqua', 'sdex'],
//         slippageTolerance: 50
//       });

//       // 1 XLM = ? USDC hesapla
//       const priceInUsdc = parseFloat(quote.amountOut) / Math.pow(10, 7);
//       this.currentPrice = priceInUsdc;

//       const priceData: PriceData = {
//         price: this.currentPrice,
//         timestamp: new Date()
//       };

//       // Listeners'ları bilgilendir
//       this.listeners.forEach(listener => listener(priceData));

//     } catch (error) {
//       console.error('Fiyat alma hatası:', error);
//       throw error;
//     }
//   }

//   // Fiyat değişimi listener'ı ekle
//   addPriceListener(callback: (price: PriceData) => void) {
//     this.listeners.push(callback);
//   }

//   // Listener'ı kaldır
//   removePriceListener(callback: (price: PriceData) => void) {
//     this.listeners = this.listeners.filter(l => l !== callback);
//   }

//   // Yeni alert ekle
//   addAlert(targetPrice: number, condition: 'above' | 'below'): string {
//     const alert: PriceAlert = {
//       id: Date.now().toString(),
//       targetPrice,
//       condition,
//       isActive: true,
//       createdAt: new Date()
//     };

//     this.alerts.push(alert);
//     this.saveAlertsToStorage();
//     return alert.id;
//   }

//   // Alert'i kaldır
//   removeAlert(alertId: string): boolean {
//     const initialLength = this.alerts.length;
//     this.alerts = this.alerts.filter(alert => alert.id !== alertId);
//     this.saveAlertsToStorage();
//     return this.alerts.length < initialLength;
//   }

//   // Alert'leri kontrol et
//   private checkAlerts(): void {
//     this.alerts.forEach(alert => {
//       if (!alert.isActive || alert.triggeredAt) return;

//       const shouldTrigger = 
//         (alert.condition === 'above' && this.currentPrice >= alert.targetPrice) ||
//         (alert.condition === 'below' && this.currentPrice <= alert.targetPrice);

//       if (shouldTrigger) {
//         this.triggerAlert(alert);
//       }
//     });
//   }

//   // Alert'i tetikle
//   private triggerAlert(alert: PriceAlert): void {
//     alert.triggeredAt = new Date();
//     alert.isActive = false;

//     const message = `🚨 XLM Fiyat Uyarısı!\n` +
//       `Hedef: $${alert.targetPrice}\n` +
//       `Güncel: $${this.currentPrice.toFixed(4)}\n` +
//       `Durum: ${alert.condition === 'above' ? 'Yukarı' : 'Aşağı'} geçti`;

//     // Browser notification
//     this.showBrowserNotification(message);

//     // Custom event trigger
//     window.dispatchEvent(new CustomEvent('priceAlert', {
//       detail: { alert, currentPrice: this.currentPrice, message }
//     }));

//     this.saveAlertsToStorage();
//   }

//   // Browser notification göster
//   private showBrowserNotification(message: string): void {
//     if ('Notification' in window && Notification.permission === 'granted') {
//       new Notification('XLM Fiyat Uyarısı', {
//         body: message,
//         icon: '/xlm-icon.png' // Public klasörüne XLM ikonu ekleyin
//       });
//     }
//   }

//   // Notification permission iste
//   static async requestNotificationPermission(): Promise<boolean> {
//     if ('Notification' in window) {
//       const permission = await Notification.requestPermission();
//       return permission === 'granted';
//     }
//     return false;
//   }

//   // LocalStorage'a kaydet
//   private saveAlertsToStorage(): void {
//     try {
//       localStorage.setItem('xlm_price_alerts', JSON.stringify(this.alerts));
//     } catch (error) {
//       console.error('Alert kaydetme hatası:', error);
//     }
//   }

//   // LocalStorage'dan yükle
//   private loadAlertsFromStorage(): void {
//     try {
//       const stored = localStorage.getItem('xlm_price_alerts');
//       if (stored) {
//         // eslint-disable-next-line @typescript-eslint/no-explicit-any
//         this.alerts = JSON.parse(stored).map((alert: any) => ({
//           ...alert,
//           createdAt: new Date(alert.createdAt),
//           triggeredAt: alert.triggeredAt ? new Date(alert.triggeredAt) : undefined
//         }));
//       }
//     } catch (error) {
//       console.error('Alert yükleme hatası:', error);
//     }
//   }

//   // Getter'lar
//   getCurrentPrice(): number {
//     return this.currentPrice;
//   }

//   getAlerts(): PriceAlert[] {
//     return this.alerts;
//   }

//   getActiveAlerts(): PriceAlert[] {
//     return this.alerts.filter(alert => alert.isActive);
//   }
// }

// export const priceTracker = new PriceTracker();

// src/lib/price-tracker.ts - İkili fiyat takipçisi
// import { PriceAlert, PriceData } from '@/types/price-tracker';
// import { soroswapAPI } from './api';
// import { ASSET_OPTIONS } from './constants';

// export class PriceTracker {
//   private alerts: PriceAlert[] = [];
//   private currentPrice: number = 0; // Testnet fiyatı
//   private mainPrice: number = 0;    // 🆕 Mainnet fiyatı
//   private intervalId: NodeJS.Timeout | null = null;
//   private listeners: ((price: PriceData) => void)[] = [];

//   constructor() {
//     this.loadAlertsFromStorage();
//   }

//   // Fiyat takibini başlat
//   startTracking(intervalMs: number = 30000) {
//     if (this.intervalId) {
//       clearInterval(this.intervalId);
//     }

//     this.intervalId = setInterval(async () => {
//       try {
//         // Her iki fiyatı da al
//         await Promise.all([
//           this.fetchCurrentPrice(), // Testnet
//           this.fetchMainPrice()      // Mainnet
//         ]);
//         this.checkAlerts();
//       } catch (error) {
//         console.error('Fiyat takip hatası:', error);
//       }
//     }, intervalMs);

//     // İlk fiyatları hemen al
//     Promise.all([
//       this.fetchCurrentPrice(),
//       this.fetchMainPrice()
//     ]);
//   }

//   // Fiyat takibini durdur
//   stopTracking() {
//     if (this.intervalId) {
//       clearInterval(this.intervalId);
//       this.intervalId = null;
//     }
//   }

//   // 🧪 Testnet fiyatı (mevcut)
//   private async fetchCurrentPrice(): Promise<void> {
//     try {
//       const xlmAsset = ASSET_OPTIONS.find(a => a.symbol === 'XLM')?.value;
//       const usdcAsset = ASSET_OPTIONS.find(a => a.symbol === 'USDC')?.value;

//       if (!xlmAsset || !usdcAsset) {
//         throw new Error('XLM veya USDC asset bulunamadı');
//       }

//       // Testnet API çağrısı
//       const quote = await soroswapAPI.getQuote({
//         assetIn: xlmAsset,
//         assetOut: usdcAsset,
//         amount: '10000000',
//         tradeType: 'EXACT_IN',
//         protocols: ['soroswap', 'phoenix', 'aqua', 'sdex'],
//         slippageTolerance: 50
//       });

//       const priceInUsdc = parseFloat(quote.amountOut) / Math.pow(10, 7);
//       this.currentPrice = priceInUsdc;

//       console.log('🧪 Testnet XLM fiyatı:', this.currentPrice);

//       // Listeners'ları bilgilendir (testnet fiyatı ile)
//       const priceData: PriceData = {
//         price: this.currentPrice,
//         timestamp: new Date()
//       };
//       this.listeners.forEach(listener => listener(priceData));

//     } catch (error) {
//       console.error('Testnet fiyat alma hatası:', error);
//       throw error;
//     }
//   }

//   // 🌐 Mainnet fiyatı (yeni)
//   private async fetchMainPrice(): Promise<void> {
//     try {
//       // Mainnet fiyatını CoinGecko'dan al
//       const response = await fetch(
//         'https://api.coingecko.com/api/v3/simple/price?ids=stellar&vs_currencies=usd'
//       );

//       if (!response.ok) {
//         throw new Error(`CoinGecko API error: ${response.status}`);
//       }

//       const data = await response.json();
//       this.mainPrice = data.stellar.usd;

//       console.log('🌐 Mainnet XLM fiyatı:', this.mainPrice);

//     } catch (error) {
//       console.error('Mainnet fiyat alma hatası:', error);
//       // Hata durumunda Soroswap mainnet'i dene
//       try {
//         await this.fetchMainPriceFromSoroswap();
//       } catch (fallbackError) {
//         console.error('Mainnet fallback hatası:', fallbackError);
//       }
//     }
//   }

//   // 🏪 Soroswap Mainnet'ten fiyat al (fallback)
//   private async fetchMainPriceFromSoroswap(): Promise<void> {
//     // Mainnet asset adresleri
//     const MAINNET_XLM = 'CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA';
//     const MAINNET_USDC = 'CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75';

//     // Mainnet API çağrısı için geçici config
//     const mainnetResponse = await fetch(`https://api.soroswap.finance/quote?network=mainnet`, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SOROSWAP_API_KEY || 'your-api-key'}`,
//       },
//       body: JSON.stringify({
//         assetIn: MAINNET_XLM,
//         assetOut: MAINNET_USDC,
//         amount: '10000000',
//         tradeType: 'EXACT_IN',
//         protocols: ['soroswap', 'phoenix', 'aqua', 'sdex'],
//         slippageTolerance: 50
//       })
//     });

//     if (!mainnetResponse.ok) {
//       throw new Error(`Mainnet API error: ${mainnetResponse.status}`);
//     }

//     const quote = await mainnetResponse.json();
//     this.mainPrice = parseFloat(quote.amountOut) / Math.pow(10, 7);

//     console.log('🏪 Mainnet XLM fiyatı (Soroswap):', this.mainPrice);
//   }

//   // Alert kontrol (ana fiyat referans alınır)
//   private checkAlerts(): void {
//     this.alerts.forEach(alert => {
//       if (!alert.isActive || alert.triggeredAt) return;

//       // Ana referans olarak mainnet fiyatını kullan
//       const referencePrice = this.mainPrice || this.currentPrice;

//       const shouldTrigger = 
//         (alert.condition === 'above' && referencePrice >= alert.targetPrice) ||
//         (alert.condition === 'below' && referencePrice <= alert.targetPrice);

//       if (shouldTrigger) {
//         this.triggerAlert(alert, referencePrice);
//       }
//     });
//   }

//   // Alert tetikleme (hangi fiyat ile tetiklendiği belirtilir)
//   private triggerAlert(alert: PriceAlert, triggerPrice: number): void {
//     alert.triggeredAt = new Date();
//     alert.isActive = false;

//     const priceSource = this.mainPrice > 0 ? 'Mainnet' : 'Testnet';
    
//     const message = `🚨 XLM Fiyat Uyarısı!\n` +
//       `Hedef: $${alert.targetPrice}\n` +
//       `Güncel: $${triggerPrice.toFixed(4)} (${priceSource})\n` +
//       `Durum: ${alert.condition === 'above' ? 'Yukarı' : 'Aşağı'} geçti`;

//     // Browser notification
//     this.showBrowserNotification(message);

//     // Custom event trigger
//     window.dispatchEvent(new CustomEvent('priceAlert', {
//       detail: { alert, currentPrice: triggerPrice, message, source: priceSource }
//     }));

//     this.saveAlertsToStorage();
//   }

//   // Browser notification göster
//   private showBrowserNotification(message: string): void {
//     if ('Notification' in window && Notification.permission === 'granted') {
//       new Notification('XLM Fiyat Uyarısı', {
//         body: message,
//         icon: '/xlm-icon.png'
//       });
//     }
//   }

//   // Notification permission iste
//   static async requestNotificationPermission(): Promise<boolean> {
//     if ('Notification' in window) {
//       const permission = await Notification.requestPermission();
//       return permission === 'granted';
//     }
//     return false;
//   }

//   // LocalStorage'a kaydet
//   private saveAlertsToStorage(): void {
//     try {
//       localStorage.setItem('xlm_price_alerts', JSON.stringify(this.alerts));
//     } catch (error) {
//       console.error('Alert kaydetme hatası:', error);
//     }
//   }

//   // LocalStorage'dan yükle
//   private loadAlertsFromStorage(): void {
//     try {
//       const stored = localStorage.getItem('xlm_price_alerts');
//       if (stored) {
//         // eslint-disable-next-line @typescript-eslint/no-explicit-any
//         this.alerts = JSON.parse(stored).map((alert: any) => ({
//           ...alert,
//           createdAt: new Date(alert.createdAt),
//           triggeredAt: alert.triggeredAt ? new Date(alert.triggeredAt) : undefined
//         }));
//       }
//     } catch (error) {
//       console.error('Alert yükleme hatası:', error);
//     }
//   }

//   // Fiyat değişimi listener'ı ekle
//   addPriceListener(callback: (price: PriceData) => void) {
//     this.listeners.push(callback);
//   }

//   // Listener'ı kaldır
//   removePriceListener(callback: (price: PriceData) => void) {
//     this.listeners = this.listeners.filter(l => l !== callback);
//   }

//   // Yeni alert ekle
//   addAlert(targetPrice: number, condition: 'above' | 'below'): string {
//     const alert: PriceAlert = {
//       id: Date.now().toString(),
//       targetPrice,
//       condition,
//       isActive: true,
//       createdAt: new Date()
//     };

//     this.alerts.push(alert);
//     this.saveAlertsToStorage();
//     return alert.id;
//   }

//   // Alert'i kaldır
//   removeAlert(alertId: string): boolean {
//     const initialLength = this.alerts.length;
//     this.alerts = this.alerts.filter(alert => alert.id !== alertId);
//     this.saveAlertsToStorage();
//     return this.alerts.length < initialLength;
//   }

//   // Getter'lar
//   getCurrentPrice(): number {
//     return this.currentPrice; // Testnet
//   }

//   getMainPrice(): number { // 🆕 Mainnet fiyatı
//     return this.mainPrice;
//   }

//   getAlerts(): PriceAlert[] {
//     return this.alerts;
//   }

//   getActiveAlerts(): PriceAlert[] {
//     return this.alerts.filter(alert => alert.isActive);
//   }

//   // 📊 Fiyat karşılaştırması
//   getPriceComparison() {
//     if (this.currentPrice === 0 || this.mainPrice === 0) {
//       return null;
//     }

//     const difference = this.mainPrice - this.currentPrice;
//     const percentDiff = (difference / this.currentPrice) * 100;

//     return {
//       testnet: this.currentPrice,
//       mainnet: this.mainPrice,
//       difference: difference,
//       percentDiff: percentDiff
//     };
//   }
// }

// export const priceTracker = new PriceTracker();


import { PriceAlert, PriceData } from '@/types/price-tracker';
// import { soroswapAPI } from './api';
// import { ASSET_OPTIONS } from './constants';

export class PriceTracker {
  private alerts: PriceAlert[] = [];
  private currentPrice: number = 0; // Mainnet fiyatı
  private intervalId: NodeJS.Timeout | null = null;
  private listeners: ((price: PriceData) => void)[] = [];

  constructor() {
    this.loadAlertsFromStorage();
  }

  // Fiyat takibini başlat
  startTracking(intervalMs: number = 30000) {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    this.intervalId = setInterval(async () => {
      try {
        await this.fetchCurrentPrice(); // Sadece mainnet
        this.checkAlerts();
      } catch (error) {
        console.error('Fiyat takip hatası:', error);
      }
    }, intervalMs);

    // İlk fiyatı hemen al
    this.fetchCurrentPrice();
  }

  // Fiyat takibini durdur
  stopTracking() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  // 🌐 Mainnet fiyatı al
  private async fetchCurrentPrice(): Promise<void> {
    try {
      // Önce CoinGecko'dan gerçek fiyatı al
      const response = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=stellar&vs_currencies=usd'
      );

      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status}`);
      }

      const data = await response.json();
      this.currentPrice = data.stellar.usd;

      console.log('🌐 Mainnet XLM fiyatı (CoinGecko):', this.currentPrice);

      // Listeners'ları bilgilendir
      const priceData: PriceData = {
        price: this.currentPrice,
        timestamp: new Date()
      };
      this.listeners.forEach(listener => listener(priceData));

    } catch (error) {
      console.error('CoinGecko fiyat alma hatası:', error);
      // Hata durumunda Soroswap mainnet'i dene
      try {
        await this.fetchMainPriceFromSoroswap();
      } catch (fallbackError) {
        console.error('Soroswap fallback hatası:', fallbackError);
        throw fallbackError;
      }
    }
  }

  // 🏪 Soroswap Mainnet'ten fiyat al (fallback)
  private async fetchMainPriceFromSoroswap(): Promise<void> {
    // Mainnet asset adresleri
    const MAINNET_XLM = 'CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA';
    const MAINNET_USDC = 'CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75';

    // Mainnet API çağrısı
    const mainnetResponse = await fetch(`https://api.soroswap.finance/quote?network=mainnet`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SOROSWAP_API_KEY || 'your-api-key'}`,
      },
      body: JSON.stringify({
        assetIn: MAINNET_XLM,
        assetOut: MAINNET_USDC,
        amount: '10000000',
        tradeType: 'EXACT_IN',
        protocols: ['soroswap', 'phoenix', 'aqua', 'sdex'],
        slippageTolerance: 50
      })
    });

    if (!mainnetResponse.ok) {
      throw new Error(`Mainnet API error: ${mainnetResponse.status}`);
    }

    const quote = await mainnetResponse.json();
    this.currentPrice = parseFloat(quote.amountOut) / Math.pow(10, 7);

    console.log('🏪 Mainnet XLM fiyatı (Soroswap):', this.currentPrice);

    // Listeners'ları bilgilendir
    const priceData: PriceData = {
      price: this.currentPrice,
      timestamp: new Date()
    };
    this.listeners.forEach(listener => listener(priceData));
  }

  // Alert kontrol
  private checkAlerts(): void {
    this.alerts.forEach(alert => {
      if (!alert.isActive || alert.triggeredAt) return;

      const shouldTrigger = 
        (alert.condition === 'above' && this.currentPrice >= alert.targetPrice) ||
        (alert.condition === 'below' && this.currentPrice <= alert.targetPrice);

      if (shouldTrigger) {
        this.triggerAlert(alert);
      }
    });
  }

  // Alert tetikleme
  private triggerAlert(alert: PriceAlert): void {
    alert.triggeredAt = new Date();
    alert.isActive = false;
    
    const message = `🚨 XLM Fiyat Uyarısı!\n` +
      `Hedef: $${alert.targetPrice}\n` +
      `Güncel: $${this.currentPrice.toFixed(4)} (Mainnet)\n` +
      `Durum: ${alert.condition === 'above' ? 'Yukarı' : 'Aşağı'} geçti`;

    // Browser notification
    this.showBrowserNotification(message);

    // Custom event trigger
    window.dispatchEvent(new CustomEvent('priceAlert', {
      detail: { alert, currentPrice: this.currentPrice, message, source: 'Mainnet' }
    }));

    this.saveAlertsToStorage();
  }

  // Browser notification göster
  private showBrowserNotification(message: string): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('XLM Fiyat Uyarısı', {
        body: message,
        icon: '/xlm-icon.png'
      });
    }
  }

  // Notification permission iste
  static async requestNotificationPermission(): Promise<boolean> {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }

  // LocalStorage'a kaydet
  private saveAlertsToStorage(): void {
    try {
      localStorage.setItem('xlm_price_alerts', JSON.stringify(this.alerts));
    } catch (error) {
      console.error('Alert kaydetme hatası:', error);
    }
  }

  // LocalStorage'dan yükle
  private loadAlertsFromStorage(): void {
    try {
      const stored = localStorage.getItem('xlm_price_alerts');
      if (stored) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.alerts = JSON.parse(stored).map((alert: any) => ({
          ...alert,
          createdAt: new Date(alert.createdAt),
          triggeredAt: alert.triggeredAt ? new Date(alert.triggeredAt) : undefined
        }));
      }
    } catch (error) {
      console.error('Alert yükleme hatası:', error);
    }
  }

  // Fiyat değişimi listener'ı ekle
  addPriceListener(callback: (price: PriceData) => void) {
    this.listeners.push(callback);
  }

  // Listener'ı kaldır
  removePriceListener(callback: (price: PriceData) => void) {
    this.listeners = this.listeners.filter(l => l !== callback);
  }

  // Yeni alert ekle
  addAlert(targetPrice: number, condition: 'above' | 'below'): string {
    const alert: PriceAlert = {
      id: Date.now().toString(),
      targetPrice,
      condition,
      isActive: true,
      createdAt: new Date()
    };

    this.alerts.push(alert);
    this.saveAlertsToStorage();
    return alert.id;
  }

  // Alert'i kaldır
  removeAlert(alertId: string): boolean {
    const initialLength = this.alerts.length;
    this.alerts = this.alerts.filter(alert => alert.id !== alertId);
    this.saveAlertsToStorage();
    return this.alerts.length < initialLength;
  }

  // Getter'lar
  getCurrentPrice(): number {
    return this.currentPrice; // Mainnet fiyatı
  }

  getAlerts(): PriceAlert[] {
    return this.alerts;
  }

  getActiveAlerts(): PriceAlert[] {
    return this.alerts.filter(alert => alert.isActive);
  }
}

export const priceTracker = new PriceTracker();