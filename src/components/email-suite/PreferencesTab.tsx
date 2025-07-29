import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { PencilIcon, CheckIcon } from '@heroicons/react/24/outline';
import { EmailPreferences } from '@/pages/EmailSuite';

interface PreferencesTabProps {
  preferences: EmailPreferences;
  onPreferencesChange: (preferences: EmailPreferences) => void;
  onSavePreferences: (preferences: EmailPreferences) => Promise<void>;
  isSaving?: boolean;
}

export default function PreferencesTab({ 
  preferences, 
  onPreferencesChange, 
  onSavePreferences,
  isSaving = false 
}: PreferencesTabProps) {
  // Local state for draft preferences
  const [draftPreferences, setDraftPreferences] = useState<EmailPreferences>(preferences);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Update draft preferences when props change (on initial load or external updates)
  useEffect(() => {
    setDraftPreferences(preferences);
    setHasUnsavedChanges(false);
  }, [preferences]);

  // Check if there are unsaved changes
  useEffect(() => {
    const hasChanges = JSON.stringify(draftPreferences) !== JSON.stringify(preferences);
    setHasUnsavedChanges(hasChanges);
  }, [draftPreferences, preferences]);

  // Input validation and sanitization
  const validateAndSanitizeInput = (input: string, maxLength: number = 500): string => {
    if (!input || typeof input !== 'string') return '';
    const value = input.slice(0, maxLength);
    return value;
  };

  const updateDraftPreference = (key: keyof EmailPreferences, value: string) => {
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

    // Update local draft state using functional update to ensure we have the latest state
    // Update local draft state only - don't update parent until save
    setDraftPreferences(prev => ({
      ...prev,
      [key]: sanitizedValue
    }));
  };
  const handleSaveChanges = async () => {
    try {
      await onSavePreferences(draftPreferences);
    } catch (error) {
      console.error('Failed to save preferences:', error);
    }
  };

  const handleDiscardChanges = () => {
    setDraftPreferences(preferences);
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
                value={draftPreferences.tone} 
                onValueChange={(value) => updateDraftPreference('tone', value)}
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
                value={draftPreferences.length} 
                onValueChange={(value) => updateDraftPreference('length', value)}
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
                value={draftPreferences.role} 
                onChange={(e) => updateDraftPreference('role', e.target.value)}
                placeholder="e.g., Senior attorney"
                maxLength={100}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Organization</label>
              <Input 
                value={draftPreferences.organization} 
                onChange={(e) => updateDraftPreference('organization', e.target.value)}
                placeholder="e.g., Lex Grove LLP"
                maxLength={100}
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Default Email Signature</label>
            <div className="relative">
              <Textarea 
                value={draftPreferences.signature} 
                onChange={(e) => updateDraftPreference('signature', e.target.value)}
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

      {/* Save/Discard Actions - Always visible */}
      <Card className={hasUnsavedChanges ? "border-amber-200 bg-amber-50" : "border-gray-200 bg-gray-50"}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${hasUnsavedChanges ? 'bg-amber-500' : 'bg-gray-400'}`}></div>
              <span className={`text-sm font-medium ${hasUnsavedChanges ? 'text-amber-700' : 'text-gray-600'}`}>
                {hasUnsavedChanges ? 'You have unsaved changes' : 'All changes saved'}
              </span>
            </div>
            <div className="flex gap-2">
              {hasUnsavedChanges && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleDiscardChanges}
                  disabled={isSaving}
                >
                  Discard
                </Button>
              )}
              <Button 
                size="sm"
                onClick={handleSaveChanges}
                disabled={isSaving || !hasUnsavedChanges}
                className="gap-2"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckIcon className="h-4 w-4" />
                    {hasUnsavedChanges ? 'Save Changes' : 'Saved'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
