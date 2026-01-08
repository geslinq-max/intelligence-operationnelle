/**
 * L'Armée d'Agents - Intelligence Opérationnelle du Monde Physique
 * 
 * Point d'entrée central pour orchestrer tous les agents IA
 */

export { AgentScout, type ScoutReport, type EnergieData, type LogistiqueData, type Anomalie } from './scout';
export { AgentArchitect, type PlanOptimisation, type ActionOptimisation, type ROIEstimation } from './architect';
export { AgentCompliance, type RapportConformite, type NormeVerification, type AlerteConformite, NORMES_INDUSTRIELLES } from './compliance';
export { AgentOutreach, type ProspectPME, type Contact, type CampagneOutreach, type MetriquesCampagne } from './outreach';

/**
 * Orchestrateur Central - Coordonne les agents
 */
export class OrchestratorIA {
  async executerAnalyseComplete(entrepriseId: string) {
    // Pipeline complet : Scout → Architect → Compliance
    // À implémenter
  }

  async lancerProspection(criteres: object) {
    // Pipeline prospection : Outreach → Scout (qualification)
    // À implémenter
  }
}
