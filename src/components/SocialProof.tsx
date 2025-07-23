import { cn } from '@/lib/utils';

interface SocialProofProps {
  className?: string;
}

const universities = [
  { name: 'McGill University', logo: '/images/universities/mcgill.svg' },
  { name: 'Université de Montréal', logo: '/images/universities/montreal.svg' },
  { name: 'Université Laval', logo: '/images/universities/laval.svg' },
  { name: 'Université de Sherbrooke', logo: '/images/universities/sherbrooke.svg' },
  { name: 'University of Toronto', logo: '/images/universities/toronto.svg' },
  { name: 'York University', logo: '/images/universities/york.svg' },
];

export const SocialProof = ({ className }: SocialProofProps) => {
  return (
    <section className={cn("py-16 md:py-20 relative overflow-hidden", className)}>
      {/* Background with subtle pattern */}
      <div className="absolute inset-0 bg-gradient-to-r from-muted/20 via-background to-muted/20"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[length:40px_40px] opacity-30"></div>
      
      {/* Floating decorative elements */}
      <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-br from-primary/5 to-accent/5 rounded-full blur-2xl opacity-60 animate-float-slow"></div>
      <div className="absolute bottom-20 right-20 w-40 h-40 bg-gradient-to-br from-secondary/5 to-primary/5 rounded-full blur-2xl opacity-40 animate-float-slow-reverse"></div>
      
      <div className="container px-4 mx-auto relative z-10">
        <div className="text-center mb-12 md:mb-16">
          {/* Section badge */}
          <div className="inline-flex items-center mb-8 relative group opacity-0 animate-slide-down-fade" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/10 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative backdrop-blur-sm bg-white/60 dark:bg-gray-900/60 border border-white/30 dark:border-gray-700/30 rounded-full px-4 py-2 shadow-lg">
              <span className="text-sm font-medium text-primary">Trusted Nationwide</span>
            </div>
          </div>
          
          <h2 className="text-2xl md:text-3xl font-light tracking-tight mb-8 text-muted-foreground opacity-0 animate-fade-in" style={{ animationDelay: '400ms', animationFillMode: 'forwards' }}>
            Trusted by Students from Canada's Top Law Schools
          </h2>
          
          {/* University logos container */}
          <div className="relative">
            {/* Background glow for the logos */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent rounded-2xl blur-xl"></div>
            
            <div className="relative backdrop-blur-sm bg-white/40 dark:bg-gray-900/40 border border-white/30 dark:border-gray-700/30 rounded-2xl p-8 shadow-xl">
              <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
                {universities.map((university, index) => (
                  <div
                    key={university.name}
                    className={cn(
                      "flex items-center justify-center h-16 md:h-20 transition-all duration-500 hover:scale-125 cursor-pointer group relative opacity-0 animate-slide-up"
                    )}
                    style={{ 
                      animationDelay: `${600 + index * 100}ms`, 
                      animationFillMode: 'forwards' 
                    }}
                  >
                    {/* Hover glow effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 scale-150"></div>
                    
                    {/* Logo container */}
                    <div className="relative p-4 rounded-xl transition-all duration-300 group-hover:bg-white/50 dark:group-hover:bg-gray-800/50 group-hover:shadow-lg">
                      <img
                        src={university.logo}
                        alt={`${university.name} logo`}
                        className="h-full w-auto object-contain filter grayscale group-hover:grayscale-0 transition-all duration-500 max-w-[120px] group-hover:drop-shadow-lg"
                        loading="lazy"
                      />
                    </div>
                    
                    {/* Tooltip */}
                    <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border border-white/30 dark:border-gray-700/30 rounded-lg px-3 py-1 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                      <span className="text-xs font-medium whitespace-nowrap">{university.name}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Statistics or additional trust indicators */}
          <div className="mt-12 opacity-0 animate-fade-in" style={{ animationDelay: '1200ms', animationFillMode: 'forwards' }}>
            <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
              <div className="text-center group">
                <div className="text-2xl md:text-3xl font-light text-primary mb-1 group-hover:scale-110 transition-transform duration-300">10,000+</div>
                <div className="text-sm text-muted-foreground">Students Served</div>
              </div>
              <div className="w-px h-8 bg-border"></div>
              <div className="text-center group">
                <div className="text-2xl md:text-3xl font-light text-primary mb-1 group-hover:scale-110 transition-transform duration-300">50,000+</div>
                <div className="text-sm text-muted-foreground">Briefs Generated</div>
              </div>
              <div className="w-px h-8 bg-border"></div>
              <div className="text-center group">
                <div className="text-2xl md:text-3xl font-light text-primary mb-1 group-hover:scale-110 transition-transform duration-300">98%</div>
                <div className="text-sm text-muted-foreground">Satisfaction Rate</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Decorative geometric elements */}
      <div className="absolute top-16 right-16 w-6 h-6 border border-primary/30 rounded-full animate-pulse-subtle opacity-40"></div>
      <div className="absolute bottom-24 left-24 w-4 h-4 bg-gradient-to-br from-accent/40 to-primary/40 rounded-full animate-subtle-bounce"></div>
    </section>
  );
};

export default SocialProof; 