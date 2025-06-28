# Research Grove - API Design & Future Roadmap

## 🗂️ Current Storage API

### Storage Interface Design
Research Grove currently uses a unified storage abstraction that can be easily migrated to different backends.

```typescript
// Current storage interface - src/utils/storage.ts
interface StorageAPI {
  // Mandate operations
  getMandates(): Mandate[];
  addMandate(mandate: Mandate): void;
  updateMandate(id: string, updates: Partial<Mandate>): void;
  deleteMandate(id: string): void;
  
  // Source operations  
  getSources(): Source[];
  getSourcesByMandateId(mandateId: string): Source[];
  addSource(source: Source): void;
  deleteSource(id: string): void;
}
```

## 🚀 Future REST API Design

### API Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Client  │    │   API Gateway   │    │    Database     │
│                 │◄──►│                 │◄──►│                 │
│  Research Grove │    │  Express/Fastify │    │ PostgreSQL/Mongo│
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Planned API Endpoints

#### Authentication (Phase 2)
```http
POST   /api/auth/login       # User login
POST   /api/auth/logout      # User logout  
POST   /api/auth/refresh     # Refresh token
GET    /api/auth/profile     # Get user profile
```

#### Mandates API
```http
# CRUD Operations
GET    /api/mandates                    # List all mandates
GET    /api/mandates/:id                # Get specific mandate
POST   /api/mandates                    # Create new mandate
PATCH  /api/mandates/:id                # Update mandate
DELETE /api/mandates/:id                # Delete mandate

# Search and filtering
GET    /api/mandates/search?q=contract  # Search mandates
GET    /api/mandates?priority=Urgent    # Filter by priority
GET    /api/mandates?legalArea=Contract # Filter by legal area
GET    /api/mandates?assignedTo=john    # Filter by lawyer

# Pagination and sorting
GET    /api/mandates?page=1&limit=20&sort=deadline&order=asc
```

#### Sources API
```http
# CRUD Operations
GET    /api/mandates/:mandateId/sources # Get sources for mandate
POST   /api/mandates/:mandateId/sources # Add source to mandate
GET    /api/sources/:id                 # Get specific source
PATCH  /api/sources/:id                 # Update source
DELETE /api/sources/:id                 # Delete source

# Bulk operations
POST   /api/sources/bulk                # Create multiple sources
DELETE /api/sources/bulk               # Delete multiple sources
```

### Request/Response Schemas

#### Create Mandate Request
```typescript
interface CreateMandateRequest {
  title: string;                 // 1-255 characters
  clientName: string;           // 1-255 characters
  legalArea: string;            // From predefined enum
  priority: Priority;           // Low|Medium|High|Urgent
  researchObjective: string;    // Detailed description
  deadline: string;             // ISO 8601 date
  assignedLawyer?: string;      // Optional, 1-255 characters
}

// Response
interface CreateMandateResponse {
  mandate: Mandate;
  message: string;
}
```

#### Search Response
```typescript
interface SearchResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  filters: {
    priority?: Priority[];
    legalArea?: string[];
    assignedLawyer?: string[];
  };
}
```

#### Error Response
```typescript
interface ErrorResponse {
  error: {
    code: string;           // ERROR_CODE
    message: string;        // Human-readable message
    details?: any;          // Additional error context
    timestamp: string;      // ISO 8601 timestamp
  };
}

// Common error codes
enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INTERNAL_ERROR = 'INTERNAL_ERROR'
}
```

## 🏗️ Backend Architecture Plan

### Technology Stack (Proposed)

#### Option 1: Node.js + Express
```typescript
// Express.js with TypeScript
app.use('/api/mandates', mandateRouter);
app.use('/api/sources', sourceRouter);
app.use('/api/auth', authRouter);

// Middleware stack
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(rateLimiter);
app.use(authMiddleware);
```

#### Option 2: Node.js + Fastify
```typescript
// Fastify with TypeScript (better performance)
fastify.register(mandateRoutes, { prefix: '/api/mandates' });
fastify.register(sourceRoutes, { prefix: '/api/sources' });
fastify.register(authRoutes, { prefix: '/api/auth' });
```

