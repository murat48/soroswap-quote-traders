// import { TelegramSetup } from '@/components/telegram/telegram-setup';

// // Sayfanın içinde TelegramSetup component'ini ekleyin:
// <div className="lg:col-span-2">
//   {/* <AlertManager
//     alerts={alerts}
//     currentPrice={currentPrice}
//     onAddAlert={addAlert}
//     onRemoveAlert={removeAlert}
//   /> */}
  
//   {/* 🆕 Telegram kurulumu */}
//   <div className="mt-6">
//     <TelegramSetup />
//   </div>
// </div>

// 'use client';

// import React from 'react';
// import { usePriceTracker } from '@/hooks/use-price-trackernew';
// import { PriceDisplay } from '@/components/price-tracker/price-display';
// import { AlertManager } from '@/components/price-tracker/alert-manager';
// import { TelegramSetup } from '@/components/telegram/telegram-setup';
// import { Button } from '@/components/ui/button';
// import { Card } from '@/components/ui/card';

// // ✅ Default export olarak React component
// export default function PriceTrackerPage() {
//   const {
//     currentPrice,
//     alerts,
//     isTracking,
//     lastUpdate,
//     error,
//     startTracking,
//     stopTracking,
//     addAlert,
//     removeAlert,
//     activeAlerts
//   } = usePriceTracker();

//   return (
//     <div className="py-8">
//       <div className="max-w-4xl mx-auto px-4 space-y-6">
//         <div className="text-center mb-8">
//           <h1 className="text-4xl font-bold text-gray-800 mb-2">
//             🚀 XLM Fiyat Takipçisi
//           </h1>
//           <p className="text-gray-600">
//             Stellar Lumens fiyatını takip edin ve otomatik uyarılar alın
//           </p>
//         </div>

//         {/* Hata Durumu */}
//         {error && (
//           <Card className="bg-red-50 border border-red-200">
//             <div className="text-red-700">
//               <strong>Hata:</strong> {error}
//             </div>
//           </Card>
//         )}

//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//           {/* Sol Panel - Fiyat ve Kontroller */}
//           <div className="space-y-4">
//             <PriceDisplay
//               price={currentPrice}
//               lastUpdate={lastUpdate}
//               isTracking={isTracking}
//             />

//             {/* Takip Kontrolleri */}
//             <Card title="Takip Kontrolleri">
//               <div className="space-y-3">
//                 {!isTracking ? (
//                   <Button
//                     onClick={() => startTracking(30000)}
//                     variant="success"
//                     className="w-full"
//                   >
//                     ▶️ Takibi Başlat (30s)
//                   </Button>
//                 ) : (
//                   <Button
//                     onClick={stopTracking}
//                     variant="error"
//                     className="w-full"
//                   >
//                     ⏹️ Takibi Durdur
//                   </Button>
//                 )}
                
//                 <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
//                   <div>🔄 Aktif Uyarı: {activeAlerts.length}</div>
//                   <div>📊 Toplam Uyarı: {alerts.length}</div>
//                 </div>
//               </div>
//             </Card>

//             {/* Hızlı Uyarılar */}
//             <Card title="Hızlı Uyarı Şablonları">
//               <div className="space-y-2">
//                 <Button
//                   onClick={() => addAlert(currentPrice * 1.05, 'above')}
//                   size="sm"
//                   className="w-full text-xs"
//                   disabled={currentPrice === 0}
//                 >
//                   +5% Artış Uyarısı
//                 </Button>
//                 <Button
//                   onClick={() => addAlert(currentPrice * 0.95, 'below')}
//                   size="sm"
//                   className="w-full text-xs"
//                   disabled={currentPrice === 0}
//                 >
//                   -5% Düşüş Uyarısı
//                 </Button>
//                 <Button
//                   onClick={() => addAlert(0.15, 'above')}
//                   size="sm"
//                   className="w-full text-xs"
//                 >
//                   $0.15 Hedefi
//                 </Button>
//               </div>
//             </Card>
//           </div>

//           {/* Sağ Panel - Alert Yönetimi */}
//           <div className="lg:col-span-2 space-y-6">
//             <AlertManager
//               alerts={alerts}
//               currentPrice={currentPrice}
//               onAddAlert={addAlert}
//               onRemoveAlert={removeAlert}
//             />

//             {/* Telegram Bot Kurulumu */}
//             <TelegramSetup />
//           </div>
//         </div>

//         {/* Kullanım Talimatları */}
//         <Card title="📘 Nasıl Kullanılır?" className="bg-blue-50">
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
//             <div>
//               <h4 className="font-semibold mb-2">1️⃣ Takibi Başlatın</h4>
//               <p className="text-gray-600">
//                 Takibi Başlat butonuna tıklayın. Her 30 saniyede bir fiyat güncellenecek.
//               </p>
//             </div>
//             <div>
//               <h4 className="font-semibold mb-2">2️⃣ Uyarı Ekleyin</h4>
//               <p className="text-gray-600">
//                 Hedef fiyat belirleyin ve yukarı/aşağı koşulu seçin.
//               </p>
//             </div>
//             <div>
//               <h4 className="font-semibold mb-2">3️⃣ Telegram Kurun</h4>
//               <p className="text-gray-600">
//                 ✅ Bot hazır! Sadece @userinfobottan Chat ID alın ve girin.
//               </p>
//             </div>
//             <div>
//               <h4 className="font-semibold mb-2">4️⃣ Takip Edin</h4>
//               <p className="text-gray-600">
//                 Uyarılar hem browserda hem Telegramda gelecek!
//               </p>
//             </div>
//           </div>
//         </Card>

//         {/* Telegram Kurulum Rehberi */}
//         <Card title="📱 Telegram Kurulum Rehberi" className="bg-green-50 border-green-200">
//           <div className="space-y-4">
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//               <div>
//                 <h4 className="font-semibold mb-3 text-green-800">🎯 Hızlı Kurulum:</h4>
//                 <ol className="list-decimal list-inside space-y-2 text-sm">
//                   <li className="flex items-start gap-2">
//                     <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-mono">
//                       ✅
//                     </span>
//                     <span>Bot token hazır!</span>
//                   </li>
//                   <li className="flex items-start gap-2">
//                     <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-mono">
//                       2
//                     </span>
//                     <span>
//                       <strong>@userinfobot</strong>a mesaj atın
//                     </span>
//                   </li>
//                   <li className="flex items-start gap-2">
//                     <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-mono">
//                       3
//                     </span>
//                     <span>Chat IDnizi kopyalayın (örn: 123456789)</span>
//                   </li>
//                   <li className="flex items-start gap-2">
//                     <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-mono">
//                       4
//                     </span>
//                     <span>Yukarıdaki forma yapıştırın ve test edin</span>
//                   </li>
//                 </ol>
//               </div>
              
//               <div>
//                 <h4 className="font-semibold mb-3 text-green-800">💡 Telegram Avantajları:</h4>
//                 <ul className="space-y-2 text-sm">
//                   <li className="flex items-center gap-2">
//                     <span className="text-green-500">✅</span>
//                     <span>Telefon kapalı olsa bile bildirim</span>
//                   </li>
//                   <li className="flex items-center gap-2">
//                     <span className="text-green-500">✅</span>
//                     <span>Push notificationdan daha güvenilir</span>
//                   </li>
//                   <li className="flex items-center gap-2">
//                     <span className="text-green-500">✅</span>
//                     <span>Mesaj geçmişi saklanır</span>
//                   </li>
//                   <li className="flex items-center gap-2">
//                     <span className="text-green-500">✅</span>
//                     <span>Çoklu cihaz desteği</span>
//                   </li>
//                   <li className="flex items-center gap-2">
//                     <span className="text-green-500">✅</span>
//                     <span>Tamamen ücretsiz</span>
//                   </li>
//                 </ul>
//               </div>
//             </div>

