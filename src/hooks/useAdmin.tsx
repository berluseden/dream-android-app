import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collection, query, where, orderBy, getDocs, doc, getDoc } from 'firebase/firestore';
import { db, functions } from '@/lib/firebase';
import { httpsCallable } from 'firebase/functions';
import { toast } from '@/hooks/use-toast';
import { UserProfile, UserRole } from '@/types/user.types';

interface AdminUser extends UserProfile {
  role: UserRole;
  disabled?: boolean;
}

export function useAdminUsers(filters?: { role?: UserRole; search?: string }) {
  return useQuery({
    queryKey: ['admin', 'users', filters],
    queryFn: async () => {
      let q = query(collection(db, 'users'), orderBy('created_at', 'desc'));
      
      const usersSnapshot = await getDocs(q);
      const users: AdminUser[] = [];
      
      for (const userDoc of usersSnapshot.docs) {
        const userData = userDoc.data() as UserProfile;
        
        // Get role
        const roleDoc = await getDoc(doc(db, 'user_roles', userDoc.id));
        const role = roleDoc.data()?.role || 'user';
        
        // Apply filters
        if (filters?.role && role !== filters.role) continue;
        if (filters?.search) {
          const searchLower = filters.search.toLowerCase();
          if (!userData.name.toLowerCase().includes(searchLower) && 
              !userData.email.toLowerCase().includes(searchLower)) {
            continue;
          }
        }
        
        users.push({
          ...userData,
          role,
        });
      }
      
      return users;
    },
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { email: string; password: string; name: string; role: UserRole }) => {
      const createUserWithRole = httpsCallable(functions, 'createUserWithRole');
      const result = await createUserWithRole(data);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast({
        title: 'Usuario creado',
        description: 'El usuario ha sido creado exitosamente',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'No se pudo crear el usuario',
      });
    },
  });
}

export function useSetUserRole() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { userId: string; newRole: UserRole }) => {
      const setUserRole = httpsCallable(functions, 'setUserRole');
      const result = await setUserRole(data);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast({
        title: 'Rol actualizado',
        description: 'El rol del usuario ha sido actualizado',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'No se pudo actualizar el rol',
      });
    },
  });
}

export function useDisableUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { userId: string; disabled: boolean }) => {
      const disableUser = httpsCallable(functions, 'disableUser');
      const result = await disableUser(data);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast({
        title: 'Usuario actualizado',
        description: 'El estado del usuario ha sido actualizado',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'No se pudo actualizar el usuario',
      });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (userId: string) => {
      const deleteUser = httpsCallable(functions, 'deleteUser');
      const result = await deleteUser({ userId });
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast({
        title: 'Usuario eliminado',
        description: 'El usuario ha sido eliminado exitosamente',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'No se pudo eliminar el usuario',
      });
    },
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: async (email: string) => {
      const resetUserPassword = httpsCallable(functions, 'resetUserPassword');
      const result = await resetUserPassword({ email });
      return result.data;
    },
    onSuccess: () => {
      toast({
        title: 'Email enviado',
        description: 'Se ha enviado un email para restablecer la contraseña',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'No se pudo enviar el email',
      });
    },
  });
}

export function useAssignCoach() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { clientId: string; coachId: string }) => {
      const assignCoach = httpsCallable(functions, 'assignCoach');
      const result = await assignCoach(data);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast({
        title: 'Coach asignado',
        description: 'El coach ha sido asignado exitosamente',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'No se pudo asignar el coach',
      });
    },
  });
}
