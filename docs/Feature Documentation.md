# Lex Briefs AI - Feature Documentation

This document provides a comprehensive overview of the main features of the Lex Briefs AI application.

## Table of Contents
1. [Core Features Overview](#-core-features-overview)
2. [User Authentication](#-feature-1-user-authentication)
3. [Case Brief Management](#-feature-2-case-brief-management)
4. [User Library & Collections](#-feature-3-user-library--collections)
5. [Agora: Collaborative Legal Commentary](#-feature-4-agora-collaborative-legal-commentary)
6. [Compose: AI-Powered Email Suite](#-feature-5-compose-ai-powered-email-suite)
7. [Payments & Subscriptions](#-feature-6-payments--subscriptions)
8. [Blogging Platform](#-feature-7-blogging-platform)
9. [Semantic Search (Pinecone)](#-feature-8-semantic-search-pinecone)
10. [Data Management & Architecture](#-data-management--architecture)

---

## 📋 Core Features Overview

Lex Briefs AI is a multi-faceted platform designed to assist legal professionals and students. Key functionalities include:

- **AI-Powered Case Analysis**: Quickly generate and analyze case briefs.
- **Collaborative Research**: Work with others in a shared research space (Agora).
- **Personalized Library**: Organize and manage your own collection of legal documents.
- **AI-Powered Email Drafting**: Generate professional, context-aware email drafts (Compose).
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
The Library is the central hub for legal research and knowledge management, providing users with access to a vast repository of community-contributed case briefs and a personalized space to organize their own collections.

### Core Components
-   `src/pages/Library.tsx`: The main public-facing library where users can browse, search, and discover community-shared case briefs.
-   `src/pages/MyLibrary.tsx`: A private, personalized space where users can manage their saved briefs, drafts, and collections.
-   `src/components/BriefCard.tsx`: A reusable component that displays a concise summary of a case brief, with actions to save, view, or cite.
-   `src/components/CreateCollectionModal.tsx`: A modal that allows users to create new collections to organize their saved briefs.
-   `src/components/BookmarkCollectionDialog.tsx`: A dialog that facilitates saving a brief to one or more collections.
-   `src/components/CollectionDetail.tsx`: A view that displays the contents of a specific collection.

### Use Cases & Potential
-   **For Students**:
    -   **Efficient Study Prep**: Quickly find and save relevant case briefs for classes, outlines, and exam preparation.
    -   **Concept Exploration**: Use the semantic search to explore legal concepts and find related cases, enhancing understanding beyond simple keyword matching.
    -   **Personalized Organization**: Create collections for different courses (e.g., "Torts," "Contracts") to keep research organized and easily accessible.
-   **For Legal Professionals**:
    -   **Rapid Research**: Leverage the community library to quickly get up to speed on unfamiliar areas of law or find foundational cases.
    -   **Case Management**: Organize briefs into collections based on specific cases, clients, or legal matters for efficient retrieval.
    -   **Knowledge Discovery**: Use the powerful search and filtering capabilities to uncover connections and precedents that might otherwise be missed.

---

## 🏛️ Feature 4: Agora: Collaborative Legal Commentary

### Purpose
Agora is a dynamic, collaborative platform designed for the legal community to publish, discuss, and refine legal commentary and analysis. It serves as a "Substack for law," enabling users to share their expertise, build a following, and engage in meaningful legal discourse.

### Core Components
-   `src/pages/Agora.tsx`: The main entry point that routes to all Agora-related views.
-   `src/components/agora/AgoraBrowse.tsx`: A discovery hub where users can browse, search, and filter articles by topic, author, or popularity.
-   `src/components/agora/AgoraEditor.tsx`: A powerful rich Markdown editor that allows authors to create, edit, and format their articles with features like premium content paywalls, tags, and source citations.
-   `src/components/agora/AgoraArticleReader.tsx`: An optimized, clean reading interface that provides a premium experience for consuming content, with features for sharing and engagement.
-   `src/components/agora/AgoraDashboard.tsx`: A personalized dashboard for authors to manage their published articles and drafts, view performance analytics, and track their earnings.
-   `src/components/agora/AgoraUserProfile.tsx`: Public-facing profiles for authors to showcase their work, build a following, and establish their reputation within the community.

### Use Cases & Potential
-   **For Authors (Legal Professionals, Academics, Students)**:
    -   **Publishing Platform**: Share in-depth legal analysis, commentary on recent rulings, or practical guides for other legal professionals.
    -   **Monetization**: Place valuable content behind a premium paywall, generating revenue from subscribers who value their expertise.
    -   **Reputation Building**: Establish themselves as thought leaders in their area of practice by consistently publishing high-quality content.
-   **For Readers (The Legal Community)**:
    -   **Knowledge Hub**: Access a curated feed of legal commentary and analysis from a diverse range of authors.
    -   **Stay Current**: Keep up with the latest legal trends, discussions, and case analyses from experts in the field.
    -   **Community Engagement**: Follow favorite authors, engage in discussions, and become part of a vibrant legal community.

---

## ✉️ Feature 5: Compose: AI-Powered Email Suite

### Purpose
Compose is an intelligent email-drafting assistant designed to enhance productivity and professionalism. It leverages AI to generate well-written, context-aware email drafts, complete with customizable preferences and privacy controls.

### Core Components
-   `src/pages/EmailSuite.tsx`: The main interface for the Email Suite, providing access to all composition and settings tabs.
-   `src/components/email-suite/ComposeTab.tsx`: The primary workspace where users provide context and instructions to generate new email drafts.
-   `src/components/email-suite/PreferencesTab.tsx`: A settings panel where users can define their default email tone (e.g., formal, friendly), desired length, and professional signature.
-   `src/components/email-suite/PrivacyTab.tsx`: An advanced settings panel that allows users to enable privacy-preserving features, such as removing identifying metadata or ensuring attorney-client privilege is maintained.
-   `src/components/email-suite/GeneratedDraftsList.tsx`: A history panel that displays previously generated drafts for easy access and reuse.

### Use Cases & Potential
-   **For Busy Professionals**:
    -   **Efficiency Boost**: Drastically reduce the time spent on routine email correspondence, such as follow-ups, meeting requests, and client updates.
    -   **Enhanced Professionalism**: Maintain a consistent and professional tone across all communications, with customizable signatures and formatting.
    -   **Complex Communications**: Quickly generate first drafts for more complex communications, such as legal notices or client advisories, which can then be refined.
-   **For Privacy-Conscious Users**:
    -   **Secure Communications**: Enable Privacy Mode to automatically strip identifying metadata and use neutral language, reducing digital footprint.
    -   **Attorney-Client Privilege**: Activate specific settings to ensure communications are framed with attorney-client privilege in mind, adding a layer of security to sensitive correspondence.
    -   **Controlled Information Flow**: Avoid unintentionally sharing location-specific details or other contextual information that could compromise privacy.

---

## 💳 Feature 6: Payments & Subscriptions

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

## ✍️ Feature 7: Blogging Platform

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

## 🔎 Feature 8: Semantic Search (Pinecone)

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

## 📊 Feature 9: Data Management & Architecture

This concludes the feature documentation. 