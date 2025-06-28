# Research Grove - Development Guide

## 🛠️ Development Environment Setup

### Prerequisites
- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 8.0.0 or higher (or yarn/pnpm equivalent)
- **Git**: Version 2.0.0 or higher
- **VS Code**: Recommended IDE with extensions

### Initial Setup
```bash
# Clone repository
git clone <repository-url>
cd research-grove

# Install dependencies
npm install

# Start development server
npm run dev

# Run in different modes
npm run build              # Production build
npm run build:dev          # Development build
npm run preview            # Preview production build
npm run lint               # Run ESLint
```

### Recommended VS Code Extensions
```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode", 
    "ms-typescript.vscode-typescript-next",
    "formulahendry.auto-rename-tag",
    "ms-vscode.vscode-typescript-next",
    "christian-kohler.path-intellisense"
  ]
}
```

## 📝 Coding Standards

### TypeScript Guidelines

#### Strict Type Safety
```typescript
// ✅ GOOD: Explicit types for interfaces
interface MandateFormProps {
  mandate?: Mandate;
  onSuccess: () => void;
  onCancel: () => void;
}

// ✅ GOOD: Type-safe event handlers  
const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  // ...
};

// ❌ AVOID: Any types
const handleData = (data: any) => { ... };

// ✅ BETTER: Generic types
const handleData = <T>(data: T) => { ... };
```

#### Naming Conventions
```typescript
// Interfaces: PascalCase with descriptive names
interface MandateRepository { }
interface CreateMandateRequest { }

// Types: PascalCase
type Priority = 'Low' | 'Medium' | 'High' | 'Urgent';
type MandateStatus = 'active' | 'completed' | 'archived';

// Variables and functions: camelCase
const mandateList = [];
const handleEditMandate = () => { };

// Constants: SCREAMING_SNAKE_CASE
const LEGAL_AREAS = [...];
const MAX_RETRY_ATTEMPTS = 3;

// Components: PascalCase
const MandateCard = () => { };
const ResearchTool = () => { };
```

### React Component Patterns

#### Functional Components with TypeScript
```typescript
// ✅ GOOD: Explicit prop interface
interface MandateCardProps {
  mandate: Mandate;
  onEdit: (mandate: Mandate) => void;
  onDelete: (mandate: Mandate) => void;
}

export const MandateCard: React.FC<MandateCardProps> = ({ 
  mandate, 
  onEdit, 
  onDelete 
}) => {
  // Component logic
  return (
    // JSX
  );
};
```

#### State Management Patterns
```typescript
// ✅ GOOD: Typed useState
const [mandates, setMandates] = useState<Mandate[]>([]);
const [loading, setLoading] = useState<boolean>(false);
const [error, setError] = useState<string | null>(null);

// ✅ GOOD: State update patterns
const addMandate = (newMandate: Mandate) => {
  setMandates(prev => [...prev, newMandate]);
};

const updateMandate = (id: string, updates: Partial<Mandate>) => {
  setMandates(prev => 
    prev.map(mandate => 
      mandate.id === id 
        ? { ...mandate, ...updates, updatedAt: new Date().toISOString() }
        : mandate
    )
  );
};
```

#### Event Handler Patterns
```typescript
// ✅ GOOD: Descriptive handler names
const handleMandateEdit = (mandate: Mandate) => {
  setEditingMandate(mandate);
  setIsFormOpen(true);
};

const handleFormSubmit = async (formData: MandateFormData) => {
  try {
    setLoading(true);
    await saveMandateData(formData);
    onSuccess();
  } catch (error) {
    setError('Failed to save mandate');
  } finally {
    setLoading(false);
  }
};

// ✅ GOOD: Inline handlers for simple actions
<Button onClick={() => setIsOpen(false)}>
  Cancel
</Button>
```

### Form Handling Standards

#### React Hook Form Integration
```typescript
// ✅ GOOD: Form with validation schema
const form = useForm<MandateFormData>({
  resolver: zodResolver(mandateSchema),
  defaultValues: {
    title: mandate?.title || '',
    clientName: mandate?.clientName || '',
    priority: mandate?.priority || 'Medium'
  }
});

// ✅ GOOD: Form submission with error handling
const onSubmit = async (data: MandateFormData) => {
  try {
    if (mandate) {
      await updateMandate(mandate.id, data);
      toast({ title: "Success", description: "Mandate updated successfully." });
    } else {
      await createMandate(data);
      toast({ title: "Success", description: "Mandate created successfully." });
    }
    onSuccess();
  } catch (error) {
    toast({ 
      title: "Error", 
      description: "Failed to save mandate.", 
      variant: "destructive" 
    });
  }
};
```

