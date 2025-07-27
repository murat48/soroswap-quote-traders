'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { priceTracker } from '@/lib/price-trackeryeni';

export const TelegramSetup: React.FC = () => {
  const [chatId, setChatId] = useState<string>('');
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    setChatId(priceTracker.getTelegramChatId());
  }, []);

  const handleSave = () => {
    priceTracker.setTelegramChatId(chatId);
    alert('✅ Telegram Chat ID kaydedildi!');
  };

  const handleTest = async () => {
    setTesting(true);
    await priceTracker.sendTestMessage();
    setTesting(false);
  };

  return (
    <Card title="📱 Telegram Bot Kurulumu">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Telegram Chat ID
          </label>
          <input
            type="text"
            value={chatId}
            onChange={(e) => setChatId(e.target.value)}
            className="input-field"
            placeholder="123456789 veya @username"
          />
          <p className="text-xs text-gray-500 mt-1">
            @userinfobot kullanarak Chat IDnizi öğrenin
          </p>
        </div>

        <div className="flex gap-3">
          <Button onClick={handleSave} className="flex-1">
            💾 Kaydet
          </Button>
          <Button 
            onClick={handleTest}
            loading={testing}
            disabled={!chatId}
            variant="secondary"
          >
            🧪 Test
          </Button>
        </div>

        <div className="bg-blue-50 p-3 rounded text-sm">
          <h4 className="font-semibold mb-2">📋 Kurulum:</h4>
          <ol className="list-decimal list-inside space-y-1">
            <li>BotFatherdan bot oluşturun</li>
            <li>enve token ekleyin:</li>
            <code className="block bg-gray-100 p-1 text-xs mt-1">
              NEXT_PUBLIC_TELEGRAM_BOT_TOKEN=your_token
            </code>
            <li>userinfobotan Chat ID alın</li>
            <li>Yukarı girin ve test edin</li>
          </ol>
        </div>
      </div>
    </Card>
  );
};

