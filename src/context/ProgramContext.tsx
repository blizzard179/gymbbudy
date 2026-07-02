import React, { createContext, useContext, useState } from 'react';
import type { Program, ProgramExercise } from '../types';

interface ProgramContextType {
  programs: Program[];
  saveProgram: (name: string, exercises: ProgramExercise[]) => void;
  addExerciseToProgram: (programId: string, pe: ProgramExercise) => void;
}

const ProgramContext = createContext<ProgramContextType | null>(null);

export function ProgramProvider({ children }: { children: React.ReactNode }) {
  const [programs, setPrograms] = useState<Program[]>([]);

  const saveProgram = (name: string, exercises: ProgramExercise[]) => {
    const program: Program = {
      id: Date.now().toString(),
      name,
      exercises,
      createdAt: Date.now(),
    };
    setPrograms(prev => [...prev, program]);
  };

  const addExerciseToProgram = (programId: string, pe: ProgramExercise) => {
    setPrograms(prev =>
      prev.map(p =>
        p.id === programId ? { ...p, exercises: [...p.exercises, pe] } : p
      )
    );
  };

  return (
    <ProgramContext.Provider value={{ programs, saveProgram, addExerciseToProgram }}>
      {children}
    </ProgramContext.Provider>
  );
}

export function usePrograms(): ProgramContextType {
  const ctx = useContext(ProgramContext);
  if (!ctx) throw new Error('usePrograms must be inside ProgramProvider');
  return ctx;
}
