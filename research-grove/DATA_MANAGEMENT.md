# Research Grove - Data Management Documentation

## 🗄️ Data Architecture Overview

Research Grove uses a layered data management approach designed for current simplicity and future scalability.

```
┌─────────────────────────────────────────────────────┐
│                Application Layer                    │
│  React Components, Business Logic                  │
├─────────────────────────────────────────────────────┤
│                Storage Abstraction                 │
│  storageUtils.ts - Unified CRUD Interface         │
├─────────────────────────────────────────────────────┤
│              Current: Session Storage              │
│  Browser API, JSON Serialization                  │
├─────────────────────────────────────────────────────┤
│              Future: REST API Layer                │
│  HTTP Client, Request/Response Handling           │
├─────────────────────────────────────────────────────┤
│              Future: Database Layer                │
│  PostgreSQL, MongoDB, or Similar                  │
└─────────────────────────────────────────────────────┘
```

## 📊 Current Data Models

### Core Entities

#### Mandate Entity
```typescript
interface Mandate {
  // Primary key
  id: string;                    // UUID v4 format
  
  // Core mandate information
  title: string;                 // Mandate display name
  clientName: string;            // Client organization/person
  legalArea: string;             // Practice area category
  priority: Priority;            // Urgency level
  researchObjective: string;     // Detailed research goals
  
  // Assignment and timeline
  deadline: string;              // ISO 8601 date string
  assignedLawyer: string;        // Attorney name (optional)
  
  // Metadata
  createdAt: string;             // ISO 8601 timestamp
  updatedAt: string;             // ISO 8601 timestamp
}

type Priority = 'Low' | 'Medium' | 'High' | 'Urgent';
```

#### Source Entity
```typescript
interface Source {
  // Primary key
  id: string;                    // UUID v4 format
  
  // Foreign key relationship
  mandateId: string;             // References Mandate.id
  
  // Source content
  quote: string;                 // Key excerpt or quote
  fullSource: string;            // Complete citation
  note: string;                  // Personal analysis/context
  
  // Metadata
  createdAt: string;             // ISO 8601 timestamp
}
```

### Entity Relationships

```
Mandate (1) ──────── (*) Source
   │                    │
   │ mandateId          │
   └────────────────────┘

One mandate can have many sources
Each source belongs to exactly one mandate
Cascade delete: Deleting mandate removes all sources
```

## 🔧 Storage Implementation

### Current: Session Storage

#### Storage Keys
```typescript
const MANDATES_KEY = 'legal-research-mandates';
const SOURCES_KEY = 'legal-research-sources';
```

#### Storage Utilities Interface
```typescript
export const storageUtils = {
  // Mandate operations
  getMandates(): Mandate[];
  saveMandates(mandates: Mandate[]): void;
  addMandate(mandate: Mandate): void;
  updateMandate(id: string, updates: Partial<Mandate>): void;
  deleteMandate(id: string): void;

  // Source operations
  getSources(): Source[];
  saveSources(sources: Source[]): void;
  getSourcesByMandateId(mandateId: string): Source[];
  addSource(source: Source): void;
  deleteSource(id: string): void;
};
```

#### Implementation Details

##### Mandate CRUD Operations
```typescript
// Read all mandates
getMandates: (): Mandate[] => {
  const stored = sessionStorage.getItem(MANDATES_KEY);
  return stored ? JSON.parse(stored) : [];
},

// Create new mandate
addMandate: (mandate: Mandate): void => {
  const mandates = storageUtils.getMandates();
  mandates.push(mandate);
  storageUtils.saveMandates(mandates);
},

// Update existing mandate
updateMandate: (id: string, updates: Partial<Mandate>): void => {
  const mandates = storageUtils.getMandates();
  const index = mandates.findIndex(m => m.id === id);
  if (index !== -1) {
    mandates[index] = { 
      ...mandates[index], 
      ...updates, 
      updatedAt: new Date().toISOString() 
    };
    storageUtils.saveMandates(mandates);
  }
},

// Delete mandate and cascade to sources
deleteMandate: (id: string): void => {
  // Remove mandate
  const mandates = storageUtils.getMandates().filter(m => m.id !== id);
  storageUtils.saveMandates(mandates);
  
  // Cascade delete sources
  const sources = storageUtils.getSources().filter(s => s.mandateId !== id);
  storageUtils.saveSources(sources);
}
```

##### Source CRUD Operations
```typescript
// Read sources for specific mandate
getSourcesByMandateId: (mandateId: string): Source[] => {
  return storageUtils.getSources().filter(s => s.mandateId === mandateId);
},

// Create new source
addSource: (source: Source): void => {
  const sources = storageUtils.getSources();
  sources.push(source);
  storageUtils.saveSources(sources);
},

// Delete source
deleteSource: (id: string): void => {
  const sources = storageUtils.getSources().filter(s => s.id !== id);
  storageUtils.saveSources(sources);
}
```