#### Option 3: Python + FastAPI
```python
# FastAPI with automatic OpenAPI generation
app.include_router(mandate_router, prefix="/api/mandates")
app.include_router(source_router, prefix="/api/sources")
app.include_router(auth_router, prefix="/api/auth")
```

### Database Design

#### PostgreSQL Schema (Recommended)
```sql
-- Users table (Phase 2)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  role user_role DEFAULT 'lawyer',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced mandates table
CREATE TABLE mandates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  client_name VARCHAR(255) NOT NULL,
  legal_area VARCHAR(100) NOT NULL,
  priority mandate_priority NOT NULL,
  research_objective TEXT NOT NULL,
  deadline TIMESTAMP WITH TIME ZONE NOT NULL,
  assigned_lawyer VARCHAR(255),
  status mandate_status DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance indexes
CREATE INDEX idx_mandates_user_id ON mandates(user_id);
CREATE INDEX idx_mandates_status ON mandates(status);
CREATE INDEX idx_mandates_deadline ON mandates(deadline);
CREATE INDEX idx_mandates_priority ON mandates(priority);

-- Full-text search
CREATE INDEX idx_mandates_fts ON mandates USING gin(
  to_tsvector('english', title || ' ' || client_name || ' ' || research_objective)
);
```

### Authentication & Authorization

#### JWT-based Authentication
```typescript
// JWT payload structure
interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}

// Auth middleware
const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};
```

## 📱 Frontend API Integration

### HTTP Client Setup
```typescript
// API client configuration
class ApiClient {
  private baseURL: string;
  private token: string | null = null;
  
  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }
  
  setAuthToken(token: string) {
    this.token = token;
  }
  
  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
      ...options,
    };
    
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'API request failed');
    }
    
    return response.json();
  }
  
  // Mandate endpoints
  mandates = {
    list: (params?: MandateListParams) => 
      this.request<SearchResponse<Mandate>>(`/api/mandates?${new URLSearchParams(params)}`),
    get: (id: string) => 
      this.request<Mandate>(`/api/mandates/${id}`),
    create: (data: CreateMandateRequest) => 
      this.request<CreateMandateResponse>('/api/mandates', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<Mandate>) => 
      this.request<Mandate>(`/api/mandates/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    delete: (id: string) => 
      this.request<void>(`/api/mandates/${id}`, { method: 'DELETE' }),
  };
}
```

### TanStack Query Integration
```typescript
// Custom hooks for API integration
export const useMandates = (params?: MandateListParams) => {
  return useQuery({
    queryKey: ['mandates', params],
    queryFn: () => apiClient.mandates.list(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useCreateMandate = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: apiClient.mandates.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mandates'] });
    },
  });
};