//             {/* Örnek mesaj */}
//             <div className="bg-white p-4 rounded-lg border-2 border-green-200">
//               <h5 className="font-semibold mb-2 text-green-800">📨 Örnek Telegram Uyarısı:</h5>
//               <div className="bg-gray-100 p-3 rounded font-mono text-sm">
//                 🚨 XLM FİYAT UYARISI 🚨<br/><br/>
//                 📈 Fiyat YÜKSELDİ!<br/><br/>
//                 💰 Güncel: $0.1250<br/>
//                 🎯 Hedef: $0.1200<br/>
//                 ⏰ 25.07.2025 14:30:15<br/><br/>
//                 🌟 Stellar takibine devam!
//               </div>
//             </div>
//           </div>
//         </Card>
//       </div>
//     </div>
//   );
// }


// 'use client';

// import React, { useEffect, useState } from 'react';
// import { usePriceTracker } from '@/hooks/use-price-trackernew';
// import { PriceDisplay } from '@/components/price-tracker/price-display';
// import { AlertManager } from '@/components/price-tracker/alert-manager';

// import { TelegramSetup } from '@/components/telegram/telegram-setup';
// import { Button } from '@/components/ui/button';
// import { Card } from '@/components/ui/card';

// // ✅ Default export olarak React component
// export default function PriceTrackerPage() {
//   const {
//     currentPrice,
//     alerts,
//     isTracking,
//     lastUpdate,
//     error,
//     startTracking,
//     stopTracking,
//     addAlert,
//     removeAlert,
//     activeAlerts
//   } = usePriceTracker();

//   // Telegram bot instance'ı için
//   // eslint-disable-next-line @typescript-eslint/no-explicit-any
//   const [telegramBot, setTelegramBot] = useState<any>(null);
//   const [telegramChatId, setTelegramChatIdState] = useState<string>('');

//   // Telegram bot'u yükle
//   useEffect(() => {
//     const loadTelegramBot = async () => {
//       if (typeof window !== 'undefined') {
//         try {
//           const { telegramBot: bot } = await import('@/lib/telegram');
//           setTelegramBot(bot);
          
//           // Chat ID'yi localStorage'dan yükle
//           const storedChatId = localStorage.getItem('telegram_chat_id');
//           if (storedChatId) {
//             setTelegramChatIdState(storedChatId);
//           }
//         } catch (error) {
//           console.error('Telegram bot yükleme hatası:', error);
//         }
//       }
//     };

//     loadTelegramBot();
//   }, []);

//   // Chat ID değişikliklerini dinle
//   const handleChatIdChange = (chatId: string) => {
//     setTelegramChatIdState(chatId);
//     if (typeof window !== 'undefined') {
//       localStorage.setItem('telegram_chat_id', chatId);
//     }
//   };

//   // 🆕 Alert değişikliklerini dinle ve Telegram mesajı gönder
//   useEffect(() => {
//     const sendTelegramAlert = async () => {
//       // Telegram bot ve Chat ID kontrolü
//       if (!telegramBot || !telegramChatId) {
//         return;
//       }

//       // Yeni tetiklenmiş alert'leri bul
//       const recentlyTriggered = alerts.filter(alert => {
//         if (!alert.triggeredAt) return false;
        
//         // Son 5 saniye içinde tetiklenmiş mi?
//         const now = new Date();
//         const triggerTime = new Date(alert.triggeredAt);
//         const diffMs = now.getTime() - triggerTime.getTime();
        
//         return diffMs < 5000; // 5 saniye
//       });

//       // Yeni tetiklenen alert'ler varsa Telegram mesajı gönder
//       for (const alert of recentlyTriggered) {
//         try {
//           console.log('📱 Otomatik Telegram uyarısı gönderiliyor...', alert);
          
//           const success = await telegramBot.sendPriceAlert(
//             telegramChatId,
//             currentPrice,
//             alert.targetPrice,
//             alert.condition
//           );

//           if (success) {
//             console.log('✅ Otomatik Telegram uyarısı gönderildi!');
//           } else {
//             console.error('❌ Otomatik Telegram uyarısı gönderilemedi');
//           }
//         } catch (error) {
//           console.error('❌ Telegram gönderim hatası:', error);
//         }
//       }
//     };

//     sendTelegramAlert();
//   }, [alerts, telegramBot, telegramChatId, currentPrice]);

//   // Test mesajı gönder
//   const sendTestMessage = async () => {
//     if (!telegramBot || !telegramChatId) {
//       alert('❌ Telegram bot veya Chat ID bulunamadı!');
//       return;
//     }

//     try {
//       console.log('🧪 Test mesajı gönderiliyor...');
//       const success = await telegramBot.sendTestMessage(telegramChatId, currentPrice);
      
//       if (success) {
//         alert('✅ Test mesajı Telegram\'a gönderildi!');
//       } else {
//         alert('❌ Test mesajı gönderilemedi!');
//       }
//     } catch (error) {
//       alert('❌ Hata: ' + (error as Error).message);
//     }
//   };

//   return (
//     <div className="py-8">
//       <div className="max-w-4xl mx-auto px-4 space-y-6">
//         <div className="text-center mb-8">
//           <h1 className="text-4xl font-bold text-gray-800 mb-2">
//             🚀 XLM Fiyat Takipçisi
//           </h1>
//           <p className="text-gray-600">
//             Stellar Lumens fiyatını takip edin ve otomatik uyarılar alın
//           </p>
//         </div>

//         {/* Hata Durumu */}
//         {error && (
//           <Card className="bg-red-50 border border-red-200">
//             <div className="text-red-700">
//               <strong>Hata:</strong> {error}
//             </div>
//           </Card>
//         )}

//         {/* Telegram Durumu */}
//         <Card className={`border ${telegramBot && telegramChatId ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
//           <div className="text-sm">
//             <strong>📱 Telegram Durumu:</strong>
//             <div className="mt-1">
//               <span className={`inline-block w-2 h-2 rounded-full mr-2 ${telegramBot ? 'bg-green-500' : 'bg-red-500'}`}></span>
//               Bot: {telegramBot ? '✅ Yüklendi' : '❌ Yüklenmedi'}
//             </div>
//             <div>
//               <span className={`inline-block w-2 h-2 rounded-full mr-2 ${telegramChatId ? 'bg-green-500' : 'bg-red-500'}`}></span>
//               Chat ID: {telegramChatId ? `✅ ${telegramChatId}` : '❌ Girilmedi'}
//             </div>
//           </div>
//         </Card>

//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//           {/* Sol Panel - Fiyat ve Kontroller */}
//           <div className="space-y-4">
//             <PriceDisplay
//               price={currentPrice}
//               lastUpdate={lastUpdate}
//               isTracking={isTracking}
//             />

//             {/* Takip Kontrolleri */}
//             <Card title="Takip Kontrolleri">
//               <div className="space-y-3">
//                 {!isTracking ? (
//                   <Button
//                     onClick={() => startTracking(30000)}
//                     variant="success"
//                     className="w-full"
//                   >
//                     ▶️ Takibi Başlat (30s)
//                   </Button>
//                 ) : (
//                   <Button
//                     onClick={stopTracking}
//                     variant="error"
//                     className="w-full"
//                   >
//                     ⏹️ Takibi Durdur
//                   </Button>
//                 )}
                
//                 <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
//                   <div>🔄 Aktif Uyarı: {activeAlerts.length}</div>
//                   <div>📊 Toplam Uyarı: {alerts.length}</div>
//                 </div>
//               </div>
//             </Card>

//             {/* Hızlı Uyarılar */}
//             <Card title="Hızlı Uyarı Şablonları">
//               <div className="space-y-2">
//                 <Button
//                   onClick={() => addAlert(currentPrice * 1.05, 'above')}
//                   size="sm"
//                   className="w-full text-xs"
//                   disabled={currentPrice === 0}
//                 >
//                   +5% Artış Uyarısı
//                 </Button>
//                 <Button
//                   onClick={() => addAlert(currentPrice * 0.95, 'below')}
//                   size="sm"
//                   className="w-full text-xs"
//                   disabled={currentPrice === 0}
//                 >
//                   -5% Düşüş Uyarısı
//                 </Button>
//                 <Button
//                   onClick={() => addAlert(0.15, 'above')}
//                   size="sm"
//                   className="w-full text-xs"
//                 >
//                   $0.15 Hedefi
//                 </Button>
//               </div>
//             </Card>

