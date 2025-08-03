# Troubleshooting Guide - AI Storybook Generator

## Quick Diagnostics

Run this diagnostic script to check system health:

```typescript
// scripts/diagnose.ts
async function runDiagnostics() {
  console.log('🔍 Running System Diagnostics...\n');
  
  // Check environment
  const requiredEnvVars = [
    'DATABASE_URL',
    'SHOPIFY_API_KEY',
    'OPENAI_API_KEY',
    'REDIS_URL'
  ];
  
  console.log('✓ Environment Variables:');
  requiredEnvVars.forEach(envVar => {
    const exists = !!process.env[envVar];
    console.log(`  ${exists ? '✓' : '✗'} ${envVar}`);
  });
  
  // Check database connection
  try {
    await prisma.$connect();
    console.log('✓ Database connection successful');
  } catch (error) {
    console.log('✗ Database connection failed:', error.message);
  }
  
  // Check Redis
  try {
    await redis.ping();
    console.log('✓ Redis connection successful');
  } catch (error) {
    console.log('✗ Redis connection failed:', error.message);
  }
  
  // Check AI services
  try {
    await testAIServices();
    console.log('✓ AI services responding');
  } catch (error) {
    console.log('✗ AI services check failed:', error.message);
  }
}
```

## Common Issues

### 1. Story Generation Failures

#### Issue: "AI service timeout"
```typescript
// Error: Story generation timed out after 120 seconds

// Solution 1: Increase timeout
export const storyQueue = new Queue('story-generation', {
  defaultJobOptions: {
    timeout: 300000, // 5 minutes
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    }
  }
});

// Solution 2: Break into smaller chunks
async function generateStoryInChunks(params: StoryParams) {
  const chunks = [];
  
  for (let i = 0; i < params.chapterCount; i++) {
    const chunk = await generateChapter({
      ...params,
      chapterNumber: i + 1
    });
    chunks.push(chunk);
    
    // Add delay to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  return combineChunks(chunks);
}
```

#### Issue: "Rate limit exceeded"
```typescript
// Error: OpenAI API rate limit exceeded

// Solution: Implement rate limiting
import { RateLimiter } from 'limiter';

const openAILimiter = new RateLimiter({
  tokensPerInterval: 90,
  interval: 'minute'
});

async function callOpenAI(prompt: string) {
  await openAILimiter.removeTokens(1);
  return openai.completions.create({ prompt });
}

// Alternative: Use queue with concurrency control
const aiQueue = new Queue('ai-requests', {
  concurrency: 2 // Process max 2 requests at a time
});
```

### 2. Image Generation Issues

#### Issue: "Image generation failed"
```typescript
// Error: DALL-E API returned error

// Solution: Implement fallback providers
async function generateImage(prompt: string): Promise<string> {
  const providers = [
    { name: 'dalle', fn: generateWithDALLE },
    { name: 'stable-diffusion', fn: generateWithSD },
    { name: 'midjourney', fn: generateWithMidjourney }
  ];
  
  for (const provider of providers) {
    try {
      logger.info(`Trying ${provider.name}...`);
      return await provider.fn(prompt);
    } catch (error) {
      logger.error(`${provider.name} failed:`, error);
      continue;
    }
  }
  
  throw new Error('All image providers failed');
}
```

#### Issue: "Inconsistent character appearance"
```typescript
// Solution: Implement character consistency
interface CharacterReference {
  id: string;
  basePrompt: string;
  styleGuide: string;
  seedImage?: string;
}

async function generateConsistentImage(
  chapter: Chapter,
  characters: CharacterReference[]
) {
  const characterDescriptions = characters.map(char => 
    `${char.name}: ${char.basePrompt}`
  ).join('; ');
  
  const enhancedPrompt = `
    ${chapter.imagePrompt}
    
    Character consistency guide:
    ${characterDescriptions}
    
    Style: ${story.illustrationStyle}
    Maintain consistent appearance across all images.
  `;
  
  return generateImage(enhancedPrompt);
}
```

