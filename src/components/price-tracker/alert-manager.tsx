'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PriceAlert } from '@/types/price-tracker';

interface AlertManagerProps {
  alerts: PriceAlert[];
  currentPrice: number;
  onAddAlert: (targetPrice: number, condition: 'above' | 'below') => void;
  onRemoveAlert: (alertId: string) => void;
}

export const AlertManager: React.FC<AlertManagerProps> = ({
  alerts,
  currentPrice,
  onAddAlert,
  onRemoveAlert
}) => {
  const [targetPrice, setTargetPrice] = useState<string>('');
  const [condition, setCondition] = useState<'above' | 'below'>('above');

  const handleAddAlert = () => {
    const price = parseFloat(targetPrice);
    if (isNaN(price) || price <= 0) {
      alert('Geçerli bir fiyat girin');
      return;
    }

    onAddAlert(price, condition);
    setTargetPrice('');
  };

  const formatAlertTime = (date: Date): string => {
    return date.toLocaleString('tr-TR');
  };

  return (
    <div className="space-y-4">
      {/* Yeni Alert Ekleme */}
      <Card title="Yeni Fiyat Uyarısı Ekle">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Hedef Fiyat ($)
              </label>
              <input
                type="number"
                step="0.0001"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                className="input-field"
                placeholder="0.1250"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                Uyarı Koşulu
              </label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value as 'above' | 'below')}
                className="select-field"
              >
                <option value="above">Yukarı Çıktığında</option>
                <option value="below">Aşağı İndiğinde</option>
              </select>
            </div>
            
            <div className="flex items-end">
              <Button onClick={handleAddAlert} className="w-full">
                🔔 Uyarı Ekle
              </Button>
            </div>
          </div>
          
          <div className="text-xs text-gray-600 bg-blue-50 p-2 rounded">
            Güncel XLM fiyatı: <strong>${currentPrice.toFixed(4)}</strong>
          </div>
        </div>
      </Card>

      {/* Mevcut Alert'ler */}
      <Card title={`Fiyat Uyarıları (${alerts.length})`}>
        {alerts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <span className="text-4xl mb-2 block">📭</span>
            Henüz uyarı eklenmemiş
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map(alert => (
              <div
                key={alert.id}
                className={`p-3 rounded-lg border-2 ${
                  alert.triggeredAt
                    ? 'bg-green-50 border-green-200'
                    : alert.isActive
                    ? 'bg-blue-50 border-blue-200'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">
                        {alert.triggeredAt ? '✅' : alert.isActive ? '⏰' : '⏸️'}
                      </span>
                      <span className="font-medium">
                        ${alert.targetPrice.toFixed(4)}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        alert.condition === 'above' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {alert.condition === 'above' ? '↗️ Yukarı' : '↘️ Aşağı'}
                      </span>
                    </div>
                    
                    <div className="text-xs text-gray-600">
                      Oluşturulma: {formatAlertTime(alert.createdAt)}
                      {alert.triggeredAt && (
                        <span className="ml-2 text-green-600">
                          | Tetiklendi: {formatAlertTime(alert.triggeredAt)}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => onRemoveAlert(alert.id)}
                    variant="error"
                    size="sm"
                  >
                    🗑️
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};