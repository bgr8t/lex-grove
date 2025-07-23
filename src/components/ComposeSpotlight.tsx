import { Button } from '@/components/ui/button';
import { ArrowRightIcon, EnvelopeIcon, ShieldCheckIcon, ClockIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface ComposeSpotlightProps {
  className?: string;
}

export const ComposeSpotlight = ({ className }: ComposeSpotlightProps) => {
  const navigate = useNavigate();

  return (
    <section className={cn("py-16 md:py-24", className)}>
      <div className="container px-4 mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Visual */}
          <div className="relative order-2 lg:order-1">
            <div className="glass-panel rounded-2xl p-6 border border-border/50">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <EnvelopeIcon className="h-5 w-5 text-primary" />
                    <span className="font-semibold">AI Email Composer</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <ShieldCheckIcon className="h-3 w-3" />
                    Secure
                  </div>
                </div>
                
                <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                  <div className="text-sm font-medium text-muted-foreground">Draft Preview:</div>
                  <div className="text-sm leading-relaxed">
                    "Dear Professor Smith,<br/><br/>
                    I hope this email finds you well. I wanted to follow up on our discussion regarding the constitutional law assignment..."
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <ClockIcon className="h-3 w-3" />
                    Generated in 2.3 seconds
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <div className="flex-1 h-8 bg-primary/20 rounded-md flex items-center justify-center text-xs font-medium text-primary">
                    Professional Tone
                  </div>
                  <div className="flex-1 h-8 bg-muted rounded-md flex items-center justify-center text-xs">
                    Medium Length
                  </div>
                  <div className="flex-1 h-8 bg-muted rounded-md flex items-center justify-center text-xs">
                    High Privacy
                  </div>
                </div>
              </div>
            </div>
            
            {/* Decorative elements */}
            <div className="absolute -top-6 -left-6 w-20 h-20 bg-primary/10 rounded-full blur-xl" />
            <div className="absolute -bottom-4 -right-4 w-28 h-28 bg-primary/5 rounded-full blur-2xl" />
          </div>
          
          {/* Content */}
          <div className="space-y-6 order-1 lg:order-2">
            <div className="inline-flex items-center bg-primary/10 text-primary rounded-full px-3 py-1 text-sm font-medium">
              <EnvelopeIcon className="h-4 w-4 mr-2" />
              AI Email Suite
            </div>
            
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-medium tracking-tight">
              Compose: Your 
              <span className="text-primary"> AI-Powered Email Assistant</span>
            </h2>
            
            <p className="text-xl text-muted-foreground leading-relaxed">
              Stop wasting time staring at a blank screen. Our AI email suite helps you draft professional, context-aware emails instantly. Set your preferred tone, length, and privacy level, and let our assistant handle the rest. Secure, smart, and efficient.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                  <ClockIcon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Instant Drafting</h4>
                  <p className="text-muted-foreground">Generate professional emails in seconds, not minutes.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                  <ShieldCheckIcon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Privacy Controls</h4>
                  <p className="text-muted-foreground">Customizable privacy settings to protect sensitive information.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                  <EnvelopeIcon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Tone Matching</h4>
                  <p className="text-muted-foreground">Adjust tone and formality to match any professional context.</p>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg"
                onClick={() => navigate('/email-suite')}
                className="group"
              >
                Try Compose Now
                <ArrowRightIcon className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => navigate('/email-suite')}
              >
                View Templates
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ComposeSpotlight; 