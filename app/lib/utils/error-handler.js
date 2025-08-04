// Global error handling utilities

import { json } from "@remix-run/node";
import { createErrorResponse } from "../api/types";
import { ErrorTracker, logger } from "./logger";

export class AppError extends Error {
  constructor(message, code = 500, type = 'GENERIC_ERROR', details = {}) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.type = type;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

export class ValidationError extends AppError {
  constructor(message, field = null, value = null) {
    super(message, 400, 'VALIDATION_ERROR', { field, value });
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR');
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403, 'AUTHORIZATION_ERROR');
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND_ERROR', { resource });
    this.name = 'NotFoundError';
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Rate limit exceeded') {
    super(message, 429, 'RATE_LIMIT_ERROR');
    this.name = 'RateLimitError';
  }
}

export class ExternalServiceError extends AppError {
  constructor(service, message, originalError = null) {
    super(`${service} error: ${message}`, 502, 'EXTERNAL_SERVICE_ERROR', {
      service,
      originalError: originalError?.message
    });
    this.name = 'ExternalServiceError';
  }
}

export class StoryGenerationError extends AppError {
  constructor(stage, message, storyId = null) {
    super(`Story generation failed at ${stage}: ${message}`, 500, 'STORY_GENERATION_ERROR', {
      stage,
      storyId
    });
    this.name = 'StoryGenerationError';
  }
}

// Error handling middleware for API routes
export function handleApiError(error, request = null) {
  // Track the error
  const errorInfo = ErrorTracker.track(error, {
    url: request?.url,
    method: request?.method,
    userAgent: request?.headers?.get('user-agent')
  });

  // Log based on error type
  if (error instanceof AppError) {
    if (error.code >= 500) {
      logger.error(`${error.type}: ${error.message}`, {
        code: error.code,
        details: error.details,
        stack: error.stack
      });
    } else {
      logger.warn(`${error.type}: ${error.message}`, {
        code: error.code,
        details: error.details
      });
    }
  } else {
    logger.error('Unhandled error', {
      message: error.message,
      stack: error.stack
    });
  }

  // Return appropriate response
  if (error instanceof ValidationError) {
    return json(createErrorResponse({
      message: error.message,
      field: error.details.field,
      value: error.details.value
    }), { status: 400 });
  }

  if (error instanceof AuthenticationError) {
    return json(createErrorResponse("Authentication required"), { status: 401 });
  }

  if (error instanceof AuthorizationError) {
    return json(createErrorResponse("Access denied"), { status: 403 });
  }

  if (error instanceof NotFoundError) {
    return json(createErrorResponse(error.message), { status: 404 });
  }

  if (error instanceof RateLimitError) {
    return json(createErrorResponse("Rate limit exceeded. Please try again later."), { 
      status: 429,
      headers: {
        'Retry-After': '60'
      }
    });
  }

  if (error instanceof ExternalServiceError) {
    return json(createErrorResponse("External service temporarily unavailable"), { status: 502 });
  }

  if (error instanceof StoryGenerationError) {
    return json(createErrorResponse(`Story generation failed: ${error.message}`), { status: 500 });
  }

  if (error instanceof AppError) {
    return json(createErrorResponse(error.message), { status: error.code });
  }

  // Generic error response for unhandled errors
  return json(
    createErrorResponse(
      process.env.NODE_ENV === 'production' 
        ? "Internal server error" 
        : error.message
    ), 
    { status: 500 }
  );
}

// Async error wrapper for route handlers
export function asyncHandler(handler) {
  return async (args) => {
    try {
      return await handler(args);
    } catch (error) {
      return handleApiError(error, args.request);
    }
  };
}

// Validation utilities
export function validateRequired(value, fieldName) {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    throw new ValidationError(`${fieldName} is required`, fieldName, value);
  }
  return value;
}

export function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ValidationError('Invalid email format', 'email', email);
  }
  return email;
}

export function validateEnum(value, allowedValues, fieldName) {
  if (!allowedValues.includes(value)) {
    throw new ValidationError(
      `${fieldName} must be one of: ${allowedValues.join(', ')}`, 
      fieldName, 
      value
    );
  }
  return value;
}

export function validateLength(value, min, max, fieldName) {
  if (value.length < min || value.length > max) {
    throw new ValidationError(
      `${fieldName} must be between ${min} and ${max} characters`, 
      fieldName, 
      value
    );
  }
  return value;
}

// Story-specific validation
export function validateStoryData(data) {
  validateRequired(data.childName, 'childName');
  validateLength(data.childName, 1, 50, 'childName');
  
  validateRequired(data.ageGroup, 'ageGroup');
  validateEnum(data.ageGroup, ['3-5', '6-8', '9-12', 'teen'], 'ageGroup');
  
  validateRequired(data.theme, 'theme');
  
  validateRequired(data.length, 'length');
  validateEnum(data.length, ['short', 'medium', 'long'], 'length');
  
  if (data.characterDescription) {
    validateLength(data.characterDescription, 0, 500, 'characterDescription');
  }
  
  if (data.specialRequests) {
    validateLength(data.specialRequests, 0, 300, 'specialRequests');
  }
  
  return data;
}

// Database error handling
export function handleDatabaseError(error, operation) {
  logger.error(`Database error during ${operation}`, {
    error: error.message,
    code: error.code,
    stack: error.stack
  });

  if (error.code === 'P2002') {
    throw new ValidationError('A record with this information already exists');
  }

  if (error.code === 'P2025') {
    throw new NotFoundError('Record');
  }

  if (error.code === 'P2003') {
    throw new ValidationError('Invalid reference to related record');
  }

  throw new AppError(`Database operation failed: ${operation}`, 500, 'DATABASE_ERROR');
}

// Shopify API error handling
export function handleShopifyApiError(error, operation) {
  logger.error(`Shopify API error during ${operation}`, {
    error: error.message,
    response: error.response?.data,
    status: error.response?.status
  });

  if (error.response?.status === 401) {
    throw new AuthenticationError('Shopify authentication failed');
  }

  if (error.response?.status === 403) {
    throw new AuthorizationError('Insufficient Shopify permissions');
  }

  if (error.response?.status === 429) {
    throw new RateLimitError('Shopify API rate limit exceeded');
  }

  throw new ExternalServiceError('Shopify API', error.message, error);
}