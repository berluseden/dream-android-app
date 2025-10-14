import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Check, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExerciseThumbnail {
  id: string;
  name: string;
  completedSets: number;
  totalSets: number;
  muscleGroup: string;
}

interface ExerciseThumbnailCarouselProps {
  exercises: ExerciseThumbnail[];
  activeExerciseId: string;
  onExerciseClick: (id: string) => void;
}

export function ExerciseThumbnailCarousel({
  exercises,
  activeExerciseId,
  onExerciseClick,
}: ExerciseThumbnailCarouselProps) {
  return (
    <ScrollArea className="w-full whitespace-nowrap">
      <div className="flex gap-3 p-4">
        {exercises.map((exercise) => {
          const isActive = exercise.id === activeExerciseId;
          const isCompleted = exercise.completedSets >= exercise.totalSets && exercise.totalSets > 0;
          const isInProgress = exercise.completedSets > 0 && exercise.completedSets < exercise.totalSets;
          
          return (
            <button
              key={exercise.id}
              onClick={() => onExerciseClick(exercise.id)}
              className={cn(
                "flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all min-w-[120px]",
                isActive && "border-primary bg-primary/5",
                !isActive && "border-border hover:border-primary/50"
              )}
            >
              <div className="relative">
                <div
                  className={cn(
                    "w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold",
                    isCompleted && "bg-primary text-primary-foreground",
                    isInProgress && "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400",
                    !isCompleted && !isInProgress && "bg-muted text-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-8 w-8" />
                  ) : isInProgress ? (
                    <Circle className="h-8 w-8 fill-current" />
                  ) : (
                    <Circle className="h-8 w-8" />
                  )}
                </div>
              </div>
              
              <div className="text-center space-y-1">
                <p className="text-xs font-medium line-clamp-2">{exercise.name}</p>
                <Badge variant="secondary" className="text-xs">
                  {exercise.completedSets}/{exercise.totalSets}
                </Badge>
              </div>
            </button>
          );
        })}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
