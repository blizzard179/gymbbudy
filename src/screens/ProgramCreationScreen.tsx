import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Modal,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
  StatusBar,
  KeyboardAvoidingView,
} from 'react-native';
import type { Exercise, ProgramExercise, Program } from '../types';
import { fetchExercises } from '../api/wger';
import { usePrograms } from '../context/ProgramContext';
import { SearchBar } from '../components/SearchBar';

function getEnglishName(exercise: Exercise): string {
  return exercise.translations.find(t => t.language === 2)?.name ?? `Exercise #${exercise.id}`;
}

// ─── Carte d'un programme sauvegardé ───────────────────────────────────────

function ProgramCard({ program }: { program: Program }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={styles.programCard}>
      <TouchableOpacity
        style={styles.programCardHeader}
        onPress={() => setExpanded(v => !v)}
        activeOpacity={0.7}
      >
        <View style={styles.programCardTitleRow}>
          <Text style={styles.programCardName}>{program.name}</Text>
          <View style={styles.programCardBadge}>
            <Text style={styles.programCardBadgeText}>
              {program.exercises.length} ex.
            </Text>
          </View>
        </View>
        <Text style={styles.programCardChevron}>{expanded ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.programCardExercises}>
          {program.exercises.map((pe, i) => (
            <View key={`${pe.exercise.id}-${i}`} style={styles.programExRow}>
              <Text style={styles.programExName} numberOfLines={1}>
                {getEnglishName(pe.exercise)}
              </Text>
              <Text style={styles.programExDetail}>
                {pe.sets}×{pe.reps}
                {Number(pe.weight) > 0 ? ` · ${pe.weight} kg` : ''}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

// ─── Écran principal ────────────────────────────────────────────────────────

export function ProgramCreationScreen() {
  const { programs, saveProgram } = usePrograms();
  const [view, setView] = useState<'list' | 'create'>('list');

  // Formulaire de création
  const [programName, setProgramName] = useState('');
  const [programExercises, setProgramExercises] = useState<ProgramExercise[]>([]);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');
  const [pickerDebounced, setPickerDebounced] = useState('');
  const [pickerExercises, setPickerExercises] = useState<Exercise[]>([]);
  const [pickerLoading, setPickerLoading] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setPickerDebounced(pickerSearch.trim()), 400);
    return () => clearTimeout(t);
  }, [pickerSearch]);

  useEffect(() => {
    if (!pickerVisible) return;
    let cancelled = false;
    setPickerLoading(true);
    fetchExercises({ limit: 100 })
      .then(data => { if (!cancelled) setPickerExercises(data.results); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setPickerLoading(false); });
    return () => { cancelled = true; };
  }, [pickerVisible]);

  const filteredExercises = pickerDebounced
    ? pickerExercises.filter(e =>
        getEnglishName(e).toLowerCase().includes(pickerDebounced.toLowerCase())
      )
    : pickerExercises;

  const addExercise = (exercise: Exercise) => {
    if (programExercises.some(pe => pe.exercise.id === exercise.id)) return;
    setProgramExercises(prev => [...prev, { exercise, sets: '3', reps: '10', weight: '0' }]);
    setPickerVisible(false);
    setPickerSearch('');
  };

  const removeExercise = (index: number) => {
    setProgramExercises(prev => prev.filter((_, i) => i !== index));
  };

  const updateField = (index: number, field: 'sets' | 'reps' | 'weight', value: string) => {
    const clean = value.replace(/[^0-9.]/g, '');
    setProgramExercises(prev =>
      prev.map((e, i) => i === index ? { ...e, [field]: clean } : e)
    );
  };

  const closePicker = () => {
    setPickerVisible(false);
    setPickerSearch('');
  };

  const handleSave = () => {
    if (!programName.trim()) {
      Alert.alert('Nom manquant', 'Donne un nom à ton programme.');
      return;
    }
    if (programExercises.length === 0) {
      Alert.alert('Programme vide', 'Ajoute au moins un exercice.');
      return;
    }
    saveProgram(programName.trim(), programExercises);
    Alert.alert(
      'Programme enregistré',
      `"${programName.trim()}" · ${programExercises.length} exercice${programExercises.length > 1 ? 's' : ''}`,
      [{
        text: 'Voir mes programmes',
        onPress: () => {
          setProgramName('');
          setProgramExercises([]);
          setView('list');
        },
      }]
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#111" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Programmes</Text>
          {view === 'create' && (
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.8}>
              <Text style={styles.saveBtnText}>Enregistrer</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Toggle */}
        <View style={styles.toggle}>
          <TouchableOpacity
            style={[styles.toggleBtn, view === 'list' && styles.toggleBtnActive]}
            onPress={() => setView('list')}
            activeOpacity={0.7}
          >
            <Text style={[styles.toggleLabel, view === 'list' && styles.toggleLabelActive]}>
              Mes programmes {programs.length > 0 ? `(${programs.length})` : ''}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, view === 'create' && styles.toggleBtnActive]}
            onPress={() => setView('create')}
            activeOpacity={0.7}
          >
            <Text style={[styles.toggleLabel, view === 'create' && styles.toggleLabelActive]}>
              + Nouveau
            </Text>
          </TouchableOpacity>
        </View>

        {/* Vue : liste des programmes */}
        {view === 'list' && (
          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
          >
            {programs.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyTitle}>Aucun programme</Text>
                <Text style={styles.emptySubtitle}>
                  Crée ton premier programme avec le bouton "Nouveau".
                </Text>
                <TouchableOpacity
                  style={styles.emptyBtn}
                  onPress={() => setView('create')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.emptyBtnText}>Créer un programme</Text>
                </TouchableOpacity>
              </View>
            ) : (
              programs.map(p => <ProgramCard key={p.id} program={p} />)
            )}
          </ScrollView>
        )}

        {/* Vue : formulaire de création */}
        {view === 'create' && (
          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <TextInput
              style={styles.nameInput}
              placeholder="Nom du programme..."
              placeholderTextColor="#444"
              value={programName}
              onChangeText={setProgramName}
              returnKeyType="done"
              maxLength={50}
            />

            {programExercises.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>
                  Exercices · {programExercises.length}
                </Text>
                {programExercises.map((pe, index) => (
                  <View key={`${pe.exercise.id}-${index}`} style={styles.exerciseCard}>
                    <View style={styles.exerciseCardHeader}>
                      <Text style={styles.exerciseCardName} numberOfLines={1}>
                        {getEnglishName(pe.exercise)}
                      </Text>
                      <TouchableOpacity
                        onPress={() => removeExercise(index)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Text style={styles.removeIcon}>x</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.fieldsRow}>
                      <View style={styles.field}>
                        <Text style={styles.fieldLabel}>Séries</Text>
                        <TextInput
                          style={styles.fieldInput}
                          value={pe.sets}
                          onChangeText={v => updateField(index, 'sets', v)}
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
                          value={pe.reps}
                          onChangeText={v => updateField(index, 'reps', v)}
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
                          value={pe.weight}
                          onChangeText={v => updateField(index, 'weight', v)}
                          keyboardType="decimal-pad"
                          maxLength={5}
                          selectTextOnFocus
                        />
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}

            <TouchableOpacity
              style={styles.addExerciseBtn}
              onPress={() => setPickerVisible(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.addExerciseBtnText}>+ Ajouter un exercice</Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </KeyboardAvoidingView>

      {/* Modal picker d'exercices */}
      <Modal
        visible={pickerVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closePicker}
      >
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Choisir un exercice</Text>
            <TouchableOpacity onPress={closePicker}>
              <Text style={styles.modalClose}>Fermer</Text>
            </TouchableOpacity>
          </View>

          <SearchBar value={pickerSearch} onChangeText={setPickerSearch} />

          {pickerLoading ? (
            <View style={styles.pickerLoader}>
              <ActivityIndicator color="#f5c842" size="large" />
            </View>
          ) : (
            <FlatList
              data={filteredExercises}
              keyExtractor={item => String(item.id)}
              renderItem={({ item }) => {
                const already = programExercises.some(pe => pe.exercise.id === item.id);
                return (
                  <TouchableOpacity
                    style={[styles.pickerRow, already && styles.pickerRowAdded]}
                    onPress={() => !already && addExercise(item)}
                    activeOpacity={already ? 1 : 0.7}
                  >
                    <View style={styles.pickerRowInfo}>
                      <Text
                        style={[styles.pickerRowName, already && styles.pickerRowNameAdded]}
                        numberOfLines={1}
                      >
                        {getEnglishName(item)}
                      </Text>
                      <Text style={styles.pickerRowCategory}>{item.category.name}</Text>
                    </View>
                    <Text style={already ? styles.pickerRowCheck : styles.pickerRowPlus}>
                      {already ? '✓' : '+'}
                    </Text>
                  </TouchableOpacity>
                );
              }}
              contentContainerStyle={styles.pickerList}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            />
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#111',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  flex: { flex: 1 },

  header: {
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
  saveBtn: {
    backgroundColor: '#f5c842',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  saveBtnText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 14,
  },

  // Toggle
  toggle: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#1c1c1e',
    borderRadius: 12,
    padding: 4,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 9,
    alignItems: 'center',
  },
  toggleBtnActive: {
    backgroundColor: '#2c2c2e',
  },
  toggleLabel: {
    color: '#555',
    fontSize: 13,
    fontWeight: '600',
  },
  toggleLabelActive: {
    color: '#fff',
  },

  scroll: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },

  // Programmes sauvegardés
  programCard: {
    backgroundColor: '#1c1c1e',
    borderRadius: 14,
    marginBottom: 12,
    overflow: 'hidden',
  },
  programCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  programCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  programCardName: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    flex: 1,
  },
  programCardBadge: {
    backgroundColor: '#2c2c2e',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  programCardBadgeText: {
    color: '#888',
    fontSize: 12,
    fontWeight: '600',
  },
  programCardChevron: {
    color: '#444',
    fontSize: 11,
    marginLeft: 10,
  },
  programCardExercises: {
    borderTopWidth: 1,
    borderTopColor: '#2c2c2e',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 0,
  },
  programExRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  programExName: {
    color: '#ccc',
    fontSize: 14,
    flex: 1,
    marginRight: 12,
  },
  programExDetail: {
    color: '#f5c842',
    fontSize: 13,
    fontWeight: '600',
  },

  // Empty state
  empty: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 10,
  },
  emptyTitle: {
    color: '#666',
    fontSize: 18,
    fontWeight: '700',
  },
  emptySubtitle: {
    color: '#444',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  emptyBtn: {
    marginTop: 10,
    backgroundColor: '#f5c842',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  emptyBtnText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 14,
  },

  // Formulaire de création
  nameInput: {
    backgroundColor: '#1c1c1e',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
  },
  section: {
    marginBottom: 16,
  },
  sectionLabel: {
    color: '#555',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  exerciseCard: {
    backgroundColor: '#1c1c1e',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  exerciseCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  exerciseCardName: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
    marginRight: 10,
  },
  removeIcon: {
    color: '#555',
    fontSize: 16,
    fontWeight: '700',
  },
  fieldsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    borderRadius: 10,
    overflow: 'hidden',
  },
  field: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
  },
  fieldLabel: {
    color: '#555',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 6,
    textTransform: 'uppercase',
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
  addExerciseBtn: {
    borderWidth: 1.5,
    borderColor: '#2c2c2e',
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  addExerciseBtnText: {
    color: '#555',
    fontSize: 15,
    fontWeight: '600',
  },

  // Modal picker
  modalSafe: {
    flex: 1,
    backgroundColor: '#111',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  modalClose: {
    color: '#f5c842',
    fontSize: 15,
    fontWeight: '600',
  },
  pickerLoader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerList: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1c1c1e',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
  },
  pickerRowAdded: {
    opacity: 0.5,
  },
  pickerRowInfo: {
    flex: 1,
    marginRight: 10,
  },
  pickerRowName: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 2,
  },
  pickerRowNameAdded: {
    color: '#888',
  },
  pickerRowCategory: {
    color: '#555',
    fontSize: 12,
  },
  pickerRowPlus: {
    color: '#f5c842',
    fontSize: 22,
    fontWeight: '300',
    lineHeight: 24,
  },
  pickerRowCheck: {
    color: '#f5c842',
    fontSize: 16,
    fontWeight: '700',
  },
});
