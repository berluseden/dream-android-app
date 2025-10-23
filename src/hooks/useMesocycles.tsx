import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  orderBy,
  serverTimestamp,
  writeBatch,
  getDoc,
  limit,
  Timestamp,
  addDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { addDays, addWeeks, format } from 'date-fns';
import type { ProgramTemplate } from './usePrograms';

export interface Mesocycle {
  id: string;
  user_id: string;
  coach_id: string | null;
  template_id?: string;           // Vinculación con programa
  name: string;
  start_date: Date;
  length_weeks: number;
  specialization: string[];
  effort_scale: 'RIR' | 'RPE';
  status: 'planned' | 'active' | 'completed' | 'paused';
  created_at: Date;
  updated_at: Date;
  created_by: string;
  last_modified_by: string;
}

export interface WeeklyTarget {
  id: string;
  mesocycle_id: string;
  muscle_id: string;
  week_number: number;
  sets_min: number;
  sets_max: number;
  sets_target: number;
  actual_sets: number;
}

export function useMesocycles(userId?: string) {
  const { user } = useAuth();
  const targetUserId = userId || user?.uid;
  
  return useQuery({
    queryKey: ['mesocycles', targetUserId],
    queryFn: async () => {
      if (!targetUserId) return [];
      
      const q = query(
        collection(db, 'mesocycles'),
        where('user_id', '==', targetUserId),
        orderBy('start_date', 'desc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        start_date: doc.data().start_date?.toDate(),
        created_at: doc.data().created_at?.toDate(),
        updated_at: doc.data().updated_at?.toDate(),
      })) as Mesocycle[];
    },
    enabled: !!targetUserId,
    staleTime: 0, // Always refetch to get latest data
  });
}

export function useActiveMesocycle(userId?: string) {
  const { user } = useAuth();
  const targetUserId = userId || user?.uid;
  
  return useQuery({
    queryKey: ['active-mesocycle', targetUserId],
    queryFn: async () => {
      if (!targetUserId) return null;
      
      console.log('🔍 Buscando mesociclo activo para user:', targetUserId);
      
      const q = query(
        collection(db, 'mesocycles'),
        where('user_id', '==', targetUserId),
        where('status', '==', 'active')
      );
      
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        console.log('❌ No se encontró mesociclo activo');
        return null;
      }
      
      const doc = snapshot.docs[0];
      const mesocycleData = {
        id: doc.id,
        ...doc.data(),
        start_date: doc.data().start_date?.toDate(),
        created_at: doc.data().created_at?.toDate(),
        updated_at: doc.data().updated_at?.toDate(),
      } as Mesocycle;
      
      console.log('✅ Mesociclo activo encontrado:', mesocycleData.name, mesocycleData.id);
      return mesocycleData;
    },
    enabled: !!targetUserId,
    staleTime: 0, // ✅ CORREGIDO: Always refetch to get latest data
  });
}

export function useMesocycle(mesocycleId: string | undefined) {
  return useQuery({
    queryKey: ['mesocycle', mesocycleId],
    queryFn: async () => {
      if (!mesocycleId) return null;
      
      const docRef = doc(db, 'mesocycles', mesocycleId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) return null;
      
      return {
        id: docSnap.id,
        ...docSnap.data(),
        start_date: docSnap.data().start_date?.toDate(),
        created_at: docSnap.data().created_at?.toDate(),
        updated_at: docSnap.data().updated_at?.toDate(),
      } as Mesocycle;
    },
    enabled: !!mesocycleId,
  });
}

