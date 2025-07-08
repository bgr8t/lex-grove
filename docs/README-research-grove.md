# Research Grove 🌳⚖️

A modern legal research management application designed to help legal professionals organize, manage, and streamline their research mandates with efficiency and elegance.

## 🎯 Overview

Research Grove is a comprehensive legal research management tool that enables legal professionals to:

- **Create and manage legal research mandates** with detailed specifications
- **Organize research sources** with quotes, citations, and personal notes
- **Track progress and deadlines** across multiple cases
- **Generate formatted research documents** in markdown format
- **Search and filter** mandates by various criteria
- **Monitor statistics** and priorities at a glance

## ✨ Features

### 📋 Mandate Management
- Create detailed research mandates with client information, legal areas, and objectives
- Set priorities (Low, Medium, High, Urgent) and deadlines
- Assign lawyers to specific mandates
- Edit and delete existing mandates
- Advanced search and filtering capabilities

### 🔍 Research Tools
- Add research sources with quotes, full citations, and personal notes
- Organize sources within each mandate
- Generate formatted markdown previews of research documents
- Delete and manage individual sources

### 📊 Dashboard & Analytics
- Overview statistics showing total mandates, urgent priorities, and upcoming deadlines
- Visual cards displaying key metrics
- Quick access to create new mandates
- Search across all mandate data

### 🎨 Modern UI/UX
- Clean, professional neumorphic design
- Responsive layout optimized for desktop and mobile
- Smooth animations and transitions
- Intuitive navigation and user interactions
- Accessibility-focused design

## 🛠️ Tech Stack

### Frontend Framework
- **React 18** - Modern React with hooks and functional components
- **TypeScript** - Type-safe development with full IntelliSense support
- **Vite** - Fast build tool and development server

### UI & Styling  
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - High-quality, accessible UI components built on Radix UI
- **Lucide React** - Beautiful, customizable icons
- **CSS Custom Properties** - Dynamic theming support

### State Management & Data
- **TanStack Query** - Powerful data fetching and caching
- **React Hook Form** - Performant form handling with validation
- **Zod** - TypeScript-first schema validation
- **Local Storage** - Client-side data persistence

### Routing & Navigation
- **React Router v6** - Declarative routing for React applications

### Development Tools
- **ESLint** - Code linting and quality enforcement
- **TypeScript ESLint** - TypeScript-specific linting rules
- **PostCSS** - CSS processing and optimization

## 🚀 Getting Started

### Prerequisites

- **Node.js** (version 18 or higher)
- **npm** or **yarn** package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd research-grove
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. **Open your browser** and navigate to `http://localhost:5173`

### Build for Production

```bash
npm run build
# or
yarn build
```

The built files will be available in the `dist` directory.

### Preview Production Build

```bash
npm run preview
# or
yarn preview
```

## 📁 Project Structure

```
research-grove/
├── public/                 # Static assets
│   ├── favicon.ico
│   ├── placeholder.svg
│   └── robots.txt
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── ui/            # shadcn/ui components
│   │   ├── DeleteConfirmModal.tsx
│   │   ├── MandateCard.tsx
│   │   ├── MandateForm.tsx
│   │   └── ResearchTool.tsx
│   ├── hooks/             # Custom React hooks
│   │   ├── use-mobile.tsx
│   │   └── use-toast.ts
│   ├── lib/               # Utility libraries
│   │   └── utils.ts
│   ├── pages/             # Application pages/routes
│   │   ├── Index.tsx      # Main dashboard
│   │   ├── Research.tsx   # Research tool page
│   │   └── NotFound.tsx   # 404 page
│   ├── types/             # TypeScript type definitions
│   │   └── mandate.ts
│   ├── utils/             # Utility functions
│   │   └── storage.ts     # Local storage utilities
│   ├── App.tsx           # Main application component
│   ├── main.tsx          # Application entry point
│   └── index.css         # Global styles
├── components.json        # shadcn/ui configuration
├── tailwind.config.ts     # Tailwind CSS configuration
├── tsconfig.json         # TypeScript configuration
├── vite.config.ts        # Vite configuration
└── package.json          # Project dependencies and scripts
```

## 🔧 Configuration

### Environment Variables
The application currently uses local storage for data persistence. No environment variables are required for basic functionality.

