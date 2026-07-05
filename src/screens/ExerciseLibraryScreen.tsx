import React, { useState, useEffect } from 'react';
import {
  View,
  FlatList,
  Text,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import type { Category, Exercise } from '../types';
import { fetchCategories, fetchExercises } from '../api/wger';
import { SearchBar } from '../components/SearchBar';
import { CategoryFilter } from '../components/CategoryFilter';
import { ExerciseCard } from '../components/ExerciseCard';
import { ExerciseDetailModal } from '../components/ExerciseDetailModal';

const PAGE_SIZE = 20;
const SEARCH_LIMIT = 100;

interface FetchParams {
  category: number | undefined;
  search: string;
  offset: number;
}

export function ExerciseLibraryScreen() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>(undefined);
  const [params, setParams] = useState<FetchParams>({ category: undefined, search: '', offset: 0 });
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 400);
    return () => clearTimeout(t);
  }, [search]);

  // Load categories once
  useEffect(() => {
    fetchCategories().then(setCategories).catch(() => {});
  }, []);

  // Reset and reload when category or search changes
  useEffect(() => {
    setParams({ category: selectedCategory, search: debouncedSearch, offset: 0 });
  }, [selectedCategory, debouncedSearch]);

  // Fetch exercises whenever params change
  useEffect(() => {
    let cancelled = false;
    const searching = params.search.length > 0;
    const isLoadMore = params.offset > 0 && !searching;

    if (isLoadMore) setLoadingMore(true);
    else setLoading(true);
    setError(null);

    fetchExercises({
      limit: searching ? SEARCH_LIMIT : PAGE_SIZE,
      offset: searching ? 0 : params.offset,
      categoryId: params.category,
    })
      .then(data => {
        if (cancelled) return;
        setTotal(data.count);
        if (params.offset === 0 || searching) {
          setExercises(data.results);
        } else {
          setExercises(prev => [...prev, ...data.results]);
        }
      })
      .catch(() => {
        if (!cancelled) setError('Erreur de chargement. Vérifie ta connexion.');
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
          setLoadingMore(false);
        }
      });

    return () => { cancelled = true; };
  }, [params]);

  const isSearching = debouncedSearch.length > 0;

  const displayedExercises = isSearching
    ? exercises.filter(e =>
        e.translations
          .find(t => t.language === 2)
          ?.name.toLowerCase()
          .includes(debouncedSearch.toLowerCase())
      )
    : exercises;

  const handleLoadMore = () => {
    if (!isSearching && !loading && !loadingMore && exercises.length < total) {
      setParams(p => ({ ...p, offset: p.offset + PAGE_SIZE }));
    }
  };

  const handleCategorySelect = (id: number | undefined) => {
    setSelectedCategory(id);
    setSearch('');
  };

  const renderFooter = () => {
    if (loadingMore) {
      return (
        <View style={styles.footer}>
          <ActivityIndicator color="#FF6224" />
        </View>
      );
    }
    if (!isSearching && !loading && exercises.length > 0 && exercises.length >= total) {
      return (
        <View style={styles.footer}>
          <Text style={styles.footerText}>{total} exercices au total</Text>
        </View>
      );
    }
    return <View style={styles.footerPad} />;
  };

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>Aucun résultat</Text>
        <Text style={styles.emptySubtitle}>
          {isSearching
            ? `Aucun exercice trouvé pour "${debouncedSearch}"`
            : 'Aucun exercice dans cette catégorie'}
        </Text>
      </View>
    );
  };

  const displayCount = isSearching ? displayedExercises.length : exercises.length;
  const displayTotal = isSearching ? displayedExercises.length : total;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#111" />
      <View style={styles.container}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Exercise Library</Text>
          {!loading && displayTotal > 0 && (
            <Text style={styles.counter}>
              {displayCount}/{displayTotal}
            </Text>
          )}
        </View>

        <SearchBar value={search} onChangeText={setSearch} />
        <CategoryFilter
          categories={categories}
          selected={selectedCategory}
          onSelect={handleCategorySelect}
        />

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF6224" />
            <Text style={styles.loadingText}>Chargement...</Text>
          </View>
        ) : error ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Connexion impossible</Text>
            <Text style={styles.emptySubtitle}>{error}</Text>
          </View>
        ) : (
          <FlatList
            data={displayedExercises}
            keyExtractor={item => String(item.id)}
            renderItem={({ item }) => (
              <ExerciseCard exercise={item} onPress={() => setSelectedExercise(item)} />
            )}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.4}
            ListFooterComponent={renderFooter}
            ListEmptyComponent={renderEmpty}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      <ExerciseDetailModal
        exercise={selectedExercise}
        onClose={() => setSelectedExercise(null)}
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
  container: {
    flex: 1,
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
    letterSpacing: 0.3,
  },
  counter: {
    color: '#555',
    fontSize: 13,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#555',
    fontSize: 14,
  },
  list: {
    paddingTop: 4,
  },
  footer: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  footerPad: {
    height: 24,
  },
  footerText: {
    color: '#444',
    fontSize: 13,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    gap: 8,
  },
  emptyTitle: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  emptySubtitle: {
    color: '#444',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
