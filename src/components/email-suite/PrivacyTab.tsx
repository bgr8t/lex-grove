import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

const featureKeys = [
  'removeMetadata',
  'neutralLanguage',
  'avoidLocation',
  'attorneyClient',
] as const;

type FeatureKey = typeof featureKeys[number];

const getFeaturePreset = (mode: 'standard' | 'privacy'): Record<FeatureKey, boolean> => {
  const value = mode === 'privacy';
  return {
    removeMetadata: value,
    neutralLanguage: value,
    avoidLocation: value,
    attorneyClient: value,
  };
};

const SettingRow = ({ title, description, control }) => (
  <div className="flex items-center justify-between py-4">
    <div>
      <h4 className="font-medium">{title}</h4>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
    {control}
  </div>
);

const PrivacyModeCard = ({ title, description, active, onClick, badge }) => (
  <Card 
    className={cn(
      "cursor-pointer transition-all",
      active ? "border-green-500 ring-2 ring-green-500" : "hover:border-primary"
    )}
    onClick={onClick}
  >
    <CardContent className="p-4 flex items-center justify-between">
      <div>
        <div className="flex items-center gap-2">
          {active && <CheckCircleIcon className="h-5 w-5 text-green-500" />}
          <h4 className="font-semibold">{title}</h4>
        </div>
        <p className="text-sm text-muted-foreground ml-7">{description}</p>
      </div>
      <span className={cn("text-xs font-semibold px-2 py-1 rounded-full", active ? "bg-green-100 text-green-700" : "bg-muted")}>
        {badge}
      </span>
    </CardContent>
  </Card>
);

export default function PrivacyTab() {
  const [activeMode, setActiveMode] = useState<'standard' | 'privacy'>('standard');
  const [features, setFeatures] = useState<Record<FeatureKey, boolean>>(getFeaturePreset(activeMode));

  useEffect(() => {
    setFeatures(getFeaturePreset(activeMode));
  }, [activeMode]);

  const toggleFeature = (key: FeatureKey) => {
    setFeatures(prev => ({ ...prev, [key]: !prev[key] }));
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Privacy Settings</CardTitle>
          <div className="flex items-center justify-between">
            <CardDescription>Select a mode to apply a default set of privacy features.</CardDescription>
            <Button variant="outline" onClick={() => setActiveMode('standard')}>Reset to Defaults</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <PrivacyModeCard 
            title="Privacy-First Mode"
            description="Enables all privacy features by default for maximum security."
            active={activeMode === 'privacy'}
            onClick={() => setActiveMode('privacy')}
            badge={activeMode === 'privacy' ? 'Active' : 'Inactive'}
          />
          <PrivacyModeCard 
            title="Standard Mode"
            description="Standard email practices with privacy features disabled by default."
            active={activeMode === 'standard'}
            onClick={() => setActiveMode('standard')}
            badge={activeMode === 'standard' ? 'Active' : 'Inactive'}
          />
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Privacy Features</CardTitle>
          <CardDescription>Customize individual privacy and security settings</CardDescription>
        </CardHeader>
        <CardContent className="divide-y">
          <SettingRow 
            title="Remove identifying metadata from content" 
            description="Automatically removes names, addresses, and other identifying information" 
            control={<Switch checked={features.removeMetadata} onCheckedChange={() => toggleFeature('removeMetadata')} />} 
          />
          <SettingRow 
            title="Prefer neutral, non-identifying language" 
            description="Use language that doesn't reveal personal characteristics" 
            control={<Switch checked={features.neutralLanguage} onCheckedChange={() => toggleFeature('neutralLanguage')} />} 
          />
          <SettingRow 
            title="Avoid location-specific references" 
            description="Remove geographical identifiers and time zone references" 
            control={<Switch checked={features.avoidLocation} onCheckedChange={() => toggleFeature('avoidLocation')} />} 
          />
          <SettingRow 
            title="Maintain attorney-client privilege awareness" 
            description="Ensure legal communications maintain confidentiality standards" 
            control={<Switch checked={features.attorneyClient} onCheckedChange={() => toggleFeature('attorneyClient')} />} 
          />
        </CardContent>
      </Card>
    </div>
  );
} 