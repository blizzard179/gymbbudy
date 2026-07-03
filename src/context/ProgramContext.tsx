import React, { createContext, useContext, useState } from 'react';
import type { Program, ProgramExercise, WorkoutSession } from '../types';

interface ProgramContextType {
  programs: Program[];
  sessions: WorkoutSession[];
  saveProgram: (name: string, exercises: ProgramExercise[]) => void;
  addExerciseToProgram: (programId: string, pe: ProgramExercise) => void;
  saveSession: (session: WorkoutSession) => void;
}

const ProgramContext = createContext<ProgramContextType | null>(null);

export function ProgramProvider({ children }: { children: React.ReactNode }) {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);

  const saveProgram = (name: string, exercises: ProgramExercise[]) => {
    setPrograms(prev => [...prev, {
      id: Date.now().toString(),
      name,
      exercises,
      createdAt: Date.now(),
    }]);
  };

  const addExerciseToProgram = (programId: string, pe: ProgramExercise) => {
    setPrograms(prev =>
      prev.map(p =>
        p.id === programId ? { ...p, exercises: [...p.exercises, pe] } : p
      )
    );
  };

  const saveSession = (session: WorkoutSession) => {
    setSessions(prev => [session, ...prev]);
  };

  return (
    <ProgramContext.Provider value={{ programs, sessions, saveProgram, addExerciseToProgram, saveSession }}>
      {children}
    </ProgramContext.Provider>
  );
}

export function usePrograms(): ProgramContextType {
  const ctx = useContext(ProgramContext);
  if (!ctx) throw new Error('usePrograms must be inside ProgramProvider');
  return ctx;
}
