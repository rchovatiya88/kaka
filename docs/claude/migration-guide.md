# Migration Guide - AI Storybook Generator

## Pre-Migration Checklist

- [ ] Backup MongoDB database
- [ ] Export all user data from Clerk
- [ ] Document all environment variables
- [ ] Create Shopify Partner account
- [ ] Set up development store
- [ ] Install Shopify CLI
- [ ] Review API rate limits
- [ ] Plan downtime window

## Phase 1: Database Schema Migration

### Step 1.1: Set up Prisma
```bash
cd kaka
npm install @prisma/client prisma
npx prisma init
```

### Step 1.2: Configure Database
```env
# .env
DATABASE_URL="postgresql://user:password@localhost:5432/storybook"
# or for SQLite
DATABASE_URL="file:./dev.db"
```

### Step 1.3: Create Migration Scripts
```javascript
// scripts/migrate-stories.js
const { MongoClient } = require('mongodb');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const mongo = new MongoClient(process.env.MONGODB_URI);

async function migrateStories() {
  await mongo.connect();
  const db = mongo.db('storybook');
  const stories = db.collection('stories');
  
  const cursor = stories.find({});
  
  while (await cursor.hasNext()) {
    const story = await cursor.next();
    
    try {
      await prisma.story.create({
        data: {
          id: story._id.toString(),
          shopifyCustomerId: await mapClerkToShopifyId(story.userId),
          title: story.title,
          description: story.description,
          genre: story.genre,
          ageGroup: story.ageGroup,
          language: story.language || 'en',
          chapters: story.chapters,
          characters: story.characters,
          settings: story.settings,
          moralLesson: story.moralLesson,
          coverImage: story.coverImage,
          images: story.images || [],
          status: mapStatus(story.status),
          createdAt: story.createdAt,
          updatedAt: story.updatedAt
        }
      });
      
      console.log(`Migrated story: ${story.title}`);
    } catch (error) {
      console.error(`Failed to migrate story ${story._id}:`, error);
    }
  }
  
  await mongo.close();
  await prisma.$disconnect();
}
```

### Step 1.4: Run Migrations
```bash
npx prisma migrate dev --name initial_schema
node scripts/migrate-stories.js
```

## Phase 2: Core Story Generation Migration

### Step 2.1: Convert Python to Node.js
```javascript
// app/services/story-generation.server.ts
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);

export async function generateStoryContent({
  title,
  genre,
  ageGroup,
  characters,
  settings,
  moralLesson,
  chapterCount = 5
}) {
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
  
  const prompt = buildStoryPrompt({
    title,
    genre,
    ageGroup,
    characters,
    settings,
    moralLesson,
    chapterCount
  });
  
  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();
  
  return parseStoryContent(text);
}

function buildStoryPrompt(params) {
  return `
    Create a children's story with the following parameters:
    Title: ${params.title}
    Genre: ${params.genre}
    Age Group: ${params.ageGroup}
    Moral Lesson: ${params.moralLesson}
    
    Characters:
    ${params.characters.map(c => `- ${c.name}: ${c.description}`).join('\n')}
    
    Setting: ${params.settings.location} during ${params.settings.timeOfDay}
    
    Please create ${params.chapterCount} chapters, each about 200 words.
    Format the response as JSON with this structure:
    {
      "chapters": [
        {
          "number": 1,
          "title": "Chapter Title",
          "content": "Chapter content...",
          "imagePrompt": "Detailed image generation prompt..."
        }
      ]
    }
  `;
}
```

### Step 2.2: Set up Queue System
```javascript
// app/queues/story-generation.server.ts
import { Queue, Worker } from 'bullmq';
import { generateStoryContent } from '~/services/story-generation.server';

export const storyQueue = new Queue('story-generation', {
  connection: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
  },
});

export const storyWorker = new Worker(
  'story-generation',
  async (job) => {
    const { storyId, params } = job.data;
    
    // Update status
    await prisma.story.update({
      where: { id: storyId },
      data: { status: 'GENERATING' }
    });
    
    try {
      // Generate content
      const content = await generateStoryContent(params);
      
      // Save to database
      await prisma.story.update({
        where: { id: storyId },
        data: {
          chapters: content.chapters,
          wordCount: calculateWordCount(content),
          status: 'COMPLETE'
        }
      });
      
      // Queue image generation
      await imageQueue.add('generate-images', {
        storyId,
        chapters: content.chapters
      });
      
    } catch (error) {
      await prisma.story.update({
        where: { id: storyId },
        data: { 
          status: 'ERROR',
          error: error.message 
        }
      });
      throw error;
    }
  },
  {
    connection: {
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
    },
  }
);
```

## Phase 3: Frontend Integration

### Step 3.1: Migrate React Components
```typescript
// app/components/story-creator.tsx
import { Form, useNavigation } from '@remix-run/react';
import { useState } from 'react';

export function StoryCreator() {
  const navigation = useNavigation();
  const isGenerating = navigation.state === 'submitting';
  
  return (
    <Form method="post" action="/api/stories/generate">
      <fieldset disabled={isGenerating}>
        <div className="space-y-4">
          <div>
            <label htmlFor="title">Story Title</label>
            <input
              type="text"
              id="title"
              name="title"
              required
              placeholder="The Brave Little Robot"
            />
          </div>
          
          <div>
            <label htmlFor="genre">Genre</label>
            <select id="genre" name="genre" required>
              <option value="adventure">Adventure</option>
              <option value="fantasy">Fantasy</option>
              <option value="science-fiction">Science Fiction</option>
              <option value="fairy-tale">Fairy Tale</option>
            </select>
          </div>
          
          {/* Character inputs */}
          <CharacterInputs />
          
          <button type="submit" disabled={isGenerating}>
            {isGenerating ? 'Generating Story...' : 'Create Story'}
          </button>
        </div>
      </fieldset>
    </Form>
  );
}
```

