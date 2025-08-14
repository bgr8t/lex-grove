import React, { useState, useMemo } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { JobCard } from '@/components/JobCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/components/ui/use-toast';
import { 
  BriefcaseIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { Job, mockJobs } from '@/types/job';
import { SEO } from '@/components/SEO';

const Akazi: React.FC = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedLevel, setSelectedLevel] = useState<string>('');
  const [showRemoteOnly, setShowRemoteOnly] = useState(false);

  const jobTypes = ['full-time', 'part-time', 'internship', 'contract'];
  const jobLevels = ['student', 'entry-level', 'experienced'];

  // Filter and search jobs
  const filteredJobs = useMemo(() => {
    let filtered = mockJobs;

    // Search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(job =>
        job.title.toLowerCase().includes(searchLower) ||
        job.company.toLowerCase().includes(searchLower) ||
        job.location.toLowerCase().includes(searchLower) ||
        job.fullDescription.toLowerCase().includes(searchLower)||
        job.shortDescription.toLowerCase().includes(searchLower)||
        job.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    // Type filter
    if (selectedType) {
      filtered = filtered.filter(job => job.type === selectedType);
    }

    // Level filter
    if (selectedLevel) {
      filtered = filtered.filter(job => job.level === selectedLevel);
    }

    // Remote filter
    if (showRemoteOnly) {
      filtered = filtered.filter(job => job.remote);
    }

    return filtered;
  }, [searchTerm, selectedType, selectedLevel, showRemoteOnly]);

  const handleApply = (job: Job) => {
    toast({
      title: 'Opening Application',
      description: `Redirecting to ${job.company} application...`,
    });
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedType('');
    setSelectedLevel('');
    setShowRemoteOnly(false);
  };

  const hasActiveFilters = selectedType || selectedLevel || showRemoteOnly;

  return (
    <>
      <SEO
        title="Legal Job Board"
        description="Find law student, entry-level, and experienced legal positions in Canada. Browse internships, part-time, and full-time jobs at top law firms and organizations."
        keywords="legal jobs, law careers, student lawyer jobs, paralegal jobs, legal internships"
        canonicalUrl="https://www.lexgrove.com/akazi"
      />
      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="pt-28 md:pt-36 pb-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Hero Section */}
            <div className="text-center mb-12 px-6 sm:px-8 lg:px-12">
              <div className="flex items-center justify-center gap-2 mb-4 flex-wrap">
                <BriefcaseIcon className="w-8 h-8 text-primary flex-shrink-0" />
                <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent break-words leading-tight px-2 overflow-visible">
                  {t('akazi.title')}
                </h1>
              </div>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto px-4">
                {t('akazi.subtitle')}
              </p>
            </div>

            {/* Search and Filters */}
            <div className="mb-8 space-y-4">
              {/* Search Bar */}
              <div className="relative max-w-2xl mx-auto">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder={t('akazi.search_placeholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-12 text-center"
                />
              </div>

              {/* Filter Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-3">
                {/* Job Type Filters */}
                <div className="flex gap-2">
                  {jobTypes.map((type) => (
                    <Button
                      key={type}
                      variant={selectedType === type ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedType(selectedType === type ? '' : type)}
                      className="text-xs"
                    >
                      {t(`akazi.${type.replace('-', '_')}`)}
                    </Button>
                  ))}
                </div>

                {/* Level Filters */}
                <div className="flex gap-2">
                  {jobLevels.map((level) => (
                    <Button
                      key={level}
                      variant={selectedLevel === level ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedLevel(selectedLevel === level ? '' : level)}
                      className="text-xs"
                    >
                      {t(`akazi.${level.replace('-', '_')}`)}
                    </Button>
                  ))}
                </div>

                {/* Remote Filter */}
                <Button
                  variant={showRemoteOnly ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowRemoteOnly(!showRemoteOnly)}
                  className="text-xs"
                >
                  {t('akazi.remote')}
                </Button>

                {/* Clear Filters */}
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="gap-1 text-muted-foreground hover:text-foreground"
                  >
                    <XMarkIcon className="w-4 h-4" />
                    Clear
                  </Button>
                )}
              </div>

              {/* Active Filters Display */}
              {hasActiveFilters && (
                <div className="flex flex-wrap justify-center gap-2">
                  {selectedType && (
                    <Badge variant="secondary" className="gap-1">
                      {t(`akazi.${selectedType.replace('-', '_')}`)}
                      <button
                        onClick={() => setSelectedType('')}
                        className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
                      >
                        <XMarkIcon className="w-3 h-3" />
                      </button>
                    </Badge>
                  )}
                  {selectedLevel && (
                    <Badge variant="secondary" className="gap-1">
                      {t(`akazi.${selectedLevel.replace('-', '_')}`)}
                      <button
                        onClick={() => setSelectedLevel('')}
                        className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
                      >
                        <XMarkIcon className="w-3 h-3" />
                      </button>
                    </Badge>
                  )}
                  {showRemoteOnly && (
                    <Badge variant="secondary" className="gap-1">
                      {t('akazi.remote')}
                      <button
                        onClick={() => setShowRemoteOnly(false)}
                        className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
                      >
                        <XMarkIcon className="w-3 h-3" />
                      </button>
                    </Badge>
                  )}
                </div>
              )}
            </div>

            {/* Results Section */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold">
                  Available Positions
                </h2>
                <span className="text-muted-foreground">
                  {filteredJobs.length} {filteredJobs.length === 1 ? 'job' : 'jobs'} found
                </span>
              </div>

              {filteredJobs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredJobs.map((job) => (
                    <JobCard
                      key={job.id}
                      job={job}
                      onApply={handleApply}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <BriefcaseIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-muted-foreground mb-2">
                    {t('akazi.no_jobs')}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {t('akazi.no_jobs_desc')}
                  </p>
                  {hasActiveFilters && (
                    <Button onClick={clearFilters} variant="outline">
                      Clear All Filters
                    </Button>
                  )}
                </div>
              )}
            </section>

            {/* Info Section */}
            <section className="mt-16 text-center">
              <div className="bg-muted/30 rounded-lg p-8 backdrop-blur-sm">
                <h3 className="text-xl font-semibold mb-4">Looking to Post a Job?</h3>
                <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                  Are you a law firm, legal organization, or company looking to hire legal talent? 
                  Contact us to learn about posting opportunities on Akazi.
                </p>
                <Button variant="outline" onClick={() => window.location.href = 'mailto:contact@lexgrove.com'}>
                  Contact Us
                </Button>
              </div>
            </section>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Akazi; 