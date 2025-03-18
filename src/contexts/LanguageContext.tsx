import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

type Language = 'en' | 'fr';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Our translations
const translations: Record<Language, Record<string, string>> = {
  en: {
    // App titles
    'app.title': 'Lex Grove',
    'app.description': 'AI-powered legal research platform',
    
    // Navigation
    'nav.library': 'Library',
    'nav.collections': 'Collections',
    'nav.profile': 'Profile',
    'nav.home': 'Home',
    'nav.about': 'About',
    'nav.sign_in': 'Sign In',
    'nav.get_started': 'Get Started',
    
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
    'hero.tagline': 'AI-Powered Legal Research',
    'hero.title.1': 'Legal Briefs With',
    'hero.title.2': 'Intelligent Search',
    'hero.description': 'Access a database of case briefs created by law students, organized by an AI that understands your needs.',
    'hero.browse_library': 'Browse Library',
    'hero.how_it_works': 'How It Works',
    
    // About page
    'about.title': 'About Lex Grove',
    'about.subtitle': 'Revolutionizing legal education through AI-powered case brief management and analysis.',
    'about.mission.title': 'Our Mission',
    'about.mission.paragraph1': 'Lex Grove was founded with a clear mission: to make legal education more accessible, efficient, and collaborative. We believe that law students and professionals should have powerful tools that help them analyze, understand, and share legal knowledge.',
    'about.mission.paragraph2': 'Our platform combines the power of artificial intelligence with a community-focused approach to create a comprehensive ecosystem for case brief management, research, and learning.',
    'about.mission.quote': '"We envision a future where legal education transcends traditional boundaries, empowering the next generation of legal minds with tools that enhance understanding and collaboration."',
    'about.features.title': 'Key Features',
    'about.features.ai.title': 'AI-Powered Research',
    'about.features.ai.description': 'Our advanced AI analyzes legal concepts, extracts key insights from cases, and provides intelligent recommendations tailored to your research needs.',
    'about.features.library.title': 'Case Brief Library',
    'about.features.library.description': 'Access a comprehensive collection of case briefs covering major legal topics and precedents, organized for easy discovery and reference.',
    'about.features.community.title': 'Community Collaboration',
    'about.features.community.description': 'Share your insights with fellow law students and professionals, building a collaborative ecosystem of legal knowledge and expertise.',
    'about.features.collections.title': 'Personal Collections',
    'about.features.collections.description': 'Organize your case briefs into custom collections for efficient studying, research, and exam preparation tailored to your specific courses and interests.',
    'about.cta.title': 'Join the Lex Grove Community',
    'about.cta.description': 'Experience the future of legal education and research. Sign up today to access our platform and join thousands of law students and professionals already benefiting from our tools.',
    
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
  },
  fr: {
    // App titles
    'app.title': 'Lex Grove',
    'app.description': 'Plateforme de recherche juridique alimentée par l\'IA',
    
    // Navigation
    'nav.library': 'Bibliothèque',
    'nav.collections': 'Collections',
    'nav.profile': 'Profil',
    'nav.home': 'Accueil',
    'nav.about': 'À Propos',
    'nav.sign_in': 'Connexion',
    'nav.get_started': 'Commencer',
    
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
    'hero.tagline': 'Recherche Juridique par IA',
    'hero.title.1': 'Mémoires Juridiques Avec',
    'hero.title.2': 'Recherche Intelligente',
    'hero.description': 'Accédez à une base de données de mémoires juridiques créés par des étudiants en droit, organisée par une IA qui comprend vos besoins.',
    'hero.browse_library': 'Explorer la Bibliothèque',
    'hero.how_it_works': 'Comment Ça Marche',
    
    // About page
    'about.title': 'À Propos de Lex Grove',
    'about.subtitle': 'Révolutionner l\'éducation juridique grâce à la gestion et l\'analyse des mémoires juridiques assistées par l\'IA.',
    'about.mission.title': 'Notre Mission',
    'about.mission.paragraph1': 'Lex Grove a été fondé avec une mission claire : rendre l\'éducation juridique plus accessible, efficace et collaborative. Nous croyons que les étudiants en droit et les professionnels devraient disposer d\'outils puissants qui les aident à analyser, comprendre et partager les connaissances juridiques.',
    'about.mission.paragraph2': 'Notre plateforme combine la puissance de l\'intelligence artificielle avec une approche centrée sur la communauté pour créer un écosystème complet pour la gestion, la recherche et l\'apprentissage des mémoires juridiques.',
    'about.mission.quote': '"Nous envisageons un avenir où l\'éducation juridique transcende les frontières traditionnelles, donnant à la prochaine génération de juristes des outils qui améliorent la compréhension et la collaboration."',
    'about.features.title': 'Fonctionnalités Clés',
    'about.features.ai.title': 'Recherche Alimentée par l\'IA',
    'about.features.ai.description': 'Notre IA avancée analyse les concepts juridiques, extrait les informations clés des cas et fournit des recommandations intelligentes adaptées à vos besoins de recherche.',
    'about.features.library.title': 'Bibliothèque de Mémoires',
    'about.features.library.description': 'Accédez à une collection complète de mémoires juridiques couvrant les principaux sujets et précédents juridiques, organisée pour une découverte et référence faciles.',
    'about.features.community.title': 'Collaboration Communautaire',
    'about.features.community.description': 'Partagez vos insights avec d\'autres étudiants en droit et professionnels, construisant un écosystème collaboratif de connaissances et d\'expertise juridiques.',
    'about.features.collections.title': 'Collections Personnelles',
    'about.features.collections.description': 'Organisez vos mémoires juridiques en collections personnalisées pour une étude efficace, la recherche et la préparation aux examens adaptées à vos cours et intérêts spécifiques.',
    'about.cta.title': 'Rejoignez la Communauté Lex Grove',
    'about.cta.description': 'Découvrez l\'avenir de l\'éducation et de la recherche juridique. Inscrivez-vous aujourd\'hui pour accéder à notre plateforme et rejoindre des milliers d\'étudiants en droit et de professionnels qui bénéficient déjà de nos outils.',
    
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
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}; 