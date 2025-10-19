import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { UserProfile, UserRole } from '@/types/user.types';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  role: UserRole | null;
  loading: boolean;
  isAdmin: boolean;
  isCoach: boolean;
  isClient: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchProfile = async (uid: string): Promise<UserProfile | null> => {
    try {
      const profileDoc = await getDoc(doc(db, 'users', uid));
      if (profileDoc.exists()) {
        const data = profileDoc.data();
        const userRole = (data?.role as UserRole) || 'user';
        console.log(`✅ Perfil y rol obtenidos para ${uid}: role=${userRole}`);
        return {
          id: profileDoc.id,
          ...data,
          role: userRole,
        } as UserProfile;
      }
      console.warn(`⚠️  Perfil no encontrado para ${uid}`);
      return null;
    } catch (error) {
      console.error('❌ Error al obtener perfil:', error);
      return null;
    }
  };

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        try {
          // Carga inicial del perfil
          const userProfile = await fetchProfile(firebaseUser.uid);
          const profileRole = (userProfile?.role as UserRole) || 'user';

          setProfile(userProfile);
          setRole(profileRole);

          // Listener real-time para cambios en el perfil (incluyendo rol)
          const userRef = doc(db, 'users', firebaseUser.uid);
          unsubscribeProfile = onSnapshot(
            userRef,
            (userDoc) => {
              if (userDoc.exists()) {
                const userData = userDoc.data();
                const newRole = (userData?.role as UserRole) || 'user';
                const updatedProfile = {
                  id: userDoc.id,
                  ...userData,
                  role: newRole,
                } as UserProfile;

                console.log(`🔄 Perfil actualizado en tiempo real - rol: ${newRole}`);
                setProfile(updatedProfile);
                setRole((prevRole) => {
                  if (newRole !== prevRole) {
                    console.log(`📢 Cambio de rol detectado: ${prevRole} → ${newRole}`);
                    toast({
                      title: "Tu rol ha sido actualizado",
                      description: `Ahora eres: ${newRole}`,
                    });
                  }
                  return newRole;
                });
              }
            },
            (error) => {
              console.error('❌ Error en listener de perfil:', error);
              toast({
                title: "Error al sincronizar perfil",
                description: "Por favor recarga la página",
                variant: "destructive",
              });
            }
          );
        } catch (error) {
          console.error('Error al cargar perfil:', error);
        } finally {
          setLoading(false);
        }
      } else {
        setProfile(null);
        setRole(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
      if (unsubscribeProfile) {
        unsubscribeProfile();
      }
    };
  }, [toast]);

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({
        title: "¡Bienvenido!",
        description: "Iniciando sesión...",
      });
    } catch (error: any) {
      toast({
        title: "Error de inicio de sesión",
        description: "Email o contraseña incorrectos",
        variant: "destructive",
      });
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      toast({
        title: "Sesión cerrada",
        description: "Hasta pronto",
      });
    } catch (error: any) {
      toast({
        title: "Error al cerrar sesión",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const refreshProfile = async () => {
    if (user) {
      console.log(`🔄 Refrescando perfil para ${user.uid}`);
      const updatedProfile = await fetchProfile(user.uid);
      if (updatedProfile) {
        const updatedRole = updatedProfile.role || 'user';
        console.log(`✅ Perfil refrescado - rol: ${updatedRole}`);
        setProfile(updatedProfile);
        setRole(updatedRole);
      }
    }
  };

  const isAdmin = role === 'admin';
  const isCoach = role === 'coach';
  const isClient = role === 'user';

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role,
        loading,
        isAdmin,
        isCoach,
        isClient,
        signIn,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
