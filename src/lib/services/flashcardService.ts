import { toast } from '@/components/ui/use-toast';
import { functions } from '@/lib/firebase';
import { httpsCallable } from 'firebase/functions';
import { collection, getDocs, addDoc, doc, getDoc, deleteDoc, serverTimestamp, QueryDocumentSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface Flashcard {
  question: string;
  answer: string;
}

export interface FlashcardDeck {
  id: string;
  title: string;
  flashcards: Flashcard[];
  createdAt: any;
  updatedAt: any;
  userId: string;
}

interface FlashcardDeckData {
  title: string;
  flashcards: Flashcard[];
  userId: string;
  createdAt: any;
  updatedAt: any;
}

function convertToFlashcardDeck(doc: QueryDocumentSnapshot): FlashcardDeck {
  const data = doc.data() as FlashcardDeckData;
  return {
    id: doc.id,
    ...data
  };
}

function generateSimpleFlashcardsFromBrief(text: string): Flashcard[] {
  // Very basic fallback: split by lines, make Q/A pairs
  // You can improve this logic as needed
  const lines = text.split('\n').filter(Boolean);
  return lines.map((line, idx) => ({
    question: `What is the key point #${idx + 1}?`,
    answer: line
  }));
}

export const flashcardService = {
  async generateFlashcards(text: string): Promise<Flashcard[]> {
    try {
      const generateFlashcards = httpsCallable(functions, 'generateFlashcards');
      const result: any = await generateFlashcards({ text });
      
      if (!result.data || !result.data.flashcards) {
        throw new Error('Invalid response format from server');
      }
      
      return result.data.flashcards;
    } catch (error) {
      console.error('Error generating flashcards:', error);
      toast({
        title: "AI unavailable, using basic flashcards",
        description: "Falling back to simple flashcard generation.",
        variant: "destructive",
      });
      // Fallback: generate simple flashcards from the text
      return generateSimpleFlashcardsFromBrief(text);
    }
  },

  async extractTextFromFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        // If content is too large, split it into chunks
        if (content.length > 1000000) { // 1MB limit
          const chunks = this.splitTextIntoChunks(content, 1000000);
          resolve(chunks[0]); // For now, just use the first chunk
        } else {
          resolve(content);
        }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsText(file);
    });
  },

  splitTextIntoChunks(text: string, chunkSize: number): string[] {
    const chunks: string[] = [];
    for (let i = 0; i < text.length; i += chunkSize) {
      chunks.push(text.slice(i, i + chunkSize));
    }
    return chunks;
  },

  validateFile(file: File): boolean {
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a PDF, DOCX, or TXT file.",
        variant: "destructive",
      });
      return false;
    }

    if (file.size > maxSize) {
      toast({
        title: "File Too Large",
        description: "Please upload a file smaller than 10MB.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  },

  async saveDeck(title: string, flashcards: Flashcard[], userId: string): Promise<FlashcardDeck> {
    try {
      if (!userId) {
        throw new Error('User must be logged in to save flashcard decks');
      }

      const decksRef = collection(db, 'flashcardDecks');
      
      const newDeck: FlashcardDeckData = {
        title,
        flashcards,
        userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(decksRef, newDeck);
      
      return {
        id: docRef.id,
        ...newDeck,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error saving flashcard deck:', error);
      toast({
        title: "Error",
        description: "Failed to save flashcard deck. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  },

  async getDecks(userId: string): Promise<FlashcardDeck[]> {
    try {
      console.log('[getDecks] Fetching decks for user:', userId);
      
      if (!userId) {
        console.log('[getDecks] No userId provided, returning empty array');
        return [];
      }

      const decksRef = collection(db, 'flashcardDecks');
      console.log('[getDecks] Querying Firestore collection');
      const snapshot = await getDocs(decksRef);
      
      console.log(`[getDecks] Retrieved ${snapshot.docs.length} documents, filtering for userId: ${userId}`);
      const userDecks = snapshot.docs
        .map(convertToFlashcardDeck)
        .filter(deck => String(deck.userId) === String(userId));
      
      console.log(`[getDecks] After filtering, found ${userDecks.length} decks belonging to user`);
      return userDecks;
    } catch (error) {
      console.error('[getDecks] Error fetching flashcard decks:', error);
      toast({
        title: "Error",
        description: "Failed to fetch flashcard decks. Please try again.",
        variant: "destructive",
      });
      return []; // Return empty array instead of throwing to prevent UI failures
    }
  },

  async getDeck(id: string, userId: string): Promise<FlashcardDeck> {
    try {
      const docRef = doc(db, 'flashcardDecks', id);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        throw new Error('Flashcard deck not found');
      }

      const deck = convertToFlashcardDeck(docSnap);

      if (deck.userId !== userId) {
        throw new Error('Unauthorized access to flashcard deck');
      }

      return deck;
    } catch (error) {
      console.error('Error fetching flashcard deck:', error);
      toast({
        title: "Error",
        description: "Failed to fetch flashcard deck. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  },

  async deleteDeck(id: string, userId: string): Promise<void> {
    try {
      const docRef = doc(db, 'flashcardDecks', id);
      
      // Verify ownership before deleting
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        throw new Error('Flashcard deck not found');
      }

      const deck = convertToFlashcardDeck(docSnap);

      if (deck.userId !== userId) {
        throw new Error('Unauthorized access to flashcard deck');
      }

      await deleteDoc(docRef);
      
      toast({
        title: "Success",
        description: "Flashcard deck deleted successfully.",
      });
    } catch (error) {
      console.error('Error deleting flashcard deck:', error);
      toast({
        title: "Error",
        description: "Failed to delete flashcard deck. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  },

  async updateDeck(id: string, title: string, flashcards: Flashcard[], userId: string): Promise<void> {
    try {
      console.log('[updateDeck] Starting update:', { id, flashcardsCount: flashcards?.length, userId });

      // Basic validation
      if (!id || !userId) {
        throw new Error('Missing deck ID or user ID');
      }

      if (!Array.isArray(flashcards) || flashcards.length === 0) {
        throw new Error('Invalid flashcards data');
      }

      // Get reference to the document
      const deckRef = doc(db, 'flashcardDecks', id);
      
      // Verify document exists
      const docSnap = await getDoc(deckRef);
      if (!docSnap.exists()) {
        throw new Error('Deck not found');
      }

      // Clean and validate flashcards
      const cleanFlashcards = flashcards.map(card => ({
        question: String(card.question || '').trim(),
        answer: String(card.answer || '').trim()
      }));

      // Perform the update
      await updateDoc(deckRef, {
        flashcards: cleanFlashcards,
        updatedAt: serverTimestamp()
      });

      console.log('[updateDeck] Update successful');
      toast({
        title: "Success",
        description: "Flashcards updated successfully.",
      });

    } catch (error) {
      console.error('[updateDeck] Error:', error);
      
      let message = "Failed to update flashcards.";
      if (error instanceof Error) {
        message = error.message;
      }
      
      toast({
        title: "Update Failed",
        description: message,
        variant: "destructive",
      });
      throw error;
    }
  }
};

export { db }; 