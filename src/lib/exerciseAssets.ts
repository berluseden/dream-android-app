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
 * Alias comunes (ES -> clave canónica)
 * Permite que nombres en español o variantes mapeen a los assets correctos
 */
const ALIAS_PATTERNS: Array<[string, string]> = [
  ['press_de_banca', 'bench_press'],
  ['press_banca', 'bench_press'],
  ['press_banca_cerrado', 'close_grip_bench_press'],
  ['press_cerrado', 'close_grip_bench_press'],
  ['press_banca_inclinado', 'incline_barbell_press'],
  ['press_inclinado', 'incline_barbell_press'],
  ['press_inclinado_smith', 'incline_smith_press'],
  ['press_declinado', 'decline_bench_press'],
  ['fondos', 'dips'],
  ['fondos_triceps', 'tricep_dips'],
  ['dominadas', 'pull_up'],
  ['dominadas_supinas', 'chin_up'],
  ['dominadas_neutras', 'neutral_grip_pullup'],
  ['jalon_al_pecho', 'lat_pulldown'],
  ['jalon_al_pecho_abierto', 'wide_grip_lat_pulldown'],
  ['jalon_neutro', 'neutral_grip_lat_pulldown'],
  ['remo_con_barra', 'barbell_row'],
  ['remo_con_barra_pendlay', 'pendlay_row'],
  ['remo_pecho_apoyado', 'chest_supported_row'],
  ['remo_t', 't_bar_row'],
  ['remo_meadows', 'meadow_row'],
  ['remo_sello', 'seal_row'],
  ['remo_con_mancuerna', 'single_arm_db_row'],
  ['remo_en_polea', 'cable_row'],
  ['remo_polea', 'cable_row'],
  ['remo_agarre_abierto', 'cable_row_wide'],
  ['remo_menton', 'upright_row'],
  ['elevaciones_laterales', 'lateral_raise'],
  ['elevacion_lateral', 'lateral_raise'],
  ['elevacion_frontal', 'front_raise'],
  ['press_militar', 'overhead_press'],
  ['press_arnold', 'arnold_press'],
  ['sentadilla', 'squat'],
  ['sentadilla_smith', 'smith_squat'],
  ['peso_muerto', 'deadlift'],
  ['peso_muerto_rumano', 'romanian_deadlift'],
  ['peso_muerto_parcial', 'rack_pull'],
  ['sentadilla_frontal', 'front_squat'],
  ['búlgaras', 'bulgarian_split_squat'],
  ['bulgara', 'bulgarian_split_squat'],
  ['zancadas', 'walking_lunge'],
  ['desplantes', 'walking_lunge'],
  ['estocadas', 'walking_lunge'],
  ['curl_con_barra', 'bicep_curl'],
  ['curl_barra_z', 'ez_bar_curl'],
  ['curl_predicador', 'preacher_curl'],
  ['curl_martillo', 'hammer_curl'],
  ['curl_concentracion', 'concentration_curl'],
  ['curl_araña', 'spider_curl'],
  ['press_frances', 'skull_crushers'],
  ['extensiones_de_triceps', 'tricep_extension'],
  ['jalon_de_triceps', 'cable_tricep_pushdown'],
  ['jalon_triceps_cuerda', 'rope_pushdown'],
  ['jalon_triceps_invertido', 'reverse_grip_pushdown'],
  ['extensiones_sobre_cabeza', 'cable_overhead_tricep_extension'],
  ['aperturas', 'dumbbell_fly'],
  ['aperturas_inclinadas', 'incline_dumbbell_fly'],
  ['peck_deck', 'pec_deck'],
  ['hip_thrust', 'hip_thrust'],
  ['elevacion_de_pantorrillas', 'calf_raise_standing'],
  ['pantorrilla_sentado', 'calf_raise_seated'],
  ['gemelos_prensa', 'leg_press_calf_raise'],
  ['extension_de_cuadriceps', 'leg_extension'],
  ['curl_femoral_sentado', 'seated_leg_curl'],
  ['curl_femoral_tumbado', 'lying_leg_curl'],
  ['pullover_polea', 'straight_arm_pulldown'],
  ['abduccion_cadera', 'hip_abduction'],
  ['aduccion_cadera', 'hip_adduction'],
  ['encogimientos', 'shrug'],
  ['crunch_polea', 'cable_crunch'],
  ['elevaciones_piernas_colgado', 'hanging_leg_raise'],
  ['rueda_abdominal', 'ab_wheel_rollout'],
  ['plancha_lateral', 'side_plank'],
];

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
  'close_grip_bench_press': {
    exerciseName: 'Close-Grip Bench Press',
    videoUrl: 'https://www.youtube.com/watch?v=EVfq6b1444A',
    thumbnailUrl: 'https://i.ytimg.com/vi/EVfq6b1444A/maxresdefault.jpg',
    muscleDiagramUrl: '/assets/muscles/chest-triceps.svg',
  },
  'decline_bench_press': {
    exerciseName: 'Decline Bench Press',
    videoUrl: 'https://www.youtube.com/watch?v=QhZ5A1d6V2g',
    thumbnailUrl: 'https://i.ytimg.com/vi/QhZ5A1d6V2g/maxresdefault.jpg',
    muscleDiagramUrl: '/assets/muscles/chest-lower.svg',
  },
  'incline_barbell_press': {
    exerciseName: 'Incline Barbell Press',
    videoUrl: 'https://www.youtube.com/watch?v=SrqOu55lrYU',
    thumbnailUrl: 'https://i.ytimg.com/vi/SrqOu55lrYU/maxresdefault.jpg',
    muscleDiagramUrl: '/assets/muscles/chest-upper.svg',
  },
  'incline_bench_press': {
    exerciseName: 'Incline Bench Press',
    videoUrl: 'https://www.youtube.com/watch?v=jAq5T4W0kJE',
    thumbnailUrl: 'https://i.ytimg.com/vi/jAq5T4W0kJE/maxresdefault.jpg',
    muscleDiagramUrl: '/assets/muscles/chest-upper.svg',
  },
  'incline_dumbbell_fly': {
    exerciseName: 'Incline Dumbbell Fly',
    videoUrl: 'https://www.youtube.com/watch?v=bDaIL_zKbGs',
    thumbnailUrl: 'https://i.ytimg.com/vi/bDaIL_zKbGs/maxresdefault.jpg',
    muscleDiagramUrl: '/assets/muscles/chest-upper.svg',
  },
  'dumbbell_fly': {
    exerciseName: 'Dumbbell Fly',
    videoUrl: 'https://www.youtube.com/watch?v=eozdVDA78K0',
    thumbnailUrl: 'https://i.ytimg.com/vi/eozdVDA78K0/maxresdefault.jpg',
    muscleDiagramUrl: '/assets/muscles/chest-pectorals.svg',
  },
  'incline_dumbbell_press': {
    exerciseName: 'Incline Dumbbell Press',
    videoUrl: 'https://www.youtube.com/watch?v=8iPEnn-ltC8',
    thumbnailUrl: 'https://i.ytimg.com/vi/8iPEnn-ltC8/maxresdefault.jpg',
    muscleDiagramUrl: '/assets/muscles/chest-upper.svg',
  },
  'flat_dumbbell_press': {
    exerciseName: 'Flat Dumbbell Press',
    videoUrl: 'https://www.youtube.com/watch?v=VmB1G1K7v94',
    thumbnailUrl: 'https://i.ytimg.com/vi/VmB1G1K7v94/maxresdefault.jpg',
    muscleDiagramUrl: '/assets/muscles/chest-pectorals.svg',
  },
  'dips': {
    exerciseName: 'Dips',
    videoUrl: 'https://www.youtube.com/watch?v=2z8JmcrW-As',
    thumbnailUrl: 'https://i.ytimg.com/vi/2z8JmcrW-As/maxresdefault.jpg',
    muscleDiagramUrl: '/assets/muscles/chest-triceps.svg',
  },
  'tricep_dips': {
    exerciseName: 'Tricep Dips',
    videoUrl: 'https://www.youtube.com/watch?v=0326dy_-CzM',
    thumbnailUrl: 'https://i.ytimg.com/vi/0326dy_-CzM/maxresdefault.jpg',
    muscleDiagramUrl: '/assets/muscles/arms-triceps.svg',
  },
  'pec_deck': {
    exerciseName: 'Pec Deck',
    videoUrl: 'https://www.youtube.com/watch?v=v8Qh0nGZP0w',
    thumbnailUrl: 'https://i.ytimg.com/vi/v8Qh0nGZP0w/maxresdefault.jpg',
    muscleDiagramUrl: '/assets/muscles/chest-pectorals.svg',
  },
  'machine_chest_press': {
    exerciseName: 'Machine Chest Press',
    videoUrl: 'https://www.youtube.com/watch?v=KfQ2m4qS7C8',
    thumbnailUrl: 'https://i.ytimg.com/vi/KfQ2m4qS7C8/maxresdefault.jpg',
    muscleDiagramUrl: '/assets/muscles/chest-pectorals.svg',
  },
  'incline_smith_press': {
    exerciseName: 'Incline Smith Press',
    videoUrl: 'https://www.youtube.com/watch?v=Z1FQq6F6v10',
    thumbnailUrl: 'https://i.ytimg.com/vi/Z1FQq6F6v10/maxresdefault.jpg',
    muscleDiagramUrl: '/assets/muscles/chest-upper.svg',
  },
  'smith_squat': {
    exerciseName: 'Smith Squat',
    videoUrl: 'https://www.youtube.com/watch?v=r-cg2M8wQWw',
    thumbnailUrl: 'https://i.ytimg.com/vi/r-cg2M8wQWw/maxresdefault.jpg',
    muscleDiagramUrl: '/assets/muscles/legs-quads.svg',
  },
  'cable_fly_high': {
    exerciseName: 'Cable Fly (High)',
    videoUrl: 'https://www.youtube.com/watch?v=5a6G6W2nqNU',
    thumbnailUrl: 'https://i.ytimg.com/vi/5a6G6W2nqNU/maxresdefault.jpg',
    muscleDiagramUrl: '/assets/muscles/chest-pectorals.svg',
  },
  'cable_fly_mid': {
    exerciseName: 'Cable Fly (Mid)',
    videoUrl: 'https://www.youtube.com/watch?v=2qQ2tL0kYq0',
    thumbnailUrl: 'https://i.ytimg.com/vi/2qQ2tL0kYq0/maxresdefault.jpg',
    muscleDiagramUrl: '/assets/muscles/chest-pectorals.svg',
  },
  'cable_fly_low': {
    exerciseName: 'Cable Fly (Low)',
    videoUrl: 'https://www.youtube.com/watch?v=U8gGQpS6Hpw',
    thumbnailUrl: 'https://i.ytimg.com/vi/U8gGQpS6Hpw/maxresdefault.jpg',
    muscleDiagramUrl: '/assets/muscles/chest-lower.svg',
  },

  // ==================== BACK ====================
  'pull_up': {
    exerciseName: 'Pull Up',
    videoUrl: 'https://www.youtube.com/watch?v=eGo4IYlbE5g',
    thumbnailUrl: 'https://i.ytimg.com/vi/eGo4IYlbE5g/maxresdefault.jpg',
    muscleDiagramUrl: '/assets/muscles/back-lats.svg',
  },
  'chin_up': {
    exerciseName: 'Chin Up',
    videoUrl: 'https://www.youtube.com/watch?v=b-ztMQPJ9M0',
    thumbnailUrl: 'https://i.ytimg.com/vi/b-ztMQPJ9M0/maxresdefault.jpg',
    muscleDiagramUrl: '/assets/muscles/back-lats.svg',
  },
  'neutral_grip_pullup': {
    exerciseName: 'Neutral-Grip Pull-Up',
    videoUrl: 'https://www.youtube.com/watch?v=RcCe3s8xLPQ',
    thumbnailUrl: 'https://i.ytimg.com/vi/RcCe3s8xLPQ/maxresdefault.jpg',
    muscleDiagramUrl: '/assets/muscles/back-lats.svg',
  },
  'barbell_row': {
    exerciseName: 'Barbell Row',
    videoUrl: 'https://www.youtube.com/watch?v=6FzSTShq-dE',
    thumbnailUrl: 'https://i.ytimg.com/vi/6FzSTShq-dE/maxresdefault.jpg',
    muscleDiagramUrl: '/assets/muscles/back-full.svg',
  },
  'pendlay_row': {
    exerciseName: 'Pendlay Row',
    videoUrl: 'https://www.youtube.com/watch?v=8O2q_RgeGio',
    thumbnailUrl: 'https://i.ytimg.com/vi/8O2q_RgeGio/maxresdefault.jpg',
    muscleDiagramUrl: '/assets/muscles/back-full.svg',
  },
  'lat_pulldown': {
    exerciseName: 'Lat Pulldown',
    videoUrl: 'https://www.youtube.com/watch?v=lueEJGjTuPQ',
    thumbnailUrl: 'https://i.ytimg.com/vi/lueEJGjTuPQ/maxresdefault.jpg',
    muscleDiagramUrl: '/assets/muscles/back-lats.svg',
  },
  'wide_grip_lat_pulldown': {
    exerciseName: 'Wide-Grip Lat Pulldown',
    videoUrl: 'https://www.youtube.com/watch?v=CAwf7n6Luuc',
    thumbnailUrl: 'https://i.ytimg.com/vi/CAwf7n6Luuc/maxresdefault.jpg',
    muscleDiagramUrl: '/assets/muscles/back-lats.svg',
  },
  'neutral_grip_lat_pulldown': {
    exerciseName: 'Neutral-Grip Lat Pulldown',
    videoUrl: 'https://www.youtube.com/watch?v=QJb8uEujOo0',
    thumbnailUrl: 'https://i.ytimg.com/vi/QJb8uEujOo0/maxresdefault.jpg',
    muscleDiagramUrl: '/assets/muscles/back-lats.svg',
  },
  'cable_row': {
    exerciseName: 'Seated Cable Row',
    videoUrl: 'https://www.youtube.com/watch?v=GZbfZ033f74',
    thumbnailUrl: 'https://i.ytimg.com/vi/GZbfZ033f74/maxresdefault.jpg',
    muscleDiagramUrl: '/assets/muscles/back-full.svg',
  },
  'rear_delt_fly': {
    exerciseName: 'Rear Delt Fly',
    videoUrl: 'https://www.youtube.com/watch?v=0G2_XV7slIg',
    thumbnailUrl: 'https://i.ytimg.com/vi/0G2_XV7slIg/maxresdefault.jpg',
    muscleDiagramUrl: '/assets/muscles/shoulders-rear.svg',
  },
  't_bar_row': {
    exerciseName: 'T-Bar Row',
    videoUrl: 'https://www.youtube.com/watch?v=QFq5j1KzF6U',
    thumbnailUrl: 'https://i.ytimg.com/vi/QFq5j1KzF6U/maxresdefault.jpg',
    muscleDiagramUrl: '/assets/muscles/back-full.svg',
  },
  'chest_supported_row': {
    exerciseName: 'Chest Supported Row',
    videoUrl: 'https://www.youtube.com/watch?v=3v-w8FfBq9w',
    thumbnailUrl: 'https://i.ytimg.com/vi/3v-w8FfBq9w/maxresdefault.jpg',
    muscleDiagramUrl: '/assets/muscles/back-full.svg',
  },
  'single_arm_db_row': {
    exerciseName: 'Single-Arm Dumbbell Row',
    videoUrl: 'https://www.youtube.com/watch?v=pYcpY20QaE8',
    thumbnailUrl: 'https://i.ytimg.com/vi/pYcpY20QaE8/maxresdefault.jpg',
    muscleDiagramUrl: '/assets/muscles/back-full.svg',
  },
  'cable_row_wide': {
    exerciseName: 'Cable Row (Wide Grip)',
    videoUrl: 'https://www.youtube.com/watch?v=0YjC5vJuJr8',
    thumbnailUrl: 'https://i.ytimg.com/vi/0YjC5vJuJr8/maxresdefault.jpg',
    muscleDiagramUrl: '/assets/muscles/back-full.svg',
  },
  'straight_arm_pulldown': {
    exerciseName: 'Straight-Arm Pulldown',
    videoUrl: 'https://www.youtube.com/watch?v=2-LAMcpzODU',
    thumbnailUrl: 'https://i.ytimg.com/vi/2-LAMcpzODU/maxresdefault.jpg',
    muscleDiagramUrl: '/assets/muscles/back-lats.svg',
  },
  'meadow_row': {
    exerciseName: 'Meadow Row',
    videoUrl: 'https://www.youtube.com/watch?v=07I7wF1c0Ac',
    thumbnailUrl: 'https://i.ytimg.com/vi/07I7wF1c0Ac/maxresdefault.jpg',
    muscleDiagramUrl: '/assets/muscles/back-full.svg',
  },
  'seal_row': {
    exerciseName: 'Seal Row',
    videoUrl: 'https://www.youtube.com/watch?v=bPJjGgWUx9o',
    thumbnailUrl: 'https://i.ytimg.com/vi/bPJjGgWUx9o/maxresdefault.jpg',
    muscleDiagramUrl: '/assets/muscles/back-full.svg',
  },
  'rack_pull': {
    exerciseName: 'Rack Pull',
    videoUrl: 'https://www.youtube.com/watch?v=QTEQvYYvMp0',
    thumbnailUrl: 'https://i.ytimg.com/vi/QTEQvYYvMp0/maxresdefault.jpg',
    muscleDiagramUrl: '/assets/muscles/posterior-chain.svg',
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
  'romanian_deadlift': {
    exerciseName: 'Romanian Deadlift',
    videoUrl: 'https://www.youtube.com/watch?v=2SHsk9AzdjA',
    thumbnailUrl: 'https://i.ytimg.com/vi/2SHsk9AzdjA/maxresdefault.jpg',
    muscleDiagramUrl: '/assets/muscles/legs-hamstrings.svg',
  },
  'front_squat': {
    exerciseName: 'Front Squat',
    videoUrl: 'https://www.youtube.com/watch?v=kuQy1Y6jXTY',
    thumbnailUrl: 'https://i.ytimg.com/vi/kuQy1Y6jXTY/maxresdefault.jpg',
    muscleDiagramUrl: '/assets/muscles/legs-quads.svg',
  },
  'bulgarian_split_squat': {
    exerciseName: 'Bulgarian Split Squat',
    videoUrl: 'https://www.youtube.com/watch?v=2C-uNgKwPLE',
    thumbnailUrl: 'https://i.ytimg.com/vi/2C-uNgKwPLE/maxresdefault.jpg',
    muscleDiagramUrl: '/assets/muscles/legs-quads.svg',
  },
  'walking_lunge': {
    exerciseName: 'Walking Lunge',
    videoUrl: 'https://www.youtube.com/watch?v=QOVaHwm-Q6U',
    thumbnailUrl: 'https://i.ytimg.com/vi/QOVaHwm-Q6U/maxresdefault.jpg',
    muscleDiagramUrl: '/assets/muscles/legs-quads.svg',
  },
  'reverse_lunge': {
    exerciseName: 'Reverse Lunge',
    videoUrl: 'https://www.youtube.com/watch?v=Z2Nn4wq06eE',
    thumbnailUrl: 'https://i.ytimg.com/vi/Z2Nn4wq06eE/maxresdefault.jpg',
    muscleDiagramUrl: '/assets/muscles/legs-quads.svg',
  },
  'hack_squat': {
    exerciseName: 'Hack Squat (Machine)',
    videoUrl: 'https://www.youtube.com/watch?v=-6Z4kJk8gZk',
    thumbnailUrl: 'https://i.ytimg.com/vi/-6Z4kJk8gZk/maxresdefault.jpg',
    muscleDiagramUrl: '/assets/muscles/legs-quads.svg',
  },
  'leg_extension': {
    exerciseName: 'Leg Extension',
    videoUrl: 'https://www.youtube.com/watch?v=YyvSfVjQeL0',
    thumbnailUrl: 'https://i.ytimg.com/vi/YyvSfVjQeL0/maxresdefault.jpg',
    muscleDiagramUrl: '/assets/muscles/legs-quads.svg',
  },
  'leg_press': {
    exerciseName: 'Leg Press',
    videoUrl: 'https://www.youtube.com/watch?v=IZxyjW7MPJQ',
    thumbnailUrl: 'https://i.ytimg.com/vi/IZxyjW7MPJQ/maxresdefault.jpg',
    muscleDiagramUrl: '/assets/muscles/legs-quads.svg',
  },
  'leg_press_close': {
    exerciseName: 'Leg Press (Close Stance)',
    videoUrl: 'https://www.youtube.com/watch?v=4G4G8BLqtVA',
    thumbnailUrl: 'https://i.ytimg.com/vi/4G4G8BLqtVA/maxresdefault.jpg',
    muscleDiagramUrl: '/assets/muscles/legs-quads.svg',
  },
  'leg_press_wide': {
    exerciseName: 'Leg Press (Wide Stance)',
    videoUrl: 'https://www.youtube.com/watch?v=fhD0o9L7sTs',
    thumbnailUrl: 'https://i.ytimg.com/vi/fhD0o9L7sTs/maxresdefault.jpg',
    muscleDiagramUrl: '/assets/muscles/legs-quads.svg',
  },
  'leg_curl': {
    exerciseName: 'Leg Curl',
    videoUrl: 'https://www.youtube.com/watch?v=ELOCsoDSmrg',
    thumbnailUrl: 'https://i.ytimg.com/vi/ELOCsoDSmrg/maxresdefault.jpg',
    muscleDiagramUrl: '/assets/muscles/legs-hamstrings.svg',
  },
  'seated_leg_curl': {
    exerciseName: 'Seated Leg Curl',
    videoUrl: 'https://www.youtube.com/watch?v=1Tq3QdYUuHs',
    thumbnailUrl: 'https://i.ytimg.com/vi/1Tq3QdYUuHs/maxresdefault.jpg',
    muscleDiagramUrl: '/assets/muscles/legs-hamstrings.svg',
  },
  'lying_leg_curl': {
    exerciseName: 'Lying Leg Curl',
    videoUrl: 'https://www.youtube.com/watch?v=Qw9l6s9OQOA',
    thumbnailUrl: 'https://i.ytimg.com/vi/Qw9l6s9OQOA/maxresdefault.jpg',
    muscleDiagramUrl: '/assets/muscles/legs-hamstrings.svg',
  },
  'hip_thrust': {
    exerciseName: 'Hip Thrust',
    videoUrl: 'https://www.youtube.com/watch?v=LM8XHLYJoYs',
    thumbnailUrl: 'https://i.ytimg.com/vi/LM8XHLYJoYs/maxresdefault.jpg',
    muscleDiagramUrl: '/assets/muscles/glutes.svg',
  },
  'smith_hip_thrust': {
    exerciseName: 'Hip Thrust (Smith)',
    videoUrl: 'https://www.youtube.com/watch?v=JwK9xI6Qjmk',
    thumbnailUrl: 'https://i.ytimg.com/vi/JwK9xI6Qjmk/maxresdefault.jpg',
    muscleDiagramUrl: '/assets/muscles/glutes.svg',
  },
  'glute_bridge': {
    exerciseName: 'Glute Bridge',
    videoUrl: 'https://www.youtube.com/watch?v=m2Zx-0m6Lq4',
    thumbnailUrl: 'https://i.ytimg.com/vi/m2Zx-0m6Lq4/maxresdefault.jpg',
    muscleDiagramUrl: '/assets/muscles/glutes.svg',
  },
  'cable_pull_through': {
    exerciseName: 'Cable Pull Through',
    videoUrl: 'https://www.youtube.com/watch?v=3gT1fQ2LQ7E',
    thumbnailUrl: 'https://i.ytimg.com/vi/3gT1fQ2LQ7E/maxresdefault.jpg',
    muscleDiagramUrl: '/assets/muscles/posterior-chain.svg',
  },
  'back_extensions': {
    exerciseName: 'Back Extensions',
    videoUrl: 'https://www.youtube.com/watch?v=ph3pddpKzzw',
    thumbnailUrl: 'https://i.ytimg.com/vi/ph3pddpKzzw/maxresdefault.jpg',
    muscleDiagramUrl: '/assets/muscles/posterior-chain.svg',
  },
  'hip_abduction': {
    exerciseName: 'Hip Abduction (Machine)',
    videoUrl: 'https://www.youtube.com/watch?v=Z7e7R2J9gWQ',
    thumbnailUrl: 'https://i.ytimg.com/vi/Z7e7R2J9gWQ/maxresdefault.jpg',
    muscleDiagramUrl: '/assets/muscles/glutes.svg',
  },
  'hip_adduction': {
    exerciseName: 'Hip Adduction (Machine)',
    videoUrl: 'https://www.youtube.com/watch?v=R4rKp2nRz3M',
    thumbnailUrl: 'https://i.ytimg.com/vi/R4rKp2nRz3M/maxresdefault.jpg',
    muscleDiagramUrl: '/assets/muscles/legs-adductors.svg',
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
  'cable_lateral_raise': {
    exerciseName: 'Cable Lateral Raise',
    videoUrl: 'https://www.youtube.com/watch?v=5XJ7LQeD-2A',
    thumbnailUrl: 'https://i.ytimg.com/vi/5XJ7LQeD-2A/maxresdefault.jpg',
    muscleDiagramUrl: '/assets/muscles/shoulders-lateral.svg',
  },
  'front_raise': {
    exerciseName: 'Front Raise',
    videoUrl: 'https://www.youtube.com/watch?v=-t7fuZ0KhDA',
    thumbnailUrl: 'https://i.ytimg.com/vi/-t7fuZ0KhDA/maxresdefault.jpg',
    muscleDiagramUrl: '/assets/muscles/shoulders-front.svg',
  },
  'upright_row': {
    exerciseName: 'Upright Row',
    videoUrl: 'https://www.youtube.com/watch?v=4c3H1a7QmzA',
    thumbnailUrl: 'https://i.ytimg.com/vi/4c3H1a7QmzA/maxresdefault.jpg',
    muscleDiagramUrl: '/assets/muscles/shoulders-lateral.svg',
  },
  'arnold_press': {
    exerciseName: 'Arnold Press',
    videoUrl: 'https://www.youtube.com/watch?v=vj2w851ZHRM',
    thumbnailUrl: 'https://i.ytimg.com/vi/vj2w851ZHRM/maxresdefault.jpg',
    muscleDiagramUrl: '/assets/muscles/shoulders-full.svg',
  },
  'face_pulls': {
    exerciseName: 'Face Pulls',
    videoUrl: 'https://www.youtube.com/watch?v=rep-qVOkqgk',
    thumbnailUrl: 'https://i.ytimg.com/vi/rep-qVOkqgk/maxresdefault.jpg',
    muscleDiagramUrl: '/assets/muscles/shoulders-rear.svg',
  },
  'machine_lateral_raise': {
    exerciseName: 'Machine Lateral Raise',
    videoUrl: 'https://www.youtube.com/watch?v=7qysqSeX3uU',
    thumbnailUrl: 'https://i.ytimg.com/vi/7qysqSeX3uU/maxresdefault.jpg',
    muscleDiagramUrl: '/assets/muscles/shoulders-lateral.svg',
  },
  'reverse_pec_deck': {
    exerciseName: 'Reverse Pec Deck',
    videoUrl: 'https://www.youtube.com/watch?v=GZbfZ033f74&t=180s',
    thumbnailUrl: 'https://i.ytimg.com/vi/GZbfZ033f74/maxresdefault.jpg',
    muscleDiagramUrl: '/assets/muscles/shoulders-rear.svg',
  },
  'rear_delt_row': {
    exerciseName: 'Rear Delt Row',
    videoUrl: 'https://www.youtube.com/watch?v=Q_F0IW8Cw0o',
    thumbnailUrl: 'https://i.ytimg.com/vi/Q_F0IW8Cw0o/maxresdefault.jpg',
    muscleDiagramUrl: '/assets/muscles/shoulders-rear.svg',
  },
  'shrug': {
    exerciseName: 'Barbell Shrug',
    videoUrl: 'https://www.youtube.com/watch?v=1oed-UmAxFs',
    thumbnailUrl: 'https://i.ytimg.com/vi/1oed-UmAxFs/maxresdefault.jpg',
    muscleDiagramUrl: '/assets/muscles/neck-traps.svg',
  },

  // ==================== ARMS ====================
  'bicep_curl': {
    exerciseName: 'Bicep Curl',
    videoUrl: 'https://www.youtube.com/watch?v=ykJmrZ5v0Oo',
    thumbnailUrl: 'https://i.ytimg.com/vi/ykJmrZ5v0Oo/maxresdefault.jpg',
    muscleDiagramUrl: '/assets/muscles/arms-biceps.svg',
  },
  'ez_bar_curl': {
    exerciseName: 'EZ-Bar Curl',
    videoUrl: 'https://www.youtube.com/watch?v=TWJp14tkBLc',
    thumbnailUrl: 'https://i.ytimg.com/vi/TWJp14tkBLc/maxresdefault.jpg',
    muscleDiagramUrl: '/assets/muscles/arms-biceps.svg',
  },
  'incline_dumbbell_curl': {
    exerciseName: 'Incline Dumbbell Curl',
    videoUrl: 'https://www.youtube.com/watch?v=soxrZlIl35U',
    thumbnailUrl: 'https://i.ytimg.com/vi/soxrZlIl35U/maxresdefault.jpg',
    muscleDiagramUrl: '/assets/muscles/arms-biceps.svg',
  },
  'hammer_curl': {
    exerciseName: 'Hammer Curl',
    videoUrl: 'https://www.youtube.com/watch?v=zC3nLlEvin4',
    thumbnailUrl: 'https://i.ytimg.com/vi/zC3nLlEvin4/maxresdefault.jpg',
    muscleDiagramUrl: '/assets/muscles/arms-biceps.svg',
  },
  'cable_curl': {
    exerciseName: 'Cable Curl',
    videoUrl: 'https://www.youtube.com/watch?v=d4v1JkJd9_0',
    thumbnailUrl: 'https://i.ytimg.com/vi/d4v1JkJd9_0/maxresdefault.jpg',
    muscleDiagramUrl: '/assets/muscles/arms-biceps.svg',
  },
  'preacher_curl': {
    exerciseName: 'Preacher Curl',
    videoUrl: 'https://www.youtube.com/watch?v=ZKBLq9u5H1M',
    thumbnailUrl: 'https://i.ytimg.com/vi/ZKBLq9u5H1M/maxresdefault.jpg',
    muscleDiagramUrl: '/assets/muscles/arms-biceps.svg',
  },
  'concentration_curl': {
    exerciseName: 'Concentration Curl',
    videoUrl: 'https://www.youtube.com/watch?v=soxrZlIl35U&t=45s',
    thumbnailUrl: 'https://i.ytimg.com/vi/soxrZlIl35U/maxresdefault.jpg',
    muscleDiagramUrl: '/assets/muscles/arms-biceps.svg',
  },
  'spider_curl': {
    exerciseName: 'Spider Curl',
    videoUrl: 'https://www.youtube.com/watch?v=8H6y4YtYh0w',
    thumbnailUrl: 'https://i.ytimg.com/vi/8H6y4YtYh0w/maxresdefault.jpg',
    muscleDiagramUrl: '/assets/muscles/arms-biceps.svg',
  },
  'tricep_extension': {
    exerciseName: 'Tricep Extension',
    videoUrl: 'https://www.youtube.com/watch?v=YbX7Wd8jQ-Q',
    thumbnailUrl: 'https://i.ytimg.com/vi/YbX7Wd8jQ-Q/maxresdefault.jpg',
    muscleDiagramUrl: '/assets/muscles/arms-triceps.svg',
  },
  'cable_tricep_pushdown': {
    exerciseName: 'Cable Tricep Pushdown',
    videoUrl: 'https://www.youtube.com/watch?v=0PxaG3N-iY8',
    thumbnailUrl: 'https://i.ytimg.com/vi/0PxaG3N-iY8/maxresdefault.jpg',
    muscleDiagramUrl: '/assets/muscles/arms-triceps.svg',
  },
  'rope_pushdown': {
    exerciseName: 'Rope Pushdown',
    videoUrl: 'https://www.youtube.com/watch?v=vB5OHsJ3EME',
    thumbnailUrl: 'https://i.ytimg.com/vi/vB5OHsJ3EME/maxresdefault.jpg',
    muscleDiagramUrl: '/assets/muscles/arms-triceps.svg',
  },
  'reverse_grip_pushdown': {
    exerciseName: 'Reverse-Grip Pushdown',
    videoUrl: 'https://www.youtube.com/watch?v=VFYK0M_9Jxk',
    thumbnailUrl: 'https://i.ytimg.com/vi/VFYK0M_9Jxk/maxresdefault.jpg',
    muscleDiagramUrl: '/assets/muscles/arms-triceps.svg',
  },
  'overhead_tricep_extension': {
    exerciseName: 'Overhead Tricep Extension',
    videoUrl: 'https://www.youtube.com/watch?v=_gsUck-7M74',
    thumbnailUrl: 'https://i.ytimg.com/vi/_gsUck-7M74/maxresdefault.jpg',
    muscleDiagramUrl: '/assets/muscles/arms-triceps.svg',
  },
  'cable_overhead_tricep_extension': {
    exerciseName: 'Cable Overhead Tricep Extension',
    videoUrl: 'https://www.youtube.com/watch?v=75gMZp7sR2s',
    thumbnailUrl: 'https://i.ytimg.com/vi/75gMZp7sR2s/maxresdefault.jpg',
    muscleDiagramUrl: '/assets/muscles/arms-triceps.svg',
  },
  'skull_crushers': {
    exerciseName: 'Skull Crushers',
    videoUrl: 'https://www.youtube.com/watch?v=d_KZxkY_0cM',
    thumbnailUrl: 'https://i.ytimg.com/vi/d_KZxkY_0cM/maxresdefault.jpg',
    muscleDiagramUrl: '/assets/muscles/arms-triceps.svg',
  },
  'jm_press': {
    exerciseName: 'JM Press',
    videoUrl: 'https://www.youtube.com/watch?v=Bhquuh4j8v4',
    thumbnailUrl: 'https://i.ytimg.com/vi/Bhquuh4j8v4/maxresdefault.jpg',
    muscleDiagramUrl: '/assets/muscles/arms-triceps.svg',
  },

  // ==================== CALVES ====================
  'calf_raise_standing': {
    exerciseName: 'Calf Raise (Standing)',
    videoUrl: 'https://www.youtube.com/watch?v=YMmgqO8Jo-k',
    thumbnailUrl: 'https://i.ytimg.com/vi/YMmgqO8Jo-k/maxresdefault.jpg',
    muscleDiagramUrl: '/assets/muscles/calves.svg',
  },
  'calf_raise_seated': {
    exerciseName: 'Calf Raise (Seated)',
    videoUrl: 'https://www.youtube.com/watch?v=YMmgqO8Jo-k&t=40s',
    thumbnailUrl: 'https://i.ytimg.com/vi/YMmgqO8Jo-k/maxresdefault.jpg',
    muscleDiagramUrl: '/assets/muscles/calves.svg',
  },
  'leg_press_calf_raise': {
    exerciseName: 'Leg Press Calf Raise',
    videoUrl: 'https://www.youtube.com/watch?v=C617HqAqvBM',
    thumbnailUrl: 'https://i.ytimg.com/vi/C617HqAqvBM/maxresdefault.jpg',
    muscleDiagramUrl: '/assets/muscles/calves.svg',
  },

  // ==================== CORE ====================
  'hanging_leg_raise': {
    exerciseName: 'Hanging Leg Raise',
    videoUrl: 'https://www.youtube.com/watch?v=HDfvWrGUkC8',
    thumbnailUrl: 'https://i.ytimg.com/vi/HDfvWrGUkC8/maxresdefault.jpg',
    muscleDiagramUrl: '/assets/muscles/abs.svg',
  },
  'cable_crunch': {
    exerciseName: 'Cable Crunch',
    videoUrl: 'https://www.youtube.com/watch?v=vkKCVCZe474',
    thumbnailUrl: 'https://i.ytimg.com/vi/vkKCVCZe474/maxresdefault.jpg',
    muscleDiagramUrl: '/assets/muscles/abs.svg',
  },
  'ab_wheel_rollout': {
    exerciseName: 'Ab Wheel Rollout',
    videoUrl: 'https://www.youtube.com/watch?v=rQlC0b3WJcY',
    thumbnailUrl: 'https://i.ytimg.com/vi/rQlC0b3WJcY/maxresdefault.jpg',
    muscleDiagramUrl: '/assets/muscles/abs.svg',
  },
  'plank': {
    exerciseName: 'Plank',
    videoUrl: 'https://www.youtube.com/watch?v=pSHjTRCQxIw',
    thumbnailUrl: 'https://i.ytimg.com/vi/pSHjTRCQxIw/maxresdefault.jpg',
    muscleDiagramUrl: '/assets/muscles/abs.svg',
  },
  'side_plank': {
    exerciseName: 'Side Plank',
    videoUrl: 'https://www.youtube.com/watch?v=K2VljzCC16g',
    thumbnailUrl: 'https://i.ytimg.com/vi/K2VljzCC16g/maxresdefault.jpg',
    muscleDiagramUrl: '/assets/muscles/abs-obliques.svg',
  },
};

/**
 * Obtener asset de ejercicio por nombre (fuzzy match)
 */
export function getExerciseAsset(exerciseName: string): ExerciseAsset | null {
  const normalized = exerciseName.toLowerCase().replace(/[^a-z0-9]/g, '_');

  // Mapear alias en español/variantes a clave canónica
  for (const [pattern, target] of ALIAS_PATTERNS) {
    if (normalized.includes(pattern) && EXERCISE_ASSETS[target]) {
      return EXERCISE_ASSETS[target];
    }
  }
  
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
