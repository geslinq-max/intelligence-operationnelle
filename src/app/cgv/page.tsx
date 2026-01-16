'use client';

import Link from 'next/link';
import { ArrowLeft, FileText, Shield, AlertTriangle, CreditCard, Scale } from 'lucide-react';

export default function CGV() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <Link 
            href="/"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-cyan-400 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour au tableau de bord
          </Link>
          
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-cyan-500/20 rounded-xl flex items-center justify-center">
              <FileText className="w-7 h-7 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Conditions Générales de Vente</h1>
              <p className="text-slate-400">Logiciel SaaS B2B - Dernière mise à jour : Janvier 2026</p>
            </div>
          </div>
        </div>

        {/* Badges importants */}
        <div className="grid grid-cols-3 gap-4 mb-12">
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 text-center">
            <Shield className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
            <p className="text-sm font-medium">SaaS B2B</p>
            <p className="text-xs text-slate-500">Licence d&apos;utilisation</p>
          </div>
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 text-center">
            <CreditCard className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
            <p className="text-sm font-medium">Paiement Sécurisé</p>
            <p className="text-xs text-slate-500">Stripe Checkout</p>
          </div>
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 text-center">
            <Scale className="w-6 h-6 text-violet-400 mx-auto mb-2" />
            <p className="text-sm font-medium">Droit Français</p>
            <p className="text-xs text-slate-500">Juridiction applicable</p>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-8 text-slate-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">1. Objet</h2>
            <p>
              Les présentes Conditions Générales de Vente (CGV) régissent les relations contractuelles 
              entre <strong className="text-cyan-400">CAPITAL ÉNERGIE SAS</strong> (ci-après &quot;le Prestataire&quot;) 
              et tout professionnel (ci-après &quot;le Client&quot;) souscrivant à un abonnement aux services 
              de la plateforme CAPITAL ÉNERGIE.
            </p>
            <p className="mt-4">
              La plateforme CAPITAL ÉNERGIE est un logiciel SaaS (Software as a Service) destiné aux 
              professionnels du secteur de la rénovation énergétique, proposant des outils d&apos;audit, 
              de vérification de conformité et d&apos;assistance à la constitution de dossiers CEE.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">2. Nature du Service</h2>
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-6 mb-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-amber-400 flex-shrink-0 mt-1" />
                <div>
                  <p className="text-amber-400 font-semibold mb-2">Clause importante</p>
                  <p className="text-slate-300">
                    <strong>Le Scanner Flash est un outil d&apos;assistance à la conformité.</strong> Il ne 
                    se substitue pas à l&apos;expertise d&apos;un professionnel qualifié RGE (Reconnu Garant 
                    de l&apos;Environnement) et ne garantit pas l&apos;approbation finale des dossiers par 
                    les organismes certificateurs.
                  </p>
                </div>
              </div>
            </div>
            <p>
              Les services fournis comprennent notamment :
            </p>
            <ul className="mt-4 space-y-3">
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 bg-cyan-400 rounded-full mt-2 flex-shrink-0"></span>
                <span>Analyse automatisée de documents (devis, attestations, factures)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 bg-cyan-400 rounded-full mt-2 flex-shrink-0"></span>
                <span>Détection de non-conformités potentielles</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 bg-cyan-400 rounded-full mt-2 flex-shrink-0"></span>
                <span>Génération de rapports d&apos;audit préliminaires</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 bg-cyan-400 rounded-full mt-2 flex-shrink-0"></span>
                <span>Suivi de l&apos;état des dossiers en cours</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">3. Responsabilité du Client</h2>
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 mb-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
                <div>
                  <p className="text-red-400 font-semibold mb-2">Clause de responsabilité</p>
                  <p className="text-slate-300">
                    <strong>L&apos;artisan reste responsable de la véracité des documents fournis.</strong> Le 
                    Client s&apos;engage à fournir des informations exactes, complètes et à jour. Toute 
                    erreur, omission ou falsification de documents engage la seule responsabilité du Client.
                  </p>
                </div>
              </div>
            </div>
            <p>Le Client s&apos;engage notamment à :</p>
            <ul className="mt-4 space-y-2 text-slate-400">
              <li>• Fournir des documents authentiques et non falsifiés</li>
              <li>• Vérifier l&apos;exactitude des informations saisies</li>
              <li>• Faire valider les dossiers finaux par un professionnel RGE qualifié</li>
              <li>• Se conformer à la réglementation CEE en vigueur</li>
              <li>• Ne pas utiliser la plateforme à des fins frauduleuses</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">4. Limitation de Responsabilité</h2>
            <p>
              CAPITAL ÉNERGIE fournit un service d&apos;assistance et d&apos;aide à la décision. En aucun cas, 
              le Prestataire ne pourra être tenu responsable :
            </p>
            <ul className="mt-4 space-y-2 text-slate-400">
              <li>• Du rejet d&apos;un dossier par un organisme certificateur</li>
              <li>• De la perte de primes CEE consécutive à un dossier incomplet ou non conforme</li>
              <li>• Des conséquences d&apos;informations erronées fournies par le Client</li>
              <li>• De l&apos;évolution de la réglementation postérieure à l&apos;analyse</li>
            </ul>
            <p className="mt-4 text-slate-400 italic">
              La responsabilité du Prestataire est limitée au montant des sommes effectivement 
              versées par le Client au cours des 12 derniers mois.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">5. Tarifs et Paiement</h2>
            <p>
              Les tarifs des différents forfaits sont indiqués en euros hors taxes (HT) sur la page 
              Tarifs de la plateforme. La TVA applicable est ajoutée au moment du paiement.
            </p>
            <ul className="mt-4 space-y-2 text-slate-400">
              <li>• <strong className="text-white">Forfait Essentiel :</strong> 149 €/mois HT - 3 dossiers/mois</li>
              <li>• <strong className="text-white">Forfait Sérénité :</strong> 349 €/mois HT - 15 dossiers/mois</li>
              <li>• <strong className="text-white">Forfait Expert :</strong> 860 €/mois HT - Dossiers illimités</li>
            </ul>
            <p className="mt-4">
              Le paiement s&apos;effectue par carte bancaire via la plateforme sécurisée Stripe. 
              L&apos;abonnement est reconduit tacitement chaque mois sauf résiliation par le Client.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">6. Durée et Résiliation</h2>
            <p>
              L&apos;abonnement est conclu pour une durée indéterminée avec une période minimale 
              d&apos;engagement d&apos;un mois. Le Client peut résilier son abonnement à tout moment 
              depuis son espace personnel, avec effet à la fin de la période de facturation en cours.
            </p>
            <p className="mt-4">
              En cas de manquement grave aux présentes CGV, le Prestataire se réserve le droit 
              de suspendre ou résilier l&apos;accès au service sans préavis ni remboursement.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">7. Propriété Intellectuelle</h2>
            <p>
              L&apos;ensemble des éléments de la plateforme (algorithmes, interfaces, rapports générés, 
              marques) reste la propriété exclusive de CAPITAL ÉNERGIE. Le Client bénéficie d&apos;un 
              droit d&apos;utilisation non exclusif et non transférable pendant la durée de son abonnement.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">8. Protection des Données</h2>
            <p>
              Le traitement des données personnelles est régi par notre{' '}
              <Link href="/confidentialite" className="text-cyan-400 hover:underline">
                Politique de Confidentialité
              </Link>, conforme au RGPD. Les données des chantiers sont traitées uniquement 
              dans le cadre de la fourniture du service et ne sont jamais revendues à des tiers.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">9. Droit Applicable</h2>
            <p>
              Les présentes CGV sont soumises au droit français. En cas de litige, les parties 
              s&apos;engagent à rechercher une solution amiable. À défaut, les tribunaux de Paris 
              seront seuls compétents.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">10. Acceptation</h2>
            <p>
              La souscription à un abonnement implique l&apos;acceptation pleine et entière des 
              présentes Conditions Générales de Vente. Le Client reconnaît en avoir pris 
              connaissance avant toute souscription.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-slate-800 text-center text-slate-500 text-sm">
          <p>© 2026 CAPITAL ÉNERGIE. Tous droits réservés.</p>
          <div className="mt-4 flex justify-center gap-4">
            <Link href="/mentions-legales" className="hover:text-cyan-400 transition-colors">
              Mentions légales
            </Link>
            <span>•</span>
            <Link href="/confidentialite" className="hover:text-cyan-400 transition-colors">
              Confidentialité
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
