'use client';

import Link from 'next/link';
import { ArrowLeft, Scale } from 'lucide-react';

export default function MentionsLegales() {
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
              <Scale className="w-7 h-7 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Mentions Légales</h1>
              <p className="text-slate-400">Dernière mise à jour : Janvier 2026</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-8 text-slate-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">1. Éditeur de la plateforme</h2>
            <p>
              La plateforme <strong className="text-cyan-400">CAPITAL ÉNERGIE</strong> est éditée par 
              une société spécialisée dans les solutions d&apos;audit et d&apos;optimisation industrielle.
            </p>
            <ul className="mt-4 space-y-2 text-slate-400">
              <li><strong>Raison sociale :</strong> CAPITAL ÉNERGIE SAS</li>
              <li><strong>Siège social :</strong> France</li>
              <li><strong>Contact :</strong> contact@capital-energie.fr</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">2. Hébergement</h2>
            <p>
              La plateforme est hébergée sur des infrastructures cloud sécurisées, 
              conformes aux normes européennes de protection des données :
            </p>
            <ul className="mt-4 space-y-2 text-slate-400">
              <li><strong>Hébergeur application :</strong> Vercel Inc. - San Francisco, CA (Serveurs EU)</li>
              <li><strong>Hébergeur base de données :</strong> Supabase - Serveurs localisés en Union Européenne</li>
              <li><strong>Certification :</strong> SOC 2 Type II, ISO 27001</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">3. Propriété intellectuelle</h2>
            <p>
              L&apos;ensemble des éléments constituant la plateforme CAPITAL ÉNERGIE 
              (textes, graphiques, logiciels, images, algorithmes d&apos;analyse, Cellules d'Expertise IA) 
              sont protégés par les lois relatives à la propriété intellectuelle.
            </p>
            <p className="mt-4">
              Toute reproduction, représentation, modification ou exploitation non autorisée 
              de tout ou partie de ces éléments est strictement interdite.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">4. Responsabilité</h2>
            <p>
              Les analyses et recommandations fournies par la plateforme sont générées 
              par des algorithmes d&apos;intelligence artificielle et constituent des aides à la décision.
            </p>
            <p className="mt-4">
              L&apos;utilisateur reste seul responsable des décisions prises sur la base de ces informations. 
              CAPITAL ÉNERGIE ne saurait être tenue responsable des conséquences 
              directes ou indirectes résultant de l&apos;utilisation des données fournies.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">5. Données personnelles</h2>
            <p>
              Conformément au Règlement Général sur la Protection des Données (RGPD), 
              vous disposez d&apos;un droit d&apos;accès, de rectification et de suppression 
              de vos données personnelles.
            </p>
            <p className="mt-4">
              Pour plus d&apos;informations, consultez notre{' '}
              <Link href="/confidentialite" className="text-cyan-400 hover:underline">
                Politique de Confidentialité
              </Link>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">6. Cookies</h2>
            <p>
              La plateforme utilise uniquement des cookies techniques essentiels 
              au fonctionnement du service (authentification, session utilisateur). 
              Aucun cookie publicitaire ou de tracking tiers n&apos;est utilisé.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">7. Droit applicable</h2>
            <p>
              Les présentes mentions légales sont régies par le droit français. 
              En cas de litige, les tribunaux français seront seuls compétents.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-slate-800 text-center text-slate-500 text-sm">
          <p>© 2026 CAPITAL ÉNERGIE. Tous droits réservés.</p>
        </div>
      </div>
    </div>
  );
}
