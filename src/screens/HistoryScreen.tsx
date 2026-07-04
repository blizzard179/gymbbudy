import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import type { WorkoutSession } from '../types';
import { usePrograms } from '../context/ProgramContext';

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

function getEnglishName(exercise: { translations: { language: number; name: string }[] }, id: number): string {
  return exercise.translations.find(t => t.language === 2)?.name ?? `Exercise #${id}`;
}

function totalSets(session: WorkoutSession): number {
  return session.logs.reduce((acc, log) => acc + log.sets.length, 0);
}

// ─── Carte d'une séance ─────────────────────────────────────────────────────

function SessionCard({ session }: { session: WorkoutSession }) {
  const [expanded, setExpanded] = useState(false);
  const setsCount = totalSets(session);

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
            {session.logs.length} exercice{session.logs.length > 1 ? 's' : ''} · {setsCount} série{setsCount > 1 ? 's' : ''}
          </Text>
        </View>
        <Text style={styles.cardChevron}>{expanded ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.cardBody}>
          {session.logs.map((log, i) => (
            <View key={i} style={styles.logBlock}>
              <View style={styles.logHeader}>
                <Text style={styles.logName} numberOfLines={1}>
                  {getEnglishName(log.exercise, log.exercise.id)}
                </Text>
                <View style={styles.logBadge}>
                  <Text style={styles.logBadgeText}>{log.exercise.category.name}</Text>
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

// ─── Écran ──────────────────────────────────────────────────────────────────

export function HistoryScreen() {
  const { sessions } = usePrograms();
  const sorted = [...sessions].sort((a, b) => b.finishedAt - a.finishedAt);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#111" />
      <View style={styles.titleRow}>
        <Text style={styles.title}>Historique</Text>
        {sorted.length > 0 && (
          <Text style={styles.counter}>{sorted.length} séance{sorted.length > 1 ? 's' : ''}</Text>
        )}
      </View>

      <FlatList
        data={sorted}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <SessionCard session={item} />}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Aucune séance</Text>
            <Text style={styles.emptyText}>
              Démarre une séance depuis l'onglet Programme pour voir ton historique ici.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

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
  counter: {
    color: '#555',
    fontSize: 13,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },

  // Session card
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

  // Expanded body
  cardBody: {
    borderTopWidth: 1,
    borderTopColor: '#2c2c2e',
    padding: 16,
    gap: 16,
  },
  logBlock: {
    gap: 6,
  },
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
  logTarget: {
    marginBottom: 4,
  },
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
  setLabel: {
    color: '#555',
    fontSize: 13,
  },
  setValues: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  setValue: {
    color: '#ccc',
    fontSize: 13,
    fontWeight: '600',
  },
  setWeight: {
    color: '#f5c842',
    fontSize: 13,
    fontWeight: '600',
  },

  // Empty
  empty: {
    paddingTop: 60,
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    color: '#555',
    fontSize: 18,
    fontWeight: '700',
  },
  emptyText: {
    color: '#444',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