### Data Persistence Strategy

#### Serialization
```typescript
// All data stored as JSON strings
const serializedData = JSON.stringify(dataObject);
sessionStorage.setItem(key, serializedData);

// Deserialization with fallback
const rawData = sessionStorage.getItem(key);
const parsedData = rawData ? JSON.parse(rawData) : defaultValue;
```

#### Session vs Local Storage Trade-offs

**Current Choice: Session Storage**
- ✅ Data cleared when browser/tab closes
- ✅ Prevents data accumulation across sessions
- ✅ Better for demo/prototype environments
- ❌ Data lost when tab refreshes
- ❌ No cross-tab data sharing

**Alternative: Local Storage**
- ✅ Data persists across browser sessions
- ✅ Survives page refreshes and tab closures
- ✅ Cross-tab data sharing
- ❌ Manual cleanup required
- ❌ Potential for data accumulation

## 🔍 Data Access Patterns

### Component Integration

#### Page-Level Data Loading
```typescript
// Dashboard - Load all mandates
useEffect(() => {
  const loadedMandates = storageUtils.getMandates();
  setMandates(loadedMandates);
}, []);

// Research Tool - Load mandate and sources
useEffect(() => {
  if (mandateId) {
    const allMandates = storageUtils.getMandates();
    const foundMandate = allMandates.find(m => m.id === mandateId);
    setMandate(foundMandate);
    setSources(storageUtils.getSourcesByMandateId(mandateId));
  }
}, [mandateId]);
```

#### State Synchronization Pattern
```typescript
// After any mutation, refresh dependent state
const handleMandateSuccess = () => {
  const updatedMandates = storageUtils.getMandates();
  setMandates(updatedMandates);
  // Triggers recalculation of stats, filtered results, etc.
};
```

### Search and Filtering

#### Real-time Search Implementation
```typescript
// Efficient client-side filtering
const filteredMandates = useMemo(() => 
  mandates.filter(mandate =>
    mandate.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mandate.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mandate.legalArea.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mandate.assignedLawyer.toLowerCase().includes(searchTerm.toLowerCase())
  ), [mandates, searchTerm]
);
```

## 🚀 Future Database Architecture

### Planned Migration Path

#### Phase 1: API Layer Introduction
```typescript
// Abstract storage interface
interface StorageAdapter {
  mandates: MandateRepository;
  sources: SourceRepository;
}

// Repository pattern interfaces
interface MandateRepository {
  findAll(): Promise<Mandate[]>;
  findById(id: string): Promise<Mandate | null>;
  create(mandate: CreateMandateRequest): Promise<Mandate>;
  update(id: string, updates: UpdateMandateRequest): Promise<Mandate>;
  delete(id: string): Promise<void>;
}

interface SourceRepository {
  findByMandateId(mandateId: string): Promise<Source[]>;
  create(source: CreateSourceRequest): Promise<Source>;
  delete(id: string): Promise<void>;
}
```

#### Phase 2: REST API Integration
```typescript
// HTTP client implementation
class ApiStorageAdapter implements StorageAdapter {
  private httpClient: HttpClient;
  
  mandates = {
    findAll: () => this.httpClient.get<Mandate[]>('/api/mandates'),
    findById: (id: string) => this.httpClient.get<Mandate>(`/api/mandates/${id}`),
    create: (data: CreateMandateRequest) => 
      this.httpClient.post<Mandate>('/api/mandates', data),
    update: (id: string, data: UpdateMandateRequest) => 
      this.httpClient.patch<Mandate>(`/api/mandates/${id}`, data),
    delete: (id: string) => this.httpClient.delete(`/api/mandates/${id}`)
  };
  
  sources = {
    findByMandateId: (mandateId: string) => 
      this.httpClient.get<Source[]>(`/api/mandates/${mandateId}/sources`),
    create: (data: CreateSourceRequest) => 
      this.httpClient.post<Source>('/api/sources', data),
    delete: (id: string) => this.httpClient.delete(`/api/sources/${id}`)
  };
}
```

### Database Schema Design

#### PostgreSQL Schema (Recommended)
```sql
-- Mandates table
CREATE TABLE mandates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  client_name VARCHAR(255) NOT NULL,
  legal_area VARCHAR(100) NOT NULL,
  priority mandate_priority NOT NULL,
  research_objective TEXT NOT NULL,
  deadline TIMESTAMP WITH TIME ZONE NOT NULL,
  assigned_lawyer VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Custom enum for priority
CREATE TYPE mandate_priority AS ENUM ('Low', 'Medium', 'High', 'Urgent');

-- Sources table with foreign key
CREATE TABLE sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mandate_id UUID NOT NULL REFERENCES mandates(id) ON DELETE CASCADE,
  quote TEXT NOT NULL,
  full_source TEXT,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_mandates_priority ON mandates(priority);
CREATE INDEX idx_mandates_deadline ON mandates(deadline);
CREATE INDEX idx_mandates_legal_area ON mandates(legal_area);
CREATE INDEX idx_sources_mandate_id ON sources(mandate_id);
CREATE INDEX idx_sources_created_at ON sources(created_at);

-- Full-text search indexes
CREATE INDEX idx_mandates_search ON mandates USING gin(
  to_tsvector('english', title || ' ' || client_name || ' ' || research_objective)
);
```

