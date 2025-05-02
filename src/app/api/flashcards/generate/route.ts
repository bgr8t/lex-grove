import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    const prompt = `Create 5 high-quality flashcards from the following text. Each flashcard should have a clear question and a detailed answer. Format the response as a JSON object with a 'flashcards' array containing objects with 'question' and 'answer' properties. Text: ${text}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that creates educational flashcards. Create clear, concise questions and detailed, accurate answers. Always return a valid JSON object with a 'flashcards' array."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" }
    });

    const response = JSON.parse(completion.choices[0].message.content || '{}');
    
    if (!response.flashcards || !Array.isArray(response.flashcards)) {
      throw new Error('Invalid response format from OpenAI');
    }

    return NextResponse.json({ flashcards: response.flashcards });
  } catch (error) {
    console.error('Error generating flashcards:', error);
    return NextResponse.json(
      { error: 'Failed to generate flashcards' },
      { status: 500 }
    );
  }
} 