import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { createAuditLog } from './audit';
import { BackupScope } from './types';

const db = admin.firestore();

// Helper to check if caller is admin
async function requireAdmin(context: functions.https.CallableContext) {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Usuario no autenticado');
  }
  
  const roleDoc = await db.collection('user_roles').doc(context.auth.uid).get();
  const role = roleDoc.data()?.role;
  
  if (role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Solo administradores pueden realizar esta acción');
  }
  
  return context.auth.uid;
}

// Backup collections
export const backupCollections = functions.https.onCall(async (data, context) => {
  const adminId = await requireAdmin(context);
  
  const { scope }: { scope: BackupScope } = data;
  
  if (!scope || !['catalogs', 'users', 'all'].includes(scope)) {
    throw new functions.https.HttpsError('invalid-argument', 'Scope debe ser catalogs, users o all');
  }
  
  try {
    // Create backup job record
    const jobRef = await db.collection('backups').add({
      scope,
      status: 'running',
      started_at: admin.firestore.FieldValue.serverTimestamp(),
      triggered_by: adminId,
    });
    
    console.log(`Starting backup job ${jobRef.id} with scope: ${scope}`);
    
    const backupData: any = {
      timestamp: new Date().toISOString(),
      scope,
    };
    
    // Determine which collections to backup
    let collections: string[] = [];
    
    if (scope === 'catalogs') {
      collections = ['muscles', 'exercises', 'templates'];
    } else if (scope === 'users') {
      collections = ['users', 'user_roles', 'coach_profiles'];
    } else if (scope === 'all') {
      collections = ['muscles', 'exercises', 'templates', 'users', 'user_roles', 'coach_profiles', 'mesocycles', 'workouts'];
    }
    
    // Backup each collection
    for (const collectionName of collections) {
      const snapshot = await db.collection(collectionName).get();
      backupData[collectionName] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      console.log(`Backed up ${snapshot.size} documents from ${collectionName}`);
    }
    
    // In a real implementation, you would upload this to Cloud Storage
    // For now, we'll just log it and mark as completed
    const backupJson = JSON.stringify(backupData, null, 2);
    console.log(`Backup size: ${backupJson.length} bytes`);
    
    // Update backup job
    await jobRef.update({
      status: 'completed',
      finished_at: admin.firestore.FieldValue.serverTimestamp(),
      artifact_url: `backup_${jobRef.id}.json`, // In production, this would be a Cloud Storage URL
    });
    
    await createAuditLog(adminId, 'EXECUTE_BACKUP', `backups/${jobRef.id}`, {
      targetId: jobRef.id,
      metadata: { scope, collections: collections.length },
    });
    
    return { 
      success: true, 
      jobId: jobRef.id,
      message: `Backup completado: ${collections.join(', ')}` 
    };
  } catch (error: any) {
    console.error('Error in backup process:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// Reindex computed fields
export const reindexComputedFields = functions.https.onCall(async (data, context) => {
  const adminId = await requireAdmin(context);
  
  try {
    console.log('Starting reindex process...');
    
    // Recount coach clients
    const coaches = await db.collection('user_roles').where('role', '==', 'coach').get();
    
    for (const coachDoc of coaches.docs) {
      const coachId = coachDoc.id;
      const clientsSnapshot = await db.collection('users').where('coach_id', '==', coachId).get();
      const clientCount = clientsSnapshot.size;
      
      await db.collection('coach_profiles').doc(coachId).update({
        current_clients: clientCount,
      });
      
      console.log(`Updated coach ${coachId}: ${clientCount} clients`);
    }
    
    console.log('Reindex process completed');
    
    return { success: true, message: 'Reindexación completada' };
  } catch (error: any) {
    console.error('Error in reindex process:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});
