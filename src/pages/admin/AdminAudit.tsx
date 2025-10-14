import { useState } from 'react';
import { useAuditLogs, exportAuditLogsToCSV } from '@/hooks/useAuditLogs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Download } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function AdminAudit() {
  const [search, setSearch] = useState('');
  const { data: logs, isLoading } = useAuditLogs({ limit: 100 });

  const filteredLogs = logs?.filter((log) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      log.action.toLowerCase().includes(searchLower) ||
      log.actor_email?.toLowerCase().includes(searchLower) ||
      log.target_path.toLowerCase().includes(searchLower)
    );
  });

  const handleExport = () => {
    if (filteredLogs) {
      exportAuditLogsToCSV(filteredLogs);
    }
  };

  const getActionBadge = (action: string) => {
    const colors: Record<string, string> = {
      CREATE: 'bg-green-500',
      UPDATE: 'bg-blue-500',
      DELETE: 'bg-red-500',
      EXECUTE: 'bg-purple-500',
      SEND: 'bg-yellow-500',
      REVOKE: 'bg-orange-500',
      ASSIGN: 'bg-indigo-500',
    };
    
    const prefix = action.split('_')[0];
    const color = colors[prefix] || 'bg-gray-500';
    
    return (
      <Badge className={`${color} text-white`}>
        {action.replace(/_/g, ' ')}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Auditoría</h2>
          <p className="text-muted-foreground">
            Registros de todas las acciones administrativas
          </p>
        </div>
        <Button onClick={handleExport} disabled={!filteredLogs || filteredLogs.length === 0}>
          <Download className="mr-2 h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Busca en los registros de auditoría</CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Buscar por acción, usuario o recurso..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Acción</TableHead>
                <TableHead>Usuario</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Recurso</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    Cargando...
                  </TableCell>
                </TableRow>
              ) : filteredLogs && filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-sm">
                      {format(log.ts.toDate(), 'PPp', { locale: es })}
                    </TableCell>
                    <TableCell>{getActionBadge(log.action)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{log.actor_role}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {log.actor_email || 'N/A'}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {log.target_path}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No se encontraron registros
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
