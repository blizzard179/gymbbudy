import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  SafeAreaView,
  StyleSheet,
  Platform,
  StatusBar,
  Alert,
  Vibration,
} from 'react-native';
import type { Program, CompletedSet, WorkoutSession } from '../types';
import { usePrograms } from '../context/ProgramContext';
import { insertSession } from '../api/sessions';

interface Props {
  program: Program;
  onClose: () => void;
}

const DEFAULT_REST = 90;

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

function formatDuration(s: number): string {
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return sec > 0 ? `${m}min ${sec}s` : `${m}min`;
}

function getEnglishName(exercise: { translations: { language: number; name: string }[] }, id: number): string {
  return exercise.translations.find(t => t.language === 2)?.name ?? `Exercise #${id}`;
}

export function WorkoutSessionScreen({ program, onClose }: Props) {
  const { saveSession } = usePrograms();
  const startTime = useRef(Date.now());

  const [exerciseIdx, setExerciseIdx] = useState(0);
  const [setIdx, setSetIdx] = useState(0);
  const [logs, setLogs] = useState<CompletedSet[][]>(program.exercises.map(() => []));

  const [actualReps, setActualReps] = useState(program.exercises[0]?.reps ?? '10');
  const [actualWeight, setActualWeight] = useState(program.exercises[0]?.weight ?? '0');

  const [resting, setResting] = useState(false);
  const [restSeconds, setRestSeconds] = useState(DEFAULT_REST);
  const [restDuration, setRestDuration] = useState(DEFAULT_REST);

  const [sessionDone, setSessionDone] = useState(false);
  const [finishedSession, setFinishedSession] = useState<WorkoutSession | null>(null);

  // Rest countdown
  useEffect(() => {
    if (!resting) return;
    if (restSeconds <= 0) {
      setResting(false);
      Vibration.vibrate([0, 200, 100, 200]);
      return;
    }
    const t = setInterval(() => setRestSeconds(s => s - 1), 1000);
    return () => clearInterval(t);
  }, [resting, restSeconds]);

  // Reset inputs when exercise changes
  useEffect(() => {
    const ex = program.exercises[exerciseIdx];
    if (!ex) return;
    setActualReps(ex.reps);
    setActualWeight(ex.weight);
  }, [exerciseIdx]);

  const currentProgramEx = program.exercises[exerciseIdx];
  const totalSets = parseInt(currentProgramEx?.sets ?? '3', 10) || 3;
  const completedSetsNow = logs[exerciseIdx] ?? [];

  const startRest = (duration = DEFAULT_REST) => {
    setRestDuration(duration);
    setRestSeconds(duration);
    setResting(true);
  };

  const buildSession = (finalLogs: CompletedSet[][]): WorkoutSession => {
    const now = Date.now();
    return {
      id: now.toString(),
      programId: program.id,
      programName: program.name,
      startedAt: startTime.current,
      finishedAt: now,
      durationSeconds: Math.floor((now - startTime.current) / 1000),
      logs: program.exercises.map((pe, i) => ({
        exercise: pe.exercise,
        targetSets: pe.sets,
        targetReps: pe.reps,
        targetWeight: pe.weight,
        sets: finalLogs[i] ?? [],
      })),
    };
  };

  const validateSet = () => {
    const isLastSet = setIdx + 1 >= totalSets;
    const isLastExercise = exerciseIdx >= program.exercises.length - 1;

    const newSet: CompletedSet = {
      actualReps,
      actualWeight,
      completedAt: Date.now(),
    };
    const newLogs = logs.map((l, i) => i === exerciseIdx ? [...l, newSet] : l);
    setLogs(newLogs);

    if (isLastSet && isLastExercise) {
      const session = buildSession(newLogs);
      saveSession(session);
      insertSession(session).catch(() => {});
      setFinishedSession(session);
      setSessionDone(true);
    } else if (isLastSet) {
      setExerciseIdx(i => i + 1);
      setSetIdx(0);
      startRest();
    } else {
      setSetIdx(s => s + 1);
      startRest();
    }
  };

  const handleEarlyStop = () => {
    Alert.alert(
      'Arrêter la séance ?',
      'Les séries effectuées seront perdues.',
      [
        { text: 'Continuer', style: 'cancel' },
        { text: 'Arrêter', style: 'destructive', onPress: onClose },
      ]
    );
  };

  // ─── Session terminée ───────────────────────────────────────────────────

  if (sessionDone && finishedSession) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="light-content" backgroundColor="#111" />
        <ScrollView contentContainerStyle={styles.summaryScroll}>
          <Text style={styles.summaryEmoji}>{'✓'}</Text>
          <Text style={styles.summaryTitle}>Séance terminée !</Text>
          <Text style={styles.summaryDuration}>
            {formatDuration(finishedSession.durationSeconds)}
          </Text>

          <View style={styles.summarySep} />

          {finishedSession.logs.map((log, i) => (
            <View key={i} style={styles.summaryExBlock}>
              <View style={styles.summaryExHeader}>
                <Text style={styles.summaryExName} numberOfLines={1}>
                  {getEnglishName(log.exercise, log.exercise.id)}
                </Text>
                <Text style={styles.summaryExCount}>
                  {log.sets.length}/{log.targetSets} séries
                </Text>
              </View>
              {log.sets.map((s, j) => (
                <View key={j} style={styles.summarySetRow}>
                  <Text style={styles.summarySetLabel}>Série {j + 1}</Text>
                  <Text style={styles.summarySetValue}>
                    {s.actualReps} reps · {s.actualWeight} kg
                  </Text>
                </View>
              ))}
            </View>
          ))}

          <TouchableOpacity style={styles.summaryCloseBtn} onPress={onClose} activeOpacity={0.8}>
            <Text style={styles.summaryCloseBtnText}>Fermer</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── Écran principal ────────────────────────────────────────────────────

  const nextExercise = resting ? program.exercises[exerciseIdx] : null;
  const nextLabel = resting
    ? (setIdx === 0 && exerciseIdx > 0)
      ? `Prochain : ${getEnglishName(program.exercises[exerciseIdx].exercise, program.exercises[exerciseIdx].exercise.id)}`
      : `Série ${setIdx + 1} sur ${parseInt(program.exercises[exerciseIdx]?.sets ?? '3', 10) || 3}`
    : null;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#111" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.programName} numberOfLines={1}>{program.name}</Text>
          <Text style={styles.exerciseProgress}>
            {exerciseIdx + 1}/{program.exercises.length}
          </Text>
        </View>
        <TouchableOpacity onPress={handleEarlyStop} style={styles.stopBtn}>
          <Text style={styles.stopBtnText}>Arrêter</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Nom de l'exercice */}
        <View style={styles.exHeader}>
          <Text style={styles.exName}>
            {getEnglishName(currentProgramEx.exercise, currentProgramEx.exercise.id)}
          </Text>
          <View style={styles.exBadge}>
            <Text style={styles.exBadgeText}>{currentProgramEx.exercise.category.name}</Text>
          </View>
        </View>

        {/* Progression des séries (dots) */}
        <View style={styles.dotsRow}>
          {Array.from({ length: totalSets }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i < completedSetsNow.length && styles.dotDone,
                i === setIdx && !resting && styles.dotActive,
              ]}
            />
          ))}
          <Text style={styles.dotsLabel}>
            {completedSetsNow.length}/{totalSets} séries
          </Text>
        </View>

        {/* ─── Repos actif ─── */}
        {resting ? (
          <View style={styles.restBox}>
            <Text style={styles.restLabel}>REPOS</Text>
            <Text style={styles.restCountdown}>{formatTime(restSeconds)}</Text>

            {/* Barre de progression */}
            <View style={styles.restBarBg}>
              <View
                style={[
                  styles.restBarFill,
                  { width: `${(restSeconds / restDuration) * 100}%` as any },
                ]}
              />
            </View>

            <View style={styles.restActions}>
              <TouchableOpacity
                style={styles.restSkipBtn}
                onPress={() => setResting(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.restSkipText}>Passer</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.restAddBtn}
                onPress={() => setRestSeconds(s => s + 30)}
                activeOpacity={0.7}
              >
                <Text style={styles.restAddText}>+30s</Text>
              </TouchableOpacity>
            </View>

            {nextLabel && (
              <View style={styles.nextUpBox}>
                <Text style={styles.nextUpLabel}>À SUIVRE</Text>
                <Text style={styles.nextUpText}>{nextLabel}</Text>
                <Text style={styles.nextUpTarget}>
                  Objectif · {program.exercises[exerciseIdx].reps} reps
                  {Number(program.exercises[exerciseIdx].weight) > 0
                    ? ` · ${program.exercises[exerciseIdx].weight} kg`
                    : ''}
                </Text>
              </View>
            )}
          </View>
        ) : (
          /* ─── Saisie de la série ─── */
          <View style={styles.setCard}>
            <Text style={styles.setCardTitle}>
              Série {setIdx + 1} sur {totalSets}
            </Text>
            <Text style={styles.setCardTarget}>
              Objectif · {currentProgramEx.reps} reps
              {Number(currentProgramEx.weight) > 0 ? ` · ${currentProgramEx.weight} kg` : ''}
            </Text>

            <View style={styles.inputsRow}>
              <View style={styles.inputBlock}>
                <Text style={styles.inputLabel}>Reps réelles</Text>
                <TextInput
                  style={styles.inputField}
                  value={actualReps}
                  onChangeText={v => setActualReps(v.replace(/[^0-9]/g, ''))}
                  keyboardType="number-pad"
                  maxLength={3}
                  selectTextOnFocus
                />
              </View>
              <View style={styles.inputSep} />
              <View style={styles.inputBlock}>
                <Text style={styles.inputLabel}>Poids (kg)</Text>
                <TextInput
                  style={styles.inputField}
                  value={actualWeight}
                  onChangeText={v => setActualWeight(v.replace(/[^0-9.]/g, ''))}
                  keyboardType="decimal-pad"
                  maxLength={5}
                  selectTextOnFocus
                />
              </View>
            </View>

            <TouchableOpacity
              style={styles.validateBtn}
              onPress={validateSet}
              activeOpacity={0.8}
            >
              <Text style={styles.validateBtnText}>
                {setIdx + 1 >= totalSets && exerciseIdx >= program.exercises.length - 1
                  ? 'Terminer la séance'
                  : 'Valider la série'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Séries déjà effectuées pour cet exercice */}
        {completedSetsNow.length > 0 && (
          <View style={styles.doneList}>
            <Text style={styles.doneListTitle}>Séries effectuées</Text>
            {completedSetsNow.map((s, i) => (
              <View key={i} style={styles.doneRow}>
                <Text style={styles.doneRowLabel}>Série {i + 1}</Text>
                <Text style={styles.doneRowValue}>
                  {s.actualReps} reps · {s.actualWeight} kg
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#111',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1c1c1e',
  },
  headerLeft: {
    flex: 1,
    marginRight: 12,
  },
  programName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  exerciseProgress: {
    color: '#f5c842',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  stopBtn: {
    borderWidth: 1,
    borderColor: '#3a3a3c',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  stopBtnText: {
    color: '#888',
    fontSize: 13,
    fontWeight: '600',
  },

  scroll: {
    padding: 16,
    paddingBottom: 40,
  },

  // Exercise header
  exHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 16,
  },
  exName: {
    flex: 1,
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 28,
  },
  exBadge: {
    backgroundColor: '#f5c842',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginTop: 4,
  },
  exBadgeText: {
    color: '#000',
    fontSize: 11,
    fontWeight: '700',
  },

  // Sets dots
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#2c2c2e',
    borderWidth: 1,
    borderColor: '#3a3a3c',
  },
  dotDone: {
    backgroundColor: '#f5c842',
    borderColor: '#f5c842',
  },
  dotActive: {
    backgroundColor: 'transparent',
    borderColor: '#f5c842',
    borderWidth: 2,
  },
  dotsLabel: {
    color: '#555',
    fontSize: 13,
    marginLeft: 4,
  },

  // Rest timer
  restBox: {
    backgroundColor: '#1c1c1e',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    gap: 16,
  },
  restLabel: {
    color: '#555',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
  },
  restCountdown: {
    color: '#fff',
    fontSize: 64,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    lineHeight: 72,
  },
  restBarBg: {
    width: '100%',
    height: 4,
    backgroundColor: '#2c2c2e',
    borderRadius: 2,
    overflow: 'hidden',
  },
  restBarFill: {
    height: '100%',
    backgroundColor: '#f5c842',
    borderRadius: 2,
  },
  restActions: {
    flexDirection: 'row',
    gap: 12,
  },
  restSkipBtn: {
    borderWidth: 1,
    borderColor: '#3a3a3c',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  restSkipText: {
    color: '#ccc',
    fontSize: 14,
    fontWeight: '600',
  },
  restAddBtn: {
    backgroundColor: '#2c2c2e',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  restAddText: {
    color: '#f5c842',
    fontSize: 14,
    fontWeight: '700',
  },
  nextUpBox: {
    width: '100%',
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 14,
    gap: 4,
  },
  nextUpLabel: {
    color: '#555',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  nextUpText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  nextUpTarget: {
    color: '#888',
    fontSize: 13,
  },

  // Set input card
  setCard: {
    backgroundColor: '#1c1c1e',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    gap: 12,
  },
  setCardTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  setCardTarget: {
    color: '#888',
    fontSize: 14,
  },
  inputsRow: {
    flexDirection: 'row',
    backgroundColor: '#111',
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 4,
  },
  inputBlock: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
  },
  inputLabel: {
    color: '#555',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  inputField: {
    color: '#f5c842',
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
    minWidth: 60,
  },
  inputSep: {
    width: 1,
    backgroundColor: '#2c2c2e',
  },
  validateBtn: {
    backgroundColor: '#f5c842',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  validateBtnText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '800',
  },

  // Completed sets
  doneList: {
    gap: 0,
  },
  doneListTitle: {
    color: '#444',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  doneRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1c1c1e',
  },
  doneRowLabel: {
    color: '#555',
    fontSize: 14,
  },
  doneRowValue: {
    color: '#ccc',
    fontSize: 14,
    fontWeight: '600',
  },

  // Summary (session done)
  summaryScroll: {
    padding: 24,
    paddingBottom: 60,
    alignItems: 'center',
  },
  summaryEmoji: {
    fontSize: 48,
    marginBottom: 12,
    color: '#f5c842',
    fontWeight: '800',
  },
  summaryTitle: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 6,
  },
  summaryDuration: {
    color: '#f5c842',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  summarySep: {
    width: '100%',
    height: 1,
    backgroundColor: '#1c1c1e',
    marginVertical: 20,
  },
  summaryExBlock: {
    width: '100%',
    backgroundColor: '#1c1c1e',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  summaryExHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  summaryExName: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
    marginRight: 10,
  },
  summaryExCount: {
    color: '#f5c842',
    fontSize: 13,
    fontWeight: '600',
  },
  summarySetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: '#2c2c2e',
  },
  summarySetLabel: {
    color: '#666',
    fontSize: 13,
  },
  summarySetValue: {
    color: '#ccc',
    fontSize: 13,
    fontWeight: '500',
  },
  summaryCloseBtn: {
    marginTop: 24,
    backgroundColor: '#f5c842',
    borderRadius: 20,
    paddingHorizontal: 32,
    paddingVertical: 14,
  },
  summaryCloseBtnText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '800',
  },
});
