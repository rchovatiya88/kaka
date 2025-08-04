// Logging infrastructure with different levels and structured logging

export const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

const LOG_LEVEL_NAMES = {
  0: 'ERROR',
  1: 'WARN',
  2: 'INFO',
  3: 'DEBUG'
};

class Logger {
  constructor(context = 'app') {
    this.context = context;
    this.level = process.env.LOG_LEVEL ? 
      LOG_LEVELS[process.env.LOG_LEVEL.toUpperCase()] : 
      LOG_LEVELS.INFO;
  }

  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const logLevel = LOG_LEVEL_NAMES[level];
    
    const logEntry = {
      timestamp,
      level: logLevel,
      context: this.context,
      message,
      ...meta
    };

    return JSON.stringify(logEntry);
  }

  log(level, message, meta = {}) {
    if (level <= this.level) {
      const formatted = this.formatMessage(level, message, meta);
      
      if (level === LOG_LEVELS.ERROR) {
        console.error(formatted);
      } else if (level === LOG_LEVELS.WARN) {
        console.warn(formatted);
      } else {
        console.log(formatted);
      }
    }
  }

  error(message, meta = {}) {
    this.log(LOG_LEVELS.ERROR, message, meta);
  }

  warn(message, meta = {}) {
    this.log(LOG_LEVELS.WARN, message, meta);
  }

  info(message, meta = {}) {
    this.log(LOG_LEVELS.INFO, message, meta);
  }

  debug(message, meta = {}) {
    this.log(LOG_LEVELS.DEBUG, message, meta);
  }

  // Specialized logging methods
  apiRequest(method, url, userId, duration, status) {
    this.info('API Request', {
      type: 'api_request',
      method,
      url,
      userId,
      duration,
      status
    });
  }

  storyGeneration(storyId, stage, duration, status, error = null) {
    const meta = {
      type: 'story_generation',
      storyId,
      stage,
      duration,
      status
    };

    if (error) {
      meta.error = error.message;
      meta.stack = error.stack;
      this.error('Story Generation Failed', meta);
    } else {
      this.info('Story Generation Progress', meta);
    }
  }

  webhook(topic, shop, payload) {
    this.info('Webhook Received', {
      type: 'webhook',
      topic,
      shop,
      payloadSize: JSON.stringify(payload).length
    });
  }

  security(event, userId, details = {}) {
    this.warn('Security Event', {
      type: 'security',
      event,
      userId,
      ...details
    });
  }

  performance(operation, duration, metadata = {}) {
    this.info('Performance Metric', {
      type: 'performance',
      operation,
      duration,
      ...metadata
    });
  }
}

// Create loggers for different contexts
export const createLogger = (context) => new Logger(context);

// Default application logger
export const logger = new Logger('app');

// Specialized loggers
export const apiLogger = new Logger('api');
export const dbLogger = new Logger('database');
export const aiLogger = new Logger('ai');
export const webhookLogger = new Logger('webhook');

// Error tracking utility
export class ErrorTracker {
  static track(error, context = {}) {
    const errorInfo = {
      message: error.message,
      stack: error.stack,
      name: error.name,
      timestamp: new Date().toISOString(),
      ...context
    };

    logger.error('Tracked Error', errorInfo);

    // TODO: Send to external error tracking service (Sentry, Bugsnag, etc.)
    if (process.env.NODE_ENV === 'production') {
      // Send to error tracking service
    }

    return errorInfo;
  }

  static trackApiError(error, request, response) {
    const context = {
      url: request.url,
      method: request.method,
      userAgent: request.headers.get('user-agent'),
      statusCode: response?.status,
      type: 'api_error'
    };

    return this.track(error, context);
  }

  static trackStoryGenerationError(error, storyId, stage) {
    const context = {
      storyId,
      stage,
      type: 'story_generation_error'
    };

    return this.track(error, context);
  }
}

// Request timing middleware
export function createRequestTimer() {
  const start = Date.now();
  
  return {
    end: (operation = 'request') => {
      const duration = Date.now() - start;
      logger.performance(operation, duration);
      return duration;
    }
  };
}

// Database query timing
export function withDbTiming(operation, queryFn) {
  return async (...args) => {
    const timer = createRequestTimer();
    try {
      const result = await queryFn(...args);
      timer.end(`db:${operation}`);
      return result;
    } catch (error) {
      timer.end(`db:${operation}:error`);
      dbLogger.error(`Database operation failed: ${operation}`, {
        error: error.message,
        args: args.length
      });
      throw error;
    }
  };
}