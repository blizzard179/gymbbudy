import type { Category, Exercise, PaginatedResponse } from '../types';

const BASE = 'https://wger.de/api/v2';
const LANG_EN = 2;

export async function fetchCategories(): Promise<Category[]> {
  const res = await fetch(`${BASE}/exercisecategory/?format=json`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return data.results as Category[];
}

export async function fetchExercises(params: {
  limit?: number;
  offset?: number;
  categoryId?: number;
}): Promise<PaginatedResponse<Exercise>> {
  const { limit = 20, offset = 0, categoryId } = params;
  let url = `${BASE}/exerciseinfo/?format=json&language=${LANG_EN}&limit=${limit}&offset=${offset}`;
  if (categoryId !== undefined) url += `&category=${categoryId}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
