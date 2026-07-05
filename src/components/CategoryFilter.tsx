import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import type { Category } from '../types';

interface Props {
  categories: Category[];
  selected: number | undefined;
  onSelect: (id: number | undefined) => void;
}

export function CategoryFilter({ categories, selected, onSelect }: Props) {
  const all = [{ id: undefined, name: 'Tous' }, ...categories.map(c => ({ id: c.id as number | undefined, name: c.name }))];

  return (
    <View style={styles.container}>
      {all.map(cat => {
        const isActive = cat.id === selected;
        return (
          <TouchableOpacity
            key={cat.id ?? 'all'}
            style={[styles.chip, isActive && styles.chipActive]}
            onPress={() => onSelect(cat.id)}
            activeOpacity={0.7}
          >
            <Text style={[styles.label, isActive && styles.labelActive]}>
              {cat.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingBottom: 14,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#1c1c1e',
    borderWidth: 1,
    borderColor: '#2c2c2e',
  },
  chipActive: {
    backgroundColor: '#FF6224',
    borderColor: '#FF6224',
  },
  label: {
    color: '#888',
    fontSize: 13,
    fontWeight: '500',
  },
  labelActive: {
    color: '#000',
    fontWeight: '700',
  },
});
