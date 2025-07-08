# Research Grove - Architecture Documentation

## 🏗️ System Architecture Overview

Research Grove follows a modern React single-page application (SPA) architecture with a focus on component modularity, type safety, and maintainable code patterns.

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Research Grove SPA                      │
├─────────────────────────────────────────────────────────────┤
│  Presentation Layer (React Components)                     │
│  ├── Pages (Route Components)                              │
│  ├── UI Components (shadcn/ui)                            │
│  └── Business Components (MandateCard, ResearchTool)      │
├─────────────────────────────────────────────────────────────┤
│  State Management Layer                                     │
│  ├── React Hooks (useState, useEffect)                    │
│  ├── TanStack Query (Future API Integration)              │
│  └── Form State (React Hook Form)                         │
├─────────────────────────────────────────────────────────────┤
│  Business Logic Layer                                       │
│  ├── Storage Utils (CRUD Operations)                      │
│  ├── Data Validation (Zod Schemas)                        │
│  └── Utility Functions                                     │
├─────────────────────────────────────────────────────────────┤
│  Data Persistence Layer                                     │
│  ├── Session Storage (Current Implementation)             │
│  └── Future: REST API + Database                          │
└─────────────────────────────────────────────────────────────┘
```

## 🎯 Core Design Principles

### 1. **Component-Based Architecture**
- **Atomic Design Pattern**: UI components follow atomic design principles
- **Single Responsibility**: Each component has one clear purpose
- **Composition over Inheritance**: Components are composed together rather than extended

### 2. **Type-First Development**
- **TypeScript Everywhere**: All code is written in TypeScript
- **Strict Type Checking**: Enabled for maximum safety
- **Interface-Driven**: Clear contracts between components

### 3. **Declarative State Management**
- **React Hooks**: Primary state management using built-in hooks
- **Unidirectional Data Flow**: Props down, events up pattern
- **Immutable Updates**: State updates follow immutability principles

### 4. **Separation of Concerns**
- **Presentation Components**: Pure UI components
- **Container Components**: Components with business logic
- **Utility Functions**: Reusable business logic
- **Custom Hooks**: Shared stateful logic

## 📁 Directory Structure & Responsibilities

### `/src/components/`
**Purpose**: Reusable UI and business components

```
components/
├── ui/                     # shadcn/ui components (Pure UI)
│   ├── button.tsx         # Button component with variants
│   ├── card.tsx           # Card layout components
│   ├── form.tsx           # Form input components
│   └── ...
├── MandateCard.tsx        # Mandate display component
├── MandateForm.tsx        # Mandate creation/editing
├── ResearchTool.tsx       # Research interface
└── DeleteConfirmModal.tsx # Confirmation dialogs
```

**Architecture Pattern**: 
- **UI Components**: Stateless, purely presentational
- **Business Components**: Container components with business logic
- **Modal Components**: Self-contained dialog components

### `/src/pages/`
**Purpose**: Route-level components representing application views

```
pages/
├── Index.tsx      # Dashboard with mandate management
├── Research.tsx   # Research tool wrapper
└── NotFound.tsx   # 404 error page
```

**Architecture Pattern**:
- **Route Components**: Top-level page containers
- **Data Fetching**: Initialize and manage page-level state
- **Layout Composition**: Compose smaller components into pages

### `/src/types/`
**Purpose**: TypeScript type definitions and interfaces

```
types/
└── mandate.ts     # Core data model interfaces
```

**Type System Architecture**:
- **Domain Models**: Business entity interfaces (Mandate, Source)
- **Component Props**: Component interface definitions
- **API Contracts**: Request/response type definitions (future)

### `/src/utils/`
**Purpose**: Business logic and utility functions

```
utils/
└── storage.ts     # Data persistence abstraction layer
```

**Utility Architecture**:
- **Storage Layer**: Abstraction over data persistence
- **Business Logic**: Domain-specific operations
- **Helper Functions**: Pure utility functions

### `/src/hooks/`
**Purpose**: Custom React hooks for shared stateful logic

```
hooks/
├── use-mobile.tsx  # Responsive design hook
└── use-toast.ts    # Toast notification hook
```

**Hook Architecture**:
- **UI Hooks**: Hooks for UI state and interactions
- **Business Hooks**: Hooks encapsulating business logic
- **Integration Hooks**: Hooks for external service integration

## 🔄 Data Flow Architecture

### State Management Patterns

#### 1. **Local Component State**
```typescript
// Pattern: useState for component-local state
const [mandates, setMandates] = useState<Mandate[]>([]);
const [searchTerm, setSearchTerm] = useState('');
```

#### 2. **Form State Management**
```typescript
// Pattern: React Hook Form for complex forms
const form = useForm<MandateFormData>({
  resolver: zodResolver(mandateSchema),
  defaultValues: mandate || defaultValues
});
```

#### 3. **Persistent State**
```typescript
// Pattern: Storage utilities for data persistence
useEffect(() => {
  const loadedMandates = storageUtils.getMandates();
  setMandates(loadedMandates);
}, []);
```

### Data Flow Diagram

```
User Action → Component Event Handler → Business Logic → Storage Layer → State Update → UI Re-render
     ↑                                                                                        ↓
     ←──────────────────────────── User Feedback (Toast/Navigation) ←────────────────────────
```

## 🧩 Component Communication Patterns

### 1. **Props Down, Events Up**
```typescript
// Parent passes data down via props
<MandateCard 
  mandate={mandate} 
  onEdit={handleEdit}     // Event handlers passed down
  onDelete={handleDelete} 
/>

