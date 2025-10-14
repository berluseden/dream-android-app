export type UserRole = 'admin' | 'coach' | 'user';

export type AuditAction =
  | 'CREATE_USER'
  | 'UPDATE_USER'
  | 'DELETE_USER'
  | 'UPDATE_ROLE'
  | 'CREATE_EXERCISE'
  | 'UPDATE_EXERCISE'
  | 'DELETE_EXERCISE'
  | 'SEND_INVITATION'
  | 'REVOKE_INVITATION'
  | 'CREATE_TEMPLATE'
  | 'UPDATE_TEMPLATE'
  | 'DELETE_TEMPLATE'
  | 'EXECUTE_SEED'
  | 'EXECUTE_BACKUP'
  | 'UPDATE_SETTINGS'
  | 'ASSIGN_COACH'
  | 'UNASSIGN_COACH';

export type InvitationStatus = 'pending' | 'accepted' | 'revoked' | 'expired';
export type BackupScope = 'catalogs' | 'users' | 'all';
export type SplitType = 'PPL' | 'UL' | 'FULL';
