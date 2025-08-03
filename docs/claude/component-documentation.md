# Component Documentation - AI Storybook Generator

## Core Components

### StoryCreator
Main component for creating new stories.

```typescript
// app/components/story-creator.tsx
interface StoryCreatorProps {
  customerId: string;
  defaultValues?: Partial<StoryParams>;
  onSuccess?: (storyId: string) => void;
}

export function StoryCreator({ 
  customerId, 
  defaultValues, 
  onSuccess 
}: StoryCreatorProps) {
  // Component implementation
}
```

**Usage:**
```tsx
<StoryCreator 
  customerId={session.customerId}
  onSuccess={(storyId) => navigate(`/stories/${storyId}`)}
/>
```

**Features:**
- Multi-step form wizard
- Character builder with AI suggestions
- Real-time form validation
- Progress indicators
- Draft auto-save

### StoryViewer
Displays generated story with interactive features.

```typescript
// app/components/story-viewer.tsx
interface StoryViewerProps {
  story: Story;
  mode: 'read' | 'edit' | 'preview';
  showAudioControls?: boolean;
  onEdit?: (updates: Partial<Story>) => void;
}

export function StoryViewer({ 
  story, 
  mode = 'read',
  showAudioControls = true,
  onEdit 
}: StoryViewerProps) {
  // Component implementation
}
```

**Features:**
- Page-by-page navigation
- Zoom and fullscreen modes
- Audio playback integration
- Edit mode for regeneration
- Sharing capabilities

### CharacterBuilder
AI-assisted character creation component.

```typescript
// app/components/character-builder.tsx
interface CharacterBuilderProps {
  onChange: (characters: Character[]) => void;
  initialCharacters?: Character[];
  maxCharacters?: number;
}

interface Character {
  id: string;
  name: string;
  role: 'protagonist' | 'supporting' | 'antagonist';
  description: string;
  personality: string[];
  appearance: string;
  aiGenerated?: boolean;
}
```

**Features:**
- AI character suggestions
- Visual character preview
- Personality trait selector
- Character consistency tracking

### ImageGallery
Displays story images with generation controls.

```typescript
// app/components/image-gallery.tsx
interface ImageGalleryProps {
  images: StoryImage[];
  onRegenerate?: (imageId: string) => void;
  onStyleChange?: (style: ImageStyle) => void;
  editable?: boolean;
}

interface StoryImage {
  id: string;
  url: string;
  prompt: string;
  chapterNumber: number;
  status: 'generated' | 'generating' | 'error';
}
```

### StoryLibrary
Grid view of user's story collection.

```typescript
// app/components/story-library.tsx
interface StoryLibraryProps {
  stories: Story[];
  view: 'grid' | 'list';
  filters?: StoryFilters;
  onStoryClick?: (storyId: string) => void;
  onFilterChange?: (filters: StoryFilters) => void;
}

interface StoryFilters {
  status?: StoryStatus[];
  genre?: string[];
  dateRange?: { start: Date; end: Date };
  search?: string;
}
```

## UI Components

### GenerationProgress
Real-time progress indicator for story generation.

```typescript
// app/components/generation-progress.tsx
interface GenerationProgressProps {
  storyId: string;
  onComplete?: () => void;
  showDetails?: boolean;
}

export function GenerationProgress({ 
  storyId, 
  onComplete,
  showDetails = true 
}: GenerationProgressProps) {
  const { progress, error } = useGenerationProgress(storyId);
  
  return (
    <div className="generation-progress">
      <ProgressBar value={progress.percentage} />
      {showDetails && (
        <div className="progress-details">
          <p>{progress.currentStep}</p>
          <p>{progress.timeRemaining} remaining</p>
        </div>
      )}
    </div>
  );
}
```

### AudioPlayer
Custom audio player for story narration.