//             {/* Test Paneli */}
//             <Card title="🧪 Test Paneli" className="bg-blue-50">
//               <div className="space-y-2">
//                 <Button
//                   onClick={sendTestMessage}
//                   className="w-full"
//                   disabled={!telegramBot || !telegramChatId}
//                 >
//                   📱 Telegram Test Mesajı
//                 </Button>
//                 <Button
//                   onClick={() => {
//                     // Hemen tetiklenecek test alert
//                     const testPrice = currentPrice > 0 ? currentPrice - 0.001 : 0.1;
//                     addAlert(testPrice, 'above');
//                     console.log('🚨 Test alert eklendi, Telegram mesajı gelecek!');
//                   }}
//                   className="w-full"
//                   disabled={currentPrice === 0 || !telegramBot || !telegramChatId}
//                 >
//                   🚨 Test Alert + Telegram
//                 </Button>
//               </div>
//             </Card>
//           </div>

//           {/* Sağ Panel - Alert Yönetimi */}
//           <div className="lg:col-span-2 space-y-6">
//             <AlertManager
//               alerts={alerts}
//               currentPrice={currentPrice}
//               onAddAlert={addAlert}
//               onRemoveAlert={removeAlert}
//             />

//             {/* Telegram Bot Kurulumu */}
//             <Card title="📱 Telegram Bot Kurulumu">
//               <div className="space-y-4">
//                 <div>
//                   <label className="block text-sm font-medium mb-1">
//                     Telegram Chat ID
//                   </label>
//                   <input
//                     type="text"
//                     value={telegramChatId}
//                     onChange={(e) => handleChatIdChange(e.target.value)}
//                     className="input-field"
//                     placeholder="123456789 veya @username"
//                   />
//                   <p className="text-xs text-gray-500 mt-1">
//                     @userinfobot kullanarak Chat IDnizi öğrenin
//                   </p>
//                 </div>

//                 <div className="bg-blue-50 p-3 rounded text-sm">
//                   <h4 className="font-semibold mb-2">📋 Kurulum:</h4>
//                   <ol className="list-decimal list-inside space-y-1">
//                     <li>✅ Bot token hazır!</li>
//                     <li>@userinfobottan Chat ID alın</li>
//                     <li>Yukarı girin</li>
//                     <li>🧪 Test butonlarını deneyin</li>
//                     <li>🚨 Otomatik uyarılar gelecek!</li>
//                   </ol>
//                 </div>
//               </div>
//             </Card>
//           </div>
//         </div>

//         {/* Kullanım Talimatları */}
//         <Card title="📘 Nasıl Kullanılır?" className="bg-blue-50">
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
//             <div>
//               <h4 className="font-semibold mb-2">1️⃣ Takibi Başlatın</h4>
//               <p className="text-gray-600">
//                 Takibi Başlat butonuna tıklayın. Her 30 saniyede bir fiyat güncellenecek.
//               </p>
//             </div>
//             <div>
//               <h4 className="font-semibold mb-2">2️⃣ Uyarı Ekleyin</h4>
//               <p className="text-gray-600">
//                 Hedef fiyat belirleyin ve yukarı/aşağı koşulu seçin.
//               </p>
//             </div>
//             <div>
//               <h4 className="font-semibold mb-2">3️⃣ Telegram Kurun</h4>
//               <p className="text-gray-600">
//                 ✅ Bot hazır! Sadece @userinfobottan Chat ID alın ve girin.
//               </p>
//             </div>
//             <div>
//               <h4 className="font-semibold mb-2">4️⃣ Otomatik Uyarılar</h4>
//               <p className="text-gray-600">
//                 🤖 Artık uyarılar otomatik olarak Telegrama gelecek!
//               </p>
//             </div>
//           </div>
//         </Card>

//         {/* Özellikler */}
//         <Card title="🆕 Yeni Özellikler" className="bg-green-50 border-green-200">
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
//             <div>
//               <h4 className="font-semibold mb-2 text-green-800">🤖 Otomatik Telegram:</h4>
//               <ul className="space-y-1 text-green-700">
//                 <li>✅ Alert tetiklendiğinde otomatik mesaj</li>
//                 <li>✅ 5 saniye içinde tespit ve gönderim</li>
//                 <li>✅ Test butonları ile kolay deneme</li>
//                 <li>✅ Durumu canlı takip</li>
//               </ul>
//             </div>
//             <div>
//               <h4 className="font-semibold mb-2 text-green-800">🔧 Debug Paneli:</h4>
//               <ul className="space-y-1 text-green-700">
//                 <li>✅ Telegram bot durumu görünür</li>
//                 <li>✅ Chat ID kontrolü</li>
//                 <li>✅ Test mesajı butonları</li>
//                 <li>✅ Console logları detaylı</li>
//               </ul>
//             </div>
//           </div>
//         </Card>
//       </div>
//     </div>
//   );
// }


'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { usePriceTracker } from '@/hooks/use-price-trackernew';
import { PriceDisplay } from '@/components/price-tracker/price-display';
import { AlertManager } from '@/components/price-tracker/alert-manager';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useFreighter } from '@/hooks/use-freighter';
import { soroswapAPI } from '@/lib/api';
import Link from 'next/link';

