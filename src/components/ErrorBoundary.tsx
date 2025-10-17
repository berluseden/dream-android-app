import { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';
import { logger } from '@/lib/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Error Boundary para capturar errores en el árbol de componentes
 * 
 * Uso:
 * ```tsx
 * <ErrorBoundary>
 *   <App />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('ErrorBoundary caught:', error, errorInfo);
    // TODO: Enviar a servicio de monitoring (Sentry, LogRocket, etc.)
  }

  render() {
    if (this.state.hasError) {
      // Renderizar fallback personalizado si se proporciona
      if (this.props.fallback) return this.props.fallback;
      
      // Fallback por defecto
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Algo salió mal
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Lo sentimos, ocurrió un error inesperado. Por favor, recarga la aplicación.
              </p>
              
              {/* Mostrar detalles del error solo en desarrollo */}
              {import.meta.env.DEV && this.state.error && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Detalles (solo visible en desarrollo):</p>
                  <pre className="bg-muted p-3 rounded-lg text-xs overflow-auto max-h-40">
                    {this.state.error.message}
                    {'\n\n'}
                    {this.state.error.stack}
                  </pre>
                </div>
              )}
              
              <div className="flex gap-2">
                <Button 
                  onClick={() => window.location.reload()} 
                  className="flex-1"
                >
                  Recargar Aplicación
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => window.location.href = '/'}
                  className="flex-1"
                >
                  Ir al Inicio
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
