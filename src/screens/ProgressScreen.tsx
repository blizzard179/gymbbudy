import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Platform,
  Dimensions,
} from 'react-native';
import Svg, {
  Path,
  Line as SvgLine,
  Circle,
  Text as SvgText,
  Defs,
  LinearGradient,
  Stop,
} from 'react-native-svg';
import type { WorkoutSession } from '../types';
import { usePrograms } from '../context/ProgramContext';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CHART_H = 200;
const PAD_LEFT = 46;
const PAD_RIGHT = 16;
const PAD_TOP = 12;
const PAD_BOTTOM = 34;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getEnglishName(
  exercise: { translations: { language: number; name: string }[] },
  id: number,
): string {
  return exercise.translations.find(t => t.language === 2)?.name ?? `Exercise #${id}`;
}

interface ExerciseMeta {
  id: number;
  name: string;
  category: string;
  sessionCount: number;
}

function collectExercises(sessions: WorkoutSession[]): ExerciseMeta[] {
  const map = new Map<number, ExerciseMeta>();
  for (const s of sessions) {
    for (const log of s.logs) {
      const id = log.exercise.id;
      if (!map.has(id)) {
        map.set(id, {
          id,
          name: getEnglishName(log.exercise, id),
          category: log.exercise.category.name,
          sessionCount: 1,
        });
      } else {
        map.get(id)!.sessionCount++;
      }
    }
  }
  return [...map.values()].sort((a, b) => b.sessionCount - a.sessionCount);
}

interface ChartPoint {
  value: number;
  label: string;
}

function buildChartPoints(sessions: WorkoutSession[], exerciseId: number): ChartPoint[] {
  return sessions
    .filter(s => s.logs.some(l => l.exercise.id === exerciseId))
    .sort((a, b) => a.finishedAt - b.finishedAt)
    .map(s => {
      const log = s.logs.find(l => l.exercise.id === exerciseId)!;
      const maxWeight = Math.max(...log.sets.map(set => Number(set.actualWeight) || 0), 0);
      const label = new Date(s.finishedAt).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
      });
      return { value: maxWeight, label };
    });
}

// ─── SVG Line Chart ───────────────────────────────────────────────────────────

