import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';

export default function Unauthorized() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="text-center space-y-4">
        <ShieldAlert className="h-16 w-16 text-destructive mx-auto" />
        <h1 className="text-3xl font-bold">Acceso No Autorizado</h1>
        <p className="text-muted-foreground">
          No tienes permisos para acceder a esta página.
        </p>
        <Button onClick={() => navigate('/')}>
          Volver al Inicio
        </Button>
      </div>
    </div>
  );
}
