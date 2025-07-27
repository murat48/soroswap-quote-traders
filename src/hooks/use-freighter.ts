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
    publicKey: 'GCNA5EMJNXZPO57ARVJYQ5SN2DYYPD6ZCCENQ5AQTMVNKN77RDIPMI3A',
    error: null,
  });

  useEffect(() => {
    const checkFreighter = async () => {
      const isApiAvailable =
        typeof window !== 'undefined' &&
        typeof checkIsConnected === 'function' &&
        typeof requestFreighterAccess === 'function' &&
        typeof signFreighterTransaction === 'function';

      if (!isApiAvailable) {
        setState(prev => ({ ...prev, isAvailable: false, isConnected: false, publicKey: '', error: 'Freighter eklentisi bulunamadı veya API erişilemiyor.' }));
        return;
      }

      try {
        setState(prev => ({ ...prev, isAvailable: true }));
        const connected = await checkIsConnected();
        if (connected) {
          setState(prev => ({ ...prev, isConnected: true, error: null }));
        } else {
          setState(prev => ({ ...prev, isConnected: false, publicKey: '', error: null }));
        }
      } catch (apiError) {
        setState(prev => ({ ...prev, isAvailable: false, isConnected: false, publicKey: '', error: 'Freighter API hatası: ' + (apiError as Error).message }));
      }
    };

    checkFreighter();
    const interval = setInterval(checkFreighter, 1000);
    return () => clearInterval(interval);
  }, []);

  const connect = async (): Promise<void> => {
    try {
      setState(prev => ({ ...prev, error: null }));
      
      // Önce Freighter'ın yüklü olup olmadığını kontrol et
      const isFreighterAvailable = typeof window !== 'undefined' && !!window.freighter;
      if (!isFreighterAvailable) {
        throw new Error('Lütfen önce Freighter cüzdanını yükleyin ve tarayıcıyı yenileyin');
      }

      // Freighter'ın bağlı olup olmadığını kontrol et
      try {
        const connected = await checkIsConnected();
        if (!connected) {
          throw new Error('Lütfen Freighter cüzdanını açın ve tarayıcı eklentilerini kontrol edin');
        }
      } catch {
        throw new Error('Freighter ile iletişim kurulamıyor. Lütfen eklentiyi yeniden başlatın');
      }

      // Erişim izni iste
      const publicKey = await requestFreighterAccess();
      if (!publicKey) {
        throw new Error('Cüzdan erişimi reddedildi');
      }
      
      setState(prev => ({
        ...prev,
        isConnected: true,
        publicKey: publicKey.toString(),
      }));
    } catch (error) {
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
      const result = await signFreighterTransaction(xdr, {
        networkPassphrase: 'Test SDF Network ; September 2015'
      });
      return result.signedTxXdr;
    } catch (error) {
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