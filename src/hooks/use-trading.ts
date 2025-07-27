// src/hooks/use-trading.ts
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

// Types
interface TriggerConfig {
  name?: string;
  baseAsset: string;
  quoteAsset: string;
  baseSymbol: string;
  quoteSymbol: string;
  buyPrice?: number;
  sellPrice?: number;
  buyAmount?: string;
  sellAmount?: string;
  slippageTolerance?: number;
  maxPriceImpact?: number;
}

interface PriceTrigger {
  id: number;
  name: string;
  baseAsset: string;
  quoteAsset: string;
  baseSymbol: string;
  quoteSymbol: string;
  buyPrice?: number;
  sellPrice?: number;
  buyAmount?: string;
  sellAmount?: string;
  slippageTolerance: number;
  maxPriceImpact: number;
  status: 'ACTIVE' | 'PAUSED';
  lastPrice: number | null;
  totalBuys: number;
  totalSells: number;
  createdAt: number;
  lastTriggered?: number;
}

interface TradeEvent {
  triggerId: number;
  type: 'BUY' | 'SELL';
  price?: number;
  amount?: string;
  symbol?: string;
  timestamp: number;
  success: boolean;
  error?: string;
}

interface SwapResult {
  success: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  quote?: any;
  executedPrice?: number;
  error?: string;
  priceImpact?: number;
}