function LineChart({ data, width }: { data: ChartPoint[]; width: number }) {
  const drawW = width - PAD_LEFT - PAD_RIGHT;
  const drawH = CHART_H - PAD_TOP - PAD_BOTTOM;

  const values = data.map(d => d.value);
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  const padding = Math.max(2, (rawMax - rawMin) * 0.15);
  const minVal = Math.max(0, rawMin - padding);
  const maxVal = rawMax + padding;
  const range = maxVal - minVal || 1;

  const toX = (i: number) =>
    PAD_LEFT + (data.length === 1 ? drawW / 2 : (i / (data.length - 1)) * drawW);
  const toY = (val: number) =>
    PAD_TOP + drawH - ((val - minVal) / range) * drawH;

  const pts = data.map((d, i) => ({ x: toX(i), y: toY(d.value) }));

  // Bezier path
  let linePath = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const cx = (pts[i - 1].x + pts[i].x) / 2;
    linePath += ` C ${cx} ${pts[i - 1].y} ${cx} ${pts[i].y} ${pts[i].x} ${pts[i].y}`;
  }

  // Closed area path
  const areaPath =
    linePath +
    ` L ${pts[pts.length - 1].x} ${PAD_TOP + drawH}` +
    ` L ${pts[0].x} ${PAD_TOP + drawH} Z`;

  // Y axis labels (4 steps)
  const Y_STEPS = 4;
  const yLabels = Array.from({ length: Y_STEPS + 1 }, (_, i) => {
    const val = minVal + (range / Y_STEPS) * i;
    return { val, y: toY(val) };
  });

  // X axis: show at most 6 labels to avoid overlap
  const labelEvery = Math.ceil(data.length / 6);
  const shownXLabels = data
    .map((d, i) => ({ d, i }))
    .filter(({ i }) => i % labelEvery === 0 || i === data.length - 1);

  return (
    <Svg width={width} height={CHART_H}>
      <Defs>
        <LinearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#f5c842" stopOpacity="0.22" />
          <Stop offset="100%" stopColor="#f5c842" stopOpacity="0" />
        </LinearGradient>
      </Defs>

      {/* Y grid lines + labels */}
      {yLabels.map(({ val, y }, i) => (
        <React.Fragment key={i}>
          <SvgLine
            x1={PAD_LEFT}
            y1={y}
            x2={width - PAD_RIGHT}
            y2={y}
            stroke="#222224"
            strokeWidth={1}
          />
          <SvgText
            x={PAD_LEFT - 6}
            y={y + 4}
            textAnchor="end"
            fill="#555"
            fontSize={10}
            fontWeight="500"
          >
            {val.toFixed(0)}
          </SvgText>
        </React.Fragment>
      ))}

      {/* Y axis line */}
      <SvgLine
        x1={PAD_LEFT}
        y1={PAD_TOP}
        x2={PAD_LEFT}
        y2={PAD_TOP + drawH}
        stroke="#2c2c2e"
        strokeWidth={1}
      />

      {/* Area fill */}
      <Path d={areaPath} fill="url(#areaGrad)" />

      {/* Line */}
      <Path
        d={linePath}
        stroke="#f5c842"
        strokeWidth={2.5}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Data points */}
      {pts.map((pt, i) => (
        <Circle key={i} cx={pt.x} cy={pt.y} r={4.5} fill="#f5c842" />
      ))}

      {/* X labels */}
      {shownXLabels.map(({ d, i }) => (
        <SvgText
          key={i}
          x={toX(i)}
          y={CHART_H - 6}
          textAnchor="middle"
          fill="#555"
          fontSize={10}
          fontWeight="500"
        >
          {d.label}
        </SvgText>
      ))}
    </Svg>
  );
}

// ─── Écran ────────────────────────────────────────────────────────────────────

