/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { usePriceTracker } from '@/hooks/use-price-trackernew';
import { PriceDisplay } from '@/components/price-tracker/price-display';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useFreighter } from '@/hooks/use-freighter';
import { soroswapAPI } from '@/lib/api';
import { ASSET_OPTIONS, DEFAULT_PROTOCOLS, ASSET_CONFIGS, DEFAULT_ASSET_CONFIG } from '@/lib/constants';
import { formatAmount, formatPercentage } from '@/lib/utils';


export default function PriceBasedAutoTrader() {
  const {
    currentPrice,
    isTracking,
    lastUpdate,
    error,
    startTracking,
    stopTracking
  } = usePriceTracker();

  // Telegram bot
  const [telegramBot, setTelegramBot] = useState<any>(null);
  const [telegramChatId, setTelegramChatId] = useState('');

  // Freighter wallet
  const freighter = useFreighter();
  const { isAvailable, isConnected, publicKey, connect, signTransaction, error: freighterError } = freighter;

  // 🎯 Pre-Authorization States (Gelişmiş Transfer Sistemi)
  const [preAuthBuyOrder, setPreAuthBuyOrder] = useState<{
    targetPrice: string;
    amount: string;
    requiredXLM?: number;
    estimatedOutput?: number;
    transferHash?: string;
    expiry: Date;
    status: string;
    isBot?: boolean;
  } | null>(null);
  
  const [preAuthSellOrder, setPreAuthSellOrder] = useState<{
    targetPrice: string;
    amount: string;
    expiry: Date;
    status: string;
    isBot?: boolean;
  } | null>(null);

  // 🤖 Grid Trading Bot - Otomatik Alım + Satım Sistemi
  const [gridTradingBot, setGridTradingBot] = useState<{
    buyPrice: string;
    sellPrice: string;
    buyAmount: string;
    sellAmount: string;
    isActive: boolean;
    currentStep: 'waiting_buy' | 'waiting_sell' | 'completed';
    purchasedAmount?: string;
    buyHash?: string;
    sellHash?: string;
    expiry: Date;
    status: string;
    isBot?: boolean;
  } | null>(null);

  // 🤖 Bot Wallet Sistemi
  const [botWallet, setBotWallet] = useState<{
    publicKey: string;
    secretKey: string;
  } | null>(null);
  const [botMode, setBotMode] = useState<'manual' | 'auto'>('manual');
  const [botBalance, setBotBalance] = useState<number>(0);
  const [customWalletAddress, setCustomWalletAddress] = useState('GALA3KXZFMIQISYVBONAJH3A64CJMPYIMRC4ZTLAQ54AYE6XLYC2HE3M');
  
  // 💰 Auto Funding Control State - Tekrarlı işlemleri engellemek için
  const [isAutoFunding, setIsAutoFunding] = useState<boolean>(false);

  // 🎯 Fiyat Bazlı Otomatik İşlem - Ana Odak
  const [autoTradeAssetIn, setAutoTradeAssetIn] = useState(ASSET_OPTIONS[0].value); // XLM
  const [autoTradeAssetOut, setAutoTradeAssetOut] = useState(ASSET_OPTIONS[2].value); // USDC
  const [buyTargetPrice, setBuyTargetPrice] = useState('');
  const [sellTargetPrice, setSellTargetPrice] = useState('');
  const [autoBuyAmount, setAutoBuyAmount] = useState('');
  const [autoSellAmount, setAutoSellAmount] = useState('');
  const [isAutoTradingEnabled, setIsAutoTradingEnabled] = useState(false);
  const [autoTradeStatus, setAutoTradeStatus] = useState<string | null>(null);
  const [isTrading, setIsTrading] = useState(false);
  const [hasAutoTradeError, setHasAutoTradeError] = useState(false);
  const lastAutoTradeCheck = useRef<Date | null>(null);

  // 🤖 Grid Trading Bot Input States
  const [gridBuyPrice, setGridBuyPrice] = useState('');
  const [gridSellPrice, setGridSellPrice] = useState('');
  const [gridBuyAmount, setGridBuyAmount] = useState('');
  const [gridSellAmount, setGridSellAmount] = useState('');
  
  // 📊 Manuel Fiyat Kontrolü
  const [manualPriceMode, setManualPriceMode] = useState(false);
  const [manualPrice, setManualPrice] = useState('');

  // 🎯 Hedef Ulaşma Durumu - Telegram ve Freighter Trigger
  const [lastBuyTargetReached, setLastBuyTargetReached] = useState<boolean>(false);
  const [lastSellTargetReached, setLastSellTargetReached] = useState<boolean>(false);
  const [buyTargetNotificationSent, setBuyTargetNotificationSent] = useState<boolean>(false);
  const [sellTargetNotificationSent, setSellTargetNotificationSent] = useState<boolean>(false);

  // 💰 Token Değişim Maliyeti States (Ana sayfa gibi)
  const [buyQuote, setBuyQuote] = useState<any>(null);
  const [sellQuote, setSellQuote] = useState<any>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);

  // 🤖 Grid Trading Bot Quote States
  const [gridBuyQuote, setGridBuyQuote] = useState<any>(null);
  const [gridSellQuote, setGridSellQuote] = useState<any>(null);
  const [gridQuoteLoading, setGridQuoteLoading] = useState(false);

  // Fiyat belirleme mantığı - currentPrice'ı override etmek için
  const displayPrice = manualPriceMode && manualPrice ? parseFloat(manualPrice) : currentPrice;

  // Asset seçimi değiştiğinde aynı token seçilmemesini sağla
  const handleAutoTradeAssetInChange = (newAssetIn: string): void => {
    setAutoTradeAssetIn(newAssetIn);
    
    // Eğer To'da aynı token seçiliyse, farklı bir token seç
    if (newAssetIn === autoTradeAssetOut) {
      const availableAssets = ASSET_OPTIONS.filter(asset => asset.value !== newAssetIn);
      if (availableAssets.length > 0) {
        setAutoTradeAssetOut(availableAssets[0].value);
      }
    }
  };

  const handleAutoTradeAssetOutChange = (newAssetOut: string): void => {
    setAutoTradeAssetOut(newAssetOut);
    
    // Eğer From'da aynı token seçiliyse, farklı bir token seç
    if (newAssetOut === autoTradeAssetIn) {
      const availableAssets = ASSET_OPTIONS.filter(asset => asset.value !== newAssetOut);
      if (availableAssets.length > 0) {
        setAutoTradeAssetIn(availableAssets[0].value);
      }
    }
  };

  // Ana sayfa ile aynı dynamic trade functions
  const getAssetSymbol = useCallback((assetAddress: string): string => {
    const asset = ASSET_OPTIONS.find(a => a.value === assetAddress);
    return asset?.symbol || 'Unknown';
  }, []);

  // Asset'lere göre dinamik maxHops ve slippage hesaplama (Ana sayfa ile aynı)
  const getDynamicTradeParams = useCallback((assetInAddress: string, assetOutAddress: string) => {
    const assetInSymbol = getAssetSymbol(assetInAddress);
    const assetOutSymbol = getAssetSymbol(assetOutAddress);
    
    // Her iki asset için konfigürasyonları al (type-safe)
    const assetInConfig = (ASSET_CONFIGS as any)[assetInSymbol] || DEFAULT_ASSET_CONFIG;
    const assetOutConfig = (ASSET_CONFIGS as any)[assetOutSymbol] || DEFAULT_ASSET_CONFIG;
    
    // En yüksek maxHops ve slippage değerlerini kullan (daha güvenli)
    const maxHops = Math.max(assetInConfig.maxHops, assetOutConfig.maxHops);
    const slippageBps = Math.max(assetInConfig.slippageBps, assetOutConfig.slippageBps);
    
    console.log(`🔧 Dynamic Trade Params:
    - ${assetInSymbol}: maxHops=${assetInConfig.maxHops}, slippage=${assetInConfig.slippageBps}
    - ${assetOutSymbol}: maxHops=${assetOutConfig.maxHops}, slippage=${assetOutConfig.slippageBps}
    - Final: maxHops=${maxHops}, slippage=${slippageBps}`);
    
    return { maxHops, slippageBps };
  }, [getAssetSymbol]);

  // Kullanıcı dostu miktarı stroop'a çevir (7 decimal) - Ana sayfa ile aynı
  const toStroop = (val: string): string => {
    return (parseFloat(val) * 1e7).toFixed(0);
  };

  // Quote hesaplama fonksiyonu (Ana sayfa gibi)
  const calculateQuote = useCallback(async (type: 'buy' | 'sell') => {
    if (!isConnected) return;
    
    const amount = type === 'buy' ? autoBuyAmount : autoSellAmount;
    if (!amount || parseFloat(amount) <= 0) {
      if (type === 'buy') setBuyQuote(null);
      else setSellQuote(null);
      return;
    }

    setQuoteLoading(true);
    
    try {
      // Dinamik trade parametrelerini al
      const { maxHops, slippageBps } = getDynamicTradeParams(autoTradeAssetIn, autoTradeAssetOut);
      
      const params = {
        assetIn: type === 'buy' ? autoTradeAssetIn : autoTradeAssetOut,
        assetOut: type === 'buy' ? autoTradeAssetOut : autoTradeAssetIn,
        amount: toStroop(amount),
        tradeType: 'EXACT_IN' as const,
        protocols: DEFAULT_PROTOCOLS,
        slippageBps: slippageBps,
        feeBps: 50,
        parts: 1,
        maxHops: maxHops
      };

      const quoteData = await soroswapAPI.getQuote(params);
      
      if (type === 'buy') {
        setBuyQuote(quoteData);
      } else {
        setSellQuote(quoteData);
      }
      
    } catch (error: any) {
      console.error(`${type} quote hatası:`, error);
      if (type === 'buy') setBuyQuote(null);
      else setSellQuote(null);
    } finally {
      setQuoteLoading(false);
    }
  }, [isConnected, autoBuyAmount, autoSellAmount, autoTradeAssetIn, autoTradeAssetOut, getDynamicTradeParams]);

  // Grid Trading Bot için quote hesaplama fonksiyonu
  const calculateGridQuote = useCallback(async (type: 'buy' | 'sell') => {
    if (!isConnected) return;
    
    const amount = type === 'buy' ? gridBuyAmount : gridSellAmount;
    if (!amount || parseFloat(amount) <= 0) {
      if (type === 'buy') setGridBuyQuote(null);
      else setGridSellQuote(null);
      return;
    }

    setGridQuoteLoading(true);
    
    try {
      // Dinamik trade parametrelerini al
      const { maxHops, slippageBps } = getDynamicTradeParams(autoTradeAssetIn, autoTradeAssetOut);
      
      const params = {
        assetIn: type === 'buy' ? autoTradeAssetIn : autoTradeAssetOut,
        assetOut: type === 'buy' ? autoTradeAssetOut : autoTradeAssetIn,
        amount: toStroop(amount),
        tradeType: 'EXACT_IN' as const,
        protocols: DEFAULT_PROTOCOLS,
        slippageBps: slippageBps,
        feeBps: 50,
        parts: 1,
        maxHops: maxHops
      };

      const quoteData = await soroswapAPI.getQuote(params);
      
      if (type === 'buy') {
        setGridBuyQuote(quoteData);
      } else {
        setGridSellQuote(quoteData);
      }
      
    } catch (error: any) {
      console.error(`Grid ${type} quote hatası:`, error);
      if (type === 'buy') setGridBuyQuote(null);
      else setGridSellQuote(null);
    } finally {
      setGridQuoteLoading(false);
    }
  }, [isConnected, gridBuyAmount, gridSellAmount, autoTradeAssetIn, autoTradeAssetOut, getDynamicTradeParams]);

  // Amount değişikliklerinde quote'u güncelle
  useEffect(() => {
    const timer = setTimeout(() => {
      if (autoBuyAmount) calculateQuote('buy');
    }, 500); // 500ms debounce
    return () => clearTimeout(timer);
  }, [autoBuyAmount, calculateQuote]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (autoSellAmount) calculateQuote('sell');
    }, 500); // 500ms debounce
    return () => clearTimeout(timer);
  }, [autoSellAmount, calculateQuote]);

  // Trading pair değişikliklerinde quote'ları temizle
  useEffect(() => {
    setBuyQuote(null);
    setSellQuote(null);
    setGridBuyQuote(null);
    setGridSellQuote(null);
  }, [autoTradeAssetIn, autoTradeAssetOut]);

  // Grid Trading Bot amount değişikliklerinde quote'u güncelle
  useEffect(() => {
    const timer = setTimeout(() => {
      if (gridBuyAmount) {
        calculateGridQuote('buy');
      }
    }, 500); // 500ms debounce
    return () => clearTimeout(timer);
  }, [gridBuyAmount, calculateGridQuote]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (gridSellAmount) {
        calculateGridQuote('sell');
      }
    }, 500); // 500ms debounce
    return () => clearTimeout(timer);
  }, [gridSellAmount, calculateGridQuote]);

  // Telegram bot yükle
  useEffect(() => {
    const loadTelegramBot = async () => {
      if (typeof window !== 'undefined') {
        try {
          const { telegramBot: bot } = await import('@/lib/telegram');
          setTelegramBot(bot);
          const storedChatId = localStorage.getItem('telegram_chat_id');
          if (storedChatId) setTelegramChatId(storedChatId);
        } catch (error) {
          console.error('Telegram bot yükleme hatası:', error);
        }
      }
    };
    loadTelegramBot();
  }, []);

  // 🎯 Hedef Ulaşma Notification ve Freighter Trigger Fonksiyonu
  const handleTargetReached = useCallback(async (type: 'buy' | 'sell', targetPrice: string, currentPrice: number) => {
    const messageType = type === 'buy' ? '💰 Automatic Purchase' : '💰 Automatic Sales';
    const emoji = type === 'buy' ? '📈' : '📉';
    
    // Telegram mesajı gönder
    if (telegramBot && telegramChatId) {
      try {
        const message = `${emoji} ${messageType} - TARGET REACHED! 🎯

🎯 Target Price: ${targetPrice}
💲 Current Price: ${currentPrice}
📅 Date: ${new Date().toLocaleString('tr-TR')}

${type === 'buy' ? '🛒' : '💸'} Waiting for Freighter signature for transaction...
⚡ Please check your wallet!`;

        await telegramBot.sendMessage(telegramChatId, message);
        console.log(`✅ Telegram notification sent: ${messageType} target reached`);
      } catch (error) {
        console.error('Telegram message sending error:', error);
      }
    }

    // Freighter'ı tetikle (imza için)
    if (isConnected) {
      try {
        // Pre-auth order yoksa kullanıcıyı uyar
        if (type === 'buy' && !preAuthBuyOrder) {
          alert(`${emoji} TARGET REACHED! 🎯\n\nHowever, no pre-auth buy order found.\nPlease create a pre-auth buy order first.`);
          return;
        } else if (type === 'sell' && !preAuthSellOrder) {
          alert(`${emoji} TARGET REACHED! 🎯\n\nHowever, no pre-auth sell order found.\nPlease create a pre-auth sell order first.`);
          return;
        }

        // Kullanıcıya bildirim göster
        alert(`${emoji} ${messageType} - TARGET REACHED! 🎯\n\nTarget: ${targetPrice}\nCurrent: ${currentPrice}\n\nYour pre-auth command is available! You can trigger it manually.`);

      } catch (error) {
        console.error('Freighter trigger error:', error);
        alert(`❌ ${messageType} trigger error:\n${error}`);
      }
    } else {
      alert(`${emoji} ${messageType} - TARGET REACHED! 🎯\n\nHowever, your wallet is not connected.\nPlease connect your wallet first.`);
    }
  }, [telegramBot, telegramChatId, isConnected, preAuthBuyOrder, preAuthSellOrder]);

  // 🎯 Hedef Ulaşma Kontrol useEffect
  useEffect(() => {
    if (!currentPrice || !isTracking) return;

    const displayPrice = manualPriceMode ? parseFloat(manualPrice || '0') : currentPrice;
    
    // Buy target kontrolü
    if (buyTargetPrice && !buyTargetNotificationSent) {
      const isBuyTargetReached = displayPrice <= parseFloat(buyTargetPrice);
      
      if (isBuyTargetReached && !lastBuyTargetReached) {
        setBuyTargetNotificationSent(true);
        setLastBuyTargetReached(true);
        
        // Hedef ulaşıldığında tetikle
        (async () => {
          await handleTargetReached('buy', buyTargetPrice, displayPrice);
        })();
      }
    }

    // Sell target kontrolü  
    if (sellTargetPrice && !sellTargetNotificationSent) {
      const isSellTargetReached = displayPrice >= parseFloat(sellTargetPrice);
      
      if (isSellTargetReached && !lastSellTargetReached) {
        setSellTargetNotificationSent(true);
        setLastSellTargetReached(true);
        
        // Hedef ulaşıldığında tetikle
        (async () => {
          await handleTargetReached('sell', sellTargetPrice, displayPrice);
        })();
      }
    }

    // Reset notification flags when target is no longer reached
    if (buyTargetPrice && buyTargetNotificationSent) {
      const isBuyTargetReached = displayPrice <= parseFloat(buyTargetPrice);
      if (!isBuyTargetReached) {
        setBuyTargetNotificationSent(false);
        setLastBuyTargetReached(false);
      }
    }

    if (sellTargetPrice && sellTargetNotificationSent) {
      const isSellTargetReached = displayPrice >= parseFloat(sellTargetPrice);
      if (!isSellTargetReached) {
        setSellTargetNotificationSent(false);
        setLastSellTargetReached(false);
      }
    }

  }, [currentPrice, manualPriceMode, manualPrice, buyTargetPrice, sellTargetPrice, isTracking, 
      buyTargetNotificationSent, sellTargetNotificationSent, lastBuyTargetReached, lastSellTargetReached, handleTargetReached]);

  // � Target Price değiştiğinde notification flag'lerini reset et
  useEffect(() => {
    setBuyTargetNotificationSent(false);
    setLastBuyTargetReached(false);
  }, [buyTargetPrice]);

  useEffect(() => {
    setSellTargetNotificationSent(false);
    setLastSellTargetReached(false);
  }, [sellTargetPrice]);

  // �🔗 Freighter Bağlantı Fonksiyonu (Ana sayfa ile aynı)
  const connectWallet = async (): Promise<void> => {
    try {
      await connect();
    } catch (error) {
      const errorMessage = (error as Error).message;
      console.error('Connect error:', errorMessage);
      
      // Freighter yüklü değilse kullanıcıyı yönlendir
      if (errorMessage.includes('Freighter extension not installed')) {
        alert(`❌ Freighter Extension Required\n\n1. For Chrome/Edge: https://chrome.google.com/webstore/detail/freighter/bcacfldlkkdogcmkkibnjlakofdplcbk\n2. For Firefox: https://addons.mozilla.org/en-US/firefox/addon/freighter/\n\nPlease refresh the page after installing the extension.`);
        // Kullanıcıyı Freighter yükleme sayfasına yönlendir
        window.open('https://freighter.app/', '_blank');
      } else {
        alert('Freighter connection failed: ' + errorMessage);
      }
    }
  };

  // Freighter bağlantı durumu manuel kontrolü
  const checkFreighterConnection = useCallback(async () => {
    try {
      console.log('🔍 Manual Freighter connection check...');
      
      // Freighter API'sine manuel erişim deneyelim
      const { isConnected: checkIsConnected } = await import('@stellar/freighter-api');
      
      if (typeof checkIsConnected === 'function') {
        const connectionResult = await checkIsConnected();
        const currentlyConnected = connectionResult?.isConnected || false;
        
        console.log('🔍 Manual connection check result:', currentlyConnected);
        
        if (currentlyConnected !== isConnected) {
          console.log('⚠️ Connection status changed! Old:', isConnected, 'New:', currentlyConnected);

          // Eğer bağlantı kesilmişse kullanıcıyı bilgilendir
          if (isConnected && !currentlyConnected) {
            console.log('❌ Freighter wallet connection lost!');
            
            // Toast bildirimi için state ekleyelim
            setAutoTradeStatus('❌ Freighter wallet connection lost! Please reconnect.');
            
            // Otomatik trading'i durdur
            setIsAutoTradingEnabled(false);
            
            // Telegram bildirimi gönder
            if (telegramBot && telegramChatId) {
              try {
                await telegramBot.sendMessage(telegramChatId, 
                  '⚠️ FREIGHTER CONNECTION ERROR\n\n' +
                  '❌ Freighter wallet connection lost!\n' +
                  '🔴 Automatic trading stopped\n' +
                  '🔗 Please reconnect your wallet\n\n' +
                  `⏰ Time: ${new Date().toLocaleString('tr-TR')}`
                );
              } catch (telegramError) {
                console.error('Telegram notification error:', telegramError);
              }
            }
          } else if (!isConnected && currentlyConnected) {
            console.log('✅ Freighter wallet connection detected!');
            setAutoTradeStatus('✅ Freighter wallet connection detected!');
          } else {
            setAutoTradeStatus('🔍 Freighter status checked - Connection ' + (currentlyConnected ? 'active' : 'inactive'));
          }
        } else {
          setAutoTradeStatus('🔍 Freighter status checked - Connection ' + (currentlyConnected ? 'active ✅' : 'inactive ❌'));
        }
      } else {
        setAutoTradeStatus('❌ Freighter API inaccessible');
      }
    } catch (error) {
      console.log('❌ Manual Freighter connection check error:', error);
      setAutoTradeStatus('❌ Freighter connection check error: ' + (error as Error).message);
    }
  }, [isConnected, telegramBot, telegramChatId]);

  // Sayfa odağa geldiğinde Freighter durumunu kontrol et
  useEffect(() => {
    const handleFocus = () => {
      console.log('👁️ Page is in focus, Freighter control is being performed...');
      checkFreighterConnection();
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('👁️ The page is now visible, Freighter control is being performed...');
        checkFreighterConnection();
      }
    };

    // Event listener'ları ekle
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [checkFreighterConnection]);

  // Bot Balance Kontrolü
  const checkBotBalance = useCallback(async (botPublicKey: string) => {
    try {
      // Stellar balance API call
      const response = await fetch(`https://horizon-testnet.stellar.org/accounts/${botPublicKey}`);
      if (response.ok) {
        const account = await response.json();
        const xlmBalance = account.balances.find((b: any) => b.asset_type === 'native');
        setBotBalance(parseFloat(xlmBalance?.balance || '0'));
      }
    } catch (error) {
      console.error('Bot balance check error:', error);
    }
  }, []);

  // 💰 Auto Funding Function - Bot wallet'e 2 XLM transfer
  const autoFundBotWallet = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    try {
      // 🚨 Eğer zaten auto funding devam ediyorsa, tekrar başlatma
      if (isAutoFunding) {
        return { success: false, error: 'Auto funding already in progress' };
      }

      if (!botWallet) {
        return { success: false, error: 'Bot wallet not found' };
      }

      if (!isConnected || !publicKey) {
        return { success: false, error: 'Freighter wallet not connected' };
      }

      // 💰 Gerekli XLM miktarını hesapla
      let requiredAmount = 2; // Default 2 XLM
      if (gridBuyQuote && gridBuyQuote.amountIn) {
        try {
          const formatAmount = (amount: string): string => {
            return (parseFloat(amount) / 10000000).toFixed(7);
          };
          requiredAmount = parseFloat(formatAmount(gridBuyQuote.amountIn)) + 0.0002;
        } catch {
          console.log('Grid quote amount calculation failed, using default 2 XLM');
          requiredAmount = 2;
        }
      }

      // 🚨 Bot wallet balance kontrolü - Eğer yeterli XLM varsa transfer etme
      if (botBalance >= requiredAmount) {
        setAutoTradeStatus(`✅ Bot wallet already has sufficient balance (${botBalance.toFixed(4)} XLM >= ${requiredAmount.toFixed(4)} XLM)`);
        
        // Telegram bildirimi - Transfer gerekmiyor
        if (telegramBot && telegramChatId) {
          const message = `💰 AUTO FUNDING SKIPPED!
✅ Bot wallet already has sufficient balance
💳 Current Balance: ${botBalance.toFixed(4)} XLM
🎯 Required: ${requiredAmount.toFixed(4)} XLM
🤖 Bot wallet: ${botWallet.publicKey.slice(0, 8)}...${botWallet.publicKey.slice(-8)}
⏰ ${new Date().toLocaleString('tr-TR')}`;
          
          try {
            await telegramBot.sendMessage(telegramChatId, message);
          } catch (telegramError) {
            console.error('Telegram notification error:', telegramError);
          }
        }
        
        return { success: true }; // Transfer gerekmiyor ama işlem başarılı sayılır
      }

      // Auto funding başladığını işaretle
      setIsAutoFunding(true);
      
      // Transfer edilecek miktar (önceden hesaplanmış)
      const amount = requiredAmount;
      setAutoTradeStatus(`💰 Transferring ${amount.toFixed(4)} XLM to bot wallet...`);
            setAutoTradeStatus(`💰 Transferring ${amount} XLM to bot wallet...`);
    


      // Stellar SDK kullanarak XLM transfer işlemi
      const StellarSdk = await import('@stellar/stellar-sdk');
      const server = new StellarSdk.Horizon.Server('https://horizon-testnet.stellar.org');

      // Hesap yükle
      const sourceAccount = await server.loadAccount(publicKey);
      
      // Transaction oluştur
      const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: StellarSdk.Networks.TESTNET
      })
        .addOperation(
          StellarSdk.Operation.payment({
            destination: botWallet.publicKey,
            asset: StellarSdk.Asset.native(),
            amount: amount.toString()
          })
        )
        .setTimeout(300)
        .build();

      // Freighter ile işlem imzala
      const xdrString = transaction.toEnvelope().toXDR('base64');
      const signedTransaction = await signTransaction(xdrString);

      // İşlemi submit et  
      const signedTx = new StellarSdk.Transaction(signedTransaction, StellarSdk.Networks.TESTNET);
      const result = await server.submitTransaction(signedTx);

      if (result.successful || result.hash) {
        setAutoTradeStatus(`✅ ${amount} XLM successfully transferred to bot wallet!`);
         
        // Bot balance güncelle
        setTimeout(() => checkBotBalance(botWallet.publicKey), 2000);

        // Telegram bildirimi
        if (telegramBot && telegramChatId) {
          const message = `💰 AUTO FUNDING COMPLETED!
✅ ${amount} XLM transferred to bot wallet
🤖 Bot wallet: ${botWallet.publicKey.slice(0, 8)}...${botWallet.publicKey.slice(-8)}
🔗 Hash: ${result.hash}
⏰ ${new Date().toLocaleString('tr-TR')}`;
          
          await telegramBot.sendMessage(telegramChatId, message);
        }
setIsAutoFunding(false);
        return { success: true };
      } else {
        throw new Error('Transaction failed');
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setAutoTradeStatus(`❌ Auto funding failed: ${errorMessage}`);
      
      // Telegram hata bildirimi
      if (telegramBot && telegramChatId) {
//         const message = `❌ AUTO FUNDING FAILED!
// 💰 Failed to transfer 2 XLM to bot wallet
// 🚫 Error: ${errorMessage}
// ⏰ ${new Date().toLocaleString('tr-TR')}`;
        
        // await telegramBot.sendMessage(telegramChatId, message);
      }

      return { success: false, error: errorMessage };
    } finally {
      // Auto funding tamamlandığını işaretle (başarılı ya da başarısız)
      setIsAutoFunding(false);
    }
  }, [botWallet, isConnected, publicKey, signTransaction, checkBotBalance, telegramBot, telegramChatId, isAutoFunding, gridBuyQuote, botBalance]);

  // 🤖 Bot Wallet Oluşturma/Yükleme
  useEffect(() => {
    const loadBotWallet = () => {
      try {
        const storedWallet = localStorage.getItem('bot_wallet');
        if (storedWallet && publicKey) {
          const wallet = JSON.parse(storedWallet);
          setBotWallet(wallet);
          // Bot balance kontrol et
          checkBotBalance(wallet.publicKey);
        }
        
        // Custom wallet adresini yükle
        const storedCustomAddress = localStorage.getItem('custom_wallet_address');
        if (storedCustomAddress) {
          setCustomWalletAddress(storedCustomAddress);
        }
      } catch (error) {
        console.error('Bot wallet loading error:', error);
      }
    };
    
    if (publicKey) {
      loadBotWallet();
    }
  }, [publicKey, checkBotBalance]);

  // 🤖 Yeni Bot Wallet Oluşturma
  const createBotWallet = useCallback(async () => {
    try {
      if (!publicKey) {
        throw new Error('An error occurred: Wallet is not connected');
      }

      // Stellar SDK ile yeni keypair oluştur
      const StellarSdk = await import('@stellar/stellar-sdk');
      const keypair = StellarSdk.Keypair.random();
      
      const newBotWallet = {
        publicKey: keypair.publicKey(),
        secretKey: keypair.secret()
      };

      setBotWallet(newBotWallet);
      localStorage.setItem('bot_wallet', JSON.stringify(newBotWallet));
      
      setAutoTradeStatus(`🤖 Bot cüzdanı oluşturuldu!
📍 Bot Address: ${newBotWallet.publicKey}
💰 Please transfer XLM to this address (about ~0.5-2 XLM per transaction)
🔑 The secret key is securely stored
⚠️ After XLM transfer, the bot will be active
🎯 The bot will make transactions from its own wallet`);

      // Balance kontrol et
      setTimeout(() => checkBotBalance(newBotWallet.publicKey), 2000);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`❌ Bot wallet creation error: ${errorMessage}`);
    }
  }, [publicKey, checkBotBalance]);



  // 📦 LocalStorage'dan pre-auth orders yükle
  useEffect(() => {
    if (publicKey) {
      try {
        const buyOrder = localStorage.getItem(`preauth_buy_${publicKey}`);
        const sellOrder = localStorage.getItem(`preauth_sell_${publicKey}`);
        const gridBot = localStorage.getItem(`grid_bot_${publicKey}`);
        
        if (buyOrder) {
          const parsed = JSON.parse(buyOrder);
          // Geçerlilik kontrolü
          if (new Date(parsed.expiry) > new Date()) {
            setPreAuthBuyOrder({
              ...parsed,
              expiry: new Date(parsed.expiry)
            });
          } else {
            localStorage.removeItem(`preauth_buy_${publicKey}`);
          }
        }
        
        if (sellOrder) {
          const parsed = JSON.parse(sellOrder);
          // Geçerlilik kontrolü
          if (new Date(parsed.expiry) > new Date()) {
            setPreAuthSellOrder({
              ...parsed,
              expiry: new Date(parsed.expiry)
            });
          } else {
            localStorage.removeItem(`preauth_sell_${publicKey}`);
          }
        }

        if (gridBot) {
          const parsed = JSON.parse(gridBot);
          // Geçerlilik kontrolü
          if (new Date(parsed.expiry) > new Date()) {
            setGridTradingBot({
              ...parsed,
              expiry: new Date(parsed.expiry)
            });
          } else {
            localStorage.removeItem(`grid_bot_${publicKey}`);
          }
        }


      } catch (error) {
        console.error('❌ LocalStorage order loading error:', error);
      }
    }
  }, [publicKey]);

  // 💸 Freighter ile bot'a XLM transfer etme fonksiyonu (Manual mode için)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const transferXLMToBot = useCallback(async (requiredXLM: number) => {
    try {
      if (!publicKey || !botWallet || !signTransaction) {
        throw new Error('Wallet information is missing.');
      }

      // Freighter bağlantısını kontrol et
      if (!isConnected) {
        setAutoTradeStatus('🔗 Freighter connection required. Reconnecting...');
        try {
          await connect();
          // Bağlantı için kısa bekle
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          if (!isConnected) {
            throw new Error('Could not connect to Freighter. Please check the Freighter extension in the browser and connect manually.');
          }
        } catch (connectError) {
          throw new Error(`Freighter connection error: ${connectError}. Please refresh the page and connect manually.`);
        }
      }

      setAutoTradeStatus(`💰 Freighter ile ${requiredXLM.toFixed(2)} XLM transfer ediliyor...`);

      // Stellar SDK ile payment transaction oluştur
      const StellarSdk = await import('@stellar/stellar-sdk');
      const server = new StellarSdk.Horizon.Server('https://horizon-testnet.stellar.org');
      
      // Ana cüzdan account bilgilerini al
      const sourceAccount = await server.loadAccount(publicKey);
      
      // Payment transaction oluştur
      const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: StellarSdk.Networks.TESTNET,
      })
      .addOperation(StellarSdk.Operation.payment({
        destination: botWallet.publicKey,
        asset: StellarSdk.Asset.native(),
        amount: requiredXLM.toFixed(7),
      }))
      .setTimeout(180)
      .build();

      // Transaction XDR'ını al
      const xdr = transaction.toEnvelope().toXDR('base64');
      
      setAutoTradeStatus(`🔐 Waiting for Freighter signature...`);
      
      // 📱 Telegram bildirimi: XLM transfer için manuel imza gerekli
      if (telegramBot && telegramChatId) {
        const message = `💸 XLM TRANSFER - MANUAL SIGNATURE REQUIRED!

📱 Freighter wallet is waiting for confirmation
🤖 XLM transfer to bot wallet
💰 Amount: ${requiredXLM.toFixed(4)} XLM
🏦 Bot Wallet: ${botWallet?.publicKey.slice(0, 10)}...${botWallet?.publicKey.slice(-10)}
⏰ ${new Date().toLocaleString('tr-TR')}

⚡ Please check your Freighter wallet and confirm the transfer!`;

        try {
          await telegramBot.sendMessage(telegramChatId, message);
        } catch (tgError) {
          console.warn('Telegram notification could not be sent:', tgError);
        }
      }
      
      // Freighter ile imzala
      const signedXDR = await signTransaction(xdr);
      
      // 📱 Telegram bildirimi: XLM transfer imza başarılı
      if (telegramBot && telegramChatId) {
        const message = `✅ XLM TRANSFER SIGNATURE SUCCESSFUL!

🔐 Freighter wallet signature received
💸 XLM transfer to bot wallet
💰 Amount: ${requiredXLM.toFixed(4)} XLM
🏦 Bot Wallet: ${botWallet?.publicKey.slice(0, 10)}...${botWallet?.publicKey.slice(-10)}
⏰ ${new Date().toLocaleString('tr-TR')}

📤 Transfer blockchain'e gönderiliyor...`;
        
        try {
          await telegramBot.sendMessage(telegramChatId, message);
        } catch (tgError) {
          console.warn('Telegram notification could not be sent:', tgError);
        }
      }

      setAutoTradeStatus(`🔄 Transfer is being sent...`);

      // İmzalı transaction'ı gönder
      const signedTransaction = new StellarSdk.Transaction(signedXDR, StellarSdk.Networks.TESTNET);
      const result = await server.submitTransaction(signedTransaction);
      
      setAutoTradeStatus(`✅ Transfer successful! Hash: ${result.hash}`);
      
      // Bot balance'ını güncelle
      setTimeout(() => checkBotBalance(botWallet.publicKey), 3000);
      
      return { success: true, hash: result.hash };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Transfer error';
      setAutoTradeStatus(`❌ Transfer error: ${errorMessage}`);
      return { success: false, error: errorMessage };
    }
  }, [publicKey, botWallet, signTransaction, checkBotBalance, connect, isConnected, telegramBot, telegramChatId]);

  // 💸 Bot'dan kullanıcıya XLM iade etme fonksiyonu
  const refundXLMFromBot = useCallback(async (amount: number) => {
    try {
      if (!publicKey || !botWallet) {
        throw new Error('Wallet information is missing.');
      }

      setAutoTradeStatus(`💸 Refunding ${amount.toFixed(2)} XLM...`);

      const StellarSdk = await import('@stellar/stellar-sdk');
      const server = new StellarSdk.Horizon.Server('https://horizon-testnet.stellar.org');
      
      // Bot account bilgilerini al
      const botAccount = await server.loadAccount(botWallet.publicKey);
      const botKeypair = StellarSdk.Keypair.fromSecret(botWallet.secretKey);
      
      // İade transaction oluştur
      const transaction = new StellarSdk.TransactionBuilder(botAccount, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: StellarSdk.Networks.TESTNET,
      })
      .addOperation(StellarSdk.Operation.payment({
        destination: publicKey,
        asset: StellarSdk.Asset.native(),
        amount: amount.toFixed(7),
      }))
      .setTimeout(180)
      .build();

      // Bot imza at
      transaction.sign(botKeypair);
      
      // Gönder
      const result = await server.submitTransaction(transaction);

      setAutoTradeStatus(`✅ Refund successful! Hash: ${result.hash}`);

      // Bot balance'ını güncelle
      setTimeout(() => checkBotBalance(botWallet.publicKey), 3000);
      
      return { success: true, hash: result.hash };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Refund error';
      setAutoTradeStatus(`❌ Refund error: ${errorMessage}`);
      return { success: false, error: errorMessage };
    }
  }, [publicKey, botWallet, checkBotBalance]);

  // 🎯 Pre-Authorization Functions (Manuel ve Bot Modları)
  const createPreAuthBuyOrder = useCallback(async (useBot = false) => {
    try {
      if (!buyTargetPrice || !autoBuyAmount) {
        throw new Error('Target price and amount must be entered.');
      }

      if (!publicKey || !isConnected) {
        throw new Error('Wallet is not connected.');
      }

      const assetInSymbol = ASSET_OPTIONS.find(a => a.value === autoTradeAssetIn)?.symbol;
      const assetOutSymbol = ASSET_OPTIONS.find(a => a.value === autoTradeAssetOut)?.symbol;

      if (!useBot || botMode === 'manual') {
        // 👤 Manuel Mod - Basit onay sistemi
        const confirmed = window.confirm(
          `👤 MANUAL BUY ORDER\n\n` +
          `💰 Amount to buy: ${autoBuyAmount} ${assetInSymbol} ${'→'} ${assetOutSymbol}\n` +
          `📊 Target Price: $${buyTargetPrice}\n` +
          `💵 Current Price: $${displayPrice.toFixed(4)}\n\n` +
          `👤 In manual mode, you will sign each transaction with Freighter\n` +
          `💰 You will be exiting from your main wallet\n\n` +
          `Do you confirm this buy order?`
        );

        if (!confirmed) {
          setAutoTradeStatus('❌ Manual buy order canceled.');
          return;
        }

        // Manuel pre-auth order oluştur
        const order = {
          targetPrice: buyTargetPrice,
          amount: autoBuyAmount,
          expiry: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 saat geçerli
          status: `✅ MANUAL BUY ORDER ACTIVE!
💰 Amount to buy: ${autoBuyAmount} ${assetInSymbol}${'→'} ${assetOutSymbol}
🎯 Target Price: $${buyTargetPrice}
👤 Manual Mode: Sign each transaction with Freighter
⏰ Expiry: 2 hours
📊 Price tracking active...`
        };

        setPreAuthBuyOrder(order);
        localStorage.setItem(`preauth_buy_${publicKey}`, JSON.stringify(order));
        setAutoTradeStatus('✅ Manual buy order active! Waiting for target price...');

      } else if (useBot && botMode === 'auto' && botWallet) {
        // 🤖 Bot Mod - Auto mode: XLM transferi olmadan direkt order oluştur
        setAutoTradeStatus('🤖 Auto mode: Creating bot buy order without XLM transfer...');
        
        try {
          // Quote al tahmini çıktı için (Ana sayfa ile aynı parametreler)
          const { maxHops, slippageBps } = getDynamicTradeParams(autoTradeAssetIn, autoTradeAssetOut);
          
          const quoteResponse = await soroswapAPI.getQuote({
            assetIn: autoTradeAssetIn,
            assetOut: autoTradeAssetOut,
            amount: toStroop(autoBuyAmount),
            tradeType: 'EXACT_IN' as const,
            protocols: DEFAULT_PROTOCOLS,
            slippageBps: slippageBps, // Dinamik slippage
            feeBps: 50,
            parts: 1,
            maxHops: maxHops // Dinamik maxHops
          });

          const estimatedOutput = parseFloat(quoteResponse.amountOut || '0') / 10000000;

          // Auto Bot pre-auth order oluştur (XLM transfer olmadan)
          const order = {
            targetPrice: buyTargetPrice,
            amount: autoBuyAmount,
            estimatedOutput: estimatedOutput,
            expiry: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 saat geçerli
            isBot: true,
            status: `✅ AUTO BOT BUY ORDER IS ACTIVE!
💰 Amount to buy: ${autoBuyAmount} ${assetInSymbol} ${'→'} ${assetOutSymbol}
🎯 Target Price: $${buyTargetPrice}
💸 Token to receive: ~${estimatedOutput.toFixed(4)} ${assetOutSymbol}
🤖 Auto Bot: Wallet ready (no XLM transfer needed)
⏰ Expiry: 2 hours
📊 PC can be off - Bot will follow automatically!`
          };

          setPreAuthBuyOrder(order);
          localStorage.setItem(`preauth_buy_${publicKey}`, JSON.stringify(order));
          setAutoTradeStatus('✅ Auto bot buy order active! Waiting for target price...');

        } catch (quoteError) {
          // Quote alamazsak basit onay
          console.error('Quote hatası:', quoteError);
          setAutoTradeStatus('⚠️ Quote could not be retrieved, simple auto bot buy order is being created...');
          
          const order = {
            targetPrice: buyTargetPrice,
            amount: autoBuyAmount,
            expiry: new Date(Date.now() + 2 * 60 * 60 * 1000),
            isBot: true,
            status: `✅ AUTO BOT BUY ORDER IS ACTIVE!
💰 Amount to buy: ${autoBuyAmount} ${assetInSymbol} ${'→'} ${assetOutSymbol}
🎯 Target Price: $${buyTargetPrice}
🤖 Auto Bot: Wallet ready (no XLM transfer needed)
⏰ Expiry: 2 hours`
          };

          setPreAuthBuyOrder(order);
          localStorage.setItem(`preauth_buy_${publicKey}`, JSON.stringify(order));
          setAutoTradeStatus('✅ Auto bot buy order active! Waiting for target price...');
        }
      } else {
        throw new Error('Bot mode selected but bot wallet not created. Please create a bot wallet first.');
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setAutoTradeStatus(`❌ Buy order confirmation error: ${errorMessage}`);
    }
  }, [buyTargetPrice, autoBuyAmount, publicKey, isConnected, displayPrice, autoTradeAssetIn, autoTradeAssetOut, botMode, botWallet, getDynamicTradeParams]);

  const createPreAuthSellOrder = useCallback(async (useBot = false) => {
    try {
      if (!sellTargetPrice || !autoSellAmount) {
        throw new Error('Enter target price and quantity.');
      }

      if (!publicKey || !isConnected) {
        throw new Error('Wallet is not connected.');
      }

      const assetInSymbol = ASSET_OPTIONS.find(a => a.value === autoTradeAssetIn)?.symbol;
      const assetOutSymbol = ASSET_OPTIONS.find(a => a.value === autoTradeAssetOut)?.symbol;

      if (!useBot || botMode === 'manual') {
        // 👤 Manuel Mod - Basit onay sistemi
        const confirmed = window.confirm(
          `👤 MANUAL SELL ORDER CONFIRMATION\n\n` +
          `💸 Amount to sell: ${autoSellAmount} ${assetOutSymbol} ${'→'} ${assetInSymbol}\n` +
          `📊 Target Price: $${sellTargetPrice}\n` +
          `💵 Current Price: $${currentPrice.toFixed(4)}\n\n` +
          `👤 In manual mode, you will sign each transaction with Freighter\n` +
          `💰 You will withdraw from your token wallet\n\n` +
          `Do you confirm this sell order?`
        );

        if (!confirmed) {
          setAutoTradeStatus('❌ Manual sell order canceled.');
          return;
        }

        // Manuel pre-auth order oluştur
        const order = {
          targetPrice: sellTargetPrice,
          amount: autoSellAmount,
          expiry: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 saat geçerli
          status: `✅ MANUAL SELL ORDER ACTIVE!
💸 Amount to sell: ${autoSellAmount} ${assetInSymbol}
🎯 Target Price: $${sellTargetPrice}
👤 Manual Mode: Each transaction requires a signature
⏰ Expiry: 2 hours
📊 Price tracking active...`
        };

        setPreAuthSellOrder(order);
        localStorage.setItem(`preauth_sell_${publicKey}`, JSON.stringify(order));
        setAutoTradeStatus('✅ Manual sell order active! Waiting for target price...');

      } 
      else if (useBot && botMode === 'auto' && botWallet) {
        // 🤖 Bot Mod - Auto mode: XLM/Token transferi olmadan direkt order oluştur
        setAutoTradeStatus('🤖 Auto mode: Creating bot sell order without transfers...');
        
        try {
          // Quote al tahmini çıktı için (Ana sayfa ile aynı parametreler)
          const { maxHops, slippageBps } = getDynamicTradeParams(autoTradeAssetIn, autoTradeAssetOut);
          
          const quoteResponse = await soroswapAPI.getQuote({
            assetIn: autoTradeAssetIn,
            assetOut: autoTradeAssetOut,
            amount: toStroop(autoSellAmount),
            tradeType: 'EXACT_IN' as const,
            protocols: DEFAULT_PROTOCOLS,
            slippageBps: slippageBps, // Dinamik slippage
            feeBps: 50,
            parts: 1,
            maxHops: maxHops // Dinamik maxHops
          });

          const estimatedOutput = parseFloat(quoteResponse.amountOut || '0') / 10000000;

          // Auto Bot pre-auth order oluştur (transfer olmadan)
          const order = {
            targetPrice: sellTargetPrice,
            amount: autoSellAmount,
            estimatedOutput: estimatedOutput,
            expiry: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 saat geçerli
            isBot: true,
            status: `✅ AUTO BOT SELL ORDER ACTIVE!
💸 Amount to sell: ${autoSellAmount} ${assetInSymbol} ${'→'} ${assetOutSymbol}
🎯 Target Price: $${sellTargetPrice}
💸 Estimated Token: ~${estimatedOutput.toFixed(4)} ${assetOutSymbol}
🤖 Auto Bot: Wallet ready (no transfers needed)
⏰ Expiry: 2 hours
📊 PC may be offline - Bot will track price automatically!`
          };

          setPreAuthSellOrder(order);
          localStorage.setItem(`preauth_sell_${publicKey}`, JSON.stringify(order));
          setAutoTradeStatus('✅ Auto bot sell order active! Waiting for target price...');

        } catch (quoteError) {
          // Quote alamazsak basit onay
          console.error('Quote error:', quoteError);
          setAutoTradeStatus('⚠️ Quote not available, creating simple auto bot sell order...');
          
          const order = {
            targetPrice: sellTargetPrice,
            amount: autoSellAmount,
            expiry: new Date(Date.now() + 2 * 60 * 60 * 1000),
            isBot: true,
            status: `✅ AUTO BOT SELL ORDER ACTIVE!
💸 Amount to sell: ${autoSellAmount} ${assetInSymbol}
🎯 Target Price: $${sellTargetPrice}
🤖 Auto Bot: Wallet ready (no transfers needed)
⏰ Expiry: 2 hours`
          };

          setPreAuthSellOrder(order);
          localStorage.setItem(`preauth_sell_${publicKey}`, JSON.stringify(order));
          setAutoTradeStatus('✅ Auto bot sell order active! Waiting for target price...');
        }
      } else {
        throw new Error('Bot mode selected but bot wallet not created. Please create a bot wallet first.');
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setAutoTradeStatus(`❌ Sell order confirmation error: ${errorMessage}`);
    }
  }, [sellTargetPrice, autoSellAmount, publicKey, isConnected, currentPrice, autoTradeAssetIn, autoTradeAssetOut, botMode, botWallet, getDynamicTradeParams]);

  // 🤖 Grid Trading Bot - Otomatik Alım + Satım Fonksiyonu
  
  
  
  
  const createGridTradingBot = useCallback(async (useBot = false) => {
    debugger;
    try {
      if (!gridBuyPrice || !gridSellPrice || !gridBuyAmount || !gridSellAmount) {
        throw new Error('Please enter the buy price, sell price, buy amount, and sell amount.');
      }

      if (!publicKey || !isConnected) {
        throw new Error('Wallet is not connected.');
      }

      const buyPrice = parseFloat(gridBuyPrice);
      const sellPrice = parseFloat(gridSellPrice);
      const buyAmount = parseFloat(gridBuyAmount);
      const sellAmount = parseFloat(gridSellAmount);

      if (buyPrice >= sellPrice) {
        throw new Error('Buy price must be lower than sell price.');
      }

      if (buyPrice <= 0 || sellPrice <= 0 || buyAmount <= 0 || sellAmount <= 0) {
        throw new Error('All values must be positive.');
      }

      const assetInSymbol = ASSET_OPTIONS.find(a => a.value === autoTradeAssetIn)?.symbol;
      const assetOutSymbol = ASSET_OPTIONS.find(a => a.value === autoTradeAssetOut)?.symbol;

      if (!useBot || botMode === 'manual') {
        // 👤 Manuel Grid Trading Bot
        const confirmed = window.confirm(
          `👤 GRID TRADING BOT CONFIRMATION\n\n` +
          `� OPERATION SEQUENCE (Automatic Loop):\n` +
          `1️⃣ BUY: When price reaches $${gridBuyPrice} or lower (≤ equal or below)\n` +
          `   → ${gridBuyAmount} ${assetInSymbol} will be purchased\n` +
          `2️⃣ SELL: After purchase, when price reaches $${gridSellPrice} or higher (≥ equal or above)\n` +
          `   → ${gridSellAmount} ${assetOutSymbol} will be sold\n` +
          `3️⃣ PROFIT: Profit will be transferred to your main wallet\n\n` +
          `📊 Buy Price: $${gridBuyPrice}\n` +
          `📊 Sell Price: $${gridSellPrice}\n` +
          `💰 Buy Amount: ${gridBuyAmount} ${assetOutSymbol}\n` +
          `💰 Sell Amount: ${gridSellAmount} ${assetInSymbol}\n` +
          `📈 Expected Profit: ${((sellPrice - buyPrice) / buyPrice * 100).toFixed(2)}%\n\n` +
          `👤 Manual mode requires signing with Freighter for each transaction\n` +
          `⚠️ IMPORTANT: First BUY, then SELL occurs\n\n` +
          `Do you confirm this grid trading bot?`
        );

        if (!confirmed) {
          setAutoTradeStatus('❌ Manual grid trading bot canceled.');
          return;
        }

        // Manuel grid bot oluştur
        const gridBot = {
          buyPrice: gridBuyPrice,
          sellPrice: gridSellPrice,
          buyAmount: gridBuyAmount,
          sellAmount: gridSellAmount,
          isActive: true,
          currentStep: 'waiting_buy' as const,
          expiry: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 saat geçerli
          status: `✅ MANUAL GRID BOT ACTIVE!
🔄 OPERATION SEQUENCE (Automatic Loop):
1️⃣ BUY: Price ≤ $${gridBuyPrice} (equal or below) → ${gridBuyAmount} ${assetInSymbol} will be purchased
2️⃣ SELL: After purchase, when price ≥ $${gridSellPrice} (equal or above) → ${gridSellAmount} ${assetOutSymbol} will be sold
3️⃣ PROFIT: Profit will be transferred to your main wallet

💰 BUY Amount: ${gridBuyAmount} ${assetInSymbol}
💰 SELL Amount: ${gridSellAmount} ${assetOutSymbol}
📈 Expected Profit: ${((sellPrice - buyPrice) / buyPrice * 100).toFixed(2)}%
👤 Manual Mode: Signing required for each transaction
📊 CURRENT STATUS: 1️⃣ BUY price is being awaited ($${gridBuyPrice} and lower)
⏰ VALIDITY: 24 hours`
        };

        setGridTradingBot(gridBot);
        localStorage.setItem(`grid_bot_${publicKey}`, JSON.stringify(gridBot));
        setAutoTradeStatus('✅ Manual grid trading bot active! Waiting for buy price...');

      } 
      
      else if (useBot && botMode === 'auto' && botWallet) {
        // 🤖 Auto Grid Trading Bot - Auto funding kontrolü
        
        // 💰 Auto funding kontrol - Eğer zaten devam ediyorsa bekle
        if (isAutoFunding) {
          setAutoTradeStatus('⚠️ Auto funding already in progress, please wait...');
          return;
        }
        
        // 💰 Auto funding - Her zaman 2 XLM transfer et
        setAutoTradeStatus('💰 Auto funding: Transferring 2 XLM to bot wallet...');
        
        const fundingResult = await autoFundBotWallet();
        if (!fundingResult.success) {
          if (fundingResult.error === 'Auto funding already in progress') {
            setAutoTradeStatus('⚠️ Auto funding already in progress, please wait...');
            return;
          }
          throw new Error(`Auto funding failed: ${fundingResult.error}`);
        }
        
        setAutoTradeStatus('✅ Auto funding completed! Creating grid trading bot...');
      
        try {
          // Quote al tahmini çıktı için - RETRY MEKANİZMASI
          const { maxHops, slippageBps } = getDynamicTradeParams(autoTradeAssetIn, autoTradeAssetOut);
          
          let quoteResponse: any;
          let retryCount = 0;
          const maxRetries = 3;
          
          while (retryCount < maxRetries) {
            try {
              setAutoTradeStatus(`🤖 Auto grid bot: Getting quote... (Attempt ${retryCount + 1}/${maxRetries})`);
              
              quoteResponse = await Promise.race([
                soroswapAPI.getQuote({
                  assetIn: autoTradeAssetIn,
                  assetOut: autoTradeAssetOut,
                  amount: toStroop(gridBuyAmount),
                  tradeType: 'EXACT_IN' as const,
                  protocols: DEFAULT_PROTOCOLS,
                  slippageBps: slippageBps,
                  feeBps: 50,
                  parts: 1,
                  maxHops: maxHops
                }),
                new Promise((_, reject) => 
                  setTimeout(() => reject(new Error(`Grid bot quote timeout (${60 + (retryCount * 15)} saniye)`)), 60000 + (retryCount * 15000))
                )
              ]) as any;
              
              // Başarılı olursa döngüden çık
              break;
              
            } catch (quoteError) {
              retryCount++;
              console.error(`Grid bot quote Attempt ${retryCount} error:`, quoteError);

              if (retryCount >= maxRetries) {
                throw new Error(`Grid bot quote API ${maxRetries} attempts failed after: ${quoteError instanceof Error ? quoteError.message : 'Unknown error'}`);
              }
              
              // Bir sonraki deneme için bekle
              setAutoTradeStatus(`⏳ Quote error, retrying in ${5 * retryCount} seconds...`);
              await new Promise(resolve => setTimeout(resolve, 5000 * retryCount));
            }
          }

          const estimatedOutput = parseFloat(quoteResponse.amountOut || '0') / 10000000;

          // Auto grid bot oluştur (XLM transfer olmadan)
          const gridBot = {
            buyPrice: gridBuyPrice,
            sellPrice: gridSellPrice,
            buyAmount: gridBuyAmount,
            sellAmount: gridSellAmount,
            isActive: true,
            currentStep: 'waiting_buy' as const,
            expiry: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 saat geçerli
            isBot: true,
            status: `✅ AUTO GRID BOT ACTIVE!
🔄 AUTOMATIC TRADE SEQUENCE:
1️⃣ BUY STAGE: Price ≤ $${gridBuyPrice} (equal or below) → ${gridBuyAmount} ${assetInSymbol} automatic buy
2️⃣ SELL STAGE: Post-buy price ≥ $${gridSellPrice} (equal or above) → ${gridSellAmount} ${assetOutSymbol} automatic sell
3️⃣ PROFIT TRANSFER: Earnings automatically transferred to your wallet

💰 Buy Amount: ${gridBuyAmount} ${assetInSymbol}
💰 Sell Amount: ${gridSellAmount} ${assetOutSymbol}
🎯 Estimated Buy: ${estimatedOutput.toFixed(4)} ${assetOutSymbol}
📈 Expected Profit: ${((sellPrice - buyPrice) / buyPrice * 100).toFixed(2)}%
🤖 Auto Bot: Wallet ready (no XLM transfer needed)
📊 CURRENTLY: 1️⃣ Waiting for buy price ($${gridBuyPrice} and below)
⏰ EXPIRATION: 24 hours
🔄 PC can be closed - Bot will run automatically!`
          };

          setGridTradingBot(gridBot);
          localStorage.setItem(`grid_bot_${publicKey}`, JSON.stringify(gridBot));
          setAutoTradeStatus('✅ Auto grid trading bot active! Waiting for purchase price...');

        } catch (quoteError) {
          // Quote alamazsak basit grid bot oluştur
          console.error('Grid bot quote error:', quoteError);
          setAutoTradeStatus('⚠️ Failed to get quote, creating simple auto grid bot...');
          
          // Basit grid bot oluştur (quote olmadan)
          const gridBot = {
            buyPrice: gridBuyPrice,
            sellPrice: gridSellPrice,
            buyAmount: gridBuyAmount,
            sellAmount: gridSellAmount,
            isActive: true,
            currentStep: 'waiting_buy' as const,
            expiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
            isBot: true,
            status: `✅ AUTO GRID BOT ACTIVE (Simple Mode)!
🎯 Buy Target: $${gridBuyPrice} (≤ equal or below)
🎯 Sell Target: $${gridSellPrice} (≥ equal or above)
💰 Buy Amount: ${gridBuyAmount} ${assetInSymbol}
💰 Sell Amount: ${gridSellAmount} ${assetOutSymbol}
📈 Expected Profit: ${((sellPrice - buyPrice) / buyPrice * 100).toFixed(2)}%
🤖 Auto Bot: Wallet ready (no XLM transfer needed)
⚠️ Quote not received - Simple mode active
📊 Status: Waiting for buy price ($${gridBuyPrice} and below)
⏰ Expiration: 24 hours
🔄 PC can be closed - Bot will run automatically!`
          };

          setGridTradingBot(gridBot);
          localStorage.setItem(`grid_bot_${publicKey}`, JSON.stringify(gridBot));
          setAutoTradeStatus('✅ Auto grid bot active! (Simple mode) Waiting for purchase price...');
        }
        
      } else {
        throw new Error('Bot mode selected but bot wallet not created. Please create a bot wallet first.');
      }

      // Input fields reset
      setGridBuyPrice('');
      setGridSellPrice('');
      setGridBuyAmount('');
      setGridSellAmount('');

    } catch (error) {
      console.error('api wait:',error);
      // const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      // setAutoTradeStatus(`❌ Grid bot creation error: ${errorMessage}`);
    }
  }, [gridBuyPrice, gridSellPrice, gridBuyAmount, gridSellAmount, publicKey, isConnected, autoTradeAssetIn, autoTradeAssetOut, botMode, botWallet, getDynamicTradeParams, autoFundBotWallet, isAutoFunding]);



  // 💸 Bot kazancını ana cüzdana transfer etme fonksiyonu
  const transferProfitToMainWallet = useCallback(async (
    assetToTransfer: string, 
    fromBotWallet: { publicKey: string; secretKey: string }, 
    toMainWallet: string,
    gridProfitAmount?: number // Grid trading kar miktarı
  ): Promise<string | undefined> => {
    try {
      debugger;
      console.log('🔍 Initiating transfer:', {
        assetToTransfer,
        gridProfitAmount,
        fromBot: fromBotWallet.publicKey,
        toWallet: toMainWallet
      });
///////////brls
      const StellarSdk = await import('@stellar/stellar-sdk');
      
      // Bot account bilgilerini al
      const response = await fetch(`https://horizon-testnet.stellar.org/accounts/${fromBotWallet.publicKey}`);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Bot account information could not be retrieved: ${response.status} - ${errorText}`);
      }
      
      const account = await response.json();
      console.log('🤖 Bot account balances:', account.balances);
      
      // 🚨 ADVANCED USDC DETECTION SYSTEM - FULL WALLET ANALYSIS
      console.log('🔍🔍🔍 ADVANCED ASSET DETECTION START 🔍🔍🔍');
      console.log('🎯 Target asset to transfer:', assetToTransfer);
      console.log('🤖 Bot Wallet All Balances:');
      account.balances.forEach((bal: any, index: number) => {
        console.log(`  Balance ${index + 1}/${account.balances.length}:`, {
          asset_type: bal.asset_type,
          asset_code: bal.asset_code || 'N/A',
          asset_issuer: bal.asset_issuer || 'N/A',
          balance: bal.balance,
          balance_number: parseFloat(bal.balance),
          can_transfer: parseFloat(bal.balance) > 0.01
        });
      });

      // Transfer edilecek asset balance'ını bul
      const assetBalance = account.balances.find((balance: any) => {
        console.log(`🔍 Checking balance for match:`, {
          asset_type: balance.asset_type,
          asset_code: balance.asset_code,
          asset_issuer: balance.asset_issuer,
          balance: balance.balance,
          assetToTransfer
        });

        if (assetToTransfer.includes('native')) {
          const isNative = balance.asset_type === 'native';
          console.log('🪙 Native check:', isNative);
          return isNative;
        } else {
          // Contract asset için - MULTI-LAYER DETECTION
          const assetParts = assetToTransfer.split('_');
          const expectedAssetCode = assetParts[0];
          const expectedAssetIssuer = assetParts[1];
          
          console.log('🎯 Expected asset parts:', { expectedAssetCode, expectedAssetIssuer });
          
          // LAYER 1: Exact match (en güvenli)
          if (expectedAssetCode && expectedAssetIssuer && balance.asset_code && balance.asset_issuer) {
            const exactMatch = balance.asset_code === expectedAssetCode && balance.asset_issuer === expectedAssetIssuer;
            if (exactMatch) {
              console.log('✅ LAYER 1: Exact asset match found!', balance.asset_code, balance.asset_issuer);
              return true;
            }
          }
          
          // LAYER 2: Asset code match (kod eşleşmesi)
          if (expectedAssetCode && balance.asset_code) {
            const codeMatch = balance.asset_code === expectedAssetCode || 
                             balance.asset_code.includes(expectedAssetCode) ||
                             expectedAssetCode.includes(balance.asset_code);
            if (codeMatch) {
              console.log('✅ LAYER 2: Asset code match found!', { 
                expectedAssetCode,
                balanceAssetCode: balance.asset_code,
                codeMatch
              });
              return true;
            }
          }
          
          // LAYER 3: USDC Özel Algılama (USDC'yi her koşulda bul!)
          if (expectedAssetCode === 'USDC' || assetToTransfer.includes('USDC')) {
            console.log('🚨 USDC SPECIAL DETECTION ACTIVE!');
            
            // USDC Exact
            if (balance.asset_code === 'USDC') {
              console.log('✅ LAYER 3A: Direct USDC found!');
              return true;
            }
            
            // USD içeren herhangi bir asset
            if (balance.asset_code && balance.asset_code.includes('USD')) {
              console.log('✅ LAYER 3B: USD-containing asset found!', balance.asset_code);
              return true;
            }
            
            // USDC issuer match (yaygın USDC issuer'lar)
            const commonUsdcIssuers = [
              'CBBHRKEP5M3NUDRISGLJKGHDHX3DA2CN2AZBQY6WLVUJ7VNLGSKBDUCM', // Soroswap USDC
              'CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA', // Circle USDC
              'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN', // Common USDC
            ];
            
            if (commonUsdcIssuers.includes(balance.asset_issuer)) {
              console.log('✅ LAYER 3C: USDC issuer match found!', balance.asset_issuer);
              return true;
            }
            
            // EMERGENCY: En yüksek non-XLM balance (USDC olma ihtimali yüksek)
            if (balance.asset_type !== 'native' && parseFloat(balance.balance) > 0.01) {
              console.log('⚠️ LAYER 3D: Emergency non-XLM asset detected (might be USDC):', balance);
              return true;
            }
          }
          
          // LAYER 4: Geniş matching (diğer tokenlar)
          const broadMatch = balance.asset_code && (
            assetToTransfer.includes(balance.asset_code) || 
            balance.asset_code.includes('USDC') ||
            balance.asset_code.includes('USD') ||
            balance.asset_code.includes('STAR') ||
            balance.asset_code.includes('BTC') ||
            balance.asset_code.includes('ETH') ||
            balance.asset_code.includes('XTAR')
          );
          
          if (broadMatch) {
            console.log('✅ LAYER 4: Broad match found!', { 
              balanceAssetCode: balance.asset_code,
              balanceAssetIssuer: balance.asset_issuer,
              assetToTransfer, 
              broadMatch 
            });
            return true;
          }
          
          console.log('❌ No match found for this balance');
          return false;
        }
      });
      
      console.log('💰💰💰 ASSET DETECTION RESULT 💰💰💰');
      console.log('Found asset balance:', assetBalance);
      
      if (!assetBalance) {
        console.log('❌❌❌ NO ASSET BALANCE FOUND - DETAILED ANALYSIS ❌❌❌');
        console.log('🔍 Searched for asset:', assetToTransfer);
        console.log('📊 All available balances:');
        account.balances.forEach((bal: any, index: number) => {
          console.log(`  ${index + 1}. Asset: ${bal.asset_code || 'XLM'} | Balance: ${bal.balance} | Type: ${bal.asset_type} | Issuer: ${bal.asset_issuer || 'N/A'}`);
        });
        
        // 🚨 EMERGENCY RECOVERY: En yüksek balance'a sahip non-native asset'i bul
        const nonNativeBalances = account.balances
          .filter((bal: any) => bal.asset_type !== 'native' && parseFloat(bal.balance) > 0.01)
          .sort((a: any, b: any) => parseFloat(b.balance) - parseFloat(a.balance));
          
        if (nonNativeBalances.length > 0) {
          console.log('🚨 EMERGENCY RECOVERY: Using highest non-native balance:', nonNativeBalances[0]);
          
          // En yüksek balance'ı transfer et
          const emergencyAsset = nonNativeBalances[0];
          const emergencyAssetIdentifier = `${emergencyAsset.asset_code}_${emergencyAsset.asset_issuer}`;
          
          const emergencyTransferHash = await transferProfitToMainWallet(
            emergencyAssetIdentifier,
            fromBotWallet,
            toMainWallet,
            undefined // Emergency durumda kar miktarı belirtilmez, balance'ın %95'i kullanılır
          );
          
          console.log('🚨 Emergency transfer completed:', emergencyTransferHash);
          return emergencyTransferHash;
        }
        
        // Son çare: XLM varsa onu transfer et
        const xlmBalance = account.balances.find((bal: any) => bal.asset_type === 'native');
        if (xlmBalance && parseFloat(xlmBalance.balance) > 10) {
          console.log('🚨 Last resort: Transferring XLM...');
          const xlmTransferHash = await transferProfitToMainWallet(
            'USDC',
            fromBotWallet,
            toMainWallet,
            undefined // Emergency durumda kar miktarı belirtilmez, XLM reserve ile transfer edilir
          );
          console.log('🚨 XLM emergency transfer completed:', xlmTransferHash);
          return xlmTransferHash;
        }
        
        console.log('❌ No transferable assets found at all!');
        return;
      }
      
      if (parseFloat(assetBalance.balance) < 0.1) {
        console.log('⚠️ Not enough balance for transfer:', assetBalance);
        return;
      }
      /////murat
      // Grid profit amount varsa onu kullan, yoksa balance'ın %95'ini
      let transferAmount: number;
      
      if (gridProfitAmount && gridProfitAmount > 0) {
        // Grid trading kar miktarını kullan
        transferAmount = gridProfitAmount;
        console.log(`💰 Grid profit amount will be transferred: ${transferAmount} ${assetBalance.asset_code || 'XLM'}`);
        
        // Kar miktarının balance'dan fazla olmamasını kontrol et
        if (transferAmount > parseFloat(assetBalance.balance)) {
          transferAmount = parseFloat(assetBalance.balance) * 0.95;
          console.log(`⚠️ Grid profit amount exceeds balance, adjusted: ${transferAmount}`);
        }
      } else {
        // Eski sistem: balance'ın bir kısmını transfer et
               
         
         ////brls2
        transferAmount = assetToTransfer.includes('native') 
          ? parseFloat(formatAmount(gridSellQuote.amountOut)) // XLM için 2 XLM rezerv et
          : parseFloat(formatAmount(gridSellQuote.amountOut)) * 0.95; // Diğer asset'ler için %95'ini transfer et
        console.log(`📊 Balance-based transfer amount: ${transferAmount} ${assetBalance.asset_code || 'XLM'}`);
      }

      if (transferAmount <= 0.1) { // Minimum 0.1 transfer gerekli
        console.log('⚠️ Transfer amount too low:', transferAmount, 'Balance:', assetBalance.balance);
        return;
      }
      
      console.log(`📤 To be transferred: ${transferAmount} ${assetBalance.asset_code || 'XLM'}`);
      
      // Server ve transaction oluştur
      const server = new StellarSdk.Horizon.Server('https://horizon-testnet.stellar.org');
      const botKeypair = StellarSdk.Keypair.fromSecret(fromBotWallet.secretKey);
      const botAccount = await server.loadAccount(fromBotWallet.publicKey);
      
      // Asset oluştur
      let asset;
      if (assetToTransfer.includes('native')) {
        asset = StellarSdk.Asset.native();
        console.log('🪙 Native XLM asset created');
      } else {
        // Contract asset için issuer bilgisi gerekli
        if (assetBalance.asset_issuer && assetBalance.asset_code) {
          asset = new StellarSdk.Asset(assetBalance.asset_code, assetBalance.asset_issuer);
          console.log('🎯 Custom asset created:', assetBalance.asset_code, assetBalance.asset_issuer);
        } else {
          console.log('⚠️ Asset issuer/code information missing, XLM will be transferred');
          asset = StellarSdk.Asset.native();
          // XLM balance'ını al ve transfer et
          const xlmBalance = account.balances.find((b: any) => b.asset_type === 'native');
          if (xlmBalance && parseFloat(xlmBalance.balance) > 0.5) {
            const xlmTransferAmount = Math.max(0, parseFloat(xlmBalance.balance) - 0.5);
            console.log(`📤 Fallback XLM transfer: ${xlmTransferAmount}`);
          }
        }
      }
      
      // Payment transaction oluştur
      const transaction = new StellarSdk.TransactionBuilder(botAccount, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: StellarSdk.Networks.TESTNET,
      })
      .addOperation(StellarSdk.Operation.payment({
        destination: toMainWallet,
        asset: asset,
        amount: transferAmount.toFixed(7), // Decimal format, stroop değil
      }))
      .setTimeout(180)
      .build();
      
      // Bot imza at
      transaction.sign(botKeypair);
      
      // Gönder
      const result = await server.submitTransaction(transaction);
      console.log('✅ Transfer successful:', result.hash);
      
      return result.hash;
      
    } catch (error: any) {
      console.error('❌ Transfer profit error:', error);
      
      // Stellar hata kodlarını kontrol et
      if (error.response?.data?.extras?.result_codes) {
        const resultCodes = error.response.data.extras.result_codes;
        console.error('Stellar error codes:', resultCodes);
        throw new Error(`Transfer error: ${JSON.stringify(resultCodes)}`);
      }

      throw new Error(`Token transfer error: ${error.message || 'Unknown error'}`);
    }
  }, [gridSellQuote]);

  // 🤖 Bot Otomatik İşlem Execution (Tam Otomatik)
  const executeBotTrade = useCallback(async (type: 'buy' | 'sell', amount: string, targetPrice: string) => {
    setIsTrading(true);
    
    try {
      setAutoTradeStatus(`🤖 Bot ${type === 'buy' ? 'buying' : 'selling'} started...`);

      // Bot mode kontrolü ve validasyon
      const usingBotWallet = botMode === 'auto' && botWallet;
      const signerKey = usingBotWallet ? botWallet.publicKey : publicKey;
      
      if (!signerKey) {
        throw new Error('Wallet not connected.');
      }

      // Bot wallet kullanılıyorsa balance kontrolü
      if (usingBotWallet) {
        if (botBalance < 1) { // Minimum 1 XLM gerekli
          throw new Error(`Bot wallet does not have sufficient balance. Current: ${botBalance.toFixed(2)} XLM, Minimum: 1 XLM required.`);
        }
        setAutoTradeStatus(`🤖 Using bot wallet: ${botWallet.publicKey.slice(0, 10)}...`);
      } else {
        setAutoTradeStatus(`👤 Using main wallet: ${publicKey?.slice(0, 10)}...`);
      }

      const numAmount = parseFloat(amount);
      if (isNaN(numAmount) || numAmount < 1) {
        throw new Error('Minimum 1 asset required.');
      }

      setAutoTradeStatus(`📊 Fetching quote from Soroswap API...`);

      // Dinamik trade parametrelerini al (Ana sayfa ile aynı)
      const assetInAddress = type === 'buy' ? autoTradeAssetIn : autoTradeAssetOut;
      const assetOutAddress = type === 'buy' ? autoTradeAssetOut : autoTradeAssetIn;
      const { maxHops, slippageBps } = getDynamicTradeParams(assetInAddress, assetOutAddress);

      // Soroswap API quote al (Ana sayfa ile aynı parametreler) - RETRY MEKANİZMASI
      let quoteResponse: any;
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          setAutoTradeStatus(`📊 Getting a quote from Soroswap API... (Attempt ${retryCount + 1}/${maxRetries})`);
          
          quoteResponse = await Promise.race([
            soroswapAPI.getQuote({
              assetIn: assetInAddress,
              assetOut: assetOutAddress,
              amount: toStroop(amount), // Ana sayfa ile aynı format
              tradeType: 'EXACT_IN' as const,
              protocols: DEFAULT_PROTOCOLS,
              slippageBps: slippageBps, // Dinamik slippage
              feeBps: 50,
              parts: 1,
              maxHops: maxHops // Dinamik maxHops
            }),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error(`Quote API timeout (${60 + (retryCount * 15)} saniye)`)), 60000 + (retryCount * 15000))
            )
          ]) as any;
          
          // Başarılı olursa döngüden çık
          break;
          
        } catch (quoteError) {
          retryCount++;
          console.error(`Quote attempt ${retryCount} error:`, quoteError);
          
          if (retryCount >= maxRetries) {
            throw new Error(`Quote API ${maxRetries} attempts failed: ${quoteError instanceof Error ? quoteError.message : 'Unknown error'}`);
          }
          
          // Bir sonraki deneme için bekle
          setAutoTradeStatus(`⏳ Quote error, ${5 * retryCount} seconds later it will be retried...`);
          await new Promise(resolve => setTimeout(resolve, 5000 * retryCount));
        }
      }

      if (!quoteResponse.assetIn || !quoteResponse.assetOut) {
        throw new Error(`Quote fetch error: Invalid quote response`);
      }

      setAutoTradeStatus(`🔗 Transaction is being created...`);

      // Build transaction (Ana sayfa ile aynı mantık) - RETRY MEKANİZMASI
      console.log('🔨 Building transaction for user:', signerKey);
      let buildResponse: any;
      retryCount = 0;
      
      while (retryCount < maxRetries) {
        try {
          setAutoTradeStatus(`🔗 Transaction is being created... (Attempt ${retryCount + 1}/${maxRetries})`);

          buildResponse = await Promise.race([
            soroswapAPI.buildTransaction({
              quote: quoteResponse,
              referralId: "GALAXYVOIDAOPZTDLHILAJQKCVVFMD4IKLXLSZV5YHO7VY74IWZILUTO",
              sponsor: "GDISPX62G6EGBZX3I2VMB4J3O3CPFHHRAJ4QZNOYVXYVHJ6BVRL2A3Y3",
              from: signerKey // Kullanıcının veya bot'un wallet adresi
            }),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error(`Build transaction timeout (${60 + (retryCount * 15)} saniye)`)), 60000 + (retryCount * 15000))
            )
          ]) as any;
          
          // Başarılı olursa döngüden çık
          break;
          
        } catch (buildError) {
          retryCount++;
          console.error(`Build transaction attempt ${retryCount} error:`, buildError);
          
          if (retryCount >= maxRetries) {
            throw new Error(`Build transaction ${maxRetries} attempts failed: ${buildError instanceof Error ? buildError.message : 'Unknown error'}`);
          }
          
          // Bir sonraki deneme için bekle
          setAutoTradeStatus(`⏳ Transaction build error, ${5 * retryCount} seconds later it will be retried...`);
          await new Promise(resolve => setTimeout(resolve, 5000 * retryCount));
        }
      }

      if (!buildResponse.xdr) {
        throw new Error(`Build transaction error: No XDR received`);
      }
      console.log('✅ Transaction built successfully:', buildResponse);

      setAutoTradeStatus(`🔐 ${usingBotWallet ? 'Bot automatically signs' : 'User signature is being awaited'}...`);

      let signedXDR: string;

      if (usingBotWallet) {
        // 🤖 Bot otomatik imza
        const StellarSdk = await import('@stellar/stellar-sdk');
        const botKeypair = StellarSdk.Keypair.fromSecret(botWallet.secretKey);
        const transaction = new StellarSdk.Transaction(buildResponse.xdr, StellarSdk.Networks.TESTNET);
        transaction.sign(botKeypair);
        signedXDR = transaction.toEnvelope().toXDR('base64');

        setAutoTradeStatus(`✅ Bot signature completed, transaction is being sent...`);
      } else {
        // � Telegram bildirimi: Manuel imza gerekli
        if (telegramBot && telegramChatId) {
          const assetInSymbol = ASSET_OPTIONS.find(a => a.value === (type === 'buy' ? autoTradeAssetIn : autoTradeAssetOut))?.symbol || 'Unknown';
          const assetOutSymbol = ASSET_OPTIONS.find(a => a.value === (type === 'buy' ? autoTradeAssetOut : autoTradeAssetIn))?.symbol || 'Unknown';
          const message = `🔐 MANUAL SIGNATURE REQUIRED!

📱 Please confirm the transaction in your Freighter wallet
🤖 ${type === 'buy' ? `💰 ${assetOutSymbol} PURCHASE` : `💸 ${assetInSymbol} SELL`} operation
💰 Amount: ${amount} ${assetInSymbol}
💵 Price: $${displayPrice.toFixed(4)}
📊 Pair: ${assetInSymbol}/${assetOutSymbol}
⏰ ${new Date().toLocaleString('tr-TR')}

⚡ Please check your Freighter wallet and confirm the transaction!`;

          try {
            await telegramBot.sendMessage(telegramChatId, message);
          } catch (tgError) {
            console.warn('Telegram notification could not be sent:', tgError);
          }
        }
        
        // �👤 Kullanıcı manuel imza (Ana sayfa ile aynı mantık)
        console.log('🔐 Signing transaction XDR:', buildResponse.xdr);
        const signedXdr = await signTransaction(buildResponse.xdr);
        
        console.log('✅ Signed XDR received:', typeof signedXdr, signedXdr);
        
        // SignedXDR'ın string olduğundan emin ol (Ana sayfa ile aynı)
        if (typeof signedXdr === 'string') {
          signedXDR = signedXdr;
        } else if (signedXdr && typeof signedXdr === 'object' && 'signedTxXdr' in signedXdr) {
          signedXDR = (signedXdr as { signedTxXdr: string }).signedTxXdr;
          console.log('🔧 Extracted signedTxXdr from object:', signedXDR);
        } else {
          throw new Error(`Invalid signed XDR format: ${JSON.stringify(signedXdr)}`);
        }
        
        if (!signedXDR || signedXDR.trim() === '') {
          throw new Error('Signed XDR is empty or invalid');
        }
        
        // 📱 Telegram bildirimi: Manuel imza başarılı
        if (telegramBot && telegramChatId) {
          const assetInSymbol = ASSET_OPTIONS.find(a => a.value === (type === 'buy' ? autoTradeAssetIn : autoTradeAssetOut))?.symbol || 'Unknown';
          const assetOutSymbol = ASSET_OPTIONS.find(a => a.value === (type === 'buy' ? autoTradeAssetOut : autoTradeAssetIn))?.symbol || 'Unknown';
          const message = `✅ SIGNATURE SUCCESSFUL!

🔐 Freighter wallet signature received
🤖 ${type === 'buy' ? `💰 ${assetOutSymbol} PURCHASE` : `💸 ${assetInSymbol} SELL`} operation
💰 Amount: ${amount} ${assetInSymbol}
💵 Price: $${displayPrice.toFixed(4)}
📊 Pair: ${assetInSymbol}/${assetOutSymbol}
⏰ ${new Date().toLocaleString('tr-TR')}

📤 Transaction is being sent to the blockchain...`;

          try {
            await telegramBot.sendMessage(telegramChatId, message);
          } catch (tgError) {
            console.warn('Telegram notification could not be sent:', tgError);
          }
        }
        
        console.log('📤 Ready to send transaction with XDR:', signedXDR.substring(0, 100) + '...');
      }
      
      setAutoTradeStatus(`📤 Transaction is being sent to the blockchain...`);

      // Submit transaction - RETRY MECHANISM
      let submitResponse: any;
      retryCount = 0;
      
      while (retryCount < maxRetries) {
        try {
          setAutoTradeStatus(`📤 Transaction is being sent to the blockchain... (Attempt ${retryCount + 1}/${maxRetries})`);
          
          submitResponse = await Promise.race([
            soroswapAPI.sendTransaction({ xdr: signedXDR }),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error(`Send transaction timeout (${90 + (retryCount * 30)} seconds)`)), 90000 + (retryCount * 30000))
            )
          ]) as any;
          
          // Başarılı olursa döngüden çık
          break;
          
        } catch (submitError) {
          retryCount++;
          console.error(`Submit transaction attempt ${retryCount} error:`, submitError);
          
          if (retryCount >= maxRetries) {
            throw new Error(`Submit transaction ${maxRetries} attempts failed: ${submitError instanceof Error ? submitError.message : 'Unknown error'}`);
          }

          // Wait for the next attempt
          setAutoTradeStatus(`⏳ Transaction submit error, retrying in ${7 * retryCount} seconds...`);
          await new Promise(resolve => setTimeout(resolve, 7000 * retryCount));
        }
      }
      
      if (!submitResponse.hash && !submitResponse.status) {
        throw new Error(`Transaction submission error: No hash received`);
      }

      const assetInSymbol = ASSET_OPTIONS.find(a => a.value === (type === 'buy' ? autoTradeAssetIn : autoTradeAssetOut))?.symbol || 'Unknown';
      const assetOutSymbol = ASSET_OPTIONS.find(a => a.value === (type === 'buy' ? autoTradeAssetOut : autoTradeAssetIn))?.symbol || 'Unknown';

      setAutoTradeStatus(`✅ Bot ${type === 'buy' ? 'purchase' : 'sale'} successful!
🤖 Automatic process completed
💰 Amount: ${amount} ${assetInSymbol}
📊 Pair: ${assetInSymbol}/${assetOutSymbol}
💵 Price: $${displayPrice.toFixed(4)}
🆔 Hash: ${submitResponse.hash || 'N/A'}`);

      // 🎯 Bot işlem sonrası aldığı token'ları kullanıcının cüzdanına transfer et
      if (usingBotWallet && customWalletAddress && botWallet) {
        try {
          setAutoTradeStatus(prev => `${prev}\n\n💸 Received tokens ${customWalletAddress.slice(0, 10)}...`);
          
          // İşlem sonrası bot balance'ını tekrar kontrol et
          await new Promise(resolve => setTimeout(resolve, 3000)); // 3 saniye bekle
          
          const postTradeResponse = await fetch(`https://horizon-testnet.stellar.org/accounts/${botWallet.publicKey}`);
          if (postTradeResponse.ok) {
            const postTradeAccount = await postTradeResponse.json();
            console.log('📊 Post-trade bot balances:', postTradeAccount.balances);

            // Find the asset we received (the token we got as a result of the transaction)
            const targetAssetValue = type === 'buy' ? autoTradeAssetOut : autoTradeAssetIn; // Buy'da USDC/XSTAR, Sell'de XLM
            const targetAssetInfo = ASSET_OPTIONS.find(a => a.value === targetAssetValue);
            console.log('🎯 Target transfer asset:', { targetAssetValue, targetAssetInfo });
            
            // Bu asset'in bot wallet'ındaki balance'ını bul
            const targetAssetBalance = postTradeAccount.balances.find((balance: any) => {
              if (targetAssetValue.includes('native') || targetAssetValue.includes('XLM') || targetAssetInfo?.symbol === 'XLM') {
                console.log('🪙 Searching for XLM asset, balance:', balance.asset_type, balance.balance);
                return balance.asset_type === 'native';
              } else {
                // Contract asset için - asset symbol ile eşleştir
                const targetSymbol = targetAssetInfo?.symbol;
                console.log('🔍 Asset balance check:', {
                  targetSymbol,
                  balanceAssetCode: balance.asset_code,
                  balanceAssetType: balance.asset_type,
                  balanceAmount: balance.balance
                });
                
                return balance.asset_code && targetSymbol && (
                  balance.asset_code === targetSymbol ||
                  balance.asset_code.includes(targetSymbol) ||
                  targetSymbol.includes(balance.asset_code) ||
                  // Common asset matches
                  (targetSymbol === 'USDC' && balance.asset_code.includes('USDC')) ||
                  (targetSymbol === 'XTAR' && balance.asset_code.includes('STAR')) ||
                  (targetSymbol === 'BTC' && balance.asset_code.includes('BTC')) ||
                  (targetSymbol === 'ETH' && balance.asset_code.includes('ETH'))
                );
              }
            });
            
            console.log('💰 Found target asset balance:', targetAssetBalance);
            
            if (targetAssetBalance && parseFloat(targetAssetBalance.balance) > (targetAssetBalance.asset_type === 'native' ? 2.0 : 0.1)) {
              // Hedef asset'i transfer et
              const assetIdentifier = targetAssetBalance.asset_type === 'native' 
                ? 'native' 
                : `${targetAssetBalance.asset_code}_${targetAssetBalance.asset_issuer || ''}`;
              
              console.log('📤 Asset ID to transfer:', assetIdentifier);
              
              // 💰 Bu buy işlemindeki kar miktarını hesapla
              let buyProfitAmount: number | undefined;
              
              if (type === 'buy' && gridBuyQuote?.amountOut) {
                // Buy işleminde elde ettiğimiz token miktarı
                buyProfitAmount = parseFloat(gridBuyQuote.amountOut);
                console.log('💰 Buy Transaction Profit Amount:', buyProfitAmount, getAssetSymbol(gridBuyQuote.assetOut));
              }
              
              const transferHash = await transferProfitToMainWallet(
                assetIdentifier,
                botWallet,
                customWalletAddress,
                buyProfitAmount // Buy kar miktarını parametre olarak geç
              );
              
              setAutoTradeStatus(prev => `${prev}\n✅ ${targetAssetBalance.asset_code || 'XLM'} transferred to your wallet!
💸 Transfer Hash: ${transferHash || 'N/A'}`);
            } else {
              // Hedef asset bulunamazsa en yüksek balance'lı asset'i transfer et
              console.log('⚠️ Target asset not found, highest balance is being transferred');
              
              const transferableAssets = postTradeAccount.balances.filter((balance: any) => 
                parseFloat(balance.balance) > (balance.asset_type === 'native' ? 2.0 : 0.1) // XLM için 2.0, diğerleri için 0.1
              );
              
              if (transferableAssets.length > 0) {
                const highestBalance = transferableAssets.reduce((prev: any, current: any) => 
                  parseFloat(current.balance) > parseFloat(prev.balance) ? current : prev
                );
                
                const assetIdentifier = highestBalance.asset_type === 'native' 
                  ? 'native' 
                  : `${highestBalance.asset_code}_${highestBalance.asset_issuer}`;
                
                const transferHash = await transferProfitToMainWallet(
                  assetIdentifier,
                  botWallet,
                  customWalletAddress,
                  undefined // Fallback transfer'da kar miktarı belirtilmez, highest balance'ın %95'i kullanılır
                );
                
                setAutoTradeStatus(prev => `${prev}\n✅ ${highestBalance.asset_code || 'XLM'} transferred to your wallet!
💸 Transfer Hash: ${transferHash || 'N/A'}`);
              } else {
                setAutoTradeStatus(prev => `${prev}\n⚠️ No transferable asset found`);
              }
            }
          }
          
        } catch (transferError) {
          const transferErrorMsg = transferError instanceof Error ? transferError.message : 'Transfer error';
          setAutoTradeStatus(prev => `${prev}\n⚠️ Transfer error: ${transferErrorMsg}`);
          console.error('Token transfer error:', transferError);
        }
      }

      // Telegram notification
      if (telegramBot && telegramChatId) {
        const message = `🤖 BOT AUTOMATIC TRADE!
✅ ${type === 'buy' ? `💰 ${assetOutSymbol} BUY` : `💸 ${assetInSymbol} SELL`} SUCCESSFUL
🤖 Pre-authorized Transaction Completed
📊 Triggered: $${targetPrice}
💵 Realized: $${displayPrice.toFixed(4)}
💰 Spent: ${amount} ${assetInSymbol}
${usingBotWallet ? `💸 You received ${type === 'buy' ? assetOutSymbol : assetInSymbol} tokens in your wallet!
🏦 Transfer Address: ${customWalletAddress.slice(0, 10)}...${customWalletAddress.slice(-10)}` : ''}
🆔 Trade Hash: ${submitResponse.hash || 'N/A'}
⏰ ${new Date().toLocaleString('tr-TR')}`;
        
        await telegramBot.sendMessage(telegramChatId, message);
      }

      // Reset değerler
      if (type === 'buy') {
        setBuyTargetPrice('');
        setAutoBuyAmount('');
        setPreAuthBuyOrder(null);
        localStorage.removeItem(`preauth_buy_${publicKey}`);
      } else {
        setSellTargetPrice('');
        setAutoSellAmount('');
        setPreAuthSellOrder(null);
        localStorage.removeItem(`preauth_sell_${publicKey}`);
      }
      
      setHasAutoTradeError(false);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setAutoTradeStatus(`❌ Bot ${type === 'buy' ? 'buy' : 'sell'} error: ${errorMessage}
      
🤖 BOT OPERATION DONE
Reactivate it manually.`);
      
      setHasAutoTradeError(true);
      setIsAutoTradingEnabled(false);
      
      // Reset değerler hata durumunda da
      if (type === 'buy') {
        setBuyTargetPrice('');
        setAutoBuyAmount('');
        setPreAuthBuyOrder(null);
        localStorage.removeItem(`preauth_buy_${publicKey}`);
      } else {
        setSellTargetPrice('');
        setAutoSellAmount('');
        setPreAuthSellOrder(null);
        localStorage.removeItem(`preauth_sell_${publicKey}`);
      }
      
      // Telegram error notification
      if (telegramBot && telegramChatId) {
        const message = `🚨 BOT OPERATION ERROR!
❌ ${type === 'buy' ? 'BUY' : 'SELL'} FAILED
🤖 Bot Operation Stopped
📊 Target: $${targetPrice}
💵 Current: $${displayPrice.toFixed(4)}
⚠️ Error: ${errorMessage}
⏰ ${new Date().toLocaleString('tr-TR')}`;
        
        await telegramBot.sendMessage(telegramChatId, message);
      }
    } finally {
      setIsTrading(false);
    }
  }, [publicKey, signTransaction, displayPrice, telegramBot, telegramChatId, autoTradeAssetIn, autoTradeAssetOut, botMode, botWallet, botBalance, transferProfitToMainWallet, customWalletAddress, getDynamicTradeParams, getAssetSymbol, gridBuyQuote]);

  // 🤖 Grid Bot Özel İşlem Execution (Alımda Transfer YOK, Satımda Transfer VAR)
  const executeGridBotTrade = useCallback(async (type: 'buy' | 'sell', amount: string, targetPrice: string, transferAfterTrade = false) => {
    setIsTrading(true);
    
    try {
      setAutoTradeStatus(`🤖 Grid Bot ${type === 'buy' ? 'buy' : 'sell'} is starting...`);

      // Bot mode kontrolü ve validasyon
      const usingBotWallet = botMode === 'auto' && botWallet;
      const signerKey = usingBotWallet ? botWallet.publicKey : publicKey;
      
      if (!signerKey) {
        throw new Error('Wallet not connected.');
      }

      // Bot wallet kullanılıyorsa balance kontrolü
      if (usingBotWallet) {
        if (botBalance < 1) { // Minimum 1 XLM gerekli
          throw new Error(`Bot wallet has insufficient balance. Current: ${botBalance.toFixed(2)} XLM, Minimum: 1 XLM required.`);
        }
        setAutoTradeStatus(`🤖 Grid Bot wallet is being used: ${botWallet.publicKey.slice(0, 10)}...`);
      } else {
        setAutoTradeStatus(`👤 Grid Bot main wallet is being used: ${publicKey?.slice(0, 10)}...`);
      }

      const numAmount = parseFloat(amount);
      if (isNaN(numAmount) || numAmount < 1) {
        throw new Error('Minimum 1 asset required.');
      }

      setAutoTradeStatus(`📊 Grid Bot is getting quote from Soroswap API...`);

      // Dinamik trade parametrelerini al
      const assetInAddress = type === 'buy' ? autoTradeAssetIn : autoTradeAssetOut;
      const assetOutAddress = type === 'buy' ? autoTradeAssetOut : autoTradeAssetIn;
      const { maxHops, slippageBps } = getDynamicTradeParams(assetInAddress, assetOutAddress);

      // Soroswap API quote al - RETRY MEKANİZMASI
      let quoteResponse: any;
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          setAutoTradeStatus(`📊 Grid Bot is getting quote from Soroswap API... (Attempt ${retryCount + 1}/${maxRetries})`);
          
          quoteResponse = await Promise.race([
            soroswapAPI.getQuote({
              assetIn: assetInAddress,
              assetOut: assetOutAddress,
              amount: toStroop(amount),
              tradeType: 'EXACT_IN' as const,
              protocols: DEFAULT_PROTOCOLS,
              slippageBps: slippageBps,
              feeBps: 50,
              parts: 1,
              maxHops: maxHops
            }),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error(`Grid Bot quote timeout (${60 + (retryCount * 15)} saniye)`)), 60000 + (retryCount * 15000))
            )
          ]) as any;
          
          break;
          
        } catch (quoteError) {
          retryCount++;
          console.error(`Grid Bot quote attempt ${retryCount} error:`, quoteError);
          
          if (retryCount >= maxRetries) {
            throw new Error(`Grid Bot quote API ${maxRetries} attempts failed: ${quoteError instanceof Error ? quoteError.message : 'Unknown error'}`);
          }

          setAutoTradeStatus(`⏳ Grid Bot quote error, retrying in ${5 * retryCount} seconds...`);
          await new Promise(resolve => setTimeout(resolve, 5000 * retryCount));
        }
      }

      if (!quoteResponse.assetIn || !quoteResponse.assetOut) {
        throw new Error(`Grid Bot quote API error: Invalid quote response`);
      }

      setAutoTradeStatus(`🔗 Grid Bot transaction is being created...`);

      // Build transaction - RETRY MEKANİZMASI
      let buildResponse: any;
      retryCount = 0;
      
      while (retryCount < maxRetries) {
        try {
          setAutoTradeStatus(`🔗 Grid Bot transaction is being created... (Attempt ${retryCount + 1}/${maxRetries})`);
          
          buildResponse = await Promise.race([
            soroswapAPI.buildTransaction({
              quote: quoteResponse,
              referralId: "GALAXYVOIDAOPZTDLHILAJQKCVVFMD4IKLXLSZV5YHO7VY74IWZILUTO",
              sponsor: "GDISPX62G6EGBZX3I2VMB4J3O3CPFHHRAJ4QZNOYVXYVHJ6BVRL2A3Y3",
              from: signerKey
            }),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error(`Grid Bot build timeout (${60 + (retryCount * 15)} saniye)`)), 60000 + (retryCount * 15000))
            )
          ]) as any;
          
          break;
          
        } catch (buildError) {
          retryCount++;
          console.error(`Grid Bot build attempt ${retryCount} error:`, buildError);
          
          if (retryCount >= maxRetries) {
            throw new Error(`Grid Bot build transaction ${maxRetries} attempts failed: ${buildError instanceof Error ? buildError.message : 'Unknown error'}`);
          }

          setAutoTradeStatus(`⏳ Grid Bot transaction build error, retrying in ${5 * retryCount} seconds...`);
          await new Promise(resolve => setTimeout(resolve, 5000 * retryCount));
        }
      }

      if (!buildResponse.xdr) {
        throw new Error(`Grid Bot build transaction error: No XDR received`);
      }

      setAutoTradeStatus(`🔐 Grid Bot ${usingBotWallet ? 'is signing automatically' : 'is waiting for user signature'}...`);

      let signedXDR: string;

      if (usingBotWallet) {
        // Bot otomatik imza
        const StellarSdk = await import('@stellar/stellar-sdk');
        const botKeypair = StellarSdk.Keypair.fromSecret(botWallet.secretKey);
        const transaction = new StellarSdk.Transaction(buildResponse.xdr, StellarSdk.Networks.TESTNET);
        transaction.sign(botKeypair);
        signedXDR = transaction.toEnvelope().toXDR('base64');

        setAutoTradeStatus(`✅ Grid Bot signature completed, transaction is being sent...`);
      } else {
        // 📱 Telegram notification: Grid Bot manual signature required
        if (telegramBot && telegramChatId) {
          const assetInSymbol = ASSET_OPTIONS.find(a => a.value === (type === 'buy' ? autoTradeAssetIn : autoTradeAssetOut))?.symbol || 'Unknown';
          const assetOutSymbol = ASSET_OPTIONS.find(a => a.value === (type === 'buy' ? autoTradeAssetOut : autoTradeAssetIn))?.symbol || 'Unknown';
          const message = `🤖 GRID BOT - MANUAL SIGNATURE REQUIRED!

📱 Please check your Freighter wallet for approval
🔄 Grid Bot ${type === 'buy' ? `💰 ${assetOutSymbol} BUY` : `💸 ${assetInSymbol} SELL`} operation
💰 Amount: ${amount} ${assetInSymbol}
💵 Target Price: $${targetPrice}
📊 Current Price: $${displayPrice.toFixed(4)}
📊 Pair: ${assetInSymbol}/${assetOutSymbol}
⏰ ${new Date().toLocaleString('tr-TR')}

⚡ Please check your Freighter wallet and approve the Grid Bot transaction!`;

          try {
            await telegramBot.sendMessage(telegramChatId, message);
          } catch (tgError) {
            console.warn('Telegram notification could not be sent:', tgError);
          }
        }
        
        // Kullanıcı manuel imza
        const signedXdr = await signTransaction(buildResponse.xdr);
        
        if (typeof signedXdr === 'string') {
          signedXDR = signedXdr;
        } else if (signedXdr && typeof signedXdr === 'object' && 'signedTxXdr' in signedXdr) {
          signedXDR = (signedXdr as any).signedTxXdr;
        } else {
          throw new Error('Invalid signed XDR format received from Freighter');
        }
        
        if (!signedXDR || signedXDR.trim() === '') {
          throw new Error('Empty signed XDR received from Freighter');
        }
        
        // 📱 Telegram bildirimi: Grid Bot manuel imza başarılı
        if (telegramBot && telegramChatId) {
          const assetInSymbol = ASSET_OPTIONS.find(a => a.value === (type === 'buy' ? autoTradeAssetIn : autoTradeAssetOut))?.symbol || 'Unknown';
          const assetOutSymbol = ASSET_OPTIONS.find(a => a.value === (type === 'buy' ? autoTradeAssetOut : autoTradeAssetIn))?.symbol || 'Unknown';
          const message = `✅ GRID BOT SIGNATURE SUCCESSFUL!

🔐 Freighter wallet signature received
🤖 Grid Bot ${type === 'buy' ? `💰 ${assetOutSymbol} BUY` : `💸 ${assetInSymbol} SELL`} operation
💰 Amount: ${amount} ${assetInSymbol}
💵 Target Price: $${targetPrice}
📊 Current Price: $${displayPrice.toFixed(4)}
📊 Pair: ${assetInSymbol}/${assetOutSymbol}
⏰ ${new Date().toLocaleString('tr-TR')}

📤 Grid Bot transaction is being sent to the blockchain...`;

          try {
            await telegramBot.sendMessage(telegramChatId, message);
          } catch (tgError) {
            console.warn('Telegram notification could not be sent:', tgError);
          }
        }
      }

      setAutoTradeStatus(`📤 Grid Bot transaction is being sent...`);

      // Submit transaction - RETRY MEKANİZMASI
      let submitResponse: any;
      retryCount = 0;
      
      while (retryCount < maxRetries) {
        try {
          setAutoTradeStatus(`📤 Grid Bot transaction is being sent... (Attempt ${retryCount + 1}/${maxRetries})`);

          submitResponse = await Promise.race([
            soroswapAPI.sendTransaction({ xdr: signedXDR }),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error(`Grid Bot send timeout (${90 + (retryCount * 30)} seconds)`)), 90000 + (retryCount * 30000))
            )
          ]) as any;
          
          break;
          
        } catch (submitError) {
          retryCount++;
          console.error(`Grid Bot transaction submission attempt ${retryCount} failed:`, submitError);
          
          if (retryCount >= maxRetries) {
            throw new Error(`Grid Bot transaction submission failed after ${maxRetries} attempts: ${submitError instanceof Error ? submitError.message : 'Unknown error'}`);
          }

          setAutoTradeStatus(`⏳ Grid Bot transaction submission failed, retrying in ${7 * retryCount} seconds...`);
          await new Promise(resolve => setTimeout(resolve, 7000 * retryCount));
        }
      }
      
      if (!submitResponse.hash && !submitResponse.status) {
        throw new Error(`Grid Bot transaction submission hatası: No hash received`);
      }

      const assetInSymbol = ASSET_OPTIONS.find(a => a.value === (type === 'buy' ? autoTradeAssetIn : autoTradeAssetOut))?.symbol || 'Unknown';
      const assetOutSymbol = ASSET_OPTIONS.find(a => a.value === (type === 'buy' ? autoTradeAssetOut : autoTradeAssetIn))?.symbol || 'Unknown';

      let statusMessage = `✅ Grid Bot ${type === 'buy' ? 'BUY' : 'SELL'} successful!
🤖 Grid Bot Transaction Completed
💰 Amount: ${amount} ${assetInSymbol}
📊 Pair: ${assetInSymbol}/${assetOutSymbol}
💵 Price: $${displayPrice.toFixed(4)}
🆔 Hash: ${submitResponse.hash || 'N/A'}`;

      // 🎯 Transfer mantığı: Sadece transferAfterTrade true ise (satım) transfer yap
      if (transferAfterTrade && usingBotWallet && customWalletAddress && botWallet) {
        try {
          setAutoTradeStatus(statusMessage + `\n🔄 Earnings are transferred to the main wallet...`);
          
          // Transaction hash'ini kontrol et
          console.log('📄 Transaction Hash:', submitResponse.hash);
          
          // Daha uzun süre bekle - transaction'ın confirm olması için
          console.log('⏳ Waiting for transaction confirmation... (10 seconds)');
          await new Promise(resolve => setTimeout(resolve, 10000)); // 3'ten 10 saniyeye çıkardık
          
          // Bot account'unu yeniden sorgula
          const response = await fetch(`https://horizon-testnet.stellar.org/accounts/${botWallet.publicKey}`);
          if (response.ok) {
            const postTradeAccount = await response.json();
            
            // Debug: Tüm balances'ları detaylı log'la
            console.log('🤖 Bot Wallet All Balances:', JSON.stringify(postTradeAccount.balances, null, 2));
            
            // Transfer edilecek asset'i belirle (satım sonrası alınan asset)
            const targetAssetValue = type === 'sell' ? autoTradeAssetOut : autoTradeAssetIn;
            const targetAssetInfo = ASSET_OPTIONS.find(a => a.value === targetAssetValue);
            
            console.log('🎯 Transfer target:', {
              targetAssetValue,
              targetAssetInfo,
              type,
              autoTradeAssetOut,
              autoTradeAssetIn
            });
            
            // USDC özel arama - tüm balances'ları kontrol et
            console.log('🔍 USDC Search - All Balances Details:');
            postTradeAccount.balances.forEach((balance: any, index: number) => {
              console.log(`Balance ${index}:`, {
                asset_type: balance.asset_type,
                asset_code: balance.asset_code,
                asset_issuer: balance.asset_issuer,
                balance: balance.balance,
                is_usdc: balance.asset_code === 'USDC',
                contains_usd: balance.asset_code?.includes('USDC'),
                issuer_match: balance.asset_issuer === 'CBBHRKEP5M3NUDRISGLJKGHDHX3DA2CN2AZBQY6WLVUJ7VNLGSKBDUCM'
              });
            });
            
            // EMERGENCY: Eğer target USDC ise, XLM dışındaki TÜM asset'leri listele
            if (targetAssetInfo?.symbol === 'USDC') {
              console.log('🚨 EMERGENCY USDC SEARCH:');
              const nonXlmBalances = postTradeAccount.balances.filter((b: any) => b.asset_type !== 'native' && parseFloat(b.balance) > 0);
              console.log('Non-XLM balances:', nonXlmBalances);
              
              if (nonXlmBalances.length > 0) {
                console.log('🎯 USDC found! First non-XLM asset will be used:', nonXlmBalances[0]);
              }
            }
            
            // Hedef asset balance'ını bul
            const targetAssetBalance = postTradeAccount.balances.find((balance: any) => {
              if (targetAssetValue.includes('native') || targetAssetValue.includes('XLM')) {
                return balance.asset_type === 'native';
              } else {
                const targetSymbol = targetAssetInfo?.symbol;
                
                console.log('🔍 Balance kontrol:', {
                  balance_asset_type: balance.asset_type,
                  balance_asset_code: balance.asset_code,
                  balance_asset_issuer: balance.asset_issuer,
                  balance_amount: balance.balance,
                  targetSymbol,
                  targetAssetValue
                });
                
                // USDC için ÇOK GENİŞ arama - herhangi bir USD içeren asset
                if (targetSymbol === 'USDC') {
                  // 1. Direkt USDC
                  if (balance.asset_code === 'USDC') {
                    console.log('✅ USDC (direct) found!', balance);
                    return true;
                  }
                  
                  // 2. USD içeren herhangi bir kod
                  if (balance.asset_code && balance.asset_code.includes('USD')) {
                    console.log('✅ USD containing asset found!', balance);
                    return true;
                  }
                  
                  // 3. USDC issuer eşleştirme
                  if (balance.asset_issuer === targetAssetValue) {
                    console.log('✅ USDC issuer matching!', balance);
                    return true;
                  }
                  
                  // 4. Herhangi bir non-XLM, non-zero balance (son çare)
                  if (balance.asset_type !== 'native' && parseFloat(balance.balance) > 0) {
                    console.log('⚠️ Non-XLM asset found (USDC may be):', balance);
                    return true;
                  }
                }
                
                // Diğer asset'ler için normal eşleştirme
                if (targetAssetValue && targetAssetValue.startsWith('C')) {
                  if (balance.asset_issuer === targetAssetValue) {
                    console.log('✅ Contract address matching successful');
                    return true;
                  }
                }
                
                if (balance.asset_code && targetSymbol) {
                  if (balance.asset_code.toUpperCase() === targetSymbol.toUpperCase()) {
                    console.log('✅ Symbol matching successful');
                    return true;
                  }
                }
                
                return false;
              }
            });
            
            console.log('🎯 Found targetAssetBalance:', targetAssetBalance);
            
            if (targetAssetBalance && parseFloat(targetAssetBalance.balance) > 0.01) { // 0.1'den 0.01'e düşürdük
              const assetIdentifier = targetAssetBalance.asset_type === 'native' 
                ? 'native' 
                : `${targetAssetBalance.asset_code}_${targetAssetBalance.asset_issuer || ''}`;
              
              console.log('💸 Asset to be transferred:', assetIdentifier);
              console.log('💰 Amount to be transferred:', targetAssetBalance.balance);
              
              // 💰 Grid trading kar miktarını hesapla
              let gridProfitAmount: number | undefined;
              
              
              if (type === 'buy' && gridBuyQuote?.amountOut) {
                // Buy işleminde elde ettiğimiz token miktarı
                gridProfitAmount = parseFloat(gridBuyQuote.amountOut);
                console.log('💰 Grid Buy Profit Amount:', gridProfitAmount, getAssetSymbol(gridBuyQuote.assetOut));
              } else if (type === 'sell' && gridSellQuote?.amountOut) {
                // Sell işleminde elde ettiğimiz kar miktarı
                gridProfitAmount = parseFloat(gridSellQuote.amountOut);
               
                console.log('💰 Grid Sell Profit Amount:', gridProfitAmount, getAssetSymbol(gridSellQuote.assetOut));
              }
              
              console.log('🎯 Calculated grid profit amount:', gridProfitAmount);
              
              const transferHash = await transferProfitToMainWallet(
                assetIdentifier,
                botWallet,
                customWalletAddress,
                gridProfitAmount // Kar miktarını parametre olarak geç
              );
              
              statusMessage += `\n✅ Earnings transferred to your wallet!
💸 Amount: ${parseFloat(targetAssetBalance.balance).toFixed(4)} ${targetAssetBalance.asset_code || 'XLM'}
💸 Transfer Hash: ${transferHash || 'N/A'}`;
            } else {
              const foundBalance = targetAssetBalance ? parseFloat(targetAssetBalance.balance).toFixed(6) : '0';
             
              // statusMessage += `\n📊 Found amount: ${foundBalance} (minimum: 0.01)`;
              // statusMessage += `\n📊 Current balances: ${postTradeAccount.balances.map((b: any) => 
              //   `${b.asset_code || 'XLM'}:${parseFloat(b.balance).toFixed(2)}`
              // ).join(', ')}`;
              
              // Eğer USDC yoksa ama yeterli XLM varsa XLM transfer et
              const xlmBalance = postTradeAccount.balances.find((b: any) => b.asset_type === 'native');
              if (xlmBalance && parseFloat(xlmBalance.balance) > 100) { // 100 XLM'den fazlaysa
                console.log('💡 USDC not found, XLM will be transferred...');
                try {
                  const xlmTransferHash = await transferProfitToMainWallet(
                    'native',
                    botWallet,
                    customWalletAddress,
                    undefined // Fallback XLM transfer'da kar miktarı belirtilmez
                  );
                  statusMessage += `\n🔄 Success!

              💸 Transfer Hash: ${xlmTransferHash || 'N/A'}`;
                } catch (xlmError) {
                  statusMessage += `\n❌ XLM transfer error: ${xlmError}`;
                }
              }
            }
          }
        } catch (transferError) {
          console.error('Grid Bot transfer error:', transferError);
          statusMessage += `\n⚠️ Transfer error: ${transferError}`;
        }
      } else if (type === 'buy') {
        statusMessage += `\n🏦 Acquired tokens are stored in the bot wallet (ready for sale)`;
      }

      setAutoTradeStatus(statusMessage);

      // Telegram notification
      if (telegramBot && telegramChatId) {
        const message = `🤖 Grid Bot ${type === 'buy' ? 'Buy' : 'Sell'} Successful!

💰 Amount: ${amount} ${assetInSymbol}
💵 Price: $${displayPrice.toFixed(4)}
🆔 Hash: ${submitResponse.hash || 'N/A'}
${transferAfterTrade ? '💸 Profit transferred to your wallet!' : '🏦 Tokens stored in the bot wallet'}
⏰ ${new Date().toLocaleString('tr-TR')}`;
        
        await telegramBot.sendMessage(telegramChatId, message);
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Grid Bot transaction error:', error);
      
      setAutoTradeStatus(`❌ Grid Bot ${type === 'buy' ? 'Buy' : 'Sell'} error: ${errorMessage}
🤖 Grid Bot Process Stopped
📊 Target: $${targetPrice}
💵 Current: $${displayPrice.toFixed(4)}
⚠️ Error: ${errorMessage}
⏰ ${new Date().toLocaleString('tr-TR')}`);
      
      // Telegram hata bildirimi
      if (telegramBot && telegramChatId) {
        const message = `❌ Grid Bot ${type === 'buy' ? 'Buy' : 'Sell'} Error!

🤖 Grid Bot Process Stopped
📊 Target: $${targetPrice}
💵 Current: $${displayPrice.toFixed(4)}
⚠️ Error: ${errorMessage}
⏰ ${new Date().toLocaleString('tr-TR')}`;
        
        await telegramBot.sendMessage(telegramChatId, message);
      }
    } finally {
      setIsTrading(false);
    }
  }, [publicKey, signTransaction, displayPrice, telegramBot, telegramChatId, autoTradeAssetIn, autoTradeAssetOut, botMode, botWallet, botBalance, transferProfitToMainWallet, customWalletAddress, getDynamicTradeParams, getAssetSymbol, gridBuyQuote, gridSellQuote]);



  // 🎯 Fiyat Bazlı Otomatik İşlem Kontrolü - Pre-Auth Version
  useEffect(() => {
    const checkPreAuthTrade = async () => {
      if (isTrading || hasAutoTradeError || !isAutoTradingEnabled || !isConnected || displayPrice === 0) {
        return;
      }

      const now = new Date();
      if (lastAutoTradeCheck.current && (now.getTime() - lastAutoTradeCheck.current.getTime()) < 3000) {
        return;
      }
      lastAutoTradeCheck.current = now;

      try {
        // 🎯 Pre-Auth Alım kontrolü
        if (preAuthBuyOrder && now < preAuthBuyOrder.expiry && 
            displayPrice <= parseFloat(preAuthBuyOrder.targetPrice) && !isTrading) {
          
          setAutoTradeStatus(`🎯 Pre-auth buy triggered! $${displayPrice.toFixed(4)} <= $${preAuthBuyOrder.targetPrice}`);
          
          await executeBotTrade('buy', preAuthBuyOrder.amount, preAuthBuyOrder.targetPrice);
        }
        // 🎯 Pre-Auth Satım kontrolü
        else if (preAuthSellOrder && now < preAuthSellOrder.expiry && 
                 displayPrice >= parseFloat(preAuthSellOrder.targetPrice) && !isTrading) {

          setAutoTradeStatus(`🎯 Pre-auth sell triggered! $${displayPrice.toFixed(4)} >= $${preAuthSellOrder.targetPrice}`);

          await executeBotTrade('sell', preAuthSellOrder.amount, preAuthSellOrder.targetPrice);
        }
        
        // 🤖 Grid Trading Bot kontrolü
        if (gridTradingBot && now < gridTradingBot.expiry && gridTradingBot.isActive && !isTrading) {
          
          if (gridTradingBot.currentStep === 'waiting_buy' && 
              displayPrice <= parseFloat(gridTradingBot.buyPrice)) {
            
            setAutoTradeStatus(`🤖 Grid Bot: Buy triggered! $${displayPrice.toFixed(4)} ≤ $${gridTradingBot.buyPrice} (equal or below)`);
            
            // Alım işlemini gerçekleştir (Transfer YOK - bot cüzdanında kalacak)
            await executeGridBotTrade('buy', gridTradingBot.buyAmount, gridTradingBot.buyPrice, false);
            
            // Grid bot'u satım aşamasına geçir
            const updatedGridBot = {
              ...gridTradingBot,
              currentStep: 'waiting_sell' as const,
              buyHash: 'completed',
              status: `✅ GRID BOT - PURCHASE COMPLETED!
🔄 UPDATED PROCESS ORDER:
1️⃣ PURCHASE STAGE: ✅ COMPLETED!
   → Purchase Price: $${displayPrice.toFixed(4)} (≤ $${gridTradingBot.buyPrice})
   → Amount Received: ${gridTradingBot.buyAmount} ${getAssetSymbol(autoTradeAssetIn)}
2️⃣ SALE STAGE: ⚠️ STARTED!
   → Target: Price ≥ $${gridTradingBot.sellPrice} (equal or above)
   → To be sold: ${getAssetSymbol(autoTradeAssetOut)} tokens in the bot
3️⃣ PROFIT TRANSFER: ⏳ Automatic transfer after sale

📊 CURRENT STATUS: 2️⃣ Waiting for sale price ($${gridTradingBot.sellPrice} and above)
🔄 Automatic loop continues...`
            };
            
            setGridTradingBot(updatedGridBot);
            localStorage.setItem(`grid_bot_${publicKey}`, JSON.stringify(updatedGridBot));
            
          } else if (gridTradingBot.currentStep === 'waiting_sell' && 
                     displayPrice >= parseFloat(gridTradingBot.sellPrice)) {
            
            setAutoTradeStatus(`🤖 Grid Bot: Sale triggered! $${displayPrice.toFixed(4)} ≥ $${gridTradingBot.sellPrice} (equal or above)`);
            
            // Satım işlemini gerçekleştir (Transfer VAR - kazanç ana cüzdana gidecek)
            try {
              if (botWallet) {
                const response = await fetch(`https://horizon-testnet.stellar.org/accounts/${botWallet.publicKey}`);
                if (response.ok) {
                  const account = await response.json();
                  
                  // Debug: Bot cüzdanındaki tüm asset'leri logla
                  console.log('🤖 Assets in the Grid Bot wallet:', account.balances);
                  account.balances.forEach((balance: any, index: number) => {
                    console.log(`Asset ${index}:`, {
                      type: balance.asset_type,
                      code: balance.asset_code,
                      issuer: balance.asset_issuer,
                      contract: balance.asset_contract,
                      asset: balance.asset,
                      balance: balance.balance
                    });
                  });
                  
                  // Satılacak asset'i bul (alım sonrası bot'da kalan token)
                  const targetAssetValue = autoTradeAssetOut;
                  const targetAssetInfo = ASSET_OPTIONS.find(a => a.value === targetAssetValue);
                  
                  console.log('🎯 Searched asset:', {
                    value: targetAssetValue,
                    symbol: targetAssetInfo?.symbol,
                    label: targetAssetInfo?.label,
                    rawAssetOptions: ASSET_OPTIONS
                  });
                  
                  console.log('🔍 Asset matching begins...');
                  
                  const targetBalance = account.balances.find((balance: any, index: number) => {
                    console.log(`🔍 Checking asset ${index}:`, {
                      balanceType: balance.asset_type,
                      balanceCode: balance.asset_code,
                      balanceIssuer: balance.asset_issuer?.slice(0, 10) + '...',
                      balanceContract: balance.asset_contract?.slice(0, 10) + '...',
                      targetValue: targetAssetValue.slice(0, 20) + '...',
                      targetSymbol: targetAssetInfo?.symbol
                    });
                    
                    if (targetAssetValue.includes('native')) {
                      const isMatch = balance.asset_type === 'native';
                      console.log(`   → Native match: ${isMatch}`);
                      return isMatch;
                    } else {
                      const targetSymbol = targetAssetInfo?.symbol;
                      
                      // Soroswap contract asset için gelişmiş matching
                      if (balance.asset_type === 'credit_alphanum4' || balance.asset_type === 'credit_alphanum12') {
                        // Geleneksel Stellar asset matching
                        const codeMatch = balance.asset_code && targetSymbol && (
                          balance.asset_code === targetSymbol ||
                          balance.asset_code.includes(targetSymbol) ||
                          targetSymbol.includes(balance.asset_code)
                        );
                        console.log(`   → Credit asset code match: ${codeMatch} (${balance.asset_code} vs ${targetSymbol})`);
                        return codeMatch;
                      } else if (balance.asset_type === 'contract') {
                        // Soroswap contract asset matching
                        const contractMatch = balance.asset_contract === targetAssetValue ||
                               balance.asset === targetAssetValue;
                        const codeMatch = balance.asset_code && targetSymbol && (
                                 balance.asset_code === targetSymbol ||
                                 balance.asset_code.includes(targetSymbol) ||
                                 targetSymbol.includes(balance.asset_code)
                               );
                        const anyMatch = contractMatch || codeMatch;
                        console.log(`   → Contract asset match: contractMatch=${contractMatch}, codeMatch=${codeMatch}, anyMatch=${anyMatch}`);
                        return anyMatch;
                      } else {
                        // Fallback - herhangi bir matching
                        const codeMatch = balance.asset_code && targetSymbol && (
                          balance.asset_code === targetSymbol ||
                          balance.asset_code.includes(targetSymbol) ||
                          targetSymbol.includes(balance.asset_code)
                        );
                        const contractMatch = balance.asset_contract === targetAssetValue ||
                                            balance.asset === targetAssetValue;
                        const anyMatch = codeMatch || contractMatch;
                        console.log(`   → Fallback match: codeMatch=${codeMatch}, contractMatch=${contractMatch}, anyMatch=${anyMatch}`);
                        return anyMatch;
                      }
                    }
                  });
                  
                  console.log('🔍 Asset matching sonucu:', targetBalance);
                  
                  if (targetBalance && parseFloat(targetBalance.balance) > 0.1) {
                    // Bot'daki token miktarının %95'ini sat (fee için %5 rezerv)
                    // const sellAmount = (parseFloat(targetBalance.balance) * 0.95).toFixed(4);
                    
                    // 🔄 USDC FINDING ALGORITHM - Enhanced
                    console.log('\n🎯 USDC FINDING ALGORITHM BEGINS');
                    console.log('Target Asset:', targetAssetInfo);
                    console.log('Bot Wallet ID:', botWallet?.publicKey);
                    console.log('Bot Balances:', account.balances);
                    
                    // Birden fazla algoritma ile USDC ara
                    let usdcBalance = null;
                    
                    // Algoritma 1: Asset code ile arama
                    if (!usdcBalance) {
                      usdcBalance = account.balances.find((balance: any) => 
                        balance.asset_code === 'USDC'
                      );
                      if (usdcBalance) console.log('✅ Algorithm 1: USDC found by asset code:', usdcBalance);
                    }
                    
                    // Algoritma 2: Contract address ile arama
                    if (!usdcBalance) {
                      const usdcContractAddress = 'CBBHRKEP5M3NUDRISGLJKGHDHX3DA2CN2AZBQY6WLVUJ7VNLGSKBDUCM';
                      usdcBalance = account.balances.find((balance: any) => 
                        balance.asset_code === usdcContractAddress ||
                        balance.asset_issuer === usdcContractAddress ||
                        (balance.asset_type === 'contract' && balance.contract === usdcContractAddress)
                      );
                      if (usdcBalance) console.log('✅ Algorithm 2: USDC found by contract address:', usdcBalance);
                    }
                    
                    // Algoritma 3: Target asset ile eşleştirme  
                    if (!usdcBalance && targetAssetInfo) {
                      usdcBalance = account.balances.find((balance: any) => {
                        if (targetAssetInfo.type === 'native') {
                          return balance.asset_type === 'native';
                        } else if (targetAssetInfo.type === 'contract') {
                          return balance.asset_type === 'contract' && 
                                 balance.contract === targetAssetInfo.contract;
                        } else if (targetAssetInfo.type === 'credit_alphanum4' || targetAssetInfo.type === 'credit_alphanum12') {
                          return balance.asset_code === targetAssetInfo.code && 
                                 balance.asset_issuer === targetAssetInfo.issuer;
                        }
                        return false;
                      });
                      if (usdcBalance) console.log('✅ Algorithm 3: USDC found by target asset matching:', usdcBalance);
                    }
                    
                    if (usdcBalance && parseFloat(usdcBalance.balance) > 0.1) {
                     /////////111111
                      // Kullanıcının belirlediği satım miktarını kullan, ama mevcuttan fazla olamaz
                      const availableAmount = parseFloat(usdcBalance.balance) * 0.95; // %95'i kullanılabilir
                      const requestedAmount = parseFloat(gridTradingBot.sellAmount);
                      const sellAmount = Math.min(availableAmount, requestedAmount).toFixed(4);
                      
                      console.log(`💸 Grid Bot: İstenen: ${requestedAmount} USDC, Mevcut: ${availableAmount.toFixed(4)} USDC, To be sold: ${sellAmount} USDC`);
                      
                      setAutoTradeStatus(`🔄 Grid Bot: ${sellAmount} USDC is being sold...`);
                      
                      // Grid Bot özel satım fonksiyonuyla sat (transfer = true)
                      await executeGridBotTrade('sell', sellAmount, gridTradingBot.sellPrice, true);
                      
                      // Grid bot'u tamamlandı olarak işaretle (USDC satım)
                      const completedGridBot = {
                        ...gridTradingBot,
                        currentStep: 'completed' as const,
                        sellHash: 'completed',
                        isActive: false,
                        status: `✅ GRID BOT COMPLETED! (USDC Sale)
🔄 TRANSACTION SEQUENCE COMPLETED - NORMAL:
1️⃣ PURCHASE: ✅ $${gridTradingBot.buyPrice} (≤ triggered at or below)
2️⃣ SALE: ✅ $${displayPrice.toFixed(4)} (≥ triggered at or above)
3️⃣ PROFIT TRANSFER: ✅ Transferred to main wallet!

💰 Transaction Amount: ${gridTradingBot.buyAmount} ${getAssetSymbol(autoTradeAssetIn)} → ${sellAmount} ${getAssetSymbol(autoTradeAssetOut)} (real)
${requestedAmount !== parseFloat(sellAmount) ? `⚠️ İstenen: ${requestedAmount} ${getAssetSymbol(autoTradeAssetOut)}, Desired: ${sellAmount} ${getAssetSymbol(autoTradeAssetOut)}` : ''}
💸 Sold USDC: ${sellAmount} USDC
✅ Note: USDC was successfully found and sold
📈 Actual Profit: ${((displayPrice - parseFloat(gridTradingBot.buyPrice)) / parseFloat(gridTradingBot.buyPrice) * 100).toFixed(2)}%
🎉 Grid trading loop completed successfully!`
                      };
                      
                      setGridTradingBot(completedGridBot);
                      localStorage.setItem(`grid_bot_${publicKey}`, JSON.stringify(completedGridBot));
                      
                      // 5 dakika sonra Grid Bot'u temizle
                      setTimeout(() => {
                        setGridTradingBot(null);
                        localStorage.removeItem(`grid_bot_${publicKey}`);
                      }, 5 * 60 * 1000);
                      
                    } else {
                      console.log('❌ USDC not found, experience with XLM...');
                      
                      // XLM ile alternatif satış (Debug modu)
                      const xlmBalance = account.balances.find((balance: any) => 
                        balance.asset_type === 'native' && parseFloat(balance.balance) > 2.5 // Min 2.5 XLM rezerv
                      );
                      
                      if (xlmBalance) {
                        // Kullanıcının belirlediği satım miktarını kullan, ama mevcuttan fazla olamaz
                        const availableAmount = parseFloat(xlmBalance.balance) * 0.7; // %70'i kullanılabilir
                        const requestedAmount = parseFloat(gridTradingBot.sellAmount);
                        const sellAmount = Math.min(availableAmount, requestedAmount).toFixed(4);
                        
                        console.log(`💸 Grid Bot Alternative: Desired: ${requestedAmount} XLM, Available: ${availableAmount.toFixed(4)} XLM, To be sold: ${sellAmount} XLM (Debug mode)`);
                        
                        setAutoTradeStatus(`🔄 Grid Bot: USDC not found, ${sellAmount} XLM sale is being made (Debug)...`);
                        
                        try {
                          // Grid Bot özel satım fonksiyonuyla XLM sat (transfer = true)
                          /////////111111
                          await executeGridBotTrade('sell', sellAmount, gridTradingBot.sellPrice, true);
                          
                          // Grid bot'u tamamlandı olarak işaretle (XLM debug satış)
                          const completedGridBot = {
                            ...gridTradingBot,
                            currentStep: 'completed' as const,
                            sellHash: 'completed',
                            isActive: false,
                            status: `⚠️ GRID BOT COMPLETED! (DEBUG MODE - XLM Sales)
🔄 PROCESS FLOW COMPLETED - DEBUG:
1️⃣ BUY: ⚠️ $${gridTradingBot.buyPrice} (Purchase may not have been successful)
2️⃣ SELL: ✅ $${displayPrice.toFixed(4)} (Sale made with XLM)
3️⃣ PROFIT TRANSFER: ✅ Transferred to main wallet!

💰 Planned Action: ${gridTradingBot.buyAmount} ${getAssetSymbol(autoTradeAssetIn)} → ${sellAmount} XLM (real debug)
${requestedAmount !== parseFloat(sellAmount) ? `⚠️ Desired: ${requestedAmount} ${getAssetSymbol(autoTradeAssetOut)}, Real: ${sellAmount} XLM` : ''}
💸 Real Sale: ${sellAmount} XLM (Debug Mode)
⚠️ WARNING: USDC not found, purchase may have failed
📈 Price Difference: ${((displayPrice - parseFloat(gridTradingBot.buyPrice)) / parseFloat(gridTradingBot.buyPrice) * 100).toFixed(2)}%
🔧 Debug mode Grid trading completed (there is a problem)!`
                          };
                          
                          setGridTradingBot(completedGridBot);
                          localStorage.setItem(`grid_bot_${publicKey}`, JSON.stringify(completedGridBot));
                          
                          // 3 dakika sonra Grid Bot'u temizle (debug mode)
                          setTimeout(() => {
                            setGridTradingBot(null);
                            localStorage.removeItem(`grid_bot_${publicKey}`);
                          }, 3 * 60 * 1000);
                          
                        } catch (xlmSellError) {
                          console.error('XLM sale error:', xlmSellError);
                          setAutoTradeStatus(`❌ Grid Bot: XLM sale error: ${xlmSellError}`);
                          
                          // Grid Bot'u hata olarak işaretle
                          const errorGridBot = {
                            ...gridTradingBot,
                            status: `❌ Grid Bot Error: XLM sale failed - ${xlmSellError}`
                          };
                          setGridTradingBot(errorGridBot);
                          localStorage.setItem(`grid_bot_${publicKey}`, JSON.stringify(errorGridBot));
                        }
                        
                      } else {
                        console.log('❌ Not enough XLM found (min 2.5 XLM required)');
                        setAutoTradeStatus('❌ Grid Bot: Not enough sellable asset found');

                        // Grid Bot'u hata olarak işaretle
                        const errorGridBot = {
                          ...gridTradingBot,
                          status: `❌ Grid Bot Error: Not enough sellable asset found

🔍 Bot Wallet Status:
- Bot ID: ${botWallet?.publicKey}
- Current Balances: ${JSON.stringify(account.balances, null, 2)}
- Target Asset: USDC (${targetAssetInfo?.contract})
- XLM Balance: ${account.balances.find((b: any) => b.asset_type === 'native')?.balance || '0'} XLM

⚠️ Possible reason: Purchase failed and USDC could not be obtained`
                        };
                        setGridTradingBot(errorGridBot);
                        localStorage.setItem(`grid_bot_${publicKey}`, JSON.stringify(errorGridBot));
                      }
                    }
                    
                  } else {
                    console.log('⚠️ Target asset not found, searching for asset containing USDC...');

                    // First, search for any asset containing USDC
                    const usdcAssets = account.balances.filter((balance: any) => {
                      const hasBalance = parseFloat(balance.balance) > 0.1;
                      
                      // USDC matching için farklı yöntemler deneyelim
                      const codeMatch = balance.asset_code && (
                        balance.asset_code.includes('USDC') ||
                        balance.asset_code.includes('USD') ||
                        balance.asset_code === 'USDC'
                      );
                      
                      // Contract address matching
                      const contractMatch = balance.asset_contract === 'CBBHRKEP5M3NUDRISGLJKGHDHX3DA2CN2AZBQY6WLVUJ7VNLGSKBDUCM' ||
                                          balance.asset === 'CBBHRKEP5M3NUDRISGLJKGHDHX3DA2CN2AZBQY6WLVUJ7VNLGSKBDUCM';
                      
                      // Issuer matching (geleneksel Stellar asset için)
                      const issuerMatch = balance.asset_issuer && balance.asset_code === 'USDC';
                      
                      const isUSDC = codeMatch || contractMatch || issuerMatch;
                      
                      console.log(`🔍 USDC check - Asset: ${balance.asset_code}, Type: ${balance.asset_type}, Contract: ${balance.asset_contract?.slice(0, 10)}..., hasBalance: ${hasBalance}, codeMatch: ${codeMatch}, contractMatch: ${contractMatch}, issuerMatch: ${issuerMatch}, isUSDC: ${isUSDC}`);
                      
                      return hasBalance && isUSDC;
                    });
                    
                    console.log('🔍 USDC containing assets:', usdcAssets);
                    
                    if (usdcAssets.length > 0) {
                      // İlk USDC asset'ini seç
                      const usdcBalance = usdcAssets[0];
                      // Kullanıcının belirlediği satım miktarını kullan, ama mevcuttan fazla olamaz
                      const availableAmount = parseFloat(usdcBalance.balance) * 0.95; // %95'i kullanılabilir
                      const requestedAmount = parseFloat(gridTradingBot.sellAmount);
                      const sellAmount = Math.min(availableAmount, requestedAmount).toFixed(4);
                      
                      console.log(`💸 Grid Bot found USDC asset: Requested: ${requestedAmount} ${usdcBalance.asset_code}, Current: ${availableAmount.toFixed(4)} ${usdcBalance.asset_code}, Selling: ${sellAmount} ${usdcBalance.asset_code}`);
                      
                      setAutoTradeStatus(`🔄 Grid Bot: USDC asset found, selling ${sellAmount} ${usdcBalance.asset_code}...`);
                      /////////111111
                      // Grid Bot özel satım fonksiyonuyla sat (transfer = true)
                      await executeGridBotTrade('sell', sellAmount, gridTradingBot.sellPrice, true);
                      
                      // Grid bot'u tamamlandı olarak işaretle (USDC satım)
                      const completedGridBot = {
                        ...gridTradingBot,
                        currentStep: 'completed' as const,
                        sellHash: 'completed',
                        isActive: false,
                        status: `✅ Grid Bot completed! (USDC found)
🔄 Process sequence completed:
1️⃣ PURCHASE: ✅ $${gridTradingBot.buyPrice} (≤ equal or less than triggered)
2️⃣ SELLING: ✅ $${displayPrice.toFixed(4)} (≥ equal or greater than triggered)  
3️⃣ PROFIT TRANSFER: ✅ Transferred to main wallet!

💰 Transaction Amount: ${gridTradingBot.buyAmount} ${getAssetSymbol(autoTradeAssetIn)} → ${sellAmount} ${getAssetSymbol(autoTradeAssetOut)} (real)
${requestedAmount !== parseFloat(sellAmount) ? `⚠️ İstenen: ${requestedAmount} ${getAssetSymbol(autoTradeAssetOut)}, Gerçek: ${sellAmount} ${getAssetSymbol(autoTradeAssetOut)}` : ''}
💸 Sold USDC: ${sellAmount} ${usdcBalance.asset_code}
✅ Note: USDC asset was successfully found and sold
📈 Actual Profit: ${((displayPrice - parseFloat(gridTradingBot.buyPrice)) / parseFloat(gridTradingBot.buyPrice) * 100).toFixed(2)}%
🎉 Grid trading loop completed successfully!`
                      };
                      
                      setGridTradingBot(completedGridBot);
                      localStorage.setItem(`grid_bot_${publicKey}`, JSON.stringify(completedGridBot));
                      
                      // 5 dakika sonra Grid Bot'u temizle
                      setTimeout(() => {
                        setGridTradingBot(null);
                        localStorage.removeItem(`grid_bot_${publicKey}`);
                      }, 5 * 60 * 1000);
                      
                    } else {
                      console.log('⚠️ USDC asset not found, trying XLM sale...');
                      
                      // XLM satışına izin ver (Grid Bot debug modu)
                      const xlmBalance = account.balances.find((balance: any) => 
                        balance.asset_type === 'native' && parseFloat(balance.balance) > 2.0 // Min 2 XLM rezerv
                      );
                      
                      if (xlmBalance) {
                        // Kullanıcının belirlediği satım miktarını kullan, ama mevcuttan fazla olamaz
                        const availableAmount = parseFloat(xlmBalance.balance) * 0.8; // %80'i kullanılabilir (rezerv bırak)
                        const requestedAmount = parseFloat(gridTradingBot.sellAmount);
                        const sellAmount = Math.min(availableAmount, requestedAmount).toFixed(4);
                        
                        console.log(`💸 Grid Bot XLM Sale: ${sellAmount} XLM will be sold (Debug mode)`);
                        
                        setAutoTradeStatus(`🔄 Grid Bot: USDC bulunamadı, XLM satışı yapılıyor (Debug)...`);
                        
                        // Grid Bot özel satım fonksiyonuyla XLM sat (transfer = true)
                        try {
                          /////////111111
                          await executeGridBotTrade('sell', sellAmount, gridTradingBot.sellPrice, true);
                          
                          // Grid bot'u tamamlandı olarak işaretle (XLM satım)
                          const completedGridBot = {
                            ...gridTradingBot,
                            currentStep: 'completed' as const,
                            sellHash: 'completed',
                            isActive: false,
                            status: `✅ Grid Bot completed! (XLM Debug Sale)
🔄 Process sequence completed:
1️⃣ PURCHASE: ✅ $${gridTradingBot.buyPrice} (≤ equal or less than triggered)
2️⃣ SELLING: ✅ $${displayPrice.toFixed(4)} (≥ equal or greater than triggered)  
3️⃣ PROFIT TRANSFER: ✅ Transferred to main wallet!

💰 Transaction Amount: ${gridTradingBot.buyAmount} ${getAssetSymbol(autoTradeAssetIn)} → ${sellAmount} XLM (real debug)
${requestedAmount !== parseFloat(sellAmount) ? `⚠️ Requested: ${requestedAmount} XLM, Real: ${sellAmount} XLM` : ''}
💸 Sold XLM: ${sellAmount} XLM (Debug Mode)
⚠️ Note: USDC not found, XLM sold (purchase may have failed)
📈 Actual Profit: ${((displayPrice - parseFloat(gridTradingBot.buyPrice)) / parseFloat(gridTradingBot.buyPrice) * 100).toFixed(2)}%
🎉 Grid trading loop completed successfully (Debug)!`
                          };
                          
                          setGridTradingBot(completedGridBot);
                          localStorage.setItem(`grid_bot_${publicKey}`, JSON.stringify(completedGridBot));
                          
                          // 5 dakika sonra Grid Bot'u temizle
                          setTimeout(() => {
                            setGridTradingBot(null);
                            localStorage.removeItem(`grid_bot_${publicKey}`);
                          }, 5 * 60 * 1000);
                          
                        } catch (xlmSellError) {
                          console.error('XLM sale error:', xlmSellError);
                          setAutoTradeStatus(`❌ Grid Bot: XLM sale error: ${xlmSellError}`);
                        }
                        
                      } else {
                        console.log('⚠️ XLM not available (min 2 XLM required), alternative search being performed...');
                        
                        // Alternatif: En yüksek balance'lı non-XLM asset'i sat
                        const nonXLMAssets = account.balances.filter((balance: any) => 
                          balance.asset_type !== 'native' && 
                          parseFloat(balance.balance) > 0.1
                        );
                        
                        console.log('🔍 Mevcut non-XLM asset\'ler:', nonXLMAssets);
                        
                        if (nonXLMAssets.length > 0) {
                          // En yüksek balance'lı asset'i seç
                          const highestBalance = nonXLMAssets.reduce((prev: any, current: any) => 
                            parseFloat(current.balance) > parseFloat(prev.balance) ? current : prev
                          );
                          
                          // Kullanıcının belirlediği satım miktarını kullan, ama mevcuttan fazla olamaz
                          const availableAmount = parseFloat(highestBalance.balance) * 0.95; // %95'i kullanılabilir
                          const requestedAmount = parseFloat(gridTradingBot.sellAmount);
                          const sellAmount = Math.min(availableAmount, requestedAmount).toFixed(4);
                          
                          console.log(`💸 Grid Bot Alternative: Desired: ${requestedAmount} ${highestBalance.asset_code}, Current: ${availableAmount.toFixed(4)} ${highestBalance.asset_code}, Will be sold: ${sellAmount} ${highestBalance.asset_code}`);
                          
                          setAutoTradeStatus(`🔄 Grid Bot: Target asset not found, ${highestBalance.asset_code} sold...`);
                          
                          try {
                            /////////111111
                            // Grid Bot özel satım fonksiyonuyla sat (transfer = true)
                            await executeGridBotTrade('sell', sellAmount, gridTradingBot.sellPrice, true);
                            
                            // Grid bot'u tamamlandı olarak işaretle (alternatif asset satım)
                            const completedGridBot = {
                              ...gridTradingBot,
                              currentStep: 'completed' as const,
                              sellHash: 'completed',
                              isActive: false,
                              status: `✅ GRID BOT COMPLETED! (Alternative Asset Sales)
🔄 Process sequence completed:
1️⃣ PURCHASE: ✅ $${gridTradingBot.buyPrice} (≤ equal or less than triggered)
2️⃣ SELLING: ✅ $${displayPrice.toFixed(4)} (≥ equal or greater than triggered)  
3️⃣ PROFIT TRANSFER: ✅ Transferred to main wallet!

💰 Transaction Amount: ${gridTradingBot.buyAmount} ${getAssetSymbol(autoTradeAssetIn)} → ${sellAmount} ${highestBalance.asset_code} (real alternative)
${requestedAmount !== parseFloat(sellAmount) ? `⚠️ Desired: ${requestedAmount} ${getAssetSymbol(autoTradeAssetOut)}, Real: ${sellAmount} ${highestBalance.asset_code}` : ''}
💸 Sold Asset: ${sellAmount} ${highestBalance.asset_code}
⚠️ Note: USDC not found, alternative asset sold
📈 Realized Transaction: ${((displayPrice - parseFloat(gridTradingBot.buyPrice)) / parseFloat(gridTradingBot.buyPrice) * 100).toFixed(2)}%
🎉 Grid trading cycle completed (Alternative)!`
                            };
                            
                            setGridTradingBot(completedGridBot);
                            localStorage.setItem(`grid_bot_${publicKey}`, JSON.stringify(completedGridBot));
                            
                            // 5 dakika sonra Grid Bot'u temizle
                            setTimeout(() => {
                              setGridTradingBot(null);
                              localStorage.removeItem(`grid_bot_${publicKey}`);
                            }, 5 * 60 * 1000);
                            
                          } catch (altSellError) {
                            console.error('Alternative asset sale error:', altSellError);
                            setAutoTradeStatus(`❌ Grid Bot: Alternative asset sale error: ${altSellError}`);
                          }
                          
                        } else {
                          console.log('❌ No sellable asset found');
                          setAutoTradeStatus('❌ Grid Bot: No sellable asset found');

                          // Grid Bot'u hata olarak işaretle
                          const errorGridBot = {
                            ...gridTradingBot,
                            status: '❌ Grid Bot Error: No sellable asset found'
                          };
                          setGridTradingBot(errorGridBot);
                          localStorage.setItem(`grid_bot_${publicKey}`, JSON.stringify(errorGridBot));
                        }
                      }
                    }
                  }
                }
              }
            } catch (error) {
              console.error('Grid bot sale error:', error);
              setAutoTradeStatus(`❌ Grid Bot sale error: ${error}`);
            }
          }
        }
        
        // Geçerlilik süresi kontrolü
        if (preAuthBuyOrder && now > preAuthBuyOrder.expiry) {
          setPreAuthBuyOrder(null);
          localStorage.removeItem(`preauth_buy_${publicKey}`);
          setAutoTradeStatus('⏰ Pre-auth buy order expired. Please re-confirm.');
        }
        
        if (preAuthSellOrder && now > preAuthSellOrder.expiry) {
          setPreAuthSellOrder(null);
          localStorage.removeItem(`preauth_sell_${publicKey}`);
          setAutoTradeStatus('⏰ Pre-auth sell order expired. Re-confirm.');
        }
        
        if (gridTradingBot && now > gridTradingBot.expiry) {
          setGridTradingBot(null);
          localStorage.removeItem(`grid_bot_${publicKey}`);
          setAutoTradeStatus('⏰ Grid trading bot expired. Re-create.');
        }
        
      } catch (error: unknown) {
        console.error('❌ Pre-auth transaction check error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setAutoTradeStatus(`❌ Check error: ${errorMessage}`);
      }
    };

    checkPreAuthTrade();
  }, [displayPrice, isAutoTradingEnabled, isConnected, isTrading, preAuthBuyOrder, preAuthSellOrder, gridTradingBot, hasAutoTradeError, executeBotTrade, executeGridBotTrade, publicKey, botWallet, autoTradeAssetIn, autoTradeAssetOut, getAssetSymbol]);

  // 🤖 Auto Bot Mode: Target price set olduğunda otomatik pre-auth order oluştur
  useEffect(() => {
    // Sadece bot mode auto olduğunda ve gerekli koşullar sağlandığında çalış
    if (botMode !== 'auto' || !botWallet || !isConnected || !isAutoTradingEnabled) return;

    // Buy order auto creation
    if (buyTargetPrice && autoBuyAmount && !preAuthBuyOrder) {
      const timer = setTimeout(async () => {
        try {
          setAutoTradeStatus('🤖 Auto mode: Buy order creating automatically...');
          await createPreAuthBuyOrder(true); // Bot mode ile oluştur
        } catch (error) {
          console.error('Auto buy order creation error:', error);
          setAutoTradeStatus(`❌ Auto buy order error: ${error}`);
        }
      }, 1000); // 1 saniye bekle
      
      return () => clearTimeout(timer);
    }

    // Sell order auto creation
    if (sellTargetPrice && autoSellAmount && !preAuthSellOrder) {
      const timer = setTimeout(async () => {
        try {
          setAutoTradeStatus('🤖 Auto mode: Sell order creating automatically...');
          await createPreAuthSellOrder(true); // Bot mode ile oluştur
        } catch (error) {
          console.error('Auto sell order creation error:', error);
          setAutoTradeStatus(`❌ Auto sell order error: ${error}`);
        }
      }, 30000); // 1 saniye bekle
      
      return () => clearTimeout(timer);
    }

    // Grid Trading Bot auto creation
    if (gridBuyPrice && gridSellPrice && gridBuyAmount && gridSellAmount && !gridTradingBot) {
      const timer = setTimeout(async () => {
        try {
          setAutoTradeStatus('🤖 Auto mode: Grid trading bot creating automatically...');
          await createGridTradingBot(true); // Bot mode ile oluştur
        } catch (error) {
          console.error('Auto grid bot creation error:', error);
          setAutoTradeStatus(`❌ Auto grid bot error: ${error}`);
        }
      }, 1000); // 1 saniye bekle
      
      return () => clearTimeout(timer);
    }

  }, [botMode, botWallet, isConnected, isAutoTradingEnabled, 
      buyTargetPrice, autoBuyAmount, preAuthBuyOrder,
      sellTargetPrice, autoSellAmount, preAuthSellOrder,
      gridBuyPrice, gridSellPrice, gridBuyAmount, gridSellAmount, gridTradingBot,
      createPreAuthBuyOrder, createPreAuthSellOrder, createGridTradingBot]);


  return (
    // <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 relative overflow-hidden">
<div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Modern animated background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-600/10 via-purple-600/5 to-pink-600/10"></div>
        <div className="absolute top-20 left-20 w-96 h-96 bg-gradient-to-r from-cyan-400/20 to-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-80 h-80 bg-gradient-to-r from-purple-400/20 to-pink-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/3 w-72 h-72 bg-gradient-to-r from-emerald-400/20 to-teal-500/20 rounded-full blur-3xl animate-pulse delay-2000"></div>
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100px_100px]"></div>
      </div>
      
      {/* Header */}
      <header className="relative z-50 backdrop-blur-xl bg-white/5 border-b border-white/10 shadow-2xl">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-6">
              <div className="relative group">
                {/* Logo container with modern design */}
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 via-blue-600 to-purple-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25 transform group-hover:scale-110 transition-all duration-500 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent"></div>
                  <span className="text-white font-bold text-lg relative z-10 drop-shadow-lg">🤖</span>
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-ping"></div>
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full"></div>
                </div>
              </div>
              <div className="space-y-1">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-cyan-200 to-blue-300 bg-clip-text text-transparent drop-shadow-sm">
                  Pre-Auth Bot Trader
                </h1>
                <p className="text-sm text-slate-300 font-medium tracking-wide">
                  Advanced DeFi Trading Automation Platform
                </p>
              </div>
              
              {/* Ana Sayfa Linki */}
              <Link 
                href="/"
                className="group relative bg-gradient-to-r from-orange-500 via-red-500 to-pink-600 hover:from-orange-400 hover:via-red-400 hover:to-pink-500 text-white px-6 py-2.5 rounded-full font-medium transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 transform overflow-hidden ml-15"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative z-10 flex items-center space-x-2">
                  <span className="text-sm">💫</span>
                  <span>Soroswap Trader</span>
                </div>
              </Link>
            </div>
            
            {/* Wallet Connection Status */}
            <div className="flex items-center space-x-4">
              {isConnected && publicKey ? (
                <div className="group relative flex items-center space-x-2">
                  <div className="flex items-center space-x-3 bg-gradient-to-r from-emerald-500/20 to-green-500/20 backdrop-blur-xl text-emerald-100 px-4 py-2 rounded-full border border-emerald-400/30 shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 transition-all duration-300">
                    <div className="relative">
                      <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse shadow-lg shadow-emerald-400/50"></div>
                      <div className="absolute inset-0 bg-emerald-400 rounded-full animate-ping"></div>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-medium text-xs text-emerald-300">Connected</span>
                      <span className="font-mono text-xs text-white bg-white/10 px-2 py-1 rounded-lg">
                        {publicKey.slice(0, 6)}...{publicKey.slice(-6)}
                      </span>
                    </div>
                  </div>
                  {/* Manuel Kontrol Butonu */}
                  {/* <button
                    onClick={checkFreighterConnection}
                    title="Freighter bağlantısını kontrol et"
                    className="w-8 h-8 bg-gradient-to-r from-blue-500/20 to-purple-500/20 hover:from-blue-500/30 hover:to-purple-500/30 backdrop-blur-xl text-white rounded-full flex items-center justify-center border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
                  >
                    <span className="text-sm">🔍</span>
                  </button> */}
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={connectWallet}
                    disabled={!isAvailable}
                    className="group relative bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-700 hover:from-cyan-400 hover:via-blue-500 hover:to-purple-600 disabled:from-gray-600 disabled:to-gray-700 text-white px-6 py-2.5 rounded-full font-medium transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 transform disabled:hover:scale-100 overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative z-10 flex items-center space-x-2">
                      <span className="text-lg">{isAvailable ? '🚀' : '⬇️'}</span>
                      <span>{isAvailable ? 'Connect Freighter' : 'Install Freighter'}</span>
                    </div>
                  </button>
                  {/* Freighter durumu kontrol butonu (bağlı değilken) */}
                  {/* <button
                    onClick={checkFreighterConnection}
                    title="Freighter durumunu kontrol et"
                    className="w-8 h-8 bg-gradient-to-r from-gray-500/20 to-gray-600/20 hover:from-gray-500/30 hover:to-gray-600/30 backdrop-blur-xl text-gray-300 hover:text-white rounded-full flex items-center justify-center border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
                  >
                    <span className="text-sm">🔍</span>
                  </button> */}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        {!isConnected ? (
          /* Wallet Connection Screen - Modern Design */
          <div className="min-h-[80vh] flex items-center justify-center">
            <div className="text-center max-w-2xl mx-auto">
              {/* Modern 3D Logo */}
              <div className="relative mx-auto mb-12 w-48 h-48 group">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 rounded-3xl shadow-2xl shadow-blue-500/25 animate-float transform group-hover:scale-105 transition-all duration-700"></div>
                <div className="absolute inset-2 bg-gradient-to-br from-slate-900/50 to-slate-800/50 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/10">
                  <span className="text-8xl animate-bounce-slow drop-shadow-2xl">🤖</span>
                </div>
                {/* Floating particles */}
                <div className="absolute -top-4 -left-4 w-8 h-8 bg-cyan-400 rounded-full opacity-60 animate-ping"></div>
                <div className="absolute -bottom-4 -right-4 w-6 h-6 bg-purple-400 rounded-full opacity-60 animate-ping delay-1000"></div>
                <div className="absolute top-1/2 -right-8 w-4 h-4 bg-emerald-400 rounded-full opacity-60 animate-ping delay-2000"></div>
              </div>
              
              {/* Modern Typography */}
              <div className="space-y-8">
                <h2 className="text-6xl font-bold bg-gradient-to-r from-white via-cyan-200 to-blue-300 bg-clip-text text-transparent leading-tight">
                  Connect Your Wallet
                </h2>
                <div className="space-y-4">
                  <p className="text-xl text-slate-300 leading-relaxed max-w-xl mx-auto">
                    Connect your Freighter wallet to unlock advanced DeFi trading automation
                  </p>
                  <div className="flex items-center justify-center space-x-6 text-sm text-slate-400">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                      <span>Secure</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse delay-500"></div>
                      <span>Automated</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse delay-1000"></div>
                      <span>Professional</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modern CTA Button */}
              <div className="mt-16 space-y-8">
                <button
                  onClick={connectWallet}
                  disabled={!isAvailable}
                  className="group relative bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-700 hover:from-cyan-400 hover:via-blue-500 hover:to-purple-600 disabled:from-gray-600 disabled:to-gray-700 text-white px-12 py-6 rounded-3xl font-bold text-xl transition-all duration-300 shadow-2xl shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-105 transform disabled:hover:scale-100 overflow-hidden min-w-[300px]"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative z-10 flex items-center justify-center space-x-3">
                    <span className="text-3xl">{isAvailable ? '🚀' : '⬇️'}</span>
                    <span>{isAvailable ? 'Connect Freighter Wallet' : 'Install Freighter Extension'}</span>
                  </div>
                </button>
                
                {!isAvailable && (
                  <div className="space-y-4">
                    <p className="text-slate-400">Install Freighter browser extension first</p>
                    <a 
                      href="https://freighter.app/" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="inline-flex items-center space-x-3 text-cyan-400 hover:text-cyan-300 transition-colors duration-300 group"
                    >
                      <span>Download Freighter</span>
                      <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Trading Interface - Modern Layout */
          <div className="space-y-12">
            {/* Modern Welcome Section */}
            <div className="text-center mb-12">
              <h2 className="text-5xl font-bold bg-gradient-to-r from-white via-cyan-200 to-blue-300 bg-clip-text text-transparent mb-4 leading-tight">
                Advanced Trading Bot
              </h2>
              <p className="text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
                Automated price-based trading with intelligent pre-authorization system
              </p>
            </div>

            {/* Security Model Card - Modernized */}
            {/* <Card className="p-8 bg-gradient-to-br from-emerald-900/30 via-slate-900/80 to-emerald-900/30 border-emerald-500/40 backdrop-blur-xl shadow-2xl">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-emerald-400/30">
                  <span className="text-2xl">🤖</span>
                </div>
                <h3 className="text-2xl font-bold text-emerald-100">Bot Security Architecture</h3>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
                    <h4 className="text-xl font-semibold text-blue-200">👤 Manual Mode</h4>
                  </div>
                  <div className="space-y-3 pl-6 border-l-2 border-blue-500/30">
                    <div className="flex items-center space-x-3 text-slate-300">
                      <span className="text-blue-400">•</span>
                      <span>Funds from your main wallet</span>
                    </div>
                    <div className="flex items-center space-x-3 text-slate-300">
                      <span className="text-blue-400">•</span>
                      <span>Signature required for each transaction</span>
                    </div>
                    <div className="flex items-center space-x-3 text-slate-300">
                      <span className="text-blue-400">•</span>
                      <span>Requires active monitoring</span>
                    </div>
                    <div className="flex items-center space-x-3 text-slate-300">
                      <span className="text-blue-400">•</span>
                      <span>Freighter popup confirmation</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse delay-500"></div>
                    <h4 className="text-xl font-semibold text-emerald-200">🤖 Autonomous Mode</h4>
                  </div>
                  <div className="space-y-3 pl-6 border-l-2 border-emerald-500/30">
                    <div className="flex items-center space-x-3 text-slate-300">
                      <span className="text-emerald-400">•</span>
                      <span>Bot wallet funding system</span>
                    </div>
                    <div className="flex items-center space-x-3 text-slate-300">
                      <span className="text-emerald-400">•</span>
                      <span>Automated signature handling</span>
                    </div>
                    <div className="flex items-center space-x-3 text-slate-300">
                      <span className="text-emerald-400">•</span>
                      <span>24/7 operation capability</span>
                    </div>
                    <div className="flex items-center space-x-3 text-slate-300">
                      <span className="text-emerald-400">•</span>
                      <span>Requires XLM transfer to bot</span>
                    </div>
                    <div className="flex items-center space-x-3 text-emerald-300 font-semibold">
                      <span className="text-emerald-400">💸</span>
                      <span>Profits transferred to designated address</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card> */}

        {/* 🔗 Wallet Bağlantı Durumu */}
        <Card className={`${isConnected ? 'bg-blue-50 border-blue-200' : 'bg-yellow-50 border-yellow-200'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
              <div>
                <h3 className="font-semibold text-gray-800">
                  {isConnected ? '✅ Freighter Connected' : '🔗 Freighter Connection'}
                </h3>
                {isConnected && publicKey ? (
                  <p className="text-sm text-gray-600">
                    {publicKey.substring(0, 4)}...{publicKey.substring(publicKey.length - 4)}
                  </p>
                ) : (
                  <p className="text-sm text-gray-600">Wallet connection required</p>
                )}
              </div>
            </div>
            {!isConnected && (
              <button
                onClick={async () => {
                  try {
                    await connect();
                  } catch (error) {
                    console.error('Bağlantı hatası:', error);
                  }
                }}
                disabled={!isAvailable}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isAvailable ? 'Cüzdan Bağla' : 'Freighter Yükle'}
              </button>
            )}
            {isConnected && (
              <div className="text-sm text-green-600 font-medium">
Manual and Bot modes available              
</div>
            )}
          </div>
          {freighterError && (
            <div className="mt-3 p-2 bg-red-100 border border-red-200 rounded">
              <p className="text-sm text-red-700">❌ {freighterError}</p>
            </div>
          )}
        </Card>

        {/* Hata/Durum Göstergeleri */}
        {error && (
          <Card className="bg-red-50 border border-red-200">
            <div className="text-red-700"><strong>Hata:</strong> {error}</div>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sol Panel - Fiyat ve Durum */}
          <div className="space-y-4">
            <PriceDisplay
              price={displayPrice}
              lastUpdate={lastUpdate}
              isTracking={isTracking && !manualPriceMode}
            />

            {/* Manuel Fiyat Kontrolü */}
            <Card title="📊 Price Check">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="manualPriceMode"
                    checked={manualPriceMode}
                    onChange={(e) => setManualPriceMode(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <label htmlFor="manualPriceMode" className="text-sm font-medium">
                    Manual Price Mode
                  </label>
                </div>
                
                {manualPriceMode ? (
                  <div className="space-y-2">
                    <input
                      type="number"
                      step="0.0001"
                      placeholder="Enter price ($)"
                      value={manualPrice}
                      onChange={(e) => setManualPrice(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <div className="text-xs text-gray-500">
                      Manual mode: Real price tracking stopped
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-gray-500">
                    Automatic mode: Real-time price tracking
                  </div>
                )}
              </div>
            </Card>

            {/* Takip Kontrolleri */}
            <Card title="📊 Price Tracking">
              <div className="space-y-3">
                {!isTracking ? (
                  <Button 
                    onClick={() => startTracking(15000)} 
                    variant="success" 
                    className="w-full"
                    disabled={manualPriceMode}
                  >
                    ▶️ Start Tracking (5s)
                  </Button>
                ) : (
                  <Button onClick={stopTracking} variant="error" className="w-full">
                    ⏹️ Stop Tracking
                  </Button>
                )}
              </div>
            </Card>

            {/* Freighter Wallet */}
            <Card title="🌌 Freighter Wallet" className="bg-purple-50 border-purple-200">
              <div className="space-y-3">
                <div className="text-xs bg-white p-3 rounded border">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`w-3 h-3 rounded-full ${isAvailable ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <span className="font-medium">Freighter: {isAvailable ? '✅ Loaded' : '❌ Not Loaded'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <span className="font-medium">Connection: {isConnected ? '✅ Connected' : '❌ Not Connected'}</span>
                  </div>
                  {publicKey && (
                    <div className="text-xs text-gray-600 mt-2 p-2 bg-gray-50 rounded">
                      <div className="font-mono break-all">
                        {publicKey.slice(0, 10)}...{publicKey.slice(-10)}
                      </div>
                    </div>
                  )}
                  {freighterError && (
                    <div className="mt-2 p-2 bg-red-50 rounded border-l-4 border-red-400">
                      <div className="text-xs text-red-700">
                        <strong>Error:</strong> {freighterError}
                      </div>
                    </div>
                  )}
                </div>

                {!isConnected && (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Button onClick={connectWallet} disabled={!isAvailable} className="flex-1" variant="success">
                        🔗 Connect to Freighter
                      </Button>
                      {/* <Button 
                        onClick={checkFreighterConnection} 
                        size="sm"
                        title="Freighter durumunu kontrol et"
                        className="px-3"
                      >
                        🔍
                      </Button> */}
                    </div>
                    <div className="text-xs bg-yellow-100 p-2 rounded text-yellow-700">
                      ⚠️ <strong>localhost connection issue:</strong> If you are seeing a &quot;domain not connected&quot; error, try clicking the button again to reconnect.
                    </div>
                  </div>
                )}
                
                {isConnected && (
                  <div className="flex gap-2">
                    <div className="flex-1 text-sm text-green-600 font-medium flex items-center">
                      ✅ Wallet is connected and ready
                    </div>
                    {/* <Button 
                      onClick={checkFreighterConnection} 
                      size="sm"
                      title="Freighter bağlantısını yeniden kontrol et"
                      className="px-3"
                    >
                      🔍
                    </Button> */}
                  </div>
                )}
              </div>
            </Card>

            {/* Bot Wallet Sistemi */}
            <Card title="🤖 Bot Wallet (Fully Automatic)" className="bg-blue-50 border-blue-200">
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-3">
                  <label className="text-sm font-medium">Bot Mode:</label>
                  <select 
                    value={botMode} 
                    onChange={(e) => setBotMode(e.target.value as 'manual' | 'auto')}
                    className="px-2 py-1 border rounded text-sm"
                    disabled={!isConnected}
                  >
                    <option value="manual">👤 Manual (User Signature)</option>
                    <option value="auto">🤖 Automatic (Bot Signature)</option>
                  </select>
                </div>

                {botMode === 'auto' && (
                  <div className="space-y-3">
                    {!botWallet ? (
                      <div className="space-y-2">
                        <div className="text-sm bg-yellow-100 p-2 rounded text-yellow-800">
                          ⚠️ Create a bot wallet and transfer XLM
                        </div>
                        <Button 
                          onClick={createBotWallet} 
                          disabled={!isConnected} 
                          className="w-full" 
                          variant="success"
                        >
                          🤖 Create Bot Wallet
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="text-xs bg-blue-100 p-2 rounded border">
                          <div className="font-medium text-blue-800">🤖 Bot Wallet Active</div>
                          <div className="font-mono text-xs mt-1 break-all">
                            <strong>Public Key:</strong><br/>
                            {botWallet.publicKey}
                          </div>
                     
                          <div className="mt-2">
                            <span className="font-medium">Balance: </span>
                            <span className={`font-mono ${botBalance > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {botBalance.toFixed(2)} XLM
                            </span>
                          </div>
                        </div>
                        
                        {botBalance === 0 && (
                          <div className="text-xs bg-red-100 p-2 rounded text-red-700">
                            ❌ Transfer a minimum of 2 XLM to the bot wallet!
                          </div>
                        )}
                        
                        {botBalance > 0 && botBalance < 2 && (
                          <div className="text-xs bg-yellow-100 p-2 rounded text-yellow-700">
                            ⚠️ Low balance! Minimum 2 XLM is recommended (Current: {botBalance.toFixed(2)} XLM)
                          </div>
                        )}
                        
                        {botBalance >= 2 && (
                          <div className="text-xs bg-green-100 p-2 rounded text-green-700">
                            ✅ Bot wallet ready! You can proceed with transactions.
                          </div>
                        )}
                        
                    
                        
                        <div className="flex gap-2">
                          <Button 
                            onClick={() => checkBotBalance(botWallet.publicKey)} 
                            size="sm" 
                            className="flex-1"
                          >
                            🔄 Balance
                          </Button>
                       
                        </div>
                        
                        <div className="flex gap-2">
                          <Button 
                            onClick={() => {
                              navigator.clipboard.writeText(botWallet.publicKey);
                              alert('Public Key copied!');
                            }} 
                            size="sm" 
                            className="flex-1"
                          >
                            Copy Public Key
                          </Button>
                        
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {botMode === 'manual' && (
                  <div className="text-xs bg-gray-100 p-2 rounded text-gray-600">
                    👤 Manual mode requires user signature for each transaction
                  </div>
                )}
              </div>
            </Card>

            {/* Telegram Kurulum */}
            <Card title="📱 Telegram">
              <div className="space-y-3">
                <input
                  type="text"
                  value={telegramChatId}
                  onChange={(e) => {
                    setTelegramChatId(e.target.value);
                    localStorage.setItem('telegram_chat_id', e.target.value);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  placeholder="Chat ID (@userinfobot)"
                />
                <div className="text-xs text-gray-500">
                  Get Chat ID from @userinfobot
                </div>
              </div>
            </Card>

            {/* Custom Wallet Address */}
            <Card title="💰 Earnings Wallet" className="bg-orange-50 border-orange-200">
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1 text-orange-800">
                    Wallet Address to Send Earnings:
                  </label>
                  <input
                    type="text"
                    value={customWalletAddress}
                    onChange={(e) => {
                      setCustomWalletAddress(e.target.value);
                      localStorage.setItem('custom_wallet_address', e.target.value);
                    }}
                    className="w-full px-3 py-2 border border-orange-300 rounded text-sm font-mono"
                    placeholder="GXXX...XXXX (Stellar Address)" disabled={true}
                  />
                </div>
                <div className="text-xs text-orange-700 bg-orange-100 p-2 rounded">
                  <div className="font-semibold mb-1">💸 Important Information:</div>
                  <div>The bot will send all earnings to this address in automatic mode.</div>
                  <div>This address may be different from your Freighter wallet address.</div>
                </div>
                {customWalletAddress && (
                  <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                    <div className="font-semibold">Current Earnings Address:</div>
                    <div className="font-mono break-all mt-1">
                      {customWalletAddress}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Sağ Panel - 🎯 Fiyat Bazlı Otomatik İşlem (Ana Odak) */}
          <div className="lg:col-span-2">
            <Card title="🎯 Price-Based Automatic Trading" className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-300">
              {isConnected ? (
                <div className="space-y-6">
                  {/* Otomatik İşlem Toggle */}
                  <div className="flex items-center justify-between p-4 bg-white rounded-lg border-2 border-gray-200">
                    <div>
                      <h3 className="font-bold text-lg">🤖 Automatic Trading System</h3>
                      <p className="text-sm text-gray-600">Automatic buying and selling at prices you set (Pre-Authorization)</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {hasAutoTradeError && (
                        <Button
                          onClick={() => {
                            setHasAutoTradeError(false);
                            setAutoTradeStatus('✅ System reset, ready.');
                            setIsAutoTradingEnabled(true);
                            setBuyTargetPrice('');
                            setSellTargetPrice('');
                            setAutoBuyAmount('');
                            setAutoSellAmount('');
                          }}
                          size="sm"
                          variant="success"
                        >
                          🔄 Reset
                        </Button>
                      )}
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isAutoTradingEnabled}
                          onChange={(e) => {
                            setIsAutoTradingEnabled(e.target.checked);
                            if (e.target.checked && hasAutoTradeError) {
                              setHasAutoTradeError(false);
                              setAutoTradeStatus(null);
                            }
                          }}
                          className="rounded"
                          disabled={isTrading}
                        />
                        <span className={`font-medium ${isAutoTradingEnabled ? 'text-green-600' : 'text-gray-500'}`}>
                          {isAutoTradingEnabled ? '🟢 ACTIVE' : '⚪ INACTIVE'}
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Trading Pair Seçimi */}
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <h4 className="font-semibold mb-3">🔄 Trading Pair</h4>
                    <div className="grid grid-cols-3 gap-2 items-center">
                      <select
                        value={autoTradeAssetIn}
                        onChange={(e) => handleAutoTradeAssetInChange(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded"
                        disabled={isTrading}
                      >
                        {ASSET_OPTIONS.filter(asset => asset.value !== autoTradeAssetOut).map((asset) => (
                          <option key={asset.value} value={asset.value}>
                            {asset.symbol}
                          </option>
                        ))}
                      </select>
                      <div className="text-center">
                        <button
                          onClick={() => {
                            const temp = autoTradeAssetIn;
                            setAutoTradeAssetIn(autoTradeAssetOut);
                            setAutoTradeAssetOut(temp);
                          }}
                          className="bg-blue-100 hover:bg-blue-200 p-2 rounded-full"
                          disabled={isTrading}
                        >
                          ↔️
                        </button>
                      </div>
                      <select
                        value={autoTradeAssetOut}
                        onChange={(e) => handleAutoTradeAssetOutChange(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded"
                        disabled={isTrading}
                      >
                        {ASSET_OPTIONS.filter(asset => asset.value !== autoTradeAssetIn).map((asset) => (
                          <option key={asset.value} value={asset.value}>
                            {asset.symbol}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="text-center mt-2 text-sm text-gray-600">
                      {ASSET_OPTIONS.find(a => a.value === autoTradeAssetIn)?.symbol}/{ASSET_OPTIONS.find(a => a.value === autoTradeAssetOut)?.symbol}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Alım Ayarları */}
                    <div className="p-4 bg-green-50 rounded-lg border-2 border-green-200">
                      <h4 className="font-semibold text-green-800 mb-3">💰 Automatic Purchase</h4>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium mb-1">Target Price ($)</label>
                          <input
                            type="number"
                            step="0.0001"
                            placeholder="0.1200"
                            value={buyTargetPrice}
                            onChange={(e) => setBuyTargetPrice(e.target.value)}
                            className="w-full px-3 py-2 border border-green-300 rounded"
                            disabled={isTrading || !isAutoTradingEnabled}
                          />
                          <p className="text-xs text-green-600 mt-1">
                            Price ≤ Buy at this value
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Amount ({ASSET_OPTIONS.find(a => a.value === autoTradeAssetIn)?.symbol} &rarr; {ASSET_OPTIONS.find(a => a.value === autoTradeAssetOut)?.symbol})
                          </label>
                          <input
                            type="number"
                            min="1"
                            step="1"
                            placeholder="10"
                            value={autoBuyAmount}
                            onChange={(e) => setAutoBuyAmount(e.target.value)}
                            className="w-full px-3 py-2 border border-green-300 rounded"
                            disabled={isTrading || !isAutoTradingEnabled}
                          />
                        </div>

                        {/* Token Değişim Maliyeti - Buy Quote */}
                        {autoBuyAmount && (
                          <div className="space-y-2">
                            {quoteLoading ? (
                              <div className="bg-gray-100 p-3 rounded-lg border animate-pulse">
                                <div className="flex items-center text-sm text-gray-600">
                                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                 Calculating token exchange cost...
                                </div>
                              </div>
                            ) : buyQuote ? (
                              <div className="bg-green-100 p-3 rounded-lg border border-green-200">
                                <div className="text-sm font-medium text-green-800 mb-2">💰 Token Exchange Cost</div>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <div>
                                    <span className="text-gray-600">You will spend:</span>
                                    <div className="font-mono font-bold text-green-700">
                                      {formatAmount(buyQuote.amountIn)} {getAssetSymbol(buyQuote.assetIn)}
                                    </div>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">You will receive (estimated):</span>
                                    <div className="font-mono font-bold text-green-700">
                                      {formatAmount(buyQuote.amountOut)} {getAssetSymbol(buyQuote.assetOut)}
                                    </div>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">Fiyat Etkisi:</span>
                                    <div className={`font-bold ${parseFloat(buyQuote.priceImpactPct) > 5 ? 'text-red-600' : 'text-green-600'}`}>
                                      {formatPercentage(buyQuote.priceImpactPct)}
                                    </div>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">Platform:</span>
                                    <div className="font-bold text-green-700">{buyQuote.platform}</div>
                                  </div>
                                </div>
                                {buyQuote.platformFee && (
                                  <div className="mt-2 pt-2 border-t border-green-200">
                                    <div className="text-xs text-gray-600">Platform Fee:</div>
                                    <div className="font-mono text-xs font-bold text-green-700">
                                      {formatAmount(buyQuote.platformFee.feeAmount)} ({buyQuote.platformFee.feeBps} bps)
                                    </div>
                                  </div>
                                )}
                              </div>
                            ) : autoBuyAmount && (
                              <div className="bg-yellow-100 p-3 rounded-lg border border-yellow-200">
                                <div className="text-sm text-yellow-800">
                                  ⚠️ Token exchange cost could not be calculated
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        {buyTargetPrice && (
                          <div className={`text-sm p-2 rounded ${displayPrice <= parseFloat(buyTargetPrice) ? 'bg-green-200 text-green-800 font-bold' : 'bg-gray-100 text-gray-600'}`}>
                            {displayPrice <= parseFloat(buyTargetPrice) ? '🎯 TARGET REACHED!' : '⏳ Awaiting target...'}
                          </div>
                        )}
                        
                        {/* Pre-Authorization Button */}
                        <div className="space-y-2">
                          {!preAuthBuyOrder ? (
                          
                            <div className="space-y-2">
                              {/* Manuel Mod Butonu */}
                           {botMode === 'manual' && (
                              <Button
                                onClick={() => createPreAuthBuyOrder(false)}
                                disabled={!buyTargetPrice || !autoBuyAmount || !isConnected}
                                size="md"
                                variant="mrt"
                                className="w-full"
                              >
                                👤 Manual Buy Order
                              </Button>
                           )}

                              {/* Bot Mod Butonu */}
                              {botMode === 'auto' && botWallet ? (
                                <div className="space-y-2">
                                  <Button
                                    onClick={() => createPreAuthBuyOrder(true)}
                                    disabled={!buyTargetPrice || !autoBuyAmount || !isConnected}
                                    size="md"
                                    variant="mrt"
                                    className="w-full"
                                  >
                                    🤖 Bot Buy Order (XLM Transfer)
                                  </Button>
                                  {!isConnected && (
                                    <div className="text-xs bg-red-100 p-2 rounded text-red-700 border">
                                      ⚠️ Freighter connection required! It will connect automatically when you press the button.
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="text-xs bg-yellow-100 p-2 rounded text-yellow-700 border">
                                  ⚠️ For bot mode, select &quot;🤖 Automatic&quot; mode and create a bot wallet.
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <div className="text-xs bg-green-100 text-green-700 p-2 rounded border">
                                ✅ Buy order ready
                                <div className="text-xs mt-1">
                                  ⏰ Time left: {Math.round((preAuthBuyOrder.expiry.getTime() - Date.now()) / 60000)} min
                                </div>
                              </div>
                              <div className="flex gap-2">
                                {preAuthBuyOrder.isBot && preAuthBuyOrder.requiredXLM ? (
                                  <Button
                                    onClick={async () => {
                                      try {
                                        // XLM iade et
                                        setAutoTradeStatus('💸 XLM is being refunded...');
                                        const refundResult = await refundXLMFromBot(preAuthBuyOrder.requiredXLM!);
                                        
                                        if (refundResult.success) {
                                          setAutoTradeStatus(`✅ ${preAuthBuyOrder.requiredXLM!.toFixed(2)} XLM has been refunded!`);
                                        }
                                        
                                        // Emri temizle
                                        setPreAuthBuyOrder(null);
                                        localStorage.removeItem(`preauth_buy_${publicKey}`);
                                        
                                        // Telegram bildirimi
                                        if (telegramBot && telegramChatId) {
                                          const message = `🤖 BOT BUY ORDER CANCELLED!
❌ Buy order canceled
💸 ${preAuthBuyOrder.requiredXLM!.toFixed(2)} XLM has been refunded
⏰ ${new Date().toLocaleString('tr-TR')}`;
                                          
                                          await telegramBot.sendMessage(telegramChatId, message);
                                        }
                                        
                                      } catch (error) {
                                        setAutoTradeStatus(`❌ Cancellation error: ${error}`);
                                      }
                                    }}
                                    size="sm"
                                    variant="error"
                                    className="flex-1"
                                    disabled={isTrading}
                                  >
                                    ❌ Cancellation + Refund
                                  </Button>
                                ) : null}
                                <Button
                                  onClick={() => {
                                    setPreAuthBuyOrder(null);
                                    localStorage.removeItem(`preauth_buy_${publicKey}`);
                                    if (preAuthBuyOrder.isBot && preAuthBuyOrder.requiredXLM) {
                                      setAutoTradeStatus('⚠️ You have canceled the order. Use the "❌ Cancel + Refund" button to refund XLM.');
                                    }
                                  }}
                                  size="sm"
                                  variant="error"
                                  className="flex-1"
                                >
                                  🗑️ {preAuthBuyOrder.isBot ? 'Delete Only' : 'Cancel'}
                                </Button>
                              </div>
                            </div>
                          )}
                          
                          {preAuthBuyOrder && (
                            <div className="text-xs p-2 rounded bg-green-50 text-green-700">
                              <div className="whitespace-pre-line">{preAuthBuyOrder.status}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Satım Ayarları */}
                    <div className="p-4 bg-red-50 rounded-lg border-2 border-red-200">
                      <h4 className="font-semibold text-red-800 mb-3">💸 Automatic Sales</h4>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium mb-1">Target Price ($)</label>
                          <input
                            type="number"
                            step="0.0001"
                            placeholder="0.1400"
                            value={sellTargetPrice}
                            onChange={(e) => setSellTargetPrice(e.target.value)}
                            className="w-full px-3 py-2 border border-red-300 rounded"
                            disabled={isTrading || !isAutoTradingEnabled}
                          />
                          <p className="text-xs text-red-600 mt-1">
                            Price ≥ Sell at this value
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Amount ( {ASSET_OPTIONS.find(a => a.value === autoTradeAssetOut)?.symbol} &rarr; {ASSET_OPTIONS.find(a => a.value === autoTradeAssetIn)?.symbol})
                          </label>
                          <input
                            type="number"
                            min="1"
                            step="1"
                            placeholder="10"
                            value={autoSellAmount}
                            onChange={(e) => setAutoSellAmount(e.target.value)}
                            className="w-full px-3 py-2 border border-red-300 rounded"
                            disabled={isTrading || !isAutoTradingEnabled}
                          />
                        </div>

                        {/* Token Değişim Maliyeti - Sell Quote */}
                        {autoSellAmount && (
                          <div className="space-y-2">
                            {quoteLoading ? (
                              <div className="bg-gray-100 p-3 rounded-lg border animate-pulse">
                                <div className="flex items-center text-sm text-gray-600">
                                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  Calculating token exchange cost...
                                </div>
                              </div>
                            ) : sellQuote ? (
                              <div className="bg-red-100 p-3 rounded-lg border border-red-200">
                                <div className="text-sm font-medium text-red-800 mb-2">💸 Token Exchange Cost</div>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <div>
                                    <span className="text-gray-600">You will spend:</span>
                                    <div className="font-mono font-bold text-red-700">
                                      {formatAmount(sellQuote.amountIn)} {getAssetSymbol(sellQuote.assetIn)}
                                    </div>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">You will receive (estimated):</span>
                                    <div className="font-mono font-bold text-red-700">
                                      {formatAmount(sellQuote.amountOut)} {getAssetSymbol(sellQuote.assetOut)}
                                    </div>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">Price Impact:</span>
                                    <div className={`font-bold ${parseFloat(sellQuote.priceImpactPct) > 5 ? 'text-red-600' : 'text-green-600'}`}>
                                      {formatPercentage(sellQuote.priceImpactPct)}
                                    </div>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">Platform:</span>
                                    <div className="font-bold text-red-700">{sellQuote.platform}</div>
                                  </div>
                                </div>
                                {sellQuote.platformFee && (
                                  <div className="mt-2 pt-2 border-t border-red-200">
                                    <div className="text-xs text-gray-600">Platform Fee:</div>
                                    <div className="font-mono text-xs font-bold text-red-700">
                                      {formatAmount(sellQuote.platformFee.feeAmount)} ({sellQuote.platformFee.feeBps} bps)
                                    </div>
                                  </div>
                                )}
                              </div>
                            ) : autoSellAmount && (
                              <div className="bg-yellow-100 p-3 rounded-lg border border-yellow-200">
                                <div className="text-sm text-yellow-800">
                                  ⚠️ Token exchange cost could not be calculated
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        {sellTargetPrice && (
                          <div className={`text-sm p-2 rounded ${displayPrice >= parseFloat(sellTargetPrice) ? 'bg-red-200 text-red-800 font-bold' : 'bg-gray-100 text-gray-600'}`}>
                            {displayPrice >= parseFloat(sellTargetPrice) ? '🎯 TARGET ACHIEVED!' : '⏳ Waiting for target...'}
                          </div>
                        )}
                        
                        {/* Pre-Authorization Buttons */}
                        <div className="space-y-2">
                          {!preAuthSellOrder ? (
                            <div className="space-y-2">
                              {/* Manuel Mod Butonu */}
                              {/* <Button
                                onClick={() => createPreAuthSellOrder(false)}
                                disabled={!sellTargetPrice || !autoSellAmount || !isConnected}
                                size="sm"
                                variant="secondary"
                                className="w-full"
                              > */}
                                {botMode === 'manual' && ( <Button
                                  onClick={() => createPreAuthSellOrder(false)}
                                  disabled={!sellTargetPrice || !autoSellAmount || !isConnected}
                                  size="md"
                                  variant="mrt2" className="w-full"
                                >
                                  👤 Manual Sell Order
                                </Button>
                              )}
                           
                              
                              {/* Bot Mod Butonu */}
                              {botMode === 'auto' && botWallet ? (
                                <Button
                                  onClick={() => createPreAuthSellOrder(true)}
                                  disabled={!sellTargetPrice || !autoSellAmount || !isConnected}
                                  size="md"
                                  variant="mrt2"
                                  className="w-full"
                                >
                                  🤖 Bot Sell Order
                                </Button>
                              ) : (
                                <div className="text-xs bg-yellow-100 p-2 rounded text-yellow-700 border">
                                  ⚠️ To use bot mode, select &quot;🤖 Automatic &quot; mode and create a bot wallet.
                                </div>
                              )}


                            </div>
                          ) : (
                            <div className="space-y-2">
                              <div className="text-xs bg-red-100 text-red-700 p-2 rounded border">
                                ✅ Sell order ready
                                <div className="text-xs mt-1">
                                  ⏰ Süre: {Math.round((preAuthSellOrder.expiry.getTime() - Date.now()) / 60000)} dk kaldı
                                </div>
                              </div>
                              <Button
                                onClick={() => {
                                  setPreAuthSellOrder(null);
                                  localStorage.removeItem(`preauth_sell_${publicKey}`);
                                }}
                                size="sm"
                                variant="error"
                                className="w-full"
                              >
                                ❌ Cancel Order
                              </Button>
                            </div>
                          )}
                          
                          {preAuthSellOrder && (
                            <div className="text-xs p-2 rounded bg-red-50 text-red-700">
                              <div className="whitespace-pre-line">{preAuthSellOrder.status}</div>
                            </div>
                          )}


                        </div>
                      </div>
                    </div>

                    {/* 🤖 Grid Trading Bot */}
                    <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border-2 border-purple-200">
                      <h4 className="font-semibold text-purple-800 mb-3">🤖 Grid Trading Bot (Buy + Sell)</h4>
                      <div className="text-xs text-purple-600 mb-3 p-2 bg-purple-50 rounded border">
                        🔄 <strong>Order of Operations:</strong> 1️⃣ First BUY (low price, held in bot) → 2️⃣ Then SELL (high price, profit to main wallet)
                      </div>
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-sm font-medium mb-1">Buy Price ($)</label>
                            <input
                              type="number"
                              step="0.0001"
                              placeholder="0.1300"
                              value={gridBuyPrice}
                              onChange={(e) => setGridBuyPrice(e.target.value)}
                              className="w-full px-2 py-2 border border-purple-300 rounded text-sm"
                              disabled={isTrading || (gridTradingBot?.isActive || false)}
                            />
                            <p className="text-xs text-purple-600 mt-1">
                              Price ≤ Buy at this value (equal and below)
                            </p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Sell Price ($)</label>
                            <input
                              type="number"
                              step="0.0001"
                              placeholder="0.1400"
                              value={gridSellPrice}
                              onChange={(e) => setGridSellPrice(e.target.value)}
                              className="w-full px-2 py-2 border border-purple-300 rounded text-sm"
                              disabled={isTrading || (gridTradingBot?.isActive || false)}
                            />
                            <p className="text-xs text-purple-600 mt-1">
                              Price ≥ Sell at this value (equal and above)
                            </p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium mb-1">Amount</label>
                            <input
                              type="number"
                              step="0.01"
                              placeholder="100"
                              value={gridBuyAmount}
                              onChange={(e) => setGridBuyAmount(e.target.value)}
                              className="w-full px-3 py-2 border border-purple-300 rounded"
                              disabled={isTrading || (gridTradingBot?.isActive || false)}
                            />
                            <p className="text-xs text-purple-600 mt-1">
                               {ASSET_OPTIONS.find(a => a.value === autoTradeAssetIn)?.symbol}&rarr;{ASSET_OPTIONS.find(a => a.value === autoTradeAssetOut)?.symbol}
                            </p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Amount</label>
                            <input
                              type="number"
                              step="0.01"
                              placeholder="50"
                              value={gridSellAmount}
                              onChange={(e) => setGridSellAmount(e.target.value)}
                              className="w-full px-3 py-2 border border-purple-300 rounded"
                              disabled={isTrading || (gridTradingBot?.isActive || false)}
                            />
                            <p className="text-xs text-purple-600 mt-1">
                               {ASSET_OPTIONS.find(a => a.value === autoTradeAssetOut)?.symbol}&rarr;{ASSET_OPTIONS.find(a => a.value === autoTradeAssetIn)?.symbol}
                            </p>
                          </div>
                        </div>

                        {/* Token Değişim Maliyeti - Grid Trading Bot */}
                        {(gridBuyAmount || gridSellAmount) && (
                          <div className="space-y-3">
                            {gridQuoteLoading ? (
                              <div className="bg-gray-100 p-3 rounded-lg border animate-pulse">
                                <div className="flex items-center text-sm text-gray-600">
                                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  Calculating token change costs...
                                </div>
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {/* Alım Quote */}
                                {gridBuyQuote ? (
                                  <div className="bg-green-100 p-3 rounded-lg border border-green-200">
                                    <div className="text-sm font-medium text-green-800 mb-2">💰 BUY Quote</div>
                                    <div className="space-y-2 text-xs">
                                      <div>
                                        <span className="text-gray-600">You will spend:</span>
                                        <div className="font-mono font-bold text-green-700">
                                          {formatAmount(gridBuyQuote.amountIn)} {getAssetSymbol(gridBuyQuote.assetIn)}
                                        </div>
                                      </div>
                                      <div>
                                        <span className="text-gray-600">You will receive (estimated):</span>
                                        <div className="font-mono font-bold text-green-700">
                                          {formatAmount(gridBuyQuote.amountOut)} {getAssetSymbol(gridBuyQuote.assetOut)}
                                        </div>
                                      </div>
                                      <div>
                                        <span className="text-gray-600">Price Impact:</span>
                                        <div className={`font-bold ${parseFloat(gridBuyQuote.priceImpactPct) > 5 ? 'text-red-600' : 'text-green-600'}`}>
                                          {formatPercentage(gridBuyQuote.priceImpactPct)}
                                        </div>
                                      </div>
                                      {gridBuyQuote.platformFee && (
                                        <div>
                                          <span className="text-gray-600">Platform Fee:</span>
                                          <div className="font-mono font-bold text-green-700">
                                            {formatAmount(gridBuyQuote.platformFee.feeAmount)} ({gridBuyQuote.platformFee.feeBps} bps)
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ) : gridBuyAmount && (
                                  <div className="bg-yellow-100 p-3 rounded-lg border border-yellow-200">
                                    <div className="text-sm text-yellow-800">
                                      ⚠️ PURCHASE cost could not be calculated
                                    </div>
                                  </div>
                                )}

                                {/* Satım Quote */}
                                {gridSellQuote ? (
                                  <div className="bg-red-100 p-3 rounded-lg border border-red-200">
                                    <div className="text-sm font-medium text-red-800 mb-2">💸 SELL Quote</div>
                                    <div className="space-y-2 text-xs">
                                      <div>
                                        <span className="text-gray-600">You will spend:
                                      </span>
                                        <div className="font-mono font-bold text-red-700">
                                          {formatAmount(gridSellQuote.amountIn)} {getAssetSymbol(gridSellQuote.assetIn)}
                                        </div>
                                      </div>
                                      <div>
                                        <span className="text-gray-600">You will receive:</span>
                                        <div className="font-mono font-bold text-red-700">
                                          {formatAmount(gridSellQuote.amountOut)} {getAssetSymbol(gridSellQuote.assetOut)}
                                        </div>
                                      </div>
                                      <div>
                                        <span className="text-gray-600">Price Impact:</span>
                                        <div className={`font-bold ${parseFloat(gridSellQuote.priceImpactPct) > 5 ? 'text-red-600' : 'text-green-600'}`}>
                                          {formatPercentage(gridSellQuote.priceImpactPct)}
                                        </div>
                                      </div>
                                      {gridSellQuote.platformFee && (
                                        <div>
                                          <span className="text-gray-600">Platform Fee:</span>
                                          <div className="font-mono font-bold text-red-700">
                                            {formatAmount(gridSellQuote.platformFee.feeAmount)} ({gridSellQuote.platformFee.feeBps} bps)
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ) : gridSellAmount && (
                                  <div className="bg-yellow-100 p-3 rounded-lg border border-yellow-200">
                                    <div className="text-sm text-yellow-800">
                                      ⚠️ SELL cost could not be calculated
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Net Kar Hesaplama */}
                            {gridBuyQuote && gridSellQuote && (
                              <div className="bg-blue-100 p-3 rounded-lg border border-blue-200">
                                <div className="text-sm font-medium text-blue-800 mb-2">💎 Net Profit Forecast</div>
                                <div className="text-xs space-y-1">
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Purchase Cost:</span>
                                    <span className="font-mono font-bold text-blue-700">
                                      {formatAmount(gridBuyQuote.amountIn)} {getAssetSymbol(gridBuyQuote.assetIn)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Sell Revenue:</span>
                                    <span className="font-mono font-bold text-blue-700">
                                      {formatAmount(gridSellQuote.amountOut)} {getAssetSymbol(gridSellQuote.assetOut)}
                                    </span>
                                  </div>
                                  <div className="border-t border-blue-200 pt-1 mt-2">
                                    <div className="flex justify-between">
                                      <span className="text-gray-600 font-medium">Net Profit (estimated):</span>
                                      <span className="font-mono font-bold text-blue-800">
                                        {(parseFloat(formatAmount(gridSellQuote.amountOut)) - parseFloat(formatAmount(gridBuyQuote.amountIn))).toFixed(7)} {getAssetSymbol(gridSellQuote.assetOut)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* {gridBuyPrice && gridSellPrice && (
                          <div className="p-2 bg-purple-100 rounded text-xs">
                            <div className="text-purple-700">
                              📈 Expected Profit Rate: {gridBuyPrice && gridSellPrice ? 
                                ((parseFloat(gridSellPrice) - parseFloat(gridBuyPrice)) / parseFloat(gridBuyPrice) * 100).toFixed(2) : '0'}%
                            </div>
                            <div className="text-purple-600 mt-1">
                              🔄 Order of Operations: ${gridBuyPrice}&apos; purchase → ${gridSellPrice}&apos; sell
                            </div>
                          </div>
                        )} */}

                        <div className="grid gap-2">
                          {botMode === 'manual' ? (
                            <Button
                              onClick={() => createGridTradingBot(false)}
                              disabled={isTrading || !gridBuyPrice || !gridSellPrice || !gridBuyAmount || !gridSellAmount || 
                                       (gridTradingBot?.isActive || false)}
                              variant="mrt"
                              size="md"
                              className="w-full"
                            >
                              👤 Manual Grid Bot
                            </Button>
                          ) : (
                            <Button
                              onClick={() => createGridTradingBot(true)}
                              disabled={isTrading || !gridBuyPrice || !gridSellPrice || !gridBuyAmount || !gridSellAmount || 
                                       !botWallet || (gridTradingBot?.isActive || false)}
                              variant="mrt3"
                              size="md"
                              className="w-full"
                            >
                              🤖 Automatic Grid Bot
                            </Button>
                          )}
                          
                          {gridTradingBot?.isActive && (
                            <Button
                              onClick={() => {
                                setGridTradingBot(null);
                                localStorage.removeItem(`grid_bot_${publicKey}`);
                                setAutoTradeStatus('❌ Grid trading bot durduruldu.');
                              }}
                              variant="error"
                              size="sm"
                              className="w-full"
                            >
                              ❌ Stop Bot
                            </Button>
                          )}
                        </div>
                          
                        {gridTradingBot && (
                          <div className="text-xs p-2 rounded bg-purple-50 text-purple-700">
                            <div className="whitespace-pre-line">{gridTradingBot.status}</div>
                            <div className="mt-2 text-purple-600">
                              🔄 Processing Stage: {
                                gridTradingBot.currentStep === 'waiting_buy' ? '1️⃣ Waiting for Purchase (Step One)' : 
                                gridTradingBot.currentStep === 'waiting_sell' ? '2️⃣ Waiting for Sale (Purchase Completed)' : 
                                '✅ Cycle Completed'
                              }
                            </div>
                            {gridTradingBot.currentStep === 'waiting_buy' && (
                              <div className="text-purple-600 text-xs mt-1">
                                📊 Target: Buy when the price drops to ${gridTradingBot.buyPrice} or below
                              </div>
                            )}
                            {gridTradingBot.currentStep === 'waiting_sell' && (
                              <div className="text-purple-600 text-xs mt-1">
                                📊 Target: Sell when the price rises to ${gridTradingBot.sellPrice} or above
                              </div>
                            )}
                            {gridTradingBot.expiry && (
                              <div className="text-purple-500 text-xs mt-1">
                                ⏰ Remaining Time: {Math.round((gridTradingBot.expiry.getTime() - Date.now()) / (1000 * 60))} minutes
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div> 
                  </div>

                  {/* Hızlı Test Butonları */}
                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      onClick={() => {
                        const testPrice = (currentPrice * 0.995).toFixed(4);
                        setBuyTargetPrice(testPrice);
                        setAutoBuyAmount('1');
                        setIsAutoTradingEnabled(true);
                      }}
                      size="sm"
                      variant="success"
                      disabled={currentPrice === 0}
                    >
                      🧪 Test Buy (-0.5%)
                    </Button>
                    <Button
                      onClick={() => {
                        const testPrice = (currentPrice * 1.005).toFixed(4);
                        setSellTargetPrice(testPrice);
                        setAutoSellAmount('1');
                        setIsAutoTradingEnabled(true);
                      }}
                      size="sm"
                      variant="error"
                      disabled={currentPrice === 0}
                    >
                      🧪 Test Sell (+0.5%)
                    </Button>
                  </div>

                  {/* Durum Paneli */}
                  <div className="p-4 bg-white rounded-lg border-2 border-gray-200">
                    <h4 className="font-semibold mb-3">📊 System Status</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-gray-600">Current Price:</div>
                        <div className="font-mono text-lg font-bold">${displayPrice.toFixed(4)}</div>
                      </div>
                      <div>
                        <div className="text-gray-600">System Status:</div>
                        <div className={`font-medium ${
                          hasAutoTradeError ? 'text-red-600' :
                          isTrading ? 'text-orange-600' :
                          isAutoTradingEnabled ? 'text-green-600' : 'text-gray-600'
                        }`}>
                          {hasAutoTradeError ? '🚨 Error' : 
                           isTrading ? '⏳ Processing' :
                           isAutoTradingEnabled ? '🟢 Active' : '⚪ Inactive'}
                        </div>
                      </div>
                    </div>
                    
                    {/* Pre-Auth Status */}
                    <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <div className="text-gray-600">Pre-Auth Buy:</div>
                        <div className={`font-medium ${preAuthBuyOrder ? 'text-green-600' : 'text-gray-400'}`}>
                          {preAuthBuyOrder ? '✅ Ready' : '⚪ None'}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-600">Pre-Auth Sell:</div>
                        <div className={`font-medium ${preAuthSellOrder ? 'text-red-600' : 'text-gray-400'}`}>
                          {preAuthSellOrder ? '✅ Ready' : '⚪ None'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Durum Mesajı */}
                  {autoTradeStatus && (
                    <div className={`text-sm p-4 rounded-lg border-2 ${
                      autoTradeStatus.startsWith('✅') ? 'bg-green-50 border-green-200 text-green-700' :
                      autoTradeStatus.startsWith('❌') ? 'bg-red-50 border-red-200 text-red-700' :
                      autoTradeStatus.startsWith('🎯') ? 'bg-blue-50 border-blue-200 text-blue-700' :
                      'bg-yellow-50 border-yellow-200 text-yellow-700'
                    }`}>
                      <div className="whitespace-pre-line font-medium">{autoTradeStatus}</div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-500 mb-4">🤖 Freighter wallet connection required for bot trading</div>
                  <Button onClick={connectWallet} disabled={!isAvailable} variant="success" className="mb-3">
                    🔗 Connect to Freighter
                  </Button>
                  <div className="text-xs text-yellow-700 bg-yellow-100 p-3 rounded border mx-4">
                    ⚠️ <strong>localhost connection problem?</strong><br/>
                    If you are receiving a &quot;domain not connected &quot; error, please click the button above.
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>

        {/* Bot Trading Açıklaması */}
        <Card title="📘 How Does the Dual Mode System Work?" className="bg-green-50 border-green-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <h4 className="font-semibold mb-3 text-green-800">👤 Manual Mode</h4>
              <ul className="space-y-2 text-green-700">
                <li>• <strong>1. Pre-Auth:</strong> &quot;👤 Manual Buy Order&quot; button</li>
                <li>• <strong>2. Follow-up:</strong> Bot price tracking is done</li>
                <li>• <strong>3. Triggering:</strong> Alert + popup at target price</li>
                <li>• <strong>4. Signature:</strong> Freighter opens, you sign the transaction</li>
                <li>• <strong>5. Money:</strong> Exits from your main wallet</li>
                <li>• <strong>6. Cancel:</strong> Cancel with &quot;🗑️ Cancel&quot;</li>
              </ul>
              <div className="mt-3 p-2 bg-blue-100 rounded text-blue-700">
                💡 <strong>Manual mode:</strong> If you are not at your PC, no transaction will be made.
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-green-800">🤖 Bot Mode (Automatic Transfer)</h4>
              <ul className="space-y-2 text-green-700">
                <li>• <strong>1. Preparation:</strong> Select bot mode and create a bot wallet</li>
                <li>• <strong>2. Transfer:</strong> Press the &quot;🤖 Bot Buy Order&quot; button</li>
                <li>• <strong>3. Freighter:</strong> Transfers the required XLM to the bot wallet</li>
                <li>• <strong>4. Follow-up:</strong> Bot price tracking is done</li>
                <li>• <strong>5. Automatic:</strong> Bot automatically trades at the target price</li>
                <li>• <strong>6. Cancel:</strong> Retrieve XLM with &quot;❌ Cancel + Refund&quot;</li>
              </ul>
              <div className="mt-3 p-2 bg-orange-100 rounded text-orange-700">
                🚀 <strong>Bot mode:</strong> Works even when you are not at your PC!
              </div>
            </div>
          </div>
          
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 bg-blue-50 rounded border-l-4 border-blue-400">
              <h5 className="font-semibold text-blue-800 mb-2">When to Use Manual Mode?</h5>
              <ul className="text-blue-700 text-sm space-y-1">
                <li>• You will be at your PC</li>
                <li>• You want to control the transaction yourself</li>
                <li>• You do not want to pay the fee in advance</li>
              </ul>
            </div>
            <div className="p-3 bg-orange-50 rounded border-l-4 border-orange-400">
              <h5 className="font-semibold text-orange-800 mb-2">When to Use Bot Mode?</h5>
              <ul className="text-orange-700 text-sm space-y-1">
                <li>• You will not be at your PC</li>
                <li>• You want full automation</li>
                <li>• You can pay the fee in advance</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Önemli Notlar */}
        {/* <Card title="⚠️ İkili Mod Sistemi Notları" className="bg-yellow-50 border-yellow-200">
          <div className="text-sm space-y-2 text-yellow-800">
            <p><strong>🎯 İki Ayrı Mod:</strong></p>
            <p><strong>👤 Manuel Mod:</strong> Ana cüzdanınızdan para çıkar, her işlemde imza gerekir, PC başında olmanız gerekli.</p>
            <p><strong>🤖 Bot Mod:</strong> Alım onayında Freighter ile XLM otomatik transfer, bot sizin adınıza işlem yapar, PC başında olmanız gerekmez.</p>
            <p><strong>� Freighter Transfer:</strong> &quot;Alım Emri Onayı (Freighter Transfer)&quot; butonuna basınca Freighter açılır ve otomatik transfer.</p>
            <p><strong>💸 Token Transfer:</strong> İşlem sonrası aldığınız token&apos;lar (USDC, XSTAR vs.) belirttiğiniz adrese otomatik gönderilir.</p>
            <p><strong>🎯 Akıllı Transfer:</strong> Bot tam olarak aldığınız asset türünü (USDC, XSTAR, vs.) size gönderir.</p>
            <p><strong>❌ İptal ve İade:</strong> Emri iptal ederseniz &quot;❌ İptal + İade&quot; ile XLM&apos;iniz iade edilir.</p>
            <p><strong>⏰ Geçerlilik:</strong> Pre-auth emirleri 2 saat geçerlidir.</p>
            <p><strong>💰 Test:</strong> Küçük miktarlarla test yapmanız önerilir.</p>
            <p><strong>📱 Bildirim:</strong> İşlem, transfer ve iptal işlemleri Telegram'dan bildirilir.</p>
            <p><strong>🔐 Güvenlik:</strong> Bot secret key'i kimseyle paylaşmayın!</p>
          </div>
        </Card> */}

          </div>
        )}
      </main>
    </div>
  );
}
