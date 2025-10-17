/**
 * Logger Wrapper
 * 
 * Controla los logs en diferentes ambientes:
 * - Desarrollo: Muestra todos los logs
 * - Producción: Solo errors (para monitoring)
 */

const isDev = import.meta.env.DEV;

export const logger = {
  /**
   * Log general (solo en desarrollo)
   */
  log: (...args: any[]) => {
    if (isDev) console.log(...args);
  },

  /**
   * Errores (siempre se loguean)
   * TODO: Integrar con servicio de monitoring (Sentry, LogRocket, etc.)
   */
  error: (...args: any[]) => {
    console.error(...args);
    // TODO: Enviar a servicio de monitoring
    // Example: Sentry.captureException(args[0]);
  },

  /**
   * Warnings (solo en desarrollo)
   */
  warn: (...args: any[]) => {
    if (isDev) console.warn(...args);
  },

  /**
   * Info (solo en desarrollo)
   */
  info: (...args: any[]) => {
    if (isDev) console.info(...args);
  },

  /**
   * Debug (solo en desarrollo)
   */
  debug: (...args: any[]) => {
    if (isDev) console.debug(...args);
  },
};