export function useWeeklyTargets(mesocycleId: string) {
  return useQuery({
    queryKey: ['weekly-targets', mesocycleId],
    queryFn: async () => {
      const q = query(
        collection(db, 'weekly_targets'),
        where('mesocycle_id', '==', mesocycleId),
        orderBy('week_number', 'asc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as WeeklyTarget[];
    },
    enabled: !!mesocycleId,
  });
}

export function useCreateMesocycle() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (data: {
      user_id: string;
      name: string;
      start_date: Date;
      length_weeks: number;
      specialization: string[];
      effort_scale: 'RIR' | 'RPE';
      template_id: string; // ✅ CORREGIDO: Ya no es opcional
      targets: Array<{
        muscle_id: string;
        sets_min: number;
        sets_max: number;
        sets_target: number;
      }>;
    }) => {
      // ✅ VALIDACIÓN: Template es obligatorio
      if (!data.template_id || data.template_id.trim() === '') {
        throw new Error('Debes seleccionar un programa de entrenamiento');
      }
      
      // ✅ VALIDACIÓN: Verificar que no haya otro mesociclo activo
      const activeQuery = query(
        collection(db, 'mesocycles'),
        where('user_id', '==', data.user_id),
        where('status', '==', 'active')
      );
      const activeSnap = await getDocs(activeQuery);
      
      if (!activeSnap.empty) {
        const activeMeso = activeSnap.docs[0].data();
        throw new Error(`Ya tienes un mesociclo activo: "${activeMeso.name}". Complétalo o páusalo primero.`);
      }
      
      const batch = writeBatch(db);
      
      // Create mesocycle
      const mesoRef = doc(collection(db, 'mesocycles'));
      batch.set(mesoRef, {
        user_id: data.user_id,
        coach_id: null,
        template_id: data.template_id, // ✅ Ya no usa || '' porque es obligatorio
        name: data.name,
        start_date: data.start_date,
        length_weeks: data.length_weeks,
        specialization: data.specialization,
        effort_scale: data.effort_scale,
        status: 'active',
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
        created_by: user?.uid || '',
        last_modified_by: user?.uid || '',
      });
      
      // Create weekly targets with progression
      for (let week = 1; week <= data.length_weeks; week++) {
        for (const target of data.targets) {
          const progression = 
            week <= 1 ? 0.6 :
            week <= 2 ? 0.7 :
            week <= 3 ? 0.8 :
            week <= 4 ? 0.9 :
            week <= 5 ? 1.0 : 0.5;
          
          const targetRef = doc(collection(db, 'weekly_targets'));
          batch.set(targetRef, {
            mesocycle_id: mesoRef.id,
            muscle_id: target.muscle_id,
            week_number: week,
            sets_min: Math.floor(target.sets_min * progression),
            sets_max: Math.ceil(target.sets_max * progression),
            sets_target: Math.round(target.sets_target * progression),
            actual_sets: 0,
          });
        }
      }
      
      await batch.commit();
      
      console.log('✅ Mesociclo guardado en Firestore:', mesoRef.id);
      
      // ✨ Generate workouts AFTER batch commit (ahora siempre hay template)
      // Show loading toast
      toast({
        title: "Generando entrenamientos...",
        description: "Esto puede tomar unos segundos",
      });
      
      try {
          // ✅ CORREGIDO: Si el template es local, guardarlo en Firestore primero
          let actualTemplateId = data.template_id;
          
          if (data.template_id.startsWith('local-')) {
            console.log('🔄 Template local detectado, guardando en Firestore...');
            
            // Importar dinámicamente el módulo de usePrograms
            const { getLocalTemplates } = await import('@/hooks/usePrograms');
            const localTemplates = getLocalTemplates();
            
            // Obtener el índice del template local
            const localIndex = parseInt(data.template_id.split('-')[1]);
            const localTemplate = localTemplates[localIndex];
            
            if (localTemplate) {
              // Guardar en Firestore (sin el ID local)
              const { id, ...templateData } = localTemplate;
              const templatesRef = collection(db, 'templates');
              const newTemplateDoc = await addDoc(templatesRef, {
                ...templateData,
                created_at: serverTimestamp(),
                created_by: data.user_id,
              });
              
              actualTemplateId = newTemplateDoc.id;
              
              // Actualizar el mesociclo con el ID real
              await updateDoc(doc(db, 'mesocycles', mesoRef.id), {
                template_id: actualTemplateId,
              });
              
              console.log('✅ Template guardado en Firestore:', actualTemplateId);
            } else {
              throw new Error('Template local no encontrado en índice: ' + localIndex);
            }
          }
          
          const workoutsGenerated = await generateWorkoutsFromTemplate(
            mesoRef.id,
            actualTemplateId,
            data.start_date,
            data.length_weeks,
            data.user_id
          );
          
          toast({
            title: "✅ Entrenamientos creados",
            description: `Se generaron ${workoutsGenerated} entrenamientos exitosamente`,
          });
      } catch (error: any) {
        console.error('❌ Error generating workouts:', error);
        
        // ✅ Si falla la generación de workouts, eliminar el mesociclo
        await deleteDoc(doc(db, 'mesocycles', mesoRef.id));
        
        throw new Error(error.message || "Error al generar los entrenamientos. Por favor, intenta de nuevo.");
      }
      
      return { id: mesoRef.id };
    },
    onSuccess: async (result) => {
      console.log('🎉 onSuccess llamado, invalidando queries...');
      
      // ✅ CORREGIDO: Invalidar TODAS las queries de mesociclos
      await queryClient.invalidateQueries({ queryKey: ['mesocycles'] });
      await queryClient.invalidateQueries({ queryKey: ['active-mesocycle'] });
      await queryClient.invalidateQueries({ queryKey: ['mesocycle'] });
      
      console.log('🔄 Refetching queries...');
      
      // Refetch para asegurar que los datos estén disponibles
      await queryClient.refetchQueries({ queryKey: ['mesocycles'] });
      await queryClient.refetchQueries({ queryKey: ['active-mesocycle'] });
      
      console.log('✅ Queries actualizadas correctamente');
      
      toast({
        title: "Mesociclo creado",
        description: "Tu plan de entrenamiento ha sido creado exitosamente",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateMesocycleStatus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ mesocycleId, status }: { mesocycleId: string; status: string }) => {
      await updateDoc(doc(db, 'mesocycles', mesocycleId), {
        status,
        updated_at: serverTimestamp(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mesocycles'] });
      queryClient.invalidateQueries({ queryKey: ['active-mesocycle'] });
      toast({
        title: "Estado actualizado",
      });
    },
  });
}

export function useDeleteMesocycle() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (mesocycleId: string) => {
      // ✅ VALIDACIÓN: No permitir eliminar mesociclo activo
      const mesoDoc = await getDoc(doc(db, 'mesocycles', mesocycleId));
      if (!mesoDoc.exists()) {
        throw new Error('Mesociclo no encontrado');
      }
      
      const mesoData = mesoDoc.data();
      if (mesoData.status === 'active') {
        throw new Error('No puedes eliminar un mesociclo activo. Primero páusalo o complétalo.');
      }
      
      const batch = writeBatch(db);
      
      // 1. Eliminar mesociclo
      batch.delete(doc(db, 'mesocycles', mesocycleId));
      
      // 2. Eliminar weekly_targets asociados
      const targetsQuery = query(
        collection(db, 'weekly_targets'),
        where('mesocycle_id', '==', mesocycleId)
      );
      const targetsSnap = await getDocs(targetsQuery);
      targetsSnap.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      
      // 3. Eliminar workouts asociados
      const workoutsQuery = query(
        collection(db, 'workouts'),
        where('mesocycle_id', '==', mesocycleId)
      );
      const workoutsSnap = await getDocs(workoutsQuery);
      const workoutIds = workoutsSnap.docs.map(d => d.id);
      
      workoutsSnap.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      
      // 4. Eliminar workout_exercises de esos workouts
      for (const workoutId of workoutIds) {
        const exercisesQuery = query(
          collection(db, 'workout_exercises'),
          where('workout_id', '==', workoutId)
        );
        const exercisesSnap = await getDocs(exercisesQuery);
        exercisesSnap.docs.forEach((doc) => {
          batch.delete(doc.ref);
        });
      }
      
      // 5. Eliminar sets asociados
      for (const workoutId of workoutIds) {
        const setsQuery = query(
          collection(db, 'sets'),
          where('workout_id', '==', workoutId)
        );
        const setsSnap = await getDocs(setsQuery);
        setsSnap.docs.forEach((doc) => {
          batch.delete(doc.ref);
        });
      }
      
      await batch.commit();
      
      return { deletedWorkouts: workoutIds.length };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['mesocycles'] });
      queryClient.invalidateQueries({ queryKey: ['active-mesocycle'] });
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      
      toast({
        title: "Mesociclo eliminado",
        description: `Se eliminaron ${result.deletedWorkouts} entrenamientos asociados`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error al eliminar",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

/**
 * 🆕 Hook para regenerar workouts de un mesociclo
 */
export function useRegenerateWorkouts() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (mesocycleId: string) => {
      // 1. Obtener el mesociclo
      const mesoDoc = await getDoc(doc(db, 'mesocycles', mesocycleId));
      if (!mesoDoc.exists()) {
        throw new Error('Mesociclo no encontrado');
      }
      
      const mesoData = mesoDoc.data();
      const templateId = mesoData.template_id;
      
      if (!templateId) {
        throw new Error('Este mesociclo no tiene un programa asociado');
      }
      
      // 2. Eliminar workouts existentes (si los hay)
      const workoutsQuery = query(
        collection(db, 'workouts'),
        where('mesocycle_id', '==', mesocycleId)
      );
      const workoutsSnap = await getDocs(workoutsQuery);
      
      const batch = writeBatch(db);
      for (const workoutDoc of workoutsSnap.docs) {
        // Eliminar workout_exercises y sets asociados
        const exercisesQuery = query(
          collection(db, 'workout_exercises'),
          where('workout_id', '==', workoutDoc.id)
        );
        const exercisesSnap = await getDocs(exercisesQuery);
        exercisesSnap.docs.forEach(d => batch.delete(d.ref));
        
        const setsQuery = query(
          collection(db, 'sets'),
          where('workout_id', '==', workoutDoc.id)
        );
        const setsSnap = await getDocs(setsQuery);
        setsSnap.docs.forEach(d => batch.delete(d.ref));
        
        batch.delete(workoutDoc.ref);
      }
      await batch.commit();
      
      // 3. Regenerar workouts
      const workoutsGenerated = await generateWorkoutsFromTemplate(
        mesocycleId,
        templateId,
        mesoData.start_date.toDate(),
        mesoData.length_weeks,
        mesoData.user_id
      );
      
      return workoutsGenerated;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      toast({
        title: "✅ Entrenamientos regenerados",
        description: `Se generaron ${count} entrenamientos exitosamente`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error al regenerar",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Helper Functions para generación automática de workouts

/**
 * Genera todos los workouts de un mesociclo basado en un template de programa
 * @returns número de workouts generados
 */
async function generateWorkoutsFromTemplate(
  mesocycleId: string,
  templateId: string,
  startDate: Date,
  weeks: number,
  userId: string
): Promise<number> {
  console.log('🚀 Iniciando generación de workouts:', { mesocycleId, templateId, weeks });
  
  try {
    // ✅ Obtener el template del programa
    const templateRef = doc(db, 'templates', templateId);
    const templateSnap = await getDoc(templateRef);
    
    if (!templateSnap.exists()) {
      console.error('❌ Template no encontrado:', templateId);
      throw new Error(`Template no encontrado: ${templateId}`);
    }
    
    const template = templateSnap.data() as ProgramTemplate;
    console.log('✅ Template obtenido:', template.name);
    
    // ✅ Validar que el template tenga sesiones
    const sessions = template.sessions || [];
    if (sessions.length === 0) {
      console.error('❌ Template sin sesiones:', templateId);
      throw new Error(`El template "${template.name}" no tiene sesiones configuradas`);
    }
    
    console.log(`📋 Sesiones encontradas: ${sessions.length}`);
    
    const trainingDays = getTrainingSchedule(template.days_per_week);
    let workoutsCreated = 0;
    
    // Generar workouts para cada semana
    for (let week = 0; week < weeks; week++) {
      const weekStart = addWeeks(startDate, week);
      console.log(`📅 Generando semana ${week + 1}/${weeks}`);
      
      // Para cada día de entrenamiento
      for (let dayIdx = 0; dayIdx < trainingDays.length; dayIdx++) {
        const dayOffset = trainingDays[dayIdx];
        const workoutDate = addDays(weekStart, dayOffset);
        const daySession = sessions[dayIdx % sessions.length];
        
        if (!daySession) {
          console.warn(`⚠️ Sesión no encontrada para día ${dayIdx}`);
          continue;
        }
        
        // Crear el documento workout
        const workoutRef = doc(collection(db, 'workouts'));
        const workoutData = {
          id: workoutRef.id,
          user_id: userId,
          mesocycle_id: mesocycleId,
          name: daySession.name || `Día ${dayIdx + 1}`,
          description: '',
          scheduled_date: Timestamp.fromDate(workoutDate),
          week_number: week + 1,
          day_number: dayIdx + 1,
          status: 'scheduled',
          created_at: serverTimestamp(),
          updated_at: serverTimestamp(),
        };
        
        // Guardar workout (await para garantizar que existe antes de crear exercises)
        await setDoc(workoutRef, workoutData);
        workoutsCreated++;
        console.log(`  ✅ Workout creado: ${workoutData.name} (${format(workoutDate, 'dd/MM')})`);
        
        // Crear workout_exercises para cada ejercicio del día
        if (daySession.blocks && daySession.blocks.length > 0) {
          let exercisesAdded = 0;
          
          for (let exIndex = 0; exIndex < daySession.blocks.length; exIndex++) {
            const block = daySession.blocks[exIndex];
            
            // Buscar el exercise_id real basado en el nombre
            const exerciseName = block.exercise_name || block.exercise;
            const exerciseId = await findExerciseIdByName(exerciseName);
            
            if (!exerciseId) {
              console.warn(`    ⚠️ Ejercicio no encontrado: "${exerciseName}"`);
              continue;
            }
            
            const workoutExRef = doc(collection(db, 'workout_exercises'));
            const repRange = block.rep_range_min && block.rep_range_max 
              ? `${block.rep_range_min}-${block.rep_range_max}`
              : Array.isArray(block.rep_range) 
                ? block.rep_range.join('-') 
                : String(block.rep_range || '8-12');
            
            const workoutExData = {
              id: workoutExRef.id,
              workout_id: workoutRef.id,
              user_id: userId,
              exercise_id: exerciseId,
              order_index: exIndex,
              target_sets: block.sets,
              target_reps: repRange,
              target_rir: block.rir_target || 2,
              notes: '',
              created_at: serverTimestamp(),
            };
            
            await setDoc(workoutExRef, workoutExData);
            exercisesAdded++;
          }
          
          console.log(`    💪 ${exercisesAdded}/${daySession.blocks.length} ejercicios agregados`);
        }
      }
    }
    
    console.log(`✅ Generación completada: ${workoutsCreated} workouts creados`);
    return workoutsCreated;
  } catch (error) {
    console.error('❌ Error generating workouts:', error);
    throw error;
  }
}

/**
 * Mapea la frecuencia de entrenamiento a días de la semana
 * Retorna array con índices de días (0 = Lunes, 6 = Domingo)
 */
function getTrainingSchedule(frequency: number): number[] {
  const schedules: { [key: number]: number[] } = {
    3: [0, 2, 4],        // Lun, Mie, Vie
    4: [0, 1, 3, 4],     // Lun, Mar, Jue, Vie
    5: [0, 1, 2, 3, 4],  // Lun-Vie
    6: [0, 1, 2, 3, 4, 5], // Lun-Sab
  };
  
  return schedules[frequency] || [0, 2, 4]; // Default 3 días
}

/**
 * Busca el ID de un ejercicio por su nombre (con matching fuzzy)
 */
async function findExerciseIdByName(exerciseName: string): Promise<string | null> {
  try {
    const exercisesRef = collection(db, 'exercises');
    const q = query(exercisesRef, limit(100));
    const snapshot = await getDocs(q);
    
    // Función de normalización mejorada
    const normalize = (str: string) => 
      str.toLowerCase()
         .trim()
         .replace(/[()]/g, '')
         .replace(/\s+/g, ' ')
         .replace(/á/g, 'a')
         .replace(/é/g, 'e')
         .replace(/í/g, 'i')
         .replace(/ó/g, 'o')
         .replace(/ú/g, 'u');
    
    const normalizedSearch = normalize(exerciseName);
    const searchWords = normalizedSearch.split(' ');
    
    // 1. Match exacto
    for (const doc of snapshot.docs) {
      const data = doc.data();
      if (data.name && normalize(data.name) === normalizedSearch) {
        console.log(`✅ Match exacto: "${exerciseName}" → "${data.name}"`);
        return doc.id;
      }
    }
    
    // 2. Match parcial (todas las palabras presentes)
    for (const doc of snapshot.docs) {
      const data = doc.data();
      if (!data.name) continue;
      
      const exerciseNormalized = normalize(data.name);
      const allWordsPresent = searchWords.every(word => 
        exerciseNormalized.includes(word)
      );
      
      if (allWordsPresent) {
        console.log(`✅ Match parcial: "${exerciseName}" → "${data.name}"`);
        return doc.id;
      }
    }
    
    // 3. Fuzzy matching (al menos 70% de palabras coinciden)
    for (const doc of snapshot.docs) {
      const data = doc.data();
      if (!data.name) continue;
      
      const exerciseWords = normalize(data.name).split(' ');
      const matchCount = searchWords.filter(word =>
        exerciseWords.some(exWord => 
          exWord.includes(word) || word.includes(exWord)
        )
      ).length;
      
      const matchRatio = matchCount / searchWords.length;
      if (matchRatio >= 0.7) {
        console.log(`⚠️ Fuzzy match (${Math.round(matchRatio * 100)}%): "${exerciseName}" → "${data.name}"`);
        return doc.id;
      }
    }
    
    console.warn(`❌ No se encontró ejercicio para: "${exerciseName}"`);
    return null;
  } catch (error) {
    console.error('Error finding exercise:', error);
    return null;
  }
}
