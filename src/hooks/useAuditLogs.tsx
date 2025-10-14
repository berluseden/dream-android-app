import { useQuery } from '@tanstack/react-query';
import { collection, query, orderBy, limit, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AuditLog } from '@/types/admin.types';

interface AuditLogFilters {
  actorId?: string;
  action?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}

export function useAuditLogs(filters?: AuditLogFilters) {
  return useQuery({
    queryKey: ['admin', 'audit-logs', filters],
    queryFn: async () => {
      let q = query(
        collection(db, 'audit_logs'),
        orderBy('ts', 'desc'),
        limit(filters?.limit || 100)
      );
      
      if (filters?.actorId) {
        q = query(q, where('actor_id', '==', filters.actorId));
      }
      
      if (filters?.action) {
        q = query(q, where('action', '==', filters.action));
      }
      
      if (filters?.startDate) {
        q = query(q, where('ts', '>=', Timestamp.fromDate(filters.startDate)));
      }
      
      if (filters?.endDate) {
        q = query(q, where('ts', '<=', Timestamp.fromDate(filters.endDate)));
      }
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as AuditLog[];
    },
  });
}

export function exportAuditLogsToCSV(logs: AuditLog[]) {
  const headers = ['Fecha', 'Actor', 'Email', 'Acción', 'Recurso', 'Cambios'];
  const rows = logs.map(log => [
    log.ts.toDate().toLocaleString(),
    log.actor_id,
    log.actor_email || '',
    log.action,
    log.target_path,
    JSON.stringify({ before: log.before, after: log.after }),
  ]);
  
  const csv = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n');
  
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `audit-logs-${new Date().toISOString()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
