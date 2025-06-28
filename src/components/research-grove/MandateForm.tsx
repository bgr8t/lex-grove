import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mandate, MandateFormData, LEGAL_AREAS, LegalQuestionFormData } from '@/lib/models/mandate';
import { LegalQuestionsSection } from './LegalQuestionsSection';
import { useAsyncResearchGroveStorage } from '@/lib/services/researchGroveStorage';

// Form validation schema
const mandateSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  clientName: z.string().min(1, 'Client name is required'),
  legalArea: z.string().min(1, 'Legal area is required'),
  priority: z.enum(['Low', 'Medium', 'High', 'Urgent'] as const),
  researchObjective: z.string().min(1, 'Research objective is required'),
  deadline: z.string().min(1, 'Deadline is required'),
  assignedLawyer: z.string().optional().default(''),
});

interface MandateFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: MandateFormData) => void;
  mandate?: Mandate | null;
  isLoading?: boolean;
}

export const MandateForm: React.FC<MandateFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  mandate,
  isLoading = false
}) => {
  const [questions, setQuestions] = useState<LegalQuestionFormData[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const asyncStorage = useAsyncResearchGroveStorage();

  const form = useForm<Omit<MandateFormData, 'questions'>>({
    resolver: zodResolver(mandateSchema),
    defaultValues: {
      title: mandate?.title || '',
      clientName: mandate?.clientName || '',
      legalArea: mandate?.legalArea || '',
      priority: mandate?.priority || 'Medium',
      researchObjective: mandate?.researchObjective || '',
      deadline: mandate?.deadline?.split('T')[0] || '', // Format for date input
      assignedLawyer: mandate?.assignedLawyer || '',
    },
  });

  // Load existing questions when editing
  React.useEffect(() => {
    const loadQuestions = async () => {
      if (mandate && isOpen) {
        setLoadingQuestions(true);
        try {
          // Load questions from storage when editing
          const existingQuestions = await asyncStorage.getQuestionsByMandateId(mandate.id);
          setQuestions(existingQuestions.map(q => ({
            question: q.question,
            description: q.description,
            priority: q.priority
          })));
        } catch (error) {
          console.error('Error loading questions:', error);
          setQuestions([]);
        } finally {
          setLoadingQuestions(false);
        }
      } else if (!mandate && isOpen) {
        // Reset questions for new mandate
        setQuestions([]);
      }
    };

    loadQuestions();
  }, [mandate, isOpen, asyncStorage]);

  const handleSubmit = (data: Omit<MandateFormData, 'questions'>) => {
    const formData: MandateFormData = {
      ...data,
      questions
    };
    onSubmit(formData);
    form.reset();
    setQuestions([]);
  };

  const handleClose = () => {
    form.reset();
    setQuestions([]);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mandate ? 'Edit Research Mandate' : 'Create New Research Mandate'}
          </DialogTitle>
          <DialogDescription>
            {mandate 
              ? 'Update the details of your research mandate.'
              : 'Fill in the details to create a new research mandate.'
            }
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Mandate Details</TabsTrigger>
            <TabsTrigger value="questions">Legal Questions</TabsTrigger>
          </TabsList>

          <TabsContent value="details">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                {/* Title */}
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mandate Title *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter mandate title..." 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Client Name */}
                <FormField
                  control={form.control}
                  name="clientName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client Name *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter client name..." 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  {/* Legal Area */}
                  <FormField
                    control={form.control}
                    name="legalArea"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Legal Area *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select legal area" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {LEGAL_AREAS.map((area) => (
                              <SelectItem key={area} value={area}>
                                {area}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Priority */}
                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Priority *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Low">Low</SelectItem>
                            <SelectItem value="Medium">Medium</SelectItem>
                            <SelectItem value="High">High</SelectItem>
                            <SelectItem value="Urgent">Urgent</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Research Objective */}
                <FormField
                  control={form.control}
                  name="researchObjective"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Research Objective *</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe the research objective in detail..."
                          rows={4}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  {/* Deadline */}
                  <FormField
                    control={form.control}
                    name="deadline"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Deadline *</FormLabel>
                        <FormControl>
                          <Input 
                            type="date" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Assigned Lawyer */}
                  <FormField
                    control={form.control}
                    name="assignedLawyer"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Assigned Lawyer</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter lawyer name..." 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-6">
                  <Button type="button" variant="outline" onClick={handleClose}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Saving...' : mandate ? 'Update Mandate' : 'Create Mandate'}
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="questions">
            <LegalQuestionsSection
              questions={questions}
              onChange={setQuestions}
            />
            <div className="flex justify-end space-x-2 pt-6">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button 
                type="button" 
                onClick={() => form.handleSubmit(handleSubmit)()}
                disabled={isLoading}
              >
                {isLoading ? 'Saving...' : mandate ? 'Update Mandate' : 'Create Mandate'}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}; 