export interface Category {
  id: number;
  name: string;
}

export interface Muscle {
  id: number;
  name: string;
  name_en: string;
}

export interface Translation {
  id: number;
  name: string;
  language: number;
  description: string;
}

export interface Equipment {
  id: number;
  name: string;
}

export interface ExerciseImage {
  id: number;
  image: string;
  is_main: boolean;
}

export interface Exercise {
  id: number;
  uuid: string;
  category: Category;
  muscles: Muscle[];
  muscles_secondary: Muscle[];
  translations: Translation[];
  equipment: Equipment[];
  images: ExerciseImage[];
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ProgramExercise {
  exercise: Exercise;
  sets: string;
  reps: string;
  weight: string;
}

export interface Program {
  id: string;
  name: string;
  exercises: ProgramExercise[];
  createdAt: number;
}

export interface CompletedSet {
  actualReps: string;
  actualWeight: string;
  completedAt: number;
}

export interface ExerciseLog {
  exercise: Exercise;
  targetSets: string;
  targetReps: string;
  targetWeight: string;
  sets: CompletedSet[];
}

export interface WorkoutSession {
  id: string;
  programId: string;
  programName: string;
  startedAt: number;
  finishedAt: number;
  durationSeconds: number;
  logs: ExerciseLog[];
}
