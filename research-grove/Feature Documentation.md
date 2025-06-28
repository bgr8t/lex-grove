# Research Grove - Feature Documentation

## 📋 Core Features Overview

Research Grove provides four main feature domains:

1. **Mandate Management** - Create, edit, and organize legal research mandates
2. **Research Tools** - Add and manage research sources within mandates  
3. **Dashboard Analytics** - Monitor mandate statistics and priorities
4. **Search & Discovery** - Find and filter mandates across multiple criteria

---

## 🎯 Feature 1: Mandate Management

### Purpose
Enables legal professionals to create, organize, and manage legal research mandates with detailed specifications and tracking capabilities.

### Core Components
- **MandateForm.tsx**: Create/edit mandate modal with validation
- **MandateCard.tsx**: Display mandate information and actions
- **DeleteConfirmModal.tsx**: Safe deletion with confirmation

### Data Model
```typescript
interface Mandate {
  id: string;                    // UUID v4
  title: string;                 // User-defined mandate name
  clientName: string;            // Client organization/person
  legalArea: string;             // From predefined list
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  researchObjective: string;     // Detailed description
  deadline: string;              // ISO 8601 date string
  assignedLawyer: string;        // Optional lawyer name
  createdAt: string;             // ISO 8601 timestamp
  updatedAt: string;             // ISO 8601 timestamp
}
```

### Business Logic

#### Create Mandate Flow
```typescript
const handleSubmit = (formData) => {
  // 1. Validate required fields
  if (!isValid(formData)) return showError();
  
  // 2. Create mandate with UUID
  const mandate = {
    id: crypto.randomUUID(),
    ...formData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  // 3. Persist to storage
  storageUtils.addMandate(mandate);
  
  // 4. Update UI and show success
  refreshUI();
  showSuccess();
};
```

#### Validation Rules
- **Title**: Required, minimum 1 character
- **Client Name**: Required, minimum 1 character  
- **Legal Area**: Required, from predefined list
- **Priority**: Required, enum validation
- **Research Objective**: Required, minimum 1 character
- **Deadline**: Required, valid future date

### Predefined Legal Areas
```typescript
const LEGAL_AREAS = [
  'Contract Law', 'Corporate Law', 'Employment Law',
  'Intellectual Property', 'Litigation', 'Real Estate Law',
  'Tax Law', 'Family Law', 'Criminal Law', 'Environmental Law'
];
```

---

## 🔍 Feature 2: Research Tools

### Purpose
Comprehensive research environment for collecting, organizing, and formatting legal research sources within specific mandates.

### Architecture
Three-panel layout for optimal workflow:
- **Left Panel**: Source entry form
- **Middle Panel**: Source list management
- **Right Panel**: Markdown preview generation

### Data Model
```typescript
interface Source {
  id: string;           // UUID v4
  mandateId: string;    // Foreign key to mandate
  quote: string;        // Key excerpt or text
  fullSource: string;   // Complete citation
  note: string;         // Personal analysis/context
  createdAt: string;    // ISO 8601 timestamp
}
```

### Core Operations

#### Add Source
```typescript
const handleAddSource = () => {
  // 1. Validate minimum data
  if (!newSource.quote.trim()) return showError();
  
  // 2. Create source object
  const source = {
    id: crypto.randomUUID(),
    mandateId,
    ...newSource,
    createdAt: new Date().toISOString()
  };
  
  // 3. Persist and update UI
  storageUtils.addSource(source);
  refreshSources();
  clearForm();
};
```