### Step 3.2: Replace Clerk Authentication
```typescript
// app/routes/stories.new.tsx
import { json, redirect } from '@remix-run/node';
import { authenticate } from '~/shopify.server';

export async function loader({ request }) {
  const { session, redirect: authRedirect } = 
    await authenticate.public.appProxy(request);
    
  if (!session) {
    throw authRedirect;
  }
  
  return json({ customerId: session.customerId });
}

export async function action({ request }) {
  const { session } = await authenticate.public.appProxy(request);
  
  if (!session) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const formData = await request.formData();
  const storyParams = Object.fromEntries(formData);
  
  // Create story record
  const story = await prisma.story.create({
    data: {
      shopifyCustomerId: session.customerId,
      title: storyParams.title,
      genre: storyParams.genre,
      status: 'DRAFT',
      // ... other fields
    }
  });
  
  // Queue generation
  await storyQueue.add('generate', {
    storyId: story.id,
    params: storyParams
  });
  
  return redirect(`/stories/${story.id}`);
}
```

## Phase 4: Shopify Integration

### Step 4.1: Product Creation
```typescript
// app/services/shopify-integration.server.ts
export async function createStoryProduct(
  admin: AdminApiContext,
  story: Story
) {
  const response = await admin.graphql(
    `#graphql
      mutation createProduct($input: ProductInput!) {
        productCreate(input: $input) {
          product {
            id
            handle
            onlineStoreUrl
          }
          userErrors {
            field
            message
          }
        }
      }
    `,
    {
      variables: {
        input: {
          title: story.title,
          descriptionHtml: createProductDescription(story),
          productType: 'Digital Story',
          vendor: 'AI Storybook',
          tags: [
            'digital',
            'story',
            story.genre,
            `age-${story.ageGroup}`,
            story.language
          ],
          images: [
            {
              originalSrc: story.coverImage,
              altText: `Cover image for ${story.title}`
            }
          ],
          metafields: [
            {
              namespace: 'story',
              key: 'story_id',
              value: story.id,
              type: 'single_line_text_field'
            },
            {
              namespace: 'story',
              key: 'generation_date',
              value: story.createdAt.toISOString(),
              type: 'date'
            }
          ],
          variants: [
            {
              price: '9.99',
              compareAtPrice: '14.99',
              sku: `STORY-${story.id}`,
              requiresShipping: false,
              taxable: false,
              inventoryPolicy: 'CONTINUE',
              inventoryManagement: null
            }
          ]
        }
      }
    }
  );
  
  const { product, userErrors } = response.productCreate;
  
  if (userErrors.length > 0) {
    throw new Error(userErrors[0].message);
  }
  
  // Update story with product ID
  await prisma.story.update({
    where: { id: story.id },
    data: { 
      shopifyProductId: product.id,
      status: 'PUBLISHED'
    }
  });
  
  return product;
}
```

### Step 4.2: Digital Asset Delivery
```typescript
// app/routes/webhooks/orders.create.tsx
export async function action({ request }) {
  const { topic, shop, session, admin } = 
    await authenticate.webhook(request);
    
  if (topic !== 'ORDERS_CREATE') {
    return new Response('Not Found', { status: 404 });
  }
  
  const order = await request.json();
  
  // Check for story products
  for (const lineItem of order.line_items) {
    const storyId = await getStoryIdFromProduct(
      admin,
      lineItem.product_id
    );
    
    if (storyId) {
      // Generate download links
      const downloadLinks = await generateDownloadLinks(storyId);
      
      // Send email with download links
      await sendDigitalDeliveryEmail(
        order.email,
        lineItem.name,
        downloadLinks
      );
      
      // Track purchase
      await prisma.story.update({
        where: { id: storyId },
        data: {
          shopifyOrderId: order.id,
          purchasedAt: new Date()
        }
      });
    }
  }
  
  return new Response('OK', { status: 200 });
}
```

## Phase 5: Testing & Deployment

### Step 5.1: Testing Strategy
```bash
# Unit tests
npm run test

# Integration tests
npm run test:integration

# E2E tests with Playwright
npm run test:e2e
```

### Step 5.2: Gradual Rollout
```typescript
// Feature flags for gradual migration
const features = {
  useNewGeneration: process.env.USE_NEW_GENERATION === 'true',
  enableShopifyProducts: process.env.ENABLE_SHOPIFY_PRODUCTS === 'true',
  migrateExistingUsers: process.env.MIGRATE_EXISTING_USERS === 'true'
};
```

### Step 5.3: Monitoring
```typescript
// app/services/monitoring.server.ts
import * as Sentry from '@sentry/remix';

export function trackStoryGeneration(storyId: string, metrics: {
  duration: number;
  cost: number;
  provider: string;
}) {
  Sentry.addBreadcrumb({
    message: 'Story generated',
    data: { storyId, ...metrics }
  });
  
  // Send to analytics
  analytics.track('Story Generated', {
    storyId,
    ...metrics
  });
}
```

## Post-Migration Tasks

- [ ] Verify all stories migrated correctly
- [ ] Test purchase flow end-to-end
- [ ] Update DNS records
- [ ] Redirect old URLs
- [ ] Archive old codebase
- [ ] Update documentation
- [ ] Train support team
- [ ] Monitor error rates
- [ ] Optimize performance
- [ ] Gather user feedback

## Rollback Plan

1. Keep old system running in read-only mode
2. Maintain database sync for 30 days
3. Document all rollback procedures
4. Test rollback in staging
5. Have emergency contacts ready