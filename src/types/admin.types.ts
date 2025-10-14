import { Timestamp } from 'firebase/firestore';

export interface AdminSettings {
  id: 'global';
  feature_flags: {
    allow_signup: boolean;
    coach_can_create_exercises: boolean;
  };
  units_default: 'kg' | 'lb';
  write_limits: {
    sets_per_minute: number;
  };
}

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

export interface AuditLog {
  id: string;
  actor_id: string;
  actor_role: string;
  actor_email?: string;
  action: AuditAction;
  target_path: string;
  target_id?: string;
  before?: any;
  after?: any;
  ts: Timestamp;
  metadata?: Record<string, any>;
}

export type InvitationStatus = 'pending' | 'accepted' | 'revoked' | 'expired';

export interface Invitation {
  id: string;
  email: string;
  role: 'admin' | 'coach' | 'user';
  created_by: string;
  created_by_email?: string;
  status: InvitationStatus;
  created_at: Timestamp;
  expires_at: Timestamp;
  accepted_at?: Timestamp;
  revoked_at?: Timestamp;
}

export type BackupScope = 'catalogs' | 'users' | 'all';
export type BackupStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface BackupJob {
  id: string;
  scope: BackupScope;
  status: BackupStatus;
  started_at: Timestamp;
  finished_at?: Timestamp;
  artifact_url?: string;
  error?: string;
  triggered_by: string;
}

export type SplitType = 'PPL' | 'UL' | 'FULL';

export interface TemplateExercise {
  exercise_id: string;
  exercise_name: string;
  sets: number;
  rep_range_min: number;
  rep_range_max: number;
  rir_target: number;
  rest_seconds: number;
}

export interface TemplateDay {
  day_number: number;
  name: string;
  exercises: TemplateExercise[];
}

export interface Template {
  id: string;
  name: string;
  description: string;
  split: SplitType;
  weeks: number;
  days_per_week: number;
  days: TemplateDay[];
  created_by: string;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface AdminMetrics {
  total_users: number;
  total_coaches: number;
  total_clients: number;
  active_mesocycles: number;
  pending_invitations: number;
  total_exercises: number;
  total_templates: number;
}