export const useUpdateMandate = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Mandate> }) =>
      apiClient.mandates.update(id, data),
    onSuccess: (updatedMandate) => {
      queryClient.setQueryData(['mandates', updatedMandate.id], updatedMandate);
      queryClient.invalidateQueries({ queryKey: ['mandates'] });
    },
  });
};
```

## 🗓️ Development Roadmap

### Phase 1: Foundation (Months 1-2)
**Goal**: Basic backend setup and API endpoints

#### Backend Development
- [ ] Set up Node.js/Express server with TypeScript
- [ ] Configure PostgreSQL database
- [ ] Implement basic CRUD endpoints for mandates
- [ ] Add source management endpoints
- [ ] Set up database migrations
- [ ] Add input validation with Joi/Zod
- [ ] Basic error handling and logging

#### Frontend Integration
- [ ] Create API client abstraction layer
- [ ] Replace session storage with HTTP calls
- [ ] Add loading states and error handling
- [ ] Implement optimistic updates with TanStack Query

#### DevOps
- [ ] Set up development and staging environments
- [ ] Configure CI/CD pipeline
- [ ] Add database backup strategy

### Phase 2: Authentication & Multi-user (Months 3-4)
**Goal**: User accounts and secure access

#### Backend Features
- [ ] User registration and authentication
- [ ] JWT token management
- [ ] Password reset functionality
- [ ] Role-based access control
- [ ] User profile management

#### Frontend Features
- [ ] Login/logout UI components
- [ ] Protected routes and auth guards
- [ ] User profile and settings pages
- [ ] Session management and auto-refresh

#### Security
- [ ] Input sanitization and XSS prevention
- [ ] Rate limiting and DDoS protection
- [ ] Security headers and CORS configuration

### Phase 3: Advanced Features (Months 5-6)
**Goal**: Enhanced functionality and collaboration

#### Features
- [ ] Advanced search with full-text indexing
- [ ] Bulk operations for mandates and sources
- [ ] File upload for document attachments
- [ ] Export functionality (PDF, Word)
- [ ] Email notifications and reminders
- [ ] Audit logging and activity tracking

#### Performance
- [ ] Database query optimization
- [ ] Caching layer with Redis
- [ ] CDN setup for static assets
- [ ] API response compression

### Phase 4: Enterprise & Integrations (Months 7-9)
**Goal**: Enterprise features and external integrations

#### Enterprise Features
- [ ] Organization/team management
- [ ] SSO integration (SAML, OAuth)
- [ ] Advanced analytics and reporting
- [ ] Custom branding and white-labeling
- [ ] API rate limiting by tier

#### Integrations
- [ ] Legal database APIs (Westlaw, LexisNexis)
- [ ] Calendar integration (Outlook, Google)
- [ ] Slack/Teams notifications
- [ ] Document management systems

### Phase 5: AI & Mobile (Months 10-12)
**Goal**: AI-powered features and mobile apps

#### AI Features
- [ ] Automated source suggestions
- [ ] Natural language search
- [ ] Research summary generation
- [ ] Deadline and priority prediction
- [ ] Legal document analysis

#### Mobile Applications
- [ ] React Native mobile app
- [ ] Offline-first capabilities
- [ ] Push notifications
- [ ] Mobile-optimized research interface

## 🔧 Technical Migration Strategy

### Database Migration Plan
```typescript
// Migration strategy from session storage
interface MigrationPlan {
  phase1: {
    // Dual-write: Save to both session storage and API
    enableDualWrite: boolean;
    fallbackToSessionStorage: boolean;
  };
  
  phase2: {
    // API-first: Primary source is API, session storage as cache
    primarySource: 'api';
    cacheStrategy: 'session-storage';
  };
  
  phase3: {
    // Full migration: Remove session storage dependency
    primarySource: 'api';
    cacheStrategy: 'tanstack-query';
    offlineSupport: boolean;
  };
}
```

### Data Import/Export
```typescript
// User data migration utilities
interface DataMigration {
  exportSessionData(): ExportedData;
  importToAPI(data: ExportedData): Promise<void>;
  validateDataIntegrity(): Promise<ValidationResult>;
}

interface ExportedData {
  mandates: Mandate[];
  sources: Source[];
  metadata: {
    exportDate: string;
    version: string;
    userAgent: string;
  };
}
```

## 📊 Performance & Monitoring

### Key Performance Indicators
- **API Response Time**: < 200ms for GET requests, < 500ms for POST/PATCH
- **Database Query Time**: < 100ms for simple queries, < 500ms for complex searches
- **Client-side Load Time**: < 2s for initial page load
- **Search Performance**: < 300ms for text search results

### Monitoring Setup
```typescript
// Application monitoring
interface MonitoringStack {
  apm: 'New Relic' | 'DataDog' | 'Sentry';
  logging: 'Winston' | 'Pino';
  metrics: 'Prometheus' | 'CloudWatch';
  alerts: 'PagerDuty' | 'Slack';
}

// Custom metrics
const metrics = {
  mandateCreationRate: 'requests_per_minute',
  searchQueryLatency: 'histogram_milliseconds',
  databaseConnectionPool: 'gauge_connections',
  errorRate: 'percentage_errors'
};
```

## 🔐 Security Considerations

### Data Protection
- **Encryption at Rest**: Database encryption for sensitive data
- **Encryption in Transit**: HTTPS/TLS for all API communication
- **PII Handling**: Secure handling of client information
- **Audit Logging**: Track all data access and modifications

### Compliance
- **GDPR Compliance**: Data privacy and right to deletion
- **SOC 2**: Security controls for enterprise customers
- **ISO 27001**: Information security management
- **Legal Industry Standards**: Bar association requirements

This comprehensive API and roadmap documentation provides the technical foundation for Research Grove's evolution from a prototype to an enterprise-grade legal research platform. 