// ✅ Default export olarak React component
export default function PriceTrackerPage() {
  const {
    currentPrice,
    alerts,
    isTracking,
    lastUpdate,
    error,
    startTracking,
    stopTracking,
    addAlert,
    removeAlert,
    activeAlerts
  } = usePriceTracker();

  // Telegram bot instance'ı için
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [telegramBot, setTelegramBot] = useState<any>(null);
  const [telegramChatId, setTelegramChatIdState] = useState<string>('');

  // Freighter wallet bağlantısı
  const freighter = useFreighter();
  const { isAvailable, isConnected, publicKey, connect, signTransaction, error: freighterError } = freighter;

  // Otomatik alım-satım state'leri
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [tradeAmount, setTradeAmount] = useState<string>('');
  const [tradeStatus, setTradeStatus] = useState<string | null>(null);
  const [isTrading, setIsTrading] = useState<boolean>(false);

  // Fiyat bazlı otomatik alım-satım state'leri
  const [buyTargetPrice, setBuyTargetPrice] = useState<string>('');
  const [sellTargetPrice, setSellTargetPrice] = useState<string>('');
  const [autoBuyAmount, setAutoBuyAmount] = useState<string>('');
  const [autoSellAmount, setAutoSellAmount] = useState<string>('');
  const [isAutoTradingEnabled, setIsAutoTradingEnabled] = useState<boolean>(false);
  const [autoTradeStatus, setAutoTradeStatus] = useState<string | null>(null);
  const lastAutoTradeCheck = useRef<Date | null>(null);
  
  // 🆕 Hata sonrası otomatik durdurma için state'ler
  const [hasAutoTradeError, setHasAutoTradeError] = useState<boolean>(false);
  const [lastErrorTime, setLastErrorTime] = useState<Date | null>(null);

  // Telegram bot'u yükle
  useEffect(() => {
    const loadTelegramBot = async () => {
      if (typeof window !== 'undefined') {
        try {
          const { telegramBot: bot } = await import('@/lib/telegram');
          setTelegramBot(bot);
          
          // Chat ID'yi localStorage'dan yükle
          const storedChatId = localStorage.getItem('telegram_chat_id');
          if (storedChatId) {
            setTelegramChatIdState(storedChatId);
          }
        } catch (error) {
          console.error('Telegram bot yükleme hatası:', error);
        }
      }
    };

    loadTelegramBot();
  }, []);

  // Chat ID değişikliklerini dinle
  const handleChatIdChange = (chatId: string) => {
    setTelegramChatIdState(chatId);
    if (typeof window !== 'undefined') {
      localStorage.setItem('telegram_chat_id', chatId);
    }
  };

  // 🆕 Alert değişikliklerini dinle ve Telegram mesajı gönder
  useEffect(() => {
    const sendTelegramAlert = async () => {
      // Telegram bot ve Chat ID kontrolü
      if (!telegramBot || !telegramChatId) {
        return;
      }

      // Yeni tetiklenmiş alert'leri bul
      const recentlyTriggered = alerts.filter(alert => {
        if (!alert.triggeredAt) return false;
        
        // Son 2 saniye içinde tetiklenmiş mi? (daha hızlı)
        const now = new Date();
        const triggerTime = new Date(alert.triggeredAt);
        const diffMs = now.getTime() - triggerTime.getTime();
        
        return diffMs < 2000; // 2 saniye (daha hızlı)
      });

      // Yeni tetiklenen alert'ler varsa Telegram mesajı gönder
      for (const alert of recentlyTriggered) {
        try {
          console.log('📱 Otomatik Telegram uyarısı gönderiliyor...', alert);
          
          // Paralel gönderim için Promise kullan
          telegramBot.sendPriceAlert(
            telegramChatId,
            currentPrice,
            alert.targetPrice,
            alert.condition
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ).then((success: any) => {
            if (success) {
              console.log('✅ Otomatik Telegram uyarısı gönderildi!');
            } else {
              console.error('❌ Otomatik Telegram uyarısı gönderilemedi');
            }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          }).catch((error: any) => {
            console.error('❌ Telegram gönderim hatası:', error);
          });
        } catch (error) {
          console.error('❌ Telegram gönderim hatası:', error);
        }
      }
    };

    // Hemen çalıştır (timeout yok)
    sendTelegramAlert();
  }, [alerts, telegramBot, telegramChatId, currentPrice]);

  // Otomatik işlem gerçekleştirme fonksiyonu
  const executeAutoTrade = useCallback(async (type: 'buy' | 'sell', amount: string) => {
    setIsTrading(true);
    
    try {
      setAutoTradeStatus(`🔄 Otomatik ${type === 'buy' ? 'alım' : 'satım'} işlemi başlatılıyor...`);

      if (!publicKey) {
        throw new Error('Cüzdan adresi alınamadı.');
      }

      // Miktar validasyonu
      const numAmount = parseFloat(amount);
      if (isNaN(numAmount) || numAmount < 1) {
        throw new Error('Minimum 1 XLM gereklidir.');
      }

      // XLM/USDC pair'i için doğru adresler (Testnet)
      const XLM_ADDRESS = 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC';
      const USDC_ADDRESS = 'CBBHRKEP5M3NUDRISGLJKGHDHX3DA2CN2AZBQY6WLVUJ7VNLGSKBDUCM';

      // Miktar doğru decimals ile çarpılacak (XLM 7 decimals)
      const tradeAmountScaled = (numAmount * Math.pow(10, 7)).toString();

      // Quote isteği
      const quoteRequest = {
        assetIn: type === 'buy' ? USDC_ADDRESS : XLM_ADDRESS,
        assetOut: type === 'buy' ? XLM_ADDRESS : USDC_ADDRESS,
        amount: tradeAmountScaled,
        tradeType: 'EXACT_IN' as const,
        protocols: ['soroswap'],
        slippageTolerance: 500,
        parts: 50,
  maxHops: 1,
  feeBps: 50,
         // %10 slippage (daha yüksek)
      };
  //     slippageTolerance: 500,
  //       parts: 50,
  // maxHops: 1,
  // feeBps: 50,
      console.log('Otomatik İşlem Quote Request:', quoteRequest);
      
      try {
        const quote = await soroswapAPI.getQuote(quoteRequest);
        console.log('Quote Response:', quote);
        
        setAutoTradeStatus(`🔨 Otomatik ${type === 'buy' ? 'alım' : 'satım'} işlemi oluşturuluyor...`);

        // Transaction oluştur
        const buildRequest = {
          quote: quote,
          referralId: "GALAXYVOIDAOPZTDLHILAJQKCVVFMD4IKLXLSZV5YHO7VY74IWZILUTO",
          sponsor: "GDISPX62G6EGBZX3I2VMB4J3O3CPFHHRAJ4QZNOYVXYVHJ6BVRL2A3Y3",
          from: publicKey,
                  slippageTolerancePercent: true,

        };

        console.log('Build Request:', buildRequest);
        const buildResponse = await soroswapAPI.buildTransaction(buildRequest);
        console.log('Build Response:', buildResponse);
        
        setAutoTradeStatus(`✍️ Otomatik ${type === 'buy' ? 'alım' : 'satım'} işlemi imzalanıyor...`);

        // İşlemi imzala
        const signedXdr = await signTransaction(buildResponse.xdr);
        
        setAutoTradeStatus(`📤 Otomatik ${type === 'buy' ? 'alım' : 'satım'} işlemi gönderiliyor...`);

        // İşlemi gönder
        const sendRequest = { xdr: signedXdr };
        const sendResponse = await soroswapAPI.sendTransaction(sendRequest);
        console.log('Send Response:', sendResponse);
        
        setAutoTradeStatus(`✅ Otomatik ${type === 'buy' ? 'alım' : 'satım'} başarılı! 
          Miktar: ${amount} XLM
          Fiyat: $${currentPrice.toFixed(4)}
          Hash: ${sendResponse.hash || 'N/A'}`);

        // Telegram bildirimi gönder
        if (telegramBot && telegramChatId) {
          try {
            const message = `🤖 OTOMATİK TRADE TAMAMLANDI!
${type === 'buy' ? '💰 ALIM' : '💸 SATIM'} İŞLEMİ BAŞARILI
📊 Tetiklenen Fiyat: $${type === 'buy' ? buyTargetPrice : sellTargetPrice}
💵 Gerçekleşen Fiyat: $${currentPrice.toFixed(4)}
💰 Miktar: ${amount} XLM
🆔 Hash: ${sendResponse.hash || 'N/A'}
⏰ ${new Date().toLocaleString('tr-TR')}`;
            
            await telegramBot.sendMessage(telegramChatId, message);
          } catch (telegramError) {
            console.error('Telegram bildirim hatası:', telegramError);
          }
        }

        // Başarılı işlem sonrası hedef fiyatları temizle
        if (type === 'buy') {
          setBuyTargetPrice('');
          setAutoBuyAmount('');
        } else {
          setSellTargetPrice('');
          setAutoSellAmount('');
        }
        
        // Başarılı işlem sonrası hata state'ini temizle
        setHasAutoTradeError(false);
        setLastErrorTime(null);
        
      } catch (apiError: unknown) {
        console.error('API Hatası:', apiError);
        
        // Özel hata mesajları
        const errorMessage = (apiError as Error)?.message || String(apiError) || 'Bilinmeyen hata';
        if (errorMessage.includes('RouterInsufficientOutputAmount')) {
          throw new Error(`Yetersiz likidite! Bu miktar için yeterli XLM/USDC bulunmuyor. Daha küçük miktar deneyin.`);
        } else if (errorMessage.includes('RouterError')) {
          throw new Error(`Router hatası: ${errorMessage}. Lütfen daha sonra tekrar deneyin.`);
        } else {
          throw new Error(`API Hatası: ${errorMessage}`);
        }
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
      setAutoTradeStatus(`❌ Otomatik ${type === 'buy' ? 'alım' : 'satım'} hatası: ${errorMessage}
      
🛑 OTOMATİK İŞLEM DURDURULDU
Manuel olarak tekrar aktifleştirin.`);
      console.error('Otomatik işlem hatası:', error);
      
      // 🆕 Hata sonrası otomatik işlemi durdur
      setHasAutoTradeError(true);
      setLastErrorTime(new Date());
      setIsAutoTradingEnabled(false); // Otomatik işlemi durdur
      
      // 🆕 Hata durumunda da textbox'ları temizle
      if (type === 'buy') {
        setBuyTargetPrice('');
        setAutoBuyAmount('');
      } else {
        setSellTargetPrice('');
        setAutoSellAmount('');
      }
      
      // Telegram'a hata bildirimi gönder
      if (telegramBot && telegramChatId) {
        try {
          const message = `🚨 OTOMATİK İŞLEM HATASI!
❌ ${type === 'buy' ? 'ALIM' : 'SATIM'} İŞLEMİ BAŞARISIZ
📊 Hedef Fiyat: $${type === 'buy' ? buyTargetPrice : sellTargetPrice}
💵 Güncel Fiyat: $${currentPrice.toFixed(4)}
⚠️ Hata: ${errorMessage}
🛑 Otomatik işlem durduruldu
📋 Manuel olarak tekrar aktifleştirin
⏰ ${new Date().toLocaleString('tr-TR')}`;
          
          await telegramBot.sendMessage(telegramChatId, message);
        } catch (telegramError) {
          console.error('Telegram hata bildirim hatası:', telegramError);
        }
      }
    } finally {
      setIsTrading(false);
    }
  }, [publicKey, signTransaction, currentPrice, telegramBot, telegramChatId, buyTargetPrice, sellTargetPrice, setBuyTargetPrice, setAutoBuyAmount, setSellTargetPrice, setAutoSellAmount, setHasAutoTradeError, setLastErrorTime, setIsAutoTradingEnabled]);

  // 🆕 Fiyat bazlı otomatik alım-satım kontrolü
  useEffect(() => {
    const checkAutoTrade = async () => {
      // ⚠️ Herhangi bir işlem devam ediyorsa durdurup bekle
      if (isTrading) {
        console.log('⏳ Başka bir işlem devam ediyor, otomatik işlem bekliyor...');
        return;
      }

      // 🛑 Hata sonrası otomatik işlem durduruldu
      if (hasAutoTradeError) {
        console.log('🛑 Otomatik işlem hata nedeniyle durduruldu, manuel aktifleştirme gerekli');
        return;
      }

      if (!isAutoTradingEnabled || !isConnected || currentPrice === 0) {
        return;
      }

      const now = new Date();
      // Son kontrol 3 saniye içinde yapıldıysa tekrar kontrol etme (çok hızlı işlem önleme)
      if (lastAutoTradeCheck.current && (now.getTime() - lastAutoTradeCheck.current.getTime()) < 3000) {
        return;
      }

      lastAutoTradeCheck.current = now;

      try {
        // Alım kontrolü - sadece isTrading false ise
        if (buyTargetPrice && autoBuyAmount && currentPrice <= parseFloat(buyTargetPrice) && !isTrading) {
          setAutoTradeStatus(`🤖 Hedef alım fiyatına ulaşıldı! $${currentPrice.toFixed(4)} <= $${buyTargetPrice}`);
          console.log('🤖 Otomatik alım tetiklendi:', { currentPrice, buyTargetPrice, isTrading });
          
          await executeAutoTrade('buy', autoBuyAmount);
        }
        // else if kullanarak aynı anda sadece bir işlem yapılmasını sağlayalım
        else if (sellTargetPrice && autoSellAmount && currentPrice >= parseFloat(sellTargetPrice) && !isTrading) {
          setAutoTradeStatus(`🤖 Hedef satım fiyatına ulaşıldı! $${currentPrice.toFixed(4)} >= $${sellTargetPrice}`);
          console.log('🤖 Otomatik satım tetiklendi:', { currentPrice, sellTargetPrice, isTrading });
          
          await executeAutoTrade('sell', autoSellAmount);
        }
      } catch (error) {
        console.error('❌ Otomatik işlem kontrolü hatası:', error);
        setAutoTradeStatus(`❌ Kontrol hatası: ${(error as Error).message}`);
      }
    };

    // Fiyat değişikliklerinde kontrol et
    checkAutoTrade();
  }, [currentPrice, isAutoTradingEnabled, isConnected, buyTargetPrice, sellTargetPrice, autoBuyAmount, autoSellAmount, isTrading, executeAutoTrade, hasAutoTradeError]);

  // Test mesajı gönder
  const sendTestMessage = async () => {
    if (!telegramBot || !telegramChatId) {
      alert('❌ Telegram bot veya Chat ID bulunamadı!');
      return;
    }

    try {
      console.log('🧪 Test mesajı gönderiliyor...');
      const success = await telegramBot.sendTestMessage(telegramChatId, currentPrice);
      
      if (success) {
        alert('✅ Test mesajı Telegram\'a gönderildi!');
      } else {
        alert('❌ Test mesajı gönderilemedi!');
      }
    } catch (error) {
      alert('❌ Hata: ' + (error as Error).message);
    }
  };

  // Otomatik alım-satım fonksiyonu
  const handleAutoTrade = async () => {
    setTradeStatus(null);
    setIsTrading(true);

    try {
      // Freighter kontrolleri
      if (!isAvailable) {
        throw new Error('Freighter cüzdanı bulunamadı. Lütfen yükleyin.');
      }

      if (!isConnected) {
        setTradeStatus('🔗 Freighter&apos;a bağlanıyor...');
        await connect();
      }

      if (!publicKey) {
        throw new Error('Cüzdan adresi alınamadı.');
      }

      // Miktar kontrolü
      if (!tradeAmount || isNaN(Number(tradeAmount)) || Number(tradeAmount) < 1) {
        throw new Error('Minimum 1 XLM gereklidir.');
      }

      setTradeStatus('📊 Quote alınıyor...');

      // XLM/USDC pair'i için doğru adresler (Mainnet)
      const XLM_ADDRESS = 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC'; // XLM
      const USDC_ADDRESS = 'CA34FYW2SL7VZW5E6WIPA2NOTLGG7TNAOKQLEO5YZHVUGNRFHM4HJ7WD'; // USDC

      // Miktar doğru decimals ile çarpılacak (XLM 7 decimals)
      const amount = (parseFloat(tradeAmount) * Math.pow(10, 7)).toString();

      // Quote isteği
      const quoteRequest = {
        assetIn: tradeType === 'buy' ? USDC_ADDRESS : XLM_ADDRESS,
        assetOut: tradeType === 'buy' ? XLM_ADDRESS : USDC_ADDRESS,
        amount: amount,
        tradeType: 'EXACT_IN' as const,
        protocols: ['soroswap'],
        slippageTolerance: 500,
        feeBps:50,
          parts:50,
          maxHops:1,
   // %10 slippage (daha yüksek)
      };

      console.log('Quote Request:', quoteRequest);
      
      try {
        const quote = await soroswapAPI.getQuote(quoteRequest);
        console.log('Quote Response:', quote);
        
        setTradeStatus('🔨 İşlem oluşturuluyor...');

        // Transaction oluştur
        const buildRequest = {
          quote: quote,
          referralId: "GALAXYVOIDAOPZTDLHILAJQKCVVFMD4IKLXLSZV5YHO7VY74IWZILUTO",
          sponsor: "GDISPX62G6EGBZX3I2VMB4J3O3CPFHHRAJ4QZNOYVXYVHJ6BVRL2A3Y3",
          from: publicKey,
                  slippageTolerancePercent: true,

        };

        console.log('Build Request:', buildRequest);
        const buildResponse = await soroswapAPI.buildTransaction(buildRequest);
        console.log('Build Response:', buildResponse);
        
        setTradeStatus('✍️ İşlem imzalanıyor...');

        // İşlemi imzala
        const signedXdr = await signTransaction(buildResponse.xdr);
        setTradeStatus('📤 İşlem gönderiliyor...');

        // İşlemi gönder
        const sendRequest = {
          xdr: signedXdr,
        };

        console.log('Send Request:', sendRequest);
        const sendResponse = await soroswapAPI.sendTransaction(sendRequest);
        console.log('Send Response:', sendResponse);
        
        setTradeStatus(`✅ İşlem başarılı! 
          ${tradeType === 'buy' ? 'XLM Alındı' : 'XLM Satıldı'}
          Hash: ${sendResponse.hash || 'N/A'}`);

        // Telegram bildirimi gönder
        if (telegramBot && telegramChatId) {
          try {
            const message = `🤖 MANUEL TRADE
✅ ${tradeType === 'buy' ? '🟢 XLM ALIM' : '🔴 XLM SATIM'} BAŞARILI
💰 Miktar: ${tradeAmount} XLM
📊 Fiyat: $${currentPrice.toFixed(4)}
🆔 Hash: ${sendResponse.hash || 'N/A'}
⏰ ${new Date().toLocaleString('tr-TR')}`;
            
            await telegramBot.sendMessage(telegramChatId, message);
          } catch (telegramError) {
            console.error('Telegram bildirim hatası:', telegramError);
          }
        }
        
      } catch (apiError: unknown) {
        console.error('API Hatası:', apiError);
        
        // Özel hata mesajları
        const errorMessage = (apiError as Error)?.message || String(apiError) || 'Bilinmeyen hata';
        if (errorMessage.includes('RouterInsufficientOutputAmount')) {
          throw new Error(`Yetersiz likidite! Bu miktar için yeterli XLM/USDC bulunmuyor. Daha küçük miktar deneyin.`);
        } else if (errorMessage.includes('RouterError')) {
          throw new Error(`Router hatası: ${errorMessage}. Lütfen daha sonra tekrar deneyin.`);
        } else {
          throw new Error(`API Hatası: ${errorMessage}`);
        }
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
      setTradeStatus(`❌ Hata: ${errorMessage}`);
      console.error('Alım-satım hatası:', error);
    } finally {
      setIsTrading(false);
    }
  };

  return (
    <div className="py-8">
      <div className="max-w-4xl mx-auto px-4 space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            🚀 XLM Fiyat Takipçisi
          </h1>
          <p className="text-gray-600">
            Stellar Lumens fiyatını takip edin ve otomatik uyarılar alın
          </p>
        </div>

        {/* Hata Durumu */}
        {error && (
          <Card className="bg-red-50 border border-red-200">
            <div className="text-red-700">
              <strong>Hata:</strong> {error}
            </div>
          </Card>
        )}

        {/* Telegram Durumu */}
        <Card className={`border ${telegramBot && telegramChatId ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
          <div className="text-sm">
            <strong>📱 Telegram Durumu:</strong>
            <div className="mt-1">
              <span className={`inline-block w-2 h-2 rounded-full mr-2 ${telegramBot ? 'bg-green-500' : 'bg-red-500'}`}></span>
              Bot: {telegramBot ? '✅ Yüklendi' : '❌ Yüklenmedi'}
            </div>
            <div>
              <span className={`inline-block w-2 h-2 rounded-full mr-2 ${telegramChatId ? 'bg-green-500' : 'bg-red-500'}`}></span>
              Chat ID: {telegramChatId ? `✅ ${telegramChatId}` : '❌ Girilmedi'}
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sol Panel - Fiyat ve Kontroller */}
          <div className="space-y-4">
            <PriceDisplay
              price={currentPrice}
              lastUpdate={lastUpdate}
              isTracking={isTracking}
            />

            {/* Takip Kontrolleri */}
            <Card title="Takip Kontrolleri">
              <div className="space-y-3">
                {!isTracking ? (
                  <Button
                    onClick={() => startTracking(10000)}
                    variant="success"
                    className="w-full"
                  >
                    ▶️ Takibi Başlat (10s)
                  </Button>
                ) : (
                  <Button
                    onClick={stopTracking}
                    variant="error"
                    className="w-full"
                  >
                    ⏹️ Takibi Durdur
                  </Button>
                )}
                
                <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                  <div>🔄 Aktif Uyarı: {activeAlerts.length}</div>
                  <div>📊 Toplam Uyarı: {alerts.length}</div>
                </div>
              </div>
            </Card>

            {/* Hızlı Uyarılar */}
            <Card title="Hızlı Uyarı Şablonları">
              <div className="space-y-2">
                <Button
                  onClick={() => addAlert(currentPrice * 1.01, 'above')}
                  size="sm"
                  className="w-full text-xs"
                  disabled={currentPrice === 0}
                >
                  +1% Artış Uyarısı (Hızlı)
                </Button>
                <Button
                  onClick={() => addAlert(currentPrice * 0.99, 'below')}
                  size="sm"
                  className="w-full text-xs"
                  disabled={currentPrice === 0}
                >
                  -1% Düşüş Uyarısı (Hızlı)
                </Button>
                <Button
                  onClick={() => addAlert(0.15, 'above')}
                  size="sm"
                  className="w-full text-xs"
                >
                  $0.15 Hedefi
                </Button>
              </div>
            </Card>

            {/* Test Paneli */}
            <Card title="🧪 Test Paneli" className="bg-blue-50">
              <div className="space-y-2">
                <Button
                  onClick={sendTestMessage}
                  className="w-full"
                  disabled={!telegramBot || !telegramChatId}
                >
                  📱 Telegram Test Mesajı
                </Button>
                <Button
                  onClick={() => {
                    // Hemen tetiklenecek test alert
                    const testPrice = currentPrice > 0 ? currentPrice - 0.001 : 0.1;
                    addAlert(testPrice, 'above');
                    console.log('🚨 Test alert eklendi, Telegram mesajı gelecek!');
                  }}
                  className="w-full"
                  disabled={currentPrice === 0 || !telegramBot || !telegramChatId}
                >
                  🚨 Test Alert + Telegram
                </Button>
              </div>
              
              {/* 🆕 Debug Paneli */}
              <div className="mt-3 p-2 bg-white border rounded text-xs">
                <div className="font-medium mb-2">🔍 Sistem Debug Durumu:</div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-gray-600">Fiyat Takibi:</div>
                    <div className={`font-mono ${isTracking ? 'text-green-600' : 'text-red-600'}`}>
                      {isTracking ? '✅ Aktif' : '❌ Pasif'}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600">İşlem Durumu:</div>
                    <div className={`font-mono ${isTrading ? 'text-orange-600' : 'text-green-600'}`}>
                      {isTrading ? '⏳ Çalışıyor' : '✅ Boşta'}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600">Otomatik Sistem:</div>
                    <div className={`font-mono ${
                      hasAutoTradeError ? 'text-red-600' :
                      isAutoTradingEnabled ? 'text-green-600' : 'text-gray-600'
                    }`}>
                      {hasAutoTradeError ? '🚨 Hata' : isAutoTradingEnabled ? '🟢 Aktif' : '⚪ Pasif'}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600">Bağlantı:</div>
                    <div className={`font-mono ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                      {isConnected ? '✅ Bağlı' : '❌ Kopuk'}
                    </div>
                  </div>
                </div>
                {lastAutoTradeCheck.current && (
                  <div className="mt-2 pt-2 border-t">
                    <div className="text-gray-600">Son Kontrol:</div>
                    <div className="font-mono text-xs">
                      {lastAutoTradeCheck.current.toLocaleTimeString('tr-TR')}
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Freighter Wallet Paneli */}
            <Card title="🌌 Freighter Wallet" className="bg-purple-50 border-purple-200">
              <div className="space-y-4">
                {/* Freighter Durumu */}
                <div className="text-xs bg-white p-3 rounded border">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`w-3 h-3 rounded-full ${isAvailable ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <span className="font-medium">Freighter: {isAvailable ? '✅ Yüklü' : '❌ Yüklü değil'}</span>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <span className="font-medium">Bağlantı: {isConnected ? '✅ Bağlı' : '❌ Bağlı değil'}</span>
                  </div>
                  {publicKey && (
                    <div className="text-xs text-gray-600 mt-2 p-2 bg-gray-50 rounded">
                      <div className="font-mono break-all">
                        {publicKey.slice(0, 10)}...{publicKey.slice(-10)}
                      </div>
                    </div>
                  )}
                  {freighterError && (
                    <div className="text-xs text-red-500 mt-2 p-2 bg-red-50 rounded border border-red-200">
                      Hata: {freighterError}
                    </div>
                  )}
                </div>

                {/* Connect Butonu */}
                {!isConnected && (
                  <Button
                    onClick={connect}
                    disabled={!isAvailable}
                    className="w-full"
                    variant="success"
                  >
                    🔗 Freighter&apos;a Bağlan
                  </Button>
                )}

                {/* Otomatik Al/Sat Paneli */}
                {isConnected && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-3">🤖 Otomatik Al/Sat</h4>
                    
                    {/* Al/Sat Seçimi */}
                    <div className="flex gap-2 mb-3">
                      <button
                        className={`flex-1 py-2 px-4 rounded text-sm font-medium ${
                          tradeType === 'buy' 
                            ? 'bg-green-500 text-white' 
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                        onClick={() => setTradeType('buy')}
                        disabled={isTrading}
                      >
                        💰 XLM Al
                      </button>
                      <button
                        className={`flex-1 py-2 px-4 rounded text-sm font-medium ${
                          tradeType === 'sell' 
                            ? 'bg-red-500 text-white' 
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                        onClick={() => setTradeType('sell')}
                        disabled={isTrading}
                      >
                        💸 XLM Sat
                      </button>
                    </div>

                    {/* Miktar Girişi */}
                    <div className="mb-3">
                      <label className="block text-sm font-medium mb-1">
                        Miktar (XLM)
                      </label>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        placeholder="Min: 1"
                        value={tradeAmount}
                        onChange={(e) => setTradeAmount(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                        disabled={isTrading}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Güncel XLM Fiyatı: ${currentPrice.toFixed(4)} | Minimum: 1 XLM
                      </p>
                    </div>

                    {/* İşlem Butonu */}
                    <Button
                      onClick={handleAutoTrade}
                      disabled={!tradeAmount || isTrading}
                      variant={tradeType === 'buy' ? 'success' : 'error'}
                      className="w-full mb-3"
                    >
                      {isTrading ? (
                        '⏳ İşlem Yapılıyor...'
                      ) : (
                        tradeType === 'buy' ? '💰 XLM Satın Al' : '💸 XLM Sat'
                      )}
                    </Button>

                    {/* Durum Mesajı */}
                    {tradeStatus && (
                      <div className={`text-xs p-2 rounded border ${
                        tradeStatus.startsWith('✅') 
                          ? 'bg-green-50 border-green-200 text-green-700'
                          : tradeStatus.startsWith('❌')
                          ? 'bg-red-50 border-red-200 text-red-700'
                          : 'bg-blue-50 border-blue-200 text-blue-700'
                      }`}>
                        <div className="whitespace-pre-line">{tradeStatus}</div>
                      </div>
                    )}

                    {/* 🆕 Fiyat Bazlı Otomatik Alım-Satım */}
                    <div className="border-t pt-4 mt-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium">🎯 Fiyat Bazlı Otomatik İşlem</h4>
                        <div className="flex items-center gap-2">
                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={isAutoTradingEnabled}
                              onChange={(e) => {
                                setIsAutoTradingEnabled(e.target.checked);
                                // Aktifleştirirken hata state'ini temizle
                                if (e.target.checked && hasAutoTradeError) {
                                  setHasAutoTradeError(false);
                                  setLastErrorTime(null);
                                  setAutoTradeStatus(null);
                                  // 🆕 Hata durumundan kurtulurken textbox'ları da temizle
                                  setBuyTargetPrice('');
                                  setSellTargetPrice('');
                                  setAutoBuyAmount('');
                                  setAutoSellAmount('');
                                } else if (e.target.checked) {
                                  // Normal aktifleştirme - sadece status temizle
                                  setAutoTradeStatus(null);
                                }
                              }}
                              className="rounded"
                              disabled={isTrading}
                            />
                            <span className={isAutoTradingEnabled ? 'text-green-600 font-medium' : 'text-gray-500'}>
                              {isAutoTradingEnabled ? '🟢 Aktif' : '⚪ Pasif'}
                            </span>
                          </label>
                          
                          {/* 🆕 Hata durumu göstergesi */}
                          {hasAutoTradeError && (
                            <div className="flex items-center gap-1">
                              <span className="bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
                                🚨 HATA
                              </span>
                              <Button
                                onClick={() => {
                                  setHasAutoTradeError(false);
                                  setLastErrorTime(null);
                                  setAutoTradeStatus('✅ Hata durumu temizlendi, otomatik işlem hazır.');
                                  setIsAutoTradingEnabled(true);
                                  // 🆕 Reset butonuna basıldığında textbox'ları da temizle
                                  setBuyTargetPrice('');
                                  setSellTargetPrice('');
                                  setAutoBuyAmount('');
                                  setAutoSellAmount('');
                                }}
                                size="sm"
                                className="text-xs px-2 py-1"
                                variant="success"
                              >
                                🔄 Reset
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Alım Ayarları */}
                      <div className="mb-4 p-3 bg-green-50 rounded border border-green-200">
                        <h5 className="font-medium text-green-800 mb-2">💰 Otomatik Alım</h5>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs font-medium mb-1">Hedef Fiyat ($)</label>
                            <input
                              type="number"
                              min="0"
                              step="0.0001"
                              placeholder="Örn: 0.1200"
                              value={buyTargetPrice}
                              onChange={(e) => setBuyTargetPrice(e.target.value)}
                              className="w-full px-2 py-1 border border-green-300 rounded text-xs"
                              disabled={isTrading || !isAutoTradingEnabled}
                            />
                            <p className="text-xs text-green-600 mt-1">
                              Fiyat ≤ Bu değer olduğunda al
                            </p>
                          </div>
                          <div>
                            <label className="block text-xs font-medium mb-1">Miktar (XLM)</label>
                            <input
                              type="number"
                              min="1"
                              step="1"
                              placeholder="Min: 1"
                              value={autoBuyAmount}
                              onChange={(e) => setAutoBuyAmount(e.target.value)}
                              className="w-full px-2 py-1 border border-green-300 rounded text-xs"
                              disabled={isTrading || !isAutoTradingEnabled}
                            />
                            <p className="text-xs text-green-600 mt-1">
                              Minimum 1 XLM
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Satım Ayarları */}
                      <div className="mb-4 p-3 bg-red-50 rounded border border-red-200">
                        <h5 className="font-medium text-red-800 mb-2">💸 Otomatik Satım</h5>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs font-medium mb-1">Hedef Fiyat ($)</label>
                            <input
                              type="number"
                              min="0"
                              step="0.0001"
                              placeholder="Örn: 0.1400"
                              value={sellTargetPrice}
                              onChange={(e) => setSellTargetPrice(e.target.value)}
                              className="w-full px-2 py-1 border border-red-300 rounded text-xs"
                              disabled={isTrading || !isAutoTradingEnabled}
                            />
                            <p className="text-xs text-red-600 mt-1">
                              Fiyat ≥ Bu değer olduğunda sat
                            </p>
                          </div>
                          <div>
                            <label className="block text-xs font-medium mb-1">Miktar (XLM)</label>
                            <input
                              type="number"
                              min="1"
                              step="1"
                              placeholder="Min: 1"
                              value={autoSellAmount}
                              onChange={(e) => setAutoSellAmount(e.target.value)}
                              className="w-full px-2 py-1 border border-red-300 rounded text-xs"
                              disabled={isTrading || !isAutoTradingEnabled}
                            />
                            <p className="text-xs text-red-600 mt-1">
                              Minimum 1 XLM
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Otomatik İşlem Durumu */}
                      <div className="text-xs bg-gray-50 p-3 rounded border">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`w-3 h-3 rounded-full ${
                            hasAutoTradeError ? 'bg-red-500' : 
                            isAutoTradingEnabled ? 'bg-green-500' : 'bg-gray-400'
                          }`}></span>
                          <span className="font-medium">
                            Otomatik İşlem: {
                              hasAutoTradeError ? '🚨 Hata - Durduruldu' :
                              isAutoTradingEnabled ? '✅ Aktif' : '⚪ Pasif'
                            }
                          </span>
                          {isTrading && (
                            <span className="bg-orange-500 text-white px-2 py-1 rounded text-xs font-bold animate-pulse">
                              ⏳ İŞLEM DEVAM EDİYOR
                            </span>
                          )}
                          {hasAutoTradeError && lastErrorTime && (
                            <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs">
                              Hata: {lastErrorTime.toLocaleTimeString('tr-TR')}
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <div className="text-gray-600">💰 Alım Hedefi:</div>
                            <div className="font-mono">
                              {buyTargetPrice ? `$${buyTargetPrice} (${autoBuyAmount} XLM)` : 'Belirlenmemiş'}
                            </div>
                            {buyTargetPrice && (
                              <div className={`text-xs mt-1 ${currentPrice <= parseFloat(buyTargetPrice) ? 'text-green-600 font-bold' : 'text-gray-500'}`}>
                                {currentPrice <= parseFloat(buyTargetPrice) ? '🎯 HEDEF ULAŞILDI!' : '⏳ Hedef bekleniyor...'}
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="text-gray-600">💸 Satım Hedefi:</div>
                            <div className="font-mono">
                              {sellTargetPrice ? `$${sellTargetPrice} (${autoSellAmount} XLM)` : 'Belirlenmemiş'}
                            </div>
                            {sellTargetPrice && (
                              <div className={`text-xs mt-1 ${currentPrice >= parseFloat(sellTargetPrice) ? 'text-red-600 font-bold' : 'text-gray-500'}`}>
                                {currentPrice >= parseFloat(sellTargetPrice) ? '🎯 HEDEF ULAŞILDI!' : '⏳ Hedef bekleniyor...'}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="mt-2 pt-2 border-t text-center">
                          <div className="text-gray-600">💵 Güncel Fiyat:</div>
                          <div className="font-mono font-bold text-lg">
                            ${currentPrice.toFixed(4)}
                          </div>
                        </div>
                      </div>

                      {/* Otomatik İşlem Durum Mesajı */}
                      {autoTradeStatus && (
                        <div className={`text-xs p-2 rounded border mt-3 ${
                          autoTradeStatus.startsWith('✅') 
                            ? 'bg-green-50 border-green-200 text-green-700'
                            : autoTradeStatus.startsWith('❌')
                            ? 'bg-red-50 border-red-200 text-red-700'
                            : autoTradeStatus.startsWith('🤖')
                            ? 'bg-blue-50 border-blue-200 text-blue-700'
                            : 'bg-yellow-50 border-yellow-200 text-yellow-700'
                        }`}>
                          <div className="whitespace-pre-line">{autoTradeStatus}</div>
                        </div>
                      )}

                      {/* Hızlı Test Butonları */}
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <Button
                          onClick={() => {
                            const testPrice = (currentPrice * 0.99).toFixed(4);
                            setBuyTargetPrice(testPrice);
                            setAutoBuyAmount('1');
                            setIsAutoTradingEnabled(true);
                          }}
                          size="sm"
                          className="text-xs"
                          disabled={currentPrice === 0}
                          variant="success"
                        >
                          🧪 Test Alım (-1%) 1 XLM
                        </Button>
                        <Button
                          onClick={() => {
                            const testPrice = (currentPrice * 1.01).toFixed(4);
                            setSellTargetPrice(testPrice);
                            setAutoSellAmount('1');
                            setIsAutoTradingEnabled(true);
                          }}
                          size="sm"
                          className="text-xs"
                          disabled={currentPrice === 0}
                          variant="error"
                        >
                          🧪 Test Satım (+1%) 1 XLM
                        </Button>
                      </div>

                      {/* İyileştirmeler Bilgisi */}
                      <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                        <div className="font-medium text-blue-800 mb-1">🔧 Yeni İyileştirmeler:</div>
                        <ul className="text-blue-700 space-y-1">
                          <li>• %10 slippage tolerance (daha yüksek başarı oranı)</li>
                          <li>• İşlem sırasında blokaj sistemi (çakışma önleme)</li>
                          <li>• 🛑 Hata sonrası otomatik durdurma (tekrar deneme engelleme)</li>
                          <li>• 🔄 Reset butonu ile manuel tekrar aktifleştirme</li>
                          <li>• 🧹 İşlem sonrası textbox&apos;lar otomatik temizlenir</li>
                          <li>• 📱 Telegram hata bildirimleri</li>
                          <li>• Gerçek zamanlı hata durumu göstergeleri</li>
                          <li>• 3 saniye cooldown sistemi (hızlı tetiklenme önleme)</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* Hızlı Linkler */}
                <div className="text-xs space-y-1 border-t pt-2">
                  <Link href="/" className="text-blue-600 hover:underline block">
                    🏠 Ana Sayfa - Quote Tool
                  </Link>
                  <div className="text-gray-500">
                    💡 İpucu: Küçük miktarlarla test yapın
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Sağ Panel - Alert Yönetimi */}
          <div className="lg:col-span-2 space-y-6">
            <AlertManager
              alerts={alerts}
              currentPrice={currentPrice}
              onAddAlert={addAlert}
              onRemoveAlert={removeAlert}
            />

            {/* Telegram Bot Kurulumu */}
            <Card title="📱 Telegram Bot Kurulumu">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Telegram Chat ID
                  </label>
                  <input
                    type="text"
                    value={telegramChatId}
                    onChange={(e) => handleChatIdChange(e.target.value)}
                    className="input-field"
                    placeholder="123456789 veya @username"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    @userinfobot kullanarak Chat IDnizi öğrenin
                  </p>
                </div>

                <div className="bg-blue-50 p-3 rounded text-sm">
                  <h4 className="font-semibold mb-2">📋 Kurulum:</h4>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>✅ Bot token hazır!</li>
                    <li>@userinfobottan Chat ID alın</li>
                    <li>Yukarı girin</li>
                    <li>🧪 Test butonlarını deneyin</li>
                    <li>🚨 Otomatik uyarılar gelecek!</li>
                  </ol>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Kullanım Talimatları */}
        <Card title="📘 Nasıl Kullanılır?" className="bg-blue-50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">1️⃣ Takibi Başlatın</h4>
              <p className="text-gray-600">
                Takibi Başlat butonuna tıklayın. Her 10 saniyede bir fiyat güncellenecek.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">2️⃣ Uyarı Ekleyin</h4>
              <p className="text-gray-600">
                Hedef fiyat belirleyin ve yukarı/aşağı koşulu seçin.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">3️⃣ Telegram Kurun</h4>
              <p className="text-gray-600">
                ✅ Bot hazır! @userinfobot&apos;tan Chat ID alın ve girin.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">4️⃣ Fiyat Bazlı Otomatik Al/Sat</h4>
              <p className="text-gray-600">
                🎯 Belirlediğiniz fiyattan otomatik alım-satım! Telegram bildirimleri!</p>
            </div>
          </div>
        </Card>

        {/* Özellikler */}
        <Card title="🆕 Yeni Özellikler" className="bg-green-50 border-green-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2 text-green-800">🤖 Otomatik Telegram:</h4>
              <ul className="space-y-1 text-green-700">
                <li>✅ Alert tetiklendiğinde otomatik mesaj</li>
                <li>✅ İşlem tamamlandığında bildirim</li>
                <li>✅ Test butonları ile kolay deneme</li>
                <li>✅ Durumu canlı takip</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2 text-green-800">🎯 Fiyat Bazlı Otomatik Alım-Satım:</h4>
              <ul className="space-y-1 text-green-700">
                <li>✅ Hedef fiyat belirleme sistemi</li>
                <li>✅ XLM/USDC otomatik işlemler</li>
                <li>✅ Gerçek zamanlı fiyat takibi</li>
                <li>✅ Test butonları ile kolay deneme</li>
                <li>✅ Telegram bildirimler</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}