```typescript
// app/components/audio-player.tsx
interface AudioPlayerProps {
  audioUrl: string;
  chapters: ChapterAudio[];
  currentChapter?: number;
  onChapterChange?: (chapter: number) => void;
}

interface ChapterAudio {
  number: number;
  startTime: number;
  endTime: number;
  title: string;
}
```

### PricingCard
Displays story pricing with purchase options.

```typescript
// app/components/pricing-card.tsx
interface PricingCardProps {
  story: Story;
  variant?: 'compact' | 'detailed';
  showComparison?: boolean;
  onPurchase?: () => void;
}
```

## Form Components

### StoryForm
Comprehensive form for story parameters.

```typescript
// app/components/forms/story-form.tsx
interface StoryFormProps {
  defaultValues?: Partial<StoryFormData>;
  onSubmit: (data: StoryFormData) => void;
  isSubmitting?: boolean;
}

interface StoryFormData {
  title: string;
  genre: string;
  ageGroup: string;
  language: string;
  characters: Character[];
  settings: StorySettings;
  moralLesson?: string;
  chapterCount: number;
  illustration: {
    style: ImageStyle;
    colorPalette?: string;
  };
}
```

### LanguageSelector
Multi-language support component.

```typescript
// app/components/forms/language-selector.tsx
interface LanguageSelectorProps {
  value: string;
  onChange: (language: string) => void;
  supportedLanguages?: Language[];
}

interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}
```

## Hooks

### useStoryGeneration
Hook for managing story generation state.

```typescript
// app/hooks/use-story-generation.ts
export function useStoryGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<GenerationProgress>();
  const [error, setError] = useState<Error>();
  
  const generateStory = async (params: StoryParams) => {
    // Implementation
  };
  
  return {
    generateStory,
    isGenerating,
    progress,
    error
  };
}
```

### useShopifyProduct
Hook for Shopify product integration.

```typescript
// app/hooks/use-shopify-product.ts
export function useShopifyProduct(storyId: string) {
  const [product, setProduct] = useState<ShopifyProduct>();
  const [isPublishing, setIsPublishing] = useState(false);
  
  const publishAsProduct = async (options: PublishOptions) => {
    // Implementation
  };
  
  return {
    product,
    publishAsProduct,
    isPublishing
  };
}
```

### useAudioNarration
Hook for audio narration features.

```typescript
// app/hooks/use-audio-narration.ts
export function useAudioNarration(storyId: string) {
  const [audio, setAudio] = useState<AudioData>();
  const [isGenerating, setIsGenerating] = useState(false);
  const [playbackState, setPlaybackState] = useState<PlaybackState>();
  
  return {
    audio,
    generateAudio,
    play,
    pause,
    seekToChapter,
    playbackState
  };
}
```

## Component Styling

All components use Tailwind CSS with custom design tokens:

```css
/* app/styles/components.css */
:root {
  --story-primary: #6366f1;
  --story-secondary: #f59e0b;
  --story-accent: #10b981;
  --story-background: #f3f4f6;
  --story-text: #1f2937;
}

.story-container {
  @apply max-w-7xl mx-auto px-4 sm:px-6 lg:px-8;
}

.story-card {
  @apply bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow;
}

.story-button {
  @apply px-4 py-2 bg-story-primary text-white rounded-md hover:bg-story-primary/90;
}
```

## Component Testing

```typescript
// tests/components/story-creator.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { StoryCreator } from '~/components/story-creator';

describe('StoryCreator', () => {
  it('validates required fields', async () => {
    render(<StoryCreator customerId="123" />);
    
    const submitButton = screen.getByText('Create Story');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Title is required')).toBeInTheDocument();
    });
  });
  
  it('shows character limit warnings', () => {
    // Test implementation
  });
});
```

## Accessibility

All components follow WCAG 2.1 AA standards:

- Semantic HTML structure
- ARIA labels and descriptions
- Keyboard navigation support
- Screen reader announcements
- Color contrast compliance
- Focus indicators
- Loading state announcements