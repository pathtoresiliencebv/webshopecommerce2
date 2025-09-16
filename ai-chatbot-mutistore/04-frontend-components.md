# Frontend Components Architecture

## Component Hierarchy

### 1. Help Center Components (`/help`)

```
HelpCenter/
├── HelpCenterLayout.tsx          # Main layout with store branding
├── HelpCenterSearch.tsx          # AI-powered search component
├── FAQSection.tsx                # FAQ categories and items
├── ContactSupport.tsx            # Escalation to chat widget
└── HelpArticle.tsx               # Individual article display
```

### 2. Chat Widget System

```
ChatWidget/
├── ChatWidget.tsx                # Main floating widget
├── ChatInterface.tsx             # Chat conversation UI
├── MessageBubble.tsx             # Individual message display
├── ChatInput.tsx                 # Message input with attachments
├── CustomerContext.tsx           # Order/profile display panel
├── AgentHandoff.tsx              # Human agent escalation UI
└── ChatSettings.tsx              # Widget configuration
```

### 3. Agent Dashboard (`/admin/ai-support`)

```
AgentDashboard/
├── ConversationList.tsx          # Multi-store conversation overview
├── ConversationView.tsx          # Active chat interface
├── CustomerSidebar.tsx           # Customer context panel
├── AIAssistant.tsx               # AI suggestions for agents
├── PerformanceMetrics.tsx        # Analytics and KPIs
├── KnowledgeBaseManager.tsx      # Content management
└── EscalationRules.tsx           # Automation configuration
```

## Key Features by Component

### HelpCenter Features
- **Store Branding**: Dynamic theming based on organization settings
- **AI Search**: Semantic search powered by embeddings
- **Smart Suggestions**: Related articles and auto-complete
- **Mobile Responsive**: Touch-friendly navigation and search
- **Contact Integration**: Seamless escalation to chat widget

### ChatWidget Features  
- **Context Awareness**: Auto-load customer profile and order history
- **AI Conversation Flow**: Natural language processing with follow-ups
- **Real-time Updates**: Live order status and tracking information
- **File Attachments**: Support for images and documents
- **Escalation Detection**: Smart handoff to human agents
- **Conversation History**: Persistent chat sessions

### AgentDashboard Features
- **Multi-Store Management**: Switch between different store contexts
- **Real-time Notifications**: New conversations and escalations
- **AI Assistance**: Suggested responses and knowledge base lookup
- **Customer 360**: Complete customer profile with order history
- **Performance Tracking**: Response times, satisfaction scores
- **Bulk Actions**: Assign conversations, update statuses

## State Management Strategy

### Global State (Context/Store)
```typescript
interface ChatbotState {
  // Current session
  activeSession: ChatSession | null;
  conversations: Conversation[];
  
  // Customer context
  currentCustomer: Customer | null;
  customerOrders: Order[];
  
  // Agent state
  agentMode: boolean;
  availableAgents: Agent[];
  
  // Configuration
  organizationSettings: OrganizationSettings;
  knowledgeBase: KnowledgeItem[];
}
```

### Component-Level State
- Form inputs and validation
- UI interactions (modals, dropdowns)
- Loading states and error handling
- Local search and filtering

## Styling and Theming

### Design System Integration
- Use semantic tokens from `index.css` and `tailwind.config.ts`
- Store-specific color schemes and branding
- Consistent spacing and typography
- Dark/light mode support

### Component Styling Strategy
```typescript
// Store-specific theming
const getStoreTheme = (organization: Organization) => ({
  primary: organization.brandColor || 'hsl(var(--primary))',
  logo: organization.logoUrl,
  fontFamily: organization.fontFamily || 'Inter',
  borderRadius: organization.borderRadius || '0.5rem'
});

// Dynamic CSS custom properties
const applyStoreTheme = (theme: StoreTheme) => {
  document.documentElement.style.setProperty('--store-primary', theme.primary);
  document.documentElement.style.setProperty('--store-radius', theme.borderRadius);
};
```

## Performance Optimization

### Code Splitting
- Lazy load chat widget when needed
- Route-based splitting for help center
- Dynamic imports for admin dashboard components

### Caching Strategy
- Cache knowledge base content locally
- Persist conversation history in localStorage
- Implement service worker for offline support

### Real-time Optimizations
- WebSocket connection pooling
- Message batching for high-frequency updates
- Optimistic UI updates for better perceived performance

## Accessibility (A11y)

### WCAG Compliance
- Keyboard navigation support
- Screen reader compatibility  
- Focus management for modals
- Color contrast validation

### Internationalization (i18n)
- Multi-language support for help content
- RTL language support
- Currency and date formatting per locale
- Automated translation integration for AI responses