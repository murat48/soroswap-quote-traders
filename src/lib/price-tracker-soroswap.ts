// src/lib/price-tracker-soroswap.ts - Soroswap API ile fiyat takibi
import { PriceAlert, PriceData } from '@/types/price-tracker';
import { telegramBot } from './telegram';

export class PriceTracker {
  private alerts: PriceAlert[] = [];
  private currentPrice: number = 0;
  private intervalId: NodeJS.Timeout | null = null;
  private listeners: ((price: PriceData) => void)[] = [];
  private telegramChatId: string = '';

  constructor() {
    console.log('🔧 PriceTracker (Soroswap) oluşturuluyor...');
    
    if (typeof window !== 'undefined') {
      console.log('🌐 Browser ortamı, localStorage yükleniyor...');
      this.loadAlertsFromStorage();
      this.loadTelegramSettings();
    } else {
      console.log('🖥️ Server-side ortam, localStorage atlandı');
    }
    
    console.log('✅ PriceTracker (Soroswap) hazır');
  }

  // ✅ Soroswap'tan gerçek DEX fiyatı al
  private async fetchCurrentPrice(): Promise<void> {
    try {
      console.log('📡 Soroswap API\'den fiyat alınıyor...');
      
      // Soroswap mainnet quote API
      const response = await fetch('https://api.soroswap.finance/quote?network=mainnet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SOROSWAP_API_KEY || ''}`
        },
        body: JSON.stringify({
          assetIn: 'CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA', // XLM
          assetOut: 'CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75', // USDC
          amount: '10000000', // 1 XLM (7 decimals)
          tradeType: 'EXACT_IN',
          protocols: ['soroswap', 'phoenix', 'aqua', 'sdex'],
          slippageTolerance: 50
        })
      });

      if (!response.ok) {
        // Fallback: CoinGecko kullan
        console.warn('⚠️ Soroswap API hatası, CoinGecko\'ya geçiliyor...');
        await this.fetchPriceFromCoinGecko();
        return;
      }

      const quote = await response.json();
      
      // 1 XLM = ? USDC hesapla
      const priceInUsdc = parseFloat(quote.amountOut) / Math.pow(10, 7);
      this.currentPrice = priceInUsdc;

      console.log('🏪 Soroswap DEX fiyatı:', this.currentPrice);
      console.log('📊 Kullanılan protokoller:', quote.platform);

      const priceData: PriceData = {
        price: this.currentPrice,
        timestamp: new Date()
      };
      
