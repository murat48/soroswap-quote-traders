// class TelegramBot {
//   private botToken: string;
//   private baseURL: string;

//   constructor() {
//     this.botToken = process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN || '';
//     this.baseURL = `https://api.telegram.org/bot${this.botToken}`;
//   }

//   // Fiyat uyarısı mesajı gönder
//   async sendPriceAlert(chatId: string, price: number, targetPrice: number, condition: string): Promise<boolean> {
//     if (!this.botToken || !chatId) {
//       console.log('⚠️ Telegram bot token veya chat ID eksik');
//       return false;
//     }

//     try {
//       const emoji = condition === 'above' ? '📈' : '📉';
//       const direction = condition === 'above' ? 'YÜKSELDİ' : 'DÜŞTÜ';
      
//       const message = `🚨 XLM FİYAT UYARISI 🚨

// ${emoji} Fiyat ${direction}!

// 💰 Güncel: $${price.toFixed(4)}
// 🎯 Hedef: $${targetPrice}
// ⏰ ${new Date().toLocaleString('tr-TR')}

// 🌟 Stellar takibine devam!`;

//       const response = await fetch(`${this.baseURL}/sendMessage`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//           chat_id: chatId,
//           text: message
//         })
//       });

//       if (response.ok) {
//         console.log('✅ Telegram mesajı gönderildi');
//         return true;
//       } else {
//         console.error('❌ Telegram API hatası:', await response.text());
//         return false;
//       }
//     } catch (error) {
//       console.error('❌ Telegram gönderme hatası:', error);
//       return false;
//     }
//   }

//   // Test mesajı
//   async sendTestMessage(chatId: string, currentPrice: number): Promise<boolean> {
//     if (!this.botToken || !chatId) return false;

//     const message = `🧪 TEST MESAJI

// ✅ Bot çalışıyor!
// 💰 XLM: $${currentPrice.toFixed(4)}
// ⏰ ${new Date().toLocaleString('tr-TR')}`;

//     try {
//       const response = await fetch(`${this.baseURL}/sendMessage`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//           chat_id: chatId,
//           text: message
//         })
//       });

//       return response.ok;
//     } catch (error) {
//       console.error('Test mesajı hatası:', error);
//       return false;
//     }
//   }
// }

// export const telegramBot = new TelegramBot();

// src/lib/telegram.ts - Debug version
class TelegramBot {
  private botToken: string;
  private baseURL: string;

  constructor() {
    this.botToken = '8276841624:AAFcFlgiXkhZ1UpUSujWWRNGQgX59DkWqSY';
    this.baseURL = `https://api.telegram.org/bot${this.botToken}`;
    console.log('🤖 TelegramBot oluşturuldu, token:', this.botToken.substring(0, 10) + '...');
  }

  // Fiyat uyarısı mesajı gönder
  async sendPriceAlert(chatId: string, price: number, targetPrice: number, condition: string): Promise<boolean> {
    console.log('📢 sendPriceAlert çağrıldı:', { chatId, price, targetPrice, condition });
    
    if (!chatId) {
      console.error('❌ Chat ID eksik!');
      return false;
    }

    try {
      const emoji = condition === 'above' ? '📈' : '📉';
      const direction = condition === 'above' ? 'YÜKSELDİ' : 'DÜŞTÜ';
      
      const message = `🚨 XLM FİYAT UYARISI 🚨

${emoji} Fiyat ${direction}!

💰 Güncel: $${price.toFixed(4)}
🎯 Hedef: $${targetPrice}
⏰ ${new Date().toLocaleString('tr-TR')}

🌟 Stellar takibine devam!`;

      console.log('📝 Gönderilecek mesaj:', message);
      console.log('📡 API URL:', `${this.baseURL}/sendMessage`);

      const response = await fetch(`${this.baseURL}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: message
        })
      });

      console.log('📊 Response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Telegram mesajı başarıyla gönderildi:', result);
        return true;
      } else {
        const errorText = await response.text();
        console.error('❌ Telegram API hatası:', errorText);
        return false;
      }
    } catch (error) {
      console.error('❌ Telegram gönderme hatası:', error);
      return false;
    }
  }

  // Test mesajı
  async sendTestMessage(chatId: string, currentPrice: number): Promise<boolean> {
    console.log('🧪 Test mesajı gönderiliyor, Chat ID:', chatId);
    
    if (!chatId) {
      console.error('❌ Test için Chat ID eksik!');
      return false;
    }

    const message = `🧪 TEST MESAJI

✅ Bot çalışıyor!
🤖 Bot: @mrt_price_bot  
💰 XLM: $${currentPrice.toFixed(4)}
⏰ ${new Date().toLocaleString('tr-TR')}

🎯 Fiyat uyarıları hazır!`;

    try {
      const response = await fetch(`${this.baseURL}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: message
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Test mesajı gönderildi:', result);
        return true;
      } else {
        const errorText = await response.text();
        console.error('❌ Test mesajı hatası:', errorText);
        return false;
      }
    } catch (error) {
      console.error('❌ Test mesajı exception:', error);
      return false;
    }
  }

  // Genel mesaj gönderme fonksiyonu
  async sendMessage(chatId: string, message: string): Promise<boolean> {
    console.log('📨 Mesaj gönderiliyor, Chat ID:', chatId);
    
    if (!chatId) {
      console.error('❌ Chat ID eksik!');
      return false;
    }

    try {
      const response = await fetch(`${this.baseURL}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: message
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Mesaj gönderildi:', result);
        return true;
      } else {
        const errorText = await response.text();
        console.error('❌ Mesaj gönderim hatası:', errorText);
        return false;
      }
    } catch (error) {
      console.error('❌ Mesaj gönderimi exception:', error);
      return false;
    }
  }
}

export const telegramBot = new TelegramBot();