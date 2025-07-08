import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

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
      {badge && <span className={cn("text-xs font-semibold px-2 py-1 rounded-full", active ? "bg-green-100 text-green-700" : "bg-muted")}>{badge}</span>}
    </CardContent>
  </Card>
);

export default function PrivacyTab() {
  const [activeMode, setActiveMode] = useState<'standard' | 'privacy'>('standard');
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Privacy Settings</CardTitle>
          <div className="flex items-center justify-between">
            <CardDescription>Default secure settings for sensitive communications</CardDescription>
            <Button variant="outline">Reset to Defaults</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <PrivacyModeCard 
            title="Privacy-First Mode"
            description="Default secure settings for sensitive communications"
            active={activeMode === 'privacy'}
            onClick={() => setActiveMode('privacy')}
            badge="Inactive"
          />
          <PrivacyModeCard 
            title="Standard Mode"
            description="Standard email practices with optional enhancements"
            active={activeMode === 'standard'}
            onClick={() => setActiveMode('standard')}
            badge="Active"
          />
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Privacy Features</CardTitle>
          <CardDescription>Customize individual privacy and security settings</CardDescription>
        </CardHeader>
        <CardContent className="divide-y">
          <SettingRow title="Remove identifying metadata from content" description="Automatically removes names, addresses, and other identifying information" control={<Switch />} />
          <SettingRow title="Use generic professional signatures" description="Replace personal signatures with generic professional ones" control={<Switch />} />
          <SettingRow title="Prefer neutral, non-identifying language" description="Use language that doesn't reveal personal characteristics" control={<Switch />} />
          <SettingRow title="Apply secure email practices by default" description="Include security recommendations and encryption suggestions" control={<Switch />} />
          <SettingRow title="Avoid location-specific references" description="Remove geographical identifiers and time zone references" control={<Switch />} />
          <SettingRow title="Maintain attorney-client privilege awareness" description="Ensure legal communications maintain confidentiality standards" control={<Switch />} />
        </CardContent>
      </Card>
    </div>
  );
} 