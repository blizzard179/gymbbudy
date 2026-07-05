import { supabase } from '../lib/supabase';
import type { WorkoutSession, HistorySession, HistoryExerciseLog } from '../types';

function toHistoryLog(log: WorkoutSession['logs'][number]): HistoryExerciseLog {
  const name =
    log.exercise.translations.find(t => t.language === 2)?.name ??
    `Exercise #${log.exercise.id}`;
  return {
    exerciseId: log.exercise.id,
    exerciseName: name,
    category: log.exercise.category.name,
    targetSets: log.targetSets,
    targetReps: log.targetReps,
    targetWeight: log.targetWeight,
    sets: log.sets,
  };
}

export async function insertSession(session: WorkoutSession): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('workout_sessions').insert({
    id: session.id,
    program_id: session.programId,
    program_name: session.programName,
    started_at: session.startedAt,
    finished_at: session.finishedAt,
    duration_seconds: session.durationSeconds,
    logs: session.logs.map(toHistoryLog),
  });
  if (error) throw error;
}

export async function fetchSessions(): Promise<HistorySession[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('workout_sessions')
    .select('*')
    .order('finished_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(row => ({
    id: row.id,
    programId: row.program_id,
    programName: row.program_name,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    durationSeconds: row.duration_seconds,
    logs: row.logs as HistoryExerciseLog[],
  }));
}
