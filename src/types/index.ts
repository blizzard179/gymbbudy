export interface Category {
  id: number;
  name: string;
}

export interface Muscle {
  id: number;
  name: string;
  name_en: string;
}

export interface Translation {
  id: number;
  name: string;
  language: number;
  description: string;
}

export interface Exercise {
  id: number;
  uuid: string;
  category: Category;
  muscles: Muscle[];
  muscles_secondary: Muscle[];
  translations: Translation[];
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
