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
exports.assignCoach = exports.revokeInvitation = exports.resetUserPassword = exports.deleteUser = exports.disableUser = exports.setUserRole = exports.sendInvitation = exports.createUserWithRole = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const audit_1 = require("./audit");
// import { UserRole } from './types'; // Unused import
const db = admin.firestore();
const auth = admin.auth();
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
// Create user with role
exports.createUserWithRole = functions.https.onCall(async (data, context) => {
    const adminId = await requireAdmin(context);
    const { email, password, name, role } = data;
    if (!email || !password || !name || !role) {
        throw new functions.https.HttpsError('invalid-argument', 'Email, contraseña, nombre y rol son requeridos');
    }
    if (!['admin', 'coach', 'user'].includes(role)) {
        throw new functions.https.HttpsError('invalid-argument', 'Rol inválido');
    }
    try {
        // Create auth user
        const userRecord = await auth.createUser({
            email,
            password,
            displayName: name,
        });
        const userId = userRecord.uid;
        // Create user profile
        await db.collection('users').doc(userId).set({
            id: userId,
            email,
            name,
            equipment: [],
            level: 'novato',
            experience_years: 0,
            goals: '',
            units: 'kg',
            coach_id: null,
            created_at: admin.firestore.FieldValue.serverTimestamp(),
            updated_at: admin.firestore.FieldValue.serverTimestamp(),
        });
        // Assign role
        await db.collection('user_roles').doc(userId).set({
            id: userId,
            user_id: userId,
            role,
        });
        // If coach, create coach profile
        if (role === 'coach') {
            await db.collection('coach_profiles').doc(userId).set({
                id: userId,
                specializations: [],
                certifications: [],
                max_clients: 20,
                current_clients: 0,
            });
        }
        // Audit log
        await (0, audit_1.createAuditLog)(adminId, 'CREATE_USER', `users/${userId}`, {
            targetId: userId,
            after: { email, name, role },
        });
        return { success: true, userId };
    }
    catch (error) {
        console.error('Error creating user:', error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});
// Send invitation
exports.sendInvitation = functions.https.onCall(async (data, context) => {
    var _a;
    const adminId = await requireAdmin(context);
    const { email, role } = data;
    if (!email || !role) {
        throw new functions.https.HttpsError('invalid-argument', 'Email y rol son requeridos');
    }
    if (!['admin', 'coach', 'user'].includes(role)) {
        throw new functions.https.HttpsError('invalid-argument', 'Rol inválido');
    }
    try {
        const adminDoc = await db.collection('users').doc(adminId).get();
        const adminEmail = ((_a = adminDoc.data()) === null || _a === void 0 ? void 0 : _a.email) || '';
        // Create invitation
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration
        const invitationRef = await db.collection('invitations').add({
            email,
            role,
            created_by: adminId,
            created_by_email: adminEmail,
            status: 'pending',
            created_at: admin.firestore.FieldValue.serverTimestamp(),
            expires_at: admin.firestore.Timestamp.fromDate(expiresAt),
        });
        // Audit log
        await (0, audit_1.createAuditLog)(adminId, 'SEND_INVITATION', `invitations/${invitationRef.id}`, {
            targetId: invitationRef.id,
            after: { email, role },
        });
        // TODO: Send email with invitation link
        console.log(`Invitation sent to ${email} for role ${role}`);
        return { success: true, invitationId: invitationRef.id };
    }
    catch (error) {
        console.error('Error sending invitation:', error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});
// Set user role
exports.setUserRole = functions.https.onCall(async (data, context) => {
    var _a;
    const adminId = await requireAdmin(context);
    const { userId, newRole } = data;
    if (!userId || !newRole) {
        throw new functions.https.HttpsError('invalid-argument', 'userId y newRole son requeridos');
    }
    if (!['admin', 'coach', 'user'].includes(newRole)) {
        throw new functions.https.HttpsError('invalid-argument', 'Rol inválido');
    }
    // Prevent self role change
    if (userId === adminId) {
        throw new functions.https.HttpsError('permission-denied', 'No puedes cambiar tu propio rol');
    }
    try {
        const roleRef = db.collection('user_roles').doc(userId);
        const roleDoc = await roleRef.get();
        if (!roleDoc.exists) {
            console.error('User role not found:', { userId, adminId });
            throw new functions.https.HttpsError('not-found', 'El usuario no existe o no tiene un rol asignado');
        }
        const oldRole = (_a = roleDoc.data()) === null || _a === void 0 ? void 0 : _a.role;
        console.log('Setting user role:', { userId, oldRole, newRole, adminId });
        await roleRef.set({
            id: userId,
            user_id: userId,
            role: newRole,
        }, { merge: true });
        // If promoting to coach, create coach profile
        if (newRole === 'coach' && oldRole !== 'coach') {
            console.log('Creating coach profile for:', userId);
            await db.collection('coach_profiles').doc(userId).set({
                id: userId,
                specializations: [],
                certifications: [],
                max_clients: 20,
                current_clients: 0,
            });
        }
        // Audit log
        await (0, audit_1.createAuditLog)(adminId, 'UPDATE_ROLE', `user_roles/${userId}`, {
            targetId: userId,
            before: { role: oldRole },
            after: { role: newRole },
        });
        console.log('User role updated successfully:', { userId, newRole });
        return { success: true };
    }
    catch (error) {
        console.error('Error setting user role:', {
            error: error.message,
            code: error.code,
            stack: error.stack,
            userId,
            newRole,
            adminId
        });
        if (error.code === 'permission-denied') {
            throw new functions.https.HttpsError('permission-denied', 'No tienes permisos para cambiar roles de usuario');
        }
        if (error.code === 'not-found') {
            throw error;
        }
        throw new functions.https.HttpsError('internal', `Error al cambiar rol: ${error.message}`);
    }
});
// Disable user
exports.disableUser = functions.https.onCall(async (data, context) => {
    const adminId = await requireAdmin(context);
    const { userId, disabled } = data;
    if (!userId || typeof disabled !== 'boolean') {
        throw new functions.https.HttpsError('invalid-argument', 'userId y disabled son requeridos');
    }
    if (userId === adminId) {
        throw new functions.https.HttpsError('permission-denied', 'No puedes desactivar tu propia cuenta');
    }
    try {
        await auth.updateUser(userId, { disabled });
        await (0, audit_1.createAuditLog)(adminId, 'UPDATE_USER', `users/${userId}`, {
            targetId: userId,
            after: { disabled },
        });
        return { success: true };
    }
    catch (error) {
        console.error('Error disabling user:', error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});
// Delete user
exports.deleteUser = functions.https.onCall(async (data, context) => {
    const adminId = await requireAdmin(context);
    const { userId } = data;
    if (!userId) {
        throw new functions.https.HttpsError('invalid-argument', 'userId es requerido');
    }
    if (userId === adminId) {
        throw new functions.https.HttpsError('permission-denied', 'No puedes eliminar tu propia cuenta');
    }
    try {
        // Get user data before deletion
        const userDoc = await db.collection('users').doc(userId).get();
        const userData = userDoc.data();
        // Delete from Firestore (cascade will handle auth.users via rules)
        await db.collection('users').doc(userId).delete();
        await db.collection('user_roles').doc(userId).delete();
        // Delete coach profile if exists
        const coachProfile = await db.collection('coach_profiles').doc(userId).get();
        if (coachProfile.exists) {
            await db.collection('coach_profiles').doc(userId).delete();
        }
        // Delete from Auth
        await auth.deleteUser(userId);
        await (0, audit_1.createAuditLog)(adminId, 'DELETE_USER', `users/${userId}`, {
            targetId: userId,
            before: userData,
        });
        return { success: true };
    }
    catch (error) {
        console.error('Error deleting user:', error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});
// Reset user password
exports.resetUserPassword = functions.https.onCall(async (data, context) => {
    await requireAdmin(context);
    const { email } = data;
    if (!email) {
        throw new functions.https.HttpsError('invalid-argument', 'Email es requerido');
    }
    try {
        await auth.generatePasswordResetLink(email);
        console.log(`Password reset link sent to ${email}`);
        return { success: true };
    }
    catch (error) {
        console.error('Error resetting password:', error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});
// Revoke invitation
exports.revokeInvitation = functions.https.onCall(async (data, context) => {
    const adminId = await requireAdmin(context);
    const { invitationId } = data;
    if (!invitationId) {
        throw new functions.https.HttpsError('invalid-argument', 'invitationId es requerido');
    }
    try {
        await db.collection('invitations').doc(invitationId).update({
            status: 'revoked',
            revoked_at: admin.firestore.FieldValue.serverTimestamp(),
        });
        await (0, audit_1.createAuditLog)(adminId, 'REVOKE_INVITATION', `invitations/${invitationId}`, {
            targetId: invitationId,
        });
        return { success: true };
    }
    catch (error) {
        console.error('Error revoking invitation:', error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});
// Assign coach to client
exports.assignCoach = functions.https.onCall(async (data, context) => {
    const adminId = await requireAdmin(context);
    const { clientId, coachId } = data;
    if (!clientId || !coachId) {
        throw new functions.https.HttpsError('invalid-argument', 'clientId y coachId son requeridos');
    }
    try {
        // Update client's coach_id
        await db.collection('users').doc(clientId).update({
            coach_id: coachId,
            updated_at: admin.firestore.FieldValue.serverTimestamp(),
        });
        // Create assignment record
        await db.collection('coach_assignments').add({
            coach_id: coachId,
            client_id: clientId,
            assigned_at: admin.firestore.FieldValue.serverTimestamp(),
            assigned_by: adminId,
        });
        // Update coach's current_clients count
        const coachProfile = await db.collection('coach_profiles').doc(coachId).get();
        if (coachProfile.exists) {
            await db.collection('coach_profiles').doc(coachId).update({
                current_clients: admin.firestore.FieldValue.increment(1),
            });
        }
        await (0, audit_1.createAuditLog)(adminId, 'ASSIGN_COACH', `users/${clientId}`, {
            targetId: clientId,
            after: { coach_id: coachId },
        });
        return { success: true };
    }
    catch (error) {
        console.error('Error assigning coach:', error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});
//# sourceMappingURL=admin.js.map