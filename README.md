# Intelligence Opérationnelle du Monde Physique

Plateforme d'IA agentique pour optimiser l'énergie et la logistique des PME industrielles.

## Vision

Transformer les PME industrielles en organisations ultra-efficientes grâce à une armée d'agents IA spécialisés.

## Architecture - L'Armée d'Agents

| Agent | Rôle |
|-------|------|
| **Scout** | Reconnaissance et collecte de données (énergie, logistique) |
| **Architect** | Conception de plans d'optimisation et calcul du ROI |
| **Compliance** | Vérification de conformité (ISO 14001, 50001, RGPD) |
| **Outreach** | Identification et acquisition de clients PME |

## Stack Technique

- **Frontend**: Next.js 15 + React + TypeScript + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Déploiement**: Vercel
- **Architecture**: Hybride (Option C)

## Installation

```bash
# 1. Cloner le projet
git clone https://github.com/TON-USERNAME/intelligence-operationnelle.git
cd intelligence-operationnelle

# 2. Installer les dépendances
npm install

# 3. Configurer l'environnement
copy env.example .env.local
# Puis éditer .env.local avec tes clés Supabase

# 4. Lancer le serveur de développement
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000) dans ton navigateur.

## Configuration Supabase

1. Créer un projet sur [supabase.com](https://supabase.com)
2. Aller dans **Settings > API**
3. Copier `Project URL` et `anon public key`
4. Les coller dans ton fichier `.env.local`

## Structure du Projet

```
src/
├── agents/           # L'Armée d'Agents IA
│   ├── scout/        # Agent de reconnaissance
│   ├── architect/    # Agent de conception
│   ├── compliance/   # Agent de conformité
│   ├── outreach/     # Agent d'acquisition
│   └── index.ts      # Orchestrateur central
├── app/              # Pages Next.js (App Router)
├── lib/
│   └── supabase/     # Configuration base de données
└── components/       # Composants React (à créer)
```

## Roadmap

- [x] QG Numérique - Initialisation du projet
- [ ] Base de données Supabase
- [ ] Interface utilisateur de base
- [ ] Agent Scout - MVP
- [ ] Agent Architect - MVP
- [ ] Agent Compliance - MVP
- [ ] Agent Outreach - MVP
- [ ] Déploiement Vercel

## Déploiement

```bash
# Via Vercel CLI
npx vercel
```

Ou connecter le repo GitHub à [vercel.com](https://vercel.com) pour un déploiement automatique.

## Licence

Projet privé - Tous droits réservés.
