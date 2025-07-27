// src/app/auto-trading/page.tsx (1. Kısım - Imports ve Token Tanımları)
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useTrading } from '@/hooks/use-trading';

// Token adresleri (mainnet)
const TOKENS = {
  USDC: {
    address: 'CBBHRKEP5M3NUDRISGLJKGHDHX3DA2CN2AZBQY6WLVUJ7VNLGSKBDUCM',
    symbol: 'USDC',
    decimals: 7
  },
  Dogstar: {
    address: 'CDYZ6I4FTABFDVWIH2RSVDVIFSJF7FMA2CTUBFHWCLPSLIGO55K4HNSN',
    symbol: 'XTAR',
    decimals: 7
  },
  XLM: {
    address: 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC',
    symbol: 'XLM',
    decimals: 7
  },
  EURC: {
    address: 'CA34FYW2SL7VZW5E6WIPA2NOTLGG7TNAOKQLEO5YZHVUGNRFHM4HJ7WD',
    symbol: 'EURC',
    decimals: 7
  }
};

export default function AutoTradingPage() {
  const {
    triggers,
    isMonitoring,
    trades,
    error,
    status,
    telegramChatId,
    telegramBot,
    createTrigger,
    removeTrigger,
    toggleTrigger,
    clearAllTriggers,
    startMonitoring,
    stopMonitoring,
    updateTelegramChatId,
    sendTestMessage
  } = useTrading();
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    baseAsset: TOKENS.USDC.address,
    quoteAsset: TOKENS.Dogstar.address,
    baseSymbol: TOKENS.USDC.symbol,
    quoteSymbol: TOKENS.Dogstar.symbol,
    buyPrice: '',
    sellPrice: '',
    buyAmount: '',
    sellAmount: '',
    slippageTolerance: '50',
    maxPriceImpact: '5'
  });

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');

  // Token çifti değiştir
  const handleTokenPairChange = (baseToken: keyof typeof TOKENS, quoteToken: keyof typeof TOKENS) => {
    setFormData(prev => ({
      ...prev,
      baseAsset: TOKENS[baseToken].address,
      quoteAsset: TOKENS[quoteToken].address,
      baseSymbol: TOKENS[baseToken].symbol,
      quoteSymbol: TOKENS[quoteToken].symbol
    }));
  };
  // src/app/auto-trading/page.tsx (2. Kısım - Fonksiyonlar)

  // Şablon uygula
  const applyTemplate = (template: string) => {
    setSelectedTemplate(template);
    
    switch (template) {
      case 'usdc_cetes_scalping':
        setFormData(prev => ({
          ...prev,
          name: 'USDC/CETES Scalping',
          buyPrice: '0.95',
          sellPrice: '1.05',
          buyAmount: '1000000000', // 100 USDC
          sellAmount: '100000000000', // 10,000 CETES
          slippageTolerance: '50',
          maxPriceImpact: '3'
        }));
        break;
      case 'xlm_conservative':
        handleTokenPairChange('USDC', 'XLM');
        setFormData(prev => ({
          ...prev,
          name: 'XLM Conservative Trading',
          buyPrice: '0.10',
          sellPrice: '0.15',
          buyAmount: '5000000000', // 500 USDC
          sellAmount: '50000000000', // 5,000 XLM (assuming 10M stroops = 1000 XLM)
          slippageTolerance: '100',
          maxPriceImpact: '5'
        }));
        break;
      case 'eurc_arbitrage':
        handleTokenPairChange('USDC', 'EURC');
        setFormData(prev => ({
          ...prev,
          name: 'USDC/EURC Arbitrage',
          buyPrice: '0.98',
          sellPrice: '1.02',
          buyAmount: '2000000000', // 200 USDC
          sellAmount: '200000000000', // 20,000 EURC
          slippageTolerance: '30',
          maxPriceImpact: '2'
        }));
        break;
      default:
        break;
    }
  };

  // Form validation
  const validateForm = () => {
    if (!formData.name.trim()) {
      alert('Lütfen trigger adı girin!');
      return false;
    }

    if (!formData.buyPrice && !formData.sellPrice) {
      alert('En az bir fiyat koşulu (alım veya satım) girmelisiniz!');
      return false;
    }

    if (formData.buyPrice && !formData.buyAmount) {
      alert('Alım fiyatı girildiyse alım miktarı da girilmelidir!');
      return false;
    }

    if (formData.sellPrice && !formData.sellAmount) {
      alert('Satım fiyatı girildiyse satım miktarı da girilmelidir!');
      return false;
    }

    if (formData.buyPrice && formData.sellPrice) {
      const buyPrice = parseFloat(formData.buyPrice);
      const sellPrice = parseFloat(formData.sellPrice);
      if (buyPrice >= sellPrice) {
        alert('Alım fiyatı satım fiyatından düşük olmalıdır!');
        return false;
      }
    }

    return true;
  };

  // Trigger oluştur
  const handleCreateTrigger = () => {
    if (!validateForm()) return;

    const config = {
      name: formData.name,
      baseAsset: formData.baseAsset,
      quoteAsset: formData.quoteAsset,
      baseSymbol: formData.baseSymbol,
      quoteSymbol: formData.quoteSymbol,
      buyPrice: formData.buyPrice ? parseFloat(formData.buyPrice) : undefined,
      sellPrice: formData.sellPrice ? parseFloat(formData.sellPrice) : undefined,
      buyAmount: formData.buyAmount || undefined,
      sellAmount: formData.sellAmount || undefined,
      slippageTolerance: parseInt(formData.slippageTolerance),
      maxPriceImpact: parseInt(formData.maxPriceImpact)
    };

    const result = createTrigger(config);
    
    if (result.success) {
      alert(`✅ Trigger oluşturuldu! ID: ${result.triggerId}`);
      
      // Formu temizle
      setFormData(prev => ({
        ...prev,
        name: '',
        buyPrice: '',
        sellPrice: '',
        buyAmount: '',
        sellAmount: ''
      }));
      setSelectedTemplate('');
    }
  };

  // Trigger sil
  const handleRemoveTrigger = (id: number) => {
    if (confirm('Bu trigger\'ı silmek istediğinizden emin misiniz?')) {
      removeTrigger(id);
    }
  };

  // Test mesajı gönder
  const handleSendTestMessage = async () => {
    try {
      const success = await sendTestMessage();
      if (success) {
        alert('✅ Test mesajı Telegram\'a gönderildi!');
      } else {
        alert('❌ Test mesajı gönderilemedi!');
      }
    } catch (error) {
      alert(`❌ Hata: ${(error as Error).message}`);
    }
  };

  // Stroops'u insan okunabilir formata çevir
  const formatAmount = (amount: string, decimals: number = 7) => {
    if (!amount) return '';
    const num = parseFloat(amount) / Math.pow(10, decimals);
    return num.toLocaleString('tr-TR', { maximumFractionDigits: decimals });
  };
  // src/app/auto-trading/page.tsx (3. Kısım - JSX Header ve Durum)

  return (
    <div className="py-8">
      <div className="max-w-7xl mx-auto px-4 space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            🤖 Soroswap Otomatik Trading
          </h1>
          <p className="text-gray-600">
            Fiyat tetiklemeli otomatik alım-satım sistemi - Ucuzken al, pahalıyken sat
          </p>
        </div>

        {/* Hata Durumu */}
        {error && (
          <Card className="bg-red-50 border border-red-200">
            <div className="text-red-700">
              <strong>❌ Hata:</strong> {error}
              <button 
                onClick={() => window.location.reload()} 
                className="ml-4 text-sm underline"
              >
                Sayfayı Yenile
              </button>
            </div>
          </Card>
        )}

        {/* Durum Paneli */}
        <Card className={`border ${isMonitoring ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
          <div className="text-sm">
            <strong>🔄 Sistem Durumu:</strong>
            <div className="mt-2 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <div>
                <span className={`inline-block w-2 h-2 rounded-full mr-2 ${isMonitoring ? 'bg-green-500' : 'bg-red-500'}`}></span>
                İzleme: {isMonitoring ? '✅ Aktif' : '❌ Durduruldu'}
              </div>
              <div>📊 Toplam: {status.totalTriggers}</div>
              <div>⚡ Aktif: {status.activeTriggers}</div>
              <div>⏸️ Durdurulmuş: {status.pausedTriggers}</div>
              <div>📈 İşlem: {status.totalTrades}</div>
              <div>
                <span className={`inline-block w-2 h-2 rounded-full mr-2 ${status.telegramReady ? 'bg-green-500' : 'bg-red-500'}`}></span>
                Telegram: {status.telegramReady ? '✅ Hazır' : '❌ Kurulmadı'}
              </div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sol Panel - Trigger Oluşturma */}
          <div className="space-y-4">
            <Card title="🎯 Yeni Trigger Oluştur">
              <div className="space-y-4">
                {/* Trigger Adı */}
                <div>
                  <label className="block text-sm font-medium mb-1">Trigger Adı *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                    placeholder="USDC/CETES Scalping"
                  />
                </div>

                {/* Token Çifti Seçimi */}
                <div>
                  <label className="block text-sm font-medium mb-1">Token Çifti</label>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={formData.baseSymbol}
                      onChange={(e) => {
                        const baseToken = Object.keys(TOKENS).find(
                          key => TOKENS[key as keyof typeof TOKENS].symbol === e.target.value
                        ) as keyof typeof TOKENS;
                        if (baseToken) {
                          handleTokenPairChange(baseToken, formData.quoteSymbol as keyof typeof TOKENS);
                        }
                      }}
                      className="p-2 border rounded"
                    >
                      {Object.values(TOKENS).map(token => (
                        <option key={token.symbol} value={token.symbol}>
                          {token.symbol}
                        </option>
                      ))}
                    </select>
                    <select
                      value={formData.quoteSymbol}
                      onChange={(e) => {
                        const quoteToken = Object.keys(TOKENS).find(
                          key => TOKENS[key as keyof typeof TOKENS].symbol === e.target.value
                        ) as keyof typeof TOKENS;
                        if (quoteToken) {
                          handleTokenPairChange(formData.baseSymbol as keyof typeof TOKENS, quoteToken);
                        }
                      }}
                      className="p-2 border rounded"
                    >
                      {Object.values(TOKENS).map(token => (
                        <option key={token.symbol} value={token.symbol}>
                          {token.symbol}
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Pair: {formData.baseSymbol}/{formData.quoteSymbol}
                  </p>
                </div>

                {/* Fiyat Koşulları */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">🟢 Alım Fiyatı (altında)</label>
                    <input
                      type="number"
                      step="0.000001"
                      value={formData.buyPrice}
                      onChange={(e) => setFormData({...formData, buyPrice: e.target.value})}
                      className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500"
                      placeholder="0.95"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">🔴 Satım Fiyatı (üstünde)</label>
                    <input
                      type="number"
                      step="0.000001"
                      value={formData.sellPrice}
                      onChange={(e) => setFormData({...formData, sellPrice: e.target.value})}
                      className="w-full p-2 border rounded focus:ring-2 focus:ring-red-500"
                      placeholder="1.05"
                    />
                  </div>
                </div>

                {/* Miktarlar */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Alım Miktarı (stroops)</label>
                    <input
                      type="text"
                      value={formData.buyAmount}
                      onChange={(e) => setFormData({...formData, buyAmount: e.target.value})}
                      className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                      placeholder="1000000000"
                    />
                    {formData.buyAmount && (
                      <p className="text-xs text-gray-500">
                        ≈ {formatAmount(formData.buyAmount)} {formData.baseSymbol}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Satım Miktarı (stroops)</label>
                    <input
                      type="text"
                      value={formData.sellAmount}
                      onChange={(e) => setFormData({...formData, sellAmount: e.target.value})}
                      className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                      placeholder="100000000000"
                    />
                    {formData.sellAmount && (
                      <p className="text-xs text-gray-500">
                        ≈ {formatAmount(formData.sellAmount)} {formData.quoteSymbol}
                      </p>
                    )}
                  </div>
                </div>

                {/* Gelişmiş Ayarlar */}
                <div>
                  <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    {showAdvanced ? '🔽' : '▶️'} Gelişmiş Ayarlar
                  </button>
                  
                  {showAdvanced && (
                    <div className="mt-2 space-y-3 p-3 bg-gray-50 rounded">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">Slippage (%)</label>
                          <input
                            type="number"
                            value={formData.slippageTolerance}
                            onChange={(e) => setFormData({...formData, slippageTolerance: e.target.value})}
                            className="w-full p-2 border rounded"
                            placeholder="50"
                          />
                          <p className="text-xs text-gray-500">50 = %0.5</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Max Fiyat Etkisi (%)</label>
                          <input
                            type="number"
                            value={formData.maxPriceImpact}
                            onChange={(e) => setFormData({...formData, maxPriceImpact: e.target.value})}
                            className="w-full p-2 border rounded"
                            placeholder="5"
                          />
                          <p className="text-xs text-gray-500">Güvenlik limiti</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <Button
                  onClick={handleCreateTrigger}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  🎯 Trigger Oluştur
                </Button>
              </div>
            </Card>

            {/* Hızlı Şablonlar */}
            <Card title="⚡ Hızlı Şablonlar" className="bg-blue-50">
              <div className="space-y-2">
                <Button
                  onClick={() => applyTemplate('usdc_cetes_scalping')}
                  size="sm"
                  className={`w-full ${selectedTemplate === 'usdc_cetes_scalping' ? 'bg-blue-600' : ''}`}
                >
                  📈 USDC/CETES Scalping
                </Button>
                <Button
                  onClick={() => applyTemplate('xlm_conservative')}
                  size="sm"
                  className={`w-full ${selectedTemplate === 'xlm_conservative' ? 'bg-blue-600' : ''}`}
                >
                  🛡️ XLM Konservatif
                </Button>
                <Button
                  onClick={() => applyTemplate('eurc_arbitrage')}
                  size="sm"
                  className={`w-full ${selectedTemplate === 'eurc_arbitrage' ? 'bg-blue-600' : ''}`}
                >
                  ⚖️ USDC/EURC Arbitraj
                </Button>
              </div>
            </Card>

            {/* Telegram Kurulumu */}
            <Card title="📱 Telegram Kurulumu" className="bg-yellow-50">
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Telegram Chat ID
                  </label>
                  <input
                    type="text"
                    value={telegramChatId}
                    onChange={(e) => updateTelegramChatId(e.target.value)}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-yellow-500"
                    placeholder="123456789"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    @userinfobot kullanarak Chat IDnizi öğrenin
                  </p>
                </div>
                
                <Button
                  onClick={handleSendTestMessage}
                  className="w-full"
                  disabled={!telegramBot || !telegramChatId}
                  size="sm"
                >
                  📱 Test Mesajı Gönder
                </Button>
                
                <div className="text-xs text-gray-600 bg-white p-2 rounded">
                  <strong>Kurulum:</strong>
                  <ol className="list-decimal list-inside mt-1 space-y-1">
                    <li>@userinfobottan Chat ID alın</li>
                    <li>Yukarı girin ve test edin</li>
                    <li>Otomatik bildirimler gelecek!</li>
                  </ol>
                </div>
              </div>
            </Card>
          </div>

          {/* Orta Panel - Aktif Triggerlar */}
          <div className="space-y-4">
            <Card title="📋 Aktif Triggerlar">
              {triggers.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">Henüz trigger oluşturulmamış</p>
                  <p className="text-sm text-gray-400">
                    Sol panelden trigger oluşturarak başlayın
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {triggers.map((trigger) => (
                    <div
                      key={trigger.id}
                      className={`p-3 border rounded ${
                        trigger.status === 'ACTIVE' 
                          ? 'bg-white border-green-200' 
                          : 'bg-gray-50 border-gray-300'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-semibold text-sm">{trigger.name}</h4>
                          <span className={`text-xs px-2 py-1 rounded ${
                            trigger.status === 'ACTIVE' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-gray-200 text-gray-600'
                          }`}>
                            {trigger.status}
                          </span>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            onClick={() => toggleTrigger(trigger.id)}
                            size="sm"
                            className="text-xs"
                          >
                            {trigger.status === 'ACTIVE' ? '⏸️' : '▶️'}
                          </Button>
                          <Button
                            onClick={() => handleRemoveTrigger(trigger.id)}
                            size="sm"
                            variant="error"
                            className="text-xs"
                          >
                            🗑️
                          </Button>
                        </div>
                      </div>
                      
                      <div className="text-xs space-y-1">
                        <div className="font-medium">💱 {trigger.baseSymbol}/{trigger.quoteSymbol}</div>
                        {trigger.buyPrice && (
                          <div className="text-green-700">
                            🟢 Alım: {trigger.buyPrice} altında 
                            ({formatAmount(trigger.buyAmount || '0')} {trigger.baseSymbol})
                          </div>
                        )}
                        {trigger.sellPrice && (
                          <div className="text-red-700">
                            🔴 Satım: {trigger.sellPrice} üstünde 
                            ({formatAmount(trigger.sellAmount || '0')} {trigger.quoteSymbol})
                          </div>
                        )}
                        <div className="text-blue-600">
                          📊 Son: {trigger.lastPrice?.toFixed(6) || 'Henüz alınmadı'}
                        </div>
                        <div className="text-gray-600">
                          📈 İşlemler: {trigger.totalBuys} alım / {trigger.totalSells} satım
                        </div>
                        <div className="text-gray-500">
                          ⏰ {new Date(trigger.createdAt).toLocaleString('tr-TR')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Kontrol Paneli */}
            <Card title="🎛️ Kontrol Paneli">
              <div className="space-y-2">
                {!isMonitoring ? (
                  <Button
                    onClick={startMonitoring}
                    className="w-full bg-green-600 hover:bg-green-700"
                    disabled={triggers.length === 0}
                  >
                    ▶️ İzlemeyi Başlat
                  </Button>
                ) : (
                  <Button
                    onClick={stopMonitoring}
                    className="w-full bg-red-600 hover:bg-red-700"
                  >
                    ⏸️ İzlemeyi Durdur
                  </Button>
                )}
                
                <Button
                  onClick={() => {
                    if (confirm('Tüm triggerları silmek istediğinizden emin misiniz?')) {
                      clearAllTriggers();
                    }
                  }}
                  variant="error"
                  className="w-full"
                  disabled={status.totalTriggers === 0}
                >
                  🗑️ Tüm Triggerları Sil
                </Button>
                
                <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                  <div>⏰ Kontrol aralığı: 15 saniye</div>
                  <div>🛡️ Max fiyat etkisi: %{formData.maxPriceImpact}</div>
                  <div>📊 Slippage tolerance: %{(parseInt(formData.slippageTolerance) / 100).toFixed(2)}</div>
                </div>
              </div>
            </Card>
          </div>

          {/* Sağ Panel - İşlem Geçmişi */}
          <div className="space-y-4">
            {/* Son İşlemler */}
            <Card title="📊 Son İşlemler" className="bg-green-50">
              {trades.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-gray-500">Henüz işlem yapılmadı</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {trades.slice(0, 10).map((trade, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded text-sm border ${
                        trade.success
                          ? trade.type === 'BUY' 
                            ? 'bg-green-100 border-green-200' 
                            : 'bg-red-100 border-red-200'
                          : 'bg-gray-100 border-gray-300'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className={`font-medium ${
                          trade.success
                            ? trade.type === 'BUY' ? 'text-green-700' : 'text-red-700'
                            : 'text-gray-600'
                        }`}>
                          {trade.success ? '✅' : '❌'} 
                          {trade.type === 'BUY' ? ' ALIM' : ' SATIM'}
                        </span>
                        <span className="text-xs text-gray-500">
                          #{trade.triggerId}
                        </span>
                      </div>
                      
                      <div className="text-xs space-y-1">
                        <div>💰 {trade.amount} {trade.symbol}</div>
                        {trade.price && (
                          <div>📊 @ {trade.price.toFixed(6)}</div>
                        )}
                        {trade.error && (
                          <div className="text-red-600">⚠️ {trade.error}</div>
                        )}
                        <div className="text-gray-500">
                          ⏰ {new Date(trade.timestamp).toLocaleString('tr-TR')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* İstatistikler */}
            <Card title="📈 İstatistikler" className="bg-blue-50">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Toplam İşlem:</span>
                  <span className="font-semibold">{status.totalTrades}</span>
                </div>
                <div className="flex justify-between">
                  <span>Başarılı İşlem:</span>
                  <span className="font-semibold text-green-600">{status.successfulTrades}</span>
                </div>
                <div className="flex justify-between">
                  <span>Başarı Oranı:</span>
                  <span className="font-semibold">
                    {status.totalTrades > 0 
                      ? `%${((status.successfulTrades / status.totalTrades) * 100).toFixed(1)}`
                      : '%0'
                    }
                  </span>
                </div>
                <hr className="my-2" />
                <div className="flex justify-between">
                  <span>Alım İşlemleri:</span>
                  <span className="font-semibold text-green-600">
                    {trades.filter(t => t.type === 'BUY' && t.success).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Satım İşlemleri:</span>
                  <span className="font-semibold text-red-600">
                    {trades.filter(t => t.type === 'SELL' && t.success).length}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Kullanım Rehberi */}
        <Card title="📘 Kullanım Rehberi" className="bg-blue-50">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">1️⃣ Trigger Oluşturun</h4>
              <p className="text-gray-600">
                Sol panelden token çifti seçin, fiyat koşullarını ve miktarları girin. 
                Alım fiyatının altında alım, satım fiyatının üstünde satım yapılır.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">2️⃣ Telegram Kurun</h4>
              <p className="text-gray-600">
                @userinfobottan Chat ID alın ve sol panelde girin. 
                Test mesajı göndererek çalıştığından emin olun.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">3️⃣ İzlemeyi Başlatın</h4>
              <p className="text-gray-600">
                Sistem her 15 saniyede fiyatları kontrol eder. 
                Koşullar sağlandığında otomatik işlem yapar ve bildirim gönderir.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">4️⃣ İşlemleri Takip Edin</h4>
              <p className="text-gray-600">
                Sağ panelden işlem geçmişini ve istatistikleri takip edin. 
                Telegramdan anlık bildirimler alın.
              </p>
            </div>
          </div>
        </Card>

        {/* Güvenlik Uyarıları */}
        <Card title="⚠️ Önemli Uyarılar" className="bg-yellow-50 border-yellow-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2 text-yellow-800">🔒 Güvenlik</h4>
              <ul className="space-y-1 text-yellow-700">
                <li>✅ Maksimum %5 fiyat etkisi koruması</li>
                <li>✅ Slippage tolerance ayarları</li>
                <li>✅ 30 saniye spam koruması</li>
                <li>✅ Sadece quote alma (gerçek işlem yok)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2 text-yellow-800">💡 Öneriler</h4>
              <ul className="space-y-1 text-yellow-700">
                <li>• Küçük miktarlarla başlayın</li>
                <li>• Önce testnette deneyin</li>
                <li>• Market volatilitesini göz önünde bulundurun</li>
                <li>• Risk yönetimi uygulayın</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Sistem Bilgileri */}
        <Card title="🔧 Sistem Bilgileri" className="bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <h5 className="font-semibold mb-2">📡 API Durumu</h5>
              <div className="space-y-1">
                <div>Soroswap API: {error ? '❌ Hata' : '✅ Çalışıyor'}</div>
                <div>Network: Mainnet</div>
                <div>Protokoller: Soroswap, Phoenix, Aqua, SDEX</div>
              </div>
            </div>
            <div>
              <h5 className="font-semibold mb-2">⚙️ Sistem Ayarları</h5>
              <div className="space-y-1">
                <div>Kontrol Aralığı: 15 saniye</div>
                <div>Timeout: 30 saniye</div>
                <div>Max Yeniden Deneme: 3</div>
              </div>
            </div>
            <div>
              <h5 className="font-semibold mb-2">💾 Veri Saklama</h5>
              <div className="space-y-1">
                <div>İşlem Geçmişi: Son 50 işlem</div>
                <div>Telegram ID: localStorage</div>
                <div>Triggerlar: Memory (geçici)</div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}