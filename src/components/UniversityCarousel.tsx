import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

interface UniversityCarouselProps {
  className?: string;
}

interface University {
  name: string;
  logo: string;
}

const universities: University[] = [
  {
    name: "University of Toronto",
    logo: "/images/universities/toronto.svg"
  },
  {
    name: "Université de Sherbrooke",
    logo: "/images/universities/sherbrooke.svg"
  },
  {
    name: "Université de Montréal",
    logo: "/images/universities/montreal.svg"
  },
  {
    name: "McGill University",
    logo: "/images/universities/mcgill.svg"
  },
  {
    name: "Université Laval",
    logo: "/images/universities/laval.svg"
  },
  {
    name: "York University",
    logo: "/images/universities/york.svg"
  }
];

const UniversityCarousel = ({ className }: UniversityCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const isMobile = useIsMobile();

  // Auto-advance carousel on mobile
  useEffect(() => {
    if (!isMobile) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % universities.length);
    }, 3000);
    
    return () => clearInterval(interval);
  }, [isMobile]);

  // Mobile: Show 1 card at a time with smooth transitions
  if (isMobile) {
    return (
      <div
        className={cn(
          "w-full flex flex-col items-center relative py-4",
          className
        )}
        role="region"
        aria-label="Universities represented on the platform"
      >
        {/* Mobile Carousel */}
        <div className="relative w-full max-w-sm mx-auto">
          <div className="overflow-hidden rounded-2xl">
            <div 
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {universities.map((university) => (
                <Card
                  key={university.name}
                  className="flex-shrink-0 w-full flex flex-col items-center justify-center px-6 py-8 bg-background/80 shadow-md rounded-2xl border-0 min-h-[140px]"
                  tabIndex={0}
                  aria-label={university.name}
                >
                  <img
                    src={university.logo}
                    alt={university.name}
                    className="max-h-16 w-auto object-contain filter grayscale opacity-80 hover:opacity-100 hover:grayscale-0 transition-all duration-300 drop-shadow-md"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/images/placeholder.svg";
                    }}
                  />
                  <span className="sr-only">{university.name}</span>
                </Card>
              ))}
            </div>
          </div>
          
          {/* Carousel Indicators */}
          <div className="flex justify-center mt-4 space-x-2">
            {universities.map((_, index) => (
              <button
                key={index}
                className={cn(
                  "w-2 h-2 rounded-full transition-all duration-300",
                  index === currentIndex
                    ? "bg-primary w-6"
                    : "bg-muted-foreground/30"
                )}
                onClick={() => setCurrentIndex(index)}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Desktop/Tablet: Show multiple cards in a grid
  return (
    <div
      className={cn(
        "w-full flex flex-col items-center relative py-4",
        className
      )}
      role="region"
      aria-label="Universities represented on the platform"
    >
      <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto px-4">
        {universities.slice(0, 6).map((university) => (
          <Card
            key={university.name}
            className="flex flex-col items-center justify-center px-6 py-8 bg-background/80 shadow-md rounded-2xl border-0 transition-all duration-200 hover:shadow-lg hover:scale-105 min-h-[140px]"
            tabIndex={0}
            aria-label={university.name}
          >
            <img
              src={university.logo}
              alt={university.name}
              className="max-h-16 md:max-h-20 w-auto object-contain filter grayscale opacity-80 hover:opacity-100 hover:grayscale-0 transition-all duration-300 drop-shadow-md"
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/images/placeholder.svg";
              }}
            />
            <span className="sr-only">{university.name}</span>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default UniversityCarousel; 