export function ProgressScreen() {
  const { sessions } = usePrograms();
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const exercises = useMemo(() => collectExercises(sessions), [sessions]);

  const chartData = useMemo(
    () => (selectedId != null ? buildChartPoints(sessions, selectedId) : []),
    [sessions, selectedId],
  );

  const selectedEx = exercises.find(e => e.id === selectedId);
  const chartWidth = SCREEN_WIDTH - 32;

  const maxWeight = chartData.length > 0 ? Math.max(...chartData.map(d => d.value)) : 0;
  const lastWeight = chartData.length > 0 ? chartData[chartData.length - 1].value : 0;
  const firstWeight = chartData.length > 0 ? chartData[0].value : 0;
  const delta = lastWeight - firstWeight;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#111" />
      <ScrollView showsVerticalScrollIndicator={false}>

        <View style={styles.titleRow}>
          <Text style={styles.title}>Progression</Text>
        </View>

        {sessions.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>↗</Text>
            <Text style={styles.emptyTitle}>Aucune donnée</Text>
            <Text style={styles.emptyText}>
              Effectue des séances pour voir ta progression ici.
            </Text>
          </View>
        ) : (
          <>
            {/* ─── Sélecteur d'exercice ─── */}
            <View style={styles.selectorSection}>
              <Text style={styles.selectorLabel}>Choisir un exercice</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chips}
              >
                {exercises.map(ex => {
                  const active = selectedId === ex.id;
                  return (
                    <TouchableOpacity
                      key={ex.id}
                      style={[styles.chip, active && styles.chipActive]}
                      onPress={() => setSelectedId(ex.id)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>
                        {ex.name}
                      </Text>
                      <Text style={[styles.chipCount, active && styles.chipCountActive]}>
                        {ex.sessionCount}×
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* ─── Contenu selon sélection ─── */}
            {selectedId == null ? (
              <View style={styles.empty}>
                <Text style={styles.emptyIcon}>↑</Text>
                <Text style={styles.emptyTitle}>Sélectionne un exercice</Text>
                <Text style={styles.emptyText}>
                  Choisis un exercice ci-dessus pour voir ta courbe de progression.
                </Text>
              </View>
            ) : chartData.length < 2 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyIcon}>⊙</Text>
                <Text style={styles.emptyTitle}>Pas assez de données</Text>
                <Text style={styles.emptyText}>
                  Il faut au moins 2 séances avec cet exercice pour afficher la courbe.
                </Text>
              </View>
            ) : (
              <View style={styles.chartSection}>
                {/* Header */}
                <View style={styles.chartHeader}>
                  <View style={styles.chartHeaderLeft}>
                    <Text style={styles.chartExName} numberOfLines={1}>
                      {selectedEx?.name}
                    </Text>
                    <Text style={styles.chartExCategory}>{selectedEx?.category}</Text>
                  </View>
                  <View style={styles.chartCountBadge}>
                    <Text style={styles.chartCountText}>{chartData.length} séances</Text>
                  </View>
                </View>

                {/* Graphique */}
                <View style={styles.chartBox}>
                  <LineChart data={chartData} width={chartWidth} />
                  <Text style={styles.chartYUnit}>kg</Text>
                </View>

                {/* Stats */}
                <View style={styles.statsRow}>
                  <View style={styles.stat}>
                    <Text style={styles.statValue}>{maxWeight} kg</Text>
                    <Text style={styles.statLabel}>Record</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.stat}>
                    <Text style={styles.statValue}>{lastWeight} kg</Text>
                    <Text style={styles.statLabel}>Dernier</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.stat}>
                    <Text style={[
                      styles.statValue,
                      delta > 0 ? styles.statGreen : delta < 0 ? styles.statRed : null,
                    ]}>
                      {delta > 0 ? `+${delta.toFixed(1)}` : delta < 0 ? delta.toFixed(1) : '—'} {delta !== 0 ? 'kg' : ''}
                    </Text>
                    <Text style={styles.statLabel}>Évolution</Text>
                  </View>
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#111',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  titleRow: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '800',
  },

  // Selector
  selectorSection: {
    marginBottom: 8,
  },
  selectorLabel: {
    color: '#555',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 10,
    paddingHorizontal: 16,
  },
  chips: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1c1c1e',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: '#2c2c2e',
  },
  chipActive: {
    backgroundColor: '#f5c842',
    borderColor: '#f5c842',
  },
  chipText: {
    color: '#888',
    fontSize: 13,
    fontWeight: '600',
    maxWidth: 160,
  },
  chipTextActive: {
    color: '#000',
  },
  chipCount: {
    color: '#444',
    fontSize: 11,
    fontWeight: '700',
  },
  chipCountActive: {
    color: '#00000066',
  },

  // Chart section
  chartSection: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 32,
    backgroundColor: '#1c1c1e',
    borderRadius: 16,
    overflow: 'hidden',
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    paddingBottom: 12,
  },
  chartHeaderLeft: {
    flex: 1,
    marginRight: 12,
  },
  chartExName: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 2,
  },
  chartExCategory: {
    color: '#555',
    fontSize: 12,
  },
  chartCountBadge: {
    backgroundColor: '#2c2c2e',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  chartCountText: {
    color: '#888',
    fontSize: 11,
    fontWeight: '600',
  },
  chartBox: {
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  chartYUnit: {
    position: 'absolute',
    top: 14,
    left: 20,
    color: '#333',
    fontSize: 10,
    fontWeight: '700',
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#2c2c2e',
    paddingVertical: 16,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#2c2c2e',
    marginVertical: 4,
  },
  statValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  statLabel: {
    color: '#555',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statGreen: {
    color: '#4caf78',
  },
  statRed: {
    color: '#e05c5c',
  },

  // Empty states
  empty: {
    marginTop: 60,
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 36,
    color: '#2c2c2e',
    marginBottom: 4,
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
    lineHeight: 21,
  },
});
