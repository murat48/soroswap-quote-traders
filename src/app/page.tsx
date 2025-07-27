'use client';

import { useState } from 'react';
import { useFreighter } from '@/hooks/use-freighter';
import { soroswapAPI } from '@/lib/api';
import { ASSET_OPTIONS, DEFAULT_PROTOCOLS, DEFAULT_SLIPPAGE, DEFAULT_FEE_BPS } from '@/lib/constants';
import { formatAmount, formatPercentage } from '@/lib/utils';
import { Quote, BuildResponse, SendResponse } from '@/types';

export default function HomePage() {
  const { isConnected, publicKey, connect, signTransaction } = useFreighter();
  const [loading, setLoading] = useState<boolean>(false);
  
  // Quote form state
  const [assetIn, setAssetIn] = useState<string>(ASSET_OPTIONS[0].value);
  const [assetOut, setAssetOut] = useState<string>(ASSET_OPTIONS[1].value);
  const [amount, setAmount] = useState<string>('10'); // Kullanıcı dostu format
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


  

  // Kullanıcı dostu miktarı stroop'a çevir (7 decimal)
  const toStroop = (val: string): string => {
    return (parseFloat(val) * 1e7).toFixed(0);
  };

  const connectWallet = async (): Promise<void> => {
    try {
      await connect();
    } catch (error) {
      alert('Freighter bağlantısı başarısız: ' + (error as Error).message);
    }
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
        amount: toStroop(amount),
        tradeType: 'EXACT_IN',
        protocols: DEFAULT_PROTOCOLS, // Now correctly formatted as array of arrays
        slippageTolerance: DEFAULT_SLIPPAGE, // Using slippageBps instead of slippageTolerance
        feeBps: DEFAULT_FEE_BPS,
        parts: 1, // Lower parts for better stability
        maxHops: 1 // Maximum 2 hops
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
    setLoading(true);
    try {
      const buildData = await soroswapAPI.buildTransaction({
        quote,
        referralId: "GALAXYVOIDAOPZTDLHILAJQKCVVFMD4IKLXLSZV5YHO7VY74IWZILUTO",
        sponsor: "GDISPX62G6EGBZX3I2VMB4J3O3CPFHHRAJ4QZNOYVXYVHJ6BVRL2A3Y3",
        from: "GCNA5EMJNXZPO57ARVJYQ5SN2DYYPD6ZCCENQ5AQTMVNKN77RDIPMI3A",
     
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 via-purple-400/10 to-pink-400/10"></div>
      <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
      <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-md border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">💫</span>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
                Soroswap Trader
              </h1>
            </div>
            
            {/* Wallet Connection Status */}
            <div className="flex items-center space-x-4">
              {isConnected ? (
                <div className="flex items-center space-x-3 bg-emerald-500/20 text-emerald-100 px-4 py-2 rounded-full text-sm backdrop-blur-sm border border-emerald-400/30">
                  <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
                  <span className="font-medium">
                    {publicKey ? `${publicKey.slice(0, 6)}...${publicKey.slice(-4)}` : 'Connected'}
                  </span>
                </div>
              ) : (
                <button
                  onClick={connectWallet}
                  className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white px-6 py-2.5 rounded-full font-medium transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 backdrop-blur-sm"
                >
                  Connect Freighter
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 py-8 relative z-10">
        {!isConnected ? (
          /* Wallet Connection Screen */
          <div className="text-center py-20">
            <div className="w-32 h-32 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-3xl mx-auto mb-8 flex items-center justify-center shadow-2xl animate-pulse">
              <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-4xl font-bold text-white mb-6 bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
              Connect Your Wallet
            </h2>
            <p className="text-gray-300 mb-10 text-xl max-w-md mx-auto leading-relaxed">
              Connect your Freighter wallet to start trading on Soroswap with the best rates
            </p>
            <button
              onClick={connectWallet}
              className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white px-10 py-5 rounded-2xl font-semibold text-xl transition-all duration-300 shadow-2xl hover:shadow-3xl hover:scale-105 transform"
            >
              🚀 Connect Freighter Wallet
            </button>
          </div>
        ) : (
          /* Trading Interface */
          <div className="space-y-8">
            {/* Trading Form */}
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden transform hover:scale-[1.02] transition-all duration-300">
              <div className="bg-gradient-to-r from-blue-500/80 via-purple-500/80 to-pink-500/80 px-8 py-6 backdrop-blur-sm">
                <h2 className="text-white text-2xl font-bold flex items-center">
                  <span className="mr-3">💎</span>
                  Trade Assets
                </h2>
              </div>
              
              <div className="p-8 space-y-8">
                {/* Asset Selection */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-gray-200 mb-3">From</label>
                    <select
                      value={assetIn}
                      onChange={(e) => { setAssetIn(e.target.value); resetResults(); }}
                      className="w-full p-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-white placeholder-gray-300 transition-all duration-200"
                    >
                      {ASSET_OPTIONS.map((asset) => (
                        <option key={asset.value} value={asset.value} className="bg-gray-800 text-white">
                          {asset.symbol}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-gray-200 mb-3">To</label>
                    <select
                      value={assetOut}
                      onChange={(e) => { setAssetOut(e.target.value); resetResults(); }}
                      className="w-full p-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-white placeholder-gray-300 transition-all duration-200"
                    >
                      {ASSET_OPTIONS.map((asset) => (
                        <option key={asset.value} value={asset.value} className="bg-gray-800 text-white">
                          {asset.symbol}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Swap Button */}
                <div className="flex justify-center">
                  <button
                    onClick={swapAssets}
                    className="bg-white/10 hover:bg-white/20 backdrop-blur-sm p-3 rounded-full transition-all duration-300 hover:scale-110 border border-white/20"
                  >
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                    </svg>
                  </button>
                </div>

                {/* Amount Input */}
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-200 mb-3">
                    Amount ({getAssetSymbol(assetIn)})
                  </label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => { setAmount(e.target.value); resetResults(); }}
                    placeholder="Enter amount"
                    className="w-full p-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-white placeholder-gray-300 text-lg transition-all duration-200"
                  />
                </div>

                {/* Get Quote Button */}
                <button
                  onClick={getQuote}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 disabled:from-gray-500 disabled:to-gray-600 text-white py-4 rounded-xl font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02] transform"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Getting Quote...
                    </span>
                  ) : (
                    '🔮 Get Quote'
                  )}
                </button>
              </div>
            </div>

            {/* Quote Results */}
            {quote && (
              <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden transform hover:scale-[1.02] transition-all duration-300">
                <div className="bg-gradient-to-r from-emerald-500/80 via-teal-500/80 to-cyan-500/80 px-8 py-6 backdrop-blur-sm">
                  <h3 className="text-white text-xl font-bold flex items-center">
                    <span className="mr-3">✨</span>
                    Quote Result
                  </h3>
                </div>
                
                <div className="p-8 space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl border border-white/20">
                      <p className="text-sm text-gray-300 mb-2">Amount In</p>
                      <p className="text-xl font-bold text-white">{formatAmount(quote.amountIn)} {getAssetSymbol(quote.assetIn)}</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl border border-white/20">
                      <p className="text-sm text-gray-300 mb-2">Amount Out</p>
                      <p className="text-xl font-bold text-white">{formatAmount(quote.amountOut)} {getAssetSymbol(quote.assetOut)}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl border border-white/20">
                      <p className="text-sm text-gray-300 mb-2">Price Impact</p>
                      <p className={`text-xl font-bold ${parseFloat(quote.priceImpactPct) > 5 ? 'text-red-400' : 'text-emerald-400'}`}>
                        {formatPercentage(quote.priceImpactPct)}
                      </p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl border border-white/20">
                      <p className="text-sm text-gray-300 mb-2">Platform</p>
                      <p className="text-xl font-bold text-white">{quote.platform}</p>
                    </div>
                  </div>

                  {quote.platformFee && (
                    <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl border border-white/20">
                      <p className="text-sm text-gray-300 mb-2">Platform Fee</p>
                      <p className="text-xl font-bold text-white">
                        {formatAmount(quote.platformFee.feeAmount)} ({quote.platformFee.feeBps} bps)
                      </p>
                    </div>
                  )}

                  <button
                    onClick={buildTransaction}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-600 disabled:from-gray-500 disabled:to-gray-600 text-white py-4 rounded-xl font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02] transform"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Building...
                      </span>
                    ) : (
                      '⚡ Build Transaction'
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Transaction Ready */}
            {transaction && (
              <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden transform hover:scale-[1.02] transition-all duration-300">
                <div className="bg-gradient-to-r from-amber-500/80 via-orange-500/80 to-red-500/80 px-8 py-6 backdrop-blur-sm">
                  <h3 className="text-white text-xl font-bold flex items-center">
                    <span className="mr-3">🔥</span>
                    Transaction Ready
                  </h3>
                </div>
                
                <div className="p-8 space-y-6">
                  <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl border border-white/20">
                    <p className="text-gray-300 text-lg leading-relaxed">
                      Your transaction is ready to be signed and sent to the Stellar network. 
                      Click below to proceed with Freighter wallet.
                    </p>
                  </div>
                  
                  <button
                    onClick={signAndSendTx}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 hover:from-amber-600 hover:via-orange-600 hover:to-red-600 disabled:from-gray-500 disabled:to-gray-600 text-white py-4 rounded-xl font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02] transform"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Sending...
                      </span>
                    ) : (
                      '🚀 Sign & Send Transaction'
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Transaction Result */}
            {txResult && (
              <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden transform hover:scale-[1.02] transition-all duration-300">
                <div className="bg-gradient-to-r from-emerald-500/80 via-green-500/80 to-teal-500/80 px-8 py-6 backdrop-blur-sm">
                  <h3 className="text-white text-xl font-bold flex items-center">
                    <span className="mr-3">🎉</span>
                    Transaction Result
                  </h3>
                </div>
                
                <div className="p-8 space-y-6">
                  {txResult.hash && (
                    <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl border border-white/20">
                      <p className="text-sm text-gray-300 mb-3">Transaction Hash</p>
                      <p className="text-sm font-mono break-all text-emerald-400 bg-black/20 p-3 rounded-lg">{txResult.hash}</p>
                    </div>
                  )}
                  {txResult.status && (
                    <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl border border-white/20">
                      <p className="text-sm text-gray-300 mb-3">Status</p>
                      <p className="text-xl font-bold text-emerald-400">{txResult.status}</p>
                    </div>
                  )}
                  {txResult.message && (
                    <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl border border-white/20">
                      <p className="text-sm text-gray-300 mb-3">Message</p>
                      <p className="text-lg text-white">{txResult.message}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}