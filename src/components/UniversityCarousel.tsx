import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

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
  }
];

const UniversityCarousel = ({ className }: UniversityCarouselProps) => {
  return (
    <div
      className={cn(
        "w-full flex flex-col items-center relative py-4",
        className
      )}
      role="region"
      aria-label="Universities represented on the platform"
      tabIndex={0}
    >
      <div className="w-full flex flex-row justify-between items-center max-w-6xl mx-auto px-8 min-h-[180px]" style={{height:220}}>
        {universities.map((u) => (
          <Card
            key={u.name}
            className={
              "flex flex-col items-center justify-center px-10 py-8 bg-background/80 shadow-md rounded-2xl border-0 transition-all duration-200 outline-none min-w-[320px] max-w-[340px] min-h-[140px] max-h-[140px]"
            }
            tabIndex={0}
            aria-label={u.name}
          >
            <img
              src={u.logo}
              alt={u.name}
              className="max-h-20 w-auto object-contain filter grayscale opacity-80 hover:opacity-100 hover:grayscale-0 transition-all duration-300 drop-shadow-md"
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/images/placeholder.svg";
              }}
            />
            <span className="sr-only">{u.name}</span>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default UniversityCarousel; 