/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

// import {onRequest} from "firebase-functions/v2/https";
import { onRequest, onCall } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import Stripe from 'stripe';
import { handleStripeWebhook } from './stripe-handlers';

// Initialize Stripe with the secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-08-16'
});

// Stripe webhook handler
export const stripeWebhook = onRequest(async (request, response) => {
  const signature = request.headers['stripe-signature'];
  
  if (!signature) {
    logger.error('No Stripe signature found in request');
    response.status(400).send('No Stripe signature found');
    return;
  }

  try {
    const event = stripe.webhooks.constructEvent(
      request.rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );

    logger.info('Received Stripe webhook event:', { type: event.type });
    
    // Handle the event
    await handleStripeWebhook(event);

    response.json({ received: true });
  } catch (err) {
    const error = err as Error;
    logger.error('Webhook Error:', error.message);
    response.status(400).send(`Webhook Error: ${error.message}`);
  }
});

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// export const helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

export const generateFlashcards = onCall(async (request) => {
  try {
    const { text } = request.data;
    logger.info("Received request to generate flashcards", { textLength: text?.length });
    
    if (!text) {
      logger.error("No text provided for flashcard generation");
      throw new Error("No text provided for flashcard generation");
    }

    const apiKey = process.env.OPENAI_API_KEY || process.env.openai_key || (globalThis as any).functions?.config()?.openai?.key;
    logger.info("Checking OpenAI API key availability");

    if (!apiKey) {
      logger.warn("OpenAI API key not found, using fallback");
      return {
        flashcards: [
          {
            question: "What is the main topic of this text?",
            answer: text.split('\n')[0] || "No text available"
          }
        ]
      };
    }

    logger.info("Calling OpenAI API");
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are an assistant that generates flashcards (question/answer pairs) from legal case text. Return a JSON array of objects with 'question' and 'answer' fields."
          },
          {
            role: "user",
            content: `Generate flashcards from the following text. Return a JSON array of objects with 'question' and 'answer'.\n${text}`
          }
        ],
        max_tokens: 512
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error("OpenAI API error", { status: response.status, statusText: response.statusText, error: errorText });
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      logger.error("No content received from OpenAI", { data });
      throw new Error("No content received from OpenAI");
    }

    try {
      const flashcards = JSON.parse(content);
      logger.info("Successfully generated flashcards", { count: flashcards.length });
      return { flashcards };
    } catch (e) {
      logger.error("Error parsing OpenAI response", { error: e, content });
      return {
        flashcards: [
          {
            question: "What is the main topic of this text?",
            answer: text.split('\n')[0] || "No text available"
          }
        ]
      };
    }
  } catch (error) {
    logger.error("Error in generateFlashcards", { error });
    throw new Error("Failed to generate flashcards. Please try again.");
  }
});
