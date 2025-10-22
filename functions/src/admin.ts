import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
import { createAuditLog } from './audit';
// import { UserRole } from './types'; // Unused import

const db = admin.firestore();
const auth = admin.auth();

// Helper to check if caller is admin
async function requireAdmin(context: functions.https.CallableContext) {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Usuario no autenticado');
  }
  
  try {
    // Leer rol desde users collection
    const userDoc = await db.collection('users').doc(context.auth.uid).get();
    
    if (!userDoc.exists) {
      throw new functions.https.HttpsError('permission-denied', 'No se encontró usuario');
    }
    
    const role = userDoc.data()?.role;
    
    if (role !== 'admin') {
      throw new functions.https.HttpsError('permission-denied', 'Solo administradores pueden realizar esta acción');
    }
    
    return context.auth.uid;
  } catch (error: any) {
    console.error('Error en requireAdmin:', error);
    throw error;
  }
}

// Create user with role
export const createUserWithRole = functions.https.onCall(async (data, context) => {
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
      role: role, // Incluir rol directamente en users
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
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
    await createAuditLog(adminId, 'CREATE_USER', `users/${userId}`, {
      targetId: userId,
      after: { email, name, role },
    });
    
    return { success: true, userId };
  } catch (error: any) {
    console.error('Error creating user:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// Send invitation
export const sendInvitation = functions.https.onCall(async (data, context) => {
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
    const adminEmail = adminDoc.data()?.email || '';
    
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
    await createAuditLog(adminId, 'SEND_INVITATION', `invitations/${invitationRef.id}`, {
      targetId: invitationRef.id,
      after: { email, role },
    });
    
    // TODO: Send email with invitation link
    console.log(`Invitation sent to ${email} for role ${role}`);
    
    return { success: true, invitationId: invitationRef.id };
  } catch (error: any) {
    console.error('Error sending invitation:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// Set user role
export const setUserRole = functions.https.onCall(async (data, context) => {
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
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      console.error('User not found:', { userId, adminId });
      throw new functions.https.HttpsError('not-found', 'El usuario no existe');
    }
    
    const oldRole = userDoc.data()?.role || 'user';
    
    console.log('Setting user role:', { userId, oldRole, newRole, adminId });
    
    // Actualizar rol en users
    await userRef.update({
      role: newRole,
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    
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
    await createAuditLog(adminId, 'UPDATE_ROLE', `users/${userId}`, {
      targetId: userId,
      before: { role: oldRole },
      after: { role: newRole },
    });
    
    console.log('User role updated successfully:', { userId, newRole });
    
    return { success: true };
  } catch (error: any) {
    console.error('Error setting user role:', {
      error: error.message,
      code: error.code,
      stack: error.stack,
      userId,
      newRole,
      adminId
    });
    
    if (error.code === 'permission-denied') {
      throw new functions.https.HttpsError('permission-denied', 
        'No tienes permisos para cambiar roles de usuario');
    }
    
    if (error.code === 'not-found') {
      throw error;
    }
    
    throw new functions.https.HttpsError('internal', 
      `Error al cambiar rol: ${error.message}`);
  }
});

// Disable user
export const disableUser = functions.https.onCall(async (data, context) => {
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
    
    await createAuditLog(adminId, 'UPDATE_USER', `users/${userId}`, {
      targetId: userId,
      after: { disabled },
    });
    
    return { success: true };
  } catch (error: any) {
    console.error('Error disabling user:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// Delete user
export const deleteUser = functions.https.onCall(async (data, context) => {
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
    
    // Delete from Firestore
    await db.collection('users').doc(userId).delete();
    
    // Delete coach profile if exists
    const coachProfile = await db.collection('coach_profiles').doc(userId).get();
    if (coachProfile.exists) {
      await db.collection('coach_profiles').doc(userId).delete();
    }
    
    // Delete from Auth
    await auth.deleteUser(userId);
    
    await createAuditLog(adminId, 'DELETE_USER', `users/${userId}`, {
      targetId: userId,
      before: userData,
    });
    
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting user:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// Reset user password
export const resetUserPassword = functions.https.onCall(async (data, context) => {
  await requireAdmin(context);
  
  const { email } = data;
  
  if (!email) {
    throw new functions.https.HttpsError('invalid-argument', 'Email es requerido');
  }
  
  try {
    await auth.generatePasswordResetLink(email);
    
    console.log(`Password reset link sent to ${email}`);
    
    return { success: true };
  } catch (error: any) {
    console.error('Error resetting password:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// Revoke invitation
export const revokeInvitation = functions.https.onCall(async (data, context) => {
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
    
    await createAuditLog(adminId, 'REVOKE_INVITATION', `invitations/${invitationId}`, {
      targetId: invitationId,
    });
    
    return { success: true };
  } catch (error: any) {
    console.error('Error revoking invitation:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// Assign coach to client
export const assignCoach = functions.https.onCall(async (data, context) => {
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
    
    await createAuditLog(adminId, 'ASSIGN_COACH', `users/${clientId}`, {
      targetId: clientId,
      after: { coach_id: coachId },
    });
    
    return { success: true };
  } catch (error: any) {
    console.error('Error assigning coach:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// Update user role (admin only)
export const updateUserRole = functions.https.onCall(async (data, context) => {
  const adminId = await requireAdmin(context);
  
  const { userId, role } = data;
  
  if (!userId || !role) {
    throw new functions.https.HttpsError('invalid-argument', 'userId y role son requeridos');
  }
  
  if (!['admin', 'coach', 'user'].includes(role)) {
    throw new functions.https.HttpsError('invalid-argument', 'Rol inválido. Debe ser: admin, coach, user');
  }
  
  try {
    // Actualizar rol en users/{userId}
    await db.collection('users').doc(userId).update({
      role: role,
    });
    
    // Crear log de auditoría
    await createAuditLog(adminId, 'UPDATE_ROLE', `users/${userId}`, {
      targetId: userId,
      after: { role: role },
    });
    
    console.log(`✅ Rol del usuario ${userId} actualizado a: ${role}`);
    
    return { 
      success: true, 
      message: `Rol actualizado exitosamente a ${role}`,
      userId,
      role,
    };
  } catch (error: any) {
    console.error('Error updating user role:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});
