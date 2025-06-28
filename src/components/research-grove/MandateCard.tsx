import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  CalendarIcon, 
  UserIcon, 
  PencilIcon, 
  TrashIcon,
  FolderIcon 
} from '@heroicons/react/24/outline';
import { Mandate, Priority } from '@/lib/models/mandate';

interface MandateCardProps {
  mandate: Mandate;
  onEdit: (mandate: Mandate) => void;
  onDelete: (mandate: Mandate) => void;
  onOpenResearch: (mandate: Mandate) => void;
}

const priorityColors: Record<Priority, string> = {
  'Low': 'bg-green-100 text-green-800 border-green-200',
  'Medium': 'bg-blue-100 text-blue-800 border-blue-200', 
  'High': 'bg-orange-100 text-orange-800 border-orange-200',
  'Urgent': 'bg-red-100 text-red-800 border-red-200'
};

export const MandateCard: React.FC<MandateCardProps> = ({ 
  mandate, 
  onEdit, 
  onDelete, 
  onOpenResearch 
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const isOverdue = new Date(mandate.deadline) < new Date();

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 hover:border-primary/30">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg font-semibold line-clamp-2">
            {mandate.title}
          </CardTitle>
          <Badge 
            variant="outline" 
            className={`ml-2 ${priorityColors[mandate.priority]}`}
          >
            {mandate.priority}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Client and Legal Area */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="font-medium text-muted-foreground">Client:</span>
              <p className="text-foreground">{mandate.clientName}</p>
            </div>
            <div>
              <span className="font-medium text-muted-foreground">Area:</span>
              <p className="text-foreground">{mandate.legalArea}</p>
            </div>
          </div>

          {/* Research Objective */}
          <div>
            <span className="font-medium text-muted-foreground text-sm">Objective:</span>
            <p className="text-sm text-foreground line-clamp-2 mt-1">
              {mandate.researchObjective}
            </p>
          </div>

          {/* Deadline and Lawyer */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center text-muted-foreground">
              <CalendarIcon className="w-4 h-4 mr-1" />
              <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                {formatDate(mandate.deadline)}
              </span>
            </div>
            {mandate.assignedLawyer && (
              <div className="flex items-center text-muted-foreground">
                <UserIcon className="w-4 h-4 mr-1" />
                <span>{mandate.assignedLawyer}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenResearch(mandate)}
              className="flex-1 mr-2"
            >
              <FolderIcon className="w-4 h-4 mr-1" />
              Research
            </Button>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(mandate)}
                className="hover:bg-primary/10"
              >
                <PencilIcon className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(mandate)}
                className="hover:bg-destructive/10 hover:text-destructive"
              >
                <TrashIcon className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 