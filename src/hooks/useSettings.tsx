import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface UserSettings {
  notifications_enabled: boolean;
  email_notifications: boolean;
  workout_reminders: boolean;
  theme: 'light' | 'dark' | 'system';
  units: 'metric' | 'imperial';
  rest_timer_enabled: boolean;
  default_rest_seconds: number;
  auto_progress_load: boolean;
  share_progress_with_coach: boolean;
}

export function useUserSettings() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-settings', user?.uid],
    queryFn: async () => {
      if (!user?.uid) return null;

      const docRef = doc(db, 'user_settings', user.uid);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        // Return defaults
        return {
          notifications_enabled: true,
          email_notifications: true,
          workout_reminders: true,
          theme: 'system',
          units: 'metric',
          rest_timer_enabled: true,
          default_rest_seconds: 90,
          auto_progress_load: true,
          share_progress_with_coach: true,
        } as UserSettings;
      }

      return docSnap.data() as UserSettings;
    },
    enabled: !!user?.uid,
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (settings: Partial<UserSettings>) => {
      if (!user?.uid) throw new Error('No user');

      const docRef = doc(db, 'user_settings', user.uid);
      await setDoc(docRef, {
        ...settings,
        updated_at: serverTimestamp(),
      }, { merge: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-settings'] });
      toast({
        title: "Ajustes guardados",
      });
    },
  });
}
