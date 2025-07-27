'use client';

import React from 'react';
import { useFreighter } from '@/hooks/use-freighter';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { formatAddress } from '@/lib/utils';

export const FreighterConnector: React.FC = () => {
  const freighter = useFreighter();
  const { isAvailable, isConnected, publicKey, error, connect } = freighter;

  if (!isAvailable) {
    return (
      <Card className="bg-red-50 border border-red-200">
        <p className="text-red-600">
          Freighter wallet doğru şekilde tespit edilemedi. Lütfen{' '}
          <a href="https://freighter.app/" target="_blank" rel="noopener noreferrer" className="underline">
            Freighter&apos;ı
          </a>{' '}
          yeniden başlatın veya tarayıcınızı yenileyin.
        </p>
      </Card>
    );
  }

  if (isConnected) {
    return (
      <Card className="bg-green-50 border border-green-200">
        <div className="text-green-600">
          <p>✅ Bağlandı: {formatAddress(publicKey)}</p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="space-y-3">
        <h3 className="font-semibold">Wallet Bağlantısı</h3>
        {error && (
          <p className="text-red-600 text-sm">{error}</p>
        )}
        <Button onClick={connect} variant="primary">
          Freightera Bağlan
        </Button>
      </div>
    </Card>
  );
};
export default FreighterConnector;