import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp, collection, onSnapshot } from 'firebase/firestore';
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

  const fetchProfile = async (uid: string) => {
    const profileDoc = await getDoc(doc(db, 'users', uid));
    if (profileDoc.exists()) {
      return { id: profileDoc.id, ...profileDoc.data() } as UserProfile;
    }
    return null;
  };

  const fetchRole = async (uid: string): Promise<UserRole | null> => {
    try {
      const roleDoc = await getDoc(doc(db, 'user_roles', uid));
      
      if (roleDoc.exists()) {
        return roleDoc.data().role as UserRole;
      }
      
      // Si no existe rol, crear uno por defecto
      console.warn(`No se encontró rol para ${uid}, creando rol 'user' por defecto`);
      await setDoc(doc(db, 'user_roles', uid), {
        role: 'user',
        created_at: serverTimestamp(),
      });
      
      return 'user';
    } catch (error) {
      console.error('Error al obtener rol:', error);
      return 'user'; // Fallback seguro
    }
  };

  useEffect(() => {
    let unsubscribeRole: (() => void) | null = null;
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        try {
          const [userProfile, userRole] = await Promise.all([
            fetchProfile(firebaseUser.uid),
            fetchRole(firebaseUser.uid)
          ]);
          
          setProfile(userProfile);
          setRole(userRole || 'user');
          
          // Listener real-time para cambios de rol
          const roleRef = doc(db, 'user_roles', firebaseUser.uid);
          unsubscribeRole = onSnapshot(
            roleRef, 
            (roleDoc) => {
              if (roleDoc.exists()) {
                const newRole = roleDoc.data().role as UserRole;
                setRole((prevRole) => {
                  if (newRole !== prevRole) {
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
              console.error('Error en listener de rol:', error);
              toast({
                title: "Error al sincronizar rol",
                description: "Por favor recarga la página",
                variant: "destructive",
              });
            }
          );
        } catch (error) {
          console.error('Error al cargar perfil/rol:', error);
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
      if (unsubscribeRole) {
        unsubscribeRole();
      }
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({
        title: "¡Sesión iniciada!",
        description: "Bienvenido de nuevo",
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
      const [updatedProfile, updatedRole] = await Promise.all([
        fetchProfile(user.uid),
        fetchRole(user.uid)
      ]);
      setProfile(updatedProfile);
      setRole(updatedRole);
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
