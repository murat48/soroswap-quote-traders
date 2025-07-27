// import { PriceAlert, PriceData } from '@/types/price-tracker';
// import { soroswapAPI } from './api';
// import { ASSET_OPTIONS } from './constants';
// import { telegramBot } from './telegram'; // 🆕 Telegram bot import

// export class PriceTracker {
//   private alerts: PriceAlert[] = [];
//   private currentPrice: number = 0;
//   private intervalId: NodeJS.Timeout | null = null;
//   private listeners: ((price: PriceData) => void)[] = [];
  
//   // 🆕 Telegram ayarları
//   private telegramChatId: string = '';

//   constructor() {
//     this.loadAlertsFromStorage();
//     this.loadTelegramSettings(); // 🆕
//   }

//   // 🆕 Telegram ayarlarını yükle
//   private loadTelegramSettings(): void {
//     try {
//       const stored = localStorage.getItem('telegram_chat_id');
//       if (stored) {
//         this.telegramChatId = stored;
//       }
//     } catch (error) {
//       console.error('Telegram ayarları yükleme hatası:', error);
//     }
//   }

//   // 🆕 Telegram Chat ID kaydet
//   setTelegramChatId(chatId: string): void {
//     this.telegramChatId = chatId;
//     try {
//       localStorage.setItem('telegram_chat_id', chatId);
//       console.log('💾 Telegram Chat ID kaydedildi');
//     } catch (error) {
//       console.error('Chat ID kaydetme hatası:', error);
//     }
//   }

//   // 🆕 Telegram Chat ID al
//   getTelegramChatId(): string {
//     return this.telegramChatId;
//   }

//   // 🆕 Test mesajı gönder
//   async sendTestMessage(): Promise<boolean> {
//     if (!this.telegramChatId) {
//       alert('❌ Önce Telegram Chat ID girin!');
//       return false;
//     }

//     const success = await telegramBot.sendTestMessage(this.telegramChatId, this.currentPrice);
    
//     if (success) {
//       alert('✅ Test mesajı Telegram\'a gönderildi!');
//     } else {
//       alert('❌ Mesaj gönderilemedi. Bot token ve Chat ID kontrol edin.');
//     }
    
//     return success;
//   }

//   // Fiyat takibini başlat
//   startTracking(intervalMs: number = 30000) {
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
//       const response = await fetch(
//         'https://api.coingecko.com/api/v3/simple/price?ids=stellar&vs_currencies=usd'
//       );

//       if (!response.ok) {
//         throw new Error(`CoinGecko API error: ${response.status}`);
//       }

//       const data = await response.json();
//       this.currentPrice = data.stellar.usd;

//       console.log('🌐 Mainnet XLM fiyatı (CoinGecko):', this.currentPrice);

//       const priceData: PriceData = {
//         price: this.currentPrice,
//         timestamp: new Date()
//       };
//       this.listeners.forEach(listener => listener(priceData));

//     } catch (error) {
//       console.error('CoinGecko fiyat alma hatası:', error);
//       throw error;
//     }
//   }

//   // Alert kontrol
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

//   // 🆕 Alert tetikleme - Telegram desteği eklendi
//   private async triggerAlert(alert: PriceAlert): Promise<void> {
//     alert.triggeredAt = new Date();
//     alert.isActive = false;
    
//     const message = `🚨 XLM Fiyat Uyarısı!\n` +
//       `Hedef: $${alert.targetPrice}\n` +
//       `Güncel: $${this.currentPrice.toFixed(4)} (Mainnet)\n` +
//       `Durum: ${alert.condition === 'above' ? 'Yukarı' : 'Aşağı'} geçti`;

//     // Browser notification
//     this.showBrowserNotification(message);

//     // 🆕 Telegram notification
//     if (this.telegramChatId) {
//       await telegramBot.sendPriceAlert(
//         this.telegramChatId,
//         this.currentPrice,
//         alert.targetPrice,
//         alert.condition
//       );
//     }

//     // Custom event trigger
//     window.dispatchEvent(new CustomEvent('priceAlert', {
//       detail: { alert, currentPrice: this.currentPrice, message, source: 'Mainnet' }
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

//   // Listener metodları
//   addPriceListener(callback: (price: PriceData) => void) {
//     this.listeners.push(callback);
//   }

//   removePriceListener(callback: (price: PriceData) => void) {
//     this.listeners = this.listeners.filter(l => l !== callback);
//   }

//   // Alert metodları
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

