import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { Exercise } from '../types';
import { stripHtml } from '../utils/html';

interface Props {
  exercise: Exercise;
  onPress?: () => void;
}

function getEnglishTranslation(exercise: Exercise) {
  return exercise.translations.find(t => t.language === 2);
}

export function ExerciseCard({ exercise, onPress }: Props) {
  const translation = getEnglishTranslation(exercise);
  const name = translation?.name ?? `Exercice #${exercise.id}`;
  const description = translation?.description ? stripHtml(translation.description) : '';
  const primaryMuscles = exercise.muscles.map(m => m.name_en).filter(Boolean);
  const secondaryMuscles = exercise.muscles_secondary.map(m => m.name_en).filter(Boolean);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={onPress ? 0.7 : 1}>
      <View style={styles.header}>
        <Text style={styles.name} numberOfLines={2}>{name}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{exercise.category.name}</Text>
        </View>
      </View>

      {(primaryMuscles.length > 0 || secondaryMuscles.length > 0) && (
        <View style={styles.muscles}>
          {primaryMuscles.map(m => (
            <View key={m} style={styles.muscleTag}>
              <Text style={styles.muscleText}>{m}</Text>
            </View>
          ))}
          {secondaryMuscles.map(m => (
            <View key={`s-${m}`} style={[styles.muscleTag, styles.muscleTagSecondary]}>
              <Text style={[styles.muscleText, styles.muscleTextSecondary]}>{m}</Text>
            </View>
          ))}
        </View>
      )}

      {description.length > 0 && (
        <Text style={styles.description} numberOfLines={3}>
          {description}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1c1c1e',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
  },
  name: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  },
  badge: {
    backgroundColor: '#FF6224',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  badgeText: {
    color: '#000',
    fontSize: 11,
    fontWeight: '700',
  },
  muscles: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  muscleTag: {
    backgroundColor: '#2c2c2e',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  muscleTagSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#3a3a3c',
  },
  muscleText: {
    color: '#ccc',
    fontSize: 12,
    fontWeight: '500',
  },
  muscleTextSecondary: {
    color: '#555',
  },
  description: {
    color: '#777',
    fontSize: 13,
    lineHeight: 19,
  },
});
