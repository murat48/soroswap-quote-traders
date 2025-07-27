'use client';

import { useState } from 'react';
import { FreighterConnector } from '@/components/wallet/freighter-connector';
import { QuoteForm } from '@/components/quote/quote-form';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useFreighter } from '@/hooks/use-freighter';
import { soroswapAPI } from '@/lib/api';
import { ASSET_OPTIONS, DEFAULT_PROTOCOLS, DEFAULT_SLIPPAGE, DEFAULT_FEE_BPS } from '@/lib/constants';
import { formatAmount, formatPercentage } from '@/lib/utils';
import { Quote, BuildResponse, SendResponse } from '@/types';

export default function HomePage() {
  const freighter = useFreighter();
  const { isConnected, publicKey, signTransaction } = freighter;
  const [loading, setLoading] = useState<boolean>(false);
  
  // Quote form state
  const [assetIn, setAssetIn] = useState<string>(ASSET_OPTIONS[0].value);
  const [assetOut, setAssetOut] = useState<string>(ASSET_OPTIONS[1].value);
  const [amount, setAmount] = useState<string>('1000000000');
  const [tradeType, setTradeType] = useState<'EXACT_IN' | 'EXACT_OUT'>('EXACT_IN');
  
  // Results state
  const [quote, setQuote] = useState<Quote | null>(null);
  const [transaction, setTransaction] = useState<BuildResponse | null>(null);
  const [txResult, setTxResult] = useState<SendResponse | null>(null);

  const getAssetSymbol = (assetAddress: string): string => {
    const asset = ASSET_OPTIONS.find(a => a.value === assetAddress);
    return asset?.symbol || 'Unknown';
  };

  const swapAssets = (): void => {
    const temp = assetIn;
    setAssetIn(assetOut);
    setAssetOut(temp);
    resetResults();
  };

  const resetResults = (): void => {
    setQuote(null);
    setTransaction(null);
    setTxResult(null);
  };

  const getQuote = async (): Promise<void> => {
    if (!isConnected) {
      alert('Önce Freighter wallet\'ı bağlayın');
      return;
    }

    setLoading(true);
    try {
      const quoteData = await soroswapAPI.getQuote({
        assetIn,
        assetOut,
        amount,
        tradeType:'EXACT_IN',
        protocols: DEFAULT_PROTOCOLS,
        slippageTolerance: DEFAULT_SLIPPAGE,
        // gaslessTrustline: 'create',
        // gaslessTrustline: true,
        feeBps: DEFAULT_FEE_BPS
      });
      
      setQuote(quoteData);
    } catch (error) {
      console.error('Quote hatası:', error);
      alert('Quote alınamadı: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const buildTransaction = async (): Promise<void> => {
    if (!quote) return;
// sponsor: publicKey,
//         from: publicKey
    setLoading(true);
    try {
      const buildData = await soroswapAPI.buildTransaction({
        quote,
        referralId: "GALAXYVOIDAOPZTDLHILAJQKCVVFMD4IKLXLSZV5YHO7VY74IWZILUTO",
        sponsor: "GDISPX62G6EGBZX3I2VMB4J3O3CPFHHRAJ4QZNOYVXYVHJ6BVRL2A3Y3",
        from: "GALDPLQ62RAX3V7RJE73D3C2F4SKHGCJ3MIYJ4MLU2EAIUXBDSUVS7SA"

      });
      
      setTransaction(buildData);
    } catch (error) {
      console.error('Transaction build hatası:', error);
      alert('Transaction build edilemedi: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const signAndSendTx = async (): Promise<void> => {
    if (!transaction) return;

    setLoading(true);
    try {
      const signedXdr = await signTransaction(transaction.xdr);
       console.log(signedXdr);
      const result = await soroswapAPI.sendTransaction({ xdr: signedXdr });
      
      setTxResult(result);
      alert('Transaction başarıyla gönderildi!');
    } catch (error) {
      console.error('Transaction gönderme hatası:', error);
      alert('Transaction gönderilemedi: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-8">
      <div className="max-w-2xl mx-auto px-4 space-y-6">
        <h1 className="text-3xl font-bold text-center text-gray-800">
          Soroswap Quote Trader
        </h1>

        {/* Wallet Connection */}
        <FreighterConnector />

        {/* Quote Form */}
        <QuoteForm
          assetIn={assetIn}
          assetOut={assetOut}
          amount={amount}
          tradeType={tradeType}
          loading={loading}
          isConnected={isConnected}
          onAssetInChange={(value) => { setAssetIn(value); resetResults(); }}
          onAssetOutChange={(value) => { setAssetOut(value); resetResults(); }}
          onAmountChange={(value) => { setAmount(value); resetResults(); }}
          onTradeTypeChange={(value) => { setTradeType(value); resetResults(); }}
          onSwapAssets={swapAssets}
          onGetQuote={getQuote}
        />

        {/* Quote Results */}
        {quote && (
          <Card title="Quote Result" className="bg-green-50 border border-green-200">
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <p><strong>Amount In:</strong> {formatAmount(quote.amountIn)} {getAssetSymbol(quote.assetIn)}</p>
                <p><strong>Amount Out:</strong> {formatAmount(quote.amountOut)} {getAssetSymbol(quote.assetOut)}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <p><strong>Price Impact:</strong> 
                  <span className={parseFloat(quote.priceImpactPct) > 5 ? 'text-red-600 ml-1' : 'text-green-600 ml-1'}>
                    {formatPercentage(quote.priceImpactPct)}
                  </span>
                </p>
                <p><strong>Platform:</strong> {quote.platform}</p>
              </div>
              {quote.platformFee && (
                <p><strong>Platform Fee:</strong> {formatAmount(quote.platformFee.feeAmount)} ({quote.platformFee.feeBps} bps)</p>
              )}
            </div>
            
            <Button
              onClick={buildTransaction}
              loading={loading}
              variant="primary"
              className="mt-4"
            >
              Build Transaction
            </Button>
          </Card>
        )}

        {/* Transaction Ready */}
        {transaction && (
          <Card title="Transaction Ready" className="bg-yellow-50 border border-yellow-200">
            <p className="text-sm text-gray-600 mb-3">
              Transaction is ready to be signed and sent.
            </p>
            <p className="text-xs text-gray-500 mb-3 break-all">
              {/* XDR: {transaction.xdr.substring(0, 50)}... */}
               XDR: {transaction.xdr}
            </p>
            
            <Button
              onClick={signAndSendTx}
              loading={loading}
              variant="error"
            >
              Sign & Send Transaction
            </Button>
          </Card>
        )}

        {/* Transaction Result */}
        {txResult && (
          <Card title="Transaction Result" className="bg-green-100 border border-green-200">
            <div className="text-sm space-y-1">
              {txResult.hash && (
                <p className="break-all">
                  <strong>Hash:</strong> {txResult.hash}
                </p>
              )}
              {txResult.status && (
                <p><strong>Status:</strong> {txResult.status}</p>
              )}
              {txResult.message && (
                <p><strong>Message:</strong> {txResult.message}</p>
              )}
            </div>
          </Card>
        )}

        {/* Instructions */}
        <Card title="Setup Instructions" className="bg-gray-50">
          <ol className="text-sm space-y-2 list-decimal list-inside">
            <li>Create <code className="bg-gray-200 px-1 rounded">.env.local</code> with your API credentials</li>
            <li>Install and connect Freighter wallet</li>
            <li>Select assets and amount for trading</li>
            <li>Get quote and review the trade details</li>
            <li>Build, sign and send transaction</li>
          </ol>
        </Card>
      </div>
    </div>
  );
}