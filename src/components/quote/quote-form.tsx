'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ASSET_OPTIONS } from '@/lib/constants';
import { formatAmount } from '@/lib/utils';
import { AssetOption } from '@/types';

interface QuoteFormProps {
  assetIn: string;
  assetOut: string;
  amount: string;
  tradeType: 'EXACT_IN' | 'EXACT_OUT';
  loading: boolean;
  isConnected: boolean;
  onAssetInChange: (value: string) => void;
  onAssetOutChange: (value: string) => void;
  onAmountChange: (value: string) => void;
  onTradeTypeChange: (value: 'EXACT_IN' | 'EXACT_OUT') => void;
  onSwapAssets: () => void;
  onGetQuote: () => void;
}

export const QuoteForm: React.FC<QuoteFormProps> = ({
  assetIn,
  assetOut,
  amount,
  tradeType,
  loading,
  isConnected,
  onAssetInChange,
  onAssetOutChange,
  onAmountChange,
  onTradeTypeChange,
  onSwapAssets,
  onGetQuote,
}) => {
  const getAssetSymbol = (assetAddress: string): string => {
    const asset: AssetOption | undefined = ASSET_OPTIONS.find(a => a.value === assetAddress);
    return asset?.symbol || 'Unknown';
  };

  return (
    <Card title="Trade Configuration">
      <div className="space-y-4">
        <div className="relative">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Asset In</label>
              <select
                value={assetIn}
                onChange={(e) => onAssetInChange(e.target.value)}
                className="select-field"
              >
                {ASSET_OPTIONS.map(asset => (
                  <option key={asset.value} value={asset.value}>{asset.label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Asset Out</label>
              <select
                value={assetOut}
                onChange={(e) => onAssetOutChange(e.target.value)}
                className="select-field"
              >
                {ASSET_OPTIONS.map(asset => (
                  <option key={asset.value} value={asset.value}>{asset.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Swap Button */}
          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 md:top-8">
            <button
              onClick={onSwapAssets}
              className="bg-gray-200 hover:bg-gray-300 rounded-full p-2 transition-colors"
              title="Swap Assets"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Amount (Stroop)</label>
            <input
              type="text"
              value={amount}
              onChange={(e) => onAmountChange(e.target.value)}
              className="input-field"
              placeholder="1000000000"
            />
            <p className="text-xs text-gray-500 mt-1">
              ≈ {formatAmount(amount)} {getAssetSymbol(assetIn)}
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Trade Type</label>
            <select
              value={tradeType}
              onChange={(e) => onTradeTypeChange(e.target.value as 'EXACT_IN' | 'EXACT_OUT')}
              className="select-field"
            >
              <option value="EXACT_IN">Exact In</option>
              <option value="EXACT_OUT">Exact Out</option>
            </select>
          </div>
        </div>

        <Button
          onClick={onGetQuote}
          disabled={!isConnected}
          loading={loading}
          variant="success"
          className="w-full"
        >
          Get Quote
        </Button>
      </div>
    </Card>
  );
};