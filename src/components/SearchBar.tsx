import React from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet } from 'react-native';

interface Props {
  value: string;
  onChangeText: (text: string) => void;
}

export function SearchBar({ value, onChangeText }: Props) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.icon}>{'>'}_</Text>
      <TextInput
        style={styles.input}
        placeholder="Rechercher un exercice..."
        placeholderTextColor="#444"
        value={value}
        onChangeText={onChangeText}
        returnKeyType="search"
        autoCorrect={false}
        autoCapitalize="none"
      />
      {value.length > 0 && (
        <TouchableOpacity
          onPress={() => onChangeText('')}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.clear}>x</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1c1c1e',
    borderRadius: 10,
    paddingHorizontal: 14,
    marginHorizontal: 16,
    marginBottom: 12,
    height: 46,
    gap: 10,
  },
  icon: {
    color: '#FF6224',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
  },
  clear: {
    color: '#555',
    fontSize: 16,
    fontWeight: '600',
  },
});
