// Job queue system for handling async operations like story generation

import { logger } from "./logger";
import { StoryGenerationError } from "./error-handler";

// Simple in-memory queue implementation
// For production, consider using Redis with Bull Queue or similar
class JobQueue {
  constructor(name, concurrency = 3) {
    this.name = name;
    this.concurrency = concurrency;
    this.jobs = [];
    this.processing = [];
    this.completed = [];
    this.failed = [];
    this.isProcessing = false;
    this.handlers = new Map();
  }

  // Add job handler
  process(jobType, handler) {
    this.handlers.set(jobType, handler);
    return this;
  }

  // Add job to queue
  add(jobType, data, options = {}) {
    const job = {
      id: this.generateJobId(),
      type: jobType,
      data,
      status: 'waiting',
      priority: options.priority || 0,
      attempts: 0,
      maxAttempts: options.maxAttempts || 3,
      delay: options.delay || 0,
      createdAt: new Date(),
      ...options
    };

    this.jobs.push(job);
    this.jobs.sort((a, b) => b.priority - a.priority); // Higher priority first

    logger.info('Job added to queue', {
      queue: this.name,
      jobId: job.id,
      jobType,
      priority: job.priority
    });

    this.startProcessing();
    return job;
  }

  // Start processing jobs
  async startProcessing() {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    
    while (this.jobs.length > 0 && this.processing.length < this.concurrency) {
      const job = this.jobs.shift();
      
      if (job.delay > 0) {
        // Re-queue delayed job
        setTimeout(() => {
          job.delay = 0;
          this.jobs.unshift(job);
          this.startProcessing();
        }, job.delay);
        continue;
      }

      this.processJob(job);
    }
    
    this.isProcessing = false;
  }

  // Process individual job
  async processJob(job) {
    this.processing.push(job);
    job.status = 'processing';
    job.startedAt = new Date();

    logger.info('Job processing started', {
      queue: this.name,
      jobId: job.id,
      jobType: job.type,
      attempt: job.attempts + 1
    });

    try {
      const handler = this.handlers.get(job.type);
      if (!handler) {
        throw new Error(`No handler registered for job type: ${job.type}`);
      }

      const result = await handler(job.data, job);
      
      job.status = 'completed';
      job.result = result;
      job.completedAt = new Date();
      
      this.processing = this.processing.filter(j => j.id !== job.id);
      this.completed.push(job);
      
      logger.info('Job completed successfully', {
        queue: this.name,
        jobId: job.id,
        jobType: job.type,
        duration: job.completedAt - job.startedAt
      });

    } catch (error) {
      job.attempts++;
      job.error = error.message;
      job.errorStack = error.stack;

      logger.error('Job processing failed', {
        queue: this.name,
        jobId: job.id,
        jobType: job.type,
        attempt: job.attempts,
        error: error.message
      });

      if (job.attempts >= job.maxAttempts) {
        job.status = 'failed';
        job.failedAt = new Date();
        
        this.processing = this.processing.filter(j => j.id !== job.id);
        this.failed.push(job);
        
        logger.error('Job failed permanently', {
          queue: this.name,
          jobId: job.id,
          jobType: job.type,
          totalAttempts: job.attempts
        });
      } else {
        // Retry with exponential backoff
        job.delay = Math.pow(2, job.attempts) * 1000; // 2^attempt seconds
        job.status = 'waiting';
        
        this.processing = this.processing.filter(j => j.id !== job.id);
        this.jobs.unshift(job);
        
        logger.info('Job scheduled for retry', {
          queue: this.name,
          jobId: job.id,
          jobType: job.type,
          delay: job.delay,
          nextAttempt: job.attempts + 1
        });
      }
    }

    // Continue processing
    this.startProcessing();
  }