      this.listeners.forEach(listener => listener(priceData));

    } catch (error) {
      console.error('❌ Soroswap fiyat alma hatası:', error);
      
      // Fallback: CoinGecko kullan
      try {
        console.log('🔄 CoinGecko fallback aktif...');
        await this.fetchPriceFromCoinGecko();
      } catch (fallbackError) {
        console.error('❌ CoinGecko fallback hatası:', fallbackError);
        throw fallbackError;
      }
    }
  }

  // 🌐 Fallback: CoinGecko'dan fiyat al
  private async fetchPriceFromCoinGecko(): Promise<void> {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=stellar&vs_currencies=usd'
    );

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data = await response.json();
    this.currentPrice = data.stellar.usd;

    console.log('🌐 CoinGecko fiyatı (fallback):', this.currentPrice);

    const priceData: PriceData = {
      price: this.currentPrice,
      timestamp: new Date()
    };
    
    this.listeners.forEach(listener => listener(priceData));
  }

  // 📊 Fiyat kaynağı bilgisini al
  async getPriceSource(): Promise<string> {
    try {
      // Soroswap API'yi test et
      const response = await fetch('https://api.soroswap.finance/quote?network=mainnet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SOROSWAP_API_KEY || ''}`
        },
        body: JSON.stringify({
          assetIn: 'CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA',
          assetOut: 'CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75',
          amount: '10000000',
          tradeType: 'EXACT_IN',
          protocols: ['soroswap'],
          slippageTolerance: 50
        })
      });

      if (response.ok) {
        const quote = await response.json();
        return `Soroswap DEX (${quote.platform})`;
      } else {
        return 'CoinGecko (Fallback)';
      }
    } catch (error) {
      return 'CoinGecko (Fallback)';
    }
  }

  // Güvenli localStorage yükleme
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
        console.log('📋', this.alerts.length, 'alert yüklendi');
      }
    } catch (error) {
      console.error('❌ Alert yükleme hatası:', error);
    }
  }

  private saveAlertsToStorage(): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem('xlm_price_alerts', JSON.stringify(this.alerts));
      console.log('💾', this.alerts.length, 'alert kaydedildi');
    } catch (error) {
      console.error('❌ Alert kaydetme hatası:', error);
    }
  }

  private loadTelegramSettings(): void {
    try {
      const stored = localStorage.getItem('telegram_chat_id');
      if (stored) {
        this.telegramChatId = stored;
        console.log('📱 Chat ID yüklendi:', stored);
      }
    } catch (error) {
      console.error('❌ Telegram ayarları yükleme hatası:', error);
    }
  }

  setTelegramChatId(chatId: string): void {
    console.log('📱 Chat ID kaydediliyor:', chatId);
    this.telegramChatId = chatId;
    
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('telegram_chat_id', chatId);
        console.log('💾 Chat ID localStorage\'a kaydedildi');
      } catch (error) {
        console.error('❌ Chat ID kaydetme hatası:', error);
      }
    }
  }

  getTelegramChatId(): string {
    return this.telegramChatId;
  }

  async sendTestMessage(): Promise<boolean> {
    console.log('🧪 Test mesajı fonksiyonu çağrıldı');
    console.log('📱 Mevcut Chat ID:', this.telegramChatId);
    
    if (!this.telegramChatId) {
      console.error('❌ Chat ID boş!');
      alert('❌ Önce Telegram Chat ID girin!');
      return false;
    }

    try {
      console.log('📞 telegramBot.sendTestMessage çağrılıyor...');
      const success = await telegramBot.sendTestMessage(this.telegramChatId, this.currentPrice);
      
      if (success) {
        console.log('✅ Test mesajı başarılı');
        alert('✅ Test mesajı Telegram\'a gönderildi!');
        return true;
      } else {
        console.error('❌ Test mesajı başarısız');
        alert('❌ Mesaj gönderilemedi!');
        return false;
      }
    } catch (error) {
      console.error('❌ Test mesajı exception:', error);
      alert('❌ Hata: ' + (error as Error).message);
      return false;
    }
  }

  startTracking(intervalMs: number = 10000) {
    console.log('▶️ Soroswap fiyat takibi başlatılıyor, interval:', intervalMs);
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    this.intervalId = setInterval(async () => {
      try {
        await this.fetchCurrentPrice();
        this.checkAlerts();
      } catch (error) {
        console.error('❌ Fiyat takip hatası:', error);
      }
    }, intervalMs);

    this.fetchCurrentPrice();
  }

  stopTracking() {
    console.log('⏹️ Fiyat takibi durduruluyor');
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private checkAlerts(): void {
    if (this.alerts.length === 0) return;

    console.log('🔍 Alert kontrolü yapılıyor, toplam alert:', this.alerts.length);
    
    this.alerts.forEach((alert, index) => {
      if (!alert.isActive || alert.triggeredAt) return;

      const shouldTrigger = 
        (alert.condition === 'above' && this.currentPrice >= alert.targetPrice) ||
        (alert.condition === 'below' && this.currentPrice <= alert.targetPrice);

      if (shouldTrigger) {
        console.log(`🚨 Alert #${index} tetiklendi:`, alert);
        this.triggerAlert(alert);
      }
    });
  }

  private async triggerAlert(alert: PriceAlert): Promise<void> {
    console.log('🚨 triggerAlert fonksiyonu çağrıldı');
    console.log('📊 Alert detayları:', alert);
    console.log('💰 Güncel fiyat (Soroswap):', this.currentPrice);
    console.log('📱 Telegram Chat ID:', this.telegramChatId);
    
    alert.triggeredAt = new Date();
    alert.isActive = false;
    
    const message = `🚨 XLM Fiyat Uyarısı!\n` +
      `Hedef: $${alert.targetPrice}\n` +
      `Güncel: $${this.currentPrice.toFixed(4)} (Soroswap DEX)\n` +
      `Durum: ${alert.condition === 'above' ? 'Yukarı' : 'Aşağı'} geçti`;

    console.log('📝 Browser notification mesajı:', message);

    // Browser notification
    this.showBrowserNotification(message);

    // Telegram notification
    if (this.telegramChatId) {
      console.log('📞 Telegram mesajı gönderiliyor...');
      
      try {
        telegramBot.sendPriceAlert(
          this.telegramChatId,
          this.currentPrice,
          alert.targetPrice,
          alert.condition
        ).then(success => {
          if (success) {
            console.log('✅ Telegram uyarısı gönderildi (Soroswap fiyatı)!');
          } else {
            console.error('❌ Telegram uyarısı gönderilemedi!');
          }
        }).catch(error => {
          console.error('❌ Telegram gönderim hatası:', error);
        });
      } catch (error) {
        console.error('❌ Telegram uyarısı exception:', error);
      }
    } else {
      console.warn('⚠️ Telegram Chat ID boş, mesaj gönderilmiyor!');
    }

    // Custom event
    if (typeof window !== 'undefined') {
      console.log('📡 Custom event tetikleniyor...');
      window.dispatchEvent(new CustomEvent('priceAlert', {
        detail: { alert, currentPrice: this.currentPrice, message }
      }));
    }

    this.saveAlertsToStorage();
    console.log('💾 Alert durumu kaydedildi');
  }

  private showBrowserNotification(message: string): void {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      console.log('🔔 Browser notification gösteriliyor');
      new Notification('XLM Fiyat Uyarısı (Soroswap)', {
        body: message,
        icon: '/xlm-icon.png'
      });
    } else {
      console.log('🔕 Browser notification izni yok');
    }
  }

  static async requestNotificationPermission(): Promise<boolean> {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const permission = await Notification.requestPermission();
      console.log('🔔 Notification permission:', permission);
      return permission === 'granted';
    }
    return false;
  }

  // Listener metodları
  addPriceListener(callback: (price: PriceData) => void) {
    this.listeners.push(callback);
    console.log('👂 Price listener eklendi, toplam:', this.listeners.length);
  }

  removePriceListener(callback: (price: PriceData) => void) {
    this.listeners = this.listeners.filter(l => l !== callback);
    console.log('👂 Price listener kaldırıldı, kalan:', this.listeners.length);
  }

  // Alert metodları
  addAlert(targetPrice: number, condition: 'above' | 'below'): string {
    const alert: PriceAlert = {
      id: Date.now().toString(),
      targetPrice,
      condition,
      isActive: true,
      createdAt: new Date()
    };

    this.alerts.push(alert);
    console.log('➕ Yeni alert eklendi:', alert);
    console.log('📊 Toplam alert sayısı:', this.alerts.length);
    this.saveAlertsToStorage();
    return alert.id;
  }

  removeAlert(alertId: string): boolean {
    const initialLength = this.alerts.length;
    this.alerts = this.alerts.filter(alert => alert.id !== alertId);
    const removed = this.alerts.length < initialLength;
    
    if (removed) {
      console.log('➖ Alert kaldırıldı:', alertId);
      console.log('📊 Kalan alert sayısı:', this.alerts.length);
      this.saveAlertsToStorage();
    }
    
    return removed;
  }

  // Getter'lar
  getCurrentPrice(): number {
    return this.currentPrice;
  }

  getAlerts(): PriceAlert[] {
    return this.alerts;
  }

  getActiveAlerts(): PriceAlert[] {
    return this.alerts.filter(alert => alert.isActive);
  }
}

export const priceTracker = new PriceTracker();