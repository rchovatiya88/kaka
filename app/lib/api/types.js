// API Response Types and Interfaces

export const API_STATUS = {
  SUCCESS: 'success',
  ERROR: 'error',
  LOADING: 'loading',
  PENDING: 'pending'
};

export const STORY_STATUS = {
  DRAFT: 'draft',
  GENERATING: 'generating',
  COMPLETED: 'completed',
  FAILED: 'failed'
};

export const USER_ROLES = {
  USER: 'user',
  ADMIN: 'admin',
  OWNER: 'owner'
};

// API Response wrappers
export const createSuccessResponse = (data, message = 'Success') => ({
  status: API_STATUS.SUCCESS,
  data,
  message,
  timestamp: new Date().toISOString()
});

export const createErrorResponse = (error, code = 500) => ({
  status: API_STATUS.ERROR,
  error: typeof error === 'string' ? error : error.message,
  code,
  timestamp: new Date().toISOString()
});

// Story API Types
export const STORY_CREATE_REQUEST = {
  childName: 'string',
  ageGroup: 'string', // '3-5', '6-8', '9-12', 'teen'
  theme: 'string',
  length: 'string', // 'short', 'medium', 'long'
  characterDescription: 'string?',
  specialRequests: 'string?',
  includeAudio: 'boolean',
  language: 'string'
};

export const STORY_RESPONSE = {
  id: 'string',
  title: 'string',
  childName: 'string',
  status: 'string',
  createdAt: 'string',
  pages: 'StoryPage[]',
  metadata: 'object'
};

// Page API Types
export const STORY_PAGE_RESPONSE = {
  id: 'string',
  pageNumber: 'number',
  content: 'string',
  imageUrl: 'string?',
  audioUrl: 'string?',
  layoutData: 'object?'
};

// User API Types
export const USER_RESPONSE = {
  id: 'string',
  email: 'string',
  firstName: 'string?',
  lastName: 'string?',
  role: 'string',
  preferences: 'object?'
};