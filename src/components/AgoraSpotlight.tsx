import { Button } from '@/components/ui/button';
import { ArrowRightIcon, ChatBubbleBottomCenterTextIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface AgoraSpotlightProps {
  className?: string;
}

export const AgoraSpotlight = ({ className }: AgoraSpotlightProps) => {
  const navigate = useNavigate();

  return (
    <section className={cn("py-16 md:py-24 bg-gradient-to-br from-background to-muted/30", className)}>
      <div className="container px-4 mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-6">
            <div className="inline-flex items-center bg-primary/10 text-primary rounded-full px-3 py-1 text-sm font-medium">
              <ChatBubbleBottomCenterTextIcon className="h-4 w-4 mr-2" />
              Featured Platform
            </div>
            
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-medium tracking-tight">
              Agora: The Collaborative Hub for 
              <span className="text-primary"> Legal Commentary</span>
            </h2>
            
            <p className="text-xl text-muted-foreground leading-relaxed">
              Move beyond static case briefs. Join Agora, our 'Substack for law,' where the legal community publishes, discusses, and refines legal analysis. Share your expertise, build your reputation, and stay on the cutting edge of legal discourse.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg"
                onClick={() => navigate('/agora')}
                className="group"
              >
                Explore Agora
                <ArrowRightIcon className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => navigate('/agora')}
              >
                Read Featured Articles
              </Button>
            </div>
            
            <div className="grid grid-cols-3 gap-6 pt-6 border-t border-border/50">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">500+</div>
                <div className="text-sm text-muted-foreground">Articles Published</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">50+</div>
                <div className="text-sm text-muted-foreground">Active Contributors</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">1,200+</div>
                <div className="text-sm text-muted-foreground">Community Members</div>
              </div>
            </div>
          </div>
          
          {/* Visual */}
          <div className="relative">
            <div className="glass-panel rounded-2xl p-8 border border-border/50">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <UserGroupIcon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Legal Commentary Platform</h4>
                    <p className="text-sm text-muted-foreground">By the community, for the community</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="h-3 bg-muted rounded-full">
                    <div className="h-3 bg-primary/60 rounded-full" style={{ width: '70%' }}></div>
                  </div>
                  <div className="h-3 bg-muted rounded-full">
                    <div className="h-3 bg-primary/40 rounded-full" style={{ width: '90%' }}></div>
                  </div>
                  <div className="h-3 bg-muted rounded-full">
                    <div className="h-3 bg-primary/20 rounded-full" style={{ width: '60%' }}></div>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-border/50">
                  <p className="text-sm text-muted-foreground italic">
                    "Agora has transformed how I approach legal research. The community insights are invaluable."
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">— Law Student, McGill University</p>
                </div>
              </div>
            </div>
            
            {/* Decorative elements */}
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary/10 rounded-full blur-xl" />
            <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-primary/5 rounded-full blur-2xl" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default AgoraSpotlight; 