### 3. Shopify Integration Problems

#### Issue: "Product creation failed"
```typescript
// Error: Shopify API error: Product validation failed

// Solution: Validate before sending
async function validateProductData(story: Story) {
  const errors = [];
  
  if (!story.title || story.title.length > 255) {
    errors.push('Invalid title length');
  }
  
  if (!story.coverImage || !isValidImageUrl(story.coverImage)) {
    errors.push('Invalid cover image');
  }
  
  if (story.description && story.description.length > 5000) {
    errors.push('Description too long');
  }
  
  if (errors.length > 0) {
    throw new ValidationError(errors);
  }
}

// Add retry logic
async function createProductWithRetry(
  admin: AdminApiContext,
  story: Story,
  maxRetries = 3
) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await createStoryProduct(admin, story);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      
      // Wait before retry with exponential backoff
      await new Promise(resolve => 
        setTimeout(resolve, Math.pow(2, i) * 1000)
      );
    }
  }
}
```

#### Issue: "Webhook delivery failures"
```typescript
// Solution: Implement webhook queue
export const webhookQueue = new Queue('webhooks', {
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: false,
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 5000
    }
  }
});

// Verify webhook authenticity
export async function verifyWebhook(request: Request) {
  const hmac = request.headers.get('X-Shopify-Hmac-Sha256');
  const body = await request.text();
  
  const hash = crypto
    .createHmac('sha256', process.env.SHOPIFY_WEBHOOK_SECRET)
    .update(body, 'utf8')
    .digest('base64');
    
  if (hash !== hmac) {
    throw new Error('Invalid webhook signature');
  }
  
  return JSON.parse(body);
}
```

### 4. Database Issues

#### Issue: "Database connection timeout"
```typescript
// Solution: Connection pool optimization
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  // Add connection pool settings
  connectionLimit = 10
  connectTimeout  = 30
}

// Implement connection retry
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      
      if (error.code === 'P2024') { // Prisma timeout error
        await new Promise(resolve => setTimeout(resolve, 1000));
        continue;
      }
      
      throw error;
    }
  }
}

// Usage
const story = await withRetry(() => 
  prisma.story.findUnique({ where: { id } })
);
```

#### Issue: "Migration failures"
```bash
# Error: Database schema drift detected

# Solution 1: Force reset (DEVELOPMENT ONLY)
npx prisma migrate reset

# Solution 2: Create manual migration
npx prisma migrate dev --create-only
# Edit the generated SQL file
npx prisma migrate dev

# Solution 3: Backup and restore
pg_dump $DATABASE_URL > backup.sql
npx prisma db push --force-reset
psql $DATABASE_URL < backup.sql
```

### 5. Performance Issues

#### Issue: "Slow page loads"
```typescript
// Solution: Implement caching
import { LRUCache } from 'lru-cache';

const storyCache = new LRUCache<string, Story>({
  max: 500,
  ttl: 1000 * 60 * 5, // 5 minutes
  updateAgeOnGet: true
});

export async function getStory(id: string): Promise<Story> {
  // Check cache first
  const cached = storyCache.get(id);
  if (cached) return cached;
  
  // Fetch from database
  const story = await prisma.story.findUnique({
    where: { id },
    include: {
      generations: {
        orderBy: { createdAt: 'desc' },
        take: 1
      }
    }
  });
  
  if (story) {
    storyCache.set(id, story);
  }
  
  return story;
}
```

#### Issue: "Memory leaks in workers"
```typescript
// Solution: Proper cleanup
class StoryGenerationWorker {
  private cleanup: (() => void)[] = [];
  
  async process(job: Job) {
    const timer = setTimeout(() => {
      throw new Error('Job timeout');
    }, 300000);
    
    this.cleanup.push(() => clearTimeout(timer));
    
    try {
      return await this.generateStory(job.data);
    } finally {
      this.runCleanup();
    }
  }
  
  private runCleanup() {
    this.cleanup.forEach(fn => fn());
    this.cleanup = [];
  }
}
```

