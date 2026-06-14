# Heritage Silencieux — Frontend

> Une bibliothèque privée où les histoires trouvent leur foyer.

Heritage Silencieux est une application web de lecture et de partage littéraire en cercle fermé. Elle permet de gérer des clubs de lecture, des bibliothèques d'œuvres, des chapitres, la progression de lecture, et des critiques — le tout dans un environnement intime et invité.

---

## ✨ Fonctionnalités

- **Clubs de lecture** — Création et gestion de clubs publics ou privés, avec système d'invitation et de demande d'adhésion.
- **Bibliothèque** — Chaque club possède sa propre bibliothèque d'œuvres, organisées et filtrables.
- **Lecture de chapitres** — Lecture en ligne des chapitres avec suivi de progression par page.
- **Critiques & Notations** — Les membres peuvent rédiger des critiques et attribuer des étoiles aux œuvres lues.
- **Écriture collaborative** — Rédaction de chapitres via un éditeur Markdown intégré (EasyMDE).
- **Progression des membres** — Vue d'ensemble de l'avancement de lecture de chaque membre.
- **Administration** — Panneau d'administration pour les utilisateurs avec rôle `ADMIN` (gestion des comptes et modération).
- **Profil utilisateur** — Photo de profil personnalisable, avatar dragon généré selon l'identifiant.
- **Design immersif** — Interface sombre, typographie sérif, thèmes dragon par club et par livre.

---

## 🛠 Stack Technique

| Technologie | Rôle |
|---|---|
| [SvelteKit 2](https://svelte.dev/docs/kit) | Framework web (SSR + client) |
| [Svelte 5](https://svelte.dev/) | Composants UI (Runes mode) |
| [Tailwind CSS v4](https://tailwindcss.com/) | Styles utilitaires |
| [EasyMDE](https://easymde.js.org/) | Éditeur Markdown |
| [Vite 8](https://vite.dev/) | Bundler & serveur de développement |
| [Bun](https://bun.sh/) | Runtime & gestionnaire de paquets |
| [TypeScript](https://www.typescriptlang.org/) | Typage statique |

L'application communique avec un backend REST (Hono / Node.js) disponible sur `http://localhost:3000`.

---

## 📁 Structure du projet

```
src/
├── lib/
│   ├── api.ts              # Client API REST (clubs, livres, chapitres, membres…)
│   ├── auth-client.ts      # Authentification (session, connexion, inscription)
│   ├── breadcrumbs.svelte  # État réactif des fils d'ariane
│   ├── sidebar.svelte      # État du panneau latéral
│   ├── index.ts            # Utilitaires (avatar, email censuré, URLs…)
│   ├── assets/             # Icônes, logos
│   └── components/
│       ├── auth/           # Formulaires de connexion / inscription
│       ├── clubs/          # Liste et détails des clubs
│       ├── books/          # Détails des livres, formulaires
│       ├── chapters/       # Lecteur de chapitres, éditeur
│       ├── members/        # Liste des membres, progression
│       └── …
├── routes/
│   ├── +layout.svelte      # Layout global (header, session, navigation)
│   ├── +layout.ts          # Chargement de la session
│   ├── +page.svelte        # Page d'accueil (liste des clubs)
│   ├── admin/              # Panneau d'administration
│   ├── clubs/
│   │   └── [clubSlug]/
│   │       ├── +page.svelte
│   │       └── books/
│   │           └── [bookSlug]/
│   │               ├── +page.svelte   # Détail du livre
│   │               ├── write/         # Éditeur de chapitre
│   │               └── read/[chapterIndex]/  # Lecture d'un chapitre
│   └── cgu/                # Conditions Générales d'Utilisation
└── globals.css             # Design system global (tokens, thèmes, typographie)
```

---

## 🚀 Démarrage rapide

### Prérequis

- [Bun](https://bun.sh/) ≥ 1.0
- Backend Heritage Silencieux lancé sur `http://localhost:3000`

### Installation

```bash
bun install
```

### Développement

```bash
bun dev
```

L'application sera disponible sur [http://localhost:5173](http://localhost:5173).

### Build de production

```bash
bun run build
```

### Aperçu de la build

```bash
bun run preview
```

---

## 🐳 Docker

L'application peut être conteneurisée avec Docker. Elle utilise `@sveltejs/adapter-node` pour générer un serveur Node.js autonome.

### Build de l'image

```bash
docker build -t heritage-silencieux-frontend .
```

### Lancement du conteneur

```bash
docker run -p 3001:3000 \
  -e BACKEND_URL=http://your-backend:3000 \
  heritage-silencieux-frontend
```

L'interface sera accessible sur [http://localhost:3001](http://localhost:3001).

> **Note :** L'URL du backend est actuellement codée en dur dans `src/lib/api.ts` et `src/lib/auth-client.ts`. Pour un déploiement en production, il est recommandé de la configurer via une variable d'environnement.

---

## 🌐 Variables d'environnement

Actuellement, les URLs du backend sont définies directement dans le code source :

| Fichier | Constante | Valeur par défaut |
|---|---|---|
| `src/lib/api.ts` | `BACKEND_BASE` | `http://localhost:3000` |
| `src/lib/auth-client.ts` | `API_BASE` | `http://localhost:3000/api/auth` |

---

## 🎨 Design System

L'interface utilise un thème sombre immersif basé sur des couleurs nommées par dragon :

| Token | Couleur | Usage |
|---|---|---|
| `secondary` | `#D2B674` | Or doré — accents principaux |
| `primary` | `#CFDFC4` | Vert sauge — éléments interactifs |
| `accent` | `#E5B8CC` | Rose poudré — notifications, admin |
| `background` | `#1b1b1b` | Fond général |
| `foreground` | `#ffffff` | Texte principal |

**Typographie :**
- Titres : *EB Garamond* (serif élégant)
- Corps : *El Messiri* (sans-serif lisible)

---

## 📜 Licence

Usage privé et communautaire uniquement. Tous droits réservés.

---

*Heritage Silencieux — Là où les histoires trouvent leur foyer.*
