# Development Workflow - AI Storybook Generator

## Getting Started

### Prerequisites
- Node.js 18+ and npm 9+
- Shopify CLI 3.0+
- PostgreSQL 14+ or SQLite
- Redis (for queue management)
- Git

### Initial Setup
```bash
# Clone repository
git clone https://github.com/your-org/kaka.git
cd kaka

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your credentials

# Initialize database
npx prisma generate
npx prisma migrate dev

# Create Shopify app
npm run shopify app generate

# Start development server
npm run dev
```

### Environment Configuration
```env
# .env.development
NODE_ENV=development
PORT=3000

# Shopify
SHOPIFY_APP_URL=https://your-tunnel.ngrok.io
SHOPIFY_API_KEY=your_api_key
SHOPIFY_API_SECRET=your_api_secret
SCOPES=write_products,read_customers

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/storybook_dev

# Redis
REDIS_URL=redis://localhost:6379

# AI Services
OPENAI_API_KEY=sk-...
GOOGLE_AI_API_KEY=...
ELEVENLABS_API_KEY=...

# Storage
AWS_S3_BUCKET=storybook-dev
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...

# Feature Flags
ENABLE_AUDIO_GENERATION=true
ENABLE_PDF_GENERATION=true
DEBUG_AI_PROMPTS=true
```

## Development Commands

```bash
# Start development server with hot reload
npm run dev

# Run database migrations
npm run db:migrate

# Generate Prisma client
npm run db:generate

# Seed database with test data
npm run db:seed

# Run tests
npm test                 # All tests
npm run test:unit       # Unit tests only
npm run test:integration # Integration tests
npm run test:e2e        # End-to-end tests

# Linting and formatting
npm run lint            # Run ESLint
npm run lint:fix        # Fix linting issues
npm run format          # Format with Prettier

# Type checking
npm run typecheck       # Run TypeScript compiler

# Build for production
npm run build
```

## Git Workflow

### Branch Naming Convention
- `feature/story-generation-upgrade`
- `fix/audio-playback-issue`
- `chore/update-dependencies`
- `docs/api-documentation`

### Commit Message Format
```
type(scope): subject

body

footer
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Test updates
- `chore`: Maintenance tasks

**Example:**
```
feat(story): add multi-language support

- Added language selector component
- Integrated Google Translate API
- Updated story schema for language field

Closes #123
```

### Pull Request Process
1. Create feature branch from `develop`
2. Make changes and commit
3. Push branch and create PR
4. Ensure all checks pass
5. Request code review
6. Merge after approval

## Code Style Guide

### TypeScript/JavaScript
```typescript
// Use explicit types for function parameters and return values
export async function generateStory(
  params: StoryParams
): Promise<Story> {
  // Implementation
}

// Use interface for object types
interface StoryParams {
  title: string;
  genre: StoryGenre;
  characters: Character[];
}

// Use const assertions for constants
const STORY_STATUSES = ['draft', 'generating', 'complete'] as const;

// Prefer async/await over promises
// Good
const story = await generateStory(params);

// Avoid
generateStory(params).then(story => {});
```

### React Components
```typescript
// Use function components with TypeScript
interface StoryCardProps {
  story: Story;
  onClick?: (storyId: string) => void;
}

export function StoryCard({ story, onClick }: StoryCardProps) {
  return (
    <div 
      className="story-card"
      onClick={() => onClick?.(story.id)}
    >
      {/* Component content */}
    </div>
  );
}

// Use custom hooks for logic
export function useStoryData(storyId: string) {
  const [story, setStory] = useState<Story>();
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Fetch logic
  }, [storyId]);
  
  return { story, loading };
}
```

### File Organization
```
app/
├── components/           # Reusable UI components
│   ├── story/
│   ├── forms/
│   └── ui/
├── routes/              # Remix routes
│   ├── api/
│   └── stories/
├── services/            # Business logic
│   ├── ai/
│   ├── shopify/
│   └── storage/
├── hooks/               # Custom React hooks
├── utils/               # Utility functions
├── types/               # TypeScript types
└── styles/              # CSS files
```

## Testing Guidelines

### Unit Testing
```typescript
// app/services/__tests__/story-generation.test.ts
import { generateStoryContent } from '../story-generation.server';