export const useTrading = () => {
  // State
  const [triggers, setTriggers] = useState<PriceTrigger[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [trades, setTrades] = useState<TradeEvent[]>([]);
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [telegramChatId, setTelegramChatId] = useState<string>('');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [telegramBot, setTelegramBot] = useState<any>(null);
  
  // Refs
  const monitoringInterval = useRef<NodeJS.Timeout | null>(null);
  const triggerIdCounter = useRef(1);
  const isCheckingRef = useRef(false);

  // Telegram bot yükleme
  useEffect(() => {
    const loadTelegramBot = async () => {
      if (typeof window !== 'undefined') {
        try {
          const { telegramBot: bot } = await import('@/lib/telegram');
          setTelegramBot(bot);
          
          // Chat ID'yi localStorage'dan yükle
          const storedChatId = localStorage.getItem('telegram_chat_id');
          if (storedChatId) {
            setTelegramChatId(storedChatId);
          }
        } catch (error) {
          console.error('Telegram bot yükleme hatası:', error);
        }
      }
    };

    loadTelegramBot();
  }, []);

  // Trading geçmişini localStorage'dan yükle
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTrades = localStorage.getItem('trading_history');
      if (savedTrades) {
        try {
          setTrades(JSON.parse(savedTrades));
        } catch (error) {
          console.error('Trading geçmişi yükleme hatası:', error);
        }
      }
    }
  }, []);

  // Trading geçmişini localStorage'a kaydet
  useEffect(() => {
    if (typeof window !== 'undefined' && trades.length > 0) {
      localStorage.setItem('trading_history', JSON.stringify(trades.slice(0, 50))); // Son 50 işlem
    }
  }, [trades]);

  // Chat ID değişikliklerini localStorage'a kaydet
  const updateTelegramChatId = useCallback((chatId: string) => {
    setTelegramChatId(chatId);
    if (typeof window !== 'undefined') {
      localStorage.setItem('telegram_chat_id', chatId);
    }
  }, []);

  // API çağrıları
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
 const callTradingAPI = async (action: string, params: any) => {
  try {
    const response = await fetch('/api/trading', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action, ...params }),
    });

    if (!response.ok) {
      let errorMessage = `API error: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (jsonError) {
        // JSON parse hatası varsa, response text'ini kullan
        const errorText = await response.text();
        errorMessage = errorText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error) {
    console.error(`${action} API error:`, error);
    
    // Network hataları için özel mesaj
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Network hatası: API sunucusuna bağlanılamıyor');
    }
    
    throw error;
  }
};

  // Fiyat alma
  const getPrice = async (assets: string): Promise<Record<string, number>> => {
    try {
      const data = await callTradingAPI('getPrice', { assets });
      return data;
    } catch (error) {
      throw new Error(`Fiyat alınamadı: ${error}`);
    }
  };

  // Quote alma
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getQuote = async (params: any) => {
    try {
      return await callTradingAPI('getQuote', params);
    } catch (error) {
      throw new Error(`Quote alınamadı: ${error}`);
    }
  };

  // İşlem simülasyonu
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const simulateSwap = async (params: any): Promise<SwapResult> => {
    try {
      const quote = await getQuote({
        assetIn: params.assetIn,
        assetOut: params.assetOut,
        amount: params.amount,
        tradeType: 'EXACT_IN',
        protocols: ['soroswap','aqua'],
        slippageTolerance: params.slippageTolerance || 50,
        gaslessTrustline: params.gaslessTrustline || false,
        feeBps: 50
      });

      const priceImpact = parseFloat(quote.priceImpactPct || '0');

      // Fiyat etkisi kontrolü
      if (priceImpact > (params.maxPriceImpact || 5)) {
        return {
          success: false,
          error: `Fiyat etkisi çok yüksek: ${priceImpact.toFixed(2)}%`,
          priceImpact
        };
      }

      return {
        success: true,
        quote: quote,
        executedPrice: parseFloat(quote.amountOut) / parseFloat(quote.amountIn),
        priceImpact
      };

    } catch (error) {
      return {
        success: false,
        error: (error as Error).message
      };
    }
  };

  // Telegram bildirimi gönder
  const sendTelegramNotification = async (trade: TradeEvent) => {
    if (!telegramBot || !telegramChatId) return;

    try {
      const priceStr = trade.price ? `@ ${trade.price.toFixed(6)}` : '';
      const statusEmoji = trade.success ? '✅' : '❌';
      
      const message = `🤖 SOROSWAP OTOMATİK TRADİNG

${statusEmoji} ${trade.type === 'BUY' ? '🟢 ALIM' : '🔴 SATIM'} ${trade.success ? 'BAŞARILI' : 'BAŞARISIZ'}

💰 Miktar: ${trade.amount} ${trade.symbol}
📊 Fiyat: ${priceStr}
🆔 Trigger: #${trade.triggerId}
⏰ ${new Date(trade.timestamp).toLocaleString('tr-TR')}
${trade.error ? `⚠️ Hata: ${trade.error}` : ''}

🚀 Soroswap Auto Trading`;

      await telegramBot.sendMessage(telegramChatId, message);
      console.log('✅ Telegram bildirimi gönderildi');
    } catch (error) {
      console.error('❌ Telegram bildirim hatası:', error);
    }
  };

  // Trigger oluştur
  const createTrigger = useCallback((config: TriggerConfig) => {
    const newTrigger: PriceTrigger = {
      id: triggerIdCounter.current++,
      name: config.name || `Trigger-${triggerIdCounter.current}`,
      baseAsset: config.baseAsset,
      quoteAsset: config.quoteAsset,
      baseSymbol: config.baseSymbol,
      quoteSymbol: config.quoteSymbol,
      buyPrice: config.buyPrice,
      sellPrice: config.sellPrice,
      buyAmount: config.buyAmount,
      sellAmount: config.sellAmount,
      slippageTolerance: config.slippageTolerance || 50,
      maxPriceImpact: config.maxPriceImpact || 5,
      status: 'ACTIVE',
      lastPrice: null,
      totalBuys: 0,
      totalSells: 0,
      createdAt: Date.now()
    };

    setTriggers(prev => [...prev, newTrigger]);
    
    // İzleme başlatılmamışsa başlat
    if (!isMonitoring) {
      startMonitoring();
    }

    return {
      success: true,
      triggerId: newTrigger.id,
      trigger: newTrigger
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMonitoring]);

  // Trigger sil
  const removeTrigger = useCallback((triggerId: number) => {
    setTriggers(prev => prev.filter(t => t.id !== triggerId));
    return { success: true };
  }, []);

  // Trigger durumunu değiştir
  const toggleTrigger = useCallback((triggerId: number) => {
    setTriggers(prev => prev.map(t => 
      t.id === triggerId 
        ? { ...t, status: t.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE' }
        : t
    ));
    return { success: true };
  }, []);

  // Tüm triggerleri temizle
  const clearAllTriggers = useCallback(() => {
    const count = triggers.length;
    setTriggers([]);
    stopMonitoring();
    return { success: true, clearedCount: count };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggers.length]);

  // Trigger değerlendirme
  const evaluateTrigger = async (trigger: PriceTrigger, currentPrice: number) => {
    const priceNum = parseFloat(currentPrice.toString());
    
    // Çok yakın zamanda tetiklenmiş mi kontrol et (spam önleme)
    const now = Date.now();
    if (trigger.lastTriggered && (now - trigger.lastTriggered) < 30000) { // 30 saniye
      return;
    }
    
    // ALIM KOŞULU
    if (trigger.buyPrice && priceNum <= trigger.buyPrice && trigger.buyAmount) {
      console.log(`🟢 ALIM TETİKLENDİ #${trigger.id} @ ${priceNum}`);
      
      const result = await simulateSwap({
        assetIn: trigger.quoteAsset,
        assetOut: trigger.baseAsset,
        amount: trigger.buyAmount,
        slippageTolerance: trigger.slippageTolerance,
        maxPriceImpact: trigger.maxPriceImpact
      });
      
      // Trigger'ı güncelle
      setTriggers(prev => prev.map(t => 
        t.id === trigger.id 
          ? { 
              ...t, 
              totalBuys: result.success ? t.totalBuys + 1 : t.totalBuys,
              lastTriggered: now
            }
          : t
      ));

      // Trade event oluştur
      const tradeEvent: TradeEvent = {
        triggerId: trigger.id,
        type: 'BUY',
        price: result.executedPrice,
        amount: result.quote?.amountOut,
        symbol: trigger.baseSymbol,
        timestamp: now,
        success: result.success,
        error: result.error
      };

      setTrades(prev => [tradeEvent, ...prev.slice(0, 49)]); // Son 50 işlem
      await sendTelegramNotification(tradeEvent);
      
      if (result.success) {
        console.log(`✅ ALIM BAŞARILI #${trigger.id}`);
      } else {
        console.error(`❌ ALIM HATASI #${trigger.id}: ${result.error}`);
      }
    }
    
    // SATIM KOŞULU
    if (trigger.sellPrice && priceNum >= trigger.sellPrice && trigger.sellAmount) {
      console.log(`🔴 SATIM TETİKLENDİ #${trigger.id} @ ${priceNum}`);
      
      const result = await simulateSwap({
        assetIn: trigger.baseAsset,
        assetOut: trigger.quoteAsset,
        amount: trigger.sellAmount,
        slippageTolerance: trigger.slippageTolerance,
        maxPriceImpact: trigger.maxPriceImpact
      });
      
      // Trigger'ı güncelle
      setTriggers(prev => prev.map(t => 
        t.id === trigger.id 
          ? { 
              ...t, 
              totalSells: result.success ? t.totalSells + 1 : t.totalSells,
              lastTriggered: now
            }
          : t
      ));

      // Trade event oluştur
      const tradeEvent: TradeEvent = {
        triggerId: trigger.id,
        type: 'SELL',
        price: result.executedPrice,
        amount: result.quote?.amountOut,
        symbol: trigger.quoteSymbol,
        timestamp: now,
        success: result.success,
        error: result.error
      };

      setTrades(prev => [tradeEvent, ...prev.slice(0, 49)]); // Son 50 işlem
      await sendTelegramNotification(tradeEvent);
      
      if (result.success) {
        console.log(`✅ SATIM BAŞARILI #${trigger.id}`);
      } else {
        console.error(`❌ SATIM HATASI #${trigger.id}: ${result.error}`);
      }
    }
  };

  // Tüm triggerleri kontrol et
  const checkAllTriggers = async () => {
    if (isCheckingRef.current || triggers.length === 0) {
      return;
    }

    isCheckingRef.current = true;

    try {
      // Benzersiz asset çiftlerini topla
      const assetPairs = new Set<string>();
      triggers.forEach(trigger => {
        if (trigger.status === 'ACTIVE') {
          assetPairs.add(`${trigger.baseAsset}-${trigger.quoteAsset}`);
        }
      });

      if (assetPairs.size === 0) {
        return;
      }

      setError(null);
      const currentPrices = await getPrice(Array.from(assetPairs).join(','));
      setPrices(currentPrices);
      
      // Her trigger'ı kontrol et
      for (const trigger of triggers) {
        if (trigger.status !== 'ACTIVE') continue;
        
        const pairKey = `${trigger.baseAsset}-${trigger.quoteAsset}`;
        const currentPrice = currentPrices[pairKey];
        
        if (!currentPrice) continue;
        
        // Trigger'daki son fiyatı güncelle
        setTriggers(prev => prev.map(t => 
          t.id === trigger.id 
            ? { ...t, lastPrice: currentPrice }
            : t
        ));
        
        await evaluateTrigger(trigger, currentPrice);
      }
      
    } catch (error) {
      console.error('Fiyat kontrolü hatası:', error);
      setError(`Fiyat kontrolü hatası: ${(error as Error).message}`);
    } finally {
      isCheckingRef.current = false;
    }
  };

  // İzleme başlat
  const startMonitoring = useCallback(() => {
    if (isMonitoring || triggers.length === 0) return;
    
    setIsMonitoring(true);
    setError(null);
    console.log('🔄 Fiyat izleme başlatıldı');
    
    // İlk kontrolü hemen yap
    checkAllTriggers();
    
    // Periyodik kontrol başlat
    monitoringInterval.current = setInterval(checkAllTriggers, 15000); // 15 saniye
  }, [isMonitoring, triggers.length]);

  // İzleme durdur
  const stopMonitoring = useCallback(() => {
    if (!isMonitoring) return;
    
    setIsMonitoring(false);
    if (monitoringInterval.current) {
      clearInterval(monitoringInterval.current);
      monitoringInterval.current = null;
    }
    console.log('⏸️ Fiyat izleme durduruldu');
  }, [isMonitoring]);

  // Trigger sayısı değiştiğinde izlemeyi yönet
  useEffect(() => {
    if (triggers.length === 0 && isMonitoring) {
      stopMonitoring();
    }
  }, [triggers.length, isMonitoring, stopMonitoring]);

  // Component unmount'ta temizlik
  useEffect(() => {
    return () => {
      if (monitoringInterval.current) {
        clearInterval(monitoringInterval.current);
      }
    };
  }, []);

  // Test mesajı gönder
  const sendTestMessage = async () => {
    if (!telegramBot || !telegramChatId) {
      throw new Error('Telegram bot veya Chat ID bulunamadı!');
    }

    try {
      const success = await telegramBot.sendTestMessage(telegramChatId, 0.12);
      return success;
    } catch (error) {
      throw new Error(`Test mesajı hatası: ${error}`);
    }
  };

  // Durum objesi
  const status = {
    isMonitoring,
    totalTriggers: triggers.length,
    activeTriggers: triggers.filter(t => t.status === 'ACTIVE').length,
    pausedTriggers: triggers.filter(t => t.status === 'PAUSED').length,
    hasError: !!error,
    telegramReady: !!(telegramBot && telegramChatId),
    totalTrades: trades.length,
    successfulTrades: trades.filter(t => t.success).length
  };

  return {
    // State
    triggers,
    isMonitoring,
    trades,
    prices,
    error,
    status,
    telegramChatId,
    telegramBot,
    
    // Actions
    createTrigger,
    removeTrigger,
    toggleTrigger,
    clearAllTriggers,
    startMonitoring,
    stopMonitoring,
    updateTelegramChatId,
    sendTestMessage,
    
    // Utils
    getPrice,
    getQuote,
    simulateSwap
  };
};