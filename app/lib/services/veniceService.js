/**
 * Venice AI Service for Shopify App
 * Adapted from kakafullstack for Remix architecture
 */

export class VeniceService {
  constructor() {
    this.baseUrl = process.env.VITE_VENICE_API_URL || 'https://api.venice.ai/api/v1';
    this.apiKey = process.env.VITE_VENICE_API_KEY;
  }

  /**
   * Generate text using Venice AI
   */
  async generateText(request) {
    try {
      const response = await fetch('/api/v1/venice/text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Venice text generation failed: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data.text
      };
    } catch (error) {
      console.error('Venice text generation error:', error);
      return {
        success: false,
        error: error.message || 'Text generation failed'
      };
    }
  }

  /**
   * Generate image using Venice AI
   */
  async generateImage(request) {
    try {
      const response = await fetch('/api/v1/venice/image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Venice image generation failed: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data.image_url
      };
    } catch (error) {
      console.error('Venice image generation error:', error);
      return {
        success: false,
        error: error.message || 'Image generation failed'
      };
    }
  }

  /**
   * Edit image using Venice AI
   */
  async editImage(imageUrl, prompt) {
    try {
      const response = await fetch('/api/v1/venice/image/edit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image_url: imageUrl,
          prompt: prompt
        }),
      });

      if (!response.ok) {
        throw new Error(`Venice image editing failed: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data.image_url
      };
    } catch (error) {
      console.error('Venice image editing error:', error);
      return {
        success: false,
        error: error.message || 'Image editing failed'
      };
    }
  }

  /**
   * Check Venice service health
   */
  async checkHealth() {
    try {
      const response = await fetch('/api/v1/venice/health');
      const data = await response.json();
      return {
        success: true,
        data: data.status === 'healthy'
      };
    } catch (error) {
      console.error('Venice health check error:', error);
      return {
        success: false,
        error: error.message || 'Health check failed'
      };
    }
  }
}

export const veniceService = new VeniceService();
export default veniceService;