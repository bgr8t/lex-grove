import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import SocialProof from '@/components/SocialProof';
import Features from '@/components/Features';
import AgoraSpotlight from '@/components/AgoraSpotlight';
import ComposeSpotlight from '@/components/ComposeSpotlight';
import FAQ from '@/components/FAQ';
import HowItWorks from '@/components/HowItWorks';
import PricingSection from '@/components/PricingSection';
import SearchResults from '@/components/SearchResults';
import TopBriefs from '@/components/TopBriefs';
import Footer from '@/components/Footer';
import { Brief } from '@/components/BriefCard';
import { useToast } from '@/components/ui/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { caseBriefService } from '@/lib/services/caseBriefService';
import { caseBriefToBrief } from '@/lib/utils';

const Index = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Brief[]>([]);
  const { toast } = useToast();
  const { t } = useLanguage();
  const { currentUser } = useAuth();
  
  const handleSearch = async (query: string) => {
    if (!query.trim()) return;
    
    // Redirect to Library page with search query
    navigate(`/library?q=${encodeURIComponent(query)}`);
  };
  
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      {searchQuery && (
        <SearchResults 
          query={searchQuery}
          results={searchResults}
          loading={isSearching}
          onSearch={handleSearch}
          className="mt-24"
        />
      )}
      
      {!searchQuery && (
        <>
          <Hero onSearch={handleSearch} />
          <SocialProof />
          <Features />
          <AgoraSpotlight />
          <ComposeSpotlight />
          <TopBriefs />
          <FAQ />
          {!currentUser && <PricingSection />}
        </>
      )}
      
      <Footer className="mt-auto" />
    </div>
  );
};

export default Index;

