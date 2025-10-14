import { useState } from 'react';
import { useAdminUsers, useSetUserRole } from '@/hooks/useAdmin';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Shield } from 'lucide-react';
import { UserRole } from '@/types/user.types';

export default function AdminRoles() {
  const { data: users, isLoading } = useAdminUsers();
  const setUserRole = useSetUserRole();
  const [selectedUser, setSelectedUser] = useState<{ id: string; name: string; currentRole: UserRole } | null>(null);
  const [newRole, setNewRole] = useState<UserRole>('user');

  const handleChangeRole = async () => {
    if (selectedUser) {
      await setUserRole.mutateAsync({
        userId: selectedUser.id,
        newRole,
      });
      setSelectedUser(null);
    }
  };

  const getRoleBadge = (role: string) => {
    const variants = {
      admin: 'destructive',
      coach: 'default',
      user: 'secondary',
    };
    return (
      <Badge variant={variants[role as keyof typeof variants] as any}>
        {role}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Gestión de Roles</h2>
        <p className="text-muted-foreground">
          Administra los roles de usuarios en el sistema
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Roles de Usuario</CardTitle>
          <CardDescription>
            Haz clic en el botón de acción para cambiar el rol de un usuario
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rol Actual</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    Cargando...
                  </TableCell>
                </TableRow>
              ) : users && users.length > 0 ? (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setSelectedUser({
                            id: user.id,
                            name: user.name,
                            currentRole: user.role,
                          })
                        }
                      >
                        <Shield className="mr-2 h-4 w-4" />
                        Cambiar Rol
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No se encontraron usuarios
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cambiar Rol de Usuario</DialogTitle>
            <DialogDescription>
              Cambiar el rol de {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Rol actual: {selectedUser && getRoleBadge(selectedUser.currentRole)}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Nuevo Rol</label>
              <Select value={newRole} onValueChange={(v) => setNewRole(v as UserRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Usuario</SelectItem>
                  <SelectItem value="coach">Coach</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSelectedUser(null)}>
                Cancelar
              </Button>
              <Button onClick={handleChangeRole} disabled={setUserRole.isPending}>
                {setUserRole.isPending ? 'Guardando...' : 'Cambiar Rol'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
