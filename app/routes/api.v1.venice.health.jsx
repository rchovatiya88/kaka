import { json } from "@remix-run/node";

export const loader = async () => {
  try {
    const VENICE_API_KEY = process.env.VITE_VENICE_API_KEY;
    const VENICE_API_URL = process.env.VITE_VENICE_API_URL || 'https://api.venice.ai/api/v1';

    if (!VENICE_API_KEY) {
      return json({
        status: 'unhealthy',
        error: 'Venice API key not configured',
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }

    console.log("🔍 Checking Venice AI service health...");

    // Test Venice API with a simple request
    const response = await fetch(`${VENICE_API_URL}/models`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${VENICE_API_KEY}`,
      },
      timeout: 10000, // 10 second timeout
    });

    if (!response.ok) {
      console.error("Venice health check failed:", response.status);
      return json({
        status: 'unhealthy',
        error: `Venice API returned ${response.status}: ${response.statusText}`,
        timestamp: new Date().toISOString()
      }, { status: response.status });
    }

    const data = await response.json();
    
    console.log("✅ Venice AI service is healthy");

    return json({
      status: 'healthy',
      available_models: data.data?.map(model => model.id) || [],
      api_url: VENICE_API_URL,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("Venice health check error:", error);
    
    return json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
};