import { cn } from "@/lib/utils";
import UniversityCarousel from "./UniversityCarousel";

interface EmpoweringStudentsProps {
  className?: string;
}

const EmpoweringStudents = ({ className }: EmpoweringStudentsProps) => {
  return (
    <section className={cn("py-12 md:py-16 bg-gradient-to-b from-background to-muted/30", className)}>
      <div className="container px-4 mx-auto">
        <div className="text-center mb-8 md:mb-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-3 md:mb-4 px-2">
            Empowering Top Students around the World
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto px-4 text-sm md:text-base">
            Join thousands of law students who are transforming their legal education with our cutting-edge case brief platform. Experience the power of AI-enhanced learning and collaborative knowledge sharing.
          </p>
        </div>

        {/* University Carousel */}
        <div className="mb-12 md:mb-16">
          <UniversityCarousel />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 px-2 md:px-0">
          {/* Student Success */}
          <div className="p-4 md:p-6 rounded-xl border bg-card shadow-sm hover:shadow-md transition-all">
            <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3 md:mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="text-lg md:text-xl font-semibold mb-2">Enhanced Learning</h3>
            <p className="text-muted-foreground text-sm md:text-base">
              Access AI-powered tools that help you understand complex legal concepts faster and more effectively.
            </p>
          </div>

          {/* Global Community */}
          <div className="p-4 md:p-6 rounded-xl border bg-card shadow-sm hover:shadow-md transition-all">
            <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3 md:mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
            </div>
            <h3 className="text-lg md:text-xl font-semibold mb-2">Global Network</h3>
            <p className="text-muted-foreground text-sm md:text-base">
              Connect with law students worldwide, share insights, and learn from diverse legal perspectives.
            </p>
          </div>

          {/* Career Growth */}
          <div className="p-4 md:p-6 rounded-xl border bg-card shadow-sm hover:shadow-md transition-all">
            <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3 md:mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <h3 className="text-lg md:text-xl font-semibold mb-2">Career Growth</h3>
            <p className="text-muted-foreground text-sm md:text-base">
              Build essential legal analysis skills that will set you apart in your future legal career.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default EmpoweringStudents; 