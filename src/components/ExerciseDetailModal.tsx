import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  StyleSheet,
  SafeAreaView,
  Platform,
  StatusBar,
} from 'react-native';
import type { Exercise } from '../types';
import { usePrograms } from '../context/ProgramContext';
import { stripHtml } from '../utils/html';

interface Props {
  exercise: Exercise | null;
  onClose: () => void;
}

function getEnglishTranslation(exercise: Exercise) {
  return exercise.translations.find(t => t.language === 2);
}

function resolveImageUrl(url: string): string {
  if (url.startsWith('http')) return url;
  return `https://wger.de${url}`;
}

export function ExerciseDetailModal({ exercise, onClose }: Props) {
  const { programs, addExerciseToProgram } = usePrograms();
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null);
  const [sets, setSets] = useState('3');
  const [reps, setReps] = useState('10');
  const [weight, setWeight] = useState('0');
  const [added, setAdded] = useState(false);

  // Reset state when exercise changes
  useEffect(() => {
    setSelectedProgramId(null);
    setSets('3');
    setReps('10');
    setWeight('0');
    setAdded(false);
  }, [exercise?.id]);

  if (!exercise) return null;

  const translation = getEnglishTranslation(exercise);
  const name = translation?.name ?? `Exercise #${exercise.id}`;
  const description = translation?.description ? stripHtml(translation.description) : '';
  const mainImage = exercise.images.find(i => i.is_main) ?? exercise.images[0];
  const primaryMuscles = exercise.muscles.filter(m => m.name_en || m.name);
  const secondaryMuscles = exercise.muscles_secondary.filter(m => m.name_en || m.name);

  const handleAdd = () => {
    if (!selectedProgramId || added) return;
    addExerciseToProgram(selectedProgramId, { exercise, sets, reps, weight });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <Modal
      visible
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safe}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={styles.closeBtn}>Fermer</Text>
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {mainImage && (
            <Image
              source={{ uri: resolveImageUrl(mainImage.image) }}
              style={styles.image}
              resizeMode="cover"
            />
          )}

          <View style={styles.content}>
            {/* Nom + catégorie */}
            <View style={styles.nameRow}>
              <Text style={styles.name}>{name}</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{exercise.category.name}</Text>
              </View>
            </View>

            {/* Muscles */}
            {(primaryMuscles.length > 0 || secondaryMuscles.length > 0) && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Muscles</Text>
                <View style={styles.tags}>
                  {primaryMuscles.map(m => (
                    <View key={m.id} style={styles.tag}>
                      <Text style={styles.tagText}>{m.name_en || m.name}</Text>
                    </View>
                  ))}
                  {secondaryMuscles.map(m => (
                    <View key={`s-${m.id}`} style={[styles.tag, styles.tagSecondary]}>
                      <Text style={[styles.tagText, styles.tagTextSecondary]}>
                        {m.name_en || m.name}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Équipement */}
            {exercise.equipment.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Équipement</Text>
                <View style={styles.tags}>
                  {exercise.equipment.map(eq => (
                    <View key={eq.id} style={[styles.tag, styles.tagEquip]}>
                      <Text style={[styles.tagText, styles.tagTextEquip]}>{eq.name}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Description */}
            {description.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Description</Text>
                <Text style={styles.description}>{description}</Text>
              </View>
            )}

            {/* Ajouter à un programme */}
            <View style={styles.addSection}>
              <Text style={styles.sectionTitle}>Ajouter à un programme</Text>

              {programs.length === 0 ? (
                <Text style={styles.noPrograms}>
                  Aucun programme enregistré.{'\n'}Crée-en un dans l'onglet Programme.
                </Text>
              ) : (
                <>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.programScroll}
                  >
                    {programs.map(p => (
                      <TouchableOpacity
                        key={p.id}
                        style={[
                          styles.programChip,
                          selectedProgramId === p.id && styles.programChipActive,
                        ]}
                        onPress={() =>
                          setSelectedProgramId(prev => prev === p.id ? null : p.id)
                        }
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.programChipText,
                            selectedProgramId === p.id && styles.programChipTextActive,
                          ]}
                        >
                          {p.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  {selectedProgramId && (
                    <>
                      <View style={styles.fieldsRow}>
                        <View style={styles.field}>
                          <Text style={styles.fieldLabel}>Séries</Text>
                          <TextInput
                            style={styles.fieldInput}
                            value={sets}
                            onChangeText={v => setSets(v.replace(/[^0-9]/g, ''))}
                            keyboardType="number-pad"
                            maxLength={2}
                            selectTextOnFocus
                          />
                        </View>
                        <View style={styles.fieldSep} />
                        <View style={styles.field}>
                          <Text style={styles.fieldLabel}>Reps</Text>
                          <TextInput
                            style={styles.fieldInput}
                            value={reps}
                            onChangeText={v => setReps(v.replace(/[^0-9]/g, ''))}
                            keyboardType="number-pad"
                            maxLength={3}
                            selectTextOnFocus
                          />
                        </View>
                        <View style={styles.fieldSep} />
                        <View style={styles.field}>
                          <Text style={styles.fieldLabel}>Poids (kg)</Text>
                          <TextInput
                            style={styles.fieldInput}
                            value={weight}
                            onChangeText={v => setWeight(v.replace(/[^0-9.]/g, ''))}
                            keyboardType="decimal-pad"
                            maxLength={5}
                            selectTextOnFocus
                          />
                        </View>
                      </View>

                      <TouchableOpacity
                        style={[styles.addBtn, added && styles.addBtnSuccess]}
                        onPress={handleAdd}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.addBtnText}>
                          {added ? 'Ajouté au programme !' : 'Ajouter au programme'}
                        </Text>
                      </TouchableOpacity>
                    </>
                  )}
                </>
              )}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#111',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  modalHeader: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: 'flex-end',
  },
  closeBtn: {
    color: '#f5c842',
    fontSize: 15,
    fontWeight: '600',
  },
  image: {
    width: '100%',
    height: 200,
    backgroundColor: '#1c1c1e',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 20,
  },
  name: {
    flex: 1,
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 30,
  },
  badge: {
    backgroundColor: '#f5c842',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  badgeText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '700',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#555',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#2c2c2e',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  tagSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#3a3a3c',
  },
  tagEquip: {
    backgroundColor: '#1c2a1c',
    borderWidth: 1,
    borderColor: '#2a4a2a',
  },
  tagText: {
    color: '#ccc',
    fontSize: 13,
    fontWeight: '500',
  },
  tagTextSecondary: {
    color: '#666',
  },
  tagTextEquip: {
    color: '#6abf6a',
  },
  description: {
    color: '#888',
    fontSize: 14,
    lineHeight: 22,
  },
  addSection: {
    backgroundColor: '#1c1c1e',
    borderRadius: 16,
    padding: 16,
    marginTop: 4,
  },
  noPrograms: {
    color: '#555',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    paddingVertical: 12,
  },
  programScroll: {
    gap: 8,
    paddingBottom: 14,
    flexDirection: 'row',
  },
  programChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#2c2c2e',
    borderWidth: 1,
    borderColor: '#3a3a3c',
  },
  programChipActive: {
    backgroundColor: '#f5c842',
    borderColor: '#f5c842',
  },
  programChipText: {
    color: '#888',
    fontSize: 13,
    fontWeight: '600',
  },
  programChipTextActive: {
    color: '#000',
  },
  fieldsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 12,
  },
  field: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
  },
  fieldLabel: {
    color: '#555',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  fieldInput: {
    color: '#f5c842',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    minWidth: 50,
  },
  fieldSep: {
    width: 1,
    height: 40,
    backgroundColor: '#2c2c2e',
  },
  addBtn: {
    backgroundColor: '#f5c842',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  addBtnSuccess: {
    backgroundColor: '#4CAF50',
  },
  addBtnText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 15,
  },
});
