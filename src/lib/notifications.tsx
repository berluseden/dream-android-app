import { toast } from '@/hooks/use-toast';
import type { ToastActionElement } from '@/components/ui/toast';

/**
 * Tipos de notificaciones
 */
type NotificationType = 'success' | 'error' | 'warning' | 'info';

/**
 * Configuración de toast por tipo
 */
const toastConfig = {
  success: {
    variant: 'default' as const,
    duration: 3000,
  },
  error: {
    variant: 'destructive' as const,
    duration: 5000,
  },
  warning: {
    variant: 'default' as const,
    duration: 4000,
  },
  info: {
    variant: 'default' as const,
    duration: 3000,
  },
};

/**
 * Wrapper centralizado de notificaciones toast
 * Proporciona una API consistente y tipada para mostrar mensajes al usuario
 * 
 * @example
 * // Notificación de éxito
 * notify.success('Ejercicio guardado correctamente');
 * 
 * // Notificación de error
 * notify.error('No se pudo completar la operación', 'Verifica tu conexión a internet');
 * 
 * // Notificación con callback
 * notify.warning('Cambios sin guardar', 'Los cambios se perderán', {
 *   action: { label: 'Guardar', onClick: () => handleSave() }
 * });
 */
export const notify = {
  /**
   * Muestra una notificación de éxito
   */
  success: (title: string, description?: string) => {
    toast({
      title,
      description,
      ...toastConfig.success,
    });
  },

  /**
   * Muestra una notificación de error
   */
  error: (title: string, description?: string) => {
    toast({
      title,
      description,
      ...toastConfig.error,
    });
  },

  /**
   * Muestra una notificación de advertencia
   */
  warning: (title: string, description?: string, action?: { label: string; onClick: () => void }) => {
    toast({
      title,
      description,
      ...toastConfig.warning,
    });
  },

  /**
   * Muestra una notificación informativa
   */
  info: (title: string, description?: string) => {
    toast({
      title,
      description,
      ...toastConfig.info,
    });
  },

  /**
   * Muestra una notificación de promesa (útil para operaciones asíncronas)
   * Muestra loading → success/error automáticamente
   */
  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: Error) => string);
    }
  ): Promise<T> => {
    toast({
      title: messages.loading,
      description: 'Por favor espera...',
      ...toastConfig.info,
    });

    return promise
      .then((data) => {
        const successMessage = typeof messages.success === 'function' 
          ? messages.success(data) 
          : messages.success;
        
        notify.success(successMessage);
        return data;
      })
      .catch((error) => {
        const errorMessage = typeof messages.error === 'function' 
          ? messages.error(error) 
          : messages.error;
        
        notify.error(errorMessage, error.message);
        throw error;
      });
  },
};

/**
 * Notificaciones predefinidas para operaciones comunes
 */
export const commonNotifications = {
  saved: () => notify.success('Guardado correctamente'),
  deleted: () => notify.success('Eliminado correctamente'),
  updated: () => notify.success('Actualizado correctamente'),
  copied: () => notify.success('Copiado al portapapeles'),
  
  saveFailed: (error?: string) => notify.error('Error al guardar', error || 'Inténtalo de nuevo'),
  deleteFailed: (error?: string) => notify.error('Error al eliminar', error || 'Inténtalo de nuevo'),
  updateFailed: (error?: string) => notify.error('Error al actualizar', error || 'Inténtalo de nuevo'),
  loadFailed: (error?: string) => notify.error('Error al cargar datos', error || 'Recarga la página'),
  
  networkError: () => notify.error('Error de conexión', 'Verifica tu conexión a internet'),
  permissionDenied: () => notify.error('Permiso denegado', 'No tienes acceso a este recurso'),
  notFound: () => notify.error('No encontrado', 'El recurso solicitado no existe'),
  
  unsavedChanges: () => 
    notify.warning(
      'Cambios sin guardar',
      'Los cambios se perderán si sales ahora'
    ),
};
