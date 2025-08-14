import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeftIcon, ClockIcon, SparklesIcon } from '@heroicons/react/24/outline';

const toolInfo = {
  'document-generator': {
    title: 'Document Generator',
    description: 'Create legal documents, contracts, and professional correspondence',
    icon: '📄',
    features: ['Legal templates', 'Auto-completion', 'Format validation', 'Export options']
  },
  'chat-assistant': {
    title: 'Chat Assistant',
    description: 'Interactive AI chat for brainstorming and quick responses',
    icon: '💬',
    features: ['Real-time chat', 'Context memory', 'Quick actions', 'Voice input']
  },
  'content-analyzer': {
    title: 'Content Analyzer',
    description: 'Analyze and improve your written content for clarity and impact',
    icon: '🔍',
    features: ['Readability score', 'Tone analysis', 'Grammar check', 'Style suggestions']
  },
  'meeting-notes': {
    title: 'Meeting Notes',
    description: 'Transform meeting recordings into structured notes and action items',
    icon: '⏰',
    features: ['Audio transcription', 'Action item extraction', 'Summary generation', 'Integration ready']
  },
  'creative-writer': {
    title: 'Creative Writer',
    description: 'Unleash your creativity with AI-assisted storytelling and content creation',
    icon: '✨',
    features: ['Story generation', 'Character development', 'Plot suggestions', 'Genre adaptation']
  }
};

export default function ComingSoon() {
  const navigate = useNavigate();
  const { toolId } = useParams<{ toolId: string }>();
  const tool = toolInfo[toolId as keyof typeof toolInfo];

  if (!tool) {
    return (
      <div className="flex flex-col min-h-screen bg-muted/40">
        <Header />
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8 mt-16 md:mt-32">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Tool Not Found</h1>
            <Button onClick={() => navigate('/compose')}>
              Back to Compose Tools
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-muted/40">
      <Header />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8 mt-16 md:mt-32">
        {/* Tool Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/compose')}
            className="mb-4 hover:bg-primary/10 text-primary"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Compose Tools
          </Button>
          
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 bg-primary/10 rounded-xl text-2xl">
              {tool.icon}
            </div>
            <div>
              <h1 className="text-3xl font-bold">{tool.title}</h1>
              <p className="text-muted-foreground">{tool.description}</p>
            </div>
            <Badge variant="outline" className="text-muted-foreground">
              Coming Soon
            </Badge>
          </div>
        </div>

        {/* Coming Soon Content */}
        <div className="max-w-4xl mx-auto">
          <Card className="text-center p-12">
            <CardHeader>
              <div className="mx-auto w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                <ClockIcon className="h-12 w-12 text-primary" />
              </div>
              <CardTitle className="text-3xl font-bold mb-4">
                {tool.title} is Coming Soon!
              </CardTitle>
              <CardDescription className="text-lg">
                We're working hard to bring you this amazing tool. 
                Get notified when it's ready to use.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-8">
              {/* Features Preview */}
              <div className="text-left">
                <h3 className="text-xl font-semibold mb-4">What to Expect</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {tool.features.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                      <SparklesIcon className="h-5 w-5 text-primary" />
                      <span className="text-sm font-medium">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notification Signup */}
              <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl p-8 border border-primary/20">
                <h3 className="text-xl font-semibold mb-4">Get Notified</h3>
                <p className="text-muted-foreground mb-6">
                  Be the first to know when this tool becomes available.
                </p>
                <Button className="w-full md:w-auto">
                  Notify Me When Available
                </Button>
              </div>

              {/* Back to Tools */}
              <div>
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/compose')}
                  className="w-full md:w-auto"
                >
                  Explore Other Tools
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