  generateJobId() {
    return `${this.name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get queue statistics
  getStats() {
    return {
      name: this.name,
      waiting: this.jobs.length,
      processing: this.processing.length,
      completed: this.completed.length,
      failed: this.failed.length,
      concurrency: this.concurrency
    };
  }

  // Get job by ID
  getJob(jobId) {
    return [
      ...this.jobs,
      ...this.processing,
      ...this.completed,
      ...this.failed
    ].find(job => job.id === jobId);
  }

  // Clean up old completed/failed jobs
  cleanup(maxAge = 24 * 60 * 60 * 1000) { // 24 hours default
    const cutoff = new Date(Date.now() - maxAge);
    
    const oldCompleted = this.completed.filter(job => job.completedAt < cutoff);
    const oldFailed = this.failed.filter(job => job.failedAt < cutoff);
    
    this.completed = this.completed.filter(job => job.completedAt >= cutoff);
    this.failed = this.failed.filter(job => job.failedAt >= cutoff);
    
    const cleaned = oldCompleted.length + oldFailed.length;
    
    if (cleaned > 0) {
      logger.info('Queue cleanup completed', {
        queue: this.name,
        cleaned,
        completed: oldCompleted.length,
        failed: oldFailed.length
      });
    }
    
    return cleaned;
  }
}

// Create queue instances
export const storyQueue = new JobQueue('story_generation', 2); // Limit to 2 concurrent story generations
export const imageQueue = new JobQueue('image_generation', 3); // 3 concurrent image generations
export const audioQueue = new JobQueue('audio_generation', 2); // 2 concurrent audio generations
export const emailQueue = new JobQueue('email_notifications', 5); // 5 concurrent emails

// Story generation job handler
storyQueue.process('generate_story', async (data, job) => {
  const { storyId } = data;
  
  try {
    // Import here to avoid circular dependencies
    const { generateStoryContent } = await import('../ai/story-generator');
    
    logger.info('Starting story generation', { storyId, jobId: job.id });
    
    const result = await generateStoryContent(storyId);
    
    logger.info('Story generation completed', { storyId, jobId: job.id });
    
    return result;
    
  } catch (error) {
    throw new StoryGenerationError('content_generation', error.message, storyId);
  }
});

// Image generation job handler
imageQueue.process('generate_image', async (data, job) => {
  const { storyId, pageId, prompt } = data;
  
  try {
    const { generateStoryImage } = await import('../ai/image-generator');
    
    logger.info('Starting image generation', { storyId, pageId, jobId: job.id });
    
    const result = await generateStoryImage(prompt, { storyId, pageId });
    
    logger.info('Image generation completed', { storyId, pageId, jobId: job.id });
    
    return result;
    
  } catch (error) {
    throw new StoryGenerationError('image_generation', error.message, storyId);
  }
});

// Audio generation job handler
audioQueue.process('generate_audio', async (data, job) => {
  const { storyId, pageId, text } = data;
  
  try {
    const { generateStoryAudio } = await import('../ai/audio-generator');
    
    logger.info('Starting audio generation', { storyId, pageId, jobId: job.id });
    
    const result = await generateStoryAudio(text, { storyId, pageId });
    
    logger.info('Audio generation completed', { storyId, pageId, jobId: job.id });
    
    return result;
    
  } catch (error) {
    throw new StoryGenerationError('audio_generation', error.message, storyId);
  }
});

// Email notification handler
emailQueue.process('send_email', async (data, job) => {
  const { to, subject, template, data: emailData } = data;
  
  try {
    const { sendEmail } = await import('../notifications/email');
    
    logger.info('Sending email', { to, subject, template, jobId: job.id });
    
    const result = await sendEmail(to, subject, template, emailData);
    
    logger.info('Email sent successfully', { to, subject, jobId: job.id });
    
    return result;
    
  } catch (error) {
    logger.error('Email sending failed', { to, subject, error: error.message });
    throw error;
  }
});

// Utility functions for adding jobs
export function addStoryGenerationJob(storyId, priority = 0) {
  return storyQueue.add('generate_story', { storyId }, { priority });
}

export function addImageGenerationJob(storyId, pageId, prompt, priority = 0) {
  return imageQueue.add('generate_image', { storyId, pageId, prompt }, { priority });
}

export function addAudioGenerationJob(storyId, pageId, text, priority = 0) {
  return audioQueue.add('generate_audio', { storyId, pageId, text }, { priority });
}

export function addEmailJob(to, subject, template, data, priority = 0) {
  return emailQueue.add('send_email', { to, subject, template, data }, { priority });
}

// Queue monitoring and cleanup
setInterval(() => {
  storyQueue.cleanup();
  imageQueue.cleanup();
  audioQueue.cleanup();
  emailQueue.cleanup();
}, 60 * 60 * 1000); // Cleanup every hour

// Export queue stats for monitoring
export function getAllQueueStats() {
  return {
    story: storyQueue.getStats(),
    image: imageQueue.getStats(),
    audio: audioQueue.getStats(),
    email: emailQueue.getStats(),
    timestamp: new Date().toISOString()
  };
}