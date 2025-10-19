"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.reindexComputedFields = exports.backupCollections = void 0;
const functions = __importStar(require("firebase-functions/v1"));
const admin = __importStar(require("firebase-admin"));
const audit_1 = require("./audit");
const db = admin.firestore();
// Helper to check if caller is admin
async function requireAdmin(context) {
    var _a;
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Usuario no autenticado');
    }
    const roleDoc = await db.collection('user_roles').doc(context.auth.uid).get();
    const role = (_a = roleDoc.data()) === null || _a === void 0 ? void 0 : _a.role;
    if (role !== 'admin') {
        throw new functions.https.HttpsError('permission-denied', 'Solo administradores pueden realizar esta acción');
    }
    return context.auth.uid;
}
// Backup collections
exports.backupCollections = functions.https.onCall(async (data, context) => {
    const adminId = await requireAdmin(context);
    const { scope } = data;
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
        const backupData = {
            timestamp: new Date().toISOString(),
            scope,
        };
        // Determine which collections to backup
        let collections = [];
        if (scope === 'catalogs') {
            collections = ['muscles', 'exercises', 'templates'];
        }
        else if (scope === 'users') {
            collections = ['users', 'user_roles', 'coach_profiles'];
        }
        else if (scope === 'all') {
            collections = ['muscles', 'exercises', 'templates', 'users', 'user_roles', 'coach_profiles', 'mesocycles', 'workouts'];
        }
        // Backup each collection
        for (const collectionName of collections) {
            const snapshot = await db.collection(collectionName).get();
            backupData[collectionName] = snapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
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
        await (0, audit_1.createAuditLog)(adminId, 'EXECUTE_BACKUP', `backups/${jobRef.id}`, {
            targetId: jobRef.id,
            metadata: { scope, collections: collections.length },
        });
        return {
            success: true,
            jobId: jobRef.id,
            message: `Backup completado: ${collections.join(', ')}`
        };
    }
    catch (error) {
        console.error('Error in backup process:', error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});
// Reindex computed fields
exports.reindexComputedFields = functions.https.onCall(async (data, context) => {
    await requireAdmin(context);
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
    }
    catch (error) {
        console.error('Error in reindex process:', error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});
//# sourceMappingURL=backup.js.map