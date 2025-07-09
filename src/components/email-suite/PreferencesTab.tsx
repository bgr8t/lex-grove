import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { PencilIcon } from '@heroicons/react/24/outline';

const SettingRow = ({ title, description, control }) => (
  <div className="flex items-center justify-between py-3">
    <div>
      <h4 className="font-medium">{title}</h4>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
    {control}
  </div>
);

export default function PreferencesTab() {
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
              <Select defaultValue="friendly">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="friendly">Friendly</SelectItem><SelectItem value="formal">Formal</SelectItem></SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Default Length</label>
              <Select defaultValue="medium">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="short">Short</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="long">Long</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Information */}
      <Card>
        <CardHeader><CardTitle>Profile Information</CardTitle><CardDescription>Personal details for email generation</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium">Your Role</label>
              <Input defaultValue="Senior attorney" />
            </div>
            <div>
              <label className="text-sm font-medium">Organization</label>
              <Input defaultValue="Lex Grove LLP" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Default Email Signature</label>
            <div className="relative">
              <Textarea defaultValue="Brian Ndabarasa&#x0a;Lex Grove LLP" className="pr-10" />
              <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-7 w-7"><PencilIcon className="h-4 w-4" /></Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">This signature will be suggested for your emails unless privacy settings override it.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 