import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { PencilIcon } from '@heroicons/react/24/outline';
import { EmailPreferences } from '@/pages/EmailSuite';

interface PreferencesTabProps {
  preferences: EmailPreferences;
  onPreferencesChange: (preferences: EmailPreferences) => void;
}

export default function PreferencesTab({ preferences, onPreferencesChange }: PreferencesTabProps) {
  // Input validation and sanitization
  const validateAndSanitizeInput = (input: string, maxLength: number = 500): string => {
    if (!input || typeof input !== 'string') return '';
    // Only trim if it's at the start or end, preserve spaces in between
    const value = input.slice(0, maxLength);
    return value;
  };

  const updatePreference = (key: keyof EmailPreferences, value: string) => {
    // Validate and sanitize string inputs
    let sanitizedValue = value;
    if (key === 'role' || key === 'organization') {
      sanitizedValue = validateAndSanitizeInput(value, 100);
    } else if (key === 'signature') {
      sanitizedValue = validateAndSanitizeInput(value, 1000);
    }

    // Validate enum values
    if (key === 'tone') {
      const validTones: string[] = ['friendly', 'formal', 'professional', 'casual'];
      if (!validTones.includes(value)) return;
    }
    if (key === 'length') {
      const validLengths: string[] = ['short', 'medium', 'long'];
      if (!validLengths.includes(value)) return;
    }

    onPreferencesChange({
      ...preferences,
      [key]: sanitizedValue
    });
  };

  return (
    <div className="space-y-6">
      {/* Email Composition */}
      <Card>
        <CardHeader>
          <CardTitle>Email Composition</CardTitle>
          <CardDescription>Default preferences for email generation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            <div>
              <label className="text-sm font-medium">Default Tone</label>
              <Select 
                value={preferences.tone} 
                onValueChange={(value) => updatePreference('tone', value)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="friendly">Friendly</SelectItem>
                  <SelectItem value="formal">Formal</SelectItem>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="casual">Casual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Default Length</label>
              <Select 
                value={preferences.length} 
                onValueChange={(value) => updatePreference('length', value)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="short">Short</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="long">Long</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Personal details for email generation</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium">Your Role</label>
              <Input 
                value={preferences.role} 
                onChange={(e) => updatePreference('role', e.target.value)}
                placeholder="e.g., Senior attorney"
                maxLength={100}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Organization</label>
              <Input 
                value={preferences.organization} 
                onChange={(e) => updatePreference('organization', e.target.value)}
                placeholder="e.g., Lex Grove LLP"
                maxLength={100}
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Default Email Signature</label>
            <div className="relative">
              <Textarea 
                value={preferences.signature} 
                onChange={(e) => updatePreference('signature', e.target.value)}
                className="pr-10" 
                placeholder="Your email signature"
                maxLength={1000}
                rows={3}
              />
              <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-7 w-7">
                <PencilIcon className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              This signature will be suggested for your emails unless privacy settings override it.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 