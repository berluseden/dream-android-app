import { useState } from 'react';
import { Exercise } from '@/types/user.types';
import { getExerciseAsset, getEmbedUrl, MUSCLE_GRADIENTS, PLACEHOLDER_ASSETS } from '@/lib/exerciseAssets';
import { OptimizedImage } from '@/components/ui/optimized-image';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Play, BookOpen, Target, Zap, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScaleOnHover } from '@/components/layout/PageTransition';

interface ExerciseGalleryCardProps {
  exercise: Exercise;
  onClick?: () => void;
}

/**
 * Card de ejercicio con thumbnail, video y detalles
 */
export function ExerciseGalleryCard({ exercise, onClick }: ExerciseGalleryCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const asset = getExerciseAsset(exercise.name) || PLACEHOLDER_ASSETS;
  const thumbnailUrl = exercise.thumbnail_url || asset.thumbnailUrl;
  const gradient = MUSCLE_GRADIENTS[exercise.prime_muscle] || 'from-gray-500 to-slate-500';

  return (
    <>
      <ScaleOnHover>
        <div
          onClick={() => setShowDetails(true)}
          className="group relative overflow-hidden rounded-xl bg-card border border-border hover:border-primary/50 transition-all cursor-pointer h-[280px]"
        >
          {/* Thumbnail Background */}
          <div className="absolute inset-0">
            <OptimizedImage
              src={thumbnailUrl || ''}
              alt={exercise.name}
              className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          </div>

          {/* Gradient Accent */}
          <div className={cn(
            "absolute top-0 left-0 right-0 h-1 bg-gradient-to-r",
            gradient
          )} />

          {/* Content */}
          <div className="relative h-full p-4 flex flex-col justify-between">
            {/* Top Badges */}
            <div className="flex items-start justify-between">
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="secondary" className="backdrop-blur-sm bg-background/80">
                  {exercise.difficulty}
                </Badge>
                {exercise.is_compound && (
                  <Badge variant="outline" className="backdrop-blur-sm bg-background/80">
                    <Zap className="h-3 w-3 mr-1" />
                    Compuesto
                  </Badge>
                )}
              </div>
              
              {(exercise.video_url || asset.videoUrl) && (
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-8 w-8 backdrop-blur-sm bg-background/80"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDetails(true);
                  }}
                >
                  <Play className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Bottom Info */}
            <div className="space-y-2">
              <h3 className="font-bold text-lg text-white leading-tight line-clamp-2">
                {exercise.name}
              </h3>
              
              <p className="text-sm text-white/80 line-clamp-2">
                {exercise.description}
              </p>

              {/* Equipment Tags */}
              <div className="flex flex-wrap gap-1">
                {exercise.equipment.slice(0, 3).map((eq: string) => (
                  <span
                    key={eq}
                    className="px-2 py-0.5 text-xs bg-white/20 backdrop-blur-sm text-white rounded-full"
                  >
                    {eq}
                  </span>
                ))}
                {exercise.equipment.length > 3 && (
                  <span className="px-2 py-0.5 text-xs bg-white/20 backdrop-blur-sm text-white rounded-full">
                    +{exercise.equipment.length - 3}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        </div>
      </ScaleOnHover>

      {/* Details Dialog */}
      <ExerciseDetailsDialog
        exercise={exercise}
        open={showDetails}
        onOpenChange={setShowDetails}
      />
    </>
  );
}

/**
 * Dialog con detalles completos del ejercicio
 */
interface ExerciseDetailsDialogProps {
  exercise: Exercise;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function ExerciseDetailsDialog({ exercise, open, onOpenChange }: ExerciseDetailsDialogProps) {
  const asset = getExerciseAsset(exercise.name) || PLACEHOLDER_ASSETS;
  const videoUrl = exercise.video_url || asset.videoUrl;
  const embedUrl = videoUrl ? getEmbedUrl(videoUrl) : null;
  const gradient = MUSCLE_GRADIENTS[exercise.prime_muscle] || 'from-gray-500 to-slate-500';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1 flex-1">
              <DialogTitle className="text-2xl">{exercise.name}</DialogTitle>
              <DialogDescription>
                Músculo principal: <span className="font-semibold">{exercise.prime_muscle}</span>
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Video Embed */}
          {embedUrl && (
            <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
              <iframe
                src={embedUrl}
                title={exercise.name}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 w-full h-full"
              />
            </div>
          )}

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-muted/50 space-y-1">
              <div className="text-xs text-muted-foreground">Dificultad</div>
              <div className="font-semibold capitalize">{exercise.difficulty}</div>
            </div>
            <div className="p-3 rounded-lg bg-muted/50 space-y-1">
              <div className="text-xs text-muted-foreground">Tipo</div>
              <div className="font-semibold">
                {exercise.is_compound ? 'Compuesto' : 'Aislamiento'}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-muted/50 space-y-1">
              <div className="text-xs text-muted-foreground">Reps</div>
              <div className="font-semibold">
                {exercise.default_reps_min}-{exercise.default_reps_max || 12}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-muted/50 space-y-1">
              <div className="text-xs text-muted-foreground">Descanso</div>
              <div className="font-semibold">
                {exercise.default_rest_seconds ? `${exercise.default_rest_seconds}s` : '60-90s'}
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              <h3 className="font-semibold">Descripción</h3>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              {exercise.description}
            </p>
          </div>

          {/* Instructions */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              <h3 className="font-semibold">Instrucciones</h3>
            </div>
            <div className="space-y-2">
              {exercise.instructions.split('\n').map((instruction, i) => (
                <div key={i} className="flex gap-3 text-muted-foreground">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold">
                    {i + 1}
                  </div>
                  <p className="pt-0.5">{instruction}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Equipment */}
          <div className="space-y-2">
            <h3 className="font-semibold">Equipamiento necesario</h3>
            <div className="flex flex-wrap gap-2">
              {exercise.equipment.map((eq: string) => (
                <Badge key={eq} variant="outline">
                  {eq}
                </Badge>
              ))}
            </div>
          </div>

          {/* Secondary Muscles */}
          {exercise.secondary_muscles && exercise.secondary_muscles.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold">Músculos secundarios</h3>
              <div className="flex flex-wrap gap-2">
                {exercise.secondary_muscles.map((muscle: string) => (
                  <Badge key={muscle} variant="secondary">
                    {muscle}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
