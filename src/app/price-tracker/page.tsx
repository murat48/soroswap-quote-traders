'use client';

import React from 'react';
import { usePriceTracker } from '@/hooks/use-price-tracker';
import { PriceDisplay } from '@/components/price-tracker/price-display';
import { AlertManager } from '@/components/price-tracker/alert-manager';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

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
                    onClick={() => startTracking(30000)}
                    variant="success"
                    className="w-full"
                  >
                    ▶️ Takibi Başlat (30s)
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
                  onClick={() => addAlert(currentPrice * 1.05, 'above')}
                  size="sm"
                  className="w-full text-xs"
                  disabled={currentPrice === 0}
                >
                  +5% Artış Uyarısı
                </Button>
                <Button
                  onClick={() => addAlert(currentPrice * 0.95, 'below')}
                  size="sm"
                  className="w-full text-xs"
                  disabled={currentPrice === 0}
                >
                  -5% Düşüş Uyarısı
                </Button>
                <Button
                  onClick={() => addAlert(currentPrice + 0.15, 'above')}
                  size="sm"
                  className="w-full text-xs"
                >
                Yukarı  $0.15 Hedefi
                </Button>
                     <Button
                  onClick={() => addAlert(currentPrice - 0.15, 'below')}
                  size="sm"
                  className="w-full text-xs"
                >
                Aşağı  $0.15 Hedefi
                </Button>
              </div>
            </Card>
          </div>

          {/* Sağ Panel - Alert Yönetimi */}
          <div className="lg:col-span-2">
            <AlertManager
              alerts={alerts}
              currentPrice={currentPrice}
              onAddAlert={addAlert}
              onRemoveAlert={removeAlert}
            />
          </div>
        </div>

        {/* Kullanım Talimatları */}
        <Card title="📘 Nasıl Kullanılır?" className="bg-blue-50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">1️⃣ Takibi Başlatın</h4>
              <p className="text-gray-600">
                Takibi Başlat butonuna tıklayın. Her 30 saniyede bir fiyat güncellenecek.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">2️⃣ Uyarı Ekleyin</h4>
              <p className="text-gray-600">
                Hedef fiyat belirleyin ve yukarı/aşağı koşulu seçin.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">3️⃣ Bildirimler</h4>
              <p className="text-gray-600">
                Hedef fiyata ulaşıldığında tarayıcı bildirimi alacaksınız.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">4️⃣ Takip Edin</h4>
              <p className="text-gray-600">
                Aktif uyarılarınızı ve fiyat geçmişini takip edin.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}