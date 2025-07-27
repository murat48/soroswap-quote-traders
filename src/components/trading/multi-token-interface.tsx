'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { multiTokenTrader } from '@/lib/multi-token-trader';
import { Token, MultiTokenOrder } from '@/types/multi-token-trading';

export const MultiTokenTradingInterface: React.FC = () => {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [selectedBaseToken, setSelectedBaseToken] = useState<string>('XLM');
  const [selectedQuoteToken, setSelectedQuoteToken] = useState<string>('USDC');
  const [orderType, setOrderType] = useState<'BUY' | 'SELL'>('BUY');
  const [strategy, setStrategy] = useState<'MARKET' | 'LIMIT' | 'STOP_LOSS'>('MARKET');
  const [amount, setAmount] = useState<string>('');
  const [price, setPrice] = useState<string>('');
  const [orders, setOrders] = useState<MultiTokenOrder[]>([]);
  const [isTrading, setIsTrading] = useState<boolean>(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const supportedTokens = multiTokenTrader.getSupportedTokens();
    setTokens(supportedTokens);
    setOrders(multiTokenTrader.getOrders());
  };

  const handleStartTrading = async () => {
    setIsTrading(true);
    await multiTokenTrader.startMultiTokenTrading();
  };

  const handleStopTrading = () => {
    multiTokenTrader.stopMultiTokenTrading();
    setIsTrading(false);
  };

  const handlePlaceOrder = async () => {
    try {
      if (strategy === 'MARKET') {
        await multiTokenTrader.addMarketOrder(
          selectedBaseToken,
          selectedQuoteToken,
          orderType,
          amount
        );
      } else if (strategy === 'LIMIT') {
        multiTokenTrader.addLimitOrder(
          selectedBaseToken,
          selectedQuoteToken,
          orderType,
          amount,
          parseFloat(price)
        );
      } else if (strategy === 'STOP_LOSS') {
        multiTokenTrader.addStopLossOrder(
          selectedBaseToken,
          selectedQuoteToken,
          amount,
          parseFloat(price)
        );
      }

      setAmount('');
      setPrice('');
      loadData();
      alert('✅ Emir eklendi!');
    } catch (error) {
      alert('❌ Emir eklenirken hata: ' + (error as Error).message);
    }
  };

  const handleCancelOrder = (orderId: string) => {
    const success = multiTokenTrader.cancelOrder(orderId);
    if (success) {
      loadData();
      alert('✅ Emir iptal edildi');
    }
  };

  return (
    <div className="space-y-6">
      {/* Trading Control */}
      <Card title="🤖 Multi-Token Trading Control">
        <div className="flex gap-3">
          {!isTrading ? (
            <Button onClick={handleStartTrading} variant="success" className="flex-1">
              ▶️ Trading Başlat
            </Button>
          ) : (
            <Button onClick={handleStopTrading} variant="error" className="flex-1">
              ⏹️ Trading Durdur
            </Button>
          )}
        </div>
        
        <div className="mt-4 text-sm text-gray-600 bg-blue-50 p-3 rounded">
          <p><strong>📊 Desteklenen Tokenlar:</strong> {tokens.length} token</p>
          <p><strong>📋 Aktif Emirler:</strong> {orders.filter(o => o.status === 'PENDING').length}</p>
          <p><strong>✅ Tamamlanan:</strong> {orders.filter(o => o.status === 'EXECUTED').length}</p>
        </div>
      </Card>

      {/* Order Placement */}
      <Card title="📝 Yeni Emir Ver">
        <div className="space-y-4">
          {/* Token Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Base Token</label>
              <select
                value={selectedBaseToken}
                onChange={(e) => setSelectedBaseToken(e.target.value)}
                className="select-field"
              >
                {tokens.map(token => (
                  <option key={token.address} value={token.symbol}>
                    {token.symbol} - {token.name}
                    {token.currentPrice ? ` ($${token.currentPrice.toFixed(4)})` : ''}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Quote Token</label>
              <select
                value={selectedQuoteToken}
                onChange={(e) => setSelectedQuoteToken(e.target.value)}
                className="select-field"
              >
                {tokens.filter(t => ['USDC', 'EURC', 'XLM', 'BTC'].includes(t.symbol)).map(token => (
                  <option key={token.address} value={token.symbol}>
                    {token.symbol} - {token.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Order Type & Strategy */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">İşlem Türü</label>
              <select
                value={orderType}
                onChange={(e) => setOrderType(e.target.value as 'BUY' | 'SELL')}
                className="select-field"
              >
                <option value="BUY">🟢 AL (BUY)</option>
                <option value="SELL">🔴 SAT (SELL)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Strateji</label>
              <select
                value={strategy}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                onChange={(e) => setStrategy(e.target.value as any)}
                className="select-field"
              >
                <option value="MARKET">⚡ Market (Anında)</option>
                <option value="LIMIT">📊 Limit (Fiyat Hedefi)</option>
                <option value="STOP_LOSS">🛑 Stop-Loss</option>
              </select>
            </div>
          </div>

          {/* Amount & Price */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Miktar ({selectedBaseToken})
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="input-field"
                placeholder="100"
                step="0.01"
              />
            </div>
            
            {strategy !== 'MARKET' && (
              <div>
                <label className="block text-sm font-medium mb-1">
                  Fiyat ({selectedQuoteToken})
                </label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="input-field"
                  placeholder="0.1250"
                  step="0.0001"
                />
              </div>
            )}
          </div>

          {/* Place Order Button */}
          <Button
            onClick={handlePlaceOrder}
            disabled={!amount || (strategy !== 'MARKET' && !price)}
            className="w-full"
            variant={orderType === 'BUY' ? 'success' : 'error'}
          >
            {orderType === 'BUY' ? '🟢' : '🔴'} {orderType} EMRİ VER
          </Button>
        </div>
      </Card>

      {/* Token List */}
      <Card title="📊 Testnet Tokenları">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tokens.slice(0, 15).map(token => (
            <div
              key={token.address}
              className="bg-gray-50 p-3 rounded-lg border hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {token.logo && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img 
                      src={token.logo} 
                      alt={token.symbol}
                      className="w-6 h-6 rounded-full"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  )}
                  <span className="font-semibold text-lg">{token.symbol}</span>
                </div>
                {token.currentPrice && (
                  <span className="text-green-600 font-mono text-sm">
                    ${token.currentPrice.toFixed(4)}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 truncate">{token.name}</p>
              <p className="text-xs text-gray-400 font-mono truncate">
                {token.address.substring(0, 8)}...{token.address.substring(-8)}
              </p>
            </div>
          ))}
        </div>
        
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            🧪 <strong>Testnet:</strong> Toplam <strong>{tokens.length}</strong> token destekleniyor
          </p>
        </div>
      </Card>

      {/* Active Orders */}
      <Card title="📋 Aktif Emirler">
        {orders.filter(o => o.status === 'PENDING').length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <span className="text-4xl mb-2 block">📭</span>
            Aktif emir bulunmuyor
          </div>
        ) : (
          <div className="space-y-3">
            {orders.filter(o => o.status === 'PENDING').map(order => (
              <div
                key={order.id}
                className="bg-blue-50 border-2 border-blue-200 p-4 rounded-lg"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-lg ${
                        order.type === 'BUY' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {order.type === 'BUY' ? '🟢' : '🔴'}
                      </span>
                      <span className="font-semibold">
                        {order.type} {order.amount} {order.baseToken.symbol}
                      </span>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        {order.strategy}
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>
                        💰 <strong>Fiyat:</strong> {order.price} {order.quoteToken.symbol}
                      </p>
                      <p>
                        💵 <strong>Toplam:</strong> {order.total} {order.quoteToken.symbol}
                      </p>
                      <p>
                        ⏰ <strong>Oluşturulma:</strong> {order.createdAt.toLocaleString('tr-TR')}
                      </p>
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => handleCancelOrder(order.id)}
                    variant="error"
                    size="sm"
                  >
                    ❌ İptal
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Order History */}
      <Card title="📜 İşlem Geçmişi">
        {orders.filter(o => o.status !== 'PENDING').length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <span className="text-4xl mb-2 block">📋</span>
            Henüz tamamlanmış işlem bulunmuyor
          </div>
        ) : (
          <div className="space-y-3">
            {orders
              .filter(o => o.status !== 'PENDING')
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .slice(0, 10)
              .map(order => (
                <div
                  key={order.id}
                  className={`p-4 rounded-lg border-2 ${
                    order.status === 'EXECUTED'
                      ? 'bg-green-50 border-green-200'
                      : order.status === 'FAILED'
                      ? 'bg-red-50 border-red-200'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">
                          {order.status === 'EXECUTED' ? '✅' : 
                           order.status === 'FAILED' ? '❌' : '⏸️'}
                        </span>
                        <span className={`text-lg ${
                          order.type === 'BUY' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {order.type === 'BUY' ? '🟢' : '🔴'}
                        </span>
                        <span className="font-semibold">
                          {order.type} {order.amount} {order.baseToken.symbol}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          order.status === 'EXECUTED'
                            ? 'bg-green-100 text-green-800'
                            : order.status === 'FAILED'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>
                          💰 <strong>Fiyat:</strong> {order.price} {order.quoteToken.symbol}
                        </p>
                        <p>
                          💵 <strong>Toplam:</strong> {order.total} {order.quoteToken.symbol}
                        </p>
                        {order.executedAt && (
                          <p>
                            ✅ <strong>Gerçekleşme:</strong> {order.executedAt.toLocaleString('tr-TR')}
                          </p>
                        )}
                        {order.transactionHash && (
                          <p className="font-mono text-xs">
                            🔗 <strong>Hash:</strong> {order.transactionHash}
                          </p>
                        )}
                        {order.error && (
                          <p className="text-red-600">
                            ❌ <strong>Hata:</strong> {order.error}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </Card>

      {/* Trading Statistics */}
      <Card title="📈 Trading İstatistikleri">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {orders.length}
            </div>
            <div className="text-sm text-gray-600">Toplam Emir</div>
          </div>
          
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {orders.filter(o => o.status === 'EXECUTED').length}
            </div>
            <div className="text-sm text-gray-600">Başarılı</div>
          </div>
          
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">
              {orders.filter(o => o.status === 'PENDING').length}
            </div>
            <div className="text-sm text-gray-600">Beklemede</div>
          </div>
          
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">
              {orders.filter(o => o.status === 'FAILED').length}
            </div>
            <div className="text-sm text-gray-600">Başarısız</div>
          </div>
        </div>
        
        <div className="mt-6 bg-purple-50 p-4 rounded-lg">
          <h4 className="font-semibold text-purple-800 mb-2">🎯 Popüler Testnet Trading Çiftleri:</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
            <span className="bg-white px-3 py-1 rounded-full text-center">XLM/USDC</span>
            <span className="bg-white px-3 py-1 rounded-full text-center">EURC/USDC</span>
            <span className="bg-white px-3 py-1 rounded-full text-center">XTAR/USDC</span>
            <span className="bg-white px-3 py-1 rounded-full text-center">XRP/USDC</span>
            <span className="bg-white px-3 py-1 rounded-full text-center">BTC/USDC</span>
            <span className="bg-white px-3 py-1 rounded-full text-center">AQUA/USDC</span>
            <span className="bg-white px-3 py-1 rounded-full text-center">BRL/USDC</span>
            <span className="bg-white px-3 py-1 rounded-full text-center">ARST/USDC</span>
          </div>
        </div>
      </Card>

      {/* Usage Instructions */}
      <Card title="📚 Kullanım Rehberi" className="bg-gray-50">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold mb-3">🚀 Hızlı Başlangıç:</h4>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
              <li>Tradingi başlatın</li>
              <li>Token çiftini seçin (örn: XLM/USDC)</li>
              <li>Emir türünü belirleyin (BUY/SELL)</li>
              <li>Strateji seçin (Market/Limit/Stop-Loss)</li>
              <li>Miktar ve fiyat girin</li>
              <li>Emri verin ve bekleyin!</li>
            </ol>
          </div>
          
          <div>
            <h4 className="font-semibold mb-3">💡 Pro İpuçları:</h4>
            <ul className="list-disc list-inside space-y-2 text-sm text-gray-700">
              <li><strong>Market:</strong> Anında işlem (spread riski)</li>
              <li><strong>Limit:</strong> Belirlediğiniz fiyatta işlem</li>
              <li><strong>Stop-Loss:</strong> Zarar durdurma emri</li>
              <li><strong>Slippage:</strong> %1 tolerance ayarlı</li>
              <li><strong>Çoklu Emir:</strong> Farklı tokenlar için aynı anda</li>
            </ul>
          </div>
        </div>
        
        <div className="mt-6 bg-yellow-100 border border-yellow-300 p-4 rounded-lg">
          <p className="text-yellow-800 font-medium">
            ⚠️ <strong>Risk Uyarısı:</strong> Crypto trading risklidir. Sadece kaybetmeyi göze alabileceğiniz miktarla işlem yapın.
            Testnette deneyim kazandıktan sonra mainnete geçin.
          </p>
        </div>
      </Card>
    </div>
  );
};