## 🎨 UI/UX Development Standards

### Component Composition
```typescript
// ✅ GOOD: Compose smaller components
const MandateCard = ({ mandate, onEdit, onDelete }) => (
  <Card className="legal-card">
    <CardHeader>
      <MandateTitle title={mandate.title} priority={mandate.priority} />
      <MandateClientInfo clientName={mandate.clientName} />
    </CardHeader>
    <CardContent>
      <MandateDetails mandate={mandate} />
      <MandateActions 
        onEdit={() => onEdit(mandate)}
        onDelete={() => onDelete(mandate)}
        onResearch={() => navigate(`/research/${mandate.id}`)}
      />
    </CardContent>
  </Card>
);
```

### Tailwind CSS Best Practices
```typescript
// ✅ GOOD: Semantic class grouping
<div className="
  flex items-center justify-between gap-4
  p-6 
  bg-white rounded-lg shadow-md
  hover:shadow-lg transition-shadow duration-200
">

// ✅ GOOD: Custom component classes in CSS
.legal-card {
  @apply bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300;
}

.legal-button-primary {
  @apply bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium;
  @apply hover:from-blue-700 hover:to-blue-800 transition-all duration-200;
}
```

### Responsive Design Patterns
```typescript
// ✅ GOOD: Mobile-first responsive design
<div className="
  grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6
  p-4 md:p-6 lg:p-8
">
  
// ✅ GOOD: Responsive text and spacing
<h1 className="
  text-2xl md:text-3xl lg:text-4xl font-bold
  mb-4 md:mb-6 lg:mb-8
">
```

## 🔧 Performance Best Practices

### Optimization Patterns
```typescript
// ✅ GOOD: Memoization for expensive calculations
const filteredMandates = useMemo(() => 
  mandates.filter(mandate =>
    mandate.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mandate.clientName.toLowerCase().includes(searchTerm.toLowerCase())
  ), [mandates, searchTerm]
);

// ✅ GOOD: Callback memoization
const handleMandateEdit = useCallback((mandate: Mandate) => {
  setEditingMandate(mandate);
  setIsFormOpen(true);
}, []);

// ✅ GOOD: Component memoization
const MandateCard = React.memo<MandateCardProps>(({ mandate, onEdit, onDelete }) => {
  // Component implementation
});
```

### Code Splitting
```typescript
// ✅ GOOD: Route-based code splitting
const Research = lazy(() => import('./pages/Research'));
const Index = lazy(() => import('./pages/Index'));

// ✅ GOOD: Feature-based code splitting
const MandateForm = lazy(() => import('./components/MandateForm'));
```

## 🧪 Testing Strategy

### Component Testing
```typescript
// Example test structure (future implementation)
describe('MandateCard', () => {
  const mockMandate: Mandate = {
    id: '1',
    title: 'Contract Analysis',
    clientName: 'ACME Corp',
    legalArea: 'Contract Law',
    priority: 'High',
    researchObjective: 'Review contract terms',
    deadline: '2024-02-15T00:00:00.000Z',
    assignedLawyer: 'John Doe',
    createdAt: '2024-01-15T00:00:00.000Z',
    updatedAt: '2024-01-15T00:00:00.000Z'
  };

  it('should display mandate information correctly', () => {
    const onEdit = jest.fn();
    const onDelete = jest.fn();
    
    render(
      <MandateCard 
        mandate={mockMandate} 
        onEdit={onEdit} 
        onDelete={onDelete} 
      />
    );

    expect(screen.getByText('Contract Analysis')).toBeInTheDocument();
    expect(screen.getByText('ACME Corp')).toBeInTheDocument();
    expect(screen.getByText('High')).toBeInTheDocument();
  });

  it('should call onEdit when edit button is clicked', () => {
    const onEdit = jest.fn();
    const onDelete = jest.fn();
    
    render(
      <MandateCard 
        mandate={mockMandate} 
        onEdit={onEdit} 
        onDelete={onDelete} 
      />
    );

    fireEvent.click(screen.getByText('Edit'));
    expect(onEdit).toHaveBeenCalledWith(mockMandate);
  });
});
```