### Tailwind Configuration
The project uses a custom Tailwind configuration with:
- Custom color palette optimized for legal/professional applications
- Extended spacing and typography scales
- Custom component classes for consistent styling

### TypeScript Configuration
Strict TypeScript configuration with:
- Path mapping for clean imports (`@/` prefix)
- Strict type checking enabled
- Modern ES modules support

## 📱 Usage Guide

### Creating a New Mandate

1. Click the "Create New Mandate" button on the dashboard
2. Fill in the mandate details:
   - **Title**: Descriptive name for the research mandate
   - **Client Name**: Name of the client or organization
   - **Legal Area**: Area of law (e.g., Corporate, Criminal, Family)
   - **Priority**: Set urgency level (Low/Medium/High/Urgent)
   - **Research Objective**: Detailed description of research goals
   - **Deadline**: Target completion date
   - **Assigned Lawyer**: Name of the responsible attorney
3. Click "Create Mandate" to save

### Managing Research Sources

1. Click on a mandate card to enter the research tool
2. In the left panel, add sources by filling in:
   - **Quote**: Relevant excerpt or key text
   - **Full Source**: Complete citation information
   - **Note**: Your analysis or context
3. Click "Add Source" to save
4. View all sources in the middle panel
5. See formatted markdown preview in the right panel

### Searching and Filtering

- Use the search bar to find mandates by:
  - Title
  - Client name
  - Legal area
  - Assigned lawyer
- Results update in real-time as you type

## 🎨 Design System

### Color Palette
- **Primary**: Professional blue tones
- **Secondary**: Complementary grays and whites
- **Accent**: Subtle gradients and shadows
- **Status**: Color-coded priority indicators

### Typography
- **Headers**: Bold, clear hierarchy
- **Body**: Readable, professional fonts
- **Code**: Monospace for technical content

### Components
- **Cards**: Neumorphic design with subtle shadows
- **Buttons**: Consistent styling with hover states
- **Forms**: Clean, accessible input fields
- **Modals**: Centered, responsive dialogs

## 🔒 Data Management

### Local Storage
The application uses browser local storage to persist:
- Mandate data
- Research sources
- User preferences

### Data Schema
```typescript
interface Mandate {
  id: string;
  title: string;
  clientName: string;
  legalArea: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  researchObjective: string;
  deadline: string;
  assignedLawyer: string;
  createdAt: string;
  updatedAt: string;
}

interface Source {
  id: string;
  mandateId: string;
  quote: string;
  fullSource: string;
  note: string;
  createdAt: string;
}
```

## 🧪 Development

### Code Quality
- **ESLint**: Configured with React and TypeScript rules
- **TypeScript**: Strict type checking enabled
- **Code formatting**: Consistent style enforcement

### Component Architecture
- **Functional components** with React hooks
- **TypeScript interfaces** for all props and data
- **Reusable UI components** from shadcn/ui
- **Custom hooks** for shared logic

### State Management
- **React hooks** for local component state
- **TanStack Query** for server state (future backend integration)
- **Local storage utilities** for data persistence

## 🚀 Deployment

### Build Process
```bash
npm run build
```

### Deployment Options
The built application can be deployed to:
- **Vercel** (recommended for React apps)
- **Netlify** (static site hosting)
- **GitHub Pages** (with proper configuration)
- **Traditional web servers** (Apache, Nginx)

### Production Considerations
- Enable gzip compression
- Configure proper cache headers
- Set up HTTPS
- Monitor performance and errors

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

### Code Style
- Follow TypeScript best practices
- Use semantic HTML elements
- Implement responsive design
- Add appropriate ARIA labels
- Write descriptive commit messages

## 📄 License

This project is licensed under the MIT License. See the LICENSE file for details.

## 🆘 Support

For questions, bug reports, or feature requests:
1. Check existing issues in the repository
2. Create a new issue with detailed information
3. Include steps to reproduce any bugs
4. Provide browser and system information

## 🔮 Future Enhancements

- **Backend integration** for multi-user support
- **Real-time collaboration** features
- **Advanced search** with filters and sorting
- **Export capabilities** (PDF, Word documents)
- **Integration** with legal databases
- **Mobile application** for iOS and Android
- **AI-powered** research assistance
- **Team management** and role-based permissions

---

**Research Grove** - Streamlining legal research for the modern legal professional. Built with ❤️ and ⚖️.
