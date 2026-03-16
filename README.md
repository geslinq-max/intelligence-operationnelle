"Orchestrateur"
⚡ Intelligence Opérationnelle : Automatisation Administrative CEE
Orchestration de systèmes automatisés pour l'optimisation des flux administratifs et énergétiques des PME.

🧭 Vision & Approche
Ce projet n'est pas issu d'un développement traditionnel. Il a été conçu et déployé selon une approche de "Software Orchestration".

En tant qu'architecte de la solution, j'ai piloté des outils de nouvelle génération (Google Gemini, Windsurf, Cursor) pour transformer des besoins métier complexes en un système fonctionnel et modulaire. Ma valeur réside dans la conception de la logique, de l'architecture et du pilotage des agents IA pour produire un outil prêt à l'emploi.

🤖 L'Architecture du Système
Le logiciel s'appuie sur plusieurs "agents" spécialisés qui collaborent pour traiter un dossier de A à Z :

Agent	Fichier Source	Rôle & Expertise
Inbound	agent-inbound.js	Surveillance de flux (emails/dossiers) et réception des pièces.
Reader	lecteur-devis.js	Extraction de données structurées depuis des PDF via Regex & Logique IA.
Compliance	conformite-cee.js	Système expert vérifiant la conformité réglementaire (BAR-TH-104, etc.).
Router	agent-routeur.js	Automatisation de la prospection et reporting client personnalisé.
Pipeline	pipeline-admin.js	Orchestrateur central liant tous les modules entre eux.

Exporter vers Sheets

🛠 Stack Technique
Framework : Next.js 16 (App Router) + React 19 + TypeScript

UI/UX : Tailwind CSS + Lucide React + Recharts (Dashboards)

Backend & Sécurité : Supabase (PostgreSQL, Auth, SSR)

Paiements & Billing : Stripe Integration

Méthodologie : AI-Assisted Engineering (Windsurf / Gemini Antigravity)

🚀 Fonctionnalités Clés
Parsing Intelligent : Transformation de documents non-structurés en données exploitables.

Scoring de Sécurité : Calcul automatique d'un indice de fiabilité (0-100%) pour chaque dossier.

Alertes de Trésorerie : Détection automatique des points bloquants avant le dépôt des primes.

Prospection Automatisée : Génération d'emails personnalisés basés sur l'analyse de données prospects.

⚙️ Installation & Test
1. Cloner le projet
Bash

git clone https://github.com/geslinq-max/intelligence-operationnelle.git
cd intelligence-operationnelle
2. Installer les dépendances
Bash

npm install
3. Lancer un test de l'agent (Mode Sorcier)
Pour tester la logique d'analyse sans interface :

Bash

node agent-inbound.js test
📄 Licence & Note
Ce projet est une Preuve de Concept (PoC) avancée démontrant l'efficacité de l'automatisation par IA dans le secteur de l'énergie.
Développé en mode R&D indépendant par Max Geslin.