//   removeAlert(alertId: string): boolean {
//     const initialLength = this.alerts.length;
//     this.alerts = this.alerts.filter(alert => alert.id !== alertId);
//     this.saveAlertsToStorage();
//     return this.alerts.length < initialLength;
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
// src/lib/price-tracker.ts - localStorage hatası tamamen çözüldü + debug
// src/lib/price-tracker.ts - localStorage hatası tamamen çözüldü + debug
import { PriceAlert, PriceData } from '@/types/price-tracker';
import { telegramBot } from './telegram';

export class PriceTracker {
  private alerts: PriceAlert[] = [];
  private currentPrice: number = 0;
  private intervalId: NodeJS.Timeout | null = null;
  private listeners: ((price: PriceData) => void)[] = [];
  private telegramChatId: string = '';

  constructor() {
    console.log('🔧 PriceTracker constructor başladı');
    
    // ✅ SADECE browser'da localStorage kullan
    if (typeof window !== 'undefined') {
      console.log('🌐 Browser ortamı tespit edildi, localStorage yükleniyor...');
      this.loadAlertsFromStorage();
      this.loadTelegramSettings();
    } else {
      console.log('🖥️ Server-side ortam, localStorage atlandı');
    }
    
    console.log('✅ PriceTracker oluşturuldu');
  }

