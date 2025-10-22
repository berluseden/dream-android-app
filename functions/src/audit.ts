import * as admin from 'firebase-admin';
import { AuditAction } from './types';

export async function createAuditLog(
  actorId: string,
  action: AuditAction,
  targetPath: string,
  options: {
    targetId?: string;
    before?: any;
    after?: any;
    metadata?: Record<string, any>;
  } = {}
): Promise<void> {
  try {
    const db = admin.firestore();
    
    // Get actor info
    const userDoc = await db.collection('users').doc(actorId).get();
    
    const auditLog = {
      actor_id: actorId,
      actor_role: userDoc.data()?.role || 'unknown',
      actor_email: userDoc.data()?.email || '',
      action,
      target_path: targetPath,
      target_id: options.targetId,
      before: options.before || null,
      after: options.after || null,
      metadata: options.metadata || {},
      ts: admin.firestore.FieldValue.serverTimestamp(),
    };
    
    await db.collection('audit_logs').add(auditLog);
    console.log('Audit log created:', action, targetPath);
  } catch (error) {
    console.error('Error creating audit log:', error);
    // Don't throw - audit logging should not break main operations
  }
}
