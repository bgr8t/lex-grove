import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { SEO } from '@/components/SEO';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import {
  ArrowLeft,
  FileText,
  Users,
  ExternalLink
} from 'lucide-react';
import {
  BuildingOfficeIcon,
  MapPinIcon,
  ClockIcon,
  CurrencyDollarIcon,
  ArrowTopRightOnSquareIcon,
  HomeIcon
} from '@heroicons/react/24/outline';
import { Job, mockJobs } from '@/types/job';

export default function JobDetail() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { toast } = useToast();
  
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (jobId) {
      loadJob();
    }
  }, [jobId]);

  const loadJob = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Validate jobId input
      if (!jobId || typeof jobId !== 'string' || jobId.trim() === '') {
        setError('Invalid job ID');
        return;
      }
      
      // Simulate API call with proper error handling
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const foundJob = mockJobs.find(j => j.id === jobId.trim());
      
      if (!foundJob) {
        setError('Job not found');
        return;
      }

      setJob(foundJob);
    } catch (error) {
      console.error('Error loading job:', error);
      setError('Failed to load job details');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (!job?.applyUrl) return;
    
    try {
      // Validate URL before opening
      const url = job.applyUrl.trim();
      if (!url) return;
      
      if (url.startsWith('mailto:')) {
        window.location.href = url;
      } else {
        // Ensure URL is properly formatted
        const validUrl = url.startsWith('http') ? url : `https://${url}`;
        window.open(validUrl, '_blank', 'noopener,noreferrer');
      }
      
      toast({
        title: 'Opening Application',
        description: `Redirecting to ${job.company} application...`,
      });
    } catch (error) {
      console.error('Error opening application URL:', error);
      toast({
        title: 'Error',
        description: 'Unable to open application link. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'full-time': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'part-time': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'internship': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'contract': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'student': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'entry-level': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300';
      case 'experienced': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  // Loading state with mobile-first skeleton
  if (loading) {
    return (
      <>
        <SEO title="Loading Job..." description="Loading job details..." />
        <div className="min-h-screen bg-background">
          <Header />
          <main className="pt-20 md:pt-28 pb-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Navigation Skeleton */}
              <Skeleton className="h-10 w-32 rounded-lg" />
              
              {/* Header Skeleton */}
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-6 w-24 rounded-full" />
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
                <Skeleton className="h-8 md:h-10 w-3/4 rounded-lg" />
                <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
                  <Skeleton className="h-5 w-32 rounded" />
                  <Skeleton className="h-5 w-28 rounded" />
                </div>
              </div>
              
              {/* Content Skeletons */}
              <Card className="rounded-xl shadow-sm border-0 bg-muted/30">
                <CardContent className="p-6 space-y-4">
                  <Skeleton className="h-4 w-full rounded" />
                  <Skeleton className="h-4 w-full rounded" />
                  <Skeleton className="h-4 w-3/4 rounded" />
                  <Skeleton className="h-4 w-full rounded" />
                  <Skeleton className="h-4 w-2/3 rounded" />
                </CardContent>
              </Card>
            </div>
          </main>
          <Footer />
        </div>
      </>
    );
  }

  // Error state
  if (error || !job) {
    return (
      <>
        <SEO title="Job Not Found" description="The requested job posting could not be found." />
        <div className="min-h-screen bg-background">
          <Header />
          <main className="pt-20 md:pt-28 pb-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <Card className="rounded-xl shadow-lg border-0 bg-muted/20 backdrop-blur-sm">
                <CardContent className="p-8 md:p-12 text-center">
                  <div className="space-y-6">
                    <div className="w-16 h-16 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
                      <FileText className="w-8 h-8 text-destructive" />
                    </div>
                    <h2 className="text-2xl font-bold">Job Not Found</h2>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      {error || 'The job posting you\'re looking for doesn\'t exist or has been removed.'}
                    </p>
                    <Button 
                      onClick={() => navigate('/akazi')}
                      className="rounded-full shadow-md hover:shadow-lg transition-shadow"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back to Jobs
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
          <Footer />
        </div>
      </>
    );
  }

  // Structured data for SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    "title": job.title,
    "description": job.fullDescription,
    "hiringOrganization": {
      "@type": "Organization",
      "name": job.company
    },
    "jobLocation": {
      "@type": "Place",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": job.location
      }
    },
    "employmentType": job.type.toUpperCase().replace('-', '_'),
    "datePosted": new Date().toISOString(),
    "validThrough": new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    ...(job.salary && { 
      "baseSalary": { 
        "@type": "MonetaryAmount", 
        "currency": "CAD", 
        "value": { 
          "@type": "QuantitativeValue", 
          "value": job.salary 
        } 
      } 
    })
  };

  return (
    <>
      <SEO
        title={`${job.title} at ${job.company} | Legal Jobs`}
        description={job.shortDescription}
        keywords={`${job.title}, ${job.company}, legal jobs, ${job.location}, ${job.tags.join(', ')}`}
        canonicalUrl={`https://www.lexgrove.com/akazi/job/${job.id}`}
        ogType="website"
        structuredData={structuredData}
      />
      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="pt-20 md:pt-28 pb-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Navigation */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/akazi')}
                className="rounded-full hover:bg-muted/50 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to Jobs
              </Button>
            </div>

            {/* Job Header */}
            <div className="space-y-6">
              {/* Badges */}
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={`${getTypeColor(job.type)} rounded-full shadow-sm`}>
                  {t(`akazi.${job.type.replace('-', '_')}`)}
                </Badge>
                <Badge className={`${getLevelColor(job.level)} rounded-full shadow-sm`}>
                  {t(`akazi.${job.level.replace('-', '_')}`)}
                </Badge>
                {job.remote && (
                  <Badge variant="outline" className="gap-1 rounded-full shadow-sm">
                    <HomeIcon className="w-3 h-3" />
                    {t('akazi.remote')}
                  </Badge>
                )}
              </div>

              {/* Title */}
              <div>
                <h1 className="text-2xl md:text-4xl font-bold leading-tight mb-4">
                  {job.title}
                </h1>

                {/* Company and Location */}
                <div className="space-y-2 sm:space-y-0 sm:flex sm:items-center sm:gap-6 text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <BuildingOfficeIcon className="w-5 h-5" />
                    <span className="text-lg font-medium text-foreground">{job.company}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPinIcon className="w-5 h-5" />
                    <span>{job.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ClockIcon className="w-5 h-5" />
                    <span>Posted {job.posted}</span>
                  </div>
                </div>

                {/* Salary */}
                {job.salary && (
                  <div className="flex items-center gap-2 mt-3">
                    <CurrencyDollarIcon className="w-5 h-5 text-green-600" />
                    <span className="text-lg font-semibold text-green-600">{job.salary}</span>
                  </div>
                )}
              </div>

              {/* Apply Button */}
              <div className="pt-2">
                <Button 
                  onClick={handleApply}
                  className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 text-lg font-medium rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
                  size="lg"
                >
                  <ArrowTopRightOnSquareIcon className="h-5 w-5 mr-2" />
                  Apply for this Position
                </Button>
              </div>
            </div>

            {/* Job Description */}
            <Card className="rounded-xl shadow-sm border-0 bg-muted/20 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Job Description
                </CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm max-w-none">
                <div className="text-muted-foreground leading-relaxed whitespace-pre-line">
                  {job.fullDescription}
                </div>
              </CardContent>
            </Card>

            {/* Skills & Requirements */}
            <Card className="rounded-xl shadow-sm border-0 bg-muted/20 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Skills & Requirements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {job.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="rounded-full">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Apply Section */}
            <Card className="rounded-xl shadow-sm border-0 bg-gradient-to-br from-primary/5 to-primary/10 backdrop-blur-sm">
              <CardContent className="p-6 md:p-8">
                <div className="text-center space-y-4">
                  <h3 className="text-xl font-semibold">Ready to Apply?</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Take the next step in your legal career with {job.company}.
                  </p>
                  <Button 
                    onClick={handleApply}
                    className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 text-lg font-medium rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
                    size="lg"
                  >
                    <ExternalLink className="h-5 w-5 mr-2" />
                    Apply Now
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
} 