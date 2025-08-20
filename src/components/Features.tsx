
import { ArrowTrendingUpIcon, MagnifyingGlassIcon, BookmarkIcon, UserGroupIcon, EnvelopeIcon, DocumentTextIcon, ScaleIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

interface FeatureProps {
  title: string;
  description: string;
  icon: React.ReactNode;
}

const features: FeatureProps[] = [
  {
    title: "AI-Powered Email & Communication Suite",
    description: "Draft professional emails, client correspondence, and internal memos in seconds. Our intelligent Compose feature adapts to your tone, maintains privacy controls, and learns from your writing style.",
    icon: <EnvelopeIcon className="h-6 w-6" />,
  },
  {
    title: "Smart Document Creation & Proofreading",
    description: "Generate legal documents, contracts, and case briefs using AI. Our proofreader preserves legal terminology while fixing grammar and enhancing clarity—perfect for course notes and professional documents.",
    icon: <DocumentTextIcon className="h-6 w-6" />,
  },
  {
    title: "Intelligent Case Brief Generator",
    description: "Upload PDFs and create comprehensive case briefs using the IRAC method. Our AI extracts key legal concepts, organizes facts, and structures analysis while building your searchable case library.",
    icon: <ScaleIcon className="h-6 w-6" />,
  },
  {
    title: "Semantic Legal Research Engine",
    description: "Find precedent instantly with AI that understands legal concepts, not just keywords. Search thousands of cases by describing issues in plain English and access community-contributed briefs.",
    icon: <MagnifyingGlassIcon className="h-6 w-6" />,
  },
];

const FeatureCard = ({ feature, index }: { feature: FeatureProps, index: number }) => (
  <div 
    className={cn(
      "relative group h-full opacity-0 animate-slide-up",
      `animate-delay-${Math.min(index * 100, 500)}`
    )}
    style={{ 
      animationDelay: `${200 + index * 150}ms`, 
      animationFillMode: 'forwards' 
    }}
  >
    {/* Hover glow effect */}
    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
    
    <div className="relative backdrop-blur-sm bg-white/70 dark:bg-gray-900/70 rounded-2xl p-8 h-full border border-white/30 dark:border-gray-700/30 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-2">
      {/* Icon container with neumorphic styling */}
      <div className="relative mb-6 group-hover:scale-110 transition-transform duration-300">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center backdrop-blur-sm shadow-lg">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white shadow-inner">
            {feature.icon}
          </div>
        </div>
        
        {/* Floating icon decoration */}
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-accent to-primary rounded-full opacity-60 animate-pulse-subtle"></div>
      </div>
      
      <h3 className="text-xl font-semibold mb-4 leading-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
        {feature.title}
      </h3>
      
      <p className="text-muted-foreground leading-relaxed text-base">
        {feature.description}
      </p>
      
      {/* Bottom accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/0 via-primary/50 to-primary/0 rounded-b-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
    </div>
  </div>
);

interface FeaturesProps {
  className?: string;
}

export const Features = ({ className }: FeaturesProps) => {
  return (
    <section id="features" className={cn("py-20 md:py-32 relative overflow-hidden", className)}>
      {/* Background decorative elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 right-20 w-80 h-80 bg-gradient-to-br from-primary/5 to-accent/5 rounded-full blur-3xl opacity-60 animate-float-slow"></div>
        <div className="absolute bottom-20 left-20 w-64 h-64 bg-gradient-to-br from-secondary/5 to-primary/5 rounded-full blur-3xl opacity-40 animate-float-slow-reverse"></div>
      </div>
      
      <div className="container px-4 mx-auto relative z-10">
        {/* Section header */}
        <div className="text-center max-w-3xl mx-auto mb-16 md:mb-20">
          <div className="inline-flex items-center mb-6 relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/10 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative backdrop-blur-sm bg-white/60 dark:bg-gray-900/60 border border-white/30 dark:border-gray-700/30 rounded-full px-4 py-2 shadow-lg">
              <span className="text-sm font-medium text-primary">Features</span>
            </div>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-light tracking-tight mb-6 bg-gradient-to-r from-foreground via-foreground to-muted-foreground bg-clip-text text-transparent">
            AI-Powered Legal Composition Suite
          </h2>
          
          <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed">
            Revolutionary AI tools that transform how legal professionals write, research, and analyze—from drafting emails to generating case briefs in seconds.
          </p>
        </div>
        
        {/* Features grid */}
        <div className="grid gap-8 md:gap-10 grid-cols-1 md:grid-cols-2 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <FeatureCard key={feature.title} feature={feature} index={index} />
          ))}
        </div>
        
        {/* Bottom CTA section */}
        <div className="text-center mt-20 opacity-0 animate-fade-in" style={{ animationDelay: '1000ms', animationFillMode: 'forwards' }}>
          <div className="inline-flex items-center px-6 py-3 backdrop-blur-sm bg-white/50 dark:bg-gray-900/50 border border-white/30 dark:border-gray-700/30 rounded-full shadow-lg">
            <span className="text-muted-foreground text-sm font-medium">
              Ready to transform your legal workflow?
            </span>
          </div>
        </div>
      </div>
      
      {/* Decorative geometric elements */}
      <div className="absolute top-32 left-16 w-12 h-12 border border-primary/20 rounded-lg rotate-12 animate-subtle-bounce opacity-30"></div>
      <div className="absolute bottom-40 right-20 w-8 h-8 bg-gradient-to-br from-accent/30 to-primary/30 rounded-full animate-pulse-subtle"></div>
    </section>
  );
};

export default Features;
