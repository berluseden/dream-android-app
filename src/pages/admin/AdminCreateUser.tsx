import { useState } from 'react';
import { useCreateUser } from '@/hooks/useAdmin';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UserPlus, Eye, EyeOff } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function AdminCreateUser() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'user' | 'coach' | 'admin'>('user');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const createUserMutation = useCreateUser();
  const { toast } = useToast();

  // Query para obtener usuarios existentes
  const { data: users = [], refetch } = useQuery({
    queryKey: ['admin-users-list'],
    queryFn: async () => {
      const usersQuery = query(collection(db, 'users'), orderBy('created_at', 'desc'));
      const snapshot = await getDocs(usersQuery);
      
      const usersData = await Promise.all(
        snapshot.docs.map(async (doc) => {
          const userData = doc.data();
          
          // Obtener rol del usuario
          const roleQuery = query(collection(db, 'user_roles'));
          const roleSnapshot = await getDocs(roleQuery);
          const userRole = roleSnapshot.docs.find(r => r.data().user_id === doc.id);
          
          return {
            id: doc.id,
            email: userData.email,
            name: userData.name,
            role: userRole?.data()?.role || 'user',
            created_at: userData.created_at?.toDate().toLocaleDateString() || 'N/A',
          };
        })
      );
      
      return usersData;
    },
  });

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password || !name || !role) {
      toast({
        title: 'Error',
        description: 'Todos los campos son requeridos',
        variant: 'destructive',
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: 'Error',
        description: 'La contraseña debe tener al menos 6 caracteres',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      await createUserMutation.mutateAsync({
        email,
        password,
        name,
        role,
      });

      toast({
        title: '✅ Usuario creado',
        description: `${name} ha sido creado con rol de ${role}`,
      });

      // Limpiar formulario
      setEmail('');
      setPassword('');
      setName('');
      setRole('user');
      
      // Refrescar lista
      refetch();
    } catch (error: any) {
      toast({
        title: 'Error al crear usuario',
        description: error.message || 'Ocurrió un error inesperado',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'coach':
        return 'default';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Crear Usuario</h2>
        <p className="text-muted-foreground">
          Crea nuevos usuarios y asigna roles
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Formulario de Creación */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Nuevo Usuario
            </CardTitle>
            <CardDescription>
              Completa los datos del nuevo usuario
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre Completo</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Juan Pérez"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="usuario@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Rol</Label>
                <Select value={role} onValueChange={(value: any) => setRole(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un rol" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Usuario</SelectItem>
                    <SelectItem value="coach">Coach</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Crear Usuario
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Info de Roles */}
        <Card>
          <CardHeader>
            <CardTitle>Información de Roles</CardTitle>
            <CardDescription>
              Permisos según el rol asignado
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Usuario</Badge>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1 ml-2">
                <li>• Ver y registrar entrenamientos</li>
                <li>• Ver su progreso personal</li>
                <li>• Chat con su coach</li>
              </ul>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="default">Coach</Badge>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1 ml-2">
                <li>• Gestionar clientes asignados</li>
                <li>• Crear y editar programas</li>
                <li>• Monitorear progreso de clientes</li>
                <li>• Chat con clientes</li>
              </ul>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="destructive">Administrador</Badge>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1 ml-2">
                <li>• Acceso completo al sistema</li>
                <li>• Crear y gestionar usuarios</li>
                <li>• Gestionar roles y permisos</li>
                <li>• Configuración del sistema</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Usuarios Creados */}
      <Card>
        <CardHeader>
          <CardTitle>Usuarios Registrados</CardTitle>
          <CardDescription>
            Total: {users.length} usuarios
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Fecha Creación</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No hay usuarios registrados
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(user.role)}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>{user.created_at}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
