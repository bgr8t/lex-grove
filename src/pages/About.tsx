import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { ArrowRightIcon, SparklesIcon, ScaleIcon, BookOpenIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

const About = () => {
  const { t } = useLanguage();
  
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 mt-16">
        {/* Hero Section */}
        <div className="max-w-4xl mx-auto text-center mb-16 pt-8">
          <h1 className="text-4xl font-bold mb-6">{t('about.title')}</h1>
          <p className="text-xl text-muted-foreground mb-8">
            {t('about.subtitle')}
          </p>
        </div>

        {/* Mission Section */}
        <section className="max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-bold mb-6">{t('about.mission.title')}</h2>
          <p className="text-lg mb-6">
            {t('about.mission.paragraph1')}
          </p>
          <p className="text-lg mb-6">
            {t('about.mission.paragraph2')}
          </p>
          <div className="p-6 bg-primary/5 rounded-xl border border-primary/10">
            <p className="italic text-center">
              {t('about.mission.quote')}
            </p>
          </div>
        </section>

        {/* Key Features Section */}
        <section className="max-w-4xl mx-auto mb-16">
          <h2 className="text-3xl font-bold mb-8">{t('about.features.title')}</h2>
          <div className="grid gap-8 md:grid-cols-2">
            <div className="p-6 border rounded-xl">
              <div className="flex items-center mb-4">
                <SparklesIcon className="h-6 w-6 text-primary mr-3" />
                <h3 className="text-xl font-semibold">{t('about.features.ai.title')}</h3>
              </div>
              <p>
                {t('about.features.ai.description')}
              </p>
            </div>
            
            <div className="p-6 border rounded-xl">
              <div className="flex items-center mb-4">
                <ScaleIcon className="h-6 w-6 text-primary mr-3" />
                <h3 className="text-xl font-semibold">{t('about.features.library.title')}</h3>
              </div>
              <p>
                {t('about.features.library.description')}
              </p>
            </div>
            
            <div className="p-6 border rounded-xl">
              <div className="flex items-center mb-4">
                <UserGroupIcon className="h-6 w-6 text-primary mr-3" />
                <h3 className="text-xl font-semibold">{t('about.features.community.title')}</h3>
              </div>
              <p>
                {t('about.features.community.description')}
              </p>
            </div>
            
            <div className="p-6 border rounded-xl">
              <div className="flex items-center mb-4">
                <BookOpenIcon className="h-6 w-6 text-primary mr-3" />
                <h3 className="text-xl font-semibold">{t('about.features.collections.title')}</h3>
              </div>
              <p>
                {t('about.features.collections.description')}
              </p>
            </div>
          </div>
        </section>

        {/* Get Started CTA */}
        <section className="max-w-3xl mx-auto text-center py-12 px-6 border rounded-xl bg-primary/5">
          <h2 className="text-3xl font-bold mb-4">{t('about.cta.title')}</h2>
          <p className="text-lg mb-8">
            {t('about.cta.description')}
          </p>
        </section>
      </main>
      <Footer className="mt-auto" />
    </div>
  );
};

export default About; 