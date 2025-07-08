# Lex Briefs AI - Feature Documentation

This document provides a comprehensive overview of the main features of the Lex Briefs AI application.

## Table of Contents
1. [Core Features Overview](#-core-features-overview)
2. [User Authentication](#-feature-1-user-authentication)
3. [Case Brief Management](#-feature-2-case-brief-management)
4. [User Library & Collections](#-feature-3-user-library--collections)
5. [Agora: Collaborative Research](#-feature-4-agora-collaborative-research)
6. [Research Grove: Mandate Management](#-feature-5-research-grove-mandate-management)
7. [Flashcard Generation & Study](#-feature-6-flashcard-generation--study)
8. [Payments & Subscriptions](#-feature-7-payments--subscriptions)
9. [Blogging Platform](#-feature-8-blogging-platform)
10. [Semantic Search (Pinecone)](#-feature-9-semantic-search-pinecone)
11. [Data Management & Architecture](#-data-management--architecture)

---

## 📋 Core Features Overview

Lex Briefs AI is a multi-faceted platform designed to assist legal professionals and students. Key functionalities include:

- **AI-Powered Case Analysis**: Quickly generate and analyze case briefs.
- **Collaborative Research**: Work with others in a shared research space (Agora).
- **Personalized Library**: Organize and manage your own collection of legal documents.
- **Research Management**: Track research mandates and objectives (Research Grove).
- **Study Tools**: Create and review flashcards based on your material.
- **Secure & Scalable**: Built on a modern stack with Firebase, React, and integrated AI services.

---

## 👤 Feature 1: User Authentication

### Purpose
To provide secure user registration and login, protecting user data and controlling access to application features.

### Core Components
- `src/pages/Login.tsx`: Login page component.
- `src/pages/Register.tsx`: Registration page component.
- `src/components/auth/AuthButtons.tsx`: UI for login/logout buttons.
- `src/contexts/AuthContext.tsx`: React context for managing authentication state globally.
- `src/lib/firebase.ts`: Firebase configuration and initialization.
- `src/lib/services/userProfileService.ts`: Service for managing user profiles in Firestore.
- `src/components/auth/ProtectedRoute.tsx`: Higher-order component to protect routes that require authentication.

### User Flow

1.  **Registration**:
    - New users can register using their email and password.
    - Upon successful registration, a new user account is created in Firebase Authentication.
    - A corresponding user profile document is created in the `users` collection in Firestore.

2.  **Login**:
    - Existing users can log in with their credentials.
    - The application verifies credentials with Firebase Auth.
    - On successful login, the user's authentication state is stored in the `AuthContext` and shared across the application.

3.  **Session Management**:
    - Firebase handles session persistence, keeping users logged in across browser sessions.
    - The `AuthContext` provides a listener that updates the application state when the user's auth status changes (e.g., logs out).

4.  **Protected Routes**:
    - Pages and components that require a logged-in user are wrapped in the `ProtectedRoute` component.
    - If a non-authenticated user tries to access a protected route, they are redirected to the login page.

### Data Model (`userProfile`)
```typescript
interface UserProfile {
  uid: string;                 // Firebase Auth User ID
  email: string;               // User's email
  displayName?: string;        // User's display name
  photoURL?: string;           // URL to profile picture
  createdAt: Timestamp;        // Account creation timestamp
  subscription?: {             // Stripe subscription details
    status: string;
    planId: string;
    current_period_end: Timestamp;
  };
}
```

---

## ⚖️ Feature 2: Case Brief Management

### Purpose
To allow users to create, view, and manage AI-generated case briefs. This is a core feature for legal research and study.

### Core Components
- `src/pages/case-brief.tsx`: Page for listing and creating new case briefs.
- `src/pages/case-brief/[id].tsx`: Dynamic page for viewing a single case brief.
- `src/components/BriefCard.tsx`: A card component to display a summary of a case brief.
- `src/components/CreateBriefModal.tsx`: A modal for creating a new case brief.
- `src/lib/services/caseBriefService.ts`: Service for all Firestore operations related to case briefs.
- `src/lib/models/caseBrief.ts`: The data model for a case brief.

### User Flow

1.  **Creating a Brief**:
    - Users can initiate the creation of a new case brief, likely from the `/case-brief` page.
    - The `CreateBriefModal` opens, where the user can input the case details (e.g., case name, citation, or a document to analyze).
    - An AI service is called to process the input and generate the structured case brief.

2.  **Viewing Briefs**:
    - All created briefs are displayed in a list or grid format on the `/case-brief` page, using `BriefCard` components.
    - Clicking on a `BriefCard` navigates the user to the detailed view at `/case-brief/[id]`.

3.  **Detailed View**:
    - The detailed view page fetches the full case brief data from Firestore and presents it in a structured format (e.g., Facts, Issues, Holding, Reasoning).

### Data Model (`CaseBrief`)
```typescript
interface CaseBrief {
  id: string;                  // Unique identifier
  userId: string;              // ID of the user who created it
  title: string;               // Case name or title
  citation: string;            // Legal citation
  facts: string;               // Summary of the case facts
  issue: string;               // Legal issue(s)
  holding: string;             // The court's decision
  reasoning: string;           // The court's rationale
  createdAt: Timestamp;        // Creation timestamp
  // Potentially other fields like 'court', 'year', 'keywords', etc.
}
```

---

## 📚 Feature 3: User Library & Collections

### Purpose
To provide users with a personal space (`MyLibrary`) to save, organize, and manage their case briefs and other legal documents into collections.

### Core Components
- `src/pages/Library.tsx`: A public or general library page.
- `src/pages/MyLibrary.tsx`: The user's personal library page.
- `src/components/LibrarySection.tsx`: A reusable component for displaying library content.
- `src/components/BookmarkCollectionDialog.tsx`: Dialog to add an item to a collection.
- `src/components/CreateCollectionModal.tsx`: Modal for creating a new collection.
- `src/components/CollectionDetail.tsx`: Component to display the contents of a single collection.

### User Flow

1.  **Saving to Library**:
    - Users can save items (like case briefs) to their personal library.
    - This creates a reference to the item under the user's profile or a dedicated `library` collection in Firestore.

2.  **Creating Collections**:
    - Within their library, users can create custom collections to organize their saved items (e.g., "Torts Cases", "Contracts Research").
    - The `CreateCollectionModal` facilitates this, creating a new collection document in Firestore linked to the user.

3.  **Managing Collections**:
    - Users can add or remove items from their collections. The `BookmarkCollectionDialog` is likely used for this purpose.
    - They can view the contents of a specific collection, which would be rendered by `CollectionDetail.tsx`.

### Data Model

This feature would likely involve a few related data models in Firestore.

**Collection Model (`Collection`)**
```typescript
interface Collection {
  id: string;
  userId: string;
  name: string;
  description: string;
  createdAt: Timestamp;
}
```

**Library Item Model (`LibraryItem`)**
This could be a subcollection under each `Collection`.
```typescript
interface LibraryItem {
  id: string; // Document ID of the item in its original collection (e.g., caseBriefs)
  type: 'caseBrief' | 'article'; // To know which collection to look up
  addedAt: Timestamp;
}
```

---

## 🏛️ Feature 4: Agora: Collaborative Research

### Purpose
Agora is a collaborative space for users to read, edit, and discuss articles and research materials in real-time. It fosters a community of shared knowledge and learning.

### Core Components
- `src/pages/Agora.tsx`: The main entry point for the Agora feature.
- `src/components/agora/AgoraDashboard.tsx`: The central dashboard for Agora, likely showing a list of articles or projects.
- `src/components/agora/AgoraBrowse.tsx`: A component for browsing available content within Agora.
- `src/components/agora/AgoraArticleReader.tsx`: The component for reading an article.
- `src/components/agora/AgoraEditor.tsx`: A component that allows for editing of articles, suggesting real-time collaboration (e.g., using a CRDT-based library or Firestore real-time updates).
- `src/lib/services/agoraService.ts`: Service for handling Firestore operations related to Agora articles.

### User Flow
1.  **Dashboard**: Users enter Agora and see a dashboard of available or featured articles.
2.  **Browsing**: Users can browse or search for articles to read or contribute to.
3.  **Reading**: Selecting an article opens it in the `AgoraArticleReader`, providing a clean reading experience.
4.  **Editing/Collaboration**: For articles that are editable, the `AgoraEditor` provides tools for modifying content. Multiple users might be able to edit simultaneously, with changes reflected in real-time for all participants.
5.  **Saving**: Changes made in the editor are persisted to Firestore via the `agoraService`.

### Data Model (`AgoraArticle`)
```typescript
interface AgoraArticle {
  id: string;
  title: string;
  content: string; // Could be Markdown, HTML, or a structured JSON for a rich editor
  authorIds: string[]; // List of user IDs who have contributed
  viewCount: number;
  tags: string[];
  createdAt: Timestamp;
  lastModifiedAt: Timestamp;
  // Permissions-related fields might also be present
}
```

---

## 🌳 Feature 5: Research Grove: Mandate Management

### Purpose
Research Grove is a specialized tool for legal professionals to create, track, and manage legal research mandates. It helps in organizing research objectives, sources, and deadlines in a structured manner.

### Core Components
- `src/pages/ResearchGrove.tsx`: The main page for this feature.
- `src/components/research-grove/MandateCard.tsx`: Displays a summary of a research mandate.
- `src/components/research-grove/MandateForm.tsx`: A form for creating or editing a mandate.
- `src/components/research-grove/ResearchTool.tsx`: A tool for adding and managing research sources related to a mandate.
- `src/lib/services/firestoreResearchGrove.ts`: Service handling Firestore operations for mandates.
- `src/lib/models/mandate.ts`: The data model for a mandate.

### User Flow
1.  **Mandate Creation**: A user creates a new mandate, specifying details like the client, legal area, research objective, and deadline using the `MandateForm`.
2.  **Dashboard View**: All mandates are displayed on the `ResearchGrove` page, likely using `MandateCard` components to give a quick overview of each.
3.  **Research**: The user can select a mandate and use the `ResearchTool` to add sources, quotes, and notes. This tool might allow for generating a formatted document from the collected research.

### Data Model (`Mandate`)
This model is more complex and captures the structured nature of legal research tasks.
```typescript
interface Mandate {
  id: string;
  userId: string;
  title: string;
  clientName: string;
  legalArea: string; // e.g., 'Contract Law', 'Corporate Law'
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  researchObjective: string;
  deadline: Timestamp;
  createdAt: Timestamp;
  // It would likely have a subcollection for research sources.
}
```

**Research Source Model (`Source`)**
This would be a subcollection under each `Mandate`.
```typescript
interface Source {
  id: string;
  quote: string;
  fullSource: string; // Citation
  note: string; // User's analysis
  createdAt: Timestamp;
}
```

---

## 🃏 Feature 6: Flashcard Generation & Study

### Purpose
To help users study and memorize key legal concepts, case holdings, and definitions by creating and reviewing digital flashcards.

### Core Components
- `src/pages/FlashDeck.tsx`: The main page for viewing and interacting with a deck of flashcards.
- `src/components/FlashDeck.tsx`: The component that likely implements the flashcard flipping and deck navigation logic.
- `src/app/api/flashcards/generate/route.ts`: An API endpoint for automatically generating flashcards from a given text or document, likely using an AI model.
- `src/lib/services/flashcardService.ts`: Service for Firestore operations related to flashcard decks.

### User Flow
1.  **Generation**:
    - A user can provide text (e.g., from a case brief or an article) to an AI-powered generation service.
    - The `generate` API endpoint processes the text and returns a set of questions and answers.
    - This set is saved as a new "deck" in Firestore.
2.  **Studying**:
    - The user navigates to the `FlashDeck` page to study a deck.
    - They are presented with one card at a time. They can click to "flip" the card and reveal the answer.
    - They can navigate through the deck (next/previous card).

### Data Model

**Flashcard Deck Model (`FlashcardDeck`)**
```typescript
interface FlashcardDeck {
  id: string;
  userId: string;
  title: string; // e.g., "Contracts - Week 1"
  sourceId: string; // ID of the document it was generated from
  createdAt: Timestamp;
}
```

**Flashcard Model (`Flashcard`)**
This would be a subcollection under each `FlashcardDeck`.
```typescript
interface Flashcard {
  id: string;
  question: string;
  answer: string;
}
```

---

## 💳 Feature 7: Payments & Subscriptions

### Purpose
To manage user subscriptions for premium features, handling payments through Stripe. This enables monetization of the platform.

### Core Components
- `src/components/PricingSection.tsx`: A UI component that displays different subscription plans and pricing.
- `pages/api/create-checkout-session.ts`: An API route to create a new Stripe Checkout session for a user.
- `src/pages/payment-success.tsx`: The page the user is redirected to after a successful payment.
- `functions/src/stripe-handlers.ts`: Cloud Functions for Firebase that handle Stripe webhooks to listen for events (e.g., `checkout.session.completed`, `customer.subscription.deleted`).
- `src/lib/services/stripeService.ts`: A client-side service to interact with Stripe and the application's backend.

### User Flow
1.  **Select Plan**: A user selects a subscription plan from the `PricingSection`.
2.  **Checkout**:
    - The client calls the `/api/create-checkout-session` endpoint.
    - This endpoint communicates with Stripe to create a secure checkout session and redirects the user to the Stripe Checkout page.
3.  **Payment**: The user enters their payment details on the Stripe-hosted page.
4.  **Confirmation**: After a successful payment, Stripe redirects the user to the `payment-success` page.
5.  **Webhook Handling**:
    - Stripe sends webhook events to the Cloud Functions (`stripe-handlers.ts`).
    - The `checkout.session.completed` event triggers a function to update the user's profile in Firestore with their new subscription status.
    - Other events (e.g., cancellations, failed payments) also update the user's status accordingly.

### Data Model (`userProfile.subscription`)
The subscription status is stored as a field within the `UserProfile` model.
```typescript
interface UserProfile {
  // ... other fields
  subscription?: {
    stripeCustomerId: string;
    status: 'active' | 'trialing' | 'past_due' | 'canceled';
    planId: string;
    // Timestamps managed by Stripe webhooks
    current_period_end: Timestamp; 
    cancel_at_period_end: boolean;
  };
}
```

---

## ✍️ Feature 8: Blogging Platform

### Purpose
To provide a simple content management system (CMS) for creating, publishing, and displaying blog posts. This can be used for announcements, articles, and other content.

### Core Components
- `src/pages/Blog.tsx`: The main page that displays a list or grid of all blog posts.
- `src/pages/BlogPostPage.tsx`: The page for displaying a single, full-length blog post.
- `src/pages/BlogPostCreate.tsx`: A page with a form or editor for creating a new blog post (likely restricted to admins).
- `src/components/BlogGrid.tsx`: A component to display blog posts in a grid layout.
- `src/components/BlogPost.tsx`: A component that renders the content of a single blog post.
- `src/data/blogPosts.ts`: This file suggests that blog posts might be currently stored as static data in the codebase, which is simple but not scalable. A Firestore-based approach would be a likely next step.

### User Flow
1.  **Viewing Posts**: Users can visit the `/blog` page to see all published posts.
2.  **Reading a Post**: Clicking on a post summary navigates the user to the `BlogPostPage` for the full content.
3.  **Creating a Post (Admin)**: An authorized user (admin) would navigate to `BlogPostCreate` to write and publish a new post. The post would then be added to the data source (either `blogPosts.ts` or a `blogPosts` collection in Firestore).

### Data Model (`BlogPost`)
If this were moved to Firestore, the model would look something like this:
```typescript
interface BlogPost {
  id: string;
  slug: string; // URL-friendly version of the title
  title: string;
  authorId: string;
  content: string; // Markdown or HTML
  excerpt: string; // A short summary
  featuredImageUrl: string;
  tags: string[];
  publishedAt: Timestamp;
  status: 'draft' | 'published';
}
```

---

## 🔎 Feature 9: Semantic Search (Pinecone)

### Purpose
To provide an advanced search experience that understands the *meaning* and *context* of a user's query, not just keywords. This is powered by vector embeddings and the Pinecone vector database.

### Core Components
- `src/components/SearchBar.tsx`: The main search input component for users.
- `src/components/SearchResults.tsx`: Displays the results returned from the search.
- `src/pages/api/generate-embeddings.ts`: An API route that takes text data (e.g., from a case brief or article), converts it into vector embeddings using an AI model (like one from OpenAI), and prepares it for storage.
- `src/pages/api/pinecone-upsert.ts`: An API route that takes the generated embeddings and "upserts" (inserts or updates) them into a Pinecone index.
- `src/pages/api/pinecone-query.ts`: An API route that takes a user's search query, converts it into an embedding, and queries the Pinecone index to find the most semantically similar documents.
- `src/lib/services/pineconeService.ts`: A client-side service for interacting with the Pinecone-related API routes.

### User Flow

1.  **Indexing (Backend Process)**:
    - When a new document (e.g., case brief, Agora article) is created or updated, a process is triggered.
    - The content is sent to the `generate-embeddings` endpoint to create a vector representation.
    - This vector, along with metadata (like the document ID), is sent to the `pinecone-upsert` endpoint to be stored in the Pinecone index.

2.  **Searching (User-facing)**:
    - A user types a query into the `SearchBar`.
    - The query is sent to the `pinecone-query` API route.
    - The API converts the query text into a vector and uses it to search the Pinecone index for the most similar vectors.
    - Pinecone returns a list of document IDs that are the closest matches.
    - The application then fetches the full data for these documents from Firestore and displays them in `SearchResults`.

### Architecture
This feature represents a Retrieval-Augmented Generation (RAG) pattern.
1.  **Data Source**: Firestore holds the original content (e.g., `caseBriefs`).
2.  **Embedding Service**: An AI model (e.g., OpenAI's `text-embedding-ada-002`) creates vectors.
3.  **Vector Database**: Pinecone stores these vectors for efficient similarity search.
4.  **Application Backend**: The API routes orchestrate the flow between Firestore, the embedding model, and Pinecone.

---

This concludes the feature documentation. 