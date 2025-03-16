
import { ArrowTrendingUpIcon, MagnifyingGlassIcon, BookmarkIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

interface FeatureProps {
  title: string;
  description: string;
  icon: React.ReactNode;
}

const features: FeatureProps[] = [
  {
    title: "AI-Powered Search",
    description: "Our intelligent search understands legal concepts, not just keywords, giving you more accurate results.",
    icon: <MagnifyingGlassIcon className="h-5 w-5" />,
  },
  {
    title: "Personal Library",
    description: "Save briefs to your personal library for quick access during exams or case preparation.",
    icon: <BookmarkIcon className="h-5 w-5" />,
  },
  {
    title: "Community Access",
    description: "Access briefs created by peers, providing diverse perspectives on complex legal cases.",
    icon: <UserGroupIcon className="h-5 w-5" />,
  },
  {
    title: "Improved Study Efficiency",
    description: "Spend less time searching and more time learning with our streamlined research system.",
    icon: <ArrowTrendingUpIcon className="h-5 w-5" />,
  },
];

const FeatureCard = ({ feature, index }: { feature: FeatureProps, index: number }) => (
  <div 
    className={cn(
      "glass-panel rounded-xl p-6 transition-all duration-300 hover:shadow-md border border-border/50 hover:border-primary/20",
      "animate-scale-in",
      `animate-delay-${index * 100}`
    )}
  >
    <div className="rounded-full bg-primary/10 w-10 h-10 flex items-center justify-center mb-4">
      <span className="text-primary">{feature.icon}</span>
    </div>
    <h3 className="text-lg font-medium mb-2">{feature.title}</h3>
    <p className="text-muted-foreground">{feature.description}</p>
  </div>
);

interface FeaturesProps {
  className?: string;
}

export const Features = ({ className }: FeaturesProps) => {
  return (
    <section className={cn("py-16 md:py-24", className)}>
      <div className="container px-4 mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-medium tracking-tight mb-4">
            Engineered for Law Students
          </h2>
          <p className="text-xl text-muted-foreground">
            Designed specifically to streamline legal research and study for busy law students.
          </p>
        </div>
        
        <div className="grid gap-6 md:gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <FeatureCard key={feature.title} feature={feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