### 6. Authentication Issues

#### Issue: "Session expired during generation"
```typescript
// Solution: Implement session refresh
export async function refreshSession(request: Request) {
  const { session, admin } = await authenticate.admin(request);
  
  if (session.expires < Date.now() + 300000) { // 5 min buffer
    const newSession = await admin.session.refresh();
    return newSession;
  }
  
  return session;
}

// Use in long-running processes
async function longRunningProcess(request: Request) {
  let session = await authenticate.admin(request);
  
  const checkSession = setInterval(async () => {
    session = await refreshSession(request);
  }, 240000); // Check every 4 minutes
  
  try {
    // Long process
  } finally {
    clearInterval(checkSession);
  }
}
```

## Error Monitoring

### Sentry Configuration
```typescript
// app/entry.server.tsx
import * as Sentry from '@sentry/remix';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Sentry.Integrations.Prisma({ client: prisma })
  ],
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  beforeSend(event, hint) {
    // Filter out known issues
    if (event.exception?.values?.[0]?.type === 'NetworkError') {
      return null;
    }
    return event;
  }
});
```

### Custom Error Tracking
```typescript
// app/utils/error-tracking.server.ts
export function trackError(
  error: Error,
  context: Record<string, any> = {}
) {
  logger.error(error.message, {
    stack: error.stack,
    ...context
  });
  
  Sentry.captureException(error, {
    tags: {
      component: context.component || 'unknown'
    },
    extra: context
  });
  
  // Send to monitoring dashboard
  if (process.env.NODE_ENV === 'production') {
    sendToMonitoring({
      error: error.message,
      context,
      timestamp: new Date().toISOString()
    });
  }
}
```

## Recovery Procedures

### Data Recovery
```typescript
// scripts/recover-story.ts
async function recoverStory(storyId: string) {
  // Check if story exists but is corrupted
  const story = await prisma.story.findUnique({
    where: { id: storyId }
  });
  
  if (!story) {
    // Check Redis for draft
    const draft = await redis.get(`draft:${storyId}`);
    if (draft) {
      return await prisma.story.create({
        data: JSON.parse(draft)
      });
    }
  }
  
  // Check S3 backups
  const backup = await s3.getObject({
    Bucket: process.env.BACKUP_BUCKET,
    Key: `stories/${storyId}.json`
  }).promise();
  
  if (backup.Body) {
    return await prisma.story.upsert({
      where: { id: storyId },
      create: JSON.parse(backup.Body.toString()),
      update: JSON.parse(backup.Body.toString())
    });
  }
  
  throw new Error('Story not recoverable');
}
```

### Emergency Procedures
```typescript
// scripts/emergency-shutdown.ts
async function emergencyShutdown() {
  console.log('🚨 Initiating emergency shutdown...');
  
  // Stop accepting new requests
  server.close();
  
  // Stop workers gracefully
  await storyWorker.close();
  await imageWorker.close();
  
  // Save in-progress work
  const activeJobs = await storyQueue.getActive();
  for (const job of activeJobs) {
    await redis.set(
      `recovery:${job.id}`,
      JSON.stringify(job.data),
      'EX',
      86400 // 24 hours
    );
  }
  
  // Close connections
  await prisma.$disconnect();
  await redis.quit();
  
  console.log('✓ Shutdown complete');
  process.exit(0);
}
```

## Contact Information

### Escalation Path
1. **Level 1**: Check this guide and logs
2. **Level 2**: Team Slack #storybook-support
3. **Level 3**: On-call engineer (PagerDuty)
4. **Level 4**: Technical lead

### Critical Contacts
- **Shopify Support**: partners@shopify.com
- **OpenAI Support**: support@openai.com
- **Database Admin**: dba@company.com
- **DevOps Team**: devops@company.com

### Useful Commands
```bash
# View real-time logs
npm run logs:tail

# Check queue status
npm run queue:status

# Clear cache
npm run cache:clear

# Run health check
npm run health:check

# Generate support bundle
npm run support:bundle
```