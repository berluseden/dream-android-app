import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Trophy, Flame, Target, TrendingUp, Award, Zap, Calendar } from 'lucide-react';
import { Loader2 } from 'lucide-react';

interface YearlyStat {
  totalSets: number;
  totalVolume: number;
  adherence: number;
  topExercises: Array<{ name: string; sets: number }>;
  trophies: string[];
}

export default function Yearly() {
  const { user } = useAuth();
  const currentYear = new Date().getFullYear();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['yearly-stats', user?.uid, currentYear],
    queryFn: async () => {
      if (!user?.uid) return null;

      const startDate = new Date(currentYear, 0, 1);
      const endDate = new Date(currentYear, 11, 31);

      // Get all workouts of the year
      const workoutsQuery = query(
        collection(db, 'workouts'),
        where('user_id', '==', user.uid),
        where('completed_at', '>=', Timestamp.fromDate(startDate)),
        where('completed_at', '<=', Timestamp.fromDate(endDate))
      );

      const workoutsSnapshot = await getDocs(workoutsQuery);
      const workoutIds = workoutsSnapshot.docs.map(doc => doc.id);

      // Calculate adherence
      const totalPlanned = workoutsSnapshot.size;
      const totalCompleted = workoutsSnapshot.docs.filter(
        doc => doc.data().status === 'completed'
      ).length;
      const adherence = totalPlanned > 0 
        ? Math.round((totalCompleted / totalPlanned) * 100) 
        : 0;

      // Get all sets
      let totalSets = 0;
      let totalVolume = 0;
      const exerciseCounts: Record<string, { name: string; sets: number }> = {};

      for (const workoutId of workoutIds) {
        const setsQuery = query(
          collection(db, 'sets'),
          where('workout_id', '==', workoutId)
        );
        const setsSnapshot = await getDocs(setsQuery);

        setsSnapshot.docs.forEach(setDoc => {
          const setData = setDoc.data();
          totalSets++;
          totalVolume += setData.load * setData.completed_reps;

          const exerciseId = setData.exercise_id;
          if (!exerciseCounts[exerciseId]) {
            exerciseCounts[exerciseId] = { name: exerciseId, sets: 0 };
          }
          exerciseCounts[exerciseId].sets++;
        });
      }

      // Get top 3 exercises
      const topExercises = Object.values(exerciseCounts)
        .sort((a, b) => b.sets - a.sets)
        .slice(0, 3);

      // Calculate trophies
      const trophies: string[] = [];
      if (adherence >= 90) trophies.push('consistent');
      if (totalSets >= 1000) trophies.push('volume_beast');
      if (adherence >= 95) trophies.push('streak_master');

      return {
        totalSets,
        totalVolume: Math.round(totalVolume),
        adherence,
        topExercises,
        trophies,
      } as YearlyStat;
    },
    enabled: !!user?.uid,
  });

  const getTrophyDetails = (trophy: string) => {
    const trophies: Record<string, { icon: any; name: string; description: string; color: string }> = {
      consistent: {
        icon: Trophy,
        name: 'Consistente',
        description: 'Adherencia ≥90%',
        color: 'text-yellow-600 dark:text-yellow-400',
      },
      volume_beast: {
        icon: Flame,
        name: 'Beast Mode',
        description: '1000+ sets en el año',
        color: 'text-orange-600 dark:text-orange-400',
      },
      streak_master: {
        icon: Zap,
        name: 'Streak Master',
        description: 'Adherencia ≥95%',
        color: 'text-purple-600 dark:text-purple-400',
      },
    };
    return trophies[trophy] || trophies.consistent;
  };

  return (
    <AppLayout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Calendar className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold">{currentYear} en Números</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Tu resumen anual de entrenamiento
          </p>
        </div>

        {isLoading ? (
          <Card>
            <CardContent className="py-24 flex justify-center">
              <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
            </CardContent>
          </Card>
        ) : stats ? (
          <>
            {/* Main Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-primary">
                    <Flame className="h-5 w-5" />
                    Volumen Total
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold">{stats.totalVolume.toLocaleString()} kg</div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Carga total levantada
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-success/10 to-success/5 border-success/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-success">
                    <Target className="h-5 w-5" />
                    Sets Totales
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold">{stats.totalSets}</div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Series completadas
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-warning/10 to-warning/5 border-warning/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-warning">
                    <TrendingUp className="h-5 w-5" />
                    Adherencia
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold">{stats.adherence}%</div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Entrenamientos completados
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Top Exercises */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" />
                  Top 3 Ejercicios
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stats.topExercises.length > 0 ? (
                  <div className="space-y-3">
                    {stats.topExercises.map((exercise, idx) => (
                      <div 
                        key={exercise.name}
                        className="flex items-center justify-between p-3 rounded-lg border"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                            idx === 0 ? 'bg-yellow-500/10 text-yellow-600' :
                            idx === 1 ? 'bg-gray-500/10 text-gray-600' :
                            'bg-orange-500/10 text-orange-600'
                          }`}>
                            {idx + 1}
                          </div>
                          <span className="font-medium">{exercise.name}</span>
                        </div>
                        <Badge variant="outline">{exercise.sets} sets</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No hay ejercicios registrados
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Trophies */}
            {stats.trophies.length > 0 && (
              <Card className="bg-gradient-to-br from-yellow-500/10 to-orange-500/5 border-yellow-500/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-600" />
                    Trofeos Desbloqueados
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {stats.trophies.map(trophy => {
                      const details = getTrophyDetails(trophy);
                      const Icon = details.icon;
                      return (
                        <div 
                          key={trophy}
                          className="flex flex-col items-center text-center p-4 rounded-lg border bg-card"
                        >
                          <Icon className={`h-12 w-12 mb-2 ${details.color}`} />
                          <h3 className="font-bold mb-1">{details.name}</h3>
                          <p className="text-xs text-muted-foreground">
                            {details.description}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <p>No hay datos disponibles para {currentYear}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
