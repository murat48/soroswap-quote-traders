'use client';

import { useState, useEffect } from 'react';
import {
  isConnected as checkIsConnected,
  requestAccess as requestFreighterAccess,
  signTransaction as signFreighterTransaction,
} from '@stellar/freighter-api';

declare global {
  interface Window {
    freighter?: unknown;
  }
}

interface FreighterState {
  isAvailable: boolean;
  isConnected: boolean;
  publicKey: string;
  error: string | null;
}

interface FreighterHook extends FreighterState {
  connect: () => Promise<void>;
  signTransaction: (xdr: string) => Promise<string>;
}

export const useFreighter = (): FreighterHook => {
  const [state, setState] = useState<FreighterState>({
    isAvailable: false,
    isConnected: false,
    publicKey: '', // Boş başlasın, bağlantı kurulunca dolacak
    error: null,
  });

  useEffect(() => {
    const checkFreighter = async () => {
      console.log('🔄 Otomatik Freighter durumu kontrol ediliyor...');
      
      const isApiAvailable =
        typeof window !== 'undefined' &&
        typeof checkIsConnected === 'function' &&
        typeof requestFreighterAccess === 'function' &&
        typeof signFreighterTransaction === 'function';

      if (!isApiAvailable) {
        console.log('❌ Freighter API mevcut değil');
        setState({ 
          isAvailable: false, 
          isConnected: false, 
          publicKey: '', 
          error: 'Freighter eklentisi bulunamadı veya API erişilemiyor.' 
        });
        return;
      }

      try {
        setState(prev => ({ ...prev, isAvailable: true, error: null }));
        
        // Bağlantı durumunu kontrol et
        const connectionResult = await checkIsConnected();
        const isCurrentlyConnected = connectionResult?.isConnected || false;
        
        console.log('🔍 Mevcut bağlantı durumu:', isCurrentlyConnected);
        console.log('🔍 Connection result:', connectionResult);
        
        // Public key'i localStorage'dan al (eğer varsa)
        let currentPublicKey = '';
        if (isCurrentlyConnected) {
          // Eğer bağlıysa, localStorage'dan public key'i almaya çalış
          currentPublicKey = localStorage.getItem('freighter_public_key') || '';
          console.log('🔑 Public key from localStorage:', currentPublicKey);
        } else {
          // Bağlantı kopmuşsa localStorage'ı temizle
          localStorage.removeItem('freighter_public_key');
          console.log('🗑️ localStorage temizlendi');
        }
        
        setState(prev => ({ 
          ...prev, 
          isConnected: isCurrentlyConnected,
          publicKey: currentPublicKey,
          error: null 
        }));
        
      } catch (apiError) {
        console.log('❌ Otomatik kontrol hatası:', apiError);
        setState({ 
          isAvailable: false, 
          isConnected: false, 
          publicKey: '', 
          error: 'Freighter API hatası: ' + (apiError as Error).message 
        });
      }
    };

    // İlk kontrol
    checkFreighter();
    
    // Her 5 saniyede bir kontrol et (daha sık kontrol)
    const interval = setInterval(checkFreighter, 5000);
    return () => clearInterval(interval);
  }, []);

  const connect = async (): Promise<void> => {
    try {
      console.log('🔌 Freighter connect butonuna basıldı');
      setState(prev => ({ ...prev, error: null }));
      
      // Freighter API'lerinin varlığını kontrol et
      console.log('🔍 Freighter API kontrolleri:');
      console.log('- window exists:', typeof window !== 'undefined');
      console.log('- checkIsConnected:', typeof checkIsConnected);
      console.log('- requestFreighterAccess:', typeof requestFreighterAccess);
      console.log('- signFreighterTransaction:', typeof signFreighterTransaction);
      
      // Freighter API fonksiyonları mevcut mu kontrol et
      if (typeof requestFreighterAccess !== 'function') {
        throw new Error('Freighter eklentisi yüklü değil. Lütfen Freighter browser eklentisini yükleyin ve sayfayı yenileyin.');
      }

      console.log('🚀 requestFreighterAccess çağrılıyor...');
      // Freighter popup açacak ve kullanıcıdan izin isteyecek
      const accessResult = await requestFreighterAccess();
      console.log('📋 Freighter access result:', accessResult);
      
      if (!accessResult) {
        throw new Error('Freighter erişimi reddedildi');
      }

      // Public key'i al
      const publicKey = typeof accessResult === 'string' ? accessResult : accessResult?.address || '';
      console.log('🔑 Public key alındı:', publicKey);
      
      if (!publicKey) {
        throw new Error('Public key alınamadı');
      }
      
      // Public key'i localStorage'a kaydet
      localStorage.setItem('freighter_public_key', publicKey);
      console.log('💾 Public key localStorage\'a kaydedildi');
      
      setState(prev => ({
        ...prev,
        isConnected: true,
        publicKey: publicKey,
        error: null
      }));
      
      console.log('✅ Freighter bağlantısı başarılı! Address:', publicKey);
      
    } catch (error) {
      console.error('❌ Freighter bağlantı hatası:', error);
      setState(prev => ({
        ...prev,
        error: (error as Error).message,
        isConnected: false,
        publicKey: '',
      }));
      throw error;
    }
  };

  const signTransaction = async (xdr: string): Promise<string> => {
    try {
      console.log('🔐 Freighter signTransaction called with XDR:', xdr.substring(0, 50) + '...');
      
      const result = await signFreighterTransaction(xdr, {
        networkPassphrase: 'Test SDF Network ; September 2015'
      });
      
      console.log('✅ Freighter signTransaction result:', result);
      console.log('✅ Signed XDR type:', typeof result.signedTxXdr);
      console.log('✅ Signed XDR preview:', result.signedTxXdr?.substring(0, 50) + '...');
      
      return result.signedTxXdr;
    } catch (error) {
      console.error('❌ Freighter signTransaction error:', error);
      setState(prev => ({
        ...prev,
        error: (error as Error).message,
      }));
      throw error;
    }
  };

  return {
    ...state,
    connect,
    signTransaction,
  };
};

