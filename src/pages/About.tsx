import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { ArrowRightIcon, SparklesIcon, ScaleIcon, BookOpenIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';

const About = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 mt-16">
        {/* Hero Section */}
        <div className="max-w-4xl mx-auto text-center mb-16 pt-8">
          <h1 className="text-4xl font-bold mb-6">About Lex Grove</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Revolutionizing legal education through AI-powered case brief management and analysis.
          </p>
        </div>

        {/* Mission Section */}
        <section className="max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
          <p className="text-lg mb-6">
            Lex Grove was founded with a clear mission: to make legal education more accessible, efficient, and collaborative. 
            We believe that law students and professionals should have powerful tools that help them analyze, understand, and share 
            legal knowledge.
          </p>
          <p className="text-lg mb-6">
            Our platform combines the power of artificial intelligence with a community-focused approach to create a comprehensive 
            ecosystem for case brief management, research, and learning.
          </p>
          <div className="p-6 bg-primary/5 rounded-xl border border-primary/10">
            <p className="italic text-center">
              "We envision a future where legal education transcends traditional boundaries, 
              empowering the next generation of legal minds with tools that enhance understanding 
              and collaboration."
            </p>
          </div>
        </section>

        {/* Key Features Section */}
        <section className="max-w-4xl mx-auto mb-16">
          <h2 className="text-3xl font-bold mb-8">Key Features</h2>
          <div className="grid gap-8 md:grid-cols-2">
            <div className="p-6 border rounded-xl">
              <div className="flex items-center mb-4">
                <SparklesIcon className="h-6 w-6 text-primary mr-3" />
                <h3 className="text-xl font-semibold">AI-Powered Research</h3>
              </div>
              <p>
                Our advanced AI analyzes legal concepts, extracts key insights from cases, and 
                provides intelligent recommendations tailored to your research needs.
              </p>
            </div>
            
            <div className="p-6 border rounded-xl">
              <div className="flex items-center mb-4">
                <ScaleIcon className="h-6 w-6 text-primary mr-3" />
                <h3 className="text-xl font-semibold">Case Brief Library</h3>
              </div>
              <p>
                Access a comprehensive collection of case briefs covering major legal topics 
                and precedents, organized for easy discovery and reference.
              </p>
            </div>
            
            <div className="p-6 border rounded-xl">
              <div className="flex items-center mb-4">
                <UserGroupIcon className="h-6 w-6 text-primary mr-3" />
                <h3 className="text-xl font-semibold">Community Collaboration</h3>
              </div>
              <p>
                Share your insights with fellow law students and professionals, building 
                a collaborative ecosystem of legal knowledge and expertise.
              </p>
            </div>
            
            <div className="p-6 border rounded-xl">
              <div className="flex items-center mb-4">
                <BookOpenIcon className="h-6 w-6 text-primary mr-3" />
                <h3 className="text-xl font-semibold">Personal Collections</h3>
              </div>
              <p>
                Organize your case briefs into custom collections for efficient studying, 
                research, and exam preparation tailored to your specific courses and interests.
              </p>
            </div>
          </div>
        </section>

        {/* Get Started CTA */}
        <section className="max-w-3xl mx-auto text-center py-12 px-6 border rounded-xl bg-primary/5">
          <h2 className="text-3xl font-bold mb-4">Join the Lex Grove Community</h2>
          <p className="text-lg mb-8">
            Experience the future of legal education and research. Sign up today to access our 
            platform and join thousands of law students and professionals already benefiting 
            from our tools.
          </p>
          <Button size="lg" className="px-8">
            Get Started <ArrowRightIcon className="h-4 w-4 ml-2" />
          </Button>
        </section>
      </main>
      <Footer className="mt-auto" />
    </div>
  );
};

export default About; 