import React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  PlusIcon,
  TrashIcon,
  QuestionMarkCircleIcon,
} from '@heroicons/react/24/outline';
import { LegalQuestionFormData, Priority } from '@/lib/models/mandate';

const questionSchema = z.object({
  question: z.string().min(1, 'Question is required'),
  description: z.string().optional(),
  priority: z.enum(['Low', 'Medium', 'High', 'Urgent'] as const).optional(),
});

const questionsSchema = z.object({
  questions: z.array(questionSchema),
});

interface LegalQuestionsSectionProps {
  questions: LegalQuestionFormData[];
  onChange: (questions: LegalQuestionFormData[]) => void;
}

export const LegalQuestionsSection: React.FC<LegalQuestionsSectionProps> = ({
  questions,
  onChange
}) => {
  const form = useForm<{ questions: LegalQuestionFormData[] }>({
    resolver: zodResolver(questionsSchema),
    defaultValues: {
      questions: questions.length > 0 ? questions : [{ question: '', description: '', priority: 'Medium' }]
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'questions'
  });

  // Watch for changes and update parent
  React.useEffect(() => {
    const subscription = form.watch((value) => {
      if (value.questions) {
        onChange(value.questions as LegalQuestionFormData[]);
      }
    });
    return () => subscription.unsubscribe();
  }, [form, onChange]);

  const addQuestion = () => {
    append({ question: '', description: '', priority: 'Medium' });
  };

  const removeQuestion = (index: number) => {
    remove(index);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <QuestionMarkCircleIcon className="w-5 h-5" />
            Legal Questions ({fields.length})
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addQuestion}
            className="flex items-center gap-2"
          >
            <PlusIcon className="w-4 h-4" />
            Add Question
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <div className="space-y-4">
            {fields.map((field, index) => (
              <Card key={field.id} className="p-4 bg-muted/30">
                <div className="flex items-start justify-between mb-3">
                  <Badge variant="secondary" className="text-xs">
                    Question {index + 1}
                  </Badge>
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeQuestion(index)}
                      className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                <div className="space-y-3">
                  <FormField
                    control={form.control}
                    name={`questions.${index}.question`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Legal Question *</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter the legal question..."
                            rows={2}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`questions.${index}.description`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Additional context or details..."
                            rows={2}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`questions.${index}.priority`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Priority (Optional)</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
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
              </Card>
            ))}

            {fields.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <QuestionMarkCircleIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No legal questions added yet.</p>
                <p className="text-sm">Click "Add Question" to start.</p>
              </div>
            )}
          </div>
        </Form>
      </CardContent>
    </Card>
  );
}; 