# GymBuddy

Application mobile de suivi d'entraînement développée avec React Native et Expo. Elle permet de parcourir une bibliothèque d'exercices, de créer des programmes personnalisés, de logger des séances en temps réel et de visualiser sa progression.

---

## Équipe

| Prénom | Nom | Partie traitée |
|---|---|---|
| Alexis | Cantin | Bibliothèque d'exercices, création de programmes, log de séance, graphiques de progression |

---

## Fonctionnalités

- **Authentification** — inscription et connexion via Supabase Auth (email + mot de passe), sessions persistées
- **Bibliothèque d'exercices** — liste paginée depuis l'API wger, filtrable par catégorie musculaire et recherche textuelle
- **Création de programmes** — programmes nommés avec exercices, séries, répétitions et poids cible
- **Log de séance** — démarrage depuis un programme, saisie des reps/poids réels, timer de repos entre les séries
- **Historique** — séances passées stockées dans Supabase, consultables avec le détail de chaque série
- **Graphiques de progression** — courbe du poids soulevé par exercice dans le temps

---

## Installation

### Prérequis

- [Node.js](https://nodejs.org/) v18 ou supérieur
- [Expo Go](https://expo.dev/go) installé sur ton téléphone (iOS ou Android)

### Étapes

```bash
# 1. Cloner le dépôt
git clone <url-du-repo>
cd GymBuddy

# 2. Installer les dépendances
npm install

# 3. Configurer les variables d'environnement
cp .env.example .env
# Remplir .env avec tes clés Supabase (voir section ci-dessous)

# 4. Lancer l'application
npx expo start
```

Scanner le QR code affiché dans le terminal avec l'application Expo Go.

---

## Variables d'environnement

Copier `.env.example` en `.env` et renseigner les valeurs :

```env
EXPO_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

### Obtenir les clés Supabase

1. Créer un compte sur [supabase.com](https://supabase.com)
2. Créer un nouveau projet
3. Aller dans **Settings → API** pour récupérer l'URL et la clé `anon / public`

### Configurer l'authentification

Dans le dashboard Supabase → **Authentication → Settings** :
- S'assurer que le provider **Email** est activé
- Désactiver **"Enable email confirmations"** pour les tests (sinon l'utilisateur doit confirmer son email avant de se connecter)

### Créer la table en base

Dans le **SQL Editor** du dashboard Supabase, exécuter :

```sql
create table workout_sessions (
  id text primary key,
  program_id text,
  program_name text not null,
  started_at bigint not null,
  finished_at bigint not null,
  duration_seconds integer not null,
  logs jsonb not null default '[]',
  user_id uuid references auth.users(id),
  created_at timestamptz default now()
);

alter table workout_sessions enable row level security;

create policy "user sessions" on workout_sessions
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

> Sans Supabase configuré, l'application fonctionne entièrement en local sans authentification (les séances sont perdues à la fermeture de l'app).

### API wger

L'application utilise l'API publique [wger Workout Manager](https://wger.de/api/v2) — aucune clé requise.

---

## Librairies utilisées

| Librairie | Justification |
|---|---|---|
| `@react-navigation/native` + `bottom-tabs` | Navigation par onglets, solution de référence pour React Native, API stable et bien documentée |
| `react-native-screens` + `safe-area-context` | Optimisation des performances de navigation et gestion des encoches/barres système |
| `@supabase/supabase-js` | Gratuit, proposé dans l'énoncé et déjà utilisé en cours |
| `@react-native-async-storage/async-storage` | Stockage local requis par le client Supabase pour persister la session d'authentification |
| `react-native-url-polyfill` | Polyfill URL requis par Supabase dans l'environnement React Native |
| `react-native-svg` | Rendu SVG natif pour les graphiques de progression — choisi à la place de bibliothèques tierces incompatibles avec Expo Go.

### API externe

| Source | Usage |
|---|---|
| [wger Workout Manager](https://wger.de/api/v2) | Base de données d'exercices open source, sans clé API, endpoints `/exerciseinfo/` et `/exercisecategory/` |

---

## Structure du projet

```
GymBuddy/
├── src/
│   ├── api/
│   │   ├── sessions.ts              # insertSession / fetchSessions (Supabase)
│   │   └── wger.ts                  # fetchExercises / fetchCategories
│   ├── components/
│   │   ├── CategoryFilter.tsx        # Filtre par catégorie musculaire
│   │   ├── ExerciseCard.tsx          # Carte d'exercice
│   │   ├── ExerciseDetailModal.tsx   # Modal détail + ajout au programme
│   │   └── SearchBar.tsx             # Barre de recherche avec debounce
│   ├── context/
│   │   ├── AuthContext.tsx           # État d'authentification (user, signIn, signUp, signOut)
│   │   └── ProgramContext.tsx        # État global (programmes, séances)
│   ├── lib/
│   │   └── supabase.ts               # Client Supabase
│   ├── navigation/
│   │   ├── AppNavigator.tsx          # Navigation par onglets (utilisateur connecté)
│   │   └── RootNavigator.tsx         # Aiguillage auth / app selon l'état de connexion
│   ├── screens/
│   │   ├── ExerciseLibraryScreen.tsx # Bibliothèque d'exercices
│   │   ├── HistoryScreen.tsx         # Historique des séances
│   │   ├── LoginScreen.tsx           # Connexion
│   │   ├── ProgressScreen.tsx        # Graphiques de progression
│   │   ├── ProgramCreationScreen.tsx # Gestion des programmes
│   │   ├── RegisterScreen.tsx        # Inscription
│   │   └── WorkoutSessionScreen.tsx  # Log de séance en direct
│   ├── types/
│   │   └── index.ts                  # Interfaces TypeScript
│   └── utils/
│       └── html.ts                   # Nettoyage des descriptions HTML
├── .env.example                      # Variables d'environnement à copier
├── App.tsx
└── index.ts
```
