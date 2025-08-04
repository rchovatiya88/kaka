/**
 * Constants for the Shopify Storybook App
 * Migrated from kakafullstack with Shopify-specific adaptations
 */

// Story Themes (migrated from kakafullstack)
export const STORY_THEMES = [
  {
    id: "enchanted-manga",
    title: "Enchanted Manga",
    description: "Magical worlds with anime-style artwork and whimsical adventures",
    color: "#FF6B9D",
    features: ["Anime-style illustrations", "Fantasy creatures", "Magic spells"]
  },
  {
    id: "underwater-explorer",
    title: "Underwater Explorer", 
    description: "Deep sea adventures with colorful marine life and hidden treasures",
    color: "#4ECDC4",
    features: ["Ocean exploration", "Marine creatures", "Treasure hunting"]
  },
  {
    id: "space-adventure",
    title: "Space Adventure",
    description: "Cosmic journeys through galaxies with alien friends and spaceships",
    color: "#6B73FF",
    features: ["Space exploration", "Alien encounters", "Spaceship adventures"]
  },
  {
    id: "world-explorer",
    title: "World Explorer",
    description: "Cultural adventures around the globe with landmarks and traditions",
    color: "#FFA726",
    features: ["Cultural exploration", "World landmarks", "Global traditions"]
  },
  {
    id: "fantasy-adventure",
    title: "Fantasy Adventure",
    description: "Epic quests with dragons, castles, and magical kingdoms",
    color: "#9C27B0",
    features: ["Epic quests", "Dragons & castles", "Magical kingdoms"]
  },
  {
    id: "animal-friends",
    title: "Animal Friends",
    description: "Heartwarming stories with talking animals and forest adventures",
    color: "#4CAF50",
    features: ["Talking animals", "Forest adventures", "Friendship stories"]
  }
];

// Art Styles (from kakafullstack)
export const ART_STYLES = [
  {
    id: "watercolor",
    name: "Watercolor",
    description: "Soft, dreamy watercolor paintings with gentle colors",
    preview: "/art-styles/watercolor.jpg"
  },
  {
    id: "cartoon",
    name: "Cartoon",
    description: "Bright, fun cartoon-style illustrations",
    preview: "/art-styles/cartoon.jpg"
  },
  {
    id: "anime",
    name: "Anime",
    description: "Japanese anime/manga style artwork",
    preview: "/art-styles/anime.jpg"
  },
  {
    id: "storybook",
    name: "Storybook",
    description: "Classic children's book illustration style",
    preview: "/art-styles/storybook.jpg"
  },
  {
    id: "pixelart",
    name: "Pixel Art",
    description: "Retro pixel art style for gaming adventures",
    preview: "/art-styles/pixelart.jpg"
  },
  {
    id: "sketch",
    name: "Sketch",
    description: "Hand-drawn pencil sketch style",
    preview: "/art-styles/sketch.jpg"
  },
  {
    id: "whimsical",
    name: "Whimsical",
    description: "Playful, imaginative artistic style",
    preview: "/art-styles/whimsical.jpg"
  }
];

// Age Groups
export const AGE_GROUPS = [
  { id: "3-5", label: "3-5 years", description: "Simple stories with basic concepts" },
  { id: "4-8", label: "4-8 years", description: "Adventure stories with learning elements" },
  { id: "6-10", label: "6-10 years", description: "Complex adventures with character development" },
  { id: "8-12", label: "8-12 years", description: "Detailed stories with moral lessons" }
];

// Languages (from kakafullstack multilingual support)
export const LANGUAGES = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "es", name: "Spanish", flag: "🇪🇸" },
  { code: "hi", name: "Hindi", flag: "🇮🇳" },
  { code: "fr", name: "French", flag: "🇫🇷" },
  { code: "de", name: "German", flag: "🇩🇪" },
  { code: "it", name: "Italian", flag: "🇮🇹" },
  { code: "pt", name: "Portuguese", flag: "🇵🇹" },
  { code: "zh", name: "Chinese", flag: "🇨🇳" },
  { code: "ja", name: "Japanese", flag: "🇯🇵" },
  { code: "ko", name: "Korean", flag: "🇰🇷" }
];

// Story Length Options
export const STORY_LENGTHS = [
  { pages: 3, label: "Short Story", description: "3 pages - Quick bedtime story" },
  { pages: 5, label: "Medium Story", description: "5 pages - Perfect adventure length" },
  { pages: 8, label: "Long Story", description: "8 pages - Extended adventure" },
  { pages: 10, label: "Epic Story", description: "10 pages - Full story experience" }
];

// Character Traits (for personality selection)
export const CHARACTER_TRAITS = [
  "adventurous", "brave", "curious", "kind", "funny", "creative", 
  "smart", "helpful", "energetic", "gentle", "determined", "cheerful",
  "imaginative", "friendly", "confident", "caring", "playful", "patient"
];

// Venice AI Configuration
export const VENICE_CONFIG = {
  TEXT_MODEL: "claude-3-sonnet",
  IMAGE_MODEL: "flux-dev",
  MAX_TOKENS: 2000,
  TEMPERATURE: 0.7,
  IMAGE_SIZE: { width: 1024, height: 1024 },
  INFERENCE_STEPS: 30,
  GUIDANCE_SCALE: 7.5
};

// API Endpoints
export const API_ENDPOINTS = {
  STORIES: "/api/v1/stories",
  VENICE_TEXT: "/api/v1/venice/text",
  VENICE_IMAGE: "/api/v1/venice/image",
  VENICE_HEALTH: "/api/v1/venice/health",
  CHARACTERS: "/api/v1/characters",
  USERS: "/api/v1/users"
};

// Progress Steps for Story Creation
export const CREATION_STEPS = [
  { id: "theme", label: "Theme", progress: 0 },
  { id: "customize", label: "Customize", progress: 25 },
  { id: "generate", label: "Generate", progress: 50 },
  { id: "preview", label: "Preview", progress: 75 },
  { id: "complete", label: "Complete", progress: 100 }
];

// Default Story Configuration
export const DEFAULT_STORY_CONFIG = {
  theme: "fantasy-adventure",
  artStyle: "storybook",
  ageGroup: "4-8",
  pageCount: 5,
  language: "en",
  autoGenerate: true
};

// Error Messages
export const ERROR_MESSAGES = {
  GENERATION_FAILED: "Story generation failed. Please try again.",
  NETWORK_ERROR: "Network error. Please check your connection.",
  INVALID_INPUT: "Please provide valid story information.",
  CHARACTER_UPLOAD_FAILED: "Failed to upload character image.",
  VENICE_UNAVAILABLE: "AI service temporarily unavailable."
};

// Success Messages
export const SUCCESS_MESSAGES = {
  STORY_CREATED: "Your story has been created successfully!",
  STORY_UPDATED: "Story updated successfully!",
  STORY_DELETED: "Story deleted successfully!",
  CHARACTER_UPLOADED: "Character image uploaded successfully!"
};