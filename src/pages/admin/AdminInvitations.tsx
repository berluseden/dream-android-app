import { useState } from 'react';
import { useInvitations, useSendInvitation, useRevokeInvitation } from '@/hooks/useInvitations';
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
import { Badge } from '@/components/ui/badge';
import { Plus, X } from 'lucide-react';
import { SendInvitationDialog } from '@/components/admin/SendInvitationDialog';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function AdminInvitations() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data: invitations, isLoading } = useInvitations();
  const revokeInvitation = useRevokeInvitation();

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'default',
      accepted: 'secondary',
      revoked: 'destructive',
      expired: 'outline',
    };
    const labels = {
      pending: 'Pendiente',
      accepted: 'Aceptada',
      revoked: 'Revocada',
      expired: 'Expirada',
    };
    return (
      <Badge variant={variants[status as keyof typeof variants] as any}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Invitaciones</h2>
          <p className="text-muted-foreground">
            Gestiona las invitaciones enviadas a nuevos usuarios
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Enviar Invitación
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invitaciones Enviadas</CardTitle>
          <CardDescription>
            Lista de todas las invitaciones y su estado
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Enviado por</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Expira</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    Cargando...
                  </TableCell>
                </TableRow>
              ) : invitations && invitations.length > 0 ? (
                invitations.map((invitation) => (
                  <TableRow key={invitation.id}>
                    <TableCell className="font-medium">{invitation.email}</TableCell>
                    <TableCell>{getRoleBadge(invitation.role)}</TableCell>
                    <TableCell>{getStatusBadge(invitation.status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {invitation.created_by_email || 'N/A'}
                    </TableCell>
                    <TableCell className="text-sm">
                      {format(invitation.created_at.toDate(), 'PP', { locale: es })}
                    </TableCell>
                    <TableCell className="text-sm">
                      {format(invitation.expires_at.toDate(), 'PP', { locale: es })}
                    </TableCell>
                    <TableCell className="text-right">
                      {invitation.status === 'pending' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => revokeInvitation.mutate(invitation.id)}
                        >
                          <X className="mr-2 h-4 w-4" />
                          Revocar
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No hay invitaciones
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <SendInvitationDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
