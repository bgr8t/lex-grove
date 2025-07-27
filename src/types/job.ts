// Simple job interface for Akazi jobs section
export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: 'full-time' | 'part-time' | 'internship' | 'contract';
  level: 'student' | 'entry-level' | 'experienced';
  salary?: string;
  shortDescription: string; // For job cards
  fullDescription: string; // For preview dialog
  posted: string; // Date string
  remote: boolean;
  applyUrl: string;
  tags: string[];
}

// Mock job data for MVP
export const mockJobs: Job[] = [
  
  {
    id: '1',
    title: 'Stagiaire - Droit, Protection des renseignements personnels',
    company: 'BRP',
    location: 'Montreal, QC',
    type: 'internship',
    level: 'student',
    salary: 'Competitive salary + return bonus',
    shortDescription: 'Full-time internship for Fall 2025 (August to December). Join BRP\'s legal team to help define corporate vision and strategy. Work on privacy compliance programs, conduct industry research, assist with contract drafting, and support risk analysis.',
    fullDescription: `STAGE À TEMPS PLEIN POUR L'AUTOMNE 2025 | AOÛT À DÉCEMBRE 2025 | NIVEAU UNIVERSITAIRE | LIEU : MONTRÉAL

L'EXPÉRIENCE D'UNE VIE

Le programme de stages de BRP est réellement unique en son genre. Nous embauchons près de 300 stagiaires par année de tous les horizons, de tous les niveaux de compétence et de toutes les professions. Et bien souvent, ça se poursuit en emploi chez BRP parce que nous croyons qu'il faut investir dans nos talents pour les aider à réaliser leur plein potentiel. Chez BRP, tu collaboreras avec une équipe professionnelle expérimentée et tu auras l'occasion de travailler sur des projets stimulants en ayant un réel impact. Seras-tu notre relève de demain ? Postules dès maintenant !

Ton mandat :

En tant que membre de l'équipe légal, ton rôle sera d'aider BRP à définir sa vision et sa stratégie d'entreprise afin de soutenir sa croissance et son succès à long-terme. Pour ce faire, tu auras la chance d'avoir un accès privilégié aux membres de la direction de BRP et de participer au processus de prise de décision, offrant ainsi une opportunité unique d'apprendre des meilleurs de l'industrie.

Voici quelques-uns de tes défis dans le cadre de ton stage :

• Assister la responsable des renseignements personnels de BRP dans la mise en place d'un programme de conformité.
• Effectuer des recherches sur les tendances de l'industrie et les lois/réglementation dans le domaine.
• Assister les avocats dans la rédaction de contrats qui traitent de renseignements personnels.
• Assister dans les analyses de risque en matière de protection des renseignements personnels.
• Supporter l'équipe des services juridiques dans ses tâches quotidiennes.

Deviens notre relève si tu as ces compétences et qualités :

• Collaboratif(-ve), rigoureux(-se) et organisé(e), sait s'adapter et travailler de façon autonome ainsi qu'en groupe et à un rythme soutenu.
• Avoir un sens des affaires développé et comprendre comment des initiatives stratégiques et des programmes de conformité peuvent être implantées au sein de BRP.
• Capacités à analyser des problèmes complexes et à les présenter de façon structurée et détaillée.
• Bonne maîtrise de PowerPoint et Excel (modèles financiers à bâtir et préparation de présentations à la direction de l'entreprise).
• Intérêt notable pour le domaine des renseignements personnels.

Des avantages ? Ce n'est pas ce qui manque pour nos stagiaires !

• Un salaire compétitif et une prime de retour en stage : vous travaillez fort, nous le savons, alors nous vous offrons ce que vous méritez.
• Des horaires de travail flexibles : au bureau ou en télétravail, vous serez toujours supportés par votre équipe.
• Un environnement de travail des plus stimulants : le progrès ne vient pas en restant immobile. Vous aurez la chance d'apprendre et de relever des défis avec les meilleurs talents de demain.
• Des activités sociales : la cohorte de +100 stagiaires ne s'ennuie jamais avec un calendrier d'activités bien rempli par l'équipe de stages et le comité social !

BIENVENUE CHEZ BRP

Leader mondial dans le domaine des véhicules et des bateaux récréatifs, nous créons des moyens innovants de se déplacer sur la neige, l'eau, l'asphalte, la terre et… même dans les airs. Le siège social de notre entreprise se trouve dans la ville de Valcourt, au Québec, mais nous proposons des stages à Sherbrooke et Montréal également. Nous avons des usines de fabrication un peu partout dans le monde. Nous comptons sur plus de 20 000 personnes dynamiques, propulsées par la conviction profonde qu'au travail comme dans la vie, l'important n'est pas la destination. C'est le voyage. Le vôtre.

LE POUVOIR DE LA DIVERSITÉ

BRP s'engage à favoriser une culture qui invite, connecte et propulse les ambitions des employés de tous les horizons et de toutes les croyances et expériences. En fin de compte, la diversité et le caractère unique de nos employés stimulent notre ingéniosité et nous donnent une longueur d'avance pour l'avenir.

Pour cette raison, nous accordons une grande importance à la diversité et nous nous efforçons de toujours nous surpasser pour créer un environnement de travail où chaque employé se sent à sa place, peut s'épanouir et trouver un sens dans son travail.`,
    posted: '2025-07-22',
    remote: false,
    applyUrl: 'https://careers.brp.com/ca/fr/job/32008/Stagiaire---Droit-Protection-des-renseignements-personnels',
    tags: ['Privacy Law', 'Corporate Law', 'Compliance', 'Bilingual', 'Internship']
  }
]; 