  // ✅ Güvenli localStorage yükleme - SADECE browser'da çalışır
  private loadAlertsFromStorage(): void {
    // Bu fonksiyon sadece constructor'da window kontrolü sonrası çağrılır
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
      } else {
        console.log('📋 LocalStorage\'da alert bulunamadı');
      }
    } catch (error) {
      console.error('❌ Alert yükleme hatası:', error);
    }
  }

  // ✅ Güvenli localStorage kaydetme
  private saveAlertsToStorage(): void {
    if (typeof window === 'undefined') {
      console.log('🖥️ Server-side: Alert kaydetme atlandı');
      return;
    }
    
    try {
      localStorage.setItem('xlm_price_alerts', JSON.stringify(this.alerts));
      console.log('💾', this.alerts.length, 'alert kaydedildi');
    } catch (error) {
      console.error('❌ Alert kaydetme hatası:', error);
    }
  }

  // ✅ Telegram ayarları yükleme - SADECE browser'da
  private loadTelegramSettings(): void {
    // Bu fonksiyon sadece constructor'da window kontrolü sonrası çağrılır
    try {
      const stored = localStorage.getItem('telegram_chat_id');
      if (stored) {
        this.telegramChatId = stored;
        console.log('📱 Chat ID yüklendi:', stored);
      } else {
        console.log('📱 Chat ID bulunamadı');
      }
    } catch (error) {
      console.error('❌ Telegram ayarları yükleme hatası:', error);
    }
  }

  // Telegram Chat ID kaydet
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

  // Telegram Chat ID al
  getTelegramChatId(): string {
    return this.telegramChatId;
  }

  // Test mesajı gönder
  async sendTestMessage(): Promise<boolean> {
    console.log('🧪 Test mesajı fonksiyonu çağrıldı');
    console.log('📱 Mevcut Chat ID:', this.telegramChatId);
    
    if (!this.telegramChatId) {
      console.error('❌ Chat ID boş!');
      alert('❌ Önce Telegram Chat ID girin!\n\n📋 Nasıl alınır:\n1. @userinfobot\'a mesaj atın\n2. Size gönderdiği sayıyı kopyalayın\n3. Forma yapıştırın');
      return false;
    }

    try {
      console.log('📞 telegramBot.sendTestMessage çağrılıyor...');
      const success = await telegramBot.sendTestMessage(this.telegramChatId, this.currentPrice);
      
      if (success) {
        console.log('✅ Test mesajı başarılı');
        alert('✅ Test mesajı Telegram\'a gönderildi!\n\nTelegram\'ı kontrol edin 📱');
        return true;
      } else {
        console.error('❌ Test mesajı başarısız');
        alert('❌ Mesaj gönderilemedi!\n\n🔍 Kontrol edin:\n• Chat ID doğru mu?\n• Bot ile daha önce konuştunuz mu?');
        return false;
      }
    } catch (error) {
      console.error('❌ Test mesajı exception:', error);
      alert('❌ Hata: ' + (error as Error).message);
      return false;
    }
  }

  // Fiyat takibini başlat
  startTracking(intervalMs: number = 30000) {
    console.log('▶️ Fiyat takibi başlatılıyor, interval:', intervalMs);
    
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

    // İlk fiyatı hemen al
    this.fetchCurrentPrice();
  }

  // Fiyat takibini durdur
  stopTracking() {
    console.log('⏹️ Fiyat takibi durduruluyor');
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  // Güncel fiyatı al
  private async fetchCurrentPrice(): Promise<void> {
    try {
      const response = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=stellar&vs_currencies=usd'
      );

      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status}`);
      }

      const data = await response.json();
      this.currentPrice = data.stellar.usd;

      console.log('🌐 XLM fiyatı güncellendi:', this.currentPrice);

      const priceData: PriceData = {
        price: this.currentPrice,
        timestamp: new Date()
      };
      this.listeners.forEach(listener => listener(priceData));

    } catch (error) {
      console.error('❌ Fiyat alma hatası:', error);
      throw error;
    }
  }

  // Alert kontrol
  private checkAlerts(): void {
    if (this.alerts.length === 0) {
      return;
    }

    console.log('🔍 Alert kontrolü yapılıyor, toplam alert:', this.alerts.length);
    
    this.alerts.forEach((alert, index) => {
      if (!alert.isActive || alert.triggeredAt) {
        return;
      }

      const shouldTrigger = 
        (alert.condition === 'above' && this.currentPrice >= alert.targetPrice) ||
        (alert.condition === 'below' && this.currentPrice <= alert.targetPrice);

      if (shouldTrigger) {
        console.log(`🚨 Alert #${index} tetiklendi:`, alert);
        this.triggerAlert(alert);
      }
    });
  }

  // ✅ Alert tetikleme - Debug logları eklendi
  private async triggerAlert(alert: PriceAlert): Promise<void> {
    console.log('🚨 triggerAlert fonksiyonu çağrıldı');
    console.log('📊 Alert detayları:', alert);
    console.log('💰 Güncel fiyat:', this.currentPrice);
    console.log('📱 Telegram Chat ID:', this.telegramChatId);
    
    alert.triggeredAt = new Date();
    alert.isActive = false;
    
    const message = `🚨 XLM Fiyat Uyarısı!\n` +
      `Hedef: $${alert.targetPrice}\n` +
      `Güncel: $${this.currentPrice.toFixed(4)}\n` +
      `Durum: ${alert.condition === 'above' ? 'Yukarı' : 'Aşağı'} geçti`;

    console.log('📝 Browser notification mesajı:', message);

    // Browser notification
    this.showBrowserNotification(message);

    // ✅ Telegram notification - Debug logları
    if (this.telegramChatId) {
      console.log('📞 Telegram mesajı gönderiliyor...');
      console.log('📱 Chat ID:', this.telegramChatId);
      console.log('💰 Fiyat:', this.currentPrice);
      console.log('🎯 Hedef:', alert.targetPrice);
      console.log('📈 Koşul:', alert.condition);
      
      try {
        const success = await telegramBot.sendPriceAlert(
          this.telegramChatId,
          this.currentPrice,
          alert.targetPrice,
          alert.condition
        );
        console.log('📊 Telegram gönderim sonucu:', success);
        
        if (success) {
          console.log('✅ Telegram uyarısı başarıyla gönderildi!');
        } else {
          console.error('❌ Telegram uyarısı gönderilemedi!');
        }
      } catch (error) {
        console.error('❌ Telegram uyarısı exception:', error);
      }
    } else {
      console.warn('⚠️ Telegram Chat ID boş, mesaj gönderilmiyor!');
      console.log('💡 Chat ID ayarlamak için setTelegramChatId() kullanın');
    }

    // Custom event
    if (typeof window !== 'undefined') {
      console.log('📡 Custom event tetikleniyor...');
      window.dispatchEvent(new CustomEvent('priceAlert', {
        detail: { alert, currentPrice: this.currentPrice, message }
      }));
    }

    // Alert'leri kaydet
    this.saveAlertsToStorage();
    console.log('💾 Alert durumu kaydedildi');
  }

  // Browser notification
  private showBrowserNotification(message: string): void {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      console.log('🔔 Browser notification gösteriliyor');
      new Notification('XLM Fiyat Uyarısı', {
        body: message,
        icon: '/xlm-icon.png'
      });
    } else {
      console.log('🔕 Browser notification izni yok veya desteklenmiyor');
    }
  }

  // Notification permission
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
    const activeAlerts = this.alerts.filter(alert => alert.isActive);
    return activeAlerts;
  }
}

export const priceTracker = new PriceTracker();