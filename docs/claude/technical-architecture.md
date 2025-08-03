# Technical Architecture - AI Storybook Generator

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Shopify Storefront                       │
│                  (Customer Interface)                       │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                    Remix Application                        │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │   Routes    │  │ API Routes   │  │   Components    │  │
│  │  (Pages)    │  │ (Handlers)   │  │   (React UI)    │  │
│  └─────────────┘  └──────────────┘  └─────────────────┘  │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                    Service Layer                            │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │   Story     │  │    Image     │  │     Audio       │  │
│  │ Generation  │  │  Generation  │  │   Generation    │  │
│  └─────────────┘  └──────────────┘  └─────────────────┘  │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                  External Services                          │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │  Google AI  │  │   DALL-E     │  │  Google TTS    │  │
│  │   OpenAI    │  │ Stable Diff  │  │  ElevenLabs    │  │
│  └─────────────┘  └──────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Database Schema (Prisma)

```prisma
model Story {
  id                String      @id @default(cuid())
  shopifyCustomerId String
  shopifyProductId  String?     @unique
  shopifyOrderId    String?
  
  // Story Content
  title             String
  description       String?
  genre             String
  ageGroup          String
  language          String      @default("en")
  
  // Story Data
  chapters          Json        // Array of chapter objects
  characters        Json        // Character definitions
  settings          Json        // Story settings/themes
  moralLesson       String?
  
  // Generated Assets
  coverImage        String?
  images            Json        // Page images array
  audioFiles        Json?       // Audio file URLs
  pdfUrl            String?
  
  // Metadata
  status            StoryStatus @default(DRAFT)
  generationTime    Int?        // Time in seconds
  wordCount         Int?
  pageCount         Int?
  
  // Timestamps
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt
  publishedAt       DateTime?
  
  // Relations
  generations       Generation[]
  
  @@index([shopifyCustomerId])
  @@index([status])
  @@index([createdAt])
}

model Generation {
  id          String   @id @default(cuid())
  storyId     String
  type        GenerationType
  prompt      String
  result      Json
  cost        Float?
  duration    Int?     // milliseconds
  provider    String   // openai, google, etc
  createdAt   DateTime @default(now())
  
  story       Story    @relation(fields: [storyId], references: [id])
  
  @@index([storyId])
  @@index([type])
}

enum StoryStatus {
  DRAFT
  GENERATING
  COMPLETE
  PUBLISHED
  ERROR
  ARCHIVED
}

enum GenerationType {
  TEXT
  IMAGE
  AUDIO
  PDF
}
```

## API Routes Structure

```
app/routes/
├── api/
│   ├── stories/
│   │   ├── generate.tsx        # POST: Start story generation
│   │   ├── $storyId.tsx        # GET: Fetch story details
│   │   ├── $storyId.status.tsx # GET: Check generation status
│   │   └── $storyId.publish.tsx# POST: Publish as Shopify product
│   ├── assets/
│   │   ├── pdf.$storyId.tsx    # GET: Generate/fetch PDF
│   │   └── audio.$storyId.tsx  # GET: Generate/fetch audio
│   └── webhooks/
│       ├── shopify.tsx         # Shopify webhooks
│       └── generation.tsx      # AI generation callbacks
├── stories/
│   ├── new.tsx                # Story creation form
│   ├── $storyId.tsx           # Story viewer/editor
│   └── index.tsx              # Story library
└── account/
    └── stories.tsx            # Customer's story collection
```

## Service Layer Architecture

### StoryGenerationService
```typescript
interface StoryGenerationService {
  generateStory(params: StoryParams): Promise<Story>;
  generateChapter(storyId: string, chapterIndex: number): Promise<Chapter>;
  regenerateContent(storyId: string, type: 'text' | 'image'): Promise<void>;
}
```

### ImageGenerationService
```typescript
interface ImageGenerationService {
  generateCoverImage(story: Story): Promise<string>;
  generatePageImage(prompt: string, style: ImageStyle): Promise<string>;
  generateCharacterConsistency(character: Character): Promise<CharacterReference>;
}
```

### ShopifyIntegrationService
```typescript
interface ShopifyIntegrationService {
  createProduct(story: Story): Promise<ShopifyProduct>;
  updateProduct(storyId: string, updates: Partial<Story>): Promise<void>;
  createDigitalAsset(storyId: string, assetUrl: string): Promise<void>;
  linkCustomerToStory(customerId: string, storyId: string): Promise<void>;
}
```

## Queue System (BullMQ)

```typescript
// Queue definitions
const queues = {
  storyGeneration: new Queue('story-generation'),
  imageGeneration: new Queue('image-generation'),
  audioGeneration: new Queue('audio-generation'),
  pdfGeneration: new Queue('pdf-generation'),
  shopifySync: new Queue('shopify-sync')
};

// Worker example
const storyWorker = new Worker('story-generation', async (job) => {
  const { storyId, params } = job.data;
  
  // Update status
  await updateStoryStatus(storyId, 'GENERATING');
  
  try {
    // Generate story content
    const content = await generateStoryContent(params);
    
    // Queue image generation
    await queues.imageGeneration.add('generate-images', {
      storyId,
      chapters: content.chapters
    });
    
    // Update story
    await updateStory(storyId, { 
      content, 
      status: 'COMPLETE' 
    });
  } catch (error) {
    await updateStoryStatus(storyId, 'ERROR');
    throw error;
  }
});
```

## Caching Strategy

```typescript
// Redis cache configuration
const cache = {
  stories: {
    ttl: 3600,        // 1 hour
    prefix: 'story:'
  },
  assets: {
    ttl: 86400,       // 24 hours
    prefix: 'asset:'
  },
  generation: {
    ttl: 300,         // 5 minutes
    prefix: 'gen:'
  }
};

// Cache implementation
async function getCachedStory(storyId: string): Promise<Story | null> {
  const cached = await redis.get(`story:${storyId}`);
  return cached ? JSON.parse(cached) : null;
}
```

## Error Handling & Monitoring

```typescript
// Global error handler
export function handleError(error: unknown): Response {
  if (error instanceof StoryGenerationError) {
    return json({ 
      error: error.message, 
      code: error.code 
    }, { 
      status: error.status 
    });
  }
  
  // Log to monitoring service
  logger.error('Unhandled error', { error });
  
  return json({ 
    error: 'Internal server error' 
  }, { 
    status: 500 
  });
}
```

## Environment Variables

```env
# Shopify
SHOPIFY_APP_URL=
SHOPIFY_API_KEY=
SHOPIFY_API_SECRET=
SCOPES=read_products,write_products,read_customers

# AI Services
OPENAI_API_KEY=
GOOGLE_AI_API_KEY=
ELEVENLABS_API_KEY=

# Database
DATABASE_URL=

# Redis
REDIS_URL=

# Storage
AWS_S3_BUCKET=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=

# Feature Flags
ENABLE_AUDIO_GENERATION=true
ENABLE_MULTI_LANGUAGE=false
MAX_STORY_LENGTH=5000
```