#### MongoDB Schema (Alternative)
```typescript
// Mongoose schemas for MongoDB
const mandateSchema = new Schema({
  _id: { type: String, default: () => uuid() },
  title: { type: String, required: true, maxLength: 255 },
  clientName: { type: String, required: true, maxLength: 255 },
  legalArea: { 
    type: String, 
    required: true, 
    enum: LEGAL_AREAS 
  },
  priority: { 
    type: String, 
    required: true, 
    enum: ['Low', 'Medium', 'High', 'Urgent'] 
  },
  researchObjective: { type: String, required: true },
  deadline: { type: Date, required: true },
  assignedLawyer: { type: String, maxLength: 255 },
}, {
  timestamps: true // Automatic createdAt, updatedAt
});

const sourceSchema = new Schema({
  _id: { type: String, default: () => uuid() },
  mandateId: { 
    type: String, 
    required: true, 
    ref: 'Mandate',
    index: true 
  },
  quote: { type: String, required: true },
  fullSource: { type: String },
  note: { type: String },
}, {
  timestamps: { createdAt: true, updatedAt: false }
});

// Text search indexes
mandateSchema.index({
  title: 'text',
  clientName: 'text',
  researchObjective: 'text'
});
```

## 🔒 Data Security & Validation

### Input Validation
```typescript
// Zod schemas for runtime validation
const mandateSchema = z.object({
  title: z.string().min(1).max(255),
  clientName: z.string().min(1).max(255),
  legalArea: z.enum(LEGAL_AREAS),
  priority: z.enum(['Low', 'Medium', 'High', 'Urgent']),
  researchObjective: z.string().min(1),
  deadline: z.string().datetime(),
  assignedLawyer: z.string().max(255).optional()
});

const sourceSchema = z.object({
  mandateId: z.string().uuid(),
  quote: z.string().min(1),
  fullSource: z.string().optional(),
  note: z.string().optional()
});
```

### Data Sanitization
```typescript
// Input sanitization utilities
const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Basic XSS prevention
    .substring(0, 10000); // Prevent excessive data
};

// Apply sanitization before storage
const sanitizedMandate = {
  ...mandate,
  title: sanitizeInput(mandate.title),
  clientName: sanitizeInput(mandate.clientName),
  researchObjective: sanitizeInput(mandate.researchObjective)
};
```

## 📊 Performance Considerations

### Current Limitations
- **Memory Usage**: All data loaded into memory
- **Search Performance**: O(n) linear search
- **No Pagination**: All records loaded at once
- **No Caching**: Fresh data load on every page visit

### Future Optimizations

#### Server-Side Pagination
```typescript
interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

// API endpoints with pagination
GET /api/mandates?page=1&limit=20&sort=deadline&order=asc
GET /api/mandates/search?q=contract&page=1&limit=20
```

#### Caching Strategy
```typescript
// TanStack Query integration for caching
const useMandates = (page: number = 1) => {
  return useQuery({
    queryKey: ['mandates', page],
    queryFn: () => api.mandates.findAll({ page, limit: 20 }),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Optimistic updates
const useCreateMandate = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.mandates.create,
    onSuccess: (newMandate) => {
      // Update cache immediately
      queryClient.setQueryData(['mandates', 1], (old) => ({
        ...old,
        data: [newMandate, ...old.data]
      }));
    }
  });
};
```

#### Search Optimization
```typescript
// Debounced search with caching
const useSearchMandates = (query: string) => {
  const debouncedQuery = useDebounce(query, 300);
  
  return useQuery({
    queryKey: ['mandates', 'search', debouncedQuery],
    queryFn: () => api.mandates.search(debouncedQuery),
    enabled: debouncedQuery.length >= 2,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};
```

## 🔄 Migration Strategy

### Phase 1: Dual Storage
- Maintain current session storage
- Add API layer with fallback
- Gradual component migration

### Phase 2: API-First
- Primary data from API
- Session storage as backup/cache
- Error handling for offline scenarios

### Phase 3: Full Migration
- Remove session storage dependency
- Implement proper caching
- Add offline-first capabilities

This data management documentation provides the foundation for understanding current storage patterns and planning future database integration. 