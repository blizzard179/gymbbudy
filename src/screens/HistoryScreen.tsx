import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { WorkoutSession } from '../types';
import type { HistorySession } from '../types';
import { fetchSessions } from '../api/sessions';
import { isSupabaseConfigured } from '../lib/supabase';
import { usePrograms } from '../context/ProgramContext';

// ─── Types unifiés pour l'affichage ─────────────────────────────────────────

type DisplayLog = {
  name: string;
  category: string;
  targetSets: string;
  targetReps: string;
  targetWeight: string;
  sets: { actualReps: string; actualWeight: string }[];
};

type DisplaySession = {
  id: string;
  programName: string;
  startedAt: number;
  durationSeconds: number;
  logs: DisplayLog[];
};

function fromWorkoutSession(s: WorkoutSession): DisplaySession {
  return {
    id: s.id,
    programName: s.programName,
    startedAt: s.startedAt,
    durationSeconds: s.durationSeconds,
    logs: s.logs.map(log => ({
      name: log.exercise.translations.find(t => t.language === 2)?.name ?? `Exercise #${log.exercise.id}`,
      category: log.exercise.category.name,
      targetSets: log.targetSets,
      targetReps: log.targetReps,
      targetWeight: log.targetWeight,
      sets: log.sets,
    })),
  };
}

function fromHistorySession(s: HistorySession): DisplaySession {
  return {
    id: s.id,
    programName: s.programName,
    startedAt: s.startedAt,
    durationSeconds: s.durationSeconds,
    logs: s.logs.map(log => ({
      name: log.exerciseName,
      category: log.category,
      targetSets: log.targetSets,
      targetReps: log.targetReps,
      targetWeight: log.targetWeight,
      sets: log.sets,
    })),
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}min ${s}s` : `${m}min`;
}

// ─── Carte d'une séance ──────────────────────────────────────────────────────

function SessionCard({ session }: { session: DisplaySession }) {
  const [expanded, setExpanded] = useState(false);
  const setsTotal = session.logs.reduce((acc, l) => acc + l.sets.length, 0);

  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.cardHeader}
        onPress={() => setExpanded(v => !v)}
        activeOpacity={0.7}
      >
        <View style={styles.cardTop}>
          <Text style={styles.cardDate}>{formatDate(session.startedAt)}</Text>
          <Text style={styles.cardDuration}>{formatDuration(session.durationSeconds)}</Text>
        </View>
        <View style={styles.cardMeta}>
          <Text style={styles.cardProgram}>{session.programName}</Text>
          <Text style={styles.cardStats}>
            {session.logs.length} exercice{session.logs.length > 1 ? 's' : ''} · {setsTotal} série{setsTotal > 1 ? 's' : ''}
          </Text>
        </View>
        <Text style={styles.cardChevron}>{expanded ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.cardBody}>
          {session.logs.map((log, i) => (
            <View key={i} style={styles.logBlock}>
              <View style={styles.logHeader}>
                <Text style={styles.logName} numberOfLines={1}>{log.name}</Text>
                <View style={styles.logBadge}>
                  <Text style={styles.logBadgeText}>{log.category}</Text>
                </View>
              </View>
              <View style={styles.logTarget}>
                <Text style={styles.logTargetText}>
                  Objectif : {log.targetSets}×{log.targetReps}
                  {Number(log.targetWeight) > 0 ? ` · ${log.targetWeight} kg` : ''}
                </Text>
              </View>
              {log.sets.map((s, j) => (
                <View key={j} style={styles.setRow}>
                  <Text style={styles.setLabel}>Série {j + 1}</Text>
                  <View style={styles.setValues}>
                    <Text style={styles.setValue}>{s.actualReps} reps</Text>
                    {Number(s.actualWeight) > 0 && (
                      <Text style={styles.setWeight}>{s.actualWeight} kg</Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

// ─── Écran ───────────────────────────────────────────────────────────────────

export function HistoryScreen() {
  const { sessions: localSessions } = usePrograms();

  const [remoteSessions, setRemoteSessions] = useState<DisplaySession[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (!isSupabaseConfigured) return;
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const data = await fetchSessions();
      setRemoteSessions(data.map(fromHistorySession));
    } catch {
      setError("Impossible de charger l'historique.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const sessions: DisplaySession[] = isSupabaseConfigured
    ? remoteSessions
    : [...localSessions].sort((a, b) => b.finishedAt - a.finishedAt).map(fromWorkoutSession);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#111" />

      <View style={styles.titleRow}>
        <Text style={styles.title}>Historique</Text>
        <View style={styles.titleRight}>
          {isSupabaseConfigured && (
            <View style={styles.cloudBadge}>
              <Text style={styles.cloudBadgeText}>☁ Supabase</Text>
            </View>
          )}
          {sessions.length > 0 && (
            <Text style={styles.counter}>
              {sessions.length} séance{sessions.length > 1 ? 's' : ''}
            </Text>
          )}
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#f5c842" />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorTitle}>Erreur de connexion</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => load()} activeOpacity={0.7}>
            <Text style={styles.retryText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={item => item.id}
          renderItem={({ item }) => <SessionCard session={item} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            isSupabaseConfigured ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => load(true)}
                tintColor="#f5c842"
                colors={['#f5c842']}
              />
            ) : undefined
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>Aucune séance</Text>
              <Text style={styles.emptyText}>
                Démarre une séance depuis l'onglet Programme pour voir ton historique ici.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#111',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '800',
  },
  titleRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cloudBadge: {
    backgroundColor: '#1c2a1c',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#2a4a2a',
  },
  cloudBadgeText: {
    color: '#4caf78',
    fontSize: 11,
    fontWeight: '700',
  },
  counter: {
    color: '#555',
    fontSize: 13,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },

  // Card
  card: {
    backgroundColor: '#1c1c1e',
    borderRadius: 14,
    marginBottom: 12,
    overflow: 'hidden',
  },
  cardHeader: {
    padding: 16,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardDate: {
    color: '#888',
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  cardDuration: {
    color: '#f5c842',
    fontSize: 13,
    fontWeight: '700',
  },
  cardMeta: {
    gap: 3,
    marginBottom: 12,
  },
  cardProgram: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  cardStats: {
    color: '#555',
    fontSize: 13,
  },
  cardChevron: {
    color: '#444',
    fontSize: 11,
    alignSelf: 'flex-end',
  },

  // Body
  cardBody: {
    borderTopWidth: 1,
    borderTopColor: '#2c2c2e',
    padding: 16,
    gap: 16,
  },
  logBlock: { gap: 6 },
  logHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logName: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  logBadge: {
    backgroundColor: '#2c2c2e',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  logBadgeText: {
    color: '#888',
    fontSize: 11,
    fontWeight: '600',
  },
  logTarget: { marginBottom: 4 },
  logTargetText: {
    color: '#555',
    fontSize: 12,
  },
  setRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: '#2c2c2e',
  },
  setLabel: { color: '#555', fontSize: 13 },
  setValues: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  setValue: { color: '#ccc', fontSize: 13, fontWeight: '600' },
  setWeight: { color: '#f5c842', fontSize: 13, fontWeight: '600' },

  // States
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 12,
  },
  empty: {
    paddingTop: 60,
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
  },
  emptyTitle: { color: '#555', fontSize: 18, fontWeight: '700' },
  emptyText: {
    color: '#444',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  errorTitle: { color: '#888', fontSize: 16, fontWeight: '700' },
  errorText: { color: '#555', fontSize: 14, textAlign: 'center' },
  retryBtn: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#3a3a3c',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 9,
  },
  retryText: { color: '#888', fontSize: 14, fontWeight: '600' },
});
