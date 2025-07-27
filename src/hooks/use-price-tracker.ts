'use client';

import { useState, useEffect, useCallback } from 'react';
import { priceTracker, PriceTracker } from '@/lib/price-tracker';
import { PriceAlert, PriceData } from '@/types/price-tracker';

export const usePriceTracker = () => {
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [isTracking, setIsTracking] = useState<boolean>(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fiyat değişikliklerini dinle
  useEffect(() => {
    const handlePriceUpdate = (priceData: PriceData) => {
      setCurrentPrice(priceData.price);
      setLastUpdate(priceData.timestamp);
      setError(null);
    };

    const handlePriceAlert = (event: CustomEvent) => {
      // Alert tetiklendiğinde alerts state'ini güncelle
      setAlerts(priceTracker.getAlerts());
      
      // Kullanıcı bilgilendirmesi
      alert(event.detail.message);
    };

    priceTracker.addPriceListener(handlePriceUpdate);
    window.addEventListener('priceAlert', handlePriceAlert as EventListener);

    return () => {
      priceTracker.removePriceListener(handlePriceUpdate);
      window.removeEventListener('priceAlert', handlePriceAlert as EventListener);
    };
  }, []);

  // Alerts'ları yükle
  useEffect(() => {
    setAlerts(priceTracker.getAlerts());
    setCurrentPrice(priceTracker.getCurrentPrice());
  }, []);

  const startTracking = useCallback(async (intervalMs: number = 30000) => {
    try {
      // Notification permission iste
      await PriceTracker.requestNotificationPermission();
      
      priceTracker.startTracking(intervalMs);
      setIsTracking(true);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    }
  }, []);

  const stopTracking = useCallback(() => {
    priceTracker.stopTracking();
    setIsTracking(false);
  }, []);

  const addAlert = useCallback((targetPrice: number, condition: 'above' | 'below'): string => {
    const alertId = priceTracker.addAlert(targetPrice, condition);
    setAlerts(priceTracker.getAlerts());
    return alertId;
  }, []);

  const removeAlert = useCallback((alertId: string): boolean => {
    const success = priceTracker.removeAlert(alertId);
    setAlerts(priceTracker.getAlerts());
    return success;
  }, []);

  return {
    currentPrice,
    alerts,
    isTracking,
    lastUpdate,
    error,
    startTracking,
    stopTracking,
    addAlert,
    removeAlert,
    activeAlerts: alerts.filter(a => a.isActive)
  };
};
