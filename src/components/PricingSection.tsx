import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckIcon, UserGroupIcon, BookOpenIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

interface PricingSectionProps {
  className?: string;
}

export const PricingSection = ({ className }: PricingSectionProps) => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  const benefits = [
    "Access to all case briefs in the library",
    "Intelligent search capabilities",
    "Content filtering and organization tools",
    "Personal collections to organize your briefs",
    "Community recognition for contributions"
  ];
  
  return (
    <section id="pricing" className={`py-20 bg-muted/30 ${className}`}>
      <div className="container px-4 mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-semibold mb-4">Community-Powered Learning</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Lex Grove uses a contribution model where students support each other.
            Read fewer cases but produce more detailed and quality briefs.
          </p>
        </div>
        
        <div className="max-w-xl mx-auto">
          <Card className="border-2 border-primary/20 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl font-bold">Contribution Model</CardTitle>
              <CardDescription className="text-base">
                Shared knowledge, better results
              </CardDescription>
            </CardHeader>
            
            <CardContent className="pt-6">
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-full bg-primary/10 text-primary">
                    <PencilSquareIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-medium text-lg">Contribute 3 Case Briefs Weekly</h3>
                    <p className="text-muted-foreground">
                      Share your detailed case briefs with the community. Quality matters!
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-full bg-primary/10 text-primary">
                    <BookOpenIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-medium text-lg">Get Full Library Access</h3>
                    <p className="text-muted-foreground">
                      Unlock all community-contributed case briefs and search features.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-full bg-primary/10 text-primary">
                    <UserGroupIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-medium text-lg">Save Hours of Reading</h3>
                    <p className="text-muted-foreground">
                      Focus on fewer cases but create high-quality briefs. Everyone benefits!
                    </p>
                  </div>
                </div>
                
                <div className="border-t pt-6 mt-6">
                  <h4 className="font-medium mb-3">Benefits include:</h4>
                  <ul className="space-y-2">
                    {benefits.map((benefit, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckIcon className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
            
            <CardFooter className="flex flex-col gap-4 pt-2">
              <Button 
                className="w-full h-12 bg-primary hover:bg-primary/90 text-lg"
                onClick={() => navigate('/library')}
              >
                Join the Community
              </Button>
              <p className="text-sm text-center text-muted-foreground">
                Start by browsing available briefs or creating your first contribution
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default PricingSection; 