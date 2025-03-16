
import { 
  MagnifyingGlassIcon, 
  DocumentTextIcon, 
  BookmarkIcon, 
  AcademicCapIcon 
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

interface StepProps {
  number: number;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const steps: StepProps[] = [
  {
    number: 1,
    title: "Search Intelligently",
    description: "Enter legal concepts, case names, or doctrines in natural language. Our AI understands what you're looking for beyond simple keywords.",
    icon: <MagnifyingGlassIcon className="h-6 w-6" />
  },
  {
    number: 2,
    title: "Review Quality Briefs",
    description: "Browse through briefs created by law students. Each brief includes key facts, holdings, and reasoning from important cases.",
    icon: <DocumentTextIcon className="h-6 w-6" />
  },
  {
    number: 3,
    title: "Save to Your Library",
    description: "Build your personal collection of case briefs for easy reference during exams or while preparing for class discussions.",
    icon: <BookmarkIcon className="h-6 w-6" />
  },
  {
    number: 4,
    title: "Excel in Your Studies",
    description: "Use Lex Grove to better understand complex legal concepts and improve your academic performance with quality study materials.",
    icon: <AcademicCapIcon className="h-6 w-6" />
  }
];

const StepCard = ({ step }: { step: StepProps }) => (
  <div className="flex flex-col md:flex-row gap-5 items-start md:items-center p-6 rounded-xl transition-all duration-300 hover:bg-accent/50">
    <div className="flex-shrink-0">
      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
        {step.icon}
      </div>
    </div>
    <div>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm font-medium bg-primary/20 text-primary rounded-full w-6 h-6 flex items-center justify-center">
          {step.number}
        </span>
        <h3 className="text-xl font-medium">{step.title}</h3>
      </div>
      <p className="text-muted-foreground">{step.description}</p>
    </div>
  </div>
);

interface HowItWorksProps {
  className?: string;
}

export const HowItWorks = ({ className }: HowItWorksProps) => {
  return (
    <section id="how-it-works" className={cn("py-16 md:py-24 relative overflow-hidden", className)}>
      <div className="container px-4 mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-medium tracking-tight mb-4">
            How Lex Grove Works
          </h2>
          <p className="text-xl text-muted-foreground">
            Our platform simplifies legal research for law students through an intuitive, AI-powered approach.
          </p>
        </div>
        
        <div className="max-w-3xl mx-auto space-y-6">
          {steps.map((step) => (
            <StepCard key={step.number} step={step} />
          ))}
        </div>
      </div>
      
      {/* Decorative elements */}
      <div className="absolute top-1/4 -right-64 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 -left-64 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
    </section>
  );
};

export default HowItWorks;