describe('generateStoryContent', () => {
  it('generates story with correct structure', async () => {
    const params = {
      title: 'Test Story',
      genre: 'adventure',
      // ... other params
    };
    
    const story = await generateStoryContent(params);
    
    expect(story).toHaveProperty('chapters');
    expect(story.chapters).toHaveLength(5);
    expect(story.chapters[0]).toHaveProperty('content');
  });
});
```

### Integration Testing
```typescript
// tests/integration/story-creation.test.ts
import { createStoryTest } from '../helpers';

describe('Story Creation Flow', () => {
  it('creates story from form submission', async () => {
    const { request, session } = createAuthenticatedRequest();
    
    const response = await storyAction({
      request,
      params: {},
      context: { session }
    });
    
    expect(response.status).toBe(302);
    expect(response.headers.get('Location')).toMatch(/\/stories\/.+/);
  });
});
```

### E2E Testing
```typescript
// tests/e2e/story-purchase.spec.ts
import { test, expect } from '@playwright/test';

test('customer can purchase generated story', async ({ page }) => {
  // Navigate to story creation
  await page.goto('/stories/new');
  
  // Fill form
  await page.fill('[name="title"]', 'My Test Story');
  await page.selectOption('[name="genre"]', 'adventure');
  
  // Submit and wait for generation
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/stories\/.+/);
  
  // Verify story generated
  await expect(page.locator('.story-viewer')).toBeVisible();
  
  // Purchase story
  await page.click('button:has-text("Purchase Story")');
  // ... continue with checkout flow
});
```

## Debugging

### Debug Configuration
```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Remix",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "dev"],
      "skipFiles": ["<node_internals>/**"],
      "env": {
        "DEBUG": "app:*"
      }
    }
  ]
}
```

### Logging
```typescript
// app/utils/logger.server.ts
import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// Usage
logger.info('Story generation started', { 
  storyId, 
  userId: session.customerId 
});
```

### Performance Monitoring
```typescript
// app/utils/performance.server.ts
export function measurePerformance(name: string) {
  const start = performance.now();
  
  return {
    end: () => {
      const duration = performance.now() - start;
      logger.info(`Performance: ${name}`, { duration });
      return duration;
    }
  };
}

// Usage
const timer = measurePerformance('story-generation');
const story = await generateStory(params);
timer.end();
```

## Deployment

### Pre-deployment Checklist
- [ ] All tests passing
- [ ] Environment variables configured
- [ ] Database migrations ready
- [ ] Assets optimized
- [ ] Security scan completed
- [ ] Performance tested
- [ ] Error tracking configured
- [ ] Backup plan ready

### Deployment Steps
```bash
# Build application
npm run build

# Run database migrations
npm run db:migrate:deploy

# Deploy to Shopify
npm run deploy

# Verify deployment
npm run deploy:verify
```

### Monitoring
- Set up error tracking (Sentry)
- Configure performance monitoring
- Set up alerts for critical errors
- Monitor API usage and costs
- Track user analytics

## Troubleshooting

### Common Issues

**Story Generation Fails**
```typescript
// Check AI service status
const healthCheck = await checkAIServices();
console.log('AI Services Status:', healthCheck);

// Verify API keys
console.log('OpenAI Key:', process.env.OPENAI_API_KEY?.slice(0, 10) + '...');

// Check rate limits
const limits = await getRateLimitStatus();
console.log('Rate Limits:', limits);
```

**Database Connection Issues**
```bash
# Test database connection
npx prisma db pull

# Reset database (development only)
npx prisma migrate reset

# Check connection string
echo $DATABASE_URL
```

**Shopify API Errors**
```typescript
// Enable debug mode
const { admin } = await authenticate.admin(request);
admin.enableDebugMode();

// Log GraphQL queries
console.log(admin.getLastQuery());
```

## Resources

- [Remix Documentation](https://remix.run/docs)
- [Shopify App Development](https://shopify.dev/apps)
- [Prisma Documentation](https://www.prisma.io/docs)
- [OpenAI API Reference](https://platform.openai.com/docs)
- [Google AI Documentation](https://ai.google.dev/)
- Internal Wiki: `https://wiki.company.com/storybook`
- Team Slack: `#storybook-dev`