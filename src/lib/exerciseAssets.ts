/**
 * Sistema de Assets Visuales para Ejercicios
 * 
 * URLs de videos demostrativos y diagramas musculares
 * Fuentes: YouTube, Vimeo, recursos educativos fitness
 */

export interface ExerciseAsset {
  exerciseName: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  muscleDiagramUrl?: string;
  gifUrl?: string; // GIF corto para preview rápido
}

/**
 * Base de datos de assets visuales para ejercicios comunes
 * TODO: Poblar con URLs reales de recursos educativos
 */
export const EXERCISE_ASSETS: Record<string, ExerciseAsset> = {
  // ==================== CHEST ====================
  'bench_press': {
    exerciseName: 'Bench Press',
    videoUrl: 'https://www.youtube.com/watch?v=rT7DgCr-3pg', // Ejemplo: Jeff Nippard
    thumbnailUrl: 'https://i.ytimg.com/vi/rT7DgCr-3pg/maxresdefault.jpg',
    muscleDiagramUrl: '/assets/muscles/chest-pectorals.svg',
    gifUrl: 'https://i.pinimg.com/originals/9c/3d/de/9c3dde1e7f0b5d5c5f5c5f5c5f5c5f5c.gif',
  },
  'incline_bench_press': {
    exerciseName: 'Incline Bench Press',
    videoUrl: 'https://www.youtube.com/watch?v=jAq5T4W0kJE',
    thumbnailUrl: 'https://i.ytimg.com/vi/jAq5T4W0kJE/maxresdefault.jpg',
    muscleDiagramUrl: '/assets/muscles/chest-upper.svg',
  },
  'dumbbell_fly': {
    exerciseName: 'Dumbbell Fly',
    videoUrl: 'https://www.youtube.com/watch?v=eozdVDA78K0',
    thumbnailUrl: 'https://i.ytimg.com/vi/eozdVDA78K0/maxresdefault.jpg',
    muscleDiagramUrl: '/assets/muscles/chest-pectorals.svg',
  },

  // ==================== BACK ====================
  'pull_up': {
    exerciseName: 'Pull Up',
    videoUrl: 'https://www.youtube.com/watch?v=eGo4IYlbE5g',
    thumbnailUrl: 'https://i.ytimg.com/vi/eGo4IYlbE5g/maxresdefault.jpg',
    muscleDiagramUrl: '/assets/muscles/back-lats.svg',
  },
  'barbell_row': {
    exerciseName: 'Barbell Row',
    videoUrl: 'https://www.youtube.com/watch?v=6FzSTShq-dE',
    thumbnailUrl: 'https://i.ytimg.com/vi/6FzSTShq-dE/maxresdefault.jpg',
    muscleDiagramUrl: '/assets/muscles/back-full.svg',
  },
  'lat_pulldown': {
    exerciseName: 'Lat Pulldown',
    videoUrl: 'https://www.youtube.com/watch?v=lueEJGjTuPQ',
    thumbnailUrl: 'https://i.ytimg.com/vi/lueEJGjTuPQ/maxresdefault.jpg',
    muscleDiagramUrl: '/assets/muscles/back-lats.svg',
  },

  // ==================== LEGS ====================
  'squat': {
    exerciseName: 'Back Squat',
    videoUrl: 'https://www.youtube.com/watch?v=ultWZbUMPL8',
    thumbnailUrl: 'https://i.ytimg.com/vi/ultWZbUMPL8/maxresdefault.jpg',
    muscleDiagramUrl: '/assets/muscles/legs-quads.svg',
  },
  'deadlift': {
    exerciseName: 'Deadlift',
    videoUrl: 'https://www.youtube.com/watch?v=op9kVnSso6Q',
    thumbnailUrl: 'https://i.ytimg.com/vi/op9kVnSso6Q/maxresdefault.jpg',
    muscleDiagramUrl: '/assets/muscles/posterior-chain.svg',
  },
  'leg_press': {
    exerciseName: 'Leg Press',
    videoUrl: 'https://www.youtube.com/watch?v=IZxyjW7MPJQ',
    thumbnailUrl: 'https://i.ytimg.com/vi/IZxyjW7MPJQ/maxresdefault.jpg',
    muscleDiagramUrl: '/assets/muscles/legs-quads.svg',
  },
  'leg_curl': {
    exerciseName: 'Leg Curl',
    videoUrl: 'https://www.youtube.com/watch?v=ELOCsoDSmrg',
    thumbnailUrl: 'https://i.ytimg.com/vi/ELOCsoDSmrg/maxresdefault.jpg',
    muscleDiagramUrl: '/assets/muscles/legs-hamstrings.svg',
  },

  // ==================== SHOULDERS ====================
  'overhead_press': {
    exerciseName: 'Overhead Press',
    videoUrl: 'https://www.youtube.com/watch?v=2yjwXTZQDDI',
    thumbnailUrl: 'https://i.ytimg.com/vi/2yjwXTZQDDI/maxresdefault.jpg',
    muscleDiagramUrl: '/assets/muscles/shoulders-full.svg',
  },
  'lateral_raise': {
    exerciseName: 'Lateral Raise',
    videoUrl: 'https://www.youtube.com/watch?v=3VcKaXpzqRo',
    thumbnailUrl: 'https://i.ytimg.com/vi/3VcKaXpzqRo/maxresdefault.jpg',
    muscleDiagramUrl: '/assets/muscles/shoulders-lateral.svg',
  },

  // ==================== ARMS ====================
  'bicep_curl': {
    exerciseName: 'Bicep Curl',
    videoUrl: 'https://www.youtube.com/watch?v=ykJmrZ5v0Oo',
    thumbnailUrl: 'https://i.ytimg.com/vi/ykJmrZ5v0Oo/maxresdefault.jpg',
    muscleDiagramUrl: '/assets/muscles/arms-biceps.svg',
  },
  'tricep_extension': {
    exerciseName: 'Tricep Extension',
    videoUrl: 'https://www.youtube.com/watch?v=YbX7Wd8jQ-Q',
    thumbnailUrl: 'https://i.ytimg.com/vi/YbX7Wd8jQ-Q/maxresdefault.jpg',
    muscleDiagramUrl: '/assets/muscles/arms-triceps.svg',
  },
};

