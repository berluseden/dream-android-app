/**
 * Utilidades de gestos móviles con haptic feedback
 */

import { logger } from './logger';

export const vibrate = (pattern: number | number[] = 50) => {
  if ('vibrate' in navigator) {
    navigator.vibrate(pattern);
  }
};

export const vibrateSuccess = () => {
  vibrate([20, 30, 20]);
};

export const vibrateError = () => {
  vibrate([50, 50, 50]);
};

export const vibrateLight = () => {
  vibrate(10);
};

/**
 * Wake Lock para mantener pantalla encendida durante workout
 */
let wakeLock: WakeLockSentinel | null = null;

export const requestWakeLock = async (): Promise<boolean> => {
  if (!('wakeLock' in navigator)) {
    logger.warn('Wake Lock API no soportada');
    return false;
  }

  try {
    wakeLock = await navigator.wakeLock.request('screen');
    logger.info('Wake Lock activado');
    
    wakeLock.addEventListener('release', () => {
      logger.info('Wake Lock liberado');
    });
    
    return true;
  } catch (err) {
    logger.error('Error activando Wake Lock:', err);
    return false;
  }
};

export const releaseWakeLock = async () => {
  if (wakeLock) {
    await wakeLock.release();
    wakeLock = null;
  }
};

/**
 * Detectar si está en modo standalone (PWA instalada)
 */
export const isPWA = (): boolean => {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://')
  );
};

/**
 * Web Share API
 */
export const canShare = (): boolean => {
  return 'share' in navigator;
};

export const shareWorkout = async (data: {
  title: string;
  text: string;
  url?: string;
}) => {
  if (!canShare()) {
    throw new Error('Web Share no soportado');
  }

  try {
    await navigator.share(data);
    return true;
  } catch (err) {
    if ((err as Error).name !== 'AbortError') {
      logger.error('Error compartiendo:', err);
    }
    return false;
  }
};

