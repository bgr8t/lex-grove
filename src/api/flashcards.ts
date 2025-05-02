import { Request, Response } from 'express';
import { OpenAI } from 'openai';
import { verifyAuth } from './middleware/auth';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// In-memory storage for flashcard decks (replace with database in production)
const flashcardDecks: any[] = [];

export const generateFlashcards = async (req: Request, res: Response) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text content is required' });
    }

    // Create a prompt for generating flashcards
    const prompt = `Generate law flashcards from the following text. Each flashcard should have a clear question and a detailed answer. Use legal terminology and maintain accuracy. Format the response as a JSON array of objects with 'question' and 'answer' properties.

Text:
${text}

Generate 5-10 flashcards based on the text above.`;

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: "You are a legal expert creating flashcards for law students. Create clear, concise questions and detailed, accurate answers using proper legal terminology."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    // Parse the response
    const response = completion.choices[0].message.content;
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    // Parse the JSON response
    const flashcards = JSON.parse(response);

    // Return the flashcards
    res.json({ flashcards });
  } catch (error) {
    console.error('Error generating flashcards:', error);
    res.status(500).json({ error: 'Failed to generate flashcards' });
  }
};

// Get all decks
export const getDecks = (req: Request, res: Response) => {
  try {
    res.json({ decks: flashcardDecks });
  } catch (error) {
    console.error('Error fetching flashcard decks:', error);
    res.status(500).json({ error: 'Failed to fetch flashcard decks' });
  }
};

// Get a specific deck by ID
export const getDeck = (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deck = flashcardDecks.find(deck => deck.id === id);
    
    if (!deck) {
      return res.status(404).json({ error: 'Flashcard deck not found' });
    }
    
    res.json({ deck });
  } catch (error) {
    console.error('Error fetching flashcard deck:', error);
    res.status(500).json({ error: 'Failed to fetch flashcard deck' });
  }
};

// Create a new deck
export const createDeck = (req: Request, res: Response) => {
  try {
    const { title, flashcards } = req.body;
    
    if (!title || !flashcards || !Array.isArray(flashcards)) {
      return res.status(400).json({ error: 'Title and flashcards array are required' });
    }
    
    const newDeck = {
      id: Date.now().toString(),
      title,
      flashcards,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    flashcardDecks.push(newDeck);
    
    res.status(201).json({ deck: newDeck });
  } catch (error) {
    console.error('Error creating flashcard deck:', error);
    res.status(500).json({ error: 'Failed to create flashcard deck' });
  }
};

// Delete a deck by ID
export const deleteDeck = (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const index = flashcardDecks.findIndex(deck => deck.id === id);
    
    if (index === -1) {
      return res.status(404).json({ error: 'Flashcard deck not found' });
    }
    
    flashcardDecks.splice(index, 1);
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error deleting flashcard deck:', error);
    res.status(500).json({ error: 'Failed to delete flashcard deck' });
  }
};

// Export the router
export const flashcardsRouter = (router: any) => {
  router.post('/generate', generateFlashcards);
  router.get('/decks', getDecks);
  router.get('/decks/:id', getDeck);
  router.post('/decks', createDeck);
  router.delete('/decks/:id', deleteDeck);
  
  console.log('Flashcards routes registered');
  return router;
};

// Default export for easier importing in JavaScript files
export default { flashcardsRouter }; 