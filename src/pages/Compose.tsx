import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  EnvelopeIcon, 
  DocumentTextIcon, 
  ChatBubbleLeftRightIcon,
  DocumentMagnifyingGlassIcon,
  ClockIcon,
  SparklesIcon,
  ArrowRightIcon,
  DocumentCheckIcon
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

interface ComposeTool {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  status: 'available' | 'coming-soon' | 'beta';
  route: string;
  features: string[];
}

const composeTools: ComposeTool[] = [
  {
    id: 'email-draft',
    title: 'Email Draft',
    description: 'AI-powered email composition with customizable tone and privacy settings',
    icon: EnvelopeIcon,
    status: 'available',
    route: '/compose/email-draft',
    features: ['Smart tone detection', 'Privacy controls', 'Template library', 'Draft history']
  },
  {
    id: 'proofreading',
    title: 'Course Notes Proofreader',
    description: 'Conservative AI proofreading that preserves legal meaning and terminology',
    icon: DocumentCheckIcon,
    status: 'available',
    route: '/compose/proofreading',
    features: ['Grammar correction', 'Spelling fixes', 'Meaning preservation', 'Legal term protection']
  },
  {
    id: 'document-generator',
    title: 'Document Generator',
    description: 'Create legal documents, contracts, and professional correspondence',
    icon: DocumentTextIcon,
    status: 'coming-soon',
    route: '/compose/document-generator',
    features: ['Legal templates', 'Auto-completion', 'Format validation', 'Export options']
  },
  {
    id: 'chat-assistant',
    title: 'Chat Assistant',
    description: 'Interactive AI chat for brainstorming and quick responses',
    icon: ChatBubbleLeftRightIcon,
    status: 'beta',
    route: '/compose/chat-assistant',
    features: ['Real-time chat', 'Context memory', 'Quick actions', 'Voice input']
  },
  {
    id: 'content-analyzer',
    title: 'Content Analyzer',
    description: 'Analyze and improve your written content for clarity and impact',
    icon: DocumentMagnifyingGlassIcon,
    status: 'coming-soon',
    route: '/compose/content-analyzer',
    features: ['Readability score', 'Tone analysis', 'Grammar check', 'Style suggestions']
  },
  {
    id: 'meeting-notes',
    title: 'Meeting Notes',
    description: 'Transform meeting recordings into structured notes and action items',
    icon: ClockIcon,
    status: 'coming-soon',
    route: '/compose/meeting-notes',
    features: ['Audio transcription', 'Action item extraction', 'Summary generation', 'Integration ready']
  },
  {
    id: 'creative-writer',
    title: 'Creative Writer',
    description: 'Unleash your creativity with AI-assisted storytelling and content creation',
    icon: SparklesIcon,
    status: 'coming-soon',
    route: '/compose/creative-writer',
    features: ['Story generation', 'Character development', 'Plot suggestions', 'Genre adaptation']
  }
];

const getStatusBadge = (status: ComposeTool['status']) => {
  switch (status) {
    case 'available':
      return <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">Available</Badge>;
    case 'beta':
      return <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">Beta</Badge>;
    case 'coming-soon':
      return <Badge variant="outline" className="text-muted-foreground">Coming Soon</Badge>;
    default:
      return null;
  }
};

export default function Compose() {
  const navigate = useNavigate();

  const handleToolClick = (tool: ComposeTool) => {
    if (tool.status === 'available' || tool.status === 'beta') {
      navigate(tool.route);
    } else if (tool.status === 'coming-soon') {
      navigate(`/compose/${tool.id}`);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-muted/40">
      <Header />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8 mt-16 md:mt-32">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center bg-primary/10 text-primary rounded-full px-4 py-2 text-sm font-medium mb-4">
            <SparklesIcon className="h-4 w-4 mr-2" />
            AI-Powered Composition Tools
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Choose Your <span className="text-primary">Composition Tool</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Select from our suite of AI-powered tools to enhance your writing, communication, and content creation workflow.
          </p>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {composeTools.map((tool) => (
            <Card 
              key={tool.id}
              className={cn(
                "group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-105 cursor-pointer",
                (tool.status === 'available' || tool.status === 'beta') 
                  ? "hover:border-primary/50 hover:bg-gradient-to-br hover:from-primary/5 hover:to-transparent" 
                  : "opacity-75 cursor-not-allowed"
              )}
              onClick={() => handleToolClick(tool)}
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={cn(
                      "p-3 rounded-xl transition-colors duration-300",
                      (tool.status === 'available' || tool.status === 'beta')
                        ? "bg-primary/10 text-primary group-hover:bg-primary/20"
                        : "bg-muted text-muted-foreground"
                    )}>
                      <tool.icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold">{tool.title}</CardTitle>
                      {getStatusBadge(tool.status)}
                    </div>
                  </div>
                  {(tool.status === 'available' || tool.status === 'beta') && (
                    <ArrowRightIcon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors duration-300" />
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <CardDescription className="text-sm mb-4 leading-relaxed">
                  {tool.description}
                </CardDescription>
                
                <div className="space-y-2">
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Features
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {tool.features.map((feature, index) => (
                      <Badge 
                        key={index} 
                        variant="outline" 
                        className="text-xs px-2 py-1 bg-background/50"
                      >
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                {(tool.status === 'available' || tool.status === 'beta') && (
                  <Button 
                    className="w-full mt-4 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300"
                    variant="outline"
                  >
                    {tool.status === 'beta' ? 'Try Beta' : 'Open Tool'}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Footer Section */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl p-8 border border-primary/20">
            <h3 className="text-2xl font-semibold mb-4">More Tools Coming Soon</h3>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              We're constantly expanding our suite of AI-powered composition tools. 
              Stay tuned for new features and capabilities designed to enhance your productivity.
            </p>
            <Button variant="outline" className="border-primary/30 text-primary hover:bg-primary/10">
              Get Notified
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
