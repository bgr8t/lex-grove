import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Globe } from "lucide-react";

export const FooterLanguageToggle: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();

  const handleToggle = (checked: boolean) => {
    setLanguage(checked ? 'fr' : 'en');
  };

  return (
    <div className="flex items-center space-x-2">
      <Globe className="h-4 w-4 text-muted-foreground" />
      <Label htmlFor="language-toggle" className="text-sm text-muted-foreground">
        {t('footer.language')}
      </Label>
      <div className="flex items-center space-x-1 border border-border/50 rounded-md px-1">
        <button 
          className={`px-2 py-1 text-xs rounded ${language === 'en' ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:text-foreground'}`}
          onClick={() => setLanguage('en')}
        >
          EN
        </button>
        <button 
          className={`px-2 py-1 text-xs rounded ${language === 'fr' ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:text-foreground'}`}
          onClick={() => setLanguage('fr')}
        >
          FR
        </button>
      </div>
    </div>
  );
}; 