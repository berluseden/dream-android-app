import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';

export default function Messages() {
  return (
    <AppLayout>
      <div className="container mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-8rem)]">
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Conversaciones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-3 p-3 hover:bg-muted rounded-lg cursor-pointer">
                <Avatar>
                  <AvatarFallback>JD</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">John Doe</p>
                  <p className="text-xs text-muted-foreground truncate">Último mensaje...</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Mensajes</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col h-[calc(100%-5rem)]">
              <div className="flex-1 space-y-4 overflow-y-auto mb-4">
                <div className="flex items-start gap-3">
                  <Avatar>
                    <AvatarFallback>JD</AvatarFallback>
                  </Avatar>
                  <div className="bg-muted p-3 rounded-lg max-w-[70%]">
                    <p className="text-sm">Hola, ¿cómo va el entrenamiento?</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 justify-end">
                  <div className="bg-primary text-primary-foreground p-3 rounded-lg max-w-[70%]">
                    <p className="text-sm">¡Muy bien! Completé todas las series de hoy.</p>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Input placeholder="Escribe un mensaje..." />
                <Button size="icon">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
