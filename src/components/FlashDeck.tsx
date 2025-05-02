import React, { useState } from 'react';
import { toast } from '@/components/ui/use-toast';
import { flashcardService, Flashcard, FlashcardDeck } from '@/lib/services/flashcardService';

const FlashDeck: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [deckTitle, setDeckTitle] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [decks, setDecks] = useState<FlashcardDeck[]>([]);
  const [selectedDeck, setSelectedDeck] = useState<FlashcardDeck | null>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!flashcardService.validateFile(file)) {
      return;
    }

    setSelectedFile(file);
    setShowNameDialog(true);
  };

  const handleGenerateFlashcards = async () => {
    if (!selectedFile || !deckTitle) return;

    try {
      setIsGenerating(true);
      const text = await flashcardService.extractTextFromFile(selectedFile);
      const flashcards = await flashcardService.generateFlashcards(text);
      const deck = await flashcardService.saveDeck(deckTitle, flashcards);
      
      if (deck) {
        setDecks(prevDecks => [...prevDecks, deck]);
        setSelectedDeck(deck);
        setShowNameDialog(false);
        setDeckTitle('');
        setSelectedFile(null);
      }
    } catch (error) {
      console.error('Error generating flashcards:', error);
      toast({
        title: "Error",
        description: "Failed to generate flashcards. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div>
      {/* Render your component content here */}
    </div>
  );
};

export default FlashDeck; 