/**
 * Obtener asset de ejercicio por nombre (fuzzy match)
 */
export function getExerciseAsset(exerciseName: string): ExerciseAsset | null {
  const normalized = exerciseName.toLowerCase().replace(/[^a-z0-9]/g, '_');
  
  // Búsqueda exacta
  if (EXERCISE_ASSETS[normalized]) {
    return EXERCISE_ASSETS[normalized];
  }
  
  // Búsqueda fuzzy
  const keys = Object.keys(EXERCISE_ASSETS);
  const fuzzyMatch = keys.find(key => 
    normalized.includes(key) || key.includes(normalized.split('_')[0])
  );
  
  if (fuzzyMatch) {
    return EXERCISE_ASSETS[fuzzyMatch];
  }
  
  return null;
}

/**
 * Placeholder assets para ejercicios sin contenido
 */
export const PLACEHOLDER_ASSETS = {
  videoUrl: null,
  thumbnailUrl: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&h=300&fit=crop', // Generic gym
  muscleDiagramUrl: '/assets/muscles/placeholder.svg',
  gifUrl: null,
};

/**
 * Embed URL para diferentes plataformas de video
 */
export function getEmbedUrl(videoUrl: string): string | null {
  if (!videoUrl) return null;
  
  // YouTube
  const youtubeMatch = videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/);
  if (youtubeMatch) {
    return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
  }
  
  // Vimeo
  const vimeoMatch = videoUrl.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }
  
  return videoUrl;
}

/**
 * Iconos de músculo por grupo
 */
export const MUSCLE_ICONS: Record<string, string> = {
  chest: '💪',
  back: '🔙',
  shoulders: '🏔️',
  biceps: '💪',
  triceps: '🦾',
  quads: '🦵',
  hamstrings: '🦵',
  glutes: '🍑',
  calves: '🦶',
  abs: '🎯',
  forearms: '✊',
};

/**
 * Colores de degradado por grupo muscular
 */
export const MUSCLE_GRADIENTS: Record<string, string> = {
  chest: 'from-red-500 to-pink-500',
  back: 'from-blue-500 to-cyan-500',
  shoulders: 'from-orange-500 to-yellow-500',
  biceps: 'from-purple-500 to-pink-500',
  triceps: 'from-indigo-500 to-purple-500',
  quads: 'from-green-500 to-emerald-500',
  hamstrings: 'from-teal-500 to-green-500',
  glutes: 'from-rose-500 to-red-500',
  calves: 'from-amber-500 to-orange-500',
  abs: 'from-violet-500 to-purple-500',
  forearms: 'from-slate-500 to-gray-500',
};
