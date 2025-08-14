# Lex Grove

A modern platform for law students to access, search, and contribute to a collaborative library of legal case briefs.

## Project Overview

Lex Grove is a comprehensive web application designed to help law students access and contribute to a growing library of case briefs. The platform emphasizes community collaboration and efficient organization of legal resources, making it easier for students to study and share their knowledge.

## Key Features

- **Smart Search**: Find relevant case briefs quickly and efficiently
- **PDF Upload & AI Summarization**: Upload case PDFs and automatically generate IRAC briefs using Gemini AI
- **Community Contribution**: Share insights and build a collaborative knowledge base
- **Personal Collections**: Organize briefs into custom collections for efficient studying
- **Mobile-Responsive Design**: Optimized experience across all devices
- **Bilingual Support**: Full English and French language support
- **User Authentication**: Secure account management

## Technology Stack

This project is built with:

- **Frontend**: React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Firebase (Firestore, Authentication, Cloud Functions)
- **State Management**: React Context
- **Styling**: Tailwind CSS with custom neumorphic design
- **Payment Processing**: Stripe integration

## Getting Started

To run this project locally:

```sh
# Clone the repository
git clone https://github.com/bgr8t/lex-grove.git

# Navigate to the project directory
cd lex-grove

# Install dependencies
npm install

# Set up environment variables (see Environment Setup below)
# Copy .env.example to .env.local and fill in your values

# Start the development server
npm run dev
```

## Environment Setup

The application requires several environment variables to be configured:

### Required Environment Variables

- **Firebase Configuration**: `VITE_FIREBASE_*` variables for authentication and database
- **Stripe Configuration**: `VITE_STRIPE_*` and `STRIPE_SECRET_KEY` for payment processing
- **AI Services**: 
  - `GEMINI_API_KEY`: For PDF summarization with Gemini AI (recommended)
  - `OPENAI_API_KEY`: For document generation and embeddings (fallback)
- **Pinecone**: `PINECONE_*` variables for vector search functionality
- **Session Management**: `SESSION_SECRET` and `MONGO_URL`

### Setting up PDF Summarization

To enable PDF upload and automatic case brief generation:

1. Get a Google AI API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Add it to your environment as `GEMINI_API_KEY=your_api_key_here`
3. Restart your development server

The feature will automatically fallback to OpenAI if Google AI is not configured.

## Brief Structure

Briefs are structured with the following components in both English and French:

### English
- Case Title
- Course
- Tags
- Court
- Facts
- Issue
- Rule
- Analysis
- Conclusion

### French
- Titre du Cours
- Tag
- Cour
- Faits
- Question(s) en litige
- Principe(s)
- Analyse
- Décision

## Court Abbreviations

### English
- Supreme Court of Canada (SCC)
- Court of Appeal (QCCA)
- Superior Court (QCSC)
- Quebec Court (QCQC)

### French
- Cour suprême du Canada (CSC)
- Cour d'appel (QCCA)
- Cour supérieure (QCCS)
- Cour du Québec (QCCQ)

## Contributing

Contributions to improve Lex Grove are welcome. Please feel free to submit pull requests or open issues to discuss potential improvements.

## License

This project is proprietary software.
