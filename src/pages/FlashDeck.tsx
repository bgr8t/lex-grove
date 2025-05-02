import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeftIcon, ArrowRightIcon, ArrowPathIcon, TrashIcon, PlusIcon, PencilIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { flashcardService, Flashcard, FlashcardDeck } from '@/lib/services/flashcardService';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const FlashDeck = () => {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [savedDecks, setSavedDecks] = useState<FlashcardDeck[]>([]);
  const { currentUser } = useAuth();

  // New state for manual flashcard creation
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newDeckTitle, setNewDeckTitle] = useState('');
  const [manualFlashcards, setManualFlashcards] = useState<Flashcard[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [currentAnswer, setCurrentAnswer] = useState('');

  // Edit deck state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editDeckId, setEditDeckId] = useState<string | null>(null);
  const [editDeckTitle, setEditDeckTitle] = useState('');
  const [editFlashcards, setEditFlashcards] = useState<Flashcard[]>([]);
  const [editQuestion, setEditQuestion] = useState('');
  const [editAnswer, setEditAnswer] = useState('');

  useEffect(() => {
    loadSavedDecks();
  }, []);

  const loadSavedDecks = async () => {
    try {
      if (!currentUser?.uid) return;
      const decks = await flashcardService.getDecks(currentUser.uid);
      setSavedDecks(decks);
    } catch (error) {
      console.error('Error loading saved decks:', error);
      toast({
        title: "Error",
        description: "Failed to load saved decks. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handlePrevious = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
      setIsFlipped(false);
    }
  };

  const handleNext = () => {
    if (currentCardIndex < flashcards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
      setIsFlipped(false);
    }
  };

  const handleLoadDeck = async (deck: FlashcardDeck) => {
    try {
      if (!currentUser?.uid) return;
      const loadedDeck = await flashcardService.getDeck(deck.id, currentUser.uid);
      setFlashcards(loadedDeck.flashcards);
      setCurrentCardIndex(0);
      setIsFlipped(false);
    } catch (error) {
      console.error('Error loading deck:', error);
      toast({
        title: "Error",
        description: "Failed to load flashcard deck. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteDeck = async (deckId: string) => {
    try {
      if (!currentUser?.uid) return;
      await flashcardService.deleteDeck(deckId, currentUser.uid);
      await loadSavedDecks();
      toast({
        title: "Success",
        description: "Flashcard deck deleted successfully.",
      });
    } catch (error) {
      console.error('Error deleting deck:', error);
      toast({
        title: "Error",
        description: "Failed to delete flashcard deck. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Function to add a new flashcard
  const handleAddFlashcard = () => {
    if (!currentQuestion.trim() || !currentAnswer.trim()) {
      toast({
        title: "Error",
        description: "Both question and answer are required.",
        variant: "destructive",
      });
      return;
    }

    setManualFlashcards([
      ...manualFlashcards,
      { question: currentQuestion, answer: currentAnswer }
    ]);
    setCurrentQuestion('');
    setCurrentAnswer('');
  };

  // Function to save the manual deck
  const handleSaveManualDeck = async () => {
    if (!currentUser?.uid) {
      toast({
        title: "Error",
        description: "You must be logged in to save flashcard decks.",
        variant: "destructive",
      });
      return;
    }

    if (!newDeckTitle.trim()) {
      toast({
        title: "Error",
        description: "Deck title is required.",
        variant: "destructive",
      });
      return;
    }

    if (manualFlashcards.length === 0) {
      toast({
        title: "Error",
        description: "Add at least one flashcard to the deck.",
        variant: "destructive",
      });
      return;
    }

    try {
      const deck = await flashcardService.saveDeck(newDeckTitle, manualFlashcards, currentUser.uid);
      setSavedDecks([...savedDecks, deck]);
      setIsCreateDialogOpen(false);
      setNewDeckTitle('');
      setManualFlashcards([]);
      toast({
        title: "Success",
        description: "Flashcard deck created successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save flashcard deck. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Function to remove a flashcard from the manual deck
  const handleRemoveFlashcard = (index: number) => {
    setManualFlashcards(manualFlashcards.filter((_, i) => i !== index));
  };

  // Open edit dialog with deck data
  const handleEditDeck = (deck: FlashcardDeck) => {
    setEditDeckId(deck.id);
    setEditDeckTitle(deck.title);
    setEditFlashcards([...deck.flashcards]);
    setEditQuestion('');
    setEditAnswer('');
    setIsEditDialogOpen(true);
  };

  // Edit dialog handlers
  const handleEditAddFlashcard = () => {
    if (!editQuestion.trim() || !editAnswer.trim()) {
      toast({ title: 'Error', description: 'Both question and answer are required.', variant: 'destructive' });
      return;
    }
    setEditFlashcards([...editFlashcards, { question: editQuestion, answer: editAnswer }]);
    setEditQuestion('');
    setEditAnswer('');
  };
  const handleEditRemoveFlashcard = (index: number) => {
    setEditFlashcards(editFlashcards.filter((_, i) => i !== index));
  };
  const handleEditUpdateFlashcard = (index: number, field: 'question' | 'answer', value: string) => {
    setEditFlashcards(editFlashcards.map((card, i) => i === index ? { ...card, [field]: value } : card));
  };

  // Save changes to Firestore
  const handleSaveEditDeck = async () => {
    if (!currentUser?.uid || !editDeckId) {
      console.log('[handleSaveEditDeck] Missing user or deck ID:', { userId: currentUser?.uid, editDeckId });
      toast({ 
        title: 'Error', 
        description: 'You must be logged in to update flashcards.', 
        variant: 'destructive' 
      });
      return;
    }

    if (editFlashcards.length === 0) {
      toast({ 
        title: 'Error', 
        description: 'Add at least one flashcard to the deck.', 
        variant: 'destructive' 
      });
      return;
    }

    // Validate flashcard content
    const invalidCards = editFlashcards.filter(card => !card.question?.trim() || !card.answer?.trim());
    if (invalidCards.length > 0) {
      toast({ 
        title: 'Error', 
        description: 'All flashcards must have both a question and an answer.', 
        variant: 'destructive' 
      });
      return;
    }

    try {
      console.log('[handleSaveEditDeck] Attempting to update deck:', {
        deckId: editDeckId,
        userId: currentUser.uid,
        cardCount: editFlashcards.length
      });

      // Clean the flashcards data
      const cleanFlashcards = editFlashcards.map(card => ({
        question: card.question.trim(),
        answer: card.answer.trim()
      }));

      await flashcardService.updateDeck(
        editDeckId,
        editDeckTitle,
        cleanFlashcards,
        currentUser.uid
      );

      // Update local state
      setIsEditDialogOpen(false);
      setEditDeckId(null);
      setEditDeckTitle('');
      setEditFlashcards([]);
      
      // Refresh the decks list
      await loadSavedDecks();
      
      toast({ 
        title: 'Success', 
        description: 'Flashcards updated successfully.' 
      });
    } catch (error) {
      console.error('[handleSaveEditDeck] Error updating deck:', error);
      toast({ 
        title: 'Error', 
        description: error instanceof Error ? error.message : 'Failed to update deck.', 
        variant: 'destructive' 
      });
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 mt-16">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Main Content - Flashcard Viewer */}
            <div className="flex-1">
              <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Flash Deck</h1>
                <p className="text-muted-foreground">
                  Study legal concepts with flashcards
                </p>
              </div>

              {/* Flashcard */}
              <div className="relative aspect-[4/3] max-w-2xl mx-auto mb-8 perspective">
                <div 
                  className={cn(
                    "absolute inset-0 transition-transform duration-500 transform-gpu",
                    isFlipped ? "rotate-y-180" : ""
                  )}
                  onClick={() => setIsFlipped(!isFlipped)}
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  <div className={cn(
                    "absolute inset-0 backface-hidden",
                    isFlipped ? "hidden" : ""
                  )}>
                    <div className="neumorph-card h-full p-8 flex flex-col justify-center items-center text-center overflow-auto">
                      <div className="w-full max-h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                        <p className="text-lg md:text-xl lg:text-2xl break-words whitespace-pre-wrap">
                          {flashcards[currentCardIndex]?.question || "No flashcards available"}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className={cn(
                    "absolute inset-0 backface-hidden rotate-y-180",
                    !isFlipped ? "hidden" : ""
                  )}>
                    <div className="neumorph-card h-full p-8 flex flex-col justify-center items-center text-center overflow-auto">
                      <div className="w-full max-h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                        <p className="text-lg md:text-xl lg:text-2xl break-words whitespace-pre-wrap">
                          {flashcards[currentCardIndex]?.answer || "No flashcards available"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation Controls */}
              <div className="flex justify-center gap-4">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handlePrevious}
                  disabled={currentCardIndex === 0}
                >
                  <ArrowLeftIcon className="h-5 w-5 mr-2" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setIsFlipped(!isFlipped)}
                >
                  <ArrowPathIcon className="h-5 w-5 mr-2" />
                  Flip Card
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleNext}
                  disabled={currentCardIndex === flashcards.length - 1}
                >
                  Next
                  <ArrowRightIcon className="h-5 w-5 ml-2" />
                </Button>
              </div>

              {/* Progress Indicator */}
              <div className="text-center mt-4 text-muted-foreground">
                {flashcards.length > 0 ? `Card ${currentCardIndex + 1} of ${flashcards.length}` : "No flashcards available"}
              </div>
            </div>

            {/* Sidebar */}
            <div className="w-full md:w-80">
              {/* Create Manual Deck Button */}
              <div className="neumorph-card p-4 mb-6">
                <Button
                  className="w-full flex items-center justify-center gap-2 py-2"
                  onClick={() => setIsCreateDialogOpen(true)}
                >
                  <PlusIcon className="h-5 w-5" />
                  Create New Deck
                </Button>
              </div>

              {/* Saved Decks */}
              <div className="neumorph-card p-6">
                <h2 className="text-xl font-semibold mb-4">Saved Decks</h2>
                {savedDecks.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No saved decks yet</p>
                ) : (
                  <div className="space-y-4">
                    {savedDecks.map((deck) => (
                      <div
                        key={deck.id}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/50 cursor-pointer"
                        onClick={() => handleLoadDeck(deck)}
                      >
                        <div>
                          <h3 className="font-medium">{deck.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {deck.flashcards.length} cards
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditDeck(deck);
                            }}
                          >
                            <PencilIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Create Manual Deck Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New Flashcard Deck</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Deck Title</label>
              <Input
                value={newDeckTitle}
                onChange={(e) => setNewDeckTitle(e.target.value)}
                placeholder="Enter deck title..."
                className="w-full"
              />
            </div>

            <div className="space-y-4">
              <div className="neumorph-card p-4">
                <label className="text-sm font-medium mb-2 block">Add New Flashcard</label>
                <div className="space-y-3">
                  <Textarea
                    value={currentQuestion}
                    onChange={(e) => setCurrentQuestion(e.target.value)}
                    placeholder="Enter question..."
                    className="w-full resize-none"
                    rows={2}
                  />
                  <Textarea
                    value={currentAnswer}
                    onChange={(e) => setCurrentAnswer(e.target.value)}
                    placeholder="Enter answer..."
                    className="w-full resize-none"
                    rows={3}
                  />
                  <Button
                    onClick={handleAddFlashcard}
                    className="w-full"
                  >
                    Add Flashcard
                  </Button>
                </div>
              </div>

              {manualFlashcards.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium">Flashcards in Deck</h3>
                  <div className="max-h-[300px] overflow-y-auto space-y-2">
                    {manualFlashcards.map((card, index) => (
                      <div key={index} className="neumorph-card p-3">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-sm font-medium">Card {index + 1}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveFlashcard(index)}
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-sm mb-1"><strong>Q:</strong> {card.question}</p>
                        <p className="text-sm text-muted-foreground"><strong>A:</strong> {card.answer}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveManualDeck}
              disabled={manualFlashcards.length === 0 || !newDeckTitle.trim()}
            >
              Save Deck
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Deck Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Flashcard Deck</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Deck Title</label>
              <Input
                value={editDeckTitle}
                onChange={e => setEditDeckTitle(e.target.value)}
                placeholder="Enter deck title..."
                className="w-full"
              />
            </div>
            <div className="space-y-4">
              <div className="neumorph-card p-4">
                <label className="text-sm font-medium mb-2 block">Add New Flashcard</label>
                <div className="space-y-3">
                  <Textarea
                    value={editQuestion}
                    onChange={e => setEditQuestion(e.target.value)}
                    placeholder="Enter question..."
                    className="w-full resize-none"
                    rows={2}
                  />
                  <Textarea
                    value={editAnswer}
                    onChange={e => setEditAnswer(e.target.value)}
                    placeholder="Enter answer..."
                    className="w-full resize-none"
                    rows={3}
                  />
                  <Button onClick={handleEditAddFlashcard} className="w-full">Add Flashcard</Button>
                </div>
              </div>
              {editFlashcards.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium">Flashcards in Deck</h3>
                  <div className="max-h-[300px] overflow-y-auto space-y-2">
                    {editFlashcards.map((card, index) => (
                      <div key={index} className="neumorph-card p-3">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-sm font-medium">Card {index + 1}</span>
                          <Button variant="ghost" size="icon" onClick={() => handleEditRemoveFlashcard(index)}>
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </div>
                        <Input
                          className="mb-2"
                          value={card.question}
                          onChange={e => handleEditUpdateFlashcard(index, 'question', e.target.value)}
                          placeholder="Edit question..."
                        />
                        <Textarea
                          value={card.answer}
                          onChange={e => handleEditUpdateFlashcard(index, 'answer', e.target.value)}
                          placeholder="Edit answer..."
                          className="w-full resize-none"
                          rows={2}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveEditDeck} disabled={editFlashcards.length === 0 || !editDeckTitle.trim()}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer className="mt-auto" />
    </div>
  );
};

export default FlashDeck; 