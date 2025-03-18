import { useState } from 'react';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import Features from '@/components/Features';
import HowItWorks from '@/components/HowItWorks';
import PricingSection from '@/components/PricingSection';
import SearchResults from '@/components/SearchResults';
import Footer from '@/components/Footer';
import { Brief } from '@/components/BriefCard';
import { useToast } from '@/components/ui/use-toast';
import { sampleBriefs } from '@/data/sampleBriefs';
import { useLanguage } from '@/contexts/LanguageContext';

const Index = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Brief[]>([]);
  const { toast } = useToast();
  const { t } = useLanguage();
  
  const handleSearch = (query: string) => {
    if (!query.trim()) return;
    
    setSearchQuery(query);
    setIsSearching(true);
    
    // Simulate search API call
    setTimeout(() => {
      // Filter briefs based on search query (in a real app, this would be an API call)
      const filteredResults = sampleBriefs.filter(brief => 
        brief.title.toLowerCase().includes(query.toLowerCase()) || 
        brief.snippet.toLowerCase().includes(query.toLowerCase()) ||
        brief.courseName.toLowerCase().includes(query.toLowerCase())
      );
      
      setSearchResults(filteredResults);
      setIsSearching(false);
      
      if (filteredResults.length === 0) {
        toast({
          title: t('search.no_results'),
          description: `${t('search.no_results_desc')} "${query}". ${t('search.try_different')}`,
        });
      } else {
        toast({
          title: t('search.complete'),
          description: `${t('search.found')} ${filteredResults.length} ${t('search.results_for')} "${query}"`,
        });
      }
    }, 1500);
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
          <Features />
          <HowItWorks />
          <PricingSection />
        </>
      )}
      
      <Footer className="mt-auto" />
    </div>
  );
};

export default Index;
