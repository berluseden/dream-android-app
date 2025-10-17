import { useState } from 'react';
import { useExercises, useMuscles } from '@/hooks/useExercises';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Play, Loader2, Grid3x3, List } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { ExerciseGalleryCard } from '@/components/exercises/ExerciseGalleryCard';
import { FadeIn, StaggerChildren, StaggerItem } from '@/components/layout/PageTransition';

export default function Exercises() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const { data: muscles } = useMuscles();
  const { data: exercises, isLoading } = useExercises({
    muscleId: selectedMuscle !== 'all' ? selectedMuscle : undefined,
    difficulty: selectedDifficulty !== 'all' ? selectedDifficulty : undefined,
  });
  
  const filteredExercises = exercises?.filter(ex =>
    ex.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <AppLayout>
      <div className="container mx-auto p-6 space-y-6">
        <FadeIn>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Biblioteca de Ejercicios
              </h1>
              <p className="text-muted-foreground">
                {filteredExercises?.length || 0} ejercicios disponibles
              </p>
            </div>

            {/* View Toggle */}
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('grid')}
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </FadeIn>
        
        <FadeIn delay={0.1}>
          <Card className="glass-card">
            <CardContent className="pt-6 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar ejercicios por nombre..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select value={selectedMuscle} onValueChange={setSelectedMuscle}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los músculos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los músculos</SelectItem>
                    {muscles?.map(muscle => (
                      <SelectItem key={muscle.id} value={muscle.id}>
                        {muscle.display_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                  <SelectTrigger>
                    <SelectValue placeholder="Dificultad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las dificultades</SelectItem>
                    <SelectItem value="beginner">🌱 Principiante</SelectItem>
                    <SelectItem value="intermediate">💪 Intermedio</SelectItem>
                    <SelectItem value="advanced">🔥 Avanzado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </FadeIn>
        
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Cargando ejercicios...</p>
          </div>
        ) : filteredExercises && filteredExercises.length > 0 ? (
          <StaggerChildren staggerDelay={0.05}>
            <div className={
              viewMode === 'grid' 
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                : "space-y-4"
            }>
              {filteredExercises.map(exercise => (
                <StaggerItem key={exercise.id}>
                  <ExerciseGalleryCard exercise={exercise} />
                </StaggerItem>
              ))}
            </div>
          </StaggerChildren>
        ) : (
          <Card className="p-12">
            <div className="text-center space-y-2">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-lg font-semibold">No se encontraron ejercicios</h3>
              <p className="text-muted-foreground">
                Intenta ajustar los filtros o buscar con otros términos
              </p>
            </div>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
