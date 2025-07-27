import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

type Language = 'en' | 'fr';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = React.createContext<LanguageContextType | undefined>(undefined);

// Our translations
const translations: Record<Language, Record<string, string>> = {
  en: {
    // App titles
    'app.title': 'Lex Grove',
    'app.description': 'Legal research platform',
    
    // Navigation
    'nav.library': 'Library',
    'nav.collections': 'Collections',
    'nav.profile': 'Profile',
    'nav.home': 'Home',
    'nav.about': 'About',
    'nav.akazi': 'Akazi',
    'nav.sign_in': 'Sign In',
    'nav.get_started': 'Get Started',
    'nav.blog': 'Blog',
    
    // Search
    'search.placeholder': 'Search legal briefs...',
    'search.button': 'Search',
    'search.results': 'Results',
    'search.no_results': 'No results found',
    'search.initiated': 'Search initiated',
    'search.searching_for': 'Searching for',
    'search.complete': 'Search complete',
    'search.found': 'Found',
    'search.results_for': 'results for',
    'search.no_results_desc': 'No briefs match',
    'search.try_different': 'Try a different search term',
    
    // Hero section
    'hero.tagline': 'Legal Research Made Simple',
    'hero.title.1': 'Legal Briefs',
    'hero.title.2': 'At Your Fingertips',
    'hero.description': 'Access a database of case briefs created by law students. Join a community that grows with its users and thrives on collaboration.',
    'hero.browse_library': 'Browse Library',
    'hero.how_it_works': 'How It Works',
    
    // About page
    'about.title': 'About Lex Grove',
    'about.subtitle': 'Revolutionizing legal education through collaborative case brief management.',
    'about.mission.title': 'Our Mission',
    'about.mission.paragraph1': 'Lex Grove was founded with a clear mission: to make legal education more accessible, efficient, and collaborative. We believe that law students and professionals should have powerful tools that help them analyze, understand, and share legal knowledge. Our community grows with each user contribution, creating a richer resource for everyone.',
    'about.mission.paragraph2': 'Our platform combines modern technology with a community-focused approach to create a comprehensive ecosystem for case brief management, research, and learning.',
    'about.mission.quote': '"We envision a future where legal education transcends traditional boundaries, empowering the next generation of legal minds with tools that enhance understanding and collaboration."',
    'about.features.title': 'Key Features',
    'about.features.ai.title': 'Smart Search',
    'about.features.ai.description': 'Find relevant case briefs quickly and efficiently with our search functionality.',
    'about.features.library.title': 'Case Brief Library',
    'about.features.library.description': 'Access a comprehensive collection of case briefs covering major legal topics and precedents, organized for easy discovery and reference.',
    'about.features.community.title': 'Community-Driven Growth',
    'about.features.community.description': 'Share your insights with fellow law students and professionals, building a collaborative ecosystem of legal knowledge and expertise. As you contribute, the platform evolves and improves for everyone.',
    'about.features.collections.title': 'Personal Collections',
    'about.features.collections.description': 'Organize your case briefs into custom collections for efficient studying, research, and exam preparation tailored to your specific courses and interests.',
    'about.cta.title': 'Join the Growing Lex Grove Community',
    'about.cta.description': 'Experience the future of collaborative legal education and research. Sign up today to access our platform and join thousands of law students and professionals already benefiting from our tools and contributing to our shared knowledge base.',
    
    // Briefs
    'brief.create': 'Create Brief',
    'brief.edit': 'Edit Brief',
    'brief.delete': 'Delete Brief',
    'brief.save': 'Save Brief',
    'brief.facts': 'Facts',
    'brief.issue': 'Issue',
    'brief.rule': 'Rule',
    'brief.analysis': 'Analysis',
    'brief.conclusion': 'Conclusion',
    'brief.summary': 'Summary',
    'brief.legal_analysis': 'Legal Analysis',
    'brief.by': 'By',
    'brief.share': 'Share',
    'brief.cite': 'Cite',
    'brief.saved': 'Saved',
    'brief.upvote': 'Upvote',
    'brief.downvote': 'Downvote',
    'brief.not_found': 'Brief not found',
    'brief.loading': 'Loading brief...',
    'brief.removed': 'Removed from library',
    'brief.added': 'Added to library',
    'brief.removed_desc': 'The brief has been removed from your library',
    'brief.added_desc': 'The brief has been added to your library',
    'brief.citation_copied': 'Citation copied',
    'brief.citation_copied_desc': 'The citation has been copied to your clipboard',
    'brief.link_copied': 'Link copied',
    'brief.link_copied_desc': 'The link has been copied to your clipboard',
    'brief.facts_placeholder': 'Facts of the case will be displayed here.',
    'brief.issue_placeholder': 'Legal issue(s) will be displayed here.',
    'brief.rule_placeholder': 'Legal rule(s) will be displayed here.',
    'brief.analysis_placeholder': 'Application of the rule to the facts will be displayed here.',
    'brief.conclusion_placeholder': 'Court\'s conclusion will be displayed here.',
    
    // Footer
    'footer.language': 'Language',
    'footer.rights': 'All rights reserved',
    'company': 'Company',
    'legal': 'Legal',
    'resources': 'Resources',
    
    // Link names
    'about': 'About',
    'careers': 'Careers',
    'contact': 'Contact',
    'terms': 'Terms',
    'privacy': 'Privacy',
    'cookies': 'Cookies',
    'blog': 'Blog',
    'help_center': 'Help Center',
    'guides': 'Guides',
    
    // Akazi (Jobs)
    'akazi.title': 'Legal Jobs & Opportunities',
    'akazi.subtitle': 'Find your next career opportunity in the legal field',
    'akazi.search_placeholder': 'Search jobs, companies, or locations...',
    'akazi.no_jobs': 'No jobs found',
    'akazi.no_jobs_desc': 'Try adjusting your search terms',
    'akazi.apply_now': 'Apply Now',
    'akazi.view_details': 'View Details',
    'akazi.posted': 'Posted',
    'akazi.company': 'Company',
    'akazi.location': 'Location',
    'akazi.salary': 'Salary',
    'akazi.type': 'Type',
    'akazi.remote': 'Remote',
    'akazi.full_time': 'Full-time',
    'akazi.part_time': 'Part-time',
    'akazi.internship': 'Internship',
    'akazi.contract': 'Contract',
    'akazi.entry_level': 'Entry Level',
    'akazi.experienced': 'Experienced',
    'akazi.student': 'Student/Graduate',
  },
  fr: {
    // App titles
    'app.title': 'Lex Grove',
    'app.description': 'Plateforme de recherche juridique',
    
    // Navigation
    'nav.library': 'Bibliothèque',
    'nav.collections': 'Collections',
    'nav.profile': 'Profil',
    'nav.home': 'Accueil',
    'nav.about': 'À Propos',
    'nav.akazi': 'Akazi',
    'nav.sign_in': 'Connexion',
    'nav.get_started': 'Commencer',
    'nav.blog': 'Blog',
    
    // Search
    'search.placeholder': 'Rechercher des mémoires juridiques...',
    'search.button': 'Rechercher',
    'search.results': 'Résultats',
    'search.no_results': 'Aucun résultat trouvé',
    'search.initiated': 'Recherche lancée',
    'search.searching_for': 'Recherche pour',
    'search.complete': 'Recherche terminée',
    'search.found': 'Trouvé',
    'search.results_for': 'résultats pour',
    'search.no_results_desc': 'Aucun mémoire ne correspond à',
    'search.try_different': 'Essayez un terme de recherche différent',
    
    // Hero section
    'hero.tagline': 'La Recherche Juridique Simplifiée',
    'hero.title.1': 'Mémoires Juridiques',
    'hero.title.2': 'À Portée de Main',
    'hero.description': 'Accédez à une base de données de mémoires juridiques créés par des étudiants en droit. Rejoignez une communauté qui grandit avec ses utilisateurs et prospère grâce à la collaboration.',
    'hero.browse_library': 'Explorer la Bibliothèque',
    'hero.how_it_works': 'Comment Ça Marche',
    
    // About page
    'about.title': 'À Propos de Lex Grove',
    'about.subtitle': 'Révolutionner l\'éducation juridique grâce à la gestion collaborative des mémoires juridiques.',
    'about.mission.title': 'Notre Mission',
    'about.mission.paragraph1': 'Lex Grove a été fondé avec une mission claire : rendre l\'éducation juridique plus accessible, efficace et collaborative. Nous croyons que les étudiants en droit et les professionnels devraient disposer d\'outils puissants qui les aident à analyser, comprendre et partager les connaissances juridiques. Notre communauté s\'enrichit avec chaque contribution des utilisateurs, créant ainsi une ressource plus riche pour tous.',
    'about.mission.paragraph2': 'Notre plateforme combine la technologie moderne avec une approche centrée sur la communauté pour créer un écosystème complet pour la gestion, la recherche et l\'apprentissage des mémoires juridiques.',
    'about.mission.quote': '"Nous envisageons un avenir où l\'éducation juridique transcende les frontières traditionnelles, donnant à la prochaine génération de juristes des outils qui améliorent la compréhension et la collaboration."',
    'about.features.title': 'Fonctionnalités Clés',
    'about.features.ai.title': 'Recherche Efficace',
    'about.features.ai.description': 'Trouvez rapidement et efficacement les mémoires juridiques pertinents avec notre fonctionnalité de recherche.',
    'about.features.library.title': 'Bibliothèque de Mémoires',
    'about.features.library.description': 'Accédez à une collection complète de mémoires juridiques couvrant les principaux sujets et précédents juridiques, organisée pour une découverte et référence faciles.',
    'about.features.community.title': 'Croissance Communautaire',
    'about.features.community.description': 'Partagez vos insights avec d\'autres étudiants en droit et professionnels, construisant un écosystème collaboratif de connaissances et d\'expertise juridiques. À mesure que vous contribuez, la plateforme évolue et s\'améliore pour tous.',
    'about.features.collections.title': 'Collections Personnelles',
    'about.features.collections.description': 'Organisez vos mémoires juridiques en collections personnalisées pour une étude efficace, la recherche et la préparation aux examens adaptées à vos cours et intérêts spécifiques.',
    'about.cta.title': 'Rejoignez la Communauté Grandissante de Lex Grove',
    'about.cta.description': 'Découvrez l\'avenir de l\'éducation et de la recherche juridique collaborative. Inscrivez-vous aujourd\'hui pour accéder à notre plateforme et rejoindre des milliers d\'étudiants en droit et de professionnels qui bénéficient déjà de nos outils et contribuent à notre base de connaissances partagée.',
    
    // Briefs
    'brief.create': 'Créer un Mémoire',
    'brief.edit': 'Modifier le Mémoire',
    'brief.delete': 'Supprimer le Mémoire',
    'brief.save': 'Enregistrer le Mémoire',
    'brief.facts': 'Faits',
    'brief.issue': 'Question',
    'brief.rule': 'Règle',
    'brief.analysis': 'Analyse',
    'brief.conclusion': 'Conclusion',
    'brief.summary': 'Résumé',
    'brief.legal_analysis': 'Analyse Juridique',
    'brief.by': 'Par',
    'brief.share': 'Partager',
    'brief.cite': 'Citer',
    'brief.saved': 'Enregistré',
    'brief.upvote': 'J\'aime',
    'brief.downvote': 'Je n\'aime pas',
    'brief.not_found': 'Mémoire non trouvé',
    'brief.loading': 'Chargement du mémoire...',
    'brief.removed': 'Retiré de la bibliothèque',
    'brief.added': 'Ajouté à la bibliothèque',
    'brief.removed_desc': 'Le mémoire a été retiré de votre bibliothèque',
    'brief.added_desc': 'Le mémoire a été ajouté à votre bibliothèque',
    'brief.citation_copied': 'Citation copiée',
    'brief.citation_copied_desc': 'La citation a été copiée dans votre presse-papiers',
    'brief.link_copied': 'Lien copié',
    'brief.link_copied_desc': 'Le lien a été copié dans votre presse-papiers',
    'brief.facts_placeholder': 'Les faits de l\'affaire seront affichés ici.',
    'brief.issue_placeholder': 'La question juridique sera affichée ici.',
    'brief.rule_placeholder': 'La règle juridique sera affichée ici.',
    'brief.analysis_placeholder': 'L\'application de la règle aux faits sera affichée ici.',
    'brief.conclusion_placeholder': 'La conclusion du tribunal sera affichée ici.',
    
    // Footer
    'footer.language': 'Langue',
    'footer.rights': 'Tous droits réservés',
    'company': 'Entreprise',
    'legal': 'Légal',
    'resources': 'Ressources',
    
    // Link names
    'about': 'À Propos',
    'careers': 'Carrières',
    'contact': 'Contact',
    'terms': 'Conditions',
    'privacy': 'Confidentialité',
    'cookies': 'Cookies',
    'blog': 'Blog',
    'help_center': 'Centre d\'Aide',
    'guides': 'Guides',
    
    // Akazi (Jobs)
    'akazi.title': 'Emplois et Opportunités Juridiques',
    'akazi.subtitle': 'Trouvez votre prochaine opportunité de carrière dans le domaine juridique',
    'akazi.search_placeholder': 'Rechercher des emplois, entreprises ou lieux...',
    'akazi.no_jobs': 'Aucun emploi trouvé',
    'akazi.no_jobs_desc': 'Essayez d\'ajuster vos termes de recherche',
    'akazi.apply_now': 'Postuler Maintenant',
    'akazi.view_details': 'Voir les Détails',
    'akazi.posted': 'Publié',
    'akazi.company': 'Entreprise',
    'akazi.location': 'Localisation',
    'akazi.salary': 'Salaire',
    'akazi.type': 'Type',
    'akazi.remote': 'À distance',
    'akazi.full_time': 'Temps plein',
    'akazi.part_time': 'Temps partiel',
    'akazi.internship': 'Stage',
    'akazi.contract': 'Contrat',
    'akazi.entry_level': 'Niveau Débutant',
    'akazi.experienced': 'Expérimenté',
    'akazi.student': 'Étudiant/Diplômé',
  }
};

export const LanguageProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  // Get initial language from localStorage or default to English
  const [language, setLanguageState] = useState<Language>(
    () => (localStorage.getItem('language') as Language) || 'en'
  );

  // Function to set language and save to localStorage
  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  };

  // Translation function
  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  // Update document language attribute when language changes
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

// Custom hook to use the language context
export const useLanguage = (): LanguageContextType => {
  const context = React.useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}; 