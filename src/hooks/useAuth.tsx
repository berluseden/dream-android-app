import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';
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
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
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
    const rolesQuery = query(
      collection(db, 'user_roles'),
      where('user_id', '==', uid)
    );
    const rolesSnapshot = await getDocs(rolesQuery);
    
    if (!rolesSnapshot.empty) {
      return rolesSnapshot.docs[0].data().role as UserRole;
    }
    return null;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        const [userProfile, userRole] = await Promise.all([
          fetchProfile(firebaseUser.uid),
          fetchRole(firebaseUser.uid)
        ]);
        
        setProfile(userProfile);
        setRole(userRole);
      } else {
        setProfile(null);
        setRole(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signUp = async (
    email: string, 
    password: string, 
    name: string
  ) => {
    try {
      const { user: newUser } = await createUserWithEmailAndPassword(auth, email, password);
      
      await updateProfile(newUser, { displayName: name });
      
      // Create user profile
      await setDoc(doc(db, 'users', newUser.uid), {
        email,
        name,
        equipment: [],
        level: 'novato',
        experience_years: 0,
        goals: '',
        units: 'kg',
        coach_id: null,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      });
      
      // Assign default role
      await setDoc(doc(collection(db, 'user_roles')), {
        user_id: newUser.uid,
        role: 'user',
      });
      
      toast({
        title: "¡Registro exitoso!",
        description: "Bienvenido a App Hipertrofia",
      });
    } catch (error: any) {
      toast({
        title: "Error de registro",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

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

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const { user: googleUser } = await signInWithPopup(auth, provider);
      
      const existingProfile = await fetchProfile(googleUser.uid);
      
      if (!existingProfile) {
        await setDoc(doc(db, 'users', googleUser.uid), {
          email: googleUser.email,
          name: googleUser.displayName || 'Usuario',
          equipment: [],
          level: 'novato',
          experience_years: 0,
          goals: '',
          units: 'kg',
          coach_id: null,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp(),
        });
        
        await setDoc(doc(collection(db, 'user_roles')), {
          user_id: googleUser.uid,
          role: 'user',
        });
      }
      
      toast({
        title: "¡Sesión iniciada!",
        description: "Bienvenido",
      });
    } catch (error: any) {
      toast({
        title: "Error de Google Sign-In",
        description: error.message,
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
        signUp,
        signIn,
        signInWithGoogle,
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
