import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  PlusIcon, 
  MagnifyingGlassIcon,
  DocumentTextIcon,
  UsersIcon,
  ClockIcon,
  BeakerIcon
} from '@heroicons/react/24/outline';
import { MandateCard } from '@/components/research-grove/MandateCard';
import { MandateForm } from '@/components/research-grove/MandateForm';
import { DeleteConfirmModal } from '@/components/research-grove/DeleteConfirmModal';
import { ResearchTool } from '@/components/research-grove/ResearchTool';
import { ProtectedResearchGrove } from '@/components/auth/ProtectedResearchGrove';
import { Mandate, MandateFormData } from '@/lib/models/mandate';
import { useAsyncResearchGroveStorage } from '@/lib/services/researchGroveStorage';
import { useToast } from '@/hooks/use-toast';

type ViewMode = 'dashboard' | 'research';

const ResearchGroveContent = () => {
  const { toast } = useToast();
  const storage = useAsyncResearchGroveStorage();
  const [mandates, setMandates] = useState<Mandate[]>([]);
  const [filteredMandates, setFilteredMandates] = useState<Mandate[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [selectedMandate, setSelectedMandate] = useState<Mandate | null>(null);
  
  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMandate, setEditingMandate] = useState<Mandate | null>(null);
  const [isFormLoading, setIsFormLoading] = useState(false);
  
  // Delete modal states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingMandate, setDeletingMandate] = useState<Mandate | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load mandates on mount
  useEffect(() => {
    const loadMandates = async () => {
      try {
        setIsLoading(true);
        const loadedMandates = await storage.getMandates();
        setMandates(loadedMandates);
        setFilteredMandates(loadedMandates);
      } catch (error) {
        console.error('Error loading mandates:', error);
        toast({
          title: "Error",
          description: "Failed to load mandates.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadMandates();
  }, []);

  // Filter mandates based on search term
  useEffect(() => {
    const filtered = mandates.filter(mandate =>
      mandate.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mandate.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mandate.legalArea.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mandate.assignedLawyer.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredMandates(filtered);
  }, [mandates, searchTerm]);

  // Calculate dashboard statistics
  const stats = {
    total: mandates.length,
    urgent: mandates.filter(m => m.priority === 'Urgent').length,
    thisWeek: mandates.filter(m => {
      const deadline = new Date(m.deadline);
      const oneWeek = new Date();
      oneWeek.setDate(oneWeek.getDate() + 7);
      return deadline <= oneWeek && deadline >= new Date();
    }).length
  };

  const handleCreateMandate = () => {
    setEditingMandate(null);
    setIsFormOpen(true);
  };

  const handleEditMandate = (mandate: Mandate) => {
    setEditingMandate(mandate);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (formData: MandateFormData) => {
    try {
      setIsFormLoading(true);

      if (editingMandate) {
        // Update existing mandate (exclude questions from mandate object)
        const { questions, ...mandateData } = formData;
        const updatedMandate = {
          ...editingMandate,
          ...mandateData,
          deadline: new Date(formData.deadline).toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        await storage.updateMandate(editingMandate.id, updatedMandate);

        // Handle questions separately
        const existingQuestions = await storage.getQuestionsByMandateId(editingMandate.id);
        
        // Delete old questions
        await Promise.all(existingQuestions.map(q => storage.deleteQuestion(q.id!)));
        
        // Add new questions
        await Promise.all(formData.questions.map(questionData => {
          const question = {
            mandateId: editingMandate.id,
            ...questionData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          return storage.addQuestion(question);
        }));

        setMandates(prev => prev.map(m => m.id === editingMandate.id ? updatedMandate : m));
        
        toast({
          title: "Success",
          description: "Mandate updated successfully.",
        });
      } else {
        // Create new mandate (exclude questions from mandate object)
        const { questions, ...mandateData } = formData;
        const newMandateData = {
          ...mandateData,
          deadline: new Date(formData.deadline).toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        const newMandate = await storage.addMandate(newMandateData);

        // Add questions
        await Promise.all(formData.questions.map(questionData => {
          const question = {
            mandateId: newMandate.id!,
            ...questionData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          return storage.addQuestion(question);
        }));

        setMandates(prev => [...prev, newMandate]);
        
        toast({
          title: "Success",
          description: "Mandate created successfully.",
        });
      }

      setIsFormOpen(false);
      setEditingMandate(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save mandate.",
        variant: "destructive",
      });
    } finally {
      setIsFormLoading(false);
    }
  };

  const handleDeleteMandate = (mandate: Mandate) => {
    setDeletingMandate(mandate);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingMandate) return;

    try {
      setIsDeleting(true);
      await storage.deleteMandate(deletingMandate.id);
      setMandates(prev => prev.filter(m => m.id !== deletingMandate.id));
      
      toast({
        title: "Success",
        description: "Mandate deleted successfully.",
      });
      
      setIsDeleteModalOpen(false);
      setDeletingMandate(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete mandate.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenResearch = (mandate: Mandate) => {
    setSelectedMandate(mandate);
    setViewMode('research');
  };

  const handleBackToDashboard = () => {
    setViewMode('dashboard');
    setSelectedMandate(null);
  };

  // Research Tool View
  if (viewMode === 'research' && selectedMandate) {
    return <ResearchTool mandate={selectedMandate} onBack={handleBackToDashboard} />;
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8 mt-16">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <Skeleton className="h-10 w-64 mb-2" />
                <Skeleton className="h-4 w-96" />
              </div>
              <Skeleton className="h-10 w-32" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-4 w-24" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-16 mb-2" />
                    <Skeleton className="h-3 w-32" />
                  </CardContent>
                </Card>
              ))}
            </div>
            <Skeleton className="h-10 w-64 mb-8" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-48" />
              ))}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Dashboard View
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 mt-16">
        {/* Header Section */}
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <BeakerIcon className="w-8 h-8 text-primary" />
                <h1 className="text-3xl font-bold">Research Grove</h1>
              </div>
              <p className="text-muted-foreground">
                Manage your legal research mandates with efficiency and precision
              </p>
            </div>
            <Button onClick={handleCreateMandate} className="flex items-center gap-2">
              <PlusIcon className="w-4 h-4" />
              Create New Mandate
            </Button>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Mandates</CardTitle>
                <DocumentTextIcon className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                <p className="text-xs text-muted-foreground">Active research mandates</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Urgent Priority</CardTitle>
                <UsersIcon className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.urgent}</div>
                <p className="text-xs text-muted-foreground">Require immediate attention</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Due This Week</CardTitle>
                <ClockIcon className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{stats.thisWeek}</div>
                <p className="text-xs text-muted-foreground">Approaching deadlines</p>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filter */}
          <div className="mb-8">
            <div className="relative max-w-md">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search mandates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Mandates Grid */}
          {filteredMandates.length === 0 ? (
            <div className="text-center py-12">
              {mandates.length === 0 ? (
                <div className="max-w-md mx-auto">
                  <DocumentTextIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-xl font-semibold mb-2">No research mandates yet</h3>
                  <p className="text-muted-foreground mb-6">
                    Create your first research mandate to get started with organizing your legal research.
                  </p>
                  <Button onClick={handleCreateMandate} className="flex items-center gap-2 mx-auto">
                    <PlusIcon className="w-4 h-4" />
                    Create Your First Mandate
                  </Button>
                </div>
              ) : (
                <div className="max-w-md mx-auto">
                  <MagnifyingGlassIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-xl font-semibold mb-2">No mandates found</h3>
                  <p className="text-muted-foreground">
                    Try adjusting your search terms or create a new mandate.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMandates.map((mandate) => (
                <MandateCard
                  key={mandate.id}
                  mandate={mandate}
                  onEdit={handleEditMandate}
                  onDelete={handleDeleteMandate}
                  onOpenResearch={handleOpenResearch}
                />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer className="mt-auto" />

      {/* Modals */}
      <MandateForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingMandate(null);
        }}
        onSubmit={handleFormSubmit}
        mandate={editingMandate}
        isLoading={isFormLoading}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletingMandate(null);
        }}
        onConfirm={handleConfirmDelete}
        mandate={deletingMandate}
        isLoading={isDeleting}
      />
    </div>
  );
};

// Main Research Grove component with protection
const ResearchGrove = () => {
  return (
    <ProtectedResearchGrove>
      <ResearchGroveContent />
    </ProtectedResearchGrove>
  );
};

export default ResearchGrove; 