// Child component calls parent handlers
const handleEditClick = () => onEdit(mandate);
```

### 2. **Context for Global State** (Future Implementation)
```typescript
// Pattern for application-wide state
const MandateContext = createContext<MandateContextType>();
const useMandateContext = () => useContext(MandateContext);
```

### 3. **Custom Hooks for Shared Logic**
```typescript
// Pattern for reusable stateful logic
const useMandateManagement = () => {
  const [mandates, setMandates] = useState<Mandate[]>([]);
  // ... shared logic
  return { mandates, addMandate, updateMandate, deleteMandate };
};
```

## 🎨 UI Architecture & Design System

### Component Hierarchy

```
App
├── QueryClientProvider (TanStack Query)
├── TooltipProvider (Radix UI)
├── BrowserRouter (React Router)
└── Routes
    ├── Index (Dashboard)
    │   ├── Header
    │   ├── StatsCards
    │   ├── SearchBar
    │   ├── MandateGrid
    │   │   └── MandateCard[]
    │   └── MandateForm (Modal)
    └── Research/:mandateId
        └── ResearchTool
            ├── Header
            ├── SourceForm (Left Panel)
            ├── SourceList (Middle Panel)
            └── MarkdownPreview (Right Panel)
```

### Design Token Architecture

```css
/* CSS Custom Properties for Design System */
:root {
  /* Colors */
  --primary: 210 100% 50%;
  --primary-foreground: 0 0% 100%;
  
  /* Spacing */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  
  /* Shadows (Neumorphic) */
  --shadow-neumorphic: 8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.8);
}
```

## 🔌 Integration Architecture

### Current Integration Points

#### 1. **Storage Integration**
```typescript
// Abstraction layer for data persistence
interface StorageAdapter {
  getMandates(): Mandate[];
  saveMandates(mandates: Mandate[]): void;
  addMandate(mandate: Mandate): void;
  updateMandate(id: string, updates: Partial<Mandate>): void;
  deleteMandate(id: string): void;
}
```

#### 2. **Router Integration**
```typescript
// Declarative routing configuration
const router = createBrowserRouter([
  { path: "/", element: <Index /> },
  { path: "/research/:mandateId", element: <Research /> },
  { path: "*", element: <NotFound /> }
]);
```

### Future Integration Architecture

#### 1. **API Layer** (Planned)
```typescript
// RESTful API integration pattern
interface ApiClient {
  mandates: {
    list(): Promise<Mandate[]>;
    create(mandate: CreateMandateRequest): Promise<Mandate>;
    update(id: string, updates: UpdateMandateRequest): Promise<Mandate>;
    delete(id: string): Promise<void>;
  };
  sources: {
    listByMandateId(mandateId: string): Promise<Source[]>;
    create(source: CreateSourceRequest): Promise<Source>;
    delete(id: string): Promise<void>;
  };
}
```

#### 2. **Authentication Layer** (Planned)
```typescript
// Authentication context pattern
interface AuthContext {
  user: User | null;
  login(credentials: LoginCredentials): Promise<void>;
  logout(): Promise<void>;
  isAuthenticated: boolean;
}
```

## 🔍 Error Handling Architecture

### Error Boundary Pattern
```typescript
// Component-level error boundaries
<ErrorBoundary fallback={<ErrorFallback />}>
  <MandateForm />
</ErrorBoundary>
```

### Validation Architecture
```typescript
// Zod schema validation pattern
const mandateSchema = z.object({
  title: z.string().min(1, "Title is required"),
  clientName: z.string().min(1, "Client name is required"),
  // ... other validations
});
```

### Toast Notification Pattern
```typescript
// Consistent user feedback pattern
const { toast } = useToast();

toast({
  title: "Success",
  description: "Mandate created successfully.",
  variant: "default"
});
```

## 📊 Performance Architecture

### Code Splitting Strategy
```typescript
// Route-based code splitting
const Research = lazy(() => import('./pages/Research'));
const Index = lazy(() => import('./pages/Index'));
```

### Memoization Patterns
```typescript
// Expensive computation memoization
const filteredMandates = useMemo(() => 
  mandates.filter(mandate => 
    mandate.title.toLowerCase().includes(searchTerm.toLowerCase())
  ), [mandates, searchTerm]
);
```

### Bundle Optimization
- **Tree Shaking**: Unused code elimination via ES modules
- **Dynamic Imports**: Route-based code splitting
- **Asset Optimization**: Image and SVG optimization

## 🔒 Security Architecture

### Input Validation
- **Client-Side Validation**: Zod schemas for all forms
- **XSS Prevention**: React's built-in XSS protection
- **Type Safety**: TypeScript prevents many runtime errors

### Data Sanitization
```typescript
// Input sanitization pattern
const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};
```

## 🧪 Testing Architecture (Future Implementation)

### Testing Strategy
```typescript
// Component testing pattern
describe('MandateCard', () => {
  it('should display mandate information correctly', () => {
    render(<MandateCard mandate={mockMandate} />);
    expect(screen.getByText(mockMandate.title)).toBeInTheDocument();
  });
});
```

### Integration Testing
```typescript
// Feature testing pattern
describe('Mandate Management Flow', () => {
  it('should create, edit, and delete mandates', async () => {
    // Test complete user workflow
  });
});
```

## 📈 Scalability Considerations

### Component Scalability
- **Atomic Design**: Scalable component hierarchy
- **Composition Pattern**: Flexible component composition
- **Prop Interface Consistency**: Standardized component APIs

### Data Scalability
- **Pagination Ready**: Architecture supports future pagination
- **Search Optimization**: Efficient filtering and search patterns
- **Caching Strategy**: TanStack Query ready for API caching

### Bundle Scalability
- **Code Splitting**: Route and feature-based splitting
- **Tree Shaking**: Unused code elimination
- **Lazy Loading**: Components loaded on demand

---

This architecture documentation provides the foundation for understanding Research Grove's technical design and serves as a guide for future development and maintenance. 