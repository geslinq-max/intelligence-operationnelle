import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Registre Phyto Express | Saisie Mobile des Traitements',
  description: 'Enregistrez vos traitements phytosanitaires en 30 secondes. Alertes DAR automatiques, export PDF conforme pour contrôles officiels.',
  keywords: [
    'registre phytosanitaire',
    'traitement phyto',
    'DAR',
    'délai avant récolte',
    'viticulteur',
    'conformité',
    'HVE',
  ],
  openGraph: {
    title: 'Registre Phyto Express | CAPITAL ÉNERGIE',
    description: 'Saisie mobile des traitements, alertes DAR automatiques.',
    type: 'website',
    locale: 'fr_FR',
  },
  alternates: {
    canonical: '/viticulture/registre-phyto',
  },
};

export default function RegistrePhytoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
