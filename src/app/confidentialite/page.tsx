'use client';

import Link from 'next/link';
import { ArrowLeft, Shield, Lock, Server, UserCheck } from 'lucide-react';

export default function Confidentialite() {
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
            <div className="w-14 h-14 bg-green-500/20 rounded-xl flex items-center justify-center">
              <Shield className="w-7 h-7 text-green-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Politique de Confidentialité</h1>
              <p className="text-slate-400">Conforme au RGPD - Dernière mise à jour : Janvier 2026</p>
            </div>
          </div>
        </div>

        {/* Security badges */}
        <div className="grid grid-cols-3 gap-4 mb-12">
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 text-center">
            <Lock className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
            <p className="text-sm font-medium">Chiffrement AES-256</p>
            <p className="text-xs text-slate-500">Données au repos</p>
          </div>
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 text-center">
            <Server className="w-6 h-6 text-green-400 mx-auto mb-2" />
            <p className="text-sm font-medium">Serveurs EU</p>
            <p className="text-xs text-slate-500">Hébergement européen</p>
          </div>
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 text-center">
            <UserCheck className="w-6 h-6 text-purple-400 mx-auto mb-2" />
            <p className="text-sm font-medium">RGPD Compliant</p>
            <p className="text-xs text-slate-500">Certification active</p>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-8 text-slate-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">1. Responsable du traitement</h2>
            <p>
              CAPITAL ÉNERGIE SAS est responsable du traitement des données 
              personnelles collectées via la plateforme. Nous nous engageons à protéger 
              la vie privée de nos utilisateurs conformément au Règlement Général sur 
              la Protection des Données (RGPD) et à la loi Informatique et Libertés.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">2. Données collectées</h2>
            <p>Dans le cadre de l&apos;utilisation de notre plateforme, nous collectons :</p>
            <ul className="mt-4 space-y-3">
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 bg-cyan-400 rounded-full mt-2 flex-shrink-0"></span>
                <div>
                  <strong className="text-white">Données d&apos;identification :</strong>
                  <span className="text-slate-400"> Nom, prénom, adresse email professionnelle</span>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 bg-cyan-400 rounded-full mt-2 flex-shrink-0"></span>
                <div>
                  <strong className="text-white">Données d&apos;entreprise :</strong>
                  <span className="text-slate-400"> Raison sociale, SIRET, secteur d&apos;activité, données énergétiques et logistiques</span>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 bg-cyan-400 rounded-full mt-2 flex-shrink-0"></span>
                <div>
                  <strong className="text-white">Données techniques :</strong>
                  <span className="text-slate-400"> Logs de connexion, adresse IP (anonymisée)</span>
                </div>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">3. Finalités du traitement</h2>
            <p>Vos données sont utilisées exclusivement pour :</p>
            <ul className="mt-4 space-y-2 text-slate-400">
              <li>• Fournir les services d&apos;audit et d&apos;optimisation industrielle</li>
              <li>• Générer des rapports d&apos;analyse personnalisés</li>
              <li>• Identifier les subventions et aides auxquelles vous êtes éligible</li>
              <li>• Améliorer la qualité de nos algorithmes d&apos;intelligence artificielle</li>
              <li>• Assurer la sécurité et la maintenance de la plateforme</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">4. Sécurité des données</h2>
            <div className="bg-slate-900/50 border border-green-500/30 rounded-xl p-6">
              <p className="text-green-400 font-medium mb-4">Mesures de protection mises en place :</p>
              <ul className="space-y-3 text-slate-300">
                <li className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <span><strong>Chiffrement de bout en bout</strong> pour toutes les communications (TLS 1.3)</span>
                </li>
                <li className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <span><strong>Chiffrement AES-256</strong> pour les données stockées</span>
                </li>
                <li className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <span><strong>Isolation des données</strong> par utilisateur (Row Level Security)</span>
                </li>
                <li className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <span><strong>Authentification sécurisée</strong> avec tokens JWT</span>
                </li>
                <li className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <span><strong>Sauvegardes quotidiennes</strong> chiffrées et géo-redondantes</span>
                </li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">5. Conservation des données</h2>
            <p>
              Vos données sont conservées pendant toute la durée de votre utilisation du service, 
              puis pendant une durée de <strong className="text-white">3 ans</strong> après la fin de votre abonnement 
              pour répondre à nos obligations légales.
            </p>
            <p className="mt-4">
              Vous pouvez demander la suppression anticipée de vos données à tout moment.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">6. Vos droits</h2>
            <p>Conformément au RGPD, vous disposez des droits suivants :</p>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="bg-slate-800/50 rounded-lg p-4">
                <p className="font-medium text-white">Droit d&apos;accès</p>
                <p className="text-sm text-slate-400">Obtenir une copie de vos données</p>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-4">
                <p className="font-medium text-white">Droit de rectification</p>
                <p className="text-sm text-slate-400">Corriger vos informations</p>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-4">
                <p className="font-medium text-white">Droit à l&apos;effacement</p>
                <p className="text-sm text-slate-400">Supprimer vos données</p>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-4">
                <p className="font-medium text-white">Droit à la portabilité</p>
                <p className="text-sm text-slate-400">Exporter vos données</p>
              </div>
            </div>
            <p className="mt-4 text-slate-400">
              Pour exercer ces droits, contactez-nous à : <strong className="text-cyan-400">rgpd@capital-energie.fr</strong>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">7. Transferts de données</h2>
            <p>
              Vos données sont hébergées exclusivement sur des serveurs situés dans 
              l&apos;Union Européenne. Aucun transfert vers des pays tiers n&apos;est effectué 
              sans garanties appropriées conformes au RGPD.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">8. Contact DPO</h2>
            <p>
              Pour toute question relative à la protection de vos données, vous pouvez contacter 
              notre Délégué à la Protection des Données :
            </p>
            <p className="mt-4 text-cyan-400">dpo@capital-energie.fr</p>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-slate-800 text-center text-slate-500 text-sm">
          <p>© 2026 CAPITAL ÉNERGIE. Tous droits réservés.</p>
          <p className="mt-2">
            <Link href="/mentions-legales" className="hover:text-cyan-400 transition-colors">
              Mentions légales
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
