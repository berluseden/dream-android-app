import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { runSeed } from '@/scripts/seedFirestore';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const { profile, role, signOut, isAdmin } = useAuth();
  const [seeding, setSeeding] = useState(false);
  const { toast } = useToast();

  const handleSeed = async () => {
    setSeeding(true);
    const result = await runSeed();
    setSeeding(false);
    
    if (result.success) {
      toast({
        title: "Seed completado",
        description: "Músculos y ejercicios creados correctamente",
      });
    } else {
      toast({
        title: "Error en seed",
        description: "Revisa la consola para más detalles",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">Dashboard</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Bienvenido</p>
            <h2 className="text-xl font-bold">{profile?.name}</h2>
            <Badge className="mt-2">{role}</Badge>
          </div>

          <div className="space-y-2">
            <p><strong>Email:</strong> {profile?.email}</p>
            <p><strong>Nivel:</strong> {profile?.level}</p>
            <p><strong>Experiencia:</strong> {profile?.experience_years} años</p>
          </div>

          {isAdmin && (
            <Button 
              onClick={handleSeed} 
              disabled={seeding}
              variant="outline"
            >
              {seeding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Ejecutar Seed (Admin)
            </Button>
          )}

          <Button onClick={signOut} variant="destructive">
            Cerrar Sesión
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Index;