### Integration Testing
```typescript
// Example integration test (future implementation)
describe('Mandate Management Flow', () => {
  it('should create, edit, and delete mandates', async () => {
    render(<App />);

    // Create mandate
    fireEvent.click(screen.getByText('Create New Mandate'));
    
    fireEvent.change(screen.getByLabelText('Mandate Title'), {
      target: { value: 'Test Mandate' }
    });
    
    fireEvent.click(screen.getByText('Create Mandate'));
    
    await waitFor(() => {
      expect(screen.getByText('Test Mandate')).toBeInTheDocument();
    });

    // Edit mandate
    fireEvent.click(screen.getByText('Edit'));
    fireEvent.change(screen.getByDisplayValue('Test Mandate'), {
      target: { value: 'Updated Mandate' }
    });
    fireEvent.click(screen.getByText('Update Mandate'));

    await waitFor(() => {
      expect(screen.getByText('Updated Mandate')).toBeInTheDocument();
    });

    // Delete mandate
    fireEvent.click(screen.getByText('Delete'));
    fireEvent.click(screen.getByText('Confirm Delete'));

    await waitFor(() => {
      expect(screen.queryByText('Updated Mandate')).not.toBeInTheDocument();
    });
  });
});
```

## 🚀 Deployment Guidelines

### Build Process
```bash
# Production build
npm run build

# Verify build output
npm run preview

# Check bundle size
npm run analyze  # (future script)
```

### Environment Configuration
```typescript
// Environment variables pattern (future)
interface AppConfig {
  apiUrl: string;
  environment: 'development' | 'production' | 'staging';
  enableAnalytics: boolean;
}

const config: AppConfig = {
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  environment: import.meta.env.VITE_ENV || 'development',
  enableAnalytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true'
};
```

## 🔄 Git Workflow

### Branch Naming
```bash
# Feature branches
feature/mandate-bulk-operations
feature/advanced-search-filters

# Bug fixes
bugfix/mandate-form-validation
bugfix/search-performance-issue

# Releases
release/v1.2.0

# Hotfixes
hotfix/critical-data-loss-bug
```

### Commit Message Format
```bash
# Format: type(scope): description

feat(mandate): add bulk delete functionality
fix(search): resolve case sensitivity issue
docs(readme): update installation instructions
style(ui): improve button hover states
refactor(storage): extract database abstraction layer
test(mandate): add integration tests for CRUD operations
chore(deps): update React to v18.3.1
```

### Pull Request Guidelines
```markdown
## Description
Brief description of changes and motivation.

## Type of Change
- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed
- [ ] Accessibility testing completed

## Screenshots (if applicable)
Include screenshots for UI changes.

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Code is commented appropriately
- [ ] Documentation updated
- [ ] No new warnings or errors
```

## 🐛 Error Handling Patterns

### Component Error Boundaries
```typescript
// Error boundary component (future implementation)
class MandateErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Mandate component error:', error, errorInfo);
    // Log to error reporting service
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-fallback">
          <h2>Something went wrong with mandate management.</h2>
          <button onClick={() => this.setState({ hasError: false })}>
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### Async Error Handling
```typescript
// ✅ GOOD: Consistent async error handling
const useMandateOperations = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const createMandate = async (mandateData: MandateFormData) => {
    try {
      setLoading(true);
      setError(null);
      
      const mandate = await storageUtils.addMandate(mandateData);
      
      toast({
        title: "Success",
        description: "Mandate created successfully."
      });
      
      return mandate;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      
      toast({
        title: "Error",
        description: "Failed to create mandate. Please try again.",
        variant: "destructive"
      });
      
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { createMandate, loading, error };
};
```

## 📈 Performance Monitoring

### Key Metrics to Track
- **Bundle Size**: Monitor JavaScript bundle growth
- **Load Time**: Time to first contentful paint
- **Interactivity**: Time to interactive
- **Memory Usage**: Monitor for memory leaks
- **Search Performance**: Response time for filtering

### Performance Budgets
```javascript
// Webpack Bundle Analyzer configuration (future)
const bundleAnalyzer = {
  maxAssetSize: 250000,      // 250kb max per asset
  maxEntrypointSize: 500000, // 500kb max entry point
  hints: 'warning'
};
```

This development guide provides comprehensive standards and practices for maintaining Research Grove's code quality and development efficiency. 