#### Markdown Generation
```typescript
const generateMarkdownPreview = () => {
  let markdown = `# ${mandate.title}\n\n`;
  markdown += `**Client:** ${mandate.clientName}\n`;
  markdown += `**Legal Area:** ${mandate.legalArea}\n\n`;
  markdown += `## Research Objective\n\n${mandate.researchObjective}\n\n`;
  markdown += `## Sources and Analysis\n\n`;

  sources.forEach((source, index) => {
    markdown += `### Source ${index + 1}\n\n`;
    if (source.quote) markdown += `> "${source.quote}"\n\n`;
    if (source.fullSource) markdown += `**Source:** ${source.fullSource}\n\n`;
    if (source.note) markdown += `**Analysis:** ${source.note}\n\n`;
    markdown += `---\n\n`;
  });

  return markdown;
};
```

---

## 📊 Feature 3: Dashboard Analytics

### Purpose
At-a-glance insights into mandate workload, priorities, and deadlines for portfolio management.

### Metrics Calculation
```typescript
const stats = {
  total: mandates.length,
  urgent: mandates.filter(m => m.priority === 'Urgent').length,
  thisWeek: mandates.filter(m => {
    const deadline = new Date(m.deadline);
    const oneWeek = new Date();
    oneWeek.setDate(oneWeek.getDate() + 7);
    return deadline <= oneWeek;
  }).length
};
```

### Visual Components
- **Total Mandates**: Blue card with FileText icon
- **Urgent Priority**: Red card with Users icon  
- **Due This Week**: Orange card with Clock icon

### Future Analytics
- Completion rates and trends
- Workload distribution by lawyer
- Legal area breakdown
- Timeline visualizations

---

## 🔍 Feature 4: Search & Discovery

### Purpose
Quick mandate finding and filtering across multiple criteria for efficient case management.

### Search Implementation
```typescript
const filteredMandates = mandates.filter(mandate =>
  mandate.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
  mandate.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
  mandate.legalArea.toLowerCase().includes(searchTerm.toLowerCase()) ||
  mandate.assignedLawyer.toLowerCase().includes(searchTerm.toLowerCase())
);
```

### Search Features
- **Real-time filtering**: Updates as user types
- **Multi-field search**: Searches title, client, legal area, lawyer
- **Case insensitive**: Ignores capitalization
- **Partial matching**: Substring matching

### Future Enhancements
- Advanced filters (priority, date ranges)
- Fuzzy search with typo tolerance
- Saved searches and search history
- Sort options (date, priority, alphabetical)

---

## 🔄 Data Management Logic

### Storage Layer Architecture
```typescript
// storage.ts - Abstraction over data persistence
export const storageUtils = {
  // Mandate CRUD operations
  getMandates: (): Mandate[] => { /* ... */ },
  addMandate: (mandate: Mandate): void => { /* ... */ },
  updateMandate: (id: string, updates: Partial<Mandate>): void => { /* ... */ },
  deleteMandate: (id: string): void => { /* ... */ },
  
  // Source CRUD operations
  getSources: (): Source[] => { /* ... */ },
  getSourcesByMandateId: (mandateId: string): Source[] => { /* ... */ },
  addSource: (source: Source): void => { /* ... */ },
  deleteSource: (id: string): void => { /* ... */ }
};
```

### Current Implementation
- **Session Storage**: Browser session storage for data persistence
- **JSON Serialization**: All data stored as JSON strings
- **Automatic Cleanup**: Sources deleted when mandate is deleted

### Future Implementation Plans
- **REST API**: Backend integration with proper database
- **Optimistic Updates**: UI updates before server confirmation
- **Conflict Resolution**: Handle concurrent edit scenarios
- **Offline Support**: Service worker for offline functionality

---

## 🚀 Future Feature Roadmap

### Phase 1: Enhanced Functionality (3 months)
- **Export Features**: PDF and Word document generation
- **Advanced Search**: Filters, sorting, saved searches
- **Bulk Operations**: Multi-select mandate actions
- **Keyboard Navigation**: Power user shortcuts

### Phase 2: Collaboration (6 months)
- **Multi-user Support**: Team collaboration features
- **Permission System**: Role-based access control
- **Real-time Updates**: Live collaboration on research
- **Comment System**: Source annotations and discussions

### Phase 3: Integration & AI (12 months)
- **Legal Database Integration**: Westlaw, LexisNexis connectivity
- **AI Research Assistant**: Automated source suggestions
- **Natural Language Search**: Semantic search capabilities
- **Smart Templates**: AI-generated research outlines

### Phase 4: Enterprise Features (18+ months)
- **Enterprise SSO**: SAML/OAuth integration
- **Audit Logging**: Comprehensive activity tracking
- **Advanced Analytics**: Predictive insights and reporting
- **Mobile Applications**: Native iOS and Android apps

---

This feature documentation provides comprehensive coverage of Research Grove's current capabilities and future development direction. 