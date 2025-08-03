# API Documentation - AI Storybook Generator

## Authentication
All API endpoints require Shopify session authentication via App Bridge.

```typescript
// Authentication middleware
export async function authenticate(request: Request) {
  const { authenticated, redirect } = await shopify.authenticate.public(request);
  if (!authenticated) {
    throw redirect;
  }
  return authenticated;
}
```

## Story Generation APIs

### POST /api/stories/generate
Generate a new AI story based on parameters.

**Request Body:**
```json
{
  "title": "The Brave Little Robot",
  "genre": "adventure",
  "ageGroup": "5-8",
  "language": "en",
  "characters": [
    {
      "name": "Beep",
      "role": "protagonist",
      "description": "A small blue robot with big dreams"
    }
  ],
  "settings": {
    "location": "futuristic city",
    "timeOfDay": "sunset",
    "mood": "hopeful"
  },
  "moralLesson": "Courage comes in all sizes",
  "chapterCount": 5,
  "wordsPerChapter": 200
}
```

**Response:**
```json
{
  "storyId": "clh2w9x3m0000qzrmg8dz9876",
  "status": "generating",
  "estimatedTime": 120,
  "pollUrl": "/api/stories/clh2w9x3m0000qzrmg8dz9876/status"
}
```

### GET /api/stories/:storyId
Retrieve complete story details.

**Response:**
```json
{
  "id": "clh2w9x3m0000qzrmg8dz9876",
  "title": "The Brave Little Robot",
  "status": "complete",
  "chapters": [
    {
      "number": 1,
      "title": "A New Beginning",
      "content": "Once upon a time...",
      "imageUrl": "https://cdn.shopify.com/...",
      "imagePrompt": "A small blue robot standing..."
    }
  ],
  "coverImage": "https://cdn.shopify.com/...",
  "metadata": {
    "wordCount": 1000,
    "readingTime": 5,
    "generationTime": 95
  }
}
```

### GET /api/stories/:storyId/status
Check generation status (for polling).

**Response:**
```json
{
  "status": "generating",
  "progress": {
    "current": 3,
    "total": 5,
    "currentStep": "Generating chapter 3 image"
  },
  "errors": []
}
```

### POST /api/stories/:storyId/regenerate
Regenerate specific parts of a story.

**Request Body:**
```json
{
  "regenerate": ["chapter_2_text", "cover_image"],
  "options": {
    "keepCharacterConsistency": true
  }
}
```

## Asset Generation APIs

### GET /api/assets/pdf/:storyId
Generate or retrieve PDF version of story.

**Query Parameters:**
- `format`: "letter" | "a4" (default: "letter")
- `quality`: "screen" | "print" (default: "screen")
- `includeAudio`: boolean (default: false)

**Response:**
- Content-Type: application/pdf
- Content-Disposition: attachment; filename="story-title.pdf"

### POST /api/assets/audio/:storyId
Generate audio narration for story.

**Request Body:**
```json
{
  "voice": "en-US-Neural2-F",
  "speed": 1.0,
  "pitch": 0,
  "chapters": [1, 2, 3]  // Optional: specific chapters
}
```

**Response:**
```json
{
  "audioUrls": {
    "full": "https://cdn.shopify.com/audio/full.mp3",
    "chapters": {
      "1": "https://cdn.shopify.com/audio/chapter-1.mp3",
      "2": "https://cdn.shopify.com/audio/chapter-2.mp3"
    }
  },
  "duration": 300,
  "format": "mp3"
}
```

## Shopify Integration APIs

### POST /api/stories/:storyId/publish
Create a Shopify product from completed story.

**Request Body:**
```json
{
  "pricing": {
    "amount": "9.99",
    "compareAtPrice": "14.99"
  },
  "productOptions": {
    "includePDF": true,
    "includeAudio": true,
    "allowCustomization": false
  },
  "visibility": "published"  // "draft" | "published"
}
```

**Response:**
```json
{
  "productId": "gid://shopify/Product/1234567890",
  "productHandle": "the-brave-little-robot-story",
  "productUrl": "https://store.myshopify.com/products/...",
  "variantId": "gid://shopify/ProductVariant/0987654321"
}
```

### GET /api/customer/stories
List all stories for authenticated customer.

**Query Parameters:**
- `status`: "all" | "draft" | "published" | "purchased"
- `page`: number (default: 1)
- `limit`: number (default: 20, max: 100)
- `sort`: "created" | "updated" | "title" (default: "created")
- `order`: "asc" | "desc" (default: "desc")

**Response:**
```json
{
  "stories": [
    {
      "id": "clh2w9x3m0000qzrmg8dz9876",
      "title": "The Brave Little Robot",
      "status": "published",
      "coverImage": "https://cdn.shopify.com/...",
      "createdAt": "2024-01-15T10:30:00Z",
      "productId": "gid://shopify/Product/1234567890",
      "purchased": true
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "hasNext": true,
    "hasPrev": false
  }
}
```

## Webhook Endpoints

### POST /api/webhooks/shopify
Handle Shopify webhooks.

**Supported Topics:**
- `orders/create` - Track story purchases
- `customers/update` - Sync customer data
- `products/delete` - Clean up story data

### POST /api/webhooks/generation
Handle async generation callbacks.

**Request Headers:**
```
X-Webhook-Secret: your-webhook-secret
Content-Type: application/json
```

**Request Body:**
```json
{
  "jobId": "job_123456",
  "type": "story_generation",
  "status": "completed",
  "result": {
    "storyId": "clh2w9x3m0000qzrmg8dz9876",
    "duration": 95000,
    "cost": 0.15
  }
}
```

## Error Responses

All APIs return consistent error responses:

```json
{
  "error": {
    "code": "STORY_NOT_FOUND",
    "message": "Story with ID clh2w9x3m0000qzrmg8dz9876 not found",
    "details": {
      "storyId": "clh2w9x3m0000qzrmg8dz9876"
    }
  }
}
```

### Error Codes
- `INVALID_REQUEST` - Bad request parameters
- `AUTHENTICATION_REQUIRED` - No valid session
- `UNAUTHORIZED` - No access to resource
- `STORY_NOT_FOUND` - Story doesn't exist
- `GENERATION_FAILED` - AI generation error
- `QUOTA_EXCEEDED` - Rate limit or usage limit
- `SHOPIFY_API_ERROR` - Shopify API issue
- `INTERNAL_ERROR` - Server error

## Rate Limiting

```json
{
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many requests",
    "retryAfter": 60
  }
}
```

**Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1673612400
```

## Pagination

Standard pagination format:
```json
{
  "data": [...],
  "pagination": {
    "page": 2,
    "limit": 20,
    "total": 156,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": true,
    "nextPage": 3,
    "prevPage